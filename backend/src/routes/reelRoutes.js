import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { uploadReel } from "../middleware/upload.js";
import { createReel } from "../controllers/reelController.js";
import { getReels } from "../controllers/postController.js";

const router = express.Router();

router.post(
  "/",
  authMiddleware,
  uploadReel.single("media"), // 🔒 MUST BE "media"
  createReel
);

router.get("/", authMiddleware, getReels);

export default router;
