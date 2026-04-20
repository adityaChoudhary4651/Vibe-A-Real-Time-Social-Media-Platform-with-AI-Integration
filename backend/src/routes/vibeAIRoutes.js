import express from "express";
import { vibeAIGenerate } from "../controllers/vibeAIController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, vibeAIGenerate);

export default router;
