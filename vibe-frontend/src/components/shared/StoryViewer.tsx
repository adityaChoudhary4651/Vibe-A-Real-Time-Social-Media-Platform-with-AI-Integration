import { useState, useEffect } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Trash2,
} from "lucide-react";
import { BackendStory } from "@/types/story";
import { useAuth } from "@/contexts/AuthContext";
import { API_BASE_URL } from "../../config";
import axios from "axios";

/* ======================
   TIME FORMATTER
====================== */
function formatStoryTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();

  const isToday = date.toDateString() === now.toDateString();

  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.toDateString() === yesterday.toDateString();

  const time = date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (isToday) return `Today, ${time}`;
  if (isYesterday) return `Yesterday, ${time}`;

  return (
    date.toLocaleDateString([], {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }) + `, ${time}`
  );
}

/* ======================
   COMPONENT
====================== */
type Props = {
  stories: BackendStory[];
  canDelete: boolean;
  onDelete?: (storyId: string) => void;
  onClose: () => void;
};

export function StoryViewer({
  stories,
  canDelete,
  onDelete,
  onClose,
}: Props) {
  const { token } = useAuth();
  const [index, setIndex] = useState(0);
  const story = stories[index];

  useEffect(() => {
    if (!token || !story?._id) return;
    axios
      .put(
        `${API_BASE_URL}/api/stories/${story._id}/view`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .catch((err) => {
        console.error("Error viewing story:", err);
      });
  }, [story?._id, token]);

  if (!story) return null;

  const mediaSrc = story.mediaUrl;     // 🔒 NO PREFIXING
  const avatarSrc = story.user.avatar || "";

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
      {/* BACKDROP */}
      <div
        className="absolute inset-0 bg-black/90"
        onClick={onClose}
      />

      {/* STORY CARD */}
      <div className="relative z-10 w-full max-w-md h-[92vh] bg-black rounded-xl overflow-hidden shadow-2xl">

        {/* HEADER */}
        <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/80 to-transparent">
          <div className="flex items-center gap-3">
            {/* AVATAR */}
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt="profile"
                className="h-9 w-9 rounded-full object-cover"
              />
            ) : (
              <div className="h-9 w-9 rounded-full bg-zinc-700 flex items-center justify-center text-white text-sm font-medium">
                {story.user.username.charAt(0).toUpperCase()}
              </div>
            )}

            {/* USERNAME + TIME */}
            <div className="flex flex-col">
              <span className="text-sm text-white font-medium">
                {story.user.username}
              </span>
              <span className="text-xs text-white/60">
                {formatStoryTime(story.createdAt)}
              </span>
            </div>
          </div>

          {/* ACTIONS */}
          <div className="flex items-center gap-3">
            {canDelete && (
              <button
                onClick={() => onDelete?.(story._id)}
                className="text-red-400 hover:text-red-500 transition"
                title="Delete story"
              >
                <Trash2 size={20} />
              </button>
            )}

            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition"
            >
              <X size={22} />
            </button>
          </div>
        </div>

        {/* MEDIA */}
        <div className="w-full h-full flex items-center justify-center">
          {story.mediaType === "image" ? (
            <img
              src={mediaSrc}
              className="max-h-full max-w-full object-contain"
            />
          ) : (
            <video
              src={mediaSrc}
              autoPlay
              muted
              playsInline
              className="max-h-full max-w-full object-contain"
            />
          )}
        </div>

        {/* NAVIGATION */}
        {index > 0 && (
          <button
            onClick={() => setIndex((i) => i - 1)}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
          >
            <ChevronLeft size={36} />
          </button>
        )}

        {index < stories.length - 1 && (
          <button
            onClick={() => setIndex((i) => i + 1)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
          >
            <ChevronRight size={36} />
          </button>
        )}
      </div>
    </div>
  );
}
