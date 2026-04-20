import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  addComment,
  getComments,
  deleteComment,
  toggleCommentLike,
} from "../controllers/commentController.js";

const router = express.Router();

router.post("/:postId", protect, addComment);
router.get("/:postId", protect, getComments);
router.delete("/:commentId", protect, deleteComment);
router.patch("/like/:commentId", protect, toggleCommentLike);

export default router;
