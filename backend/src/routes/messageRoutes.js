import express from "express";
import {
  getMessages,
  sendMessage,
  markRead,
  getUnreadCount,
} from "../controllers/messageController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { uploadPost, uploadPostToCloudinary } from "../middleware/upload.js";

const router = express.Router();

router.get("/me/unread", authMiddleware, getUnreadCount);
router.get("/:conversationId", authMiddleware, getMessages);

router.post(
  "/:conversationId",
  authMiddleware,
  uploadPost.single("image"),
  async (req, res, next) => {
    try {
      if (req.file) {
        const cloudinaryUrl = await uploadPostToCloudinary(req.file.path);
        req.file.path = cloudinaryUrl;
      }
      next();
    } catch (error) {
      console.error("MESSAGE UPLOAD ERROR ❌", error);
      return res.status(500).json({
        message: "Image upload failed",
      });
    }
  },
  sendMessage
);

router.patch("/:id/read", authMiddleware, markRead);

export default router;
