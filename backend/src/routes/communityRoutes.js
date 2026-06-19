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
import { uploadPost, uploadPostToCloudinary } from "../middleware/upload.js";

const router = express.Router();

router.post("/", authMiddleware, createCommunity);
router.get("/", authMiddleware, getCommunities);
router.put("/:id/join", authMiddleware, toggleJoinCommunity);
router.get("/:id/messages", authMiddleware, getCommunityMessages);

router.post(
  "/:id/messages",
  authMiddleware,
  uploadPost.single("image"),
  async (req, res, next) => {
    try {
      if (req.file) {
        const cloudinaryUrl = await uploadPostToCloudinary(req.file.path);
        req.file.path = cloudinaryUrl;
      }
      next();
    } catch (error) {
      console.error("COMMUNITY MESSAGE UPLOAD ERROR ❌", error);
      return res.status(500).json({
        message: "Image upload failed",
      });
    }
  },
  sendCommunityMessage
);

router.patch("/:id", authMiddleware, updateCommunity);

export default router;
