import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Image,
  Film,
  Camera,
  Upload,
  X,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { uploadStory } from "@/api/stories";
import { API_BASE_URL } from "../config";

/* ======================
   TYPES
====================== */
type MediaType = "photo" | "reel" | "story";
type Visibility = "public" | "private";

const mediaTypes = [
  { id: "photo" as MediaType, icon: Image, label: "Photo" },
  { id: "reel" as MediaType, icon: Film, label: "Reel" },
  { id: "story" as MediaType, icon: Camera, label: "Story" },
];

const reelCategories = [
  "Funny",
  "Sad",
  "Dance",
  "Music",
  "Food",
  "Travel",
];

export default function Create() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [mediaType, setMediaType] = useState<MediaType>("photo");
  const [caption, setCaption] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("public");

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);

  const [category, setCategory] = useState("");

  const canShare =
    mediaType === "story"
      ? Boolean(selectedFile)
      : Boolean(selectedFile || caption.trim());

  /* ======================
     CLEANUP PREVIEW
  ====================== */
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const clearSelected = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setSelectedFile(null);
    setCategory("");
  };

  /* ======================
     FILE SELECT
  ====================== */
  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  /* ======================
     SHARE HANDLER
  ====================== */
  const handleShare = async () => {
    if (!token) {
      toast.error("You must be logged in");
      return;
    }

    /* -------- STORY -------- */
    if (mediaType === "story") {
      if (!selectedFile) {
        toast.error("Select a file for story");
        return;
      }

      try {
        setIsSharing(true);
        await uploadStory(selectedFile, token);
        toast.success("Story uploaded 🎉");

        clearSelected();
        queryClient.invalidateQueries({ queryKey: ["stories"] });
        navigate("/");
      } catch {
        toast.error("Story upload failed");
      } finally {
        setIsSharing(false);
      }
      return;
    }

    /* -------- REEL VALIDATION -------- */
    if (mediaType === "reel" && !category) {
      toast.error("Please select a reel category");
      return;
    }

    try {
      setIsSharing(true);

      const formData = new FormData();

     if (selectedFile) {
  if (mediaType === "reel") {
    formData.append("media", selectedFile); // ✅ MUST match uploadReel.single("video")
  } else {
    formData.append("image", selectedFile); // ✅ posts unchanged
  }
}

      // ✅ CRITICAL FIX (DO NOT REMOVE)
      formData.append(
        "type",
        mediaType === "reel" ? "reel" : "post"
      );

      if (caption) formData.append("caption", caption);

      formData.append(
        "visibility",
        visibility === "public" ? "Public" : "Private"
      );

      if (mediaType === "reel") {
        formData.append("category", category);
      }

      const endpoint =
        mediaType === "reel"
          ? `${API_BASE_URL}/api/reels`
          : `${API_BASE_URL}/api/posts`;

      await axios.post(endpoint, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      toast.success(
        mediaType === "reel"
          ? "Reel posted 🎬"
          : "Post shared ✨"
      );

      clearSelected();
      setCaption("");
      setVisibility("public");

      queryClient.invalidateQueries({
        queryKey: mediaType === "reel" ? ["reels"] : ["posts"],
      });

      navigate("/");
    } catch {
      toast.error("Upload failed");
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col p-3 overflow-hidden">
      <div className="flex-1 flex flex-col max-w-lg mx-auto w-full">
        <h1 className="text-xl font-bold text-center mb-3">
          Create
        </h1>

        <Card className="flex-1 flex flex-col p-4 overflow-hidden">
          <div className="flex-1 overflow-y-auto space-y-4">
            {/* MEDIA TYPE */}
            <div className="flex bg-secondary/50 rounded-lg p-1">
              {mediaTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => {
                    setMediaType(type.id);
                    setCategory("");
                  }}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm",
                    mediaType === type.id
                      ? "bg-background shadow"
                      : "text-muted-foreground"
                  )}
                >
                  <type.icon className="h-4 w-4" />
                  {type.label}
                </button>
              ))}
            </div>

            {/* UPLOAD */}
            <AnimatePresence>
              {previewUrl ? (
                <motion.div className="relative aspect-[16/10] rounded-xl overflow-hidden">
                  {mediaType === "reel" ? (
                    <video
                      src={previewUrl}
                      className="w-full h-full object-cover"
                      controls
                    />
                  ) : (
                    <img
                      src={previewUrl}
                      className="w-full h-full object-cover"
                    />
                  )}

                  <button
                    onClick={clearSelected}
                    disabled={isSharing}
                    className="absolute top-2 right-2 bg-background/80 rounded-full p-1"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </motion.div>
              ) : (
                <label className="aspect-[16/10] border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer">
                  <Upload className="h-6 w-6" />
                  <p className="text-sm mt-1">Tap to upload</p>
                  <input
                    type="file"
                    accept={
                      mediaType === "reel"
                        ? "video/*"
                        : "image/*"
                    }
                    hidden
                    disabled={isSharing}
                    onChange={(e) =>
                      e.target.files &&
                      handleFileSelect(e.target.files[0])
                    }
                  />
                </label>
              )}
            </AnimatePresence>

            {/* REEL CATEGORY */}
            {mediaType === "reel" && (
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2 border rounded-lg"
              >
                <option value="">Select Reel Category</option>
                {reelCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            )}

            {/* CAPTION */}
            {mediaType !== "story" && (
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Write a caption..."
                className="w-full min-h-[90px] p-3 border rounded-lg resize-none"
                disabled={isSharing}
              />
            )}
          </div>

          {/* SHARE */}
          <Button
            onClick={handleShare}
            disabled={!canShare || isSharing}
            className="mt-3"
          >
            {isSharing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Sharing...
              </>
            ) : mediaType === "story" ? (
              "Share to Story"
            ) : mediaType === "reel" ? (
              "Share Reel"
            ) : (
              "Share Post"
            )}
          </Button>
        </Card>
      </div>
    </div>
  );
}
