import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Check, Loader2, UserPlus } from "lucide-react";
import { fetchDiscoveryUsers, toggleFollow } from "@/api/users";
import { toast } from "sonner";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface SuggestedUser {
  _id: string;
  username: string;
  name: string;
  avatar?: string;
  bio?: string;
}

export function SuggestedUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<SuggestedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [followingStatus, setFollowingStatus] = useState<Record<string, "idle" | "loading" | "following">>({});

  useEffect(() => {
    loadSuggestions();
  }, []);

  const loadSuggestions = async () => {
    try {
      setLoading(true);
      const data = await fetchDiscoveryUsers();
      setUsers(data.slice(0, 5)); // Limit to top 5
    } catch (err) {
      console.error("Failed to load suggestions");
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (userId: string, username: string) => {
    try {
      setFollowingStatus(prev => ({ ...prev, [userId]: "loading" }));
      const result = await toggleFollow(username);
      
      if (result.isFollowing) {
        setFollowingStatus(prev => ({ ...prev, [userId]: "following" }));
        toast.success(`Following ${username}`);
      } else {
        setFollowingStatus(prev => ({ ...prev, [userId]: "idle" }));
      }
    } catch (err) {
      toast.error("Action failed");
      setFollowingStatus(prev => ({ ...prev, [userId]: "idle" }));
    }
  };

  const handleUserClick = (username: string) => {
    navigate(`/profile/${username}`);
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-4 py-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 animate-pulse">
            <div className="h-10 w-10 rounded-full bg-secondary" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-20 bg-secondary rounded" />
              <div className="h-2 w-16 bg-secondary rounded" />
            </div>
            <div className="h-8 w-16 bg-secondary rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="py-4 text-center">
        <p className="text-xs text-muted-foreground">No suggestions right now</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <AnimatePresence mode="popLayout">
        {users.map((user, index) => {
          const status = followingStatus[user._id] || "idle";
          
          return (
            <motion.div
              key={user._id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: index * 0.05, duration: 0.2 }}
              className="flex items-center gap-3 group"
            >
              <button
                onClick={() => handleUserClick(user.username)}
                className="flex-shrink-0 transition-transform duration-200 hover:scale-105 active:scale-95"
              >
                <Avatar className="h-10 w-10 border border-border">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback className="bg-gradient-primary text-primary-foreground text-[10px]">
                    {user.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </button>

              <button
                onClick={() => handleUserClick(user.username)}
                className="flex-1 min-w-0 text-left hover:opacity-80 transition-opacity"
              >
                <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
                  {user.username}
                </p>
                <p className="text-[10px] text-muted-foreground truncate">
                   {user.name}
                </p>
              </button>

              <motion.div whileTap={{ scale: 0.95 }}>
                <Button
                  variant={status === "following" ? "secondary" : "default"}
                  size="sm"
                  disabled={status === "loading"}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFollow(user._id, user.username);
                  }}
                  className={cn(
                    "text-[10px] font-bold h-7 px-3 rounded-full transition-all duration-200",
                    status === "idle" && "bg-primary hover:bg-primary/90 shadow-glow-sm"
                  )}
                >
                  {status === "loading" ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : status === "following" ? (
                    <span className="flex items-center gap-1"><Check className="h-3 w-3" /> Following</span>
                  ) : (
                    "Follow"
                  )}
                </Button>
              </motion.div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}