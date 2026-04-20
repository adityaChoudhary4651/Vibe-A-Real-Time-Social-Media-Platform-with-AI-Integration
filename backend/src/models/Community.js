import mongoose from "mongoose";

const communitySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String, default: "" },
    avatar: { type: String, default: "" },
    creator: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    category: { type: String, default: "General" }
  },
  { timestamps: true }
);

// Index for search
communitySchema.index({ name: "text", description: "text" });

export default mongoose.model("Community", communitySchema);
