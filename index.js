import express from "express";
import { PrismaClient } from "@prisma/client";
import rateLimit from "express-rate-limit";
import cors from "cors";
import helmet from "helmet";
import xss from "xss-clean";

const app = express();
const prisma = new PrismaClient();

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
app.use(xss());
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
    const data = await prisma.users.create({
      data: { uid, name, region, messages },
    });
    res.json({ status: "success", data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to send message" });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
