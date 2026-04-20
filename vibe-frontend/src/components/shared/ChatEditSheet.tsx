import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, VolumeX, Archive, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface Chat {
  id: string;
  user: { username: string; avatar: string };
}

interface ChatEditSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chats: Chat[];
}

export function ChatEditSheet({ open, onOpenChange, chats }: ChatEditSheetProps) {
  const [selectedChats, setSelectedChats] = useState<Set<string>>(new Set());

  const toggleChat = (id: string) => {
    setSelectedChats((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleAction = (action: string) => {
    if (selectedChats.size === 0) {
      toast.error("Select at least one chat");
      return;
    }
    toast.success(`${action} ${selectedChats.size} chat(s)`);
    setSelectedChats(new Set());
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[70vh] rounded-t-3xl">
        <SheetHeader className="pb-4">
          <SheetTitle>Edit Chats</SheetTitle>
        </SheetHeader>

        {/* Actions */}
        <div className="flex gap-2 mb-4 pb-4 border-b border-border">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleAction("Deleted")}
            disabled={selectedChats.size === 0}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleAction("Muted")}
            disabled={selectedChats.size === 0}
          >
            <VolumeX className="h-4 w-4 mr-2" />
            Mute
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleAction("Archived")}
            disabled={selectedChats.size === 0}
          >
            <Archive className="h-4 w-4 mr-2" />
            Archive
          </Button>
        </div>

        {/* Chat list */}
        <div className="space-y-2 max-h-[calc(70vh-180px)] overflow-y-auto">
          {chats.map((chat, index) => (
            <motion.button
              key={chat.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => toggleChat(chat.id)}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/50 transition-colors"
            >
              <Checkbox checked={selectedChats.has(chat.id)} />
              <Avatar className="h-12 w-12">
                <AvatarImage src={chat.user.avatar} />
                <AvatarFallback>{chat.user.username.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="font-medium flex-1 text-left">{chat.user.username}</span>
              {selectedChats.has(chat.id) && (
                <CheckCircle className="h-5 w-5 text-primary" />
              )}
            </motion.button>
          ))}
        </div>

        <div className="absolute bottom-6 left-0 right-0 px-6">
          <p className="text-sm text-muted-foreground text-center">
            {selectedChats.size} selected
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}