import mongoose from "mongoose";

const searchHistorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    term: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

// Ensure a user has unique search history items
searchHistorySchema.index({ user: 1, term: 1 }, { unique: true });

const SearchHistory = mongoose.model("SearchHistory", searchHistorySchema);
export default SearchHistory;
