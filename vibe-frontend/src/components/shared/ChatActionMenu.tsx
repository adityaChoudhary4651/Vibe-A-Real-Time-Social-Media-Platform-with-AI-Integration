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
}

export function ChatActionMenu({ type, itemId, itemName, onAction }: ChatActionMenuProps) {
  const [open, setOpen] = useState(false);

  const handleAction = (action: string) => {
    onAction?.(action, itemId);
    setOpen(false);
    
    const actionLabels: Record<string, string> = {
      delete: type === "message" ? "Chat deleted" : "Left community",
      favorite: "Added to favorites",
      mute: `${itemName} muted`,
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
              <Star className="h-4 w-4" />
              Set as favorite
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAction("mute")} className="gap-2">
              <BellOff className="h-4 w-4" />
              Mute conversation
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
