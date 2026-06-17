import express from "express";
import {
  createHighlight,
  getUserHighlights,
  deleteHighlight,
} from "../controllers/highlightController.js";
import auth from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", auth, createHighlight);
router.get("/user/:username", auth, getUserHighlights);
router.delete("/:id", auth, deleteHighlight);

export default router;
