import mongoose from "mongoose";

const tipSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
  },
  { timestamps: true }
);

tipSchema.index({ recipient: 1 });
tipSchema.index({ sender: 1 });

export default mongoose.model("Tip", tipSchema);
