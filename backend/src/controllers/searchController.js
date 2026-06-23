import User from "../models/User.js";
import Post from "../models/Post.js";
import Comment from "../models/Comment.js";
import Community from "../models/Community.js";
import SearchHistory from "../models/SearchHistory.js";
import Quote from "../models/Quote.js";

// 1. COMPREHENSIVE MULTI-SEARCH
export const searchAll = async (req, res) => {
  try {
    const q = req.query.q?.trim();
    if (!q) {
      return res.json({ users: [], posts: [], reels: [], communities: [], hashtags: [] });
    }

    const users = await User.find({
      $or: [
        { username: { $regex: q, $options: "i" } },
        { name: { $regex: q, $options: "i" } }
      ]
    }).select("_id username name avatar").limit(5);

    const posts = await Post.find({
      type: "post",
      visibility: "Public",
      caption: { $regex: q, $options: "i" }
    }).populate("author", "username avatar").limit(5);

    const reels = await Post.find({
      type: "reel",
      visibility: "Public",
      caption: { $regex: q, $options: "i" }
    }).populate("author", "username avatar").limit(5);

    const communities = await Community.find({
      $or: [
        { name: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } }
      ]
    }).populate("creator", "username avatar").limit(5);

    res.json({ users, posts, reels, communities });
  } catch (error) {
    res.status(500).json({ message: "Failed to search" });
  }
};

// 2. SEARCH USERS WITH PAGINATION
export const searchUsers = async (req, res) => {
  try {
    const q = req.query.q?.trim();
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    let filter = {};
    if (q) {
      filter = {
        $or: [
          { username: { $regex: q, $options: "i" } },
          { name: { $regex: q, $options: "i" } }
        ]
      };
    }

    const users = await User.find(filter)
      .select("_id username name avatar bio followers following")
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(filter);
    res.json({
      users,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to search users" });
  }
};

// 3. SEARCH POSTS & REELS COMBINED (PAGINATION + FLUID FILTER)
export const searchPosts = async (req, res) => {
  try {
    const q = req.query.q?.trim();
    const media = req.query.media || "All"; // All / Photos / Reels
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const filter = { visibility: "Public" };

    if (media === "Photos") {
      filter.type = "post";
    } else if (media === "Reels") {
      filter.type = "reel";
    } else {
      filter.type = { $in: ["post", "reel"] };
    }

    if (q) {
      if (q.startsWith("#")) {
        filter.caption = { $regex: q, $options: "i" };
      } else {
        filter.$or = [
          { caption: { $regex: q, $options: "i" } },
          { category: { $regex: q, $options: "i" } }
        ];
      }
    }

    const posts = await Post.find(filter)
      .populate("author", "username name avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const userObj = req.user ? await User.findById(req.user._id) : null;
    const savedSet = userObj && userObj.savedPosts 
      ? new Set(userObj.savedPosts.map((id) => id.toString())) 
      : new Set();

    const postsWithMeta = await Promise.all(
      posts.map(async (p) => {
        const commentsCount = await Comment.countDocuments({ post: p._id });
        return {
          ...p,
          likesCount: p.likes?.length || 0,
          commentsCount,
          isLiked: req.user ? p.likes?.some((id) => id.toString() === req.user._id.toString()) : false,
          isSaved: savedSet.has(p._id.toString()),
        };
      })
    );

    const total = await Post.countDocuments(filter);
    res.json({
      posts: postsWithMeta,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to search posts" });
  }
};

// 4. SEARCH REELS ONLY
export const searchReels = async (req, res) => {
  try {
    const q = req.query.q?.trim();
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const filter = { type: "reel", visibility: "Public" };
    if (q) {
      filter.caption = { $regex: q, $options: "i" };
    }

    const reels = await Post.find(filter)
      .populate("author", "username name avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const userObj = req.user ? await User.findById(req.user._id) : null;
    const savedSet = userObj && userObj.savedPosts 
      ? new Set(userObj.savedPosts.map((id) => id.toString())) 
      : new Set();

    const reelsWithMeta = await Promise.all(
      reels.map(async (r) => {
        const commentsCount = await Comment.countDocuments({ post: r._id });
        return {
          ...r,
          likesCount: r.likes?.length || 0,
          commentsCount,
          isLiked: req.user ? r.likes?.some((id) => id.toString() === req.user._id.toString()) : false,
          isSaved: savedSet.has(r._id.toString()),
        };
      })
    );

    const total = await Post.countDocuments(filter);
    res.json({
      reels: reelsWithMeta,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to search reels" });
  }
};

// 5. SEARCH HASHTAGS
export const searchHashtags = async (req, res) => {
  try {
    const q = req.query.q?.trim();
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const filter = { visibility: "Public", caption: { $regex: "#", $options: "i" } };
    if (q) {
      const searchTag = q.startsWith("#") ? q : `#${q}`;
      filter.caption = { $regex: searchTag, $options: "i" };
    }

    const posts = await Post.find(filter).select("caption mediaUrl likes").lean();

    const counts = {};
    posts.forEach((p) => {
      if (p.caption) {
        const tags = p.caption.match(/#[a-zA-Z0-9_]+/g);
        if (tags) {
          tags.forEach((tag) => {
            const cleanTag = tag.trim();
            if (q) {
              const cleanSearch = q.trim().toLowerCase();
              if (!cleanTag.toLowerCase().includes(cleanSearch)) return;
            }
            if (!counts[cleanTag]) {
              counts[cleanTag] = { count: 0, image: p.mediaUrl, engagement: 0 };
            }
            counts[cleanTag].count += 1;
            counts[cleanTag].engagement += (p.likes?.length || 0) + 1;
          });
        }
      }
    });

    const sortedTags = Object.keys(counts)
      .map((tag) => ({
        title: tag,
        postsCount: counts[tag].count,
        engagement: counts[tag].engagement,
        image: counts[tag].image || "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=100",
      }))
      .sort((a, b) => b.postsCount - a.postsCount);

    const paginated = sortedTags.slice(skip, skip + limit);
    res.json({
      hashtags: paginated,
      total: sortedTags.length,
      page,
      pages: Math.ceil(sortedTags.length / limit),
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to search hashtags" });
  }
};

// 6. SEARCH COMMUNITIES
export const searchCommunities = async (req, res) => {
  try {
    const q = req.query.q?.trim();
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    let filter = {};
    if (q) {
      filter = {
        $or: [
          { name: { $regex: q, $options: "i" } },
          { description: { $regex: q, $options: "i" } }
        ]
      };
    }

    const communities = await Community.find(filter)
      .populate("creator", "username avatar")
      .skip(skip)
      .limit(limit);

    const total = await Community.countDocuments(filter);
    res.json({
      communities,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to search communities" });
  }
};

// 7. GET TRENDING HASHTAGS
export const getTrendingHashtags = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6;
    const posts = await Post.find({ visibility: "Public", caption: { $regex: "#" } })
      .select("caption mediaUrl likes")
      .lean();

    const counts = {};
    posts.forEach((p) => {
      if (p.caption) {
        const tags = p.caption.match(/#[a-zA-Z0-9_]+/g);
        if (tags) {
          tags.forEach((tag) => {
            const cleanTag = tag.trim();
            if (!counts[cleanTag]) {
              counts[cleanTag] = { count: 0, image: p.mediaUrl, engagement: 0 };
            }
            counts[cleanTag].count += 1;
            counts[cleanTag].engagement += p.likes?.length || 0;
          });
        }
      }
    });

    const sortedTags = Object.keys(counts)
      .map((tag) => ({
        title: tag,
        postsCount: counts[tag].count,
        posts: `${counts[tag].count} posts`,
        engagement: counts[tag].engagement,
        image: counts[tag].image || "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=100",
      }))
      .sort((a, b) => b.engagement - a.engagement || b.postsCount - a.postsCount);

    res.json(sortedTags.slice(0, limit));
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch trending hashtags" });
  }
};

// 8. GET RECENT SEARCHES
export const getRecentSearches = async (req, res) => {
  try {
    const history = await SearchHistory.find({ user: req.user._id })
      .sort({ updatedAt: -1 })
      .limit(10);
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch recent searches" });
  }
};

// 9. ADD RECENT SEARCH
export const addRecentSearch = async (req, res) => {
  try {
    const { term } = req.body;
    if (!term || !term.trim()) {
      return res.status(400).json({ message: "Term required" });
    }

    const history = await SearchHistory.findOneAndUpdate(
      { user: req.user._id, term: term.trim() },
      { updatedAt: new Date() },
      { upsert: true, new: true }
    );
    res.status(201).json(history);
  } catch (error) {
    res.status(500).json({ message: "Failed to save search history" });
  }
};

// 10. DELETE RECENT SEARCH ITEM
export const deleteRecentSearchItem = async (req, res) => {
  try {
    await SearchHistory.deleteOne({ user: req.user._id, _id: req.params.id });
    res.json({ message: "Search history item deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete item" });
  }
};

// 11. CLEAR ALL RECENT SEARCHES
export const clearRecentSearches = async (req, res) => {
  try {
    await SearchHistory.deleteMany({ user: req.user._id });
    res.json({ message: "Search history cleared" });
  } catch (error) {
    res.status(500).json({ message: "Failed to clear search history" });
  }
};

// 12. GET SUGGESTIONS
export const getSuggestions = async (req, res) => {
  try {
    const q = req.query.q?.trim();
    if (!q) return res.json([]);

    const users = await User.find({ username: { $regex: q, $options: "i" } })
      .select("username avatar")
      .limit(5);

    const communities = await Community.find({ name: { $regex: q, $options: "i" } })
      .select("name avatar")
      .limit(5);

    const list = [
      ...users.map((u) => ({ text: u.username, type: "user", avatar: u.avatar })),
      ...communities.map((c) => ({ text: c.name, type: "community", avatar: c.avatar })),
    ];
    res.json(list);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch suggestions" });
  }
};

// 13. SIDEBAR GET MOTIVATIONAL THOUGHT
export const getQuote = async (req, res) => {
  try {
    const quote = await Quote.findOne().sort({ updatedAt: -1 });
    if (!quote) {
      return res.json({ text: "Believe in yourself a little more. You're doing great.", author: "Vibe" });
    }
    res.json(quote);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch quote" });
  }
};

// 14. SIDEBAR SET/UPDATE MOTIVATIONAL THOUGHT (ADMIN OR ANY LOGGED IN FOR SIMPLICITY)
export const updateQuote = async (req, res) => {
  try {
    const { text, author } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Text is required" });
    }

    let quote = await Quote.findOne();
    if (quote) {
      quote.text = text.trim();
      quote.author = author?.trim() || "Anonymous";
      await quote.save();
    } else {
      quote = await Quote.create({
        text: text.trim(),
        author: author?.trim() || "Anonymous"
      });
    }

    res.json(quote);
  } catch (error) {
    res.status(500).json({ message: "Failed to update quote" });
  }
};

// 15. SIDEBAR: LATEST POST BY CURRENT LOGGED USER
export const getLatestPost = async (req, res) => {
  try {
    const post = await Post.findOne({ author: req.user._id, type: "post" })
      .populate("author", "username avatar name")
      .sort({ createdAt: -1 })
      .lean();

    if (!post) return res.json(null);

    const commentsCount = await Comment.countDocuments({ post: post._id });
    res.json({
      ...post,
      likesCount: post.likes?.length || 0,
      commentsCount,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch latest user post" });
  }
};

// 16. SIDEBAR: FRIENDS' LATEST POSTS
export const getFriendsPosts = async (req, res) => {
  try {
    const userObj = await User.findById(req.user._id);
    if (!userObj || !userObj.following || userObj.following.length === 0) {
      return res.json([]);
    }

    const posts = await Post.find({
      author: { $in: userObj.following },
      type: "post",
      visibility: "Public"
    })
      .populate("author", "username avatar name")
      .sort({ createdAt: -1 })
      .limit(3)
      .lean();

    const postsWithMeta = await Promise.all(
      posts.map(async (p) => {
        const commentsCount = await Comment.countDocuments({ post: p._id });
        return {
          ...p,
          likesCount: p.likes?.length || 0,
          commentsCount,
        };
      })
    );

    res.json(postsWithMeta);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch friends' posts" });
  }
};

// 17. SIDEBAR: PEOPLE YOU MAY KNOW
export const getPeopleSuggestions = async (req, res) => {
  try {
    const me = await User.findById(req.user._id);
    const following = me.following || [];

    const suggestions = await User.find({
      _id: { $ne: req.user._id, $nin: following }
    })
      .select("name username avatar bio followers")
      .limit(5);

    res.json(suggestions);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch people suggestions" });
  }
};
