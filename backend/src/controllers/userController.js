import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Notification from "../models/notification.js";
import { getIO } from "../socket.js";

// REGISTER
export const createUser = async (req, res) => {
  try {
    const { name, username, email, password } = req.body;

    // validate
    if (!name || !username || !email || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    // check existing email
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // check existing username
    const usernameExists = await User.findOne({ username });
    if (usernameExists) {
      return res.status(400).json({ message: "Username already taken" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      username,
      email,
      password: hashedPassword,
    });

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      _id: user._id,
      username: user.username,
      name: user.name,
      email: user.email,
      token,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// LOGIN
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      _id: user._id,
      username: user.username,
      name: user.name,
      email: user.email,
      token,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET ALL USERS
export const getUsers = async (req, res) => {
  const users = await User.find().select("-password");
  res.json(users);
};

// GET MY PROFILE
export const getProfile = async (req, res) => {
  const user = req.user;

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  res.json({
    _id: user._id,
    username: user.username,
    name: user.name,
    bio: user.bio || "",
    avatar: user.avatar || "",
    gender: user.gender || "Non-binary",
    age: user.age || 21,
    location: user.location || "Nearby",
    interests: user.interests || ["Vibe"],
    tipsReceived: user.tipsReceived || 0,
    followers: user.followers.length,
    following: user.following.length,
  });
};

// UPDATE PROFILE
export const updateProfile = async (req, res) => {
  try {
    const user = req.user;
    const { name, bio, gender, age, location, interests } = req.body;

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (typeof name === "string") {
      user.name = name;
    }
    if (typeof bio === "string") {
      user.bio = bio;
    }
    if (typeof gender === "string") {
      user.gender = gender;
    }
    if (typeof age === "number" || (typeof age === "string" && !isNaN(Number(age)))) {
      user.age = Number(age);
    }
    if (typeof location === "string") {
      user.location = location;
    }
    if (Array.isArray(interests)) {
      user.interests = interests;
    }

    await user.save();

    res.json({
      _id: user._id,
      username: user.username,
      name: user.name,
      bio: user.bio,
      avatar: user.avatar,
      gender: user.gender,
      age: user.age,
      location: user.location,
      interests: user.interests,
      tipsReceived: user.tipsReceived,
      followers: user.followers.length,
      following: user.following.length,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to update profile" });
  }
};

//TOGGLE FOLLOW
export const toggleFollow = async (req, res) => {
  try {
    const me = req.user;
    const { username } = req.params;

    if (me.username === username) {
      return res.status(400).json({ message: "Cannot follow yourself" });
    }

    const target = await User.findOne({ username });
    if (!target) {
      return res.status(404).json({ message: "User not found" });
    }

    const isFollowing = me.following.includes(target._id);

    if (isFollowing) {
      // UNFOLLOW
      me.following.pull(target._id);
      target.followers.pull(me._id);
    } else {
      // FOLLOW
      me.following.push(target._id);
      target.followers.push(me._id);

      // 🔔 FOLLOW NOTIFICATION
      const notification = await Notification.create({
        recipient: target._id,
        sender: me._id,
        type: "follow",
      });

      // Emit via Socket.io
      try {
        const io = getIO();
        io.to(target._id.toString()).emit("notification", notification);
      } catch (err) {
        console.error("Socket error in toggleFollow:", err.message);
      }
    }

    await me.save();
    await target.save();

    res.json({
      following: me.following.length,
      followers: target.followers.length,
      isFollowing: !isFollowing,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to toggle follow" });
  }
};

// GET /api/users/:username
export const getPublicProfile = async (req, res) => {
  try {
    const { username } = req.params;
    const loggedInUserId = req.user._id;

    const user = await User.findOne({ username }).select(
      "_id username name bio avatar followers following gender age location interests tipsReceived"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isFollowing = user.followers.some(
      (id) => id.toString() === loggedInUserId.toString()
    );

    res.status(200).json({
      _id: user._id,               // REQUIRED FOR MESSAGING
      username: user.username,
      name: user.name,
      bio: user.bio,
      avatar: user.avatar,
      gender: user.gender || "Non-binary",
      age: user.age || 21,
      location: user.location || "Nearby",
      interests: user.interests || ["Vibe"],
      tipsReceived: user.tipsReceived || 0,
      followers: user.followers.length,
      following: user.following.length,
      isFollowing,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch profile" });
  }
};

// GET /api/users/discovery
export const getDiscoveryUsers = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const { gender } = req.query;

    // Fetch me to get my following list
    const me = await User.findById(currentUserId);
    const followingIds = me.following || [];

    // Find users who are NOT me and NOT in my following list
    const filter = {
      _id: { $nin: [currentUserId, ...followingIds] }
    };

    if (gender && gender !== "All") {
      filter.gender = gender;
    }

    const users = await User.find(filter).select("_id username name bio avatar gender age location interests");

    // Randomize result
    const shuffled = users.sort(() => 0.5 - Math.random());

    res.json(shuffled);
  } catch (error) {
    res.status(500).json({ message: "Discovery failed" });
  }
};


// GET /api/users/:username/followers
export const getFollowers = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .populate("followers", "username name avatar");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user.followers);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch followers" });
  }
};

// GET /api/users/:username/following
export const getFollowing = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .populate("following", "username name avatar");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user.following);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch following" });
  }
};
// UPLOAD AVATAR
export const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image uploaded" });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Save Cloudinary URL
    user.avatar = req.file.path;
    await user.save();

    res.json({
      message: "Avatar updated",
      avatar: user.avatar,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Avatar upload failed" });
  }
};
