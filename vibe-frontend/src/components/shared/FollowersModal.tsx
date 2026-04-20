import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface User {
  id: string;
  username: string;
  name: string;
  avatar?: string;
  isFollowing?: boolean;
}

interface FollowersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "followers" | "following";
  users: User[];
}

const mockFollowers: User[] = [
  { id: "1", username: "sarah_johnson", name: "Sarah Johnson", isFollowing: true },
  { id: "2", username: "mike_chen", name: "Mike Chen", isFollowing: false },
  { id: "3", username: "emma_davis", name: "Emma Davis", isFollowing: true },
  { id: "4", username: "alex_rivera", name: "Alex Rivera", isFollowing: true },
  { id: "5", username: "luna_martinez", name: "Luna Martinez", isFollowing: false },
  { id: "6", username: "sam_wilson", name: "Sam Wilson", isFollowing: true },
  { id: "7", username: "maya_patel", name: "Maya Patel", isFollowing: false },
  { id: "8", username: "chris_taylor", name: "Chris Taylor", isFollowing: true },
];

const mockFollowing: User[] = [
  { id: "1", username: "photography_daily", name: "Photography Daily", isFollowing: true },
  { id: "2", username: "travel_mike", name: "Travel Mike", isFollowing: true },
  { id: "3", username: "foodie_emma", name: "Foodie Emma", isFollowing: true },
  { id: "4", username: "fitness_alex", name: "Fitness Alex", isFollowing: true },
  { id: "5", username: "nature_vibes", name: "Nature Vibes", isFollowing: true },
];

export function FollowersModal({ open, onOpenChange, type }: FollowersModalProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [followingStatus, setFollowingStatus] = useState<Record<string, boolean>>({});

  const users = type === "followers" ? mockFollowers : mockFollowing;
  
  const filteredUsers = users.filter((user) =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleFollow = (userId: string, currentStatus: boolean) => {
    setFollowingStatus((prev) => ({
      ...prev,
      [userId]: prev[userId] !== undefined ? !prev[userId] : !currentStatus,
    }));
  };

  const getFollowStatus = (user: User) => {
    return followingStatus[user.id] !== undefined 
      ? followingStatus[user.id] 
      : user.isFollowing;
  };

  const handleUserClick = (username: string) => {
    onOpenChange(false);
    navigate(`/profile/${username}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 gap-0">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="text-center">
            {type === "followers" ? "Followers" : "Following"}
          </DialogTitle>
        </DialogHeader>
        
        <div className="px-4 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="pl-10 h-10 bg-secondary/50"
            />
          </div>
        </div>

        <ScrollArea className="h-[400px] px-4 pb-4">
          <AnimatePresence mode="popLayout">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user, index) => {
                const isFollowing = getFollowStatus(user);
                
                return (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: index * 0.03 }}
                    className="flex items-center gap-3 py-2.5 group"
                  >
                    <button
                      onClick={() => handleUserClick(user.username)}
                      className="flex items-center gap-3 flex-1 min-w-0 text-left"
                    >
                      <Avatar className="h-11 w-11 transition-transform duration-200 group-hover:scale-105">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback className="bg-gradient-primary text-primary-foreground text-sm font-medium">
                          {user.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
                          {user.username}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {user.name}
                        </p>
                      </div>
                    </button>
                    
                    <motion.div whileTap={{ scale: 0.95 }}>
                      <Button
                        variant={isFollowing ? "secondary" : "default"}
                        size="sm"
                        onClick={() => handleToggleFollow(user.id, user.isFollowing || false)}
                        className="text-xs min-w-[90px] h-8 touch-manipulation"
                      >
                        <AnimatePresence mode="wait">
                          <motion.span
                            key={isFollowing ? "following" : "follow"}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            className="flex items-center gap-1"
                          >
                            {isFollowing ? (
                              <>
                                <Check className="h-3 w-3" />
                                Following
                              </>
                            ) : (
                              "Follow"
                            )}
                          </motion.span>
                        </AnimatePresence>
                      </Button>
                    </motion.div>
                  </motion.div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-muted-foreground text-sm">No users found</p>
              </div>
            )}
          </AnimatePresence>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
