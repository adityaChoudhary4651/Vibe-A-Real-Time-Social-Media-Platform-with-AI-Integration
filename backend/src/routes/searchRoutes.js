import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  searchAll,
  searchUsers,
  searchPosts,
  searchReels,
  searchHashtags,
  searchCommunities,
  getTrendingHashtags,
  getRecentSearches,
  addRecentSearch,
  deleteRecentSearchItem,
  clearRecentSearches,
  getSuggestions,
  getQuote,
  updateQuote,
  getLatestPost,
  getFriendsPosts,
  getPeopleSuggestions,
} from "../controllers/searchController.js";

const router = express.Router();

// Apply authMiddleware to all search routes since a logged-in user context is required for search history, saves, likes, suggestions, and posts.
router.use(authMiddleware);

router.get("/", searchAll);
router.get("/users", searchUsers);
router.get("/posts", searchPosts);
router.get("/reels", searchReels);
router.get("/hashtags", searchHashtags);
router.get("/communities", searchCommunities);
router.get("/trending", getTrendingHashtags);

router.get("/recent", getRecentSearches);
router.post("/recent", addRecentSearch);
router.delete("/recent", clearRecentSearches);
router.delete("/recent/:id", deleteRecentSearchItem);

router.get("/suggestions", getSuggestions);
router.get("/quote", getQuote);
router.post("/quote", updateQuote);

router.get("/sidebar/latest-post", getLatestPost);
router.get("/sidebar/friends-posts", getFriendsPosts);
router.get("/sidebar/people-suggestion", getPeopleSuggestions);

export default router;
