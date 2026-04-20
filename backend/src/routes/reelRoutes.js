import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { uploadReel } from "../middleware/upload.js";
import { createReel, getReels } from "../controllers/reelController.js";

const router = express.Router();

router.post(
  "/",
  authMiddleware,
  uploadReel.single("media"), // 🔒 MUST BE "media"
  createReel
);

router.get("/", authMiddleware, getReels);

export default router;
