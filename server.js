import express from "express";
import cors from "cors";
import path from "path";
import url, { fileURLToPath } from "url";
import dotenv from "dotenv";
import { ClerkExpressRequireAuth } from "@clerk/clerk-sdk-node";
import { connectDB } from "./config/database.js";
import { imagekitConfig } from "./config/imagekit.js";
import {
  handleCreateChat,
  handleUpdateChat,
  handleDeleteChat,
} from "./controllers/chatController.js";
import Chat from "./models/chat.js";
import UserChats from "./models/userChats.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);
app.use(express.json());

// Routes - Keeping original API endpoints
app.get("/api/upload", (req, res) => {
  const result = imagekitConfig.getAuthenticationParameters();
  res.send(result);
});

app.post("/api/chats", ClerkExpressRequireAuth(), async (req, res) => {
  const userId = req.auth.userId;
  const { text } = req.body;

  try {
    const chatId = await handleCreateChat(userId, text);
    res.status(201).send(chatId);
  } catch (err) {
    console.error("Error creating chat:", err);
    res.status(500).send("Error creating chat!");
  }
});

app.get("/api/userchats", ClerkExpressRequireAuth(), async (req, res) => {
  const userId = req.auth.userId;

  try {
    const userChats = await UserChats.find({ userId });
    res.status(200).send(userChats[0].chats);
  } catch (err) {
    console.error("Error fetching userchats:", err);
    res.status(500).send("Error fetching userchats!");
  }
});

app.get("/api/chats/:id", ClerkExpressRequireAuth(), async (req, res) => {
  const userId = req.auth.userId;

  try {
    const chat = await Chat.findOne({ _id: req.params.id, userId });
    res.status(200).send(chat);
  } catch (err) {
    console.error("Error fetching chat:", err);
    res.status(500).send("Error fetching chat!");
  }
});

app.put("/api/chats/:id", ClerkExpressRequireAuth(), async (req, res) => {
  const userId = req.auth.userId;
  const { question, answer, img } = req.body;

  try {
    const updatedChat = await handleUpdateChat(
      userId,
      req.params.id,
      question,
      answer,
      img
    );
    res.status(200).send(updatedChat);
  } catch (err) {
    console.error("Error updating chat:", err);
    res.status(500).send("Error adding conversation!");
  }
});

app.delete("/api/chats/:id", ClerkExpressRequireAuth(), async (req, res) => {
  const userId = req.auth.userId;
  const chatId = req.params.id;

  try {
    await handleDeleteChat(userId, chatId);
    res.status(200).send("Chat deleted successfully!");
  } catch (err) {
    console.error("Error deleting chat:", err);
    res.status(500).send("Error deleting chat!");
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(401).send("Unauthenticated!");
});

// Production setup
app.use(express.static(path.join(__dirname, "../client/dist")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/dist", "index.html"));
});

// Start server
app.listen(port, () => {
  connectDB();
  console.log(`Server running on port ${port}`);
});
