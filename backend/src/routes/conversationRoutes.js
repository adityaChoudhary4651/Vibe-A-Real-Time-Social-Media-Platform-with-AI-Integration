import express from "express";
import {
  getConversations,
  createConversation,
  muteConversation,
  archiveConversation,
  favoriteConversation,
  deleteConversation,
} from "../controllers/conversationController.js";
import auth from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", auth, getConversations);
router.post("/:userId", auth, createConversation);
router.put("/:id/mute", auth, muteConversation);
router.put("/:id/archive", auth, archiveConversation);
router.put("/:id/favorite", auth, favoriteConversation);
router.delete("/:id", auth, deleteConversation);

export default router;
