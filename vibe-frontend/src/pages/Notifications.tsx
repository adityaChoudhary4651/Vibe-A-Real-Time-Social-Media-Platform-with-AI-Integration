import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Heart,
  MessageCircle,
  UserPlus,
  Loader2,
  Check,
  CheckCheck,
  Users
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/api/notifications";
import { getPublicProfile } from "@/api/profile";
import { useAuth } from "@/contexts/AuthContext";
import { resolveUrl } from "../config";
import { useQuery, useQueryClient } from "@tanstack/react-query";

/* ======================
   TYPES
   ====================== */
type NotificationType = "like" | "comment" | "follow";

interface Notification {
  _id: string;
  type: NotificationType;
  sender: {
    username: string;
    avatar: string;
  };
  post?: {
    _id: string;
    mediaUrl: string;
  };
  isRead: boolean;
  createdAt: string;
}

const filters = ["All", "Likes", "Comments", "Follows"];

export default function Notifications() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeFilter, setActiveFilter] = useState("All");
  const [loading, setLoading] = useState(true);

  // Hover states for right-side preview
  const [hoveredUser, setHoveredUser] = useState<any | null>(null);
  const [hoveredProfileDetails, setHoveredProfileDetails] = useState<any | null>(null);

  // Nightmode state tracking
  const isDarkState = () => localStorage.getItem("vibe_theme") === "dark";
  const [isDark, setIsDark] = useState(isDarkState);

  /* ======================
     THEME OBSERVER
     ====================== */
  useEffect(() => {
    const handleThemeChange = () => {
      setIsDark(isDarkState());
    };
    window.addEventListener("themeChange", handleThemeChange);
    return () => window.removeEventListener("themeChange", handleThemeChange);
  }, []);

  const queryClient = useQueryClient();

  /* ======================
     REACT QUERY FETCHING
     ===================== */
  const { data: notificationsData = [], isLoading: isNotificationsLoading } = useQuery<Notification[]>({
    queryKey: ["notifications"],
    queryFn: getNotifications,
    enabled: !!user,
  });

  const { data: profilePreviewData } = useQuery({
    queryKey: ["publicProfile", hoveredUser?.username],
    queryFn: async () => {
      try {
        return await getPublicProfile(hoveredUser!.username, user!.token!);
      } catch (err) {
        console.error("Failed to load profile preview:", err);
        return {
          bio: "Vibe Creator • Passionate photographer & storyteller 📷✨",
          followers: [],
          following: [],
          followersCount: 1420,
          followingCount: 382
        };
      }
    },
    enabled: !!hoveredUser && !!user?.token,
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });

  // Sync state values
  useEffect(() => {
    setLoading(isNotificationsLoading);
    if (notificationsData) {
      setNotifications(notificationsData);
    }
  }, [notificationsData, isNotificationsLoading]);

  useEffect(() => {
    if (profilePreviewData) {
      setHoveredProfileDetails(profilePreviewData);
    } else if (!hoveredUser) {
      setHoveredProfileDetails(null);
    }
  }, [profilePreviewData, hoveredUser]);

  /* ======================
     HELPERS
     ====================== */
  const getIcon = (type: NotificationType) => {
    switch (type) {
      case "like":
        return <Heart className="h-3 w-3 fill-[#8B5E3C] text-[#8B5E3C]" />;
      case "comment":
        return <MessageCircle className="h-3 w-3 text-[#8B5E3C]" />;
      case "follow":
        return <UserPlus className="h-3 w-3 text-[#8B5E3C]" />;
    }
  };

  const getText = (n: Notification) => {
    if (n.type === "like") return "liked your post";
    if (n.type === "comment") return "commented on your post";
    if (n.type === "follow") return "started following you";
    return "";
  };

  const formatTime = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  /* ======================
     FILTERING
     ===================== */
  const filteredNotifications = useMemo(() => {
    if (activeFilter === "All") return notifications;

    return notifications.filter((n) => {
      if (activeFilter === "Likes") return n.type === "like";
      if (activeFilter === "Comments") return n.type === "comment";
      if (activeFilter === "Follows") return n.type === "follow";
      return true;
    });
  }, [activeFilter, notifications]);

  /* ======================
     HANDLERS
     ===================== */
  const handleClick = async (n: Notification) => {
    if (!n.isRead) {
      await markNotificationRead(n._id);
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      setNotifications((prev) =>
        prev.map((x) =>
          x._id === n._id ? { ...x, isRead: true } : x
        )
      );
    }

    if (n.type === "follow") {
      navigate(`/profile/${n.sender.username}`);
    } else if (n.post) {
      navigate(`/post/${n.post._id}`);
    }
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead();
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, isRead: true }))
    );
  };

  // Dynamic Theme Colors
  const themeCard = isDark ? "bg-[#2A1D16]" : "bg-[#FFFDF9]";
  const themeBorder = isDark ? "border-[#3D2A1F]" : "border-[#E3D8C8]";
  const themeTextPrimary = isDark ? "text-[#F5F0E8]" : "text-[#5A3A22]";
  const themeTextSecondary = isDark ? "text-[#D2C5B4]" : "text-[#8B5E3C]";

  // Safely grab nested profile values
  const profileDetails = hoveredProfileDetails?.user || hoveredProfileDetails;

  return (
    <div className={cn(
      "w-full h-full flex flex-col lg:flex-row gap-5 p-3 md:p-4.5 lg:p-5 overflow-hidden select-none transition-colors duration-300",
      isDark ? "bg-[#1F140E] text-[#F5F0E8]" : "bg-[#F8F4EE] text-[#5A3A22]"
    )}>
      
      {/* 1. LEFT PANEL: Centered Notifications Card */}
      <Card variant="outline" className={cn(
        "flex-1 rounded-[24px] border p-5 flex flex-col h-full min-h-0 overflow-hidden relative transition-colors duration-300",
        themeCard, themeBorder
      )}>
        
        {/* Header */}
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
          <div>
            <h1 className={cn("text-3xl font-extrabold font-serif tracking-tight leading-none mb-1 transition-colors duration-300", themeTextPrimary)}>
              Notifications
            </h1>
            <p className={cn("text-xs font-semibold opacity-90 transition-colors duration-300", themeTextSecondary)}>
              Stay updated with your social vibe.
            </p>
          </div>

          {notifications.some((n) => !n.isRead) && (
            <button
              onClick={handleMarkAllRead}
              className={cn(
                "text-xs font-bold py-1.5 px-4 rounded-full border transition-all active:scale-95 flex items-center gap-1.5",
                isDark
                  ? "bg-[#3D2A1F] border-[#3D2A1F] text-[#F5F0E8]"
                  : "bg-[#FFFDF9] border-[#8B5E3C]/15 text-[#8B5E3C] hover:bg-[#8B5E3C] hover:text-[#FFFDF9] hover:border-[#8B5E3C]"
              )}
            >
              <CheckCheck className="h-3.5 w-3.5 stroke-[2.5]" />
              Mark all as read
            </button>
          )}
        </div>

        {/* Filters pills row */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none flex-shrink-0">
          {filters.map((filter) => {
            const isActive = activeFilter === filter;
            return (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={cn(
                  "py-1.5 px-3.5 rounded-full text-xs font-bold transition-all duration-200 border-none active:scale-95",
                  isActive
                    ? (isDark ? "bg-[#3D2A1F] text-[#F5F0E8]" : "bg-[#8B5E3C] text-white")
                    : (isDark ? "bg-transparent text-[#D2C5B4] hover:bg-[#3D2A1F]/30" : "bg-transparent text-[#8B5E3C] hover:bg-[#F2E8DC]/40")
                )}
              >
                {filter}
              </button>
            );
          })}
        </div>

        {/* Notifications list */}
        <div className="flex-1 overflow-y-auto pr-1 mt-3 space-y-2.5 scrollbar-none">
          {loading ? (
            <div className="flex justify-center p-8"><Loader2 className={cn("animate-spin", themeTextSecondary)} /></div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-4">
              <div className={cn("h-16 w-16 rounded-full flex items-center justify-center mb-4 border border-dashed", themeBorder)}>
                <Heart className={cn("h-6 w-6", themeTextSecondary)} />
              </div>
              <h3 className={cn("text-lg font-extrabold font-serif mb-1", themeTextPrimary)}>
                No notifications yet
              </h3>
              <p className={cn("text-xs font-semibold leading-normal max-w-xs", themeTextSecondary)}>
                When someone interacts with your content, you'll see it here.
              </p>
            </div>
          ) : (
            <div className="relative">
              <AnimatePresence mode="popLayout" initial={false}>
                {filteredNotifications.map((n, index) => {
                  const unread = !n.isRead;
                  return (
                    <motion.div
                      key={n._id}
                      layout
                      initial={{ opacity: 0, y: 12, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, x: -16, scale: 0.98 }}
                      transition={{ type: "spring", stiffness: 260, damping: 25 }}
                      onClick={() => handleClick(n)}
                      onMouseEnter={() => setHoveredUser(n.sender)}
                      onMouseLeave={() => setHoveredUser(null)}
                      className={cn(
                        "flex items-center gap-3.5 p-3 rounded-[20px] transition-colors cursor-pointer border mb-2.5 last:mb-0",
                        unread
                          ? (isDark ? "bg-[#3D2A1F]/50 border-[#3D2A1F]" : "bg-[#F2E8DC]/40 border-[#8B5E3C]/10")
                          : (isDark ? "bg-transparent border-transparent hover:bg-[#3D2A1F]/30" : "bg-transparent border-transparent hover:bg-[#F2E8DC]/20")
                      )}
                    >
                      {/* User profile picture with type indicator badge */}
                      <div 
                        className="relative flex-shrink-0 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/profile/${n.sender.username}`);
                        }}
                      >
                        <Avatar className="h-11 w-11 border border-[#8B5E3C]/10">
                          <AvatarImage src={resolveUrl(n.sender.avatar)} />
                          <AvatarFallback className={themeTextSecondary}>
                            {n.sender.username.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className={cn(
                          "absolute -bottom-1 -right-1 h-5 w-5 rounded-full flex items-center justify-center border-2",
                          isDark ? "bg-[#2A1D16] border-[#1F140E]" : "bg-[#FFFDF9] border-[#F8F4EE]"
                        )}>
                          {getIcon(n.type)}
                        </div>
                      </div>

                      {/* Text description */}
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-xs font-semibold">
                          <span 
                            className={cn("font-extrabold hover:underline cursor-pointer", themeTextPrimary)}
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/profile/${n.sender.username}`);
                            }}
                          >
                            {n.sender.username}
                          </span>{" "}
                          <span className={cn("opacity-80", themeTextPrimary)}>
                            {getText(n)}
                          </span>
                        </p>
                        <p className={cn("text-[10px] font-semibold mt-0.5", themeTextSecondary)}>
                          {formatTime(n.createdAt)}
                        </p>
                      </div>

                      {/* Post picture attachment thumbnail if applicable */}
                      {n.post?.mediaUrl && (
                        <img
                          src={resolveUrl(n.post.mediaUrl)}
                          alt=""
                          className={cn("h-11 w-11 rounded-lg object-cover flex-shrink-0 border", themeBorder)}
                        />
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>

      </Card>

      {/* 2. RIGHT PANEL: Small Profile Preview Card */}
      <div className="w-full lg:w-[280px] shrink-0 h-fit select-none hidden lg:block">
        <Card variant="outline" className={cn(
          "w-full rounded-[24px] border p-0 overflow-hidden transition-colors duration-300 relative min-h-[240px] flex flex-col justify-start",
          themeCard, themeBorder
        )}>
          <AnimatePresence mode="wait">
            {hoveredUser ? (
              <motion.div
                key="preview"
                layout
                initial={{ opacity: 0, y: 8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.97 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="flex flex-col text-left w-full h-full"
              >
                {/* Header Banner Background */}
                <div className={cn(
                  "h-16 w-full relative border-b",
                  isDark ? "bg-[#3D2A1F]/30 border-[#3D2A1F]" : "bg-[#8B5E3C]/10 border-[#8B5E3C]/10"
                )} />
                
                {/* Profile details block */}
                <div className="px-4 pb-4 pt-0 flex flex-col relative">
                  
                  {/* Avatar overlapping banner */}
                  <div className="absolute -top-7 left-4">
                    <Avatar className="h-14 w-14 border-4 border-[#FFFDF9] dark:border-[#2A1D16] shadow-sm">
                      <AvatarImage src={resolveUrl(hoveredUser.avatar)} />
                      <AvatarFallback>{hoveredUser.username.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </div>
                  
                  {/* Spacer */}
                  <div className="h-8" />
                  
                  {/* Username */}
                  <h3 className={cn("text-sm font-extrabold leading-tight", themeTextPrimary)}>
                    {hoveredUser.username}
                  </h3>
                  <p className={cn("text-[10px] font-semibold leading-none mt-0.5", themeTextSecondary)}>
                    @{hoveredUser.username}
                  </p>
                  
                  {/* Bio */}
                  <p className={cn("text-xs font-semibold mt-2.5 leading-normal", themeTextPrimary)}>
                    {profileDetails?.bio || "Vibe Creator • Passionate photographer & storyteller 📷✨"}
                  </p>
                  
                  {/* Metrics */}
                  <div className="flex gap-4 mt-3.5 pt-3.5 border-t border-[#8B5E3C]/8 dark:border-[#3D2A1F]">
                    <div>
                      <p className={cn("text-xs font-extrabold leading-none", themeTextPrimary)}>
                        {profileDetails?.followers?.length !== undefined 
                          ? profileDetails.followers.length 
                          : (profileDetails?.followersCount !== undefined ? profileDetails.followersCount : "0")}
                      </p>
                      <p className={cn("text-[9px] font-bold uppercase tracking-wider leading-none mt-1", themeTextSecondary)}>
                        Followers
                      </p>
                    </div>
                    <div>
                      <p className={cn("text-xs font-extrabold leading-none", themeTextPrimary)}>
                        {profileDetails?.following?.length !== undefined 
                          ? profileDetails.following.length 
                          : (profileDetails?.followingCount !== undefined ? profileDetails.followingCount : "0")}
                      </p>
                      <p className={cn("text-[9px] font-bold uppercase tracking-wider leading-none mt-1", themeTextSecondary)}>
                        Following
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="placeholder"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.18 }}
                className="p-6 flex flex-col items-center justify-center text-center min-h-[240px] w-full"
              >
                <div className={cn("h-12 w-12 rounded-full flex items-center justify-center mb-3 border border-dashed", themeBorder)}>
                  <Users className={cn("h-5 w-5", themeTextSecondary)} />
                </div>
                <p className={cn("text-xs font-bold leading-normal", themeTextPrimary)}>
                  Hover a profile
                </p>
                <p className={cn("text-[10px] font-semibold leading-normal mt-1 max-w-[160px]", themeTextSecondary)}>
                  Move your cursor over a notification profile to preview details.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </div>

    </div>
  );
}
