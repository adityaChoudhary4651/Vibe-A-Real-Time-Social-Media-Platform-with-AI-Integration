import { useEffect, useState, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Edit,
  Settings,
  Grid3X3,
  Film,
  Camera,
  ArrowLeft,
  MoreHorizontal,
  Bookmark,
  Tag,
  Users,
  Calendar,
  MapPin,
  Share2,
  Plus,
  SlidersHorizontal,
  Heart,
  Briefcase,
  Smile,
  Coffee,
  Rocket,
  Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { API_BASE_URL, resolveUrl } from "../config";
import axios from "axios";
import { toast } from "sonner";

import { EditProfileModal } from "@/components/shared/EditProfileModal";
import { SettingsSheet } from "@/components/shared/SettingsSheet";
import { StoryViewer } from "@/components/shared/StoryViewer";
import { CreateHighlightSheet } from "@/components/shared/CreateHighlightSheet";
import {
  getMyPosts,
  getPublicProfile,
  getPostsByUsername,
  toggleFollow,
} from "@/api/posts";
import { updateProfile } from "@/api/profile";
import { createConversation } from "@/api/conversations";
import { fetchHighlights, deleteHighlight } from "@/api/highlights";

/* =====================
   TYPES
   ===================== */
type ProfileUser = {
  username: string;
  name: string;
  bio: string;
  avatar?: string;
  coverPhoto?: string;
  gender?: string;
  age?: number;
  location?: string;
  interests?: string[];
  tipsReceived: number;
  followers: number;
  following: number;
  isFollowing?: boolean;
  _id?: string;
};

type ProfilePost = {
  _id: string;
  mediaUrl?: string;
  imageUrl?: string;
  type: "post";
  likes?: string[];
};

export default function Profile() {
  const { token, user: authUser } = useAuth();
  const { username } = useParams();
  const navigate = useNavigate();

  const isPublicProfile = Boolean(username);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [user, setUser] = useState<ProfileUser | null>(null);
  const [posts, setPosts] = useState<ProfilePost[]>([]);
  const [savedPosts, setSavedPosts] = useState<ProfilePost[]>([]);
  const [highlights, setHighlights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSaved, setLoadingSaved] = useState(false);

  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showCreateHighlight, setShowCreateHighlight] = useState(false);
  const [showViewer, setShowViewer] = useState(false);
  const [activeViewerStories, setActiveViewerStories] = useState<any[]>([]);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  const [postsPage, setPostsPage] = useState(1);
  const [postsHasMore, setPostsHasMore] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);

  // Tabs navigation
  const [activeTab, setActiveTab] = useState<"posts" | "reels" | "saved" | "tagged">("posts");

  // Suggested users list state with follow actions
  const [suggestedList, setSuggestedList] = useState([
    { username: "ary273", name: "bhatiya", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150", isFollowing: false },
    { username: "anoopb", name: "Annu", avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150", isFollowing: false },
    { username: "aditya", name: "Aditya_123", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150", isFollowing: false },
    { username: "anchal", name: "Anchal", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150", isFollowing: false },
    { username: "mannu", name: "Mannu05", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150", isFollowing: false },
  ]);

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

  /* ======================
     FETCH PROFILE
     ===================== */
  const fetchProfilePosts = async (usernameStr: string, pageNumber: number) => {
    if (!token || postsLoading) return;
    try {
      setPostsLoading(true);
      const limit = 12;
      const res = await fetch(
        `${API_BASE_URL}/api/posts/user/${usernameStr}?page=${pageNumber}&limit=${limit}&type=post`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      if (res.ok) {
        if (pageNumber === 1) {
          setPosts(data);
        } else {
          setPosts((prev) => {
            const existingIds = new Set(prev.map((p) => p._id));
            const newPosts = data.filter((p: ProfilePost) => !existingIds.has(p._id));
            return [...prev, ...newPosts];
          });
        }
        setPostsHasMore(data.length === limit);
      }
    } catch (err) {
      console.error("Error fetching profile posts:", err);
    } finally {
      setPostsLoading(false);
    }
  };

  const fetchSavedPosts = async () => {
    if (!token) return;
    try {
      setLoadingSaved(true);
      const res = await fetch(`${API_BASE_URL}/api/posts/saved`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setSavedPosts(data);
      }
    } catch (err) {
      console.error("Failed to fetch saved posts", err);
    } finally {
      setLoadingSaved(false);
    }
  };

  const loadProfile = async () => {
    if (!token) return;

    try {
      let profileData: ProfileUser;

      if (isPublicProfile && username) {
        profileData = await getPublicProfile(token, username);
      } else {
        const res = await fetch(`${API_BASE_URL}/api/users/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        profileData = await res.json();
      }

      setUser(profileData);

      // Fetch highlights
      const h = await fetchHighlights(profileData.username);
      setHighlights(h);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [token, username]);

  useEffect(() => {
    if (token && user?.username) {
      setPostsPage(1);
      setPostsHasMore(true);
      fetchProfilePosts(user.username, 1);
    }
  }, [token, user?.username]);

  // Handle Fetching Saved Posts on tab click
  useEffect(() => {
    if (token && activeTab === "saved") {
      fetchSavedPosts();
    }
  }, [token, activeTab]);

  useEffect(() => {
    const handleScroll = (e: any) => {
      if (!postsHasMore || postsLoading || !user?.username || activeTab !== "posts") return;
      const target = e.target;
      if (target.scrollHeight - target.scrollTop <= target.clientHeight + 150) {
        const nextPage = postsPage + 1;
        setPostsPage(nextPage);
        fetchProfilePosts(user.username, nextPage);
      }
    };

    const scrollContainer = document.getElementById("profile-center-scroll");
    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", handleScroll);
      return () => scrollContainer.removeEventListener("scroll", handleScroll);
    }
  }, [postsPage, postsHasMore, postsLoading, user?.username, token, activeTab]);

  /* =====================
     FOLLOW / UNFOLLOW
  ===================== */
  const handleFollow = async () => {
    if (!token || !user) return;

    const res = await toggleFollow(token, user.username);
    setUser({
      ...user,
      followers: res.followers,
      isFollowing: res.isFollowing,
    });
    toast.success(res.isFollowing ? `Following @${user.username}` : `Unfollowed @${user.username}`);
  };

  /* =====================
     MESSAGE USER
  ===================== */
  const handleMessage = async () => {
    if (!user?._id) return;

    try {
      const conversation = await createConversation(user._id);
      navigate(`/messages?conversation=${conversation._id}`);
    } catch (err) {
      console.error(err);
    }
  };

  /* =====================
     AVATAR UPLOAD
  ===================== */
  const handleAvatarChange = async (file: File) => {
    if (!token) return;

    try {
      setUploadingAvatar(true);
      const formData = new FormData();
      formData.append("avatar", file);

      const res = await axios.put(
        `${API_BASE_URL}/api/users/me/avatar`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setUser((u) => (u ? { ...u, avatar: res.data.avatar } : u));
      toast.success("Profile photo updated");
    } catch {
      toast.error("Avatar upload failed");
    } finally {
      setUploadingAvatar(false);
    }
  };

  /* =====================
     COVER PHOTO UPLOAD
  ===================== */
  const handleCoverChange = async (file: File) => {
    if (!token) return;

    try {
      setUploadingCover(true);
      const formData = new FormData();
      formData.append("cover", file);

      const res = await axios.put(
        `${API_BASE_URL}/api/users/me/cover`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setUser((u) => (u ? { ...u, coverPhoto: res.data.coverPhoto } : u));
      toast.success("Cover photo updated");
    } catch {
      toast.error("Cover photo upload failed");
    } finally {
      setUploadingCover(false);
    }
  };

  /* =====================
     HIGHLIGHT DELETION
  ===================== */
  const handleDeleteHighlight = async (id: string) => {
    try {
      await deleteHighlight(id);
      toast.success("Highlight deleted");
      setHighlights((prev) => prev.filter((h) => h._id !== id));
    } catch {
      toast.error("Failed to delete highlight");
    }
  };

  /* =====================
     DELETE OWN POST
  ===================== */
  const handleDeletePost = async (postId: string) => {
    if (!token) return;
    if (!window.confirm("Are you sure you want to delete this post?")) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/posts/${postId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success("Post deleted successfully");
        setPosts((prev) => prev.filter((p) => p._id !== postId));
        setSavedPosts((prev) => prev.filter((p) => p._id !== postId));
      } else {
        toast.error("Failed to delete post");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error deleting post");
    }
  };

  /* =====================
     FOLLOW SUGGESTED USER
  ===================== */
  const handleFollowSuggestedUser = async (sugUsername: string, index: number) => {
    if (!token) return;
    
    let nextFollowingStatus = false;
    setSuggestedList((prev) =>
      prev.map((sug, i) => {
        if (i === index) {
          nextFollowingStatus = !sug.isFollowing;
          return { ...sug, isFollowing: nextFollowingStatus };
        }
        return sug;
      })
    );

    toast.success(nextFollowingStatus ? `Followed @${sugUsername}` : `Unfollowed @${sugUsername}`);

    try {
      await toggleFollow(token, sugUsername);
    } catch (err) {
      console.warn("Suggested user follow error (expected if mock user):", err);
    }
  };

  /* =====================
     SHARE PROFILE LINK
  ===================== */
  const handleShareProfile = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Profile URL copied to clipboard!");
  };

  if (loading) return <div className="p-6 text-center text-xs font-bold">Loading profile…</div>;
  if (!user) return <div className="p-6 text-center text-xs font-bold text-red-500">Profile not found</div>;

  const isOwnProfile = authUser?.username === user.username;

  const isAdityaProfile = user.username === "aditya" || user.username === "aditya123";
  const aboutOccupation = (isOwnProfile || isAdityaProfile) ? "Developer (sometimes)" : (user.interests?.[0] || "Vibe Creator");
  const aboutHobby1 = (isOwnProfile || isAdityaProfile) ? "Anime enjoyer" : (user.interests?.[1] || "Content Explorer");
  const aboutHobby2 = (isOwnProfile || isAdityaProfile) ? "Coffee > Everything" : (user.interests?.[2] || "Creative");
  const aboutStatus = (isOwnProfile || isAdityaProfile) ? "Currently: Building Vibe" : `Loc: ${user.location || "Nearby"}`;

  // Filter which posts should display
  const displayedPosts = activeTab === "saved" ? savedPosts : posts;

  // Dynamic Theme Colors
  const themeCard = isDark ? "bg-[#2A1D16]" : "bg-[#FFFDF9]";
  const themeBorder = isDark ? "border-[#3D2A1F]" : "border-[#E3D8C8]";
  const themeTextPrimary = isDark ? "text-[#F5F0E8]" : "text-[#5A3A22]";
  const themeTextSecondary = isDark ? "text-[#D2C5B4]" : "text-[#8B5E3C]";

  return (
    <div className={cn(
      "w-full h-full flex flex-col lg:flex-row gap-5 p-3 md:p-4.5 lg:p-5 overflow-hidden select-none transition-colors duration-300",
      isDark ? "bg-[#1F140E] text-[#F5F0E8]" : "bg-[#F8F4EE] text-[#5A3A22]"
    )}>
      
      {/* ========================================================
          1. CENTER COLUMN: Creator Workspace Details (Independently scrollable)
          ======================================================== */}
      <div
        id="profile-center-scroll"
        className="flex-1 flex flex-col gap-6 overflow-y-auto pr-1 h-full scrollbar-none"
      >
        
        {/* Profile Card Header */}
        <Card variant="outline" className={cn(
          "rounded-[24px] border p-5 flex flex-col transition-colors duration-300",
          themeCard, themeBorder
        )}>
          {/* Banner cover Image */}
          <div className="relative h-[200px] w-full rounded-[20px] overflow-hidden flex-shrink-0 border border-transparent group/banner">
            <img
              src={resolveUrl(user.coverPhoto) || "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&q=80"}
              alt="Banner cover"
              className="w-full h-full object-cover transition-transform duration-500"
            />
            {/* Banner dark overlay filter */}
            <div className="absolute inset-0 bg-black/35" />
            
            {/* Mountain quote text */}
            <div className="absolute top-5 left-6 text-left text-[#FFFDF9] max-w-[280px]">
              <span className="font-serif text-3xl leading-none block h-4">“</span>
              <p className="text-[11px] font-medium leading-relaxed font-sans opacity-95">
                Building in silence,<br />Growing in public.
              </p>
            </div>

            {/* Change cover photo button overlay */}
            {isOwnProfile && (
              <>
                <button
                  onClick={() => coverInputRef.current?.click()}
                  className="absolute inset-0 bg-black/45 opacity-0 group-hover/banner:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 text-white text-xs font-extrabold border-none cursor-pointer"
                >
                  <Camera className="h-5.5 w-5.5" />
                  {uploadingCover ? "Uploading cover..." : "Change Cover Photo"}
                </button>
                <input
                  type="file"
                  ref={coverInputRef}
                  accept="image/*"
                  hidden
                  onChange={(e) =>
                    e.target.files && handleCoverChange(e.target.files[0])
                  }
                />
              </>
            )}

            {/* Banner option controls */}
            <div className="absolute top-5 right-6 flex items-center gap-2 z-10">
              {isOwnProfile && (
                <button
                  onClick={() => coverInputRef.current?.click()}
                  className="w-8.5 h-8.5 rounded-full flex items-center justify-center bg-black/45 hover:bg-black/60 text-[#FFFDF9] active:scale-95 transition-all border-none cursor-pointer"
                  title="Change Cover Image"
                >
                  <Camera className="h-4.5 w-4.5 stroke-[2.2]" />
                </button>
              )}
              <button
                onClick={handleShareProfile}
                className="w-8.5 h-8.5 rounded-full flex items-center justify-center bg-black/45 hover:bg-black/60 text-[#FFFDF9] active:scale-95 transition-all border-none cursor-pointer"
              >
                <Share2 className="h-4 w-4 stroke-[2.2]" />
              </button>
              <button
                onClick={() => setShowSettings(true)}
                className="w-8.5 h-8.5 rounded-full flex items-center justify-center bg-black/45 hover:bg-black/60 text-[#FFFDF9] active:scale-95 transition-all border-none cursor-pointer"
              >
                <MoreHorizontal className="h-4 w-4 stroke-[2.2]" />
              </button>
            </div>
          </div>

          {/* Overlapping Avatar & Metadata block */}
          <div className="flex flex-col md:flex-row md:items-end justify-between px-3.5 relative mt-[-48px] mb-2.5">
            <div className="flex items-end gap-3 text-left">
              <label className={cn("relative flex-shrink-0 block", isOwnProfile && "cursor-pointer")}>
                <Avatar className="h-24 w-24 border-4 border-[#FFFDF9] dark:border-[#2A1D16] shadow-sm">
                  <AvatarImage src={resolveUrl(user.avatar)} />
                  <AvatarFallback className="text-xl">
                    {user.username[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                {isOwnProfile ? (
                  <>
                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <Camera className="h-5 w-5 text-white" />
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      disabled={uploadingAvatar}
                      onChange={(e) =>
                        e.target.files && handleAvatarChange(e.target.files[0])
                      }
                    />
                  </>
                ) : (
                  <div className="absolute bottom-0 right-0 h-4.5 w-4.5 rounded-full bg-green-500 border-2 border-[#FFFDF9] dark:border-[#2A1D16]" />
                )}
              </label>

              <div className="pb-1">
                <div className="flex items-center">
                  <h2 className={cn("text-xl font-extrabold font-serif leading-none transition-colors duration-300", themeTextPrimary)}>
                    {user.name || user.username}
                  </h2>
                  <span className="bg-[#8B5E3C] text-white text-[9px] px-2 py-0.5 rounded-full font-bold ml-2 leading-none">
                    Vibe Creator ✨
                  </span>
                </div>
                <p className={cn("text-[10px] font-bold leading-none mt-1", themeTextSecondary)}>
                  @{user.username}
                </p>
              </div>
            </div>

            {/* Profile Action Buttons */}
            <div className="flex items-center gap-2 mt-4 md:mt-0">
              {isOwnProfile ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setShowEditProfile(true)}
                    className={cn(
                      "rounded-full text-xs font-bold py-1.5 px-5 h-9 active:scale-95 border",
                      isDark ? "bg-[#3D2A1F] border-[#3D2A1F] text-[#F5F0E8]" : "bg-transparent border-[#8B5E3C]/20 text-[#8B5E3C]"
                    )}
                  >
                    <Edit className="h-3.5 w-3.5 mr-1.5 stroke-[2.2]" />
                    Edit Profile
                  </Button>
                  <button
                    onClick={() => setShowSettings(true)}
                    className={cn(
                      "w-9 h-9 rounded-full flex items-center justify-center border active:scale-95 transition-colors cursor-pointer",
                      isDark ? "bg-[#3D2A1F] border-[#3D2A1F] text-[#D2C5B4]" : "bg-[#F2E8DC]/40 border-[#8B5E3C]/12 text-[#8B5E3C]"
                    )}
                    aria-label="Settings"
                  >
                    <Settings className="h-4.5 w-4.5 stroke-[2.2]" />
                  </button>
                </>
              ) : (
                <>
                  <Button
                    onClick={handleFollow}
                    variant="default"
                    className={cn(
                      "rounded-full text-xs font-bold py-1.5 px-6 h-9 text-white border-none active:scale-95",
                      isDark ? "bg-[#3D2A1F]" : "bg-[#8B5E3C]"
                    )}
                  >
                    {user.isFollowing ? "Unfollow" : "Follow"}
                  </Button>
                  <Button
                    onClick={handleMessage}
                    variant="outline"
                    className={cn(
                      "rounded-full text-xs font-bold py-1.5 px-5 h-9 active:scale-95 border",
                      isDark ? "bg-[#3D2A1F] border-[#3D2A1F] text-[#F5F0E8]" : "bg-transparent border-[#8B5E3C]/20 text-[#8B5E3C]"
                    )}
                  >
                    Message
                  </Button>
                  <button
                    onClick={() => setShowSettings(true)}
                    className={cn(
                      "w-9 h-9 rounded-full flex items-center justify-center border active:scale-95 transition-colors cursor-pointer",
                      isDark ? "bg-[#3D2A1F] border-[#3D2A1F] text-[#D2C5B4]" : "bg-[#F2E8DC]/40 border-[#8B5E3C]/12 text-[#8B5E3C]"
                    )}
                    aria-label="Options"
                  >
                    <MoreHorizontal className="h-4.5 w-4.5 stroke-[2.2]" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Demographic Metadata tags & bio info */}
          <div className="px-3.5 mt-3 space-y-2.5 text-left">
            <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5 text-[10px] font-bold">
              <span className={cn("flex items-center gap-1", themeTextSecondary)}>
                <Calendar className="h-3.5 w-3.5 stroke-[2.2]" />
                Age {user.age || 21}
              </span>
              <span className={cn("flex items-center gap-1", themeTextSecondary)}>
                🎂 {user.gender || "Male"}
              </span>
              <span className={cn("flex items-center gap-1", themeTextSecondary)}>
                <MapPin className="h-3.5 w-3.5 stroke-[2.2]" />
                {user.location || "even idk"}
              </span>
              <span className={cn("flex items-center gap-1", themeTextSecondary)}>
                📅 Joined May 2024
              </span>
              {user.tipsReceived > 0 && (
                <span className="text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  Tips: ${user.tipsReceived.toFixed(2)}
                </span>
              )}
            </div>

            <p className={cn("text-xs font-semibold leading-relaxed", themeTextPrimary)}>
              {user.bio || "just trying to debug this shitty app :3"}
            </p>

            {user.interests && user.interests.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1.5">
                {user.interests.map((tag) => (
                  <span
                    key={tag}
                    className={cn(
                      "text-[9px] font-bold px-2.5 py-0.5 rounded-full border",
                      isDark ? "bg-[#3D2A1F]/30 border-[#3D2A1F] text-[#D2C5B4]" : "bg-[#F2E8DC]/40 border-[#8B5E3C]/10 text-[#8B5E3C]"
                    )}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Stats Metrics Row */}
        <Card variant="outline" className={cn(
          "rounded-[24px] border p-4 transition-colors duration-300",
          themeCard, themeBorder
        )}>
          <div className="grid grid-cols-4 divide-x divide-[#8B5E3C]/12 dark:divide-[#3D2A1F]">
            <div className="flex items-center justify-center gap-3">
              <div className={cn(
                "h-8.5 w-8.5 rounded-full flex items-center justify-center",
                isDark ? "bg-[#3D2A1F]" : "bg-[#F2E8DC]/60"
              )}>
                <Grid3X3 className={cn("h-4.5 w-4.5 stroke-[2.2]", themeTextSecondary)} />
              </div>
              <div className="text-left">
                <p className={cn("text-sm font-extrabold leading-none", themeTextPrimary)}>{posts.length}</p>
                <p className={cn("text-[9px] font-bold uppercase tracking-wider leading-none mt-1", themeTextSecondary)}>Posts</p>
              </div>
            </div>

            <Link
              to={`/profile/${user.username}/followers`}
              className="flex items-center justify-center gap-3 hover:opacity-85 active:scale-95 transition-all cursor-pointer"
            >
              <div className={cn(
                "h-8.5 w-8.5 rounded-full flex items-center justify-center",
                isDark ? "bg-[#3D2A1F]" : "bg-[#F2E8DC]/60"
              )}>
                <Users className={cn("h-4.5 w-4.5 stroke-[2.2]", themeTextSecondary)} />
              </div>
              <div className="text-left">
                <p className={cn("text-sm font-extrabold leading-none", themeTextPrimary)}>{user.followers}</p>
                <p className={cn("text-[9px] font-bold uppercase tracking-wider leading-none mt-1", themeTextSecondary)}>Followers</p>
              </div>
            </Link>

            <Link
              to={`/profile/${user.username}/following`}
              className="flex items-center justify-center gap-3 hover:opacity-85 active:scale-95 transition-all cursor-pointer"
            >
              <div className={cn(
                "h-8.5 w-8.5 rounded-full flex items-center justify-center",
                isDark ? "bg-[#3D2A1F]" : "bg-[#F2E8DC]/60"
              )}>
                <Users className={cn("h-4.5 w-4.5 stroke-[2.2]", themeTextSecondary)} />
              </div>
              <div className="text-left">
                <p className={cn("text-sm font-extrabold leading-none", themeTextPrimary)}>{user.following}</p>
                <p className={cn("text-[9px] font-bold uppercase tracking-wider leading-none mt-1", themeTextSecondary)}>Following</p>
              </div>
            </Link>

            <div className="flex items-center justify-center gap-3">
              <div className={cn(
                "h-8.5 w-8.5 rounded-full flex items-center justify-center",
                isDark ? "bg-[#3D2A1F]" : "bg-[#F2E8DC]/60"
              )}>
                <Bookmark className={cn("h-4.5 w-4.5 stroke-[2.2]", themeTextSecondary)} />
              </div>
              <div className="text-left">
                <p className={cn("text-sm font-extrabold leading-none", themeTextPrimary)}>18</p>
                <p className={cn("text-[9px] font-bold uppercase tracking-wider leading-none mt-1", themeTextSecondary)}>Saved</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Story Highlights Carousel */}
        <Card variant="outline" className={cn(
          "rounded-[24px] border p-4 flex gap-4 overflow-x-auto scrollbar-none transition-colors duration-300 items-center justify-start",
          themeCard, themeBorder
        )}>
          {isOwnProfile && (
            <button
              onClick={() => setShowCreateHighlight(true)}
              className="flex flex-col items-center flex-shrink-0 active:scale-95 transition-transform cursor-pointer"
            >
              <div className={cn(
                "h-12 w-12 rounded-full border border-dashed flex items-center justify-center bg-transparent transition-colors",
                isDark ? "border-[#3D2A1F] hover:bg-[#3D2A1F]/30" : "border-[#8B5E3C]/35 hover:bg-[#F2E8DC]/30"
              )}>
                <Plus className={cn("h-5 w-5 stroke-[2.5]", themeTextSecondary)} />
              </div>
              <span className={cn("text-[9px] font-bold mt-1.5", themeTextSecondary)}>New</span>
            </button>
          )}

          {highlights.map((h) => (
            <div key={h._id} className="flex flex-col items-center flex-shrink-0 relative group">
              <div className={cn(
                "p-[2.5px] rounded-full transition-all duration-300 group-hover:scale-105",
                isDark ? "bg-[#3D2A1F]" : "bg-[#8B5E3C]/20"
              )}>
                <button
                  onClick={() => {
                    setActiveViewerStories(h.stories);
                    setShowViewer(true);
                  }}
                  className="h-11 w-11 rounded-full border-2 border-background overflow-hidden bg-muted flex items-center justify-center cursor-pointer"
                >
                  <img
                    src={resolveUrl(h.stories[0]?.mediaUrl) || "/avatar.png"}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </button>
              </div>
              <span className={cn("text-[9px] font-bold mt-1.5 truncate w-12 text-center", themeTextPrimary)}>
                {h.name}
              </span>
              {isOwnProfile && (
                <button
                  onClick={() => handleDeleteHighlight(h._id)}
                  className="absolute -top-1 -right-1 bg-[#8B5E3C] text-white rounded-full h-3.5 w-3.5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm border border-transparent cursor-pointer"
                >
                  <span className="text-[9px] font-extrabold leading-none">×</span>
                </button>
              )}
            </div>
          ))}
        </Card>

        {/* Tab Selectors Card */}
        <Card variant="outline" className={cn(
          "rounded-[24px] border p-1.5 flex items-center justify-between transition-colors duration-300",
          themeCard, themeBorder
        )}>
          <div className="flex gap-1.5">
            {[
              { id: "posts" as const, label: "Posts", icon: Grid3X3 },
              { id: "reels" as const, label: "Reels", icon: Film },
              { id: "saved" as const, label: "Saved", icon: Bookmark },
              { id: "tagged" as const, label: "Tagged", icon: Tag },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    if (tab.id === "reels") {
                      navigate(`/reels?user=${user.username}`);
                    }
                  }}
                  className={cn(
                    "py-1.5 px-4 rounded-full text-xs font-bold transition-all duration-200 border-none active:scale-95 flex items-center gap-1.5 cursor-pointer",
                    isActive
                      ? (isDark ? "bg-[#3D2A1F] text-[#F5F0E8]" : "bg-[#8B5E3C] text-white")
                      : (isDark ? "bg-transparent text-[#D2C5B4] hover:bg-[#3D2A1F]/30" : "bg-transparent text-[#8B5E3C] hover:bg-[#F2E8DC]/40")
                  )}
                >
                  <Icon className="h-3.5 w-3.5 stroke-[2.2]" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <button className={cn(
            "w-9 h-9 rounded-full flex items-center justify-center border active:scale-95 transition-colors mr-1 cursor-pointer",
            isDark ? "bg-[#3D2A1F] border-[#3D2A1F] text-[#D2C5B4]" : "bg-[#F2E8DC]/40 border-[#8B5E3C]/12 text-[#8B5E3C]"
          )}>
            <SlidersHorizontal className="h-4 w-4 stroke-[2.2]" />
          </button>
        </Card>

        {/* Posts/Saved List Grid */}
        {activeTab === "saved" && loadingSaved ? (
          <p className={cn("text-center py-8 text-xs font-bold", themeTextSecondary)}>
            Loading saved posts...
          </p>
        ) : displayedPosts.length === 0 ? (
          <div className={cn("text-center py-12 rounded-[24px] border border-dashed p-6", themeBorder)}>
            <Grid3X3 className={cn("h-8 w-8 mx-auto mb-2.5 opacity-40", themeTextSecondary)} />
            <p className={cn("text-xs font-bold", themeTextSecondary)}>No posts available in this section</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4 mt-1">
            {displayedPosts.map((post) => (
              <div key={post._id} className="group relative rounded-[20px] overflow-hidden border border-transparent shadow-none transition-transform active:scale-[0.99] aspect-square bg-[#3D2A1F]/10">
                {post.mediaUrl && (post.mediaUrl.endsWith(".mp4") || post.mediaUrl.endsWith(".mov") || post.mediaUrl.includes("/video/upload/")) ? (
                  <video
                    src={resolveUrl(post.mediaUrl)}
                    className="aspect-square object-cover w-full h-full hover:opacity-85 transition-opacity"
                    preload="metadata"
                    muted
                    playsInline
                  />
                ) : (
                  <img
                    src={resolveUrl(post.mediaUrl || post.imageUrl)}
                    alt=""
                    className="aspect-square object-cover w-full h-full group-hover:scale-102 transition-transform duration-300"
                  />
                )}

                {/* Hover overlay with Like count and Deletion triggers */}
                <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-between p-3.5 text-white">
                  <div className="flex justify-between items-center">
                    <Link to={`/post/${post._id}`} className="text-[10px] font-bold text-white/90 hover:underline">
                      View Post
                    </Link>
                    {isOwnProfile && (
                      <button
                        onClick={() => handleDeletePost(post._id)}
                        className="w-7 h-7 rounded-full flex items-center justify-center bg-red-600 hover:bg-red-700 border-none text-white cursor-pointer"
                        title="Delete Post"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-left">
                    <Heart className="h-4.5 w-4.5 fill-white stroke-none" />
                    <span>{post.likes?.length || 0}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {postsLoading && activeTab === "posts" && (
          <p className={cn("text-center py-4 text-xs font-bold transition-colors", themeTextSecondary)}>
            Loading more posts...
          </p>
        )}
      </div>

      {/* ========================================================
          2. RIGHT COLUMN: About & Suggested Panels (Independently scrollable)
          ======================================================== */}
      <div
        className="w-full lg:w-[320px] shrink-0 flex flex-col gap-6 overflow-y-auto pr-1 h-full scrollbar-none select-none"
      >
        
        {/* About Me Card */}
        <Card variant="outline" className={cn(
          "rounded-[24px] border p-5 text-left transition-colors duration-300",
          themeCard, themeBorder
        )}>
          <h3 className={cn("text-sm font-extrabold font-serif mb-3.5 transition-colors", themeTextPrimary)}>
            About Me
          </h3>
          <div className="space-y-3.5">
            <div className="flex items-center gap-3">
              <div className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center",
                isDark ? "bg-[#3D2A1F]" : "bg-[#F2E8DC]/60"
              )}>
                <Briefcase className={cn("h-4 w-4 stroke-[2.2]", themeTextSecondary)} />
              </div>
              <p className={cn("text-xs font-semibold capitalize", themeTextPrimary)}>{aboutOccupation}</p>
            </div>

            <div className="flex items-center gap-3">
              <div className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center",
                isDark ? "bg-[#3D2A1F]" : "bg-[#F2E8DC]/60"
              )}>
                <Smile className={cn("h-4 w-4 stroke-[2.2]", themeTextSecondary)} />
              </div>
              <p className={cn("text-xs font-semibold capitalize", themeTextPrimary)}>{aboutHobby1}</p>
            </div>

            <div className="flex items-center gap-3">
              <div className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center",
                isDark ? "bg-[#3D2A1F]" : "bg-[#F2E8DC]/60"
              )}>
                <Coffee className={cn("h-4 w-4 stroke-[2.2]", themeTextSecondary)} />
              </div>
              <p className={cn("text-xs font-semibold capitalize", themeTextPrimary)}>{aboutHobby2}</p>
            </div>

            <div className="flex items-center gap-3">
              <div className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center",
                isDark ? "bg-[#3D2A1F]" : "bg-[#F2E8DC]/60"
              )}>
                <Rocket className={cn("h-4 w-4 stroke-[2.2]", themeTextSecondary)} />
              </div>
              <p className={cn("text-xs font-semibold", themeTextPrimary)}>{aboutStatus}</p>
            </div>
          </div>
        </Card>

        {/* Suggested for you Card */}
        <Card variant="outline" className={cn(
          "rounded-[24px] border p-5 text-left transition-colors duration-300",
          themeCard, themeBorder
        )}>
          <div className="flex justify-between items-center mb-4">
            <h3 className={cn("text-sm font-extrabold font-serif transition-colors", themeTextPrimary)}>
              Suggested for you
            </h3>
            <button className={cn("text-[10px] font-bold transition-all hover:underline", themeTextSecondary)}>
              See all
            </button>
          </div>

          <div className="space-y-4">
            {suggestedList.map((sug, idx) => (
              <div key={idx} className="flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Avatar className="h-7 w-7 border border-[#8B5E3C]/10 flex-shrink-0">
                    <AvatarImage src={sug.avatar} />
                    <AvatarFallback>{sug.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="text-left min-w-0">
                    <p className={cn("text-xs font-extrabold truncate leading-tight", themeTextPrimary)}>{sug.name}</p>
                    <p className={cn("text-[9px] font-bold leading-none mt-0.5 truncate", themeTextSecondary)}>@{sug.username}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleFollowSuggestedUser(sug.username, idx)}
                  className={cn(
                    "text-[10px] font-bold py-1 px-3.5 rounded-full border transition-all active:scale-95 flex-shrink-0 cursor-pointer",
                    sug.isFollowing
                      ? "bg-[#8B5E3C] border-[#8B5E3C] text-white"
                      : isDark
                        ? "bg-[#3D2A1F] border-[#3D2A1F] text-[#F5F0E8] hover:bg-[#4A3428]"
                        : "bg-[#FFFDF9] border-[#8B5E3C]/15 text-[#8B5E3C] hover:bg-[#8B5E3C] hover:text-[#FFFDF9]"
                  )}
                >
                  {sug.isFollowing ? "Followed" : "Follow"}
                </button>
              </div>
            ))}
          </div>
        </Card>

        {/* Footer info links */}
        <Card variant="outline" className={cn(
          "rounded-[24px] border p-5 text-left transition-colors duration-300",
          themeCard, themeBorder
        )}>
          <div className={cn("flex flex-wrap gap-x-2 gap-y-1 text-[10px] font-bold leading-tight", themeTextSecondary)}>
            <span className="hover:underline cursor-pointer">About</span>
            <span>•</span>
            <span className="hover:underline cursor-pointer">Help</span>
            <span>•</span>
            <span className="hover:underline cursor-pointer">Press</span>
            <span>•</span>
            <span className="hover:underline cursor-pointer">API</span>
            <span className="block w-full h-0" />
            <span className="hover:underline cursor-pointer">Jobs</span>
            <span>•</span>
            <span className="hover:underline cursor-pointer">Privacy</span>
            <span>•</span>
            <span className="hover:underline cursor-pointer">Terms</span>
          </div>
          <p className={cn("text-[9px] font-bold mt-3.5 uppercase tracking-wide opacity-70", themeTextSecondary)}>
            © 2026 Vibe Social Platform
          </p>
        </Card>
      </div>

      {/* ========================================================
          3. EXTRA DIALOGS & OVERLAYS
          ======================================================== */}
      {isOwnProfile && (
        <EditProfileModal
          open={showEditProfile}
          onOpenChange={setShowEditProfile}
          currentUser={user}
          onSave={async (data) => {
            if (!token) return;
            const updated = await updateProfile(token, data);
            setUser((u) => (u ? { ...u, ...updated } : u));
          }}
        />
      )}

      <SettingsSheet open={showSettings} onOpenChange={setShowSettings} />

      <CreateHighlightSheet
        open={showCreateHighlight}
        onOpenChange={setShowCreateHighlight}
        onHighlightCreated={loadProfile}
      />

      {showViewer && activeViewerStories.length > 0 && (
        <StoryViewer
          stories={activeViewerStories}
          canDelete={false}
          onClose={() => {
            setShowViewer(false);
            setActiveViewerStories([]);
          }}
        />
      )}
    </div>
  );
}
