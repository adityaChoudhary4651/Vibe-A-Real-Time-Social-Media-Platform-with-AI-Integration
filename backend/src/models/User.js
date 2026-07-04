import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },

    bio: { type: String, default: "" },
    avatar: { type: String, default: "" },
    coverPhoto: { type: String, default: "" },

    gender: { type: String, default: "Non-binary" },
    age: { type: Number, default: 21 },
    location: { type: String, default: "Nearby" },
    interests: { type: [String], default: ["Vibe"] },
    tipsReceived: { type: Number, default: 0 },

    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    savedPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }],
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
