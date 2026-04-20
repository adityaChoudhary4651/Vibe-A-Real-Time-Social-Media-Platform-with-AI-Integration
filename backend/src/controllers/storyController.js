import Story from "../models/story.js";
import { uploadStoryToCloudinary } from "../middleware/upload.js";
/* Upload Story */
export const createStory = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No media uploaded" });
    }

    const mediaType = req.file.mimetype.startsWith("video/")
      ? "video"
      : "image";

    const mediaUrl = await uploadStoryToCloudinary(
      req.file.path
    );

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const story = await Story.create({
      user: req.user._id,
      mediaUrl,      //FULL HTTPS
      mediaType,
      expiresAt,
    });

    res.status(201).json(story);
  } catch (err) {
    console.error("CREATE STORY ERROR ❌", err);
    res.status(500).json({ message: "Story upload failed" });
  }
};

/* Get Active Stories */
export const getStories = async (req, res) => {
  try {
    const stories = await Story.find({
      expiresAt: { $gt: new Date() },
    })
      .populate("user", "username avatar")
      .sort({ createdAt: -1 });

    // group by user
    const grouped = {};

    stories.forEach((story) => {
      const userId = story.user._id.toString();
      if (!grouped[userId]) {
        grouped[userId] = {
          user: story.user,
          stories: [],
        };
      }
      grouped[userId].stories.push(story);
    });

    res.json(Object.values(grouped));
  } catch {
    res.status(500).json({ message: "Failed to fetch stories" });
  }
};
/* Delete Story */
export const deleteStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);

    if (!story) {
      return res.status(404).json({ message: "Story not found" });
    }

    // only owner can delete
    if (story.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await story.deleteOne();
    res.json({ message: "Story deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
