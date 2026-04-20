import express from "express";
import {
  getMessages,
  sendMessage,
  markRead,
  getUnreadCount,
} from "../controllers/messageController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/me/unread", authMiddleware, getUnreadCount);
router.get("/:conversationId", authMiddleware, getMessages);
router.post("/:conversationId", authMiddleware, sendMessage);
router.patch("/:id/read", authMiddleware, markRead);

export default router;
