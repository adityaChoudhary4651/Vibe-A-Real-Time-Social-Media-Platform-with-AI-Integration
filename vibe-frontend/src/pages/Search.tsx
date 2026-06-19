import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Search as SearchIcon, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { PostCard } from "@/components/feed/PostCard";
import { useAuth } from "@/contexts/AuthContext";

import { useSearchUsers, useSearchPosts } from "@/hooks/useSearch";

/* ================= TYPES ================= */

interface SearchUser {
  _id: string;
  username: string;
  avatar?: string;
}

interface SearchPost {
  _id: string;
  mediaUrl: string;
  caption?: string;
  author?: {
    _id?: string;
    username?: string;
    avatar?: string;
  };
  likes?: string[];
}

/* ================= DEFAULT HASHTAG ================= */

const DEFAULT_HASHTAG = "#vibe"; 

/* ================= COMPONENT ================= */

export default function Search() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [query, setQuery] = useState<string>("#vibe");
  const [selectedHashtag, setSelectedHashtag] = useState<string | null>(null);
  const [activeFeedIndex, setActiveFeedIndex] = useState<number | null>(null);

  const isHashtag = query.startsWith("#");
  const postRefs = useRef<(HTMLDivElement | null)[]>([]);

  /* sync typed hashtag */
  useEffect(() => {
    if (query.startsWith("#")) {
      setSelectedHashtag(query);
    } else {
      setSelectedHashtag(null);
    }
  }, [query]);

  useEffect(() => {
    if (activeFeedIndex !== null && postRefs.current[activeFeedIndex]) {
      setTimeout(() => {
        postRefs.current[activeFeedIndex]?.scrollIntoView({ block: "start", behavior: "auto" });
      }, 50);
    }
  }, [activeFeedIndex]);

  const { data: users = [] } = useSearchUsers(
    !isHashtag ? query : ""
  ) as { data: SearchUser[] };

  const { data: posts = [] } = useSearchPosts(
    isHashtag ? query : ""
  ) as { data: SearchPost[] };

  const handleClear = () => {
    setQuery("");
    setSelectedHashtag(null);
  };

  const handleUserClick = (username: string) => {
    navigate(`/profile/${username}`);
  };

  const handleImageClick = (url: string) => {
    setSelectedImage(url);
  };

  const handleDefaultHashtagClick = () => {
    setQuery(DEFAULT_HASHTAG);
  };

  const hashtagPosts = selectedHashtag ? posts : null;

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden">
      {/* Search input */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm p-3 sm:p-4 border-b border-border">
        <div className="relative">
          <SearchIcon className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search users or hashtags..."
            className="pl-10 sm:pl-12 pr-10 h-10 sm:h-11 text-sm sm:text-base"
          />
          {query && (
            <button
              onClick={handleClear}
              className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="p-3 sm:p-4">
        {/* Default hashtag (only when empty) */}
        {query === "" && (
          <div className="mb-4">
            <button
              onClick={handleDefaultHashtagClick}
              className="px-3 py-1 rounded-full bg-secondary text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition"
            >
              {DEFAULT_HASHTAG}
            </button>
          </div>
        )}

        <AnimatePresence mode="wait">
          {selectedHashtag ? (
            <motion.div
              key="hashtag"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold">
                    {selectedHashtag}
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {posts.length.toLocaleString()} posts
                  </p>
                </div>
                <Button variant="secondary" size="sm" onClick={handleClear}>
                  Clear
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-px bg-border rounded-lg overflow-hidden">
                {hashtagPosts?.map((post, index) => (
                  <motion.button
                    key={post._id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => setActiveFeedIndex(index)}
                    className={cn(
                      "aspect-square relative overflow-hidden bg-muted",
                      index === 0 && "col-span-2 row-span-2"
                    )}
                  >
                    <img
                      src={post.mediaUrl}
                      alt=""
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ) : query ? (
            <motion.div
              key="users"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-1"
            >
              {users.length > 0 ? (
                users.map((user) => (
                  <motion.div
                    key={user._id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/50"
                  >
                    <button
                      onClick={() => handleUserClick(user.username)}
                      className="flex items-center gap-3 flex-1 min-w-0"
                    >
                      <Avatar className="h-11 w-11 sm:h-12 sm:w-12">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>
                          {user.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="font-semibold truncate">
                          {user.username}
                        </p>
                      </div>
                    </button>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <p className="text-sm">No users found for "{query}"</p>
                </div>
              )}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {/* Scrollable Explore Feed */}
      <Dialog open={activeFeedIndex !== null} onOpenChange={() => setActiveFeedIndex(null)}>
        <DialogContent className="max-w-[100vw] max-h-[100vh] md:max-w-2xl md:max-h-[90vh] w-full h-full p-0 overflow-y-auto bg-background/95 backdrop-blur-xl">
          <div className="flex flex-col p-4 space-y-6">
            <div className="flex justify-between items-center sticky top-0 bg-background/95 z-10 py-2 border-b border-border">
              <h3 className="font-bold text-lg">Explore Feed</h3>
              <Button variant="ghost" size="icon" onClick={() => setActiveFeedIndex(null)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="space-y-8 pb-12">
              {posts.map((post: any, idx) => (
                <div
                  key={post._id}
                  ref={(el) => {
                    postRefs.current[idx] = el;
                  }}
                  className="w-full border border-border/40 rounded-xl bg-card/40 overflow-hidden"
                >
                  <PostCard
                    post={{
                      ...post,
                      likes: Array.isArray(post.likes) ? post.likes.length : 0,
                      isLiked: user ? post.likes?.includes(user.id) : false,
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
