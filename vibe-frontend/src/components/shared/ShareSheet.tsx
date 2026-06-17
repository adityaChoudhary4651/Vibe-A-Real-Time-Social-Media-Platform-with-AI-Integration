import { useEffect, useState } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Mail, MessageCircle, Link2, Facebook, Twitter, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { fetchFollowers } from "@/api/profile";
import { createConversation } from "@/api/conversations";
import { sendMessage } from "@/api/messages";

const shareOptions = [
  { id: "copy", icon: Link2, label: "Copy Link", color: "bg-secondary" },
  { id: "message", icon: MessageCircle, label: "Message", color: "bg-primary" },
  { id: "email", icon: Mail, label: "Email", color: "bg-secondary" },
  { id: "twitter", icon: Twitter, label: "Twitter", color: "bg-[#1DA1F2]" },
  { id: "facebook", icon: Facebook, label: "Facebook", color: "bg-[#1877F2]" },
];

interface ShareSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShareSheet({ open, onOpenChange }: ShareSheetProps) {
  const { user, token } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && user?.username && token) {
      setLoading(true);
      fetchFollowers(user.username, token)
        .then(setUsers)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [open, user, token]);

  const handleShare = (option: string) => {
    if (option === "copy") {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    } else {
      toast.success(`Shared via ${option}!`);
    }
    onOpenChange(false);
  };

  const handleShareToUser = async (targetUserId: string, username: string) => {
    try {
      const conv = await createConversation(targetUserId);
      const shareLink = window.location.href;
      await sendMessage(conv._id, `Check this out: ${shareLink}`);
      toast.success(`Sent to ${username}!`);
    } catch (err) {
      toast.error("Failed to share in chat");
    }
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-center">Share</SheetTitle>
        </SheetHeader>

        {/* Recent/Followed users */}
        <div className="mb-6">
          <p className="text-sm text-muted-foreground mb-3">Send to followers</p>
          {loading ? (
            <div className="flex justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : users.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2 italic text-center">
              No followers found to share with
            </p>
          ) : (
            <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
              {users.map((follower, index) => (
                <motion.button
                  key={follower._id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleShareToUser(follower._id, follower.username)}
                  className="flex flex-col items-center gap-2 min-w-[64px]"
                >
                  <Avatar className="h-14 w-14">
                    <AvatarImage src={follower.avatar} />
                    <AvatarFallback>{follower.username.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="text-xs truncate w-full text-center">{follower.username}</span>
                </motion.button>
              ))}
            </div>
          )}
        </div>

        {/* Share options */}
        <div className="grid grid-cols-5 gap-4">
          {shareOptions.map((option, index) => (
            <motion.button
              key={option.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => handleShare(option.id)}
              className="flex flex-col items-center gap-2"
            >
              <div className={`h-12 w-12 rounded-full ${option.color} flex items-center justify-center`}>
                <option.icon className="h-5 w-5 text-foreground" />
              </div>
              <span className="text-xs text-muted-foreground">{option.label}</span>
            </motion.button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}