import mongoose from "mongoose";
import Conversation from "../models/Conversation.js";

// GET CONVERSATIONS
export const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;

    const conversations = await Conversation.find({
      participants: userId,
      deletedBy: { $ne: userId }
    })
      .populate("participants", "username avatar")
      .populate("lastMessage")
      .sort({ updatedAt: -1 });

    res.status(200).json(conversations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch conversations" });
  }
};

// CREATE / GET CONVERSATION
export const createConversation = async (req, res) => {
  try {
    const userId = req.user._id;
    const otherUserId = new mongoose.Types.ObjectId(req.params.userId);

    if (userId.equals(otherUserId)) {
      return res.status(400).json({ message: "Cannot chat with yourself" });
    }

    const participants = [userId, otherUserId];

    let conversation = await Conversation.findOne({
      participants: { $size: 2, $all: participants },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants,
      });
    } else {
      // If the conversation was previously soft-deleted, clear the delete flag upon recreations/reselections
      if (conversation.deletedBy.includes(userId)) {
        conversation.deletedBy.pull(userId);
        await conversation.save();
      }
    }

    conversation = await conversation.populate(
      "participants",
      "username avatar"
    );

    res.status(200).json(conversation);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create conversation" });
  }
};

// MUTE CONVERSATION
export const muteConversation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const conversation = await Conversation.findById(id);

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    const isMuted = conversation.mutedBy.includes(userId);
    if (isMuted) {
      conversation.mutedBy.pull(userId);
    } else {
      conversation.mutedBy.push(userId);
    }
    await conversation.save();

    res.json({ success: true, isMuted: !isMuted });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ARCHIVE CONVERSATION
export const archiveConversation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const conversation = await Conversation.findById(id);

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    const isArchived = conversation.archivedBy.includes(userId);
    if (isArchived) {
      conversation.archivedBy.pull(userId);
    } else {
      conversation.archivedBy.push(userId);
    }
    await conversation.save();

    res.json({ success: true, isArchived: !isArchived });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// FAVORITE CONVERSATION
export const favoriteConversation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const conversation = await Conversation.findById(id);

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    const isFavorite = conversation.favorites.includes(userId);
    if (isFavorite) {
      conversation.favorites.pull(userId);
    } else {
      conversation.favorites.push(userId);
    }
    await conversation.save();

    res.json({ success: true, isFavorite: !isFavorite });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE CONVERSATION (SOFT DELETE)
export const deleteConversation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const conversation = await Conversation.findById(id);

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    if (!conversation.deletedBy.includes(userId)) {
      conversation.deletedBy.push(userId);
      await conversation.save();
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
