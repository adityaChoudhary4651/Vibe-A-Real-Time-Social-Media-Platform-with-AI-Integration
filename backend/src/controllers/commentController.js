import Comment from "../models/Comment.js";
import Post from "../models/Post.js";
import Notification from "../models/notification.js";
import { getIO } from "../socket.js";
// ADD COMMENT
export const addComment = async (req, res) => {
  const { text } = req.body;
  const { postId } = req.params;
  const userId = req.user._id;

  // Fetch post to know author
  const post = await Post.findById(postId);
  if (!post) {
    return res.status(404).json({ message: "Post not found" });
  }

  const comment = await Comment.create({
    post: postId,
    user: userId,
    text,
  });

  // COMMENT NOTIFICATION
  if (post.author.toString() !== userId.toString()) {
    const notification = await Notification.create({
      recipient: post.author,
      sender: userId,
      type: "comment",
      post: post._id,
    });

    // Emit via Socket.io
    try {
      const io = getIO();
      io.to(post.author.toString()).emit("notification", notification);
    } catch (err) {
      console.error("Socket error in addComment:", err.message);
    }
  }

  const populated = await comment.populate("user", "username avatar");

  const responseData = {
    _id: populated._id,
    text: populated.text,
    createdAt: populated.createdAt,
    author: populated.user,
    likesCount: 0,
    isLiked: false,
    canDelete: true,
  };

  // Emit comment update to the post room
  try {
    const io = getIO();
    io.to(`post_${postId}`).emit("comment_update", {
      type: "add",
      postId,
      comment: responseData,
    });
  } catch (err) {
    console.error("Socket error in addComment (live update):", err.message);
  }

  res.status(201).json(responseData);
};

// GET COMMENTS
export const getComments = async (req, res) => {
  try {
    const { postId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const skip = (page - 1) * limit;

    const comments = await Comment.find({ post: postId })
      .populate("user", "username avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const response = comments.map((c) => ({
      _id: c._id,
      text: c.text,
      createdAt: c.createdAt,
      author: c.user,
      likesCount: c.likes.length,
      isLiked: c.likes.some(
        (id) => id.toString() === req.user._id.toString()
      ),
      canDelete: c.user && c.user._id.toString() === req.user._id.toString(),
    }));

    res.json(response);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch comments" });
  }
};

  // DELETE COMMENT
export const deleteComment = async (req, res) => {
  const { commentId } = req.params;

  const comment = await Comment.findById(commentId);
  if (!comment) return res.status(404).json({ message: "Not found" });

  if (comment.user.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const postId = comment.post;
  await comment.deleteOne();

  // Emit comment update to the post room
  try {
    const io = getIO();
    io.to(`post_${postId}`).emit("comment_update", {
      type: "delete",
      postId,
      commentId,
    });
  } catch (err) {
    console.error("Socket error in deleteComment (live update):", err.message);
  }

  res.json({ success: true, commentId });
};

//   LIKE COMMENT
export const toggleCommentLike = async (req, res) => {
  const { commentId } = req.params;

  if (!commentId || commentId === "undefined") {
    return res.status(400).json({ message: "Invalid comment id" });
  }

  const userId = req.user._id.toString();

  const comment = await Comment.findById(commentId).populate(
    "user",
    "username avatar"
  );

  if (!comment) {
    return res.status(404).json({ message: "Comment not found" });
  }

  const index = comment.likes.findIndex(
    (id) => id.toString() === userId
  );

  if (index === -1) {
    comment.likes.push(userId);
  } else {
    comment.likes.splice(index, 1);
  }

  await comment.save();

  res.json({
    _id: comment._id,
    text: comment.text,
    createdAt: comment.createdAt,
    author: {
      username: comment.user.username,
      avatar: comment.user.avatar || "",
    },
    likesCount: comment.likes.length,
    isLiked: comment.likes.some(
      (id) => id.toString() === userId
    ),
    canDelete: comment.user._id.toString() === userId,
  });
};
