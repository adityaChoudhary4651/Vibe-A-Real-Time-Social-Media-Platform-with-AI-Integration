import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { useAuth } from "@/contexts/AuthContext";
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
const BASE_URL = "http://localhost:5000/";

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

  /* ======================
     FETCH REELS
  ====================== */
  useEffect(() => {
    if (!token) return;

    const query = new URLSearchParams();
    query.set("category", activeCategory);
    if (filterUser) query.set("user", filterUser);

    axios
      .get(`http://localhost:5000/api/reels?${query.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setReels(res.data);
        setCurrentReel(0);
      })
      .catch(() => setReels([]));
  }, [activeCategory, filterUser, token]);

  const reel = reels[currentReel];

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
    if (!reel) return;

    const res = await axios.put(
      `http://localhost:5000/api/posts/${reel._id}/like`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );

    setReels((prev) =>
      prev.map((r, i) =>
        i === currentReel
          ? { ...r, likes: Array(res.data.likesCount).fill("x") }
          : r
      )
    );
  };

  /* ======================
     DELETE REEL
  ====================== */
  const handleDelete = async () => {
    if (!reel) return;

    try {
      await axios.delete(
        `http://localhost:5000/api/posts/${reel._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Reel deleted");

      setReels((prev) => prev.filter((r) => r._id !== reel._id));
      setCurrentReel((i) => Math.max(0, i - 1));
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
         <div className="absolute bottom-6 left-4 right-20 space-y-2 z-20">

            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border border-white/30">
                <AvatarImage src={reel.author.avatar} />
                <AvatarFallback>
                  {reel.author.username[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <p className="text-white font-semibold">
                @{reel.author.username}
              </p>
            </div>

            <div className="bg-black/30 backdrop-blur-sm rounded-lg px-3 py-2">
              <p className="text-sm text-white">{reel.caption}</p>
            </div>
          </div>

          {/* ACTIONS */}
          <div className="absolute right-4 bottom-24 z-20 flex flex-col items-center gap-5">
            <button onClick={handleLike}>
              <Heart className="h-6 w-6 text-white" />
            </button>

            <button onClick={() => setShowComments(true)}>
              <MessageCircle className="h-6 w-6 text-white" />
            </button>

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
      />
      <ShareSheet open={showShare} onOpenChange={setShowShare} />
      <TipModal
        open={showTip}
        onOpenChange={setShowTip}
        creatorName={reel.author.username}
      />
    </div>
  );
}
