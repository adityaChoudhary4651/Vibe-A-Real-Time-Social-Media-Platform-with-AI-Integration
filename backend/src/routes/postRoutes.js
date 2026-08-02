import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";

import {
  createPost,
  getPosts,
  getMyPosts,
  getPostsByUsername,
  getPostById,
  toggleLike,
  deletePost,
  editPost,
  getReels,
  getMyReels,
  getReelsByUsername,
  toggleSave,
  getSavedPosts,
  incrementViews,
  incrementShares,
} from "../controllers/postController.js";

import {
  uploadPost,
  uploadPostToCloudinary,
} from "../middleware/upload.js";

const router = express.Router();

/* =========================
   REELS
========================= */
router.get("/reels", authMiddleware, getReels);
router.get("/me/reels", authMiddleware, getMyReels);
router.get("/user/:username/reels", authMiddleware, getReelsByUsername);

/* =========================
   POSTS (FEED)
========================= */
router.get("/saved", authMiddleware, getSavedPosts);
router.get("/", authMiddleware, getPosts);
router.get("/me", authMiddleware, getMyPosts);
router.get("/user/:username", authMiddleware, getPostsByUsername);

/* =========================
   CREATE POST (FIXED + GUARDED)
========================= */
router.post(
  "/",
  authMiddleware,
  uploadPost.single("image"), // 🔑 MUST match FormData key
  async (req, res, next) => {
    try {
      console.log("REQ.FILE 👉", req.file);

      if (!req.file) {
        return res.status(400).json({
          message: "No image received. FormData key must be 'image'",
        });
      }

      const cloudinaryUrl = await uploadPostToCloudinary(req.file.path);

      // overwrite local temp path with Cloudinary URL
      req.file.path = cloudinaryUrl;

      next();
    } catch (error) {
      console.error("POST UPLOAD ERROR ❌", error);
      return res.status(500).json({
        message: "Image upload failed",
      });
    }
  },
  createPost
);

/* =========================
   INTERACTIONS
========================= */
router.put("/:id/like", authMiddleware, toggleLike);
router.put("/:id/save", authMiddleware, toggleSave);
router.put("/:id/view", authMiddleware, incrementViews);
router.put("/:id/share", authMiddleware, incrementShares);
router.delete("/:id", authMiddleware, deletePost);
router.put("/:postId", authMiddleware, editPost);
router.get("/:id", authMiddleware, getPostById);

export default router;
