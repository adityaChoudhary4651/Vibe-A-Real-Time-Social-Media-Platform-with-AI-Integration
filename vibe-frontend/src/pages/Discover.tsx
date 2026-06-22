import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, Heart, Star, MapPin, Sparkles, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { cn } from "@/lib/utils";
import { fetchDiscoveryUsers, toggleFollow } from "@/api/users";
import { useEffect } from "react";
import { toast } from "sonner";
import { resolveUrl } from "../config";

interface DiscoverProfile {
  id: string;
  name: string;
  username: string;
  age: number;
  location: string;
  bio: string;
  images: string[];
  interests: string[];
  mutualFriends: number;
}

const genderFilters = ["All", "Male", "Female", "Non-binary"];

/* =====================
   SUB-COMPONENT: CARD
   ===================== */

interface DiscoverCardProps {
  profile: DiscoverProfile;
  direction: "left" | "right" | null;
  onSwipe: (dir: "left" | "right") => void;
}

function DiscoverCard({ profile, direction, onSwipe }: DiscoverCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const nopeOpacity = useTransform(x, [-100, 0], [1, 0]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.x > 100) {
      onSwipe("right");
    } else if (info.offset.x < -100) {
      onSwipe("left");
    }
  };

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentImageIndex < profile.images.length - 1) {
      setCurrentImageIndex((prev) => prev + 1);
    }
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentImageIndex > 0) {
      setCurrentImageIndex((prev) => prev - 1);
    }
  };

  return (
    <motion.div
      key={profile.id}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      style={{ x, rotate }}
      onDragEnd={handleDragEnd}
      animate={
        direction === "left"
          ? { x: -500, opacity: 0 }
          : direction === "right"
          ? { x: 500, opacity: 0 }
          : { scale: 1, opacity: 1 }
      }
      initial={{ scale: 0.95, opacity: 0 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 cursor-grab active:cursor-grabbing"
    >
      <Card className="h-full overflow-hidden relative">
        {/* Image carousel */}
        <div className="relative w-full h-full">
          <AnimatePresence mode="wait">
            <motion.img
              key={currentImageIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              src={profile.images[currentImageIndex]}
              alt={profile.name}
              className="w-full h-full object-cover"
              draggable={false}
            />
          </AnimatePresence>

          {/* Image indicators */}
          {profile.images.length > 1 && (
            <div className="absolute top-2 left-2 right-2 flex gap-1">
              {profile.images.map((_, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "flex-1 h-1 rounded-full transition-colors",
                    idx === currentImageIndex ? "bg-white" : "bg-white/40"
                  )}
                />
              ))}
            </div>
          )}

          {/* Navigation buttons */}
          {profile.images.length > 1 && (
            <>
              {currentImageIndex > 0 && (
                <button
                  onClick={prevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/30 backdrop-blur-sm text-white hover:bg-background/50 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center z-10"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
              )}
              {currentImageIndex < profile.images.length - 1 && (
                <button
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/30 backdrop-blur-sm text-white hover:bg-background/50 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center z-10"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              )}
            </>
          )}

          {/* Tap areas */}
          {profile.images.length > 1 && (
            <>
              <div onClick={prevImage} className="absolute left-0 top-0 w-1/4 h-1/2 cursor-pointer z-[5]" />
              <div onClick={nextImage} className="absolute right-0 top-0 w-1/4 h-1/2 cursor-pointer z-[5]" />
            </>
          )}
        </div>

        {/* Like/Nope indicators */}
        <motion.div style={{ opacity: likeOpacity }} className="absolute top-6 left-6 rotate-[-20deg]">
          <div className="px-3 py-1.5 border-4 border-green-500 rounded-lg">
            <span className="text-2xl font-black text-green-500">LIKE</span>
          </div>
        </motion.div>
        <motion.div style={{ opacity: nopeOpacity }} className="absolute top-6 right-6 rotate-[20deg]">
          <div className="px-3 py-1.5 border-4 border-destructive rounded-lg">
            <span className="text-2xl font-black text-destructive">NOPE</span>
          </div>
        </motion.div>

        {/* Gradient overlay */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-background via-background/80 to-transparent" />

        {/* Info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
          <div>
            <h2 className="text-xl font-bold">{profile.name}</h2>
            <div className="flex items-center gap-1 text-muted-foreground">
              <span className="text-xs">@{profile.username}</span>
            </div>
          </div>
          <p className="text-xs text-foreground/80 line-clamp-2">{profile.bio}</p>
        </div>
      </Card>
    </motion.div>
  );
}

/* =====================
   MAIN COMPONENT
   ===================== */

export default function Discover() {
  const [profiles, setProfiles] = useState<DiscoverProfile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [genderFilter, setGenderFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [direction, setDirection] = useState<"left" | "right" | null>(null);

  const currentProfile = profiles[currentIndex];

  const handleSwipe = async (swipeDirection: "left" | "right", isSuper = false) => {
    if (!currentProfile) return;

    if (swipeDirection === "right") {
      try {
        await toggleFollow(currentProfile.username);
        if (isSuper) {
          toast.success(`Super Liked and Followed ${currentProfile.username}! 🌟`);
        } else {
          toast.success(`Followed ${currentProfile.username}`);
        }
      } catch (err) {
        toast.error("Follow failed");
      }
    }

    setDirection(swipeDirection);
    setTimeout(() => {
      if (currentIndex < profiles.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        setProfiles([]);
      }
      setDirection(null);
    }, 300);
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      loadDiscovery();
    }, 450);
    return () => clearTimeout(handler);
  }, [genderFilter, searchQuery]);

  const loadDiscovery = async () => {
    try {
      setIsLoading(true);
      setCurrentIndex(0);
      const data = await fetchDiscoveryUsers(genderFilter, searchQuery);
      const transformed: DiscoverProfile[] = data.map((u: any) => ({
        id: u._id,
        name: u.name,
        username: u.username,
        age: u.age || 21,
        location: u.location || "Nearby",
        bio: u.bio || "No bio available",
        images: u.avatar ? [resolveUrl(u.avatar)] : ["https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=600&fit=crop"],
        interests: u.interests && u.interests.length > 0 ? u.interests : ["Vibe"],
        mutualFriends: 0
      }));
      setProfiles(transformed);
    } catch (err) {
      toast.error("Failed to load users");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col p-3 overflow-hidden">
      {/* Search Input Box */}
      <div className="relative mb-3 flex-shrink-0 max-w-[320px] mx-auto w-full">
        <span className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none opacity-60">
          <Search className="h-4 w-4 text-muted-foreground" />
        </span>
        <input
          type="text"
          placeholder="Search by username or name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-9 py-2 rounded-full text-xs font-medium focus:outline-none transition-all duration-300 bg-secondary/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute inset-y-0 right-3.5 flex items-center opacity-65 hover:opacity-100"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Gender filter - Compact */}
      <div className="flex gap-2 mb-3 overflow-x-auto scrollbar-hide flex-shrink-0 justify-center">
        {genderFilters.map((filter) => (
          <Button
            key={filter}
            variant={genderFilter === filter ? "default" : "secondary"}
            size="sm"
            onClick={() => setGenderFilter(filter)}
            className="rounded-full whitespace-nowrap h-8 text-xs px-3 touch-manipulation"
          >
            {filter}
          </Button>
        ))}
      </div>

      {/* Main card stack or placeholder */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center min-h-0">
          <div className="text-center animate-pulse">
            <Sparkles className="h-10 w-10 text-primary mx-auto mb-4 animate-spin duration-3000" />
            <p className="text-sm font-semibold">Finding Vibes...</p>
          </div>
        </div>
      ) : !currentProfile ? (
        <div className="flex-1 flex items-center justify-center min-h-0">
          <div className="text-center p-4">
            <Sparkles className="h-10 w-10 text-primary mx-auto mb-3 opacity-60" />
            <h3 className="text-sm font-bold mb-1">
              {searchQuery ? "No matching profiles found" : "That's everyone!"}
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              {searchQuery ? "Try typing a different username or name" : "Check back later for new people"}
            </p>
            <Button size="sm" onClick={() => { searchQuery ? setSearchQuery("") : loadDiscovery(); }} className="rounded-full">
              {searchQuery ? "Clear Search" : "Refresh Discover"}
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Card stack - Takes remaining space */}
          <div className="flex-1 flex items-center justify-center min-h-0">
            <div className="relative w-full max-w-[320px] h-full max-h-[420px]">
              <AnimatePresence>
                {currentProfile && (
                  <DiscoverCard
                    key={currentProfile.id}
                    profile={currentProfile}
                    direction={direction}
                    onSwipe={handleSwipe}
                  />
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Action buttons - Fixed at bottom, always visible */}
          <div className="flex items-center justify-center gap-4 py-3 flex-shrink-0">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => handleSwipe("left")}
              className="h-14 w-14 rounded-full bg-card border border-border shadow-card flex items-center justify-center hover:bg-secondary transition-colors min-w-[56px] min-h-[56px] touch-manipulation active:bg-secondary"
            >
              <X className="h-7 w-7 text-muted-foreground" />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => handleSwipe("right")}
              className="h-16 w-16 rounded-full bg-gradient-primary shadow-glow flex items-center justify-center min-w-[64px] min-h-[64px] touch-manipulation active:opacity-90"
            >
              <Heart className="h-8 w-8 text-primary-foreground fill-primary-foreground" />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => handleSwipe("right", true)}
              className="h-14 w-14 rounded-full bg-card border border-border shadow-card flex items-center justify-center hover:bg-secondary transition-colors min-w-[56px] min-h-[56px] touch-manipulation active:bg-secondary"
            >
              <Star className="h-7 w-7 text-accent" />
            </motion.button>
          </div>
        </>
      )}
    </div>
  );
}