import { useState, useRef } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { X, Image, Camera, Upload } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { uploadStory } from "@/api/stories";

interface AddStorySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStoryAdded?: () => void;
}

export function AddStorySheet({
  open,
  onOpenChange,
  onStoryAdded,
}: AddStorySheetProps) {
  const { token } = useAuth();

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ======================
     FILE SELECT
  ====================== */
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (selected.type.startsWith("video") && selected.size > 20 * 1024 * 1024) {
      toast.error("Story video must be under 20MB");
      return;
    }

    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    e.target.value = ""; // allow reselect same file
  };

  /* ======================
     UPLOAD STORY
  ====================== */
  const handlePost = async () => {
    if (!file || !token) return;

    try {
      setIsUploading(true);
      await uploadStory(file, token);

      toast.success("Story uploaded 🎉");
      onStoryAdded?.();
      setFile(null);
      setPreview(null);
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload story");
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setFile(null);
    setPreview(null);
    onOpenChange(false);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[90vh] rounded-t-3xl p-0 border-t border-border"
      >
        {/* FILE INPUT (MUST NOT BE INSIDE ANIMATIONS) */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={handleFileSelect}
        />

        <div className="flex flex-col h-full">
          {/* HEADER */}
          <SheetHeader className="px-4 py-3 border-b border-border">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="icon" onClick={handleCancel}>
                <X className="h-5 w-5" />
              </Button>
              <SheetTitle>Add to Story</SheetTitle>
              <div className="w-10" />
            </div>
          </SheetHeader>

          {/* CONTENT */}
          <div className="flex-1 overflow-hidden">
            <AnimatePresence mode="wait">
              {!preview ? (
                /* PICKER */
                <motion.div
                  key="picker"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full flex flex-col items-center justify-center gap-6 p-6"
                >
                  <h3 className="text-lg font-medium">Create your story</h3>
                  <p className="text-sm text-muted-foreground">
                    Share a moment with your followers
                  </p>

                  <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
                    <button
                      onClick={triggerFileInput}
                      className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-secondary/50 hover:bg-secondary"
                    >
                      <Image className="h-7 w-7" />
                      <span>Gallery</span>
                    </button>

                    <button
                      onClick={triggerFileInput}
                      className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-secondary/50 hover:bg-secondary"
                    >
                      <Camera className="h-7 w-7" />
                      <span>Camera</span>
                    </button>
                  </div>
                </motion.div>
              ) : (
                /* PREVIEW */
                <motion.div
                  key="preview"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full flex flex-col overflow-hidden"
                >
                  {/* PREVIEW AREA (SCROLLABLE) */}
                  <div className="flex-1 bg-black relative overflow-auto">
                    {file?.type.startsWith("video") ? (
                      <video
                        src={preview}
                        controls
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <img
                        src={preview}
                        className="w-full h-full object-contain"
                      />
                    )}

                    <button
                      onClick={triggerFileInput}
                      className="absolute top-4 left-4 p-2 rounded-full bg-black/50 text-white"
                    >
                      <Upload className="h-5 w-5" />
                    </button>
                  </div>

                  {/* FOOTER (ALWAYS VISIBLE) */}
                  <div className="p-4 flex gap-3 border-t border-border shrink-0">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={handleCancel}
                      disabled={isUploading}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={handlePost}
                      disabled={isUploading}
                    >
                      {isUploading ? "Uploading..." : "Share to Story"}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
