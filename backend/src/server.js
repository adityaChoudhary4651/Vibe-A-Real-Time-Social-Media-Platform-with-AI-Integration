

import express from "express";
import cors from "cors";
import path from "path";
import connectDB from "./config/db.js";

import userRoutes from "./routes/userRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import commentRoutes from "./routes/commentRoutes.js";
import storyRoutes from "./routes/storyRoutes.js";
import reelRoutes from "./routes/reelRoutes.js";
import searchRoutes from "./routes/searchRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import conversationRoutes from "./routes/conversationRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import communityRoutes from "./routes/communityRoutes.js";
import vibeAIRoutes from "./routes/vibeAIRoutes.js";
import highlightRoutes from "./routes/highlightRoutes.js";
import tipRoutes from "./routes/tipRoutes.js";







console.log("SERVER.JS LOADED ✅");

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));




connectDB();

app.get("/", (req, res) => {
  res.send("Backend + MongoDB connected 🚀");
});

// ROUTES
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/stories", storyRoutes);
app.use("/api/reels", reelRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/communities", communityRoutes);
app.use("/api/vibe-ai", vibeAIRoutes);
app.use("/api/highlights", highlightRoutes);
app.use("/api/tips", tipRoutes);



import { createServer } from "http";
import { initSocket } from "./socket.js";

const PORT = process.env.PORT || 5000;
const httpServer = createServer(app);

initSocket(httpServer);

httpServer.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
