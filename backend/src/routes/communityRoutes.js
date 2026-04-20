import express from "express";
import {
  createCommunity,
  getCommunities,
  toggleJoinCommunity,
  getCommunityMessages,
  sendCommunityMessage,
  updateCommunity,
} from "../controllers/communityController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, createCommunity);
router.get("/", authMiddleware, getCommunities);
router.put("/:id/join", authMiddleware, toggleJoinCommunity);
router.get("/:id/messages", authMiddleware, getCommunityMessages);
router.post("/:id/messages", authMiddleware, sendCommunityMessage);
router.patch("/:id", authMiddleware, updateCommunity);

export default router;
