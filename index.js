import "dotenv/config";
import express from "express";
import { PrismaClient } from "@prisma/client";
import rateLimit from "express-rate-limit";
import cors from "cors";
import helmet from "helmet";
// import xss from "xss-clean";

const app = express();
const prisma = new PrismaClient();

// In-memory store for connected SSE clients, keyed by region
const clients = new Map();

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

  try {
    const messages = await prisma.users.findMany({
      where: { region },
      orderBy: { createdAt: "asc" },
    });
    res.json({ data: messages });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// GET /users/:region
app.get("/users/:region", async (req, res) => {
  const { region } = req.params;

  try {
    const users = await prisma.users.findMany({
      where: { region },
      orderBy: { createdAt: "asc" },
      select: {
        uid: true,
        name: true,
        messages: true,
        createdAt: true,
      },
    });

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

  // Add client to the map
  if (!clients.has(region)) {
    clients.set(region, []);
  }
  const regionClients = clients.get(region);
  regionClients.push(res);

  // Welcome message
  res.write("data: Connected\n\n");

  // Handle client disconnection
  req.on("close", () => {
    const index = regionClients.indexOf(res);
    if (index !== -1) {
      regionClients.splice(index, 1);
    }
    if (regionClients.length === 0) {
      clients.delete(region);
    }
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
    const newMessage = await prisma.users.create({
      data: { uid, name, region, messages },
    });

    // Send event to all clients in the region
    if (clients.has(region)) {
      const regionClients = clients.get(region);
      const sseMessage = `data: ${JSON.stringify(newMessage)}\n\n`;
      regionClients.forEach(client => client.write(sseMessage));
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
