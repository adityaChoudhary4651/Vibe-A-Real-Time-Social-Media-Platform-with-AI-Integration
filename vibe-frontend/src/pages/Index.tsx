import { useState, useEffect } from "react";
import { StoriesBar } from "@/components/stories/StoriesBar";
import { PostCard } from "@/components/feed/PostCard";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { API_BASE_URL } from "../config";

interface FeedPost {
  _id: string;
  imageUrl: string;
  caption: string;
  author: {
    _id: string;
    name: string;
    avatar?: string;
  };
  likes: string[];
  comments: number;
  createdAt: string;
}

const Index = () => {
  const { token, user } = useAuth();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchFeedPosts = async (pageNumber: number) => {
    if (!token) return;
    try {
      setLoading(true);
      const limit = 10;
      const res = await fetch(`${API_BASE_URL}/api/posts?page=${pageNumber}&limit=${limit}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        if (pageNumber === 1) {
          setPosts(data);
        } else {
          setPosts((prev) => {
            const existingIds = new Set(prev.map((p) => p._id));
            const newPosts = data.filter((p: FeedPost) => !existingIds.has(p._id));
            return [...prev, ...newPosts];
          });
        }
        setHasMore(data.length === limit);
      } else {
        if (pageNumber === 1) setError(true);
      }
    } catch (err) {
      console.error("Error fetching feed posts:", err);
      if (pageNumber === 1) setError(true);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      setError(false);
      setInitialLoading(true);
      fetchFeedPosts(1);
      setPage(1);
    }
  }, [token]);

  useEffect(() => {
    const handleScroll = () => {
      if (!hasMore || loading) return;
      if (
        window.innerHeight + document.documentElement.scrollTop >=
        document.documentElement.offsetHeight - 150
      ) {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchFeedPosts(nextPage);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [page, hasMore, loading, token]);

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden">
      {/* ✅ STORIES */}
      <StoriesBar />

      {/* ✅ FEED */}
      <div className="divide-y divide-border w-full">
        {initialLoading && posts.length === 0 && (
          <p className="text-center py-6 text-muted-foreground">
            Loading feed...
          </p>
        )}

        {error && posts.length === 0 && (
          <p className="text-center py-6 text-red-500">
            Failed to load posts
          </p>
        )}

        {posts.map((post, index) => (
          <motion.div
            key={post._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
            className="w-full"
          >
            <PostCard
              post={{
                ...post,
                likes: Array.isArray(post.likes)
                  ? post.likes.length
                  : 0,
                isLiked: user
                  ? post.likes.includes(user.id)
                  : false,
              }}
            />
          </motion.div>
        ))}

        {loading && posts.length > 0 && (
          <p className="text-center py-6 text-muted-foreground text-sm">
            Loading more posts...
          </p>
        )}

        {!hasMore && posts.length > 0 && (
          <p className="text-center py-6 text-muted-foreground text-xs">
            You've seen all posts
          </p>
        )}
      </div>
    </div>
  );
};

export default Index;
