import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home as HomeIcon,
  Search as SearchIcon,
  Compass,
  Film,
  PlusSquare,
  MessageCircle,
  Bell,
  Users,
  Sparkles,
  User as UserIcon,
  LogOut,
  Moon,
  Sun,
  Play,
  Share2,
  Heart,
  MessageSquare,
  DollarSign,
  Plus,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  X,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  IndianRupee,
  MoreHorizontal,
  Trash2
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSocket } from "@/contexts/SocketContext";
import { getUnreadCount } from "@/api/notifications";
import { getUnreadMessageCount } from "@/api/messages";
import { AddStorySheet } from "@/components/shared/AddStorySheet";
import { CommentsSheet } from "@/components/shared/CommentsSheet";
import { ShareSheet } from "@/components/shared/ShareSheet";
import { MobileBottomNav, MobileHeader } from "@/components/layout/Navigation";
import { API_BASE_URL, resolveUrl } from "../config";
import api from "@/lib/axios";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { FeedPostCard, FeedPost } from "@/components/post/FeedPostCard";
import { ProfileFeedViewer } from "@/components/profile/ProfileFeedViewer";

interface Story {
  _id: string;
  mediaUrl: string;
  mediaType: string;
  views: string[];
  createdAt: string;
}

interface StoryGroup {
  user: {
    _id: string;
    username: string;
    avatar?: string;
  };
  stories: Story[];
}

interface DiscoveryUser {
  _id: string;
  username: string;
  name: string;
  bio?: string;
  avatar?: string;
  gender?: string;
  location?: string;
  interests?: string[];
  followers?: string[];
  isFollowing?: boolean;
}

interface Community {
  _id: string;
  name: string;
  description: string;
  avatar?: string;
  members?: string[];
  memberCount?: number;
  category?: string;
}

interface Reel {
  _id: string;
  mediaUrl: string;
  caption?: string;
  category?: string;
  likes: string[];
  author: {
    _id: string;
    username: string;
    avatar?: string;
  };
  views?: string;
}

export default function Index() {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { socket } = useSocket();

  // Theme State
  const [isDark, setIsDark] = useState(() => localStorage.getItem("vibe_theme") === "dark");

  useEffect(() => {
    const handleThemeChange = () => {
      setIsDark(localStorage.getItem("vibe_theme") === "dark");
    };
    window.addEventListener("themeChange", handleThemeChange);
    return () => window.removeEventListener("themeChange", handleThemeChange);
  }, []);

  // Live Backend Data States
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [stories, setStories] = useState<StoryGroup[]>([]);
  const [suggestedCreators, setSuggestedCreators] = useState<DiscoveryUser[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [reels, setReels] = useState<Reel[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMsgCount, setUnreadMsgCount] = useState(0);

  // Loading States
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [loadingStories, setLoadingStories] = useState(false);
  const [loadingCreators, setLoadingCreators] = useState(false);
  const [loadingCommunities, setLoadingCommunities] = useState(false);
  const [loadingReels, setLoadingReels] = useState(false);

  const queryClient = useQueryClient();

  // React Query Fetching
  const { data: postsData, isLoading: isPostsLoading } = useQuery<FeedPost[]>({
    queryKey: ["posts", user?.id || "guest", 1],
    queryFn: async () => {
      const res = await api.get("/posts?page=1&limit=10");
      if (res.data && Array.isArray(res.data)) {
        return res.data.map((post: any) => ({
          _id: post._id,
          imageUrl: resolveUrl(post.mediaUrl),
          caption: post.caption || "",
          author: {
            _id: post.author?._id || "",
            name: post.author?.username || "anonymous",
            username: post.author?.username || "anonymous",
            avatar: resolveUrl(post.author?.avatar),
            category: "Member",
          },
          likes: Array.isArray(post.likes) ? post.likes : [],
          commentsCount: typeof post.commentsCount === "number" ? post.commentsCount : (Array.isArray(post.comments) ? post.comments.length : 0),
          comments: post.comments || [],
          sharesCount: typeof post.sharesCount === "number" ? post.sharesCount : 0,
          createdAt: new Date(post.createdAt).toLocaleDateString(),
          isLiked: user ? post.likes?.includes(user.id || user._id) : false,
        }));
      }
      return [];
    },
    enabled: !!token,
    staleTime: 1000 * 60 * 5, // 5 minutes fresh time
  });

  const { data: storiesData, isLoading: isStoriesLoading } = useQuery<StoryGroup[]>({
    queryKey: ["stories", user?.id || "guest"],
    queryFn: async () => {
      const res = await api.get("/stories");
      return Array.isArray(res.data) ? res.data : [];
    },
    enabled: !!token,
    staleTime: 1000 * 60 * 5,
  });

  const { data: creatorsData, isLoading: isCreatorsLoading } = useQuery<DiscoveryUser[]>({
    queryKey: ["discoveryUsers", user?.id || "guest"],
    queryFn: async () => {
      const res = await api.get("/users/discovery");
      return Array.isArray(res.data) ? res.data : [];
    },
    enabled: !!token,
    staleTime: 1000 * 60 * 5,
  });

  const { data: communitiesData, isLoading: isCommunitiesLoading } = useQuery<Community[]>({
    queryKey: ["communities", user?.id || "guest"],
    queryFn: async () => {
      const res = await api.get("/communities");
      return Array.isArray(res.data) ? res.data : [];
    },
    enabled: !!token,
    staleTime: 1000 * 60 * 5,
  });

  const { data: reelsData, isLoading: isReelsLoading } = useQuery<Reel[]>({
    queryKey: ["reels", user?.id || "guest"],
    queryFn: async () => {
      const res = await api.get("/reels?limit=12");
      return Array.isArray(res.data) ? res.data : [];
    },
    enabled: !!token,
    staleTime: 1000 * 60 * 5,
  });

  // Synchronize Query Data to Local States (to preserve interactive edits like liking, joining, etc.)
  useEffect(() => {
    setLoadingPosts(isPostsLoading);
    if (postsData) setPosts(postsData);
  }, [postsData, isPostsLoading]);

  useEffect(() => {
    setLoadingStories(isStoriesLoading);
    if (storiesData) setStories(storiesData);
  }, [storiesData, isStoriesLoading]);

  useEffect(() => {
    setLoadingCreators(isCreatorsLoading);
    if (creatorsData) setSuggestedCreators(creatorsData);
  }, [creatorsData, isCreatorsLoading]);

  useEffect(() => {
    setLoadingCommunities(isCommunitiesLoading);
    if (communitiesData) setCommunities(communitiesData);
  }, [communitiesData, isCommunitiesLoading]);

  useEffect(() => {
    setLoadingReels(isReelsLoading);
    if (reelsData) setReels(reelsData);
  }, [reelsData, isReelsLoading]);

  // Layout Adjustability States
  const [showLayoutAdjuster, setShowLayoutAdjuster] = useState(false);
  const [sectionOrder, setSectionOrder] = useState<string[]>(["stories", "posts", "suggested", "reels"]);
  const [visibleSections, setVisibleSections] = useState<Record<string, boolean>>({
    stories: true,
    posts: true,
    suggested: true,
    reels: true
  });

  // UI Interactive States
  const [activeDiscoverTab, setActiveDiscoverTab] = useState("For You");
  const [activeStoryViewer, setActiveStoryViewer] = useState<StoryGroup | null>(null);
  const [storyIndex, setStoryIndex] = useState(0);
  const [showAddStory, setShowAddStory] = useState(false);
  const [tipModalPost, setTipModalPost] = useState<FeedPost | null>(null);
  const [tipAmount, setTipAmount] = useState<number | null>(null);
  const [customTip, setCustomTip] = useState("");
  const [tippingSuccess, setTippingSuccess] = useState(false);
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<string | null>(null);
  const [commentsStoryId, setCommentsStoryId] = useState<string | null>(null);
  const [feedViewerPostId, setFeedViewerPostId] = useState<string | null>(null);
  const [showShare, setShowShare] = useState(false);
  const [sharePostId, setSharePostId] = useState<string | null>(null);

  // Carousel scroll position tracker
  const postsCarouselRef = useRef<HTMLDivElement>(null);
  const suggestedCarouselRef = useRef<HTMLDivElement>(null);
  const reelsCarouselRef = useRef<HTMLDivElement>(null);
  const [postsScrollProgress, setPostsScrollProgress] = useState(0);

  const scrollCarousel = (ref: React.RefObject<HTMLDivElement>, direction: 'left' | 'right') => {
    if (ref.current) {
      const isPosts = ref === postsCarouselRef;
      const scrollAmount = isPosts ? 560 : 340;
      if (direction === 'left') {
        ref.current.scrollLeft -= scrollAmount;
      } else {
        ref.current.scrollLeft += scrollAmount;
      }
    }
  };

  // Carousel overflow detection states
  const [canScrollPosts, setCanScrollPosts] = useState(false);
  const [canScrollSuggested, setCanScrollSuggested] = useState(false);
  const [canScrollReels, setCanScrollReels] = useState(false);

  const checkOverflow = () => {
    setTimeout(() => {
      if (postsCarouselRef.current) {
        const el = postsCarouselRef.current;
        setCanScrollPosts(el.scrollWidth > el.clientWidth);
      }
      if (suggestedCarouselRef.current) {
        const el = suggestedCarouselRef.current;
        setCanScrollSuggested(el.scrollWidth > el.clientWidth);
      }
      if (reelsCarouselRef.current) {
        const el = reelsCarouselRef.current;
        setCanScrollReels(el.scrollWidth > el.clientWidth);
      }
    }, 100);
  };

  useEffect(() => {
    checkOverflow();
  }, [posts, suggestedCreators, reels]);

  useEffect(() => {
    window.addEventListener("resize", checkOverflow);
    return () => window.removeEventListener("resize", checkOverflow);
  }, []);

  // Mouse drag-to-scroll swipe handlers for carousels
  const handleDragStart = (e: React.MouseEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    container.dataset.isDown = "true";
    container.dataset.startX = (e.pageX - container.offsetLeft).toString();
    container.dataset.scrollLeft = container.scrollLeft.toString();
    container.dataset.hasMoved = "false";
  };

  const handleDragEnd = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.dataset.isDown = "false";
  };

  const handleDragMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    if (container.dataset.isDown !== "true") return;
    e.preventDefault();
    const x = e.pageX - container.offsetLeft;
    const startX = parseFloat(container.dataset.startX || "0");
    if (Math.abs(x - startX) > 5) {
      container.dataset.hasMoved = "true";
    }
    const scrollLeftVal = parseFloat(container.dataset.scrollLeft || "0");
    const walk = (x - startX) * 1.5; // drag scroll speed factor
    container.scrollLeft = scrollLeftVal - walk;
  };



  // Theme object computed based on isDark state
  const theme = {
    bg: isDark ? "bg-[#1F140E]" : "bg-[#F5F0E8]",
    card: isDark ? "bg-[#2A1D16]" : "bg-[#EFE6DA]",
    cardBorder: isDark ? "border-[#3D2A1F]" : "border-[#E3D8C8]",
    textPrimary: isDark ? "text-[#F5F0E8]" : "text-[#4A3428]",
    textSecondary: isDark ? "text-[#D2C5B4]" : "text-[#8B5E3C]",
    border: isDark ? "border-[#3D2A1F]" : "border-[#E3D8C8]",
    navActive: isDark ? "bg-[#3D2A1F]" : "bg-[#EFE6DA]",
    navHover: isDark ? "hover:bg-[#2A1D16]/50" : "hover:bg-[#EFE6DA]/50",
    inputBg: isDark ? "bg-[#2A1D16]" : "bg-[#EFE6DA]",
    inputBorder: isDark ? "border-[#3D2A1F]" : "border-[#E3D8C8]",
    accentButton: "bg-[#8B5E3C] hover:bg-[#4A3428] text-[#F5F0E8]",
    accentButtonSecondary: isDark ? "bg-[#3D2A1F] hover:bg-[#4A3428] text-[#F5F0E8]" : "bg-[#EFE6DA] hover:bg-[#8B5E3C] hover:text-[#F5F0E8] text-[#8B5E3C]",
    shadow: "shadow-2xs",
    scrollBarTrack: isDark ? "bg-[#3D2A1F]" : "bg-[#E3D8C8]/60",
    scrollBarThumb: "bg-[#8B5E3C]",
  };

  // Dynamic Trending Hashtags extractor (Bug 5a)
  const getTrendingHashtags = () => {
    const counts: Record<string, { count: number; image: string }> = {};
    posts.forEach(post => {
      if (post.caption) {
        const hashtags = post.caption.match(/#[a-zA-Z0-9_]+/g);
        if (hashtags) {
          hashtags.forEach(tag => {
            const cleanTag = tag.trim();
            if (!counts[cleanTag]) {
              counts[cleanTag] = { count: 0, image: post.imageUrl || "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=100" };
            }
            counts[cleanTag].count += 1;
          });
        }
      }
    });

    const sortedTags = Object.keys(counts)
      .map(tag => ({
        title: tag,
        postsCount: counts[tag].count,
        posts: `${counts[tag].count} ${counts[tag].count === 1 ? 'post' : 'posts'}`,
        image: counts[tag].image
      }))
      .sort((a, b) => b.postsCount - a.postsCount);

    return sortedTags.slice(0, 5);
  };

  // Load customizations & dark mode state
  useEffect(() => {
    const storedVisibility = localStorage.getItem("vibe_visible_sections");
    if (storedVisibility) {
      try { setVisibleSections(JSON.parse(storedVisibility)); } catch (e) { }
    }
    const storedOrder = localStorage.getItem("vibe_section_order");
    if (storedOrder) {
      try { setSectionOrder(JSON.parse(storedOrder)); } catch (e) { }
    }
  }, []);



  // Story Viewer helper functions
  const openStories = (group: StoryGroup) => {
    setActiveStoryViewer(group);
    setStoryIndex(0);
  };

  const nextStory = () => {
    if (!activeStoryViewer) return;
    if (storyIndex < activeStoryViewer.stories.length - 1) {
      setStoryIndex(prev => prev + 1);
    } else {
      setActiveStoryViewer(null);
    }
  };

  const prevStory = () => {
    if (storyIndex > 0) {
      setStoryIndex(prev => prev - 1);
    } else {
      setActiveStoryViewer(null);
    }
  };

  // Like interaction handler
  const handleLike = async (postId: string) => {
    setPosts(prevPosts =>
      prevPosts.map(post => {
        if (post._id === postId) {
          const isLikedNow = !post.isLiked;
          const updatedLikes = isLikedNow
            ? [...post.likes, user?.id || user?._id || "user_id"]
            : post.likes.filter(id => id !== (user?.id || user?._id || "user_id"));
          return {
            ...post,
            isLiked: isLikedNow,
            likes: updatedLikes
          };
        }
        return post;
      })
    );

    if (postId.startsWith("m_post")) return;

    try {
      await api.put(`/posts/${postId}/like`);
    } catch (error) {
      console.error("Error liking post:", error);
    }
  };

  // Share interaction handler
  const handleShare = async (postId: string) => {
    setSharePostId(postId);
    setShowShare(true);
    try {
      // Optimistically update the share count locally
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post._id === postId
            ? { ...post, sharesCount: (post.sharesCount || 0) + 1 }
            : post
        )
      );
      await api.put(`/posts/${postId}/share`);
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    } catch (error) {
      console.error("Error sharing post:", error);
    }
  };

  // Live follow interaction
  const handleFollowCreator = async (creator: DiscoveryUser | any) => {
    const isFollowingNow = creator.isFollowing;
    setSuggestedCreators(prev =>
      prev.map(c => (c._id === creator._id ? { ...c, isFollowing: !isFollowingNow } : c))
    );

    try {
      const res = await api.put(`/users/${creator.username}/follow`);
      if (res.data.isFollowing) {
        toast.success(`Successfully followed @${creator.username}!`);
      } else {
        toast.success(`Unfollowed @${creator.username}`);
      }
    } catch (e) {
      toast.error("Failed to update follow status");
      setSuggestedCreators(prev =>
        prev.map(c => (c._id === creator._id ? { ...c, isFollowing: isFollowingNow } : c))
      );
    }
  };

  // Live community join interaction
  const handleCommunityJoinToggle = async (comm: Community | any) => {
    try {
      const res = await api.put(`/communities/${comm._id}/join`);

      setCommunities(prev =>
        prev.map(c => (c._id === comm._id ? { ...c, members: res.data.members } : c))
      );

      const joinedNow = res.data.members?.includes(user?.id || user?._id);
      if (joinedNow) {
        toast.success(`Joined community: ${comm.name}!`);
      } else {
        toast.success(`Left community: ${comm.name}`);
      }
    } catch (e) {
      toast.error("Failed to update community member status");
    }
  };

  // Tip submission handler
  const handleSendTip = async () => {
    const finalAmount = customTip ? parseFloat(customTip) : tipAmount;
    if (!finalAmount || finalAmount <= 0) {
      toast.error("Please select or enter a valid amount");
      return;
    }

    if (!tipModalPost) return;

    setTippingSuccess(true);
    try {
      await api.post(`/tips/${tipModalPost.author.name}`, { amount: finalAmount });
      toast.success(`Successfully sent a tip of $${finalAmount.toFixed(2)} to @${tipModalPost.author.name}! ☕`);
      setTipModalPost(null);
      setTipAmount(null);
      setCustomTip("");
    } catch (e) {
      toast.error("Failed to send tip to creator");
    } finally {
      setTippingSuccess(false);
    }
  };

  const handleCommentAdded = (postId: string, count: number) => {
    setPosts(prev =>
      prev.map(p => (p._id === postId ? { ...p, commentsCount: count } : p))
    );
  };

  // Track posts scroll to update scrollbar indicator
  const handleScroll = () => {
    if (postsCarouselRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = postsCarouselRef.current;
      const maxScroll = scrollWidth - clientWidth;
      if (maxScroll > 0) {
        setPostsScrollProgress((scrollLeft / maxScroll) * 100);
      }
    }
  };

  // Section position adjustment helper
  const moveSection = (index: number, direction: "up" | "down") => {
    const newOrder = [...sectionOrder];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex >= 0 && targetIndex < newOrder.length) {
      const temp = newOrder[index];
      newOrder[index] = newOrder[targetIndex];
      newOrder[targetIndex] = temp;
      setSectionOrder(newOrder);
      localStorage.setItem("vibe_section_order", JSON.stringify(newOrder));
      toast.success("Section layout updated!");
    }
  };

  // Section visibility toggle helper
  const toggleSectionVisibility = (secKey: string) => {
    const updated = { ...visibleSections, [secKey]: !visibleSections[secKey] };
    setVisibleSections(updated);
    localStorage.setItem("vibe_visible_sections", JSON.stringify(updated));
    toast.success(`${secKey.charAt(0).toUpperCase() + secKey.slice(1)} visibility toggled`);
  };

  // Discover sorting rules:
  // Bug 5b: Popular Communities: sorted by members count descending
  const sortedCommunities = [...communities].sort((a, b) => {
    const aCount = a.members?.length || 0;
    const bCount = b.members?.length || 0;
    return bCount - aCount;
  });

  // Bug 5c: Featured Creators: sorted by followers count descending
  const sortedFeaturedCreators = [...suggestedCreators].sort((a, b) => {
    const aCount = a.followers?.length || 0;
    const bCount = b.followers?.length || 0;
    return bCount - aCount;
  });

  const sidebarNavItems = [
    { icon: HomeIcon, label: "Home", path: "/" },
    { icon: SearchIcon, label: "Search", path: "/search" },
    { icon: Compass, label: "Discover", path: "/discover" },
    { icon: Film, label: "Reels", path: "/reels" },
    { icon: PlusSquare, label: "Create", path: "/create" },
    { icon: MessageCircle, label: "Messages", path: "/messages", badge: unreadMsgCount },
    { icon: Bell, label: "Notifications", path: "/notifications", badge: unreadCount },
    { icon: Users, label: "Community", path: "/communities" },
    { icon: Sparkles, label: "Vibe AI", path: "/vibe-ai" },
    { icon: UserIcon, label: "Profile", path: "/profile" },
  ];

  return (
    <div className={`min-h-screen w-full font-sans transition-colors duration-500 overflow-x-hidden ${theme.bg} ${theme.textPrimary}`}>

      {/* APP WRAPPER GRID (Left Sidebar + Main Content + Right Sidebar) */}
      <div className="w-full flex flex-row min-h-screen relative px-4 lg:px-6">

        {/* ==================== LEFT SIDEBAR ==================== */}
        <aside
          className={`hidden lg:flex w-[205px] xl:w-[220px] shrink-0 sticky top-0 h-screen flex-col justify-between py-5 border-r ${theme.border} pr-2`}
        >
          <div className="space-y-4 flex flex-col flex-1">

            {/* Logo */}
            <div className="flex items-center gap-2 px-1">
              <span className={`text-2xl font-extrabold tracking-widest font-serif ${theme.textSecondary}`}>
                VIBE
              </span>
            </div>

            {/* Navigation Menu */}
            <nav className="space-y-1">
              {sidebarNavItems.map((item) => {
                const isActive = location.pathname === item.path;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center justify-between px-2 py-2.5 rounded-[14px] transition-all duration-300 group ${isActive
                      ? `${theme.navActive} font-semibold shadow-xs`
                      : `${theme.navHover} text-opacity-80`
                      }`}
                  >
                    <span className="flex items-center gap-2">
                      <item.icon
                        className={`h-[18px] w-[18px] transition-all duration-300 group-hover:scale-105 ${isActive
                          ? theme.textSecondary
                          : "opacity-75 group-hover:opacity-100"
                          }`}
                      />

                      <span className="text-[13px] font-medium tracking-wide">
                        {item.label}
                      </span>
                    </span>

                    {!!item.badge && item.badge > 0 && (
                      <span className="h-5 min-w-[20px] px-1.5 flex items-center justify-center text-[10px] font-bold rounded-full bg-[#8B5E3C] text-white">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Bottom Area: Dark Mode, Logout, and Small Footer */}
          <div className="pt-4 border-t border-dashed border-[#C8B9A6]/30 space-y-2.5">

            {/* Dark Mode Toggle */}
            <div className={`flex items-center justify-between p-2 rounded-[14px] ${theme.card} border ${theme.cardBorder}`}>
              <div className="flex items-center gap-2">
                {isDark ? <Moon className="h-3.5 w-3.5 text-[#8B5E3C]" /> : <Sun className="h-3.5 w-3.5 text-[#8B5E3C]" />}
                <span className="text-[11px] font-medium tracking-wide">Dark Mode</span>
              </div>
              <button
                onClick={() => {
                  const nextDark = !isDark;
                  setIsDark(nextDark);
                  localStorage.setItem("vibe_theme", nextDark ? "dark" : "light");
                  window.dispatchEvent(new Event("themeChange"));
                }}
                className="w-9 h-5 bg-[#C8B9A6]/50 rounded-full relative p-0.5 transition-colors duration-300 focus:outline-none"
                style={{ backgroundColor: isDark ? "#8B5E3C" : "" }}
                aria-label="Toggle Dark Mode"
              >
                <div
                  className="w-4 h-4 bg-[#F5F0E8] rounded-full shadow-xs transition-transform duration-300"
                  style={{ transform: isDark ? "translateX(16px)" : "translateX(0px)" }}
                />
              </button>
            </div>

            {/* Logout Button */}
            <button
              onClick={() => {
                logout();
                toast.success("Logged out successfully");
                navigate("/login");
              }}
              className={`flex items-center gap-2 w-full px-2.5 py-2 rounded-[14px] text-[11px] font-semibold uppercase tracking-wider text-red-500 hover:bg-red-50/10 transition-all duration-300`}
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Logout</span>
            </button>

            {/* "Made with Love" Small Footer Card */}
            <div className={`flex items-center gap-2 p-2 rounded-[14px] ${theme.card} border ${theme.cardBorder}`}>
              <img
                src={user?.avatar ? resolveUrl(user.avatar) : `https://api.dicebear.com/7.x/initials/svg?seed=${user?.username || "user"}`}
                alt="user avatar"
                className="h-6 w-6 rounded-full object-cover border border-[#8B5E3C]/30"
              />
              <div className="flex-1 min-w-0">
                <p className="text-[9px] opacity-60">Find Your VIBE(●'◡'●)</p>
                <p className="text-[11px] font-semibold truncate">{user?.username || "vibe_user"}</p>
              </div>
            </div>
          </div>
        </aside>

        {/* ==================== MAIN CONTENT ==================== */}
        <main className="flex-1 pt-0 lg:pt-8 pb-4 lg:pb-8 px-0 sm:px-4 lg:px-6 md:px-10 overflow-y-auto max-h-screen scrollbar-hide space-y-6 lg:space-y-8">
          <MobileHeader />

          {/* Main Top Header with Layout Customizer toggle */}
          <div className="flex items-center justify-between border-b pb-4 border-[#C8B9A6]/20 px-4 sm:px-0">
            <div>
              <p className="text-xs opacity-60 tracking-wider font-semibold uppercase hidden sm:block">Feed</p>
              <h1 className="text-xl sm:text-2xl font-bold tracking-wide font-serif">Vibe Dashboard</h1>
            </div>

            {/* Custom Adjust Layout Button */}
            <button
              onClick={() => setShowLayoutAdjuster(!showLayoutAdjuster)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold transition-all duration-300 border ${showLayoutAdjuster
                ? "bg-[#8B5E3C] border-[#8B5E3C] text-white"
                : `${theme.card} ${theme.cardBorder} hover:border-[#8B5E3C]/50`
                }`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span>Adjust Sections</span>
            </button>
          </div>

          {/* Collapsible Layout Adjuster Drawer */}
          <AnimatePresence>
            {showLayoutAdjuster && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className={`overflow-hidden rounded-[24px] border ${theme.cardBorder} ${theme.card} p-5 space-y-4 shadow-sm`}
              >
                <div>
                  <h3 className="text-sm font-bold font-serif">Rearrange Homepage Sections</h3>
                  <p className="text-[11px] opacity-70">Show, hide, or slide sections to fit your personal workflow.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  {sectionOrder.map((sec, idx) => (
                    <div
                      key={sec}
                      className={`flex items-center justify-between p-3.5 rounded-[16px] border ${theme.border} bg-[#F5F0E8]/40 dark:bg-black/10`}
                    >
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => toggleSectionVisibility(sec)}
                          className="p-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/5 text-[#8B5E3C]"
                        >
                          {visibleSections[sec] ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4 opacity-50" />}
                        </button>
                        <span className="text-xs font-bold uppercase tracking-wider capitalize">
                          {sec === "suggested" ? "Suggested Creators" : sec === "reels" ? "Reels Preview" : sec}
                        </span>
                      </div>

                      {/* Direction Adjust Buttons */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => moveSection(idx, "up")}
                          disabled={idx === 0}
                          className="p-1 rounded-full hover:bg-[#8B5E3C]/15 disabled:opacity-30"
                        >
                          <ChevronUp className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => moveSection(idx, "down")}
                          disabled={idx === sectionOrder.length - 1}
                          className="p-1 rounded-full hover:bg-[#8B5E3C]/15 disabled:opacity-30"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* DYNAMIC SECTIONS GRID ACCORDING TO ADJUSTED SECTION ORDER */}
          <div className="space-y-12">
            {sectionOrder.map((sectionKey) => {
              if (!visibleSections[sectionKey]) return null;

              // Render Stories Section
              // Render Stories Section
              if (sectionKey === "stories") {
                const currentUserId = user?.id || user?._id;
                const myStoryGroup = stories?.find(
                  (group) => group.user?._id?.toString() === currentUserId?.toString()
                );
                const hasMyStory = !!myStoryGroup && myStoryGroup.stories.length > 0;
                const otherStories = stories?.filter(
                  (group) => group.user?._id?.toString() !== currentUserId?.toString()
                ) || [];
                const hasOtherStories = otherStories.length > 0;

                return (
                  <section key="stories" className="space-y-4">
                    {/* Mobile Search Bar */}
                    <div
                      onClick={() => navigate("/search")}
                      className="lg:hidden flex items-center gap-3 w-full bg-[#E8AC7D]/10 dark:bg-[#2A1F1A] border border-[#8B5E3C]/20 rounded-2xl px-4 py-3 mb-2 cursor-pointer"
                    >
                      <SearchIcon className="h-5 w-5 text-[#8B5E3C] dark:text-[#E8AC7D]" />
                      <span className="text-sm text-[#8B5E3C]/70 dark:text-[#E8AC7D]/70 font-medium">Search vibes, people, or tags...</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-bold tracking-wide font-serif">Stories</h2>
                      <button className={`text-xs font-semibold ${theme.textSecondary} hover:underline`}>View all</button>
                    </div>

                    <div className="flex gap-4 overflow-x-auto scrollbar-hide py-1">
                      {/* USER STORY CARD (Case 1 or Case 2) */}
                      {!hasMyStory ? (
                        /* Case 1: User has NO active story */
                        <div
                          onClick={() => setShowAddStory(true)}
                          className="w-[90px] h-[140px] shrink-0 relative rounded-[20px] overflow-hidden shadow-xs group cursor-pointer border border-[#E3D8C8]/10 bg-neutral-900"
                        >
                          {user?.avatar ? (
                            <img
                              src={resolveUrl(user.avatar)}
                              alt="Add to Story background"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-40 blur-[1px]"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-[#8B5E3C]/30 via-[#2A1F1A] to-[#E8AC7D]/10 group-hover:scale-105 transition-transform duration-500" />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

                          {/* Avatar top-left: profile picture with "+" badge */}
                          <div className="absolute top-2 left-2">
                            <div className="relative">
                              <div className="h-7 w-7 rounded-full overflow-hidden border border-[#8B5E3C] bg-white">
                                <img
                                  src={user?.avatar ? resolveUrl(user.avatar) : `https://api.dicebear.com/7.x/initials/svg?seed=${user?.username || "user"}`}
                                  alt="Your profile"
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-[#E8AC7D] flex items-center justify-center border border-black">
                                <Plus className="h-2 w-2 text-black" strokeWidth={4} />
                              </div>
                            </div>
                          </div>

                          {/* Text and plus icon bottom */}
                          <div className="absolute bottom-2 left-2 right-2 flex flex-col items-center gap-1 text-center">
                            <span className="text-[10px] font-bold text-white drop-shadow-md">
                              Add to Story
                            </span>
                            <div className="h-6 w-6 rounded-full bg-[#E8AC7D] hover:bg-[#d89c6d] flex items-center justify-center shadow-md transition-colors shrink-0">
                              <Plus className="h-4 w-4 text-black" strokeWidth={3} />
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* Case 2: User HAS active story */
                        (() => {
                          const latestMyStory = myStoryGroup.stories[0];
                          const isVideo = latestMyStory?.mediaType === "video" ||
                            (latestMyStory?.mediaUrl &&
                              (latestMyStory.mediaUrl.endsWith(".mp4") ||
                                latestMyStory.mediaUrl.endsWith(".mov") ||
                                latestMyStory.mediaUrl.includes("/video/upload/")));

                          return (
                            <div
                              onClick={() => openStories(myStoryGroup)}
                              className="w-[90px] h-[140px] shrink-0 relative rounded-[20px] overflow-hidden shadow-xs group cursor-pointer border border-[#E3D8C8]/10 bg-neutral-900"
                            >
                              {/* Background story preview */}
                              {isVideo ? (
                                <video
                                  src={resolveUrl(latestMyStory.mediaUrl)}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                  preload="metadata"
                                  muted
                                  playsInline
                                />
                              ) : (
                                <img
                                  src={resolveUrl(latestMyStory?.mediaUrl)}
                                  alt="Your story preview"
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                              )}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                              {/* Avatar top-left with active ring */}
                              <div className="absolute top-2 left-2">
                                <div className="h-7 w-7 rounded-full p-[1.5px] bg-gradient-to-tr from-[#FA709A] to-[#FEE140]">
                                  <div className="h-full w-full rounded-full overflow-hidden border border-black bg-white">
                                    <img
                                      src={user?.avatar ? resolveUrl(user.avatar) : `https://api.dicebear.com/7.x/initials/svg?seed=${user?.username || "user"}`}
                                      alt="Your profile"
                                      className="h-full w-full object-cover"
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Text bottom */}
                              <div className="absolute bottom-2 left-2 right-2">
                                <span className="text-[10px] font-bold text-white truncate block drop-shadow-md text-center">
                                  Your Story
                                </span>
                              </div>
                            </div>
                          );
                        })()
                      )}

                      {/* Other Users' Stories */}
                      {hasOtherStories ? (
                        otherStories.map((group) => {
                          const latestStory = group.stories[0];
                          return (
                            <div
                              key={group.user._id}
                              onClick={() => openStories(group)}
                              className="w-[90px] h-[140px] shrink-0 relative rounded-[20px] overflow-hidden shadow-xs group cursor-pointer border border-[#E3D8C8]/10 bg-neutral-900"
                            >
                              {latestStory?.mediaType === "video" || (latestStory?.mediaUrl && (latestStory.mediaUrl.endsWith(".mp4") || latestStory.mediaUrl.endsWith(".mov") || latestStory.mediaUrl.includes("/video/upload/"))) ? (
                                <video
                                  src={resolveUrl(latestStory.mediaUrl)}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                  preload="metadata"
                                  muted
                                  playsInline
                                />
                              ) : (
                                <img
                                  src={resolveUrl(latestStory?.mediaUrl)}
                                  alt={group.user.username}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                              )}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

                              {/* Avatar top-left with gradient border */}
                              <div className="absolute top-2 left-2">
                                <div className="h-7 w-7 rounded-full p-[1.5px] bg-gradient-to-tr from-[#FA709A] to-[#FEE140]">
                                  <div className="h-full w-full rounded-full overflow-hidden border border-black bg-white">
                                    <img
                                      src={resolveUrl(group.user.avatar) || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150"}
                                      alt={group.user.username}
                                      className="h-full w-full object-cover"
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Username bottom */}
                              <div className="absolute bottom-2 left-2 right-2">
                                <span className="text-[10px] font-medium text-white truncate block drop-shadow-md">
                                  {group.user.username}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        null
                      )}
                    </div>
                  </section>
                );
              }

              // Render Posts Carousel Section
              if (sectionKey === "posts") {
                return (
                  <section key="posts" className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-bold tracking-wide font-serif">Posts</h2>
                      <button
                        onClick={() => posts.length > 0 && setFeedViewerPostId(posts[0]._id)}
                        className={`text-xs font-semibold ${theme.textSecondary} hover:underline`}
                      >
                        View all
                      </button>
                    </div>

                    <div className="relative group">
                      {/* Left Navigation Arrow */}
                      {canScrollPosts && (
                        <button
                          onClick={() => scrollCarousel(postsCarouselRef, 'left')}
                          className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-[#8B5E3C]/85 hover:bg-[#8B5E3C] text-[#F5F0E8] rounded-full p-2 transition-all hidden sm:flex items-center justify-center shadow-md active:scale-95 cursor-pointer"
                          aria-label="Previous posts"
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </button>
                      )}

                      {/* Right Navigation Arrow */}
                      {canScrollPosts && (
                        <button
                          onClick={() => scrollCarousel(postsCarouselRef, 'right')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-[#8B5E3C]/85 hover:bg-[#8B5E3C] text-[#F5F0E8] rounded-full p-2 transition-all hidden sm:flex items-center justify-center shadow-md active:scale-95 cursor-pointer"
                          aria-label="Next posts"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      )}

                      <div
                        ref={postsCarouselRef}
                        onScroll={handleScroll}
                        onMouseDown={handleDragStart}
                        onMouseLeave={handleDragEnd}
                        onMouseUp={handleDragEnd}
                        onMouseMove={handleDragMove}
                        className="flex flex-row gap-6 overflow-x-auto scrollbar-hide py-2 smooth-scroll cursor-grab active:cursor-grabbing select-none"
                      >
                        {posts.length > 0 ? (
                          posts.map((post) => (
                            <FeedPostCard
                              key={post._id}
                              post={post}
                              theme={theme}
                              onLike={handleLike}
                              onCommentClick={setActiveCommentsPostId}
                              onShareClick={handleShare}
                              onTipClick={setTipModalPost}
                            />
                          ))
                        ) : (
                          <div className="w-full py-8 text-center text-xs opacity-50 border border-dashed rounded-[24px] font-bold">
                            No posts available. Be the first to create one!
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-center pt-2">
                      <div className={`w-32 h-1 rounded-full relative overflow-hidden ${theme.scrollBarTrack}`}>
                        <div
                          className={`h-full w-8 rounded-full absolute top-0 transition-all duration-75 ${theme.scrollBarThumb}`}
                          style={{ left: `${postsScrollProgress * 0.75}%` }}
                        />
                      </div>
                    </div>
                  </section>
                );
              }

              // Render Suggested Creators Section
              if (sectionKey === "suggested") {
                return (
                  <section key="suggested" className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-bold tracking-wide font-serif">Suggested for You</h2>
                      <Link to="/discover" className={`text-xs font-semibold ${theme.textSecondary} flex items-center gap-1 hover:underline`}>
                        <span>Discover</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>

                    <div className="relative group">
                      {/* Left Navigation Arrow */}
                      {canScrollSuggested && (
                        <button
                          onClick={() => scrollCarousel(suggestedCarouselRef, 'left')}
                          className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-[#8B5E3C]/85 hover:bg-[#8B5E3C] text-[#F5F0E8] rounded-full p-2 transition-all hidden sm:flex items-center justify-center shadow-md active:scale-95 cursor-pointer"
                          aria-label="Previous creators"
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </button>
                      )}

                      {/* Right Navigation Arrow */}
                      {canScrollSuggested && (
                        <button
                          onClick={() => scrollCarousel(suggestedCarouselRef, 'right')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-[#8B5E3C]/85 hover:bg-[#8B5E3C] text-[#F5F0E8] rounded-full p-2 transition-all hidden sm:flex items-center justify-center shadow-md active:scale-95 cursor-pointer"
                          aria-label="Next creators"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      )}

                      <div
                        ref={suggestedCarouselRef}
                        onMouseDown={handleDragStart}
                        onMouseLeave={handleDragEnd}
                        onMouseUp={handleDragEnd}
                        onMouseMove={handleDragMove}
                        className="flex gap-4 overflow-x-auto scrollbar-hide py-1 cursor-grab active:cursor-grabbing select-none"
                      >
                        {suggestedCreators.length > 0 ? (
                          suggestedCreators.map((creator) => (
                            <div
                              key={creator._id}
                              className={`w-[170px] shrink-0 p-5 rounded-[24px] border ${theme.cardBorder} ${theme.card} ${theme.shadow} flex flex-col items-center justify-between hover:-translate-y-1 transition-transform duration-300`}
                            >
                              {/* Bug 4: Suggested creator link - navigates to profile when clicking ID/avatar */}
                              <div
                                onClick={(e) => {
                                  const container = suggestedCarouselRef.current;
                                  if (container && container.dataset.hasMoved === "true") {
                                    container.dataset.hasMoved = "false";
                                    return;
                                  }
                                  navigate(`/profile/${creator.username}`);
                                }}
                                className="flex flex-col items-center text-center cursor-pointer group/suggested"
                              >
                                <div className="relative mb-3.5">
                                  <img
                                    src={resolveUrl(creator.avatar) || "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150"}
                                    alt={creator.username}
                                    className="h-16 w-16 rounded-full object-cover border border-[#8B5E3C]/30 shadow-xs transition-transform group-hover/suggested:scale-105"
                                  />
                                  <span className="absolute bottom-0 right-0 h-4 w-4 rounded-full bg-[#8B5E3C] border border-[#EFE6DA] flex items-center justify-center text-white text-[9px] font-bold">+</span>
                                </div>
                                <h4 className="text-xs font-bold truncate max-w-[130px] group-hover/suggested:underline">{creator.name}</h4>
                                <p className="text-[9px] opacity-65 font-medium mt-0.5 truncate max-w-[130px]">{creator.bio || "Content Creator"}</p>
                              </div>

                              <button
                                onClick={() => handleFollowCreator(creator)}
                                className={`w-full mt-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors duration-300 ${creator.isFollowing ? theme.accentButtonSecondary : theme.accentButton
                                  }`}
                              >
                                {creator.isFollowing ? "Following" : "Follow"}
                              </button>
                            </div>
                          ))
                        ) : (
                          <div className="w-full py-8 text-center text-xs opacity-50 border border-dashed rounded-[24px] font-bold">
                            No suggested creators found.
                          </div>
                        )}
                      </div>
                    </div>
                  </section>
                );
              }

              // Render Reels Section
              if (sectionKey === "reels") {
                return (
                  <section key="reels" className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-bold tracking-wide font-serif">Reels Preview</h2>
                      {/* Bug 3b: Click View All in Reels takes user to Reels page */}
                      <button
                        onClick={() => navigate("/reels")}
                        className={`text-xs font-semibold ${theme.textSecondary} hover:underline`}
                      >
                        View all
                      </button>
                    </div>

                    <div className="relative group">
                      {/* Left Navigation Arrow */}
                      {canScrollReels && (
                        <button
                          onClick={() => scrollCarousel(reelsCarouselRef, 'left')}
                          className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-[#8B5E3C]/85 hover:bg-[#8B5E3C] text-[#F5F0E8] rounded-full p-2 transition-all hidden sm:flex items-center justify-center shadow-md active:scale-95 cursor-pointer"
                          aria-label="Previous reels"
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </button>
                      )}

                      {/* Right Navigation Arrow */}
                      {canScrollReels && (
                        <button
                          onClick={() => scrollCarousel(reelsCarouselRef, 'right')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-[#8B5E3C]/85 hover:bg-[#8B5E3C] text-[#F5F0E8] rounded-full p-2 transition-all hidden sm:flex items-center justify-center shadow-md active:scale-95 cursor-pointer"
                          aria-label="Next reels"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      )}

                      <div
                        ref={reelsCarouselRef}
                        onMouseDown={handleDragStart}
                        onMouseLeave={handleDragEnd}
                        onMouseUp={handleDragEnd}
                        onMouseMove={handleDragMove}
                        className="flex gap-4 overflow-x-auto scrollbar-hide py-1 cursor-grab active:cursor-grabbing select-none"
                      >
                        {reels.length > 0 ? (
                          reels.map((reel) => {
                            const isVideo = reel.mediaUrl && (reel.mediaUrl.endsWith(".mp4") || reel.mediaUrl.endsWith(".mov") || reel.mediaUrl.includes("/video/upload/"));
                            const fullMediaUrl = reel.mediaUrl?.startsWith("http") ? reel.mediaUrl : `${API_BASE_URL}/${reel.mediaUrl?.replace(/\\/g, "/")}`;

                            return (
                              <div
                                key={reel._id}
                                /* Bug 3a: Click specific reel card navigates to Reels page and opens that specific reel */
                                onClick={(e) => {
                                  const container = reelsCarouselRef.current;
                                  if (container && container.dataset.hasMoved === "true") {
                                    container.dataset.hasMoved = "false";
                                    return;
                                  }
                                  navigate(`/reels?reelId=${reel._id}`);
                                }}
                                className="w-[140px] h-[210px] shrink-0 relative rounded-[24px] overflow-hidden shadow-xs group cursor-pointer bg-neutral-900"
                              >
                                {isVideo ? (
                                  <video
                                    src={fullMediaUrl}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    preload="metadata"
                                    muted
                                    playsInline
                                  />
                                ) : (
                                  <img
                                    src={reel.mediaUrl || "https://images.unsplash.com/photo-1520156473395-82c498be7bfc?w=400"}
                                    alt="Reel Thumbnail"
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1520156473395-82c498be7bfc?w=400";
                                    }}
                                  />
                                )}

                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                                {/* Play icon overlay */}
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                  <div className="h-10 w-10 rounded-full bg-white/25 backdrop-blur-xs flex items-center justify-center text-white scale-90 group-hover:scale-100 transition-transform duration-300">
                                    <Play className="h-4.5 w-4.5 fill-white ml-0.5" />
                                  </div>
                                </div>

                                <div className="absolute bottom-3 left-3 flex items-center gap-1 text-[10px] font-semibold text-white drop-shadow-md">
                                  <Play className="h-3 w-3 fill-white" />
                                  <span>{reel.views || 0}</span>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="w-full py-8 text-center text-xs opacity-50 border border-dashed rounded-[24px] font-bold">
                            No reels found.
                          </div>
                        )}
                      </div>
                    </div>
                  </section>
                );
              }

              return null;
            })}
          </div>
        </main>

        {/* ==================== RIGHT SIDEBAR ==================== */}
        <aside className={`hidden 2xl:flex w-[300px] xl:w-[320px] shrink-0 sticky top-0 h-screen py-8 border-l ${theme.border} pl-6 flex-col justify-between overflow-y-auto scrollbar-hide`}>

          <div className="space-y-7">
            {/* Header Discover */}
            <div>
              <h2 className="text-xl font-bold tracking-wide font-serif">Discover</h2>
            </div>




            {/* Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide pb-0.5">
              {["For You", "Trending", "People", "Topics", "Events"].map((tab) => {
                const isTabActive = activeDiscoverTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveDiscoverTab(tab)}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-semibold transition-all duration-300 shrink-0 ${isTabActive
                      ? "bg-[#8B5E3C] text-white"
                      : `${theme.card} opacity-80 hover:opacity-100`
                      }`}
                  >
                    {tab}
                  </button>
                );
              })}
            </div>

            {/* Trending Topics List (Bug 5a Fix: sorted based on real post caption hashtag occurrences) */}
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider opacity-65 flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5 text-[#8B5E3C]" />
                  <span>Trending Topics</span>
                </h3>
                <button className={`text-[10px] font-semibold ${theme.textSecondary} hover:underline`}>See all</button>
              </div>

              <div className="space-y-3">
                {getTrendingHashtags().length > 0 ? (
                  getTrendingHashtags().map((topic, i) => (
                    <div key={i} className="flex items-center justify-between gap-3 group cursor-pointer">
                      <div className="flex items-center gap-3">
                        <img src={topic.image} alt={topic.title} className="h-10 w-10 rounded-[12px] object-cover border border-[#8B5E3C]/10" />
                        <div>
                          <p className="text-xs font-bold leading-tight group-hover:text-[#8B5E3C] transition-colors">{topic.title}</p>
                          <p className="text-[10px] opacity-60 font-medium">{topic.posts}</p>
                        </div>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-[#8B5E3C]" />
                    </div>
                  ))
                ) : (
                  <p className="text-[11px] opacity-50 italic py-1">No trending topics active</p>
                )}
              </div>
            </div>

            {/* Popular Communities List (Bug 5b Fix: sorted by members count descending) */}
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider opacity-65 flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-[#8B5E3C]" />
                  <span>Popular Communities</span>
                </h3>
                <button className={`text-[10px] font-semibold ${theme.textSecondary} hover:underline`}>See all</button>
              </div>

              <div className="space-y-3">
                {sortedCommunities.map((comm) => {
                  const isJoined = comm.members?.includes(user?.id || user?._id);
                  return (
                    <div key={comm._id} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={resolveUrl(comm.avatar) || "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=100"}
                          alt={comm.name}
                          className="h-10 w-10 rounded-[12px] object-cover border border-[#8B5E3C]/10"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=100";
                          }}
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold leading-tight truncate max-w-[130px]">{comm.name}</p>
                          <p className="text-[10px] opacity-60 font-medium truncate">
                            {comm.memberCount || comm.members?.length || 0} members
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleCommunityJoinToggle(comm)}
                        className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider transition-colors duration-300 border ${isJoined
                          ? "bg-[#C8B9A6]/20 border-[#C8B9A6]/30 text-opacity-80"
                          : "border-[#8B5E3C] text-[#8B5E3C] hover:bg-[#8B5E3C] hover:text-white"
                          }`}
                      >
                        {isJoined ? "Joined" : "Join"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Featured Creators Section (Bug 5c Fix: sorted by followers count descending) */}
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider opacity-65 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-[#8B5E3C]" />
                  <span>Featured Creators</span>
                </h3>
                <button className={`text-[10px] font-semibold ${theme.textSecondary} hover:underline`}>See all</button>
              </div>

              <div className="flex justify-between items-center gap-2 overflow-x-auto scrollbar-hide py-1">
                {sortedFeaturedCreators.slice(0, 4).map((creator) => (
                  <div key={creator._id} className="flex flex-col items-center text-center shrink-0 w-[68px]">
                    {/* Bug 4: Suggested creator link - navigates to profile when clicking featured creator */}
                    <div
                      onClick={() => navigate(`/profile/${creator.username}`)}
                      className="relative mb-1 cursor-pointer group/featured"
                    >
                      <img
                        src={resolveUrl(creator.avatar) || "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150"}
                        alt={creator.username}
                        className="h-14 w-14 rounded-full object-cover border-2 border-[#8B5E3C] p-0.5 transition-transform group-hover/featured:scale-105"
                      />
                    </div>
                    <p className="text-[10px] font-bold truncate w-full">{creator.name.split(" ")[0]}</p>
                    <p className="text-[8px] opacity-60 truncate w-full">{creator.followers?.length || 0} followers</p>
                    <button
                      onClick={() => handleFollowCreator(creator)}
                      className={`mt-1.5 px-2 py-1 rounded-full text-[8px] font-bold uppercase transition-colors duration-200 border ${creator.isFollowing
                        ? "bg-[#C8B9A6]/20 border-[#C8B9A6]/30 text-opacity-80"
                        : "border-[#8B5E3C] text-[#8B5E3C] hover:bg-[#8B5E3C] hover:text-white"
                        }`}
                    >
                      {creator.isFollowing ? "Followed" : "Follow"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* ==================== DETAILED SEND TIP MODAL ==================== */}
      <AnimatePresence>
        {tipModalPost && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !tippingSuccess && setTipModalPost(null)}
              className="absolute inset-0 bg-[#1F140E]/80 backdrop-blur-xs"
            />

            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className={`w-full max-w-sm rounded-[24px] border ${theme.cardBorder} ${theme.card} p-6 relative overflow-hidden shadow-xl z-10 ${theme.textPrimary}`}
            >
              {!tippingSuccess ? (
                <>
                  <button
                    onClick={() => setTipModalPost(null)}
                    className="absolute top-4 right-4 p-1 rounded-full hover:bg-black/5 opacity-80"
                  >
                    <X className="h-4.5 w-4.5" />
                  </button>

                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="h-12 w-12 rounded-full bg-[#8B5E3C]/10 border border-[#8B5E3C]/20 flex items-center justify-center text-[#8B5E3C] mt-2">
                      <DollarSign className="h-6 w-6" />
                    </div>

                    <div>
                      <h3 className="text-base font-bold font-serif leading-tight">Support Creator</h3>
                      <p className="text-xs opacity-70 mt-1">
                        Send a warm tip to <span className="font-bold">@{tipModalPost.author.name}</span> for their work!
                      </p>
                    </div>

                    <div className="grid grid-cols-4 gap-2 w-full pt-2">
                      {[5, 10, 20, 50].map((amt) => (
                        <button
                          key={amt}
                          onClick={() => {
                            setTipAmount(amt);
                            setCustomTip("");
                          }}
                          className={`py-2 rounded-[16px] text-xs font-bold transition-all border ${tipAmount === amt && !customTip
                            ? "bg-[#8B5E3C] border-[#8B5E3C] text-white shadow-xs scale-105"
                            : `${theme.cardBorder} hover:border-[#8B5E3C]/50`
                            }`}
                        >
                          ${amt}
                        </button>
                      ))}
                    </div>

                    <div className="w-full relative mt-2">
                      <span className="absolute left-3.5 top-3 text-xs opacity-60">$</span>
                      <input
                        type="number"
                        placeholder="Custom amount"
                        value={customTip}
                        onChange={(e) => {
                          setCustomTip(e.target.value);
                          setTipAmount(null);
                        }}
                        className={`w-full pl-7 pr-4 py-2.5 rounded-[16px] text-xs focus:outline-none transition-all ${theme.inputBg} border ${theme.inputBorder} focus:border-[#8B5E3C]`}
                      />
                    </div>

                    <button
                      onClick={handleSendTip}
                      className={`w-full py-3 rounded-full text-xs font-bold uppercase tracking-wider transition-colors duration-300 mt-2 ${theme.accentButton}`}
                    >
                      Confirm Tip
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 space-y-4">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                    className="h-10 w-10 rounded-full border-2 border-[#8B5E3C]/20 border-t-[#8B5E3C]"
                  />
                  <p className="text-xs font-semibold animate-pulse">Processing tip...</p>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================== STORY VIEWER OVERLAY ==================== */}
      <AnimatePresence>
        {activeStoryViewer && activeStoryViewer.stories[storyIndex] && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
            <div className="relative w-full max-w-md h-full max-h-[850px] md:rounded-[24px] overflow-hidden flex flex-col justify-between p-6 bg-[#1F140E]">

              {/* Progress Bar Indicators */}
              <div className="absolute top-4 left-4 right-4 flex gap-1 z-20">
                {activeStoryViewer.stories.map((s, idx) => (
                  <div key={s._id} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white transition-all duration-300"
                      style={{
                        width: idx < storyIndex ? "100%" : idx === storyIndex ? "50%" : "0%"
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* Story Header */}
              <div className="relative z-10 flex items-center justify-between pt-4">
                <div className="flex items-center gap-2.5">
                  <img
                    src={resolveUrl(activeStoryViewer.user.avatar) || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150"}
                    alt={activeStoryViewer.user.username}
                    className="h-9 w-9 rounded-full object-cover border border-[#8B5E3C]"
                  />
                  <span className="text-sm font-bold text-white">@{activeStoryViewer.user.username}</span>
                </div>
                <div className="flex items-center gap-2">
                  {activeStoryViewer.user._id.toString() === (user?.id || user?._id)?.toString() && (
                    <button
                      onClick={async () => {
                        const storyId = activeStoryViewer.stories[storyIndex]._id;
                        try {
                          await api.delete(`/stories/${storyId}`);
                          toast.success("Story deleted successfully!");
                          queryClient.invalidateQueries({ queryKey: ["stories"] });

                          if (activeStoryViewer.stories.length <= 1) {
                            setActiveStoryViewer(null);
                          } else {
                            const updatedGroup = {
                              ...activeStoryViewer,
                              stories: activeStoryViewer.stories.filter((s) => s._id !== storyId)
                            };
                            setActiveStoryViewer(updatedGroup);
                            setStoryIndex(0);
                          }
                        } catch (err) {
                          toast.error("Failed to delete story");
                        }
                      }}
                      className="p-1.5 rounded-full bg-black/40 text-red-500 hover:bg-black/60 hover:text-red-600 transition-colors cursor-pointer"
                      title="Delete Story"
                    >
                      <Trash2 className="h-4.5 w-4.5" />
                    </button>
                  )}
                  <button onClick={() => setActiveStoryViewer(null)} className="p-1 rounded-full bg-black/40 text-white hover:bg-black/60">
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Story Content Area */}
              <div className="absolute inset-0 flex items-center justify-center bg-black">
                {activeStoryViewer.stories[storyIndex].mediaType === "video" ? (
                  <video
                    src={resolveUrl(activeStoryViewer.stories[storyIndex].mediaUrl)}
                    className="w-full max-h-full object-contain"
                    autoPlay
                    playsInline
                    onEnded={nextStory}
                  />
                ) : (
                  <img
                    src={resolveUrl(activeStoryViewer.stories[storyIndex].mediaUrl)}
                    alt="Story media"
                    className="w-full max-h-full object-contain"
                  />
                )}
              </div>

              {/* Left / Right Invisible Tapping Areas */}
              <div className="absolute inset-x-0 top-20 bottom-20 flex">
                <div onClick={prevStory} className="w-1/2 h-full cursor-w-resize" />
                <div onClick={nextStory} className="w-1/2 h-full cursor-e-resize" />
              </div>

              {/* Story Footer message */}
              <div className="relative z-10 text-center pb-4 bg-gradient-to-t from-black/80 to-transparent pt-4 px-4 w-full flex flex-col gap-3">
                {activeStoryViewer.stories[storyIndex].caption && (
                  <p className="text-sm font-semibold text-white drop-shadow-md">
                    {activeStoryViewer.stories[storyIndex].caption}
                  </p>
                )}

                {/* BOTTOM STORY INTERACTION BAR */}
                <div className="flex items-center gap-3 w-full pointer-events-auto px-2">
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setCommentsStoryId(activeStoryViewer.stories[storyIndex]._id);
                    }}
                    className="flex-1 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full py-2 px-4 text-left text-xs font-semibold text-white/70 backdrop-blur-md cursor-pointer transition-all active:scale-[0.98]"
                  >
                    Reply...
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCommentsStoryId(activeStoryViewer.stories[storyIndex]._id);
                    }}
                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white backdrop-blur-md cursor-pointer transition-all"
                    title="Comments"
                  >
                    <MessageCircle className="h-4.5 w-4.5" />
                  </button>
                </div>

                <p className="text-[10px] text-white/40">Tap left to go back, right to advance</p>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* STORY ADDER CONTAINER PANEL */}
      <AddStorySheet
        open={showAddStory}
        onOpenChange={setShowAddStory}
        onStoryAdded={() => {
          queryClient.invalidateQueries({ queryKey: ["stories"] });
          toast.success("Story added successfully!");
        }}
      />

      <CommentsSheet
        open={activeCommentsPostId !== null}
        onOpenChange={(open) => !open && setActiveCommentsPostId(null)}
        postId={activeCommentsPostId || ""}
        onCommentAdded={(count) => activeCommentsPostId && handleCommentAdded(activeCommentsPostId, count)}
      />

      <CommentsSheet
        open={commentsStoryId !== null}
        onOpenChange={(open) => !open && setCommentsStoryId(null)}
        storyId={commentsStoryId || ""}
      />

      <ShareSheet
        open={showShare}
        onOpenChange={setShowShare}
        postId={sharePostId || undefined}
      />
      {feedViewerPostId && (
        <ProfileFeedViewer
          posts={posts}
          initialPostId={feedViewerPostId}
          onClose={() => setFeedViewerPostId(null)}
          onLike={handleLike}
          onCommentClick={setActiveCommentsPostId}
          onShareClick={handleShare}
          onTipClick={setTipModalPost}
        />
      )}
      <MobileBottomNav />
    </div>
  );
}
