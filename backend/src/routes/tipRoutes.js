import express from "express";
import { sendTip } from "../controllers/tipController.js";
import auth from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/:username", auth, sendTip);

export default router;
