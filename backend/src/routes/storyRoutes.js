import express from "express";
import { createStory, getStories, deleteStory } from "../controllers/storyController.js";
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

export default router;
