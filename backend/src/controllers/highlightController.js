import Highlight from "../models/Highlight.js";
import User from "../models/User.js";

// CREATE HIGHLIGHT
export const createHighlight = async (req, res) => {
  try {
    const { name, storyIds } = req.body;
    const userId = req.user._id;

    if (!name?.trim() || !Array.isArray(storyIds) || storyIds.length === 0) {
      return res.status(400).json({ message: "Name and at least one story are required" });
    }

    const highlight = await Highlight.create({
      user: userId,
      name: name.trim(),
      stories: storyIds,
    });

    const populated = await highlight.populate("stories");
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: "Failed to create highlight" });
  }
};

// GET USER'S HIGHLIGHTS
export const getUserHighlights = async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const highlights = await Highlight.find({ user: user._id })
      .populate("stories")
      .sort({ createdAt: -1 });

    res.json(highlights);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch highlights" });
  }
};

// DELETE HIGHLIGHT
export const deleteHighlight = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const highlight = await Highlight.findById(id);
    if (!highlight) {
      return res.status(404).json({ message: "Highlight not found" });
    }

    if (!highlight.user.equals(userId)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await highlight.deleteOne();
    res.json({ message: "Highlight deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete highlight" });
  }
};
