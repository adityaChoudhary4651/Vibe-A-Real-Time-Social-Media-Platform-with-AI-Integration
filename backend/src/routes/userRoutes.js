import express from "express";
import {
  createUser,
  loginUser,
  getUsers,
  getProfile,
  updateProfile,
  toggleFollow,
  getPublicProfile,
  getDiscoveryUsers,
  getFollowers,
  getFollowing,
  uploadAvatar,
  uploadCover,
  forgotPassword,
  resetPassword,
} from "../controllers/userController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { uploadPost, uploadPostToCloudinary, avatarUpload } from "../middleware/upload.js";

const router = express.Router();

/* AUTH */
router.post("/", createUser);
router.post("/login", loginUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

/* 🔒 LOGGED-IN USER */
router.get("/profile", authMiddleware, getProfile);
router.put("/profile", authMiddleware, updateProfile);

router.put(
  "/me/avatar",
  authMiddleware,
  avatarUpload.single("avatar"),
  async (req, res, next) => {
    try {
      if (!req.file) return res.status(400).json({ message: "No image received" });
      const url = await uploadPostToCloudinary(req.file.path);
      req.file.path = url;
      next();
    } catch (error) {
      console.error("AVATAR UPLOAD ERROR ❌", error);
      res.status(500).json({ message: "Image upload failed" });
    }
  },
  uploadAvatar
);

router.put(
  "/me/cover",
  authMiddleware,
  avatarUpload.single("cover"),
  async (req, res, next) => {
    try {
      if (!req.file) return res.status(400).json({ message: "No image received" });
      const url = await uploadPostToCloudinary(req.file.path);
      req.file.path = url;
      next();
    } catch (error) {
      console.error("COVER UPLOAD ERROR ❌", error);
      res.status(500).json({ message: "Image upload failed" });
    }
  },
  uploadCover
);

router.get("/discovery", authMiddleware, getDiscoveryUsers);

/* 👤 PUBLIC USER ROUTES — ORDER MATTERS */
router.get("/:username/followers", authMiddleware, getFollowers);
router.get("/:username/following", authMiddleware, getFollowing);
router.put("/:username/follow", authMiddleware, toggleFollow);
router.get("/:username", authMiddleware, getPublicProfile); // ⬅️ MUST BE LAST

// 🚫 AVATAR UPLOAD DISABLED DURING STORIES PHASE

export default router;
