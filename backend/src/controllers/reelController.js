import Post from "../models/Post.js";
import { uploadReelToCloudinary } from "../middleware/upload.js";

// CREATE REEL
export const createReel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No video uploaded" });
    }

    const videoUrl = await uploadReelToCloudinary(req.file.path);

    const reel = await Post.create({
      author: req.user._id,
      caption: req.body.caption,
      mediaUrl: videoUrl,   //full https
      mediaType: "video",
      type: "reel",
      category: req.body.category || "General",
      visibility: "Public",
    });

    res.status(201).json(reel);
  } catch (err) {
    console.error("CREATE REEL ERROR ❌", err);
    res.status(500).json({ message: "Reel upload failed" });
  }
};

// GET REELS
export const getReels = async (req, res) => {
  try {
    const filter = {
      type: "reel",
      visibility: "Public",
    };

    if (req.query.category && req.query.category !== "All") {
      filter.category = req.query.category;
    }

    const reels = await Post.find(filter)
      .populate("author", "username avatar")
      .sort({ createdAt: -1 });

    res.json(reels);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch reels" });
  }
};
