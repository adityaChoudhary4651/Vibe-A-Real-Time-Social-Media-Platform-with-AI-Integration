import { StoriesBar } from "@/components/stories/StoriesBar";
import { PostCard } from "@/components/feed/PostCard";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { fetchPosts } from "@/api/posts";
import { useAuth } from "@/contexts/AuthContext";

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

  const {
    data: posts = [],
    isLoading,
    isError,
  } = useQuery<FeedPost[]>({
    queryKey: ["posts"],
    queryFn: () => fetchPosts(token!),
    enabled: !!token,
  });

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden">
      {/* ✅ STORIES */}
      <StoriesBar />

      {/* ✅ FEED */}
      <div className="divide-y divide-border w-full">
        {isLoading && (
          <p className="text-center py-6 text-muted-foreground">
            Loading feed...
          </p>
        )}

        {isError && (
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
                  ? post.likes.includes(user.id) // ✅ FIX HERE
                  : false,
              }}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Index;
