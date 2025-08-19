import express from "express";
import { PrismaClient } from "@prisma/client";
import rateLimit from "express-rate-limit";

const app = express();
const prisma = new PrismaClient();

app.use(express.json());

// Rate limiter for POST /send
const sendLimiter = rateLimit({
  windowMs: 30 * 1000,
  max: 5,
  message: { error: "Too many request." }
});

// GET /users/:region - get all users in a region as flat array
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
    res.status(500).json({ error: "Failed to fetch users", details: err.message });
  }
});



// GET /users without region - return error
app.get("/users", (req, res) => {
  res.status(401).json({ error: "unauthorized" });
});

// POST /send - send message (rate-limited)
app.post("/send", sendLimiter, async (req, res) => {
  const { uid, name, region, messages } = req.body;
  if (!uid || !name || !region || !messages) {
    return res.status(401).json({ error: "unauthorized" });
  }

  try {
    const data = await prisma.users.create({
      data: { uid, name, region, messages },
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to send message", details: err.message });
  }
});

// start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
