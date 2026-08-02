import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    /* ======================
       MEDIA (POSTS + REELS)
    ====================== */
    mediaUrl: {
      type: String, // Cloudinary HTTPS URL
      default: null,
    },

    mediaType: {
      type: String,
      enum: ["image", "video"],
      default: null,
    },

    /* ======================
       POST / REEL META
    ====================== */
    caption: {
      type: String,
      maxlength: 500,
      trim: true,
    },

    category: {
      type: String,
      enum: ["Funny", "Sad", "Dance", "Music", "Food", "Travel", "General"],
      default: "General",
    },

    type: {
      type: String,
      enum: ["post", "reel"],
      default: "post",
    },

    visibility: {
      type: String,
      enum: ["Public", "Private"],
      default: "Public",
    },

    status: {
      type: String,
      enum: ["Published", "Draft"],
      default: "Published",
    },

    allowComments: {
      type: Boolean,
      default: true,
    },

    allowLikes: {
      type: Boolean,
      default: true,
    },

    shareToFeed: {
      type: Boolean,
      default: true,
    },

    /* ======================
       INTERACTIONS
    ====================== */
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    views: {
      type: Number,
      default: 0,
    },
    sharesCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Indexes to optimize feed query speed (visibility + type + date)
postSchema.index({ visibility: 1, type: 1, createdAt: -1 });

// Indexes to optimize profile query speed (author + visibility + date)
postSchema.index({ author: 1, visibility: 1, createdAt: -1 });

const Post = mongoose.model("Post", postSchema);
export default Post;
