import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Bookmark,
  Flag,
  EyeOff,
  Link2,
  QrCode,
  Star,
  Trash2,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface PostOptionsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isOwner: boolean;
  onDelete: () => void;
  onEdit: () => void;
}


export function PostOptionsSheet({
  open,
  onOpenChange,
  isOwner,
  onDelete,
  onEdit,
}: PostOptionsSheetProps) {
  const handleAction = (id: string, label: string) => {
    if (id === "copy") {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied!");
    } else if (id === "save") {
      toast.success("Saved!");
    } else if (id === "hide") {
      toast.success("Post hidden");
    } else if (id === "report") {
      toast("Report submitted", {
        description: "Thanks for keeping the community safe.",
      });
    }

    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-center">Options</SheetTitle>
        </SheetHeader>

        <div className="space-y-1">
                    {isOwner && (
            <motion.button
              onClick={() => {
                onOpenChange(false);
                onEdit(); // 👈 we’ll pass this
              }}
              className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-secondary/50"
            >
              ✏️ Edit
            </motion.button>
          )}

          {/* 🔴 DELETE — ONLY FOR OWNER */}
          {isOwner && (
            <motion.button
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => {
                onDelete();
                onOpenChange(false);
              }}
              className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-destructive/10 text-destructive"
            >
              <Trash2 className="h-5 w-5" />
              <span className="font-semibold">Delete</span>
            </motion.button>
          )}

          {/* NORMAL OPTIONS */}
          <motion.button
            onClick={() => handleAction("save", "Save")}
            className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-secondary/50"
          >
            <Bookmark className="h-5 w-5" />
            Save
          </motion.button>

          <motion.button
            onClick={() => handleAction("favorite", "Favorite")}
            className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-secondary/50"
          >
            <Star className="h-5 w-5" />
            Add to Favorites
          </motion.button>

          <motion.button
            onClick={() => handleAction("copy", "Copy Link")}
            className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-secondary/50"
          >
            <Link2 className="h-5 w-5" />
            Copy Link
          </motion.button>

          <motion.button
            onClick={() => handleAction("qr", "QR Code")}
            className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-secondary/50"
          >
            <QrCode className="h-5 w-5" />
            QR Code
          </motion.button>

          <motion.button
            onClick={() => handleAction("hide", "Hide")}
            className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-secondary/50"
          >
            <EyeOff className="h-5 w-5" />
            Hide
          </motion.button>

          <motion.button
            onClick={() => handleAction("report", "Report")}
            className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-secondary/50 text-destructive"
          >
            <Flag className="h-5 w-5" />
            Report
          </motion.button>

        </div>
      </SheetContent>
    </Sheet>
  );
}
