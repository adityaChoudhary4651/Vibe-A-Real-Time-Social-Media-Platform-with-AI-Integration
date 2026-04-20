import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Copy, Mail, MessageCircle, Send, Link2, Facebook, Twitter } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

const shareOptions = [
  { id: "copy", icon: Link2, label: "Copy Link", color: "bg-secondary" },
  { id: "message", icon: MessageCircle, label: "Message", color: "bg-primary" },
  { id: "email", icon: Mail, label: "Email", color: "bg-secondary" },
  { id: "twitter", icon: Twitter, label: "Twitter", color: "bg-[#1DA1F2]" },
  { id: "facebook", icon: Facebook, label: "Facebook", color: "bg-[#1877F2]" },
];

const recentUsers = [
  { id: "1", username: "sarah_j", avatar: "" },
  { id: "2", username: "mike_photo", avatar: "" },
  { id: "3", username: "travel_emma", avatar: "" },
  { id: "4", username: "art_luna", avatar: "" },
  { id: "5", username: "foodie_em", avatar: "" },
];

interface ShareSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShareSheet({ open, onOpenChange }: ShareSheetProps) {
  const handleShare = (option: string) => {
    if (option === "copy") {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    } else {
      toast.success(`Shared via ${option}!`);
    }
    onOpenChange(false);
  };

  const handleShareToUser = (username: string) => {
    toast.success(`Sent to ${username}!`);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-center">Share</SheetTitle>
        </SheetHeader>

        {/* Recent users */}
        <div className="mb-6">
          <p className="text-sm text-muted-foreground mb-3">Send to</p>
          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
            {recentUsers.map((user, index) => (
              <motion.button
                key={user.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleShareToUser(user.username)}
                className="flex flex-col items-center gap-2 min-w-[64px]"
              >
                <Avatar className="h-14 w-14">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="text-xs truncate w-full text-center">{user.username}</span>
              </motion.button>
            ))}
          </div>
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