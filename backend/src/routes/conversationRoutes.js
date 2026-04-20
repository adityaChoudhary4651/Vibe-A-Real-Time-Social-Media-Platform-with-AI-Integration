import express from "express";
import {
  getConversations,
  createConversation,
} from "../controllers/conversationController.js";
import auth from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", auth, getConversations);
router.post("/:userId", auth, createConversation);

export default router;
