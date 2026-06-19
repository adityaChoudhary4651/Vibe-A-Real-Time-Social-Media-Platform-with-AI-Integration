import express from "express";
import { createStory, getStories, deleteStory, viewStory } from "../controllers/storyController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { uploadStory } from "../middleware/upload.js";

const router = express.Router();

router.post(
  "/",
  authMiddleware,
  uploadStory.single("media"),
  createStory
);

router.get("/", authMiddleware, getStories);
router.delete("/:id", authMiddleware, deleteStory);
router.put("/:id/view", authMiddleware, viewStory);

export default router;
