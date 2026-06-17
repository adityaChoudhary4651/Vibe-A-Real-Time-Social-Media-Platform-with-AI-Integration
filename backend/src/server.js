

import dotenv from "dotenv";
dotenv.config(); // Load environment variables first

import express from "express";
import cors from "cors";
import path from "path";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
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

// Trust reverse proxy (Render, Vercel, etc.)
app.set("trust proxy", 1);

// HTTP request logging
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// Security headers with adjustments for cross-origin assets (Cloudinary)
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: false,
  })
);

// Dynamic CORS configuration
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
];
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL.replace(/\/$/, ""));
}

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      const isAllowed =
        allowedOrigins.includes(origin) ||
        origin.endsWith(".vercel.app") ||
        (process.env.FRONTEND_URL &&
          origin.startsWith(process.env.FRONTEND_URL.replace(/\/$/, "")));

      if (isAllowed) {
        callback(null, true);
      } else {
        console.warn(`Blocked by CORS: ${origin}`);
        callback(null, false);
      }
    },
    credentials: true,
  })
);

// Rate limiting configurations
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per window
  message: { message: "Too many requests from this IP, please try again after 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 25, // Limit each IP to 25 attempts per window
  message: { message: "Too many login/signup attempts, please try again after 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply global rate limiting to all api endpoints
app.use("/api", globalLimiter);
app.use("/api/users/login", authLimiter);
app.post("/api/users", authLimiter);

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

// GLOBAL ERROR HANDLER
app.use((err, req, res, next) => {
  console.error("Global Error Handler ❌:", err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    message: err.message || "An unexpected error occurred on the server.",
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
  });
});

import { createServer } from "http";
import { initSocket } from "./socket.js";

const PORT = process.env.PORT || 5000;
const httpServer = createServer(app);

initSocket(httpServer);

httpServer.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
