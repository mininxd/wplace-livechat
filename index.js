import "dotenv/config";
import express from "express";
import { PrismaClient } from "@prisma/client";
import Redis from "ioredis";
import rateLimit from "express-rate-limit";
import cors from "cors";
import helmet from "helmet";
// import xss from "xss-clean";

const app = express();
const prisma = new PrismaClient();

// Connect to Redis
if (!process.env.REDIS_URL) {
  throw new Error("REDIS_URL is not defined in the environment variables");
}
const redis = new Redis(process.env.REDIS_URL);

// Helper function to sleep for a given number of milliseconds
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// A wrapper to retry Prisma queries on connection errors
async function withRetry(query, maxRetries = 3, delay = 1000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await query();
    } catch (err) {
      // Check if the error is a known "can't connect" error
      if (err.code === 'P1001') {
        console.log(`Database connection failed. Retrying in ${delay / 1000}s... (Attempt ${i + 1}/${maxRetries})`);
        if (i < maxRetries - 1) {
          await sleep(delay);
        } else {
          // If this was the last retry, re-throw the error
          throw err;
        }
      } else {
        // If it's not a connection error, don't retry, just throw
        throw err;
      }
    }
  }
}

app.use(express.json());

// Security middlewares
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
      fontSrc: ["'self'"],
      imgSrc: ["'self'"],
      connectSrc: ["'self'", "https://wplace.live"],
    },
  },
}));
// app.use(xss());
app.use(cors({
  origin: ["https://wplace.live"],
  methods: ["GET", "POST"]
}));

// Global rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true, // return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // disable the `X-RateLimit-*` headers
});
app.use(limiter);


// Rate limiter for POST /send
const sendLimiter = rateLimit({
  windowMs: 30 * 1000, // 30 seconds
  max: 5,
  message: { error: "Too many requests. Try again later." }
});

app.get("/", async (req, res) => {
  res.json({ status: 200 });
});

// GET /messages/:region - for fetching initial chat history
app.get("/messages/:region", async (req, res) => {
  const { region } = req.params;
  const cacheKey = `messages:${region}`;

  try {
    // Check cache first
    const cachedMessages = await redis.get(cacheKey);
    if (cachedMessages) {
      return res.json({ data: JSON.parse(cachedMessages) });
    }

    // If not in cache, fetch from DB
    const messages = await withRetry(() => prisma.users.findMany({
      where: { region },
      orderBy: { createdAt: "asc" },
    }));

    // Store in cache with a 60-second expiration
    await redis.set(cacheKey, JSON.stringify(messages), "EX", 60);

    res.json({ data: messages });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// GET /users/:region
app.get("/users/:region", async (req, res) => {
  const { region } = req.params;
  const cacheKey = `users:${region}`;

  try {
    // Check cache first
    const cachedUsers = await redis.get(cacheKey);
    if (cachedUsers) {
      return res.json({ data: JSON.parse(cachedUsers) });
    }

    // If not in cache, fetch from DB
    const users = await withRetry(() => prisma.users.findMany({
      where: { region },
      orderBy: { createdAt: "asc" },
      select: {
        uid: true,
        name: true,
        messages: true,
        createdAt: true,
      },
    }));

    // Store in cache with a 60-second expiration
    await redis.set(cacheKey, JSON.stringify(users), "EX", 60);

    res.json({ data: users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch users" }); // no detailed DB errors
  }
});

// GET /users without region
app.get("/users", (req, res) => {
  res.status(401).json({ error: "unauthorized" });
});

// SSE endpoint to stream messages
app.get("/events/:region", (req, res) => {
  const { region } = req.params;
  const channel = `chat:${region}`;

  // Create a new subscriber client for this connection.
  // Note: This creates a new Redis connection for each client.
  // For very large scale, a shared subscriber with a client mapping might be better,
  // but this approach is simpler and robust for multi-instance deployments.
  const subscriber = new Redis(process.env.REDIS_URL);

  // Set headers for SSE
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  subscriber.subscribe(channel, (err) => {
    if (err) {
      console.error(`Failed to subscribe to ${channel}`, err);
      return res.status(500).end();
    }
    // Welcome message
    res.write("data: Connected\n\n");
  });

  subscriber.on("message", (ch, message) => {
    if (ch === channel) {
      res.write(`data: ${message}\n\n`);
    }
  });

  // Handle client disconnection
  req.on("close", () => {
    subscriber.unsubscribe(channel);
    subscriber.quit();
  });
});

// POST /send - rate-limited + input validation
app.post("/send", sendLimiter, async (req, res) => {
  const { uid, name, region, messages } = req.body;

  if (
    !uid || typeof uid !== "string" || uid.trim() === "" ||
    !name || typeof name !== "string" || name.trim() === "" ||
    !region || typeof region !== "string" || region.trim() === "" ||
    !messages || typeof messages !== "string" || messages.trim() === ""
  ) {
    return res.status(400).json({ error: "Invalid input" });
  }

  try {
    const dataToCreate = { uid, name, region, messages };
    
    const newMessage = await withRetry(() => prisma.users.create({
      data: dataToCreate,
    }));

    // Invalidate cache
    const cacheKeys = [`messages:${region}`, `users:${region}`];
    await redis.del(cacheKeys);

    // Publish message to Redis
    const channel = `chat:${region}`;
    await redis.publish(channel, JSON.stringify(newMessage));

    res.status(201).json({ status: "success", data: newMessage });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to send message" });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
