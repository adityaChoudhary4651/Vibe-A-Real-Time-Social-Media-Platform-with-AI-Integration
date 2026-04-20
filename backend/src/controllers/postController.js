import Post from "../models/Post.js";
import Comment from "../models/Comment.js";
import Notification from "../models/notification.js";
import { getIO } from "../socket.js";

// CREATE POST
export const createPost = async (req, res) => {
  try {
    const { caption, type = "post", category, visibility = "Public" } = req.body;

    const postData = {
      author: req.user._id,
      caption,
      type,
      visibility,
    };

    if (req.file && req.file.path) {
      postData.mediaUrl = req.file.path;

      if (type === "reel") {
        postData.mediaType = "video";
        postData.category = category || "General";
      } else {
        postData.mediaType = "image";
      }
    }

    const post = await Post.create(postData);
    res.status(201).json(post);
  } catch (error) {
    console.error("CREATE POST ERROR ❌", error);
    res.status(500).json({ message: "Post creation failed" });
  }
};
/// GET FEED POSTS (PUBLIC POSTS ONLY)
export const getPosts = async (req, res) => {
  try {
    const posts = await Post.find({
      visibility: "Public",
      type: "post",
    })
      .populate("author", "username avatar")
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch feed posts" });
  }
};
// TOGGLE LIKE
export const toggleLike = async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    return res.status(404).json({ message: "Post not found" });
  }

  const userId = req.user._id;
  const alreadyLiked = post.likes.some(
    (id) => id.toString() === userId.toString()
  );

  if (alreadyLiked) {
    post.likes = post.likes.filter(
      (id) => id.toString() !== userId.toString()
    );
  } else {
    post.likes.push(userId);

    // LIKE NOTIFICATION 
    if (post.author.toString() !== userId.toString()) {
      const notification = await Notification.create({
        recipient: post.author,
        sender: userId,
        type: "like",
        post: post._id,
      });

      // Emit via Socket.io
      try {
        const io = getIO();
        io.to(post.author.toString()).emit("notification", notification);
      } catch (err) {
        console.error("Socket error in toggleLike:", err.message);
      }
    }
  }

  await post.save();

  // Emit like update to the post room
  try {
    const io = getIO();
    io.to(`post_${post._id}`).emit("like_update", {
      postId: post._id,
      likesCount: post.likes.length,
    });
  } catch (err) {
    console.error("Socket error in toggleLike (live update):", err.message);
  }

  res.json({
    likesCount: post.likes.length,
    isLiked: !alreadyLiked,
  });
};

// DELETE POST
export const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (post.author.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this post" });
    }

    await post.deleteOne();
    res.json({ message: "Post deleted successfully" });
  } catch {
    res.status(500).json({ message: "Failed to delete post" });
  }
};

// DELETE POST
export const editPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    post.caption = req.body.caption;
    await post.save();

    res.json({ message: "Post updated", post });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
};

// GET MY POSTS
export const getMyPosts = async (req, res) => {
  try {
    const posts = await Post.find({ author: req.user._id })
      .populate("author", "username name avatar")
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch {
    res.status(500).json({ message: "Failed to fetch my posts" });
  }
};
// GET USER POSTS
export const getPostsByUsername = async (req, res) => {
  try {
    const { username } = req.params;
    const { type } = req.query;

    const filter = {
      visibility: "Public",
      mediaUrl: { $ne: null },
    };

    if (type) filter.type = type;

    const posts = await Post.find(filter)
      .populate({
        path: "author",
        match: { username },
        select: "username name avatar",
      })
      .sort({ createdAt: -1 });

    res.json(posts.filter((p) => p.author));
  } catch {
    res.status(500).json({ message: "Failed to fetch user posts" });
  }
};

// GET POST BY ID
export const getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate(
      "author",
      "username name avatar"
    );

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.json(post);
  } catch {
    res.status(500).json({ message: "Failed to fetch post" });
  }
};

// GET REELS
export const getReels = async (req, res) => {
  try {
    const filter = {
      type: "reel",
      visibility: "Public",
      mediaType: "video",
      mediaUrl: { $ne: null },
    };

    if (req.query.category && req.query.category !== "All") {
      filter.category = req.query.category;
    }

    const reels = await Post.find(filter)
      .populate("author", "username name avatar")
      .sort({ createdAt: -1 })
      .lean();

    const reelsWithCounts = await Promise.all(
      reels.map(async (reel) => {
        const commentsCount = await Comment.countDocuments({
          post: reel._id,
        });
        return { ...reel, commentsCount };
      })
    );

    res.json(reelsWithCounts);
  } catch (error) {
    console.error("GET REELS ERROR ❌", error);
    res.status(500).json({ message: "Failed to fetch reels" });
  }
};

// GET MY REELS
export const getMyReels = async (req, res) => {
  try {
    const reels = await Post.find({
      author: req.user._id,
      type: "reel",
      visibility: "Public",
      mediaType: "video",
    })
      .populate("author", "username avatar")
      .sort({ createdAt: -1 });

    res.json(reels);
  } catch {
    res.status(500).json({ message: "Failed to fetch reels" });
  }
};

// GET USER REELS
export const getReelsByUsername = async (req, res) => {
  try {
    const { username } = req.params;

    const reels = await Post.find({
      type: "reel",
      visibility: "Public",
      mediaType: "video",
    })
      .populate({
        path: "author",
        match: { username },
        select: "username avatar",
      })
      .sort({ createdAt: -1 });

    res.json(reels.filter((r) => r.author));
  } catch {
    res.status(500).json({ message: "Failed to fetch reels" });
  }
};
