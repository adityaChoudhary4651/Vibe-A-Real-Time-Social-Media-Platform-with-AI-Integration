import Community from "../models/Community.js";
import CommunityMessage from "../models/CommunityMessage.js";
import { getIO } from "../socket.js";

// CREATE COMMUNITY
export const createCommunity = async (req, res) => {
  try {
    const { name, description, avatar, category } = req.body;
    const creatorId = req.user._id;

    const existing = await Community.findOne({ name });
    if (existing) {
      return res.status(400).json({ message: "Community name already taken" });
    }

    const community = await Community.create({
      name,
      description,
      avatar,
      category,
      creator: creatorId,
      members: [creatorId], // Creator is the first member
    });

    res.status(201).json(community);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET COMMUNITIES (SEARCH/LIST)
export const getCommunities = async (req, res) => {
  try {
    const { q } = req.query;
    let query = {};
    
    if (q) {
      query = { $text: { $search: q } };
    }

    const communities = await Community.find(query)
      .populate("creator", "username avatar")
      .sort({ createdAt: -1 });

    res.json(communities);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch communities" });
  }
};

// JOIN/LEAVE COMMUNITY
export const toggleJoinCommunity = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const community = await Community.findById(id);
    if (!community) {
      return res.status(404).json({ message: "Community not found" });
    }

    const isMember = community.members.some(m => m.toString() === userId.toString());

    if (isMember) {
      community.members.pull(userId);
    } else {
      community.members.push(userId);
    }

    await community.save();
    res.json({ isJoined: !isMember, memberCount: community.members.length });
  } catch (error) {
    res.status(500).json({ message: "Failed to toggle membership" });
  }
};

// GET MESSAGES
export const getCommunityMessages = async (req, res) => {
  try {
    const { id } = req.params;
    const messages = await CommunityMessage.find({ community: id })
      .populate("sender", "username avatar")
      .sort({ createdAt: 1 })
      .limit(100);

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch messages" });
  }
};

// SEND MESSAGE
export const sendCommunityMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const senderId = req.user._id;

    const community = await Community.findById(id);
    const isMember = community.members.some(m => m.toString() === senderId.toString());
    if (!community || !isMember) {
      return res.status(403).json({ message: "Not a member of this community" });
    }

    const message = await CommunityMessage.create({
      community: id,
      sender: senderId,
      text,
    });

    const populated = await message.populate("sender", "username avatar");

    // Emit via Socket.io
    try {
      const io = getIO();
      io.to(id).emit("receive_community_message", populated);
    } catch (err) {
      console.error("Socket error in sendCommunityMessage:", err.message);
    }

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: "Failed to send message" });
  }
};

// UPDATE COMMUNITY
export const updateCommunity = async (req, res) => {
  try {
    const { id } = req.params;
    const { description, avatar } = req.body;
    const userId = req.user._id;

    const community = await Community.findById(id);
    if (!community) {
      return res.status(404).json({ message: "Community not found" });
    }

    // Only creator can update
    if (community.creator.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Only the creator can update community settings" });
    }

    if (description !== undefined) community.description = description;
    if (avatar !== undefined) community.avatar = avatar;

    await community.save();
    res.json(community);
  } catch (error) {
    res.status(500).json({ message: "Failed to update community" });
  }
};
