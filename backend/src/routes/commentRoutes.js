import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  addComment,
  getComments,
  deleteComment,
  toggleCommentLike,
  addStoryComment,
  getStoryComments,
  replyToComment,
  getReplies,
} from "../controllers/commentController.js";

const router = express.Router();

router.post("/:postId", protect, addComment);
router.get("/:postId", protect, getComments);
router.delete("/:commentId", protect, deleteComment);
router.patch("/like/:commentId", protect, toggleCommentLike);

// Story Comments & Threaded Replies
router.post("/story/:storyId", protect, addStoryComment);
router.get("/story/:storyId", protect, getStoryComments);
router.post("/reply/:commentId", protect, replyToComment);
router.get("/replies/:commentId", protect, getReplies);

export default router;
