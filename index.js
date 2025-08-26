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

// Conditionally connect to Redis
let redis;
let redisOptions;
let isRedisEnabled = false;

if (process.env.REDIS_HOST && process.env.REDIS_PORT && process.env.REDIS_USER && process.env.REDIS_PASS) {
  isRedisEnabled = true;

  redisOptions = {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT, 10),
    username: process.env.REDIS_USER,
    password: process.env.REDIS_PASS,
    // Add a connection timeout to prevent long hangs if Redis is down
    connectTimeout: 10000,
  };

  redis = new Redis(redisOptions);

  redis.on('error', err => {
    console.error('A Redis error occurred, disabling Redis features for safety.', err);
    isRedisEnabled = false; // Gracefully degrade to in-memory provider
  });

  console.log("Redis is enabled.");
} else {
  console.log("Redis is not configured, falling back to in-memory provider.");
}

// In-memory store for SSE clients, used as a fallback
const clients = new Map();

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

  if (isRedisEnabled) {
    try {
      const cachedMessages = await redis.get(cacheKey);
      if (cachedMessages) {
        return res.json({ data: JSON.parse(cachedMessages) });
      }
    } catch (err) {
      console.error(`Redis cache read error for key ${cacheKey}:`, err);
      // Don't fail the request, just proceed to DB
    }
  }

  try {
    // If not in cache or Redis is disabled, fetch from DB
    const messages = await withRetry(() => prisma.users.findMany({
      where: { region },
      orderBy: { createdAt: "asc" },
    }));

    // If Redis is enabled, store in cache
    if (isRedisEnabled) {
      try {
        // Store in cache with a 60-second expiration
        await redis.set(cacheKey, JSON.stringify(messages), "EX", 60);
      } catch (err) {
        console.error(`Redis cache write error for key ${cacheKey}:`, err);
      }
    }

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

  if (isRedisEnabled) {
    try {
      const cachedUsers = await redis.get(cacheKey);
      if (cachedUsers) {
        return res.json({ data: JSON.parse(cachedUsers) });
      }
    } catch (err) {
      console.error(`Redis cache read error for key ${cacheKey}:`, err);
      // Don't fail the request, just proceed to DB
    }
  }

  try {
    // If not in cache or Redis is disabled, fetch from DB
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

    // If Redis is enabled, store in cache
    if (isRedisEnabled) {
      try {
        // Store in cache with a 60-second expiration
        await redis.set(cacheKey, JSON.stringify(users), "EX", 60);
      } catch (err) {
        console.error(`Redis cache write error for key ${cacheKey}:`, err);
      }
    }

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

  // Set headers for SSE
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  // Welcome message
  res.write("data: Connected\n\n");

  if (isRedisEnabled) {
    // USE REDIS PUB/SUB
    const channel = `chat:${region}`;
    const subscriber = new Redis(redisOptions);

    subscriber.subscribe(channel, (err) => {
      if (err) {
        console.error(`Failed to subscribe to ${channel}`, err);
        return res.status(500).end();
      }
    });

    subscriber.on("message", (ch, message) => {
      if (ch === channel) {
        res.write(`data: ${message}\n\n`);
      }
    });

    req.on("close", () => {
      subscriber.unsubscribe(channel);
      subscriber.quit();
    });

  } else {
    // USE IN-MEMORY FALLBACK
    if (!clients.has(region)) {
      clients.set(region, []);
    }
    const regionClients = clients.get(region);
    regionClients.push(res);

    req.on("close", () => {
      const index = regionClients.indexOf(res);
      if (index !== -1) {
        regionClients.splice(index, 1);
      }
      if (regionClients.length === 0) {
        clients.delete(region);
      }
    });
  }
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

    if (isRedisEnabled) {
      // Invalidate cache and publish message to Redis
      const cacheKeys = [`messages:${region}`, `users:${region}`];
      const channel = `chat:${region}`;

      // Fire-and-forget cache invalidation and publish, with error logging
      redis.del(cacheKeys).catch(err => console.error("Redis cache invalidation error:", err));
      redis.publish(channel, JSON.stringify(newMessage)).catch(err => console.error("Redis publish error:", err));

    } else {
      // In-memory fallback: Send event to all clients in the region
      if (clients.has(region)) {
        const regionClients = clients.get(region);
        const sseMessage = `data: ${JSON.stringify(newMessage)}\n\n`;
        regionClients.forEach(client => client.write(sseMessage));
      }
    }

    res.status(201).json({ status: "success", data: newMessage });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to send message" });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
