import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Trash2, Star, BellOff, LogOut } from "lucide-react";
import { toast } from "sonner";

interface ChatActionMenuProps {
  type: "message" | "community";
  itemId: string;
  itemName: string;
  onAction?: (action: string, itemId: string) => void;
  isMuted?: boolean;
  isFavorite?: boolean;
}

export function ChatActionMenu({
  type,
  itemId,
  itemName,
  onAction,
  isMuted,
  isFavorite,
}: ChatActionMenuProps) {
  const [open, setOpen] = useState(false);

  const handleAction = (action: string) => {
    onAction?.(action, itemId);
    setOpen(false);
    
    const actionLabels: Record<string, string> = {
      delete: type === "message" ? "Chat deleted" : "Left community",
      favorite: isFavorite ? "Removed from favorites" : "Added to favorites",
      mute: isMuted ? `${itemName} unmuted` : `${itemName} muted`,
      leave: `Left ${itemName}`,
    };
    
    toast.success(actionLabels[action] || "Action completed");
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity touch-manipulation"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreVertical className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {type === "message" ? (
          <>
            <DropdownMenuItem onClick={() => handleAction("favorite")} className="gap-2">
              <Star className={`h-4 w-4 ${isFavorite ? "fill-yellow-500 text-yellow-500" : ""}`} />
              {isFavorite ? "Remove favorite" : "Set as favorite"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAction("mute")} className="gap-2">
              <BellOff className={`h-4 w-4 ${isMuted ? "text-red-500 fill-red-500" : ""}`} />
              {isMuted ? "Unmute conversation" : "Mute conversation"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => handleAction("delete")} 
              className="gap-2 text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              Delete chat
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuItem onClick={() => handleAction("mute")} className="gap-2">
              <BellOff className="h-4 w-4" />
              Mute community
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => handleAction("leave")} 
              className="gap-2 text-destructive focus:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              Leave community
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
