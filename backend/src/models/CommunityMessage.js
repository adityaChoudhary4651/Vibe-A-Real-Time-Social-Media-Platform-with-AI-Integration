import mongoose from "mongoose";

const communityMessageSchema = new mongoose.Schema(
  {
    community: { type: mongoose.Schema.Types.ObjectId, ref: "Community", required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String },
    mediaUrl: { type: String },
    mediaType: { type: String },
  },
  { timestamps: true }
);

communityMessageSchema.index({ community: 1, createdAt: 1 });

export default mongoose.model("CommunityMessage", communityMessageSchema);
