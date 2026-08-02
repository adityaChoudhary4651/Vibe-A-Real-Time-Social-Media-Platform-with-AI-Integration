import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { API_BASE_URL } from "../config";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Heart,
  MessageCircle,
  Send,
  Volume2,
  VolumeX,
  DollarSign,
  X,
  SlidersHorizontal,
  MoreVertical,
  Trash2,
} from "lucide-react";
import { motion, PanInfo } from "framer-motion";
import { CommentsSheet } from "@/components/shared/CommentsSheet";
import { ShareSheet } from "@/components/shared/ShareSheet";
import { TipModal } from "@/components/shared/TipModal";
import { toast } from "sonner";

/* ======================
   TYPES
====================== */
type Reel = {
  _id: string;
  mediaUrl: string;
  caption: string;
  category: string;
  likes: string[];
  views?: number;
  commentsCount?: number;
  author: {
    _id: string;
    username: string;
    avatar?: string;
  };
};

/* ======================
   CONSTANTS
====================== */
const BASE_URL = `${API_BASE_URL}/`;

const reelCategories = [
  "All",
  "Funny",
  "Motivational",
  "Happy",
  "Sad",
  "Dance",
  "Music",
  "Food",
  "Travel",
];

const resolveUrl = (url: string) =>
  url.startsWith("http") ? url : `${BASE_URL}${url.replace(/\\/g, "/")}`;

/* ======================
   COMPONENT
====================== */
export default function Reels() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const filterUser = params.get("user"); // 👈 from profile
  const reelIdParam = params.get("reelId");
  const videoRef = useRef<HTMLVideoElement>(null);

  const [reels, setReels] = useState<Reel[]>([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [currentReel, setCurrentReel] = useState(0);

  const [isMuted, setIsMuted] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showTip, setShowTip] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [fetchingMore, setFetchingMore] = useState(false);

  const queryClient = useQueryClient();

  const { data: reelsData, isLoading: isReelsLoading } = useQuery<Reel[]>({
    queryKey: ["reels", activeCategory, filterUser, reelIdParam, page],
    queryFn: async () => {
      const query = new URLSearchParams();
      query.set("category", activeCategory);
      query.set("page", page.toString());
      query.set("limit", "5");
      if (filterUser) query.set("user", filterUser);

      const res = await axios.get(`${API_BASE_URL}/api/reels?${query.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      let loadedReels = res.data;
      if (page === 1 && reelIdParam) {
        const exists = loadedReels.some((r: any) => r._id === reelIdParam);
        if (!exists) {
          try {
            const singleRes = await axios.get(`${API_BASE_URL}/api/posts/${reelIdParam}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (singleRes.data && singleRes.data.type === "reel") {
              loadedReels = [singleRes.data, ...loadedReels];
            }
          } catch (err) {
            console.error("Error fetching single reel:", err);
          }
        } else {
          const selectedIdx = loadedReels.findIndex((r: any) => r._id === reelIdParam);
          if (selectedIdx > -1) {
            const selectedItem = loadedReels[selectedIdx];
            loadedReels = [selectedItem, ...loadedReels.filter((r: any) => r._id !== reelIdParam)];
          }
        }
      }
      return loadedReels;
    },
    enabled: !!token,
    staleTime: 1000 * 60 * 5,
  });

  // Sync state values
  useEffect(() => {
    if (reelsData) {
      if (page === 1) {
        setReels(reelsData);
        setCurrentReel(0);
      } else {
        setReels((prev) => {
          const existingIds = new Set(prev.map((r) => r._id));
          const newReels = reelsData.filter((r: Reel) => !existingIds.has(r._id));
          return [...prev, ...newReels];
        });
      }
      setHasMore(reelsData.length === 5);
    }
  }, [reelsData, page]);

  useEffect(() => {
    setFetchingMore(isReelsLoading);
  }, [isReelsLoading]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [activeCategory, filterUser, reelIdParam]);



  // Infinite scroll trigger: load next page when viewing the second-to-last reel
  useEffect(() => {
    if (reels.length > 0 && currentReel >= reels.length - 2 && hasMore && !fetchingMore) {
      setPage((p) => p + 1);
    }
  }, [currentReel, reels.length, hasMore, fetchingMore]);

  const reel = reels[currentReel];
  const activeReelId = reel?._id;

  // View Counter Effect
  useEffect(() => {
    if (activeReelId && token) {
      axios.put(`${API_BASE_URL}/api/posts/${activeReelId}/view`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(() => {
        setReels((prev) =>
          prev.map((r) =>
            r._id === activeReelId ? { ...r, views: (r.views || 0) + 1 } : r
          )
        );
        queryClient.invalidateQueries({ queryKey: ["reels"] });
        queryClient.invalidateQueries({ queryKey: ["posts"] });
      }).catch((err) => {
        console.error("Failed to increment views:", err);
      });
    }
  }, [activeReelId, token]);

  /* ======================
     SWIPE
  ====================== */
  const handleDragEnd = (
    _: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    if (info.offset.y < -60 && currentReel < reels.length - 1) {
      setCurrentReel((p) => p + 1);
    } else if (info.offset.y > 60 && currentReel > 0) {
      setCurrentReel((p) => p - 1);
    }
  };

  /* ======================
     LIKE
  ====================== */
  const handleLike = async () => {
    if (!reel || !user) return;

    try {
      const res = await axios.put(
        `${API_BASE_URL}/api/posts/${reel._id}/like`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const isLikedNow = res.data.isLiked;

      setReels((prev) =>
        prev.map((r, i) => {
          if (i !== currentReel) return r;

          let updatedLikes = [...(r.likes || [])];
          if (isLikedNow) {
            if (!updatedLikes.includes(user.id)) {
              updatedLikes.push(user.id);
            }
          } else {
            updatedLikes = updatedLikes.filter((id) => id !== user.id);
          }

          return { ...r, likes: updatedLikes };
        })
      );
      queryClient.invalidateQueries({ queryKey: ["reels"] });
    } catch (error) {
      console.error("Failed to like reel:", error);
      toast.error("Failed to update like status");
    }
  };

  /* ======================
     DELETE REEL
  ====================== */
  const handleDelete = async () => {
    if (!reel) return;

    try {
      await axios.delete(
        `${API_BASE_URL}/api/posts/${reel._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Reel deleted");

      setReels((prev) => prev.filter((r) => r._id !== reel._id));
      setCurrentReel((i) => Math.max(0, i - 1));
      queryClient.invalidateQueries({ queryKey: ["reels"] });
    } catch {
      toast.error("Failed to delete reel");
    } finally {
      setShowMenu(false);
    }
  };

  /* ======================
     SOUND
  ====================== */
  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  if (!reel) {
    return (
      <div className="h-screen flex items-center justify-center text-muted-foreground">
        No reels found
      </div>
    );
  }

  const isMyReel = user?.id === reel.author._id;

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* TOP BAR */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between p-4 bg-gradient-to-b from-black/70 to-transparent">
        <button onClick={() => navigate(-1)}>
          <X className="h-6 w-6 text-white" />
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCategoryPicker(true)}
            className="flex items-center gap-2 text-white"
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span className="text-sm">{activeCategory}</span>
          </button>

          <button onClick={() => setShowMenu(true)}>
            <MoreVertical className="h-5 w-5 text-white" />
          </button>
        </div>
      </div>

      {/* REEL */}
      <div className="flex-1 relative flex items-center justify-center">
        <motion.div
          key={reel._id}
          drag="y"
          onDragEnd={handleDragEnd}
          className="absolute inset-0 lg:static lg:aspect-[9/16] lg:max-w-[420px] overflow-hidden"
        >
          <video
            ref={videoRef}
            src={resolveUrl(reel.mediaUrl)}
            className="w-full h-full object-cover bg-black"
            autoPlay
            muted={isMuted}
            loop
            playsInline
            preload="metadata"
          />

          {/* CAPTION */}
          <div className="absolute bottom-6 left-4 right-20 space-y-2 z-30">
            <Link
              to={`/profile/${reel.author.username}`}
              className="flex items-center gap-3 hover:opacity-85 transition-opacity inline-flex"
            >
              <Avatar className="h-10 w-10 border border-white/30">
                <AvatarImage src={reel.author.avatar} />
                <AvatarFallback>
                  {reel.author.username[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <p className="text-white font-semibold">
                @{reel.author.username}
              </p>
            </Link>

            {reel.caption && reel.caption.trim() !== "" && (
              <div className="bg-black/30 backdrop-blur-sm rounded-lg px-3 py-2">
                <p className="text-sm text-white">{reel.caption}</p>
              </div>
            )}
          </div>

          {/* ACTIONS */}
          <div className="absolute right-4 bottom-24 z-30 flex flex-col items-center gap-5">
            {(() => {
              const isLiked = user && reel.likes?.includes(user.id);
              return (
                <div className="flex flex-col items-center gap-1">
                  <button onClick={handleLike} aria-label="Like reel">
                    <Heart
                      className={`h-6 w-6 transition-colors duration-200 ${
                        isLiked ? "fill-red-500 text-red-500 animate-pulse" : "text-white"
                      }`}
                    />
                  </button>
                  <span className="text-xs text-white font-semibold drop-shadow">
                    {reel.likes?.length || 0}
                  </span>
                </div>
              );
            })()}

            <div className="flex flex-col items-center gap-1">
              <button onClick={() => setShowComments(true)}>
                <MessageCircle className="h-6 w-6 text-white" />
              </button>
              <span className="text-xs text-white font-semibold drop-shadow">
                {reel.commentsCount || 0}
              </span>
            </div>

            <button onClick={() => setShowShare(true)}>
              <Send className="h-6 w-6 text-white" />
            </button>

            <button onClick={() => setShowTip(true)}>
              <DollarSign className="h-6 w-6 text-white" />
            </button>

            <button onClick={toggleMute}>
              {isMuted ? (
                <VolumeX className="h-6 w-6 text-white" />
              ) : (
                <Volume2 className="h-6 w-6 text-white" />
              )}
            </button>
          </div>
        </motion.div>
      </div>

      {/* 3 DOT MENU */}
      {showMenu && (
        <div className="absolute inset-0 bg-black/60 z-50 flex items-center justify-center">
          <div className="bg-zinc-900 rounded-xl w-64 p-3 space-y-2">
            <button
              onClick={() => {
                setShowShare(true);
                setShowMenu(false);
              }}
              className="w-full py-2 rounded-lg text-white hover:bg-white/10"
            >
              Share
            </button>

           
              <button
                onClick={handleDelete}
                className="w-full py-2 rounded-lg text-red-500 hover:bg-white/10 flex items-center justify-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
           

            <button
              onClick={() => setShowMenu(false)}
              className="w-full py-2 rounded-lg text-white/70 hover:bg-white/10"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* CATEGORY PICKER */}
      {showCategoryPicker && (
        <div className="absolute inset-0 bg-black/70 z-50 flex items-center justify-center">
          <div className="bg-zinc-900 rounded-xl w-72 p-3 space-y-2">
            {reelCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setActiveCategory(cat);
                  setShowCategoryPicker(false);
                }}
                className={`w-full py-2 rounded-lg ${
                  activeCategory === cat
                    ? "bg-white text-black"
                    : "text-white hover:bg-white/10"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* MODALS */}
      <CommentsSheet
        open={showComments}
        onOpenChange={setShowComments}
        postId={reel._id}
        onCommentAdded={(count) => {
          setReels((prev) =>
            prev.map((r, i) =>
              i === currentReel ? { ...r, commentsCount: count } : r
            )
          );
        }}
      />
      <ShareSheet open={showShare} onOpenChange={setShowShare} postId={reel._id} />
      <TipModal
        open={showTip}
        onOpenChange={setShowTip}
        creatorName={reel.author.username}
      />
    </div>
  );
}
