import User from "../models/User.js";
import Post from "../models/Post.js";

// USERS
export const searchUsers = async (req, res) => {
  const q = req.query.q?.trim();
  if (!q) return res.json([]);

  const users = await User.find({
    $or: [
      { username: { $regex: q, $options: "i" } },
      { name: { $regex: q, $options: "i" } }
    ]
  })
    .select("_id username avatar")
    .limit(10);

  res.json(users);
};



// POSTS (PUBLIC ONLY)
export const searchPosts = async (req, res) => {
  const raw = req.query.q?.trim();

  const filter = {
    type: "post",
    visibility: "Public",
    caption: { $exists: true },
  };

  // 🔥 DEFAULT: ANY caption containing #
  if (!raw || raw === "#") {
    filter.caption = { $regex: "#", $options: "i" };
  }

  // 🔍 USER TYPING A HASHTAG (#s, #su, #sunset)
  else if (raw.startsWith("#")) {
    const tag = raw.slice(1);
    filter.caption = { $regex: `#${tag}`, $options: "i" };
  }

  const posts = await Post.find(filter)
    .sort({ createdAt: -1 })
    .limit(30)
    .select("_id mediaUrl");

  res.json(posts);
};


