import express from "express";
import { PrismaClient } from "@prisma/client";
import rateLimit from "express-rate-limit";
import cors from "cors";
import helmet from "helmet";

const app = express();
const prisma = new PrismaClient();

app.use(express.json());

// Security middlewares
app.use(helmet()); // secure headers
app.use(cors({
//  origin: ["https://wplace.live"],
  methods: ["GET", "POST"]
}));


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
    !uid || typeof uid !== "string" ||
    !name || typeof name !== "string" ||
    !region || typeof region !== "string" ||
    !messages || typeof messages !== "string"
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
