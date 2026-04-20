import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import { getIO } from "../socket.js";

  // GET MESSAGES
export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    const isParticipant = conversation.participants.some((id) =>
      id.equals(userId)
    );

    if (!isParticipant) {
      return res.status(403).json({ message: "Access denied" });
    }

    const messages = await Message.find({ conversation: conversationId })
      .populate("sender", "username avatar")
      .sort({ createdAt: 1 });

    // Mark unread messages sent TO this user as read
    await Message.updateMany(
      { conversation: conversationId, sender: { $ne: userId }, isRead: false },
      { $set: { isRead: true } }
    );

    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch messages" });
  }
};


 //  SEND MESSAGE

export const sendMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { text } = req.body;
    const userId = req.user._id;

    if (!text?.trim()) {
      return res.status(400).json({ message: "Message cannot be empty" });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    const isParticipant = conversation.participants.some((id) =>
      id.equals(userId)
    );

    if (!isParticipant) {
      return res.status(403).json({ message: "Access denied" });
    }

    const message = await Message.create({
      conversation: conversationId,
      sender: userId,
      text,
    });

    conversation.lastMessage = message._id;
    await conversation.save();

    const populatedMessage = await message.populate(
      "sender",
      "username avatar"
    );

    // Emit via Socket.io
    try {
      const io = getIO();
      io.to(conversationId).emit("receive_message", populatedMessage);
    } catch (err) {
      console.error("Socket error in sendMessage:", err.message);
    }

    res.status(201).json(populatedMessage);
  } catch (err) {
    res.status(500).json({ message: "Failed to send message" });
  }
};


//   MARK MESSAGE AS READ

export const markRead = async (req, res) => {
  try {
    const messageId = req.params.id;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Optional safety: only receiver can mark read
    if (message.sender.equals(userId)) {
      return res.status(403).json({ message: "Not allowed" });
    }

    message.isRead = true;
    await message.save();

    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Failed to mark read" });
  }
};


// GET UNREAD MESSAGE COUNT
export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;

    // Find conversations 
    const conversations = await Conversation.find({ participants: userId });
    const conversationIds = conversations.map((c) => c._id);

    // Count unread 
    const count = await Message.countDocuments({
      conversation: { $in: conversationIds },
      isRead: false,
      sender: { $ne: userId }
    });

    res.status(200).json({ count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to get unread count" });
  }
};
