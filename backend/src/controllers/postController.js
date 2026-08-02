import Post from "../models/Post.js";
import Comment from "../models/Comment.js";
import Notification from "../models/notification.js";
import { getIO } from "../socket.js";
import User from "../models/User.js";
import { uploadPostToCloudinary, uploadReelToCloudinary } from "../middleware/upload.js";

const populateCommentsCount = async (postsOrReels) => {
  if (!Array.isArray(postsOrReels) || postsOrReels.length === 0) {
    return postsOrReels;
  }
  const plainList = postsOrReels.map(item => 
    typeof item.toObject === 'function' ? item.toObject() : item
  );
  const ids = plainList.map(item => item._id);
  const commentCounts = await Comment.aggregate([
    { $match: { post: { $in: ids } } },
    { $group: { _id: "$post", count: { $sum: 1 } } }
  ]);
  const countsMap = commentCounts.reduce((map, item) => {
    map[item._id.toString()] = item.count;
    return map;
  }, {});
  return plainList.map(item => ({
    ...item,
    commentsCount: countsMap[item._id.toString()] || 0
  }));
};

export const createPost = async (req, res) => {
  try {
    const { 
      caption, 
      type = "post", 
      category, 
      visibility = "Public",
      status = "Published",
      allowComments = true,
      allowLikes = true,
      shareToFeed = true
    } = req.body;

    const postData = {
      author: req.user._id,
      caption,
      type,
      visibility,
      status,
      allowComments: allowComments === "true" || allowComments === true,
      allowLikes: allowLikes === "true" || allowLikes === true,
      shareToFeed: shareToFeed === "true" || shareToFeed === true,
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
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const posts = await Post.find({
      visibility: "Public",
      type: "post",
      status: { $ne: "Draft" },
      shareToFeed: { $ne: false },
    })
      .populate("author", "username avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const postsWithCounts = await populateCommentsCount(posts);
    res.json(postsWithCounts);
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

  if (post.allowLikes === false) {
    return res.status(400).json({ message: "Likes are disabled for this post" });
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

// EDIT POST
export const editPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Update textual properties if provided
    if (req.body.caption !== undefined) post.caption = req.body.caption;
    if (req.body.visibility !== undefined) post.visibility = req.body.visibility;
    if (req.body.category !== undefined) post.category = req.body.category;
    if (req.body.status !== undefined) post.status = req.body.status;
    if (req.body.allowComments !== undefined) {
      post.allowComments = req.body.allowComments === "true" || req.body.allowComments === true;
    }
    if (req.body.allowLikes !== undefined) {
      post.allowLikes = req.body.allowLikes === "true" || req.body.allowLikes === true;
    }
    if (req.body.shareToFeed !== undefined) {
      post.shareToFeed = req.body.shareToFeed === "true" || req.body.shareToFeed === true;
    }

    // Process new file upload if present
    let fileToUpload = null;
    if (req.file) {
      fileToUpload = req.file;
    } else if (req.files) {
      if (req.files.image && req.files.image[0]) {
        fileToUpload = req.files.image[0];
      } else if (req.files.media && req.files.media[0]) {
        fileToUpload = req.files.media[0];
      }
    }

    if (fileToUpload) {
      const isVideo = fileToUpload.mimetype.startsWith("video/");
      if (isVideo) {
        post.mediaUrl = await uploadReelToCloudinary(fileToUpload.path);
        post.mediaType = "video";
      } else {
        post.mediaUrl = await uploadPostToCloudinary(fileToUpload.path);
        post.mediaType = "image";
      }
    }

    await post.save();
    res.json({ message: "Post updated successfully", post });
  } catch (err) {
    console.error("EDIT POST ERROR ❌", err);
    res.status(500).json({ message: "Server error updating post" });
  }
};

// GET MY POSTS
export const getMyPosts = async (req, res) => {
  try {
    const posts = await Post.find({ author: req.user._id })
      .populate("author", "username name avatar")
      .sort({ createdAt: -1 })
      .lean();

    const postsWithCounts = await populateCommentsCount(posts);
    res.json(postsWithCounts);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch my posts" });
  }
};
// GET USER POSTS
export const getPostsByUsername = async (req, res) => {
  try {
    const { username } = req.params;
    const { type } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const userObj = await User.findOne({ username });
    if (!userObj) {
      return res.status(404).json({ message: "User not found" });
    }

    const isSelf = req.user && req.user._id.toString() === userObj._id.toString();
    const { status } = req.query;

    const filter = {
      author: userObj._id,
    };

    if (isSelf && status === "Draft") {
      filter.status = "Draft";
    } else {
      filter.status = { $ne: "Draft" };
      filter.mediaUrl = { $ne: null };
      if (!isSelf) {
        filter.visibility = "Public";
      }
    }

    if (type) filter.type = type;

    const posts = await Post.find(filter)
      .populate("author", "username name avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const postsWithCounts = await populateCommentsCount(posts);
    res.json(postsWithCounts);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch user posts" });
  }
};

// GET POST BY ID
export const getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("author", "username name avatar")
      .lean();

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const [postWithCount] = await populateCommentsCount([post]);
    res.json(postWithCount);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch post" });
  }
};

// GET REELS
export const getReels = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    const filter = {
      type: "reel",
      visibility: "Public",
      mediaType: "video",
      mediaUrl: { $ne: null },
      status: { $ne: "Draft" },
    };

    if (req.query.category && req.query.category !== "All") {
      filter.category = req.query.category;
    }

    if (req.query.user) {
      const userObj = await User.findOne({ username: req.query.user });
      if (userObj) {
        filter.author = userObj._id;
      }
    }

    const reels = await Post.find(filter)
      .populate("author", "username name avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const reelsWithCounts = await populateCommentsCount(reels);
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
      .sort({ createdAt: -1 })
      .lean();

    const reelsWithCounts = await populateCommentsCount(reels);
    res.json(reelsWithCounts);
  } catch (error) {
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
      .sort({ createdAt: -1 })
      .lean();

    const filteredReels = reels.filter((r) => r.author);
    const reelsWithCounts = await populateCommentsCount(filteredReels);
    res.json(reelsWithCounts);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch reels" });
  }
};

// TOGGLE SAVE POST
export const toggleSave = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const userId = req.user._id;
    const userObj = await User.findById(userId);
    if (!userObj) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!userObj.savedPosts) {
      userObj.savedPosts = [];
    }

    const isSaved = userObj.savedPosts.includes(post._id);

    if (isSaved) {
      userObj.savedPosts = userObj.savedPosts.filter((id) => id.toString() !== post._id.toString());
    } else {
      userObj.savedPosts.push(post._id);
    }

    await userObj.save();
    res.json({ isSaved: !isSaved });
  } catch (error) {
    res.status(500).json({ message: "Failed to toggle save status" });
  }
};

// GET SAVED POSTS
export const getSavedPosts = async (req, res) => {
  try {
    const userObj = await User.findById(req.user._id)
      .populate({
        path: "savedPosts",
        populate: { path: "author", select: "username avatar" }
      })
      .lean();
      
    if (!userObj) {
      return res.status(404).json({ message: "User not found" });
    }
    const saved = (userObj.savedPosts || []).filter(p => p !== null);
    const savedWithCounts = await populateCommentsCount(saved);
    res.json(savedWithCounts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch saved posts" });
  }
};

// INCREMENT VIEWS
export const incrementViews = async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    );
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    res.json({ success: true, views: post.views });
  } catch (err) {
    res.status(500).json({ message: "Failed to increment views" });
  }
};

// INCREMENT SHARES
export const incrementShares = async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { $inc: { sharesCount: 1 } },
      { new: true }
    );
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    res.json({ success: true, sharesCount: post.sharesCount });
  } catch (err) {
    res.status(500).json({ message: "Failed to increment shares" });
  }
};
