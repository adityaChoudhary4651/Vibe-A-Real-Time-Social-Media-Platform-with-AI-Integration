import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: false,
    },
    story: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Story",
      required: false,
    },
    parentComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    likes: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
      default: [], // 🔴 THIS FIXES THE CRASH
    },
  },
  { timestamps: true }
);

commentSchema.index({ post: 1, parentComment: 1, createdAt: -1 });
commentSchema.index({ story: 1, parentComment: 1, createdAt: -1 });
commentSchema.index({ parentComment: 1, createdAt: 1 });

export default mongoose.model("Comment", commentSchema);
