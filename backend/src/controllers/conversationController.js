import mongoose from "mongoose";
import Conversation from "../models/Conversation.js";


// GET CONVERSATIONS
export const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;

    const conversations = await Conversation.find({
      participants: userId, // ObjectId match
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

    // ALWAYS ObjectIds
    const participants = [userId, otherUserId];

    // STRICT 1-to-1 lookup
    let conversation = await Conversation.findOne({
      participants: { $size: 2, $all: participants },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants,
      });
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
