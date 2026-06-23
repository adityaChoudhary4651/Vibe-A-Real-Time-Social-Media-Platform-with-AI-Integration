import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Search as SearchIcon,
  X,
  Heart,
  MessageCircle,
  Bookmark,
  Play,
  Eye,
  SlidersHorizontal,
  ChevronDown,
  Edit,
  ArrowRight,
  TrendingUp,
  Users,
  Tag,
  Loader2,
  Clock,
  Compass
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { resolveUrl } from "../config";
import { toggleSave, toggleLike, toggleFollow } from "@/api/posts";
import PostDetailModal from "@/components/post/PostDetailModal";

// Import all search React Query hooks
import {
  useSearchUsers,
  useSearchPosts,
  useSearchReels,
  useSearchHashtags,
  useSearchCommunities,
  useTrendingHashtags,
  useRecentSearches,
  useAddRecentSearch,
  useClearRecentSearches,
  useDeleteRecentSearchItem,
  useSearchSuggestions,
  useMotivationalThought,
  useUpdateMotivationalThought,
  useLatestPost,
  useFriendsPosts,
  usePeopleSuggestions
} from "@/hooks/useSearch";
import { useQueryClient } from "@tanstack/react-query";

/* ================= HELPER FUNCTIONS ================= */

function formatTimeAgo(dateString?: string) {
  if (!dateString) return "just now";
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "just now";
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 1) return `${diffMins}m ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 1) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

function formatCount(num?: number) {
  if (!num) return "0";
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  }
  return num.toString();
}

/* ================= MAIN COMPONENT ================= */

export default function Search() {
  const navigate = useNavigate();
  const { token, user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  // Synchronized global dark mode state
  const [isDark, setIsDark] = useState(() => localStorage.getItem("vibe_theme") === "dark");

  useEffect(() => {
    const handleThemeChange = () => {
      setIsDark(localStorage.getItem("vibe_theme") === "dark");
    };
    window.addEventListener("themeChange", handleThemeChange);
    return () => window.removeEventListener("themeChange", handleThemeChange);
  }, []);

  const theme = {
    bg: isDark ? "bg-[#1F140E]" : "bg-[#F5F0E8]",
    card: isDark ? "bg-[#2A1D16]" : "bg-[#EFE6DA]",
    cardBorder: isDark ? "border-[#3D2A1F]" : "border-[#E3D8C8]",
    textPrimary: isDark ? "text-[#F5F0E8]" : "text-[#4A3428]",
    textSecondary: isDark ? "text-[#D2C5B4]" : "text-[#8B5E3C]",
    border: isDark ? "border-[#3D2A1F]" : "border-[#E3D8C8]",
    navActive: isDark ? "bg-[#3D2A1F]" : "bg-[#EFE6DA]",
    navHover: isDark ? "hover:bg-[#2A1D16]/50" : "hover:bg-[#EFE6DA]/50",
  };

  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"All" | "People" | "Posts" | "Reels" | "Topics" | "Communities">("All");
  const [mediaFilter, setMediaFilter] = useState<"All" | "Photos" | "Reels">("All");
  const [isFocused, setIsFocused] = useState(false);

  // Modal / Form states
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [editQuoteOpen, setEditQuoteOpen] = useState(false);
  const [editQuoteText, setEditQuoteText] = useState("");
  const [editQuoteAuthor, setEditQuoteAuthor] = useState("");

  const dropdownRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<HTMLDivElement | null>(null);

  // Debouncing search query (300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Click outside to close recent search history panel
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ================= FETCHING HOOKS ================= */

  // Recent searches, suggestions & trending
  const { data: recentSearches = [] } = useRecentSearches();
  const { data: suggestions = [] } = useSearchSuggestions(debouncedQuery);
  const { data: trendingHashtags = [] } = useTrendingHashtags(6);

  // Sidebar hooks
  const { data: quoteData } = useMotivationalThought();
  const { data: latestPost } = useLatestPost();
  const { data: friendsPosts = [] } = useFriendsPosts();
  const { data: suggestedUsers = [] } = usePeopleSuggestions();

  // Mutations
  const addRecentSearchMutation = useAddRecentSearch();
  const clearRecentSearchesMutation = useClearRecentSearches();
  const deleteRecentSearchMutation = useDeleteRecentSearchItem();
  const updateQuoteMutation = useUpdateMotivationalThought();

  // Initialize quote edit form when quoteData arrives
  useEffect(() => {
    if (quoteData) {
      setEditQuoteText(quoteData.text);
      setEditQuoteAuthor(quoteData.author || "");
    }
  }, [quoteData]);

  // Main search queries depending on active tab
  const postsQuery = useSearchPosts(
    debouncedQuery,
    activeTab === "Posts" ? "Photos" : activeTab === "Reels" ? "Reels" : mediaFilter
  );
  const usersQuery = useSearchUsers(debouncedQuery);
  const reelsQuery = useSearchReels(debouncedQuery);
  const hashtagsQuery = useSearchHashtags(debouncedQuery);
  const communitiesQuery = useSearchCommunities(debouncedQuery);

  /* ================= ACTION HANDLERS ================= */

  const triggerSearch = (term: string) => {
    setSearchQuery(term);
    setIsFocused(false);
    if (term.trim()) {
      addRecentSearchMutation.mutate(term.trim());
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      triggerSearch(searchQuery.trim());
    }
  };

  const handleLikePost = async (e: React.MouseEvent, post: any) => {
    e.stopPropagation();
    if (!token) return;
    try {
      await toggleLike(token, post._id);
      // Invalidate current page queries to reload real MongoDB states
      queryClient.invalidateQueries({ queryKey: ["search-posts"] });
      queryClient.invalidateQueries({ queryKey: ["sidebar-latest-post"] });
      queryClient.invalidateQueries({ queryKey: ["sidebar-friends-posts"] });
    } catch (err) {
      toast.error("Failed to like post");
    }
  };

  const handleSavePost = async (e: React.MouseEvent, post: any) => {
    e.stopPropagation();
    if (!token) return;
    try {
      await toggleSave(token, post._id);
      queryClient.invalidateQueries({ queryKey: ["search-posts"] });
      toast.success(post.isSaved ? "Removed from saves" : "Post saved successfully!");
    } catch (err) {
      toast.error("Failed to save post");
    }
  };

  const handleFollowUser = async (e: React.MouseEvent, username: string) => {
    e.stopPropagation();
    if (!token) return;
    try {
      await toggleFollow(token, username);
      queryClient.invalidateQueries({ queryKey: ["sidebar-people-suggestions"] });
      queryClient.invalidateQueries({ queryKey: ["sidebar-friends-posts"] });
      queryClient.invalidateQueries({ queryKey: ["search-users"] });
      toast.success(`Updated follow status for @${username}`);
    } catch (err) {
      toast.error("Failed to toggle follow");
    }
  };

  const handleSaveQuote = () => {
    if (!editQuoteText.trim()) {
      toast.error("Quote content is required");
      return;
    }
    updateQuoteMutation.mutate(
      { text: editQuoteText.trim(), author: editQuoteAuthor.trim() || "Anonymous" },
      {
        onSuccess: () => {
          setEditQuoteOpen(false);
          toast.success("Motivational thought updated successfully!");
        },
        onError: () => {
          toast.error("Failed to update quote");
        }
      }
    );
  };

  /* ================= PAGINATION SETUP ================= */

  const getQueryForActiveTab = () => {
    switch (activeTab) {
      case "All":
      case "Posts":
      case "Reels":
        return postsQuery;
      case "People":
        return usersQuery;
      case "Topics":
        return hashtagsQuery;
      case "Communities":
        return communitiesQuery;
    }
  };

  const activeQuery = getQueryForActiveTab();
  const { data, hasNextPage, fetchNextPage, isFetchingNextPage } = activeQuery;

  // Set up automatic infinite scroll trigger
  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPage();
        }
      },
      { threshold: 0.8 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => {
      if (observerRef.current) {
        observer.unobserve(observerRef.current);
      }
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Extract items flat list from paginated pages
  const getItemsList = () => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page: any) => {
      if (activeTab === "People") return page.users || [];
      if (activeTab === "Topics") return page.hashtags || [];
      if (activeTab === "Communities") return page.communities || [];
      return page.posts || [];
    });
  };

  const itemsList = getItemsList();

  return (
    <div className={cn("flex w-full min-h-screen p-3 sm:p-6 gap-6 font-sans transition-colors duration-500", theme.bg, theme.textPrimary)}>
      {/* 1. MAIN CONTENT AREA */}
      <div className="flex-1 space-y-6 max-w-full overflow-hidden">
        
        {/* SEARCH BAR CONTAINER */}
        <div className="relative w-full" ref={dropdownRef}>
          <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full">
            <div className="relative flex-1 bg-[#EFE6DA]/70 border border-[#E3D8C8] rounded-2xl flex items-center px-4 py-2 transition focus-within:ring-2 focus-within:ring-[#8B5E3C] focus-within:border-[#8B5E3C]">
              <SearchIcon className="h-5 w-5 text-[#8B5E3C] mr-3 flex-shrink-0" />
              <Input
                type="text"
                value={searchQuery}
                onFocus={() => setIsFocused(true)}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for people, posts, reels, topics, communities..."
                className="bg-transparent border-none text-base outline-none ring-0 placeholder-[#8B5E3C]/60 text-[#4A3428] w-full focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-none focus-visible:border-none shadow-none h-9 p-0"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="p-1 text-[#8B5E3C]/60 hover:text-[#8B5E3C]"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Button
              type="button"
              className="bg-[#EFE6DA] hover:bg-[#E2D6C5] border border-[#E3D8C8] text-[#8B5E3C] p-3 rounded-2xl flex-shrink-0"
            >
              <SlidersHorizontal className="h-5 w-5" />
            </Button>
          </form>

          {/* FOCUS HISTORY & SUGGESTIONS OVERLAY */}
          {isFocused && (
            <div className="absolute top-[105%] left-0 right-0 bg-[#FBF9F6] border border-[#E3D8C8] rounded-2xl shadow-xl z-50 p-4 max-h-[380px] overflow-y-auto space-y-4">
              
              {/* SUGGESTIONS SECTION (WHEN QUERY ENTERED) */}
              {searchQuery.trim() && suggestions.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-[#8B5E3C] uppercase tracking-wider">Suggestions</h4>
                  <div className="space-y-1">
                    {suggestions.map((item: any, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => triggerSearch(item.text)}
                        className="flex items-center gap-3 w-full p-2 hover:bg-[#EFE6DA]/40 rounded-xl text-left transition"
                      >
                        <Avatar className="h-8 w-8 border border-[#E3D8C8]">
                          <AvatarImage src={resolveUrl(item.avatar)} />
                          <AvatarFallback className="bg-[#EFE6DA] text-[#8B5E3C] text-xs">
                            {item.text.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-semibold text-sm">{item.text}</p>
                          <p className="text-xs text-[#8B5E3C]/70 capitalize">{item.type}</p>
                        </div>
                        <Compass className="h-4 w-4 text-[#8B5E3C]/50" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* RECENT SEARCH HISTORY SECTION */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-[#8B5E3C] uppercase tracking-wider">Recent Searches</h4>
                  {recentSearches.length > 0 && (
                    <button
                      onClick={() => clearRecentSearchesMutation.mutate()}
                      className="text-xs text-[#8B5E3C] hover:underline font-semibold"
                    >
                      Clear all
                    </button>
                  )}
                </div>

                {recentSearches.length > 0 ? (
                  <div className="space-y-1">
                    {recentSearches.map((history: any) => (
                      <div
                        key={history._id}
                        className="flex items-center justify-between p-2 hover:bg-[#EFE6DA]/40 rounded-xl transition"
                      >
                        <button
                          onClick={() => triggerSearch(history.term)}
                          className="flex items-center gap-3 flex-1 text-left"
                        >
                          <Clock className="h-4 w-4 text-[#8B5E3C]/60" />
                          <span className="text-sm font-medium">{history.term}</span>
                        </button>
                        <button
                          onClick={() => deleteRecentSearchMutation.mutate(history._id)}
                          className="p-1 text-[#8B5E3C]/40 hover:text-[#8B5E3C] hover:bg-[#EFE6DA]/60 rounded-md transition"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#8B5E3C]/60 py-2 italic text-center">No recent searches</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* TOP FILTER TABS */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {(["All", "People", "Posts", "Reels", "Topics", "Communities"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                queryClient.invalidateQueries({ queryKey: [`search-${tab.toLowerCase()}`] });
              }}
              className={cn(
                "px-5 py-2.5 rounded-full text-sm font-semibold transition flex-shrink-0 cursor-pointer",
                activeTab === tab
                  ? "bg-[#5C3E2F] text-[#F5F0E8] shadow-md"
                  : "bg-[#EFE6DA] text-[#8B5E3C] hover:bg-[#E2D6C5]"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* SUB-FILTERS / MEDIA FILTERS (Photos vs Reels - visible on All, Posts, Reels) */}
        {(activeTab === "All" || activeTab === "Posts" || activeTab === "Reels") && (
          <div className="flex justify-between items-center flex-wrap gap-3">
            <div className="flex items-center gap-2 bg-[#EFE6DA]/40 p-1 rounded-xl border border-[#E3D8C8]">
              {(["All", "Photos", "Reels"] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setMediaFilter(filter)}
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer",
                    mediaFilter === filter
                      ? "bg-[#5C3E2F] text-[#F5F0E8] shadow-xs"
                      : "text-[#8B5E3C] hover:bg-[#EFE6DA]/85"
                  )}
                >
                  {filter === "All" ? "All (Both)" : filter === "Photos" ? "Photos Only" : "Reels Only"}
                </button>
              ))}
            </div>

            <div className="text-xs text-[#8B5E3C] font-semibold bg-[#EFE6DA]/40 px-3 py-1.5 rounded-xl border border-[#E3D8C8]">
              Sort By: <span className="text-[#4A3428] font-bold">Most Relevant</span>
            </div>
          </div>
        )}

        {/* LOADING STATE */}
        {activeQuery.isLoading && (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="h-10 w-10 text-[#8B5E3C] animate-spin" />
            <p className="text-sm font-semibold text-[#8B5E3C]">Fetching actual MongoDB results...</p>
          </div>
        )}

        {/* EMPTY STATE */}
        {!activeQuery.isLoading && itemsList.length === 0 && (
          <div className="bg-[#EFE6DA]/30 border border-[#E3D8C8] rounded-3xl p-12 text-center space-y-3">
            <p className="text-xl font-bold text-[#8B5E3C]">No results found</p>
            <p className="text-sm text-[#8B5E3C]/80">
              We couldn't find anything matching "{debouncedQuery}" in {activeTab}. Try checking spelling or search tags.
            </p>
            <Button
              onClick={() => setSearchQuery("")}
              className="bg-[#8B5E3C] hover:bg-[#5C3E2F] text-[#F5F0E8] rounded-full px-6"
            >
              Clear Search
            </Button>
          </div>
        )}

        {/* 2. MASONRY PINTEREST GRID */}
        {!activeQuery.isLoading && itemsList.length > 0 && (
          <div className="space-y-6">
            
            {/* GRID CONDITIONAL ON TAB */}
            {activeTab === "People" ? (
              // People List / Grid
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {itemsList.map((user: any) => (
                  <div
                    key={user._id}
                    className="bg-[#EFE6DA]/40 border border-[#E3D8C8] p-4 rounded-2xl flex flex-col items-center text-center space-y-3"
                  >
                    <Avatar className="h-16 w-16 border-2 border-[#8B5E3C]">
                      <AvatarImage src={resolveUrl(user.avatar)} />
                      <AvatarFallback className="bg-[#5C3E2F] text-[#F5F0E8] text-lg font-bold">
                        {user.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-bold text-base line-clamp-1">{user.name}</h4>
                      <p className="text-xs text-[#8B5E3C] font-semibold">@{user.username}</p>
                    </div>
                    {user.bio && <p className="text-xs text-[#4A3428]/80 line-clamp-2 h-8">{user.bio}</p>}
                    
                    <div className="flex gap-4 text-xs font-semibold text-[#8B5E3C]">
                      <p>{formatCount(user.followers?.length)} Followers</p>
                      <p>{formatCount(user.following?.length)} Following</p>
                    </div>

                    <div className="flex gap-2 w-full pt-1">
                      <Button
                        onClick={() => navigate(`/profile/${user.username}`)}
                        className="flex-1 bg-[#EFE6DA] hover:bg-[#E2D6C5] text-[#8B5E3C] rounded-xl text-xs py-1.5 h-auto font-semibold"
                      >
                        Profile
                      </Button>
                      {currentUser?.username !== user.username && (
                        <Button
                          onClick={(e) => handleFollowUser(e, user.username)}
                          className={cn(
                            "flex-1 rounded-xl text-xs py-1.5 h-auto font-bold transition",
                            user.followers?.includes(currentUser?.id)
                              ? "bg-[#EFE6DA] text-[#8B5E3C] hover:bg-destructive/10 hover:text-destructive border border-destructive/20"
                              : "bg-[#8B5E3C] hover:bg-[#5C3E2F] text-[#F5F0E8]"
                          )}
                        >
                          {user.followers?.includes(currentUser?.id) ? "Following" : "Follow"}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : activeTab === "Topics" ? (
              // Hashtags / Topics Grid
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {itemsList.map((tag: any, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => triggerSearch(tag.title)}
                    className="bg-[#EFE6DA]/40 hover:bg-[#EFE6DA]/60 border border-[#E3D8C8] p-4 rounded-2xl text-left space-y-3 transition flex flex-col justify-between"
                  >
                    <div className="h-10 w-10 bg-[#5C3E2F]/10 rounded-xl flex items-center justify-center text-[#5C3E2F]">
                      <Tag className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-base line-clamp-1">{tag.title}</h4>
                      <p className="text-xs text-[#8B5E3C] font-semibold mt-1">
                        {formatCount(tag.postsCount)} posts
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            ) : activeTab === "Communities" ? (
              // Communities Grid
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {itemsList.map((c: any) => (
                  <div
                    key={c._id}
                    className="bg-[#EFE6DA]/40 border border-[#E3D8C8] p-4 rounded-2xl flex flex-col justify-between space-y-4"
                  >
                    <div className="flex gap-3">
                      <Avatar className="h-12 w-12 rounded-xl border border-[#E3D8C8]">
                        <AvatarImage src={resolveUrl(c.avatar)} />
                        <AvatarFallback className="bg-[#EFE6DA] text-[#8B5E3C] font-bold rounded-xl">
                          {c.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h4 className="font-bold text-base line-clamp-1">{c.name}</h4>
                        <p className="text-xs text-[#8B5E3C] font-semibold mt-0.5">
                          {formatCount(c.memberCount || c.members?.length)} Members
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-[#4A3428]/80 line-clamp-2 h-8">{c.description}</p>
                    <Button
                      onClick={() => navigate(`/communities`)} // Navigate to communities page
                      className="w-full bg-[#8B5E3C] hover:bg-[#5C3E2F] text-[#F5F0E8] rounded-xl text-xs py-2 font-bold"
                    >
                      View Community
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              // Main Posts & Reels - Pinterest Masonry Grid
              <div className="columns-2 md:columns-3 gap-4 space-y-4">
                {itemsList.map((post: any, idx: number) => {
                  // Let's insert the custom Quote Card inside the feed stream at index 3 for the "All" view
                  const showEmbedQuote = activeTab === "All" && idx === 3;
                  
                  return (
                    <div key={post._id} className="break-inside-avoid">
                      
                      {/* Quote block inserted inline */}
                      {showEmbedQuote && (
                        <div className="bg-[#EFE6DA] p-6 rounded-2xl border border-[#E3D8C8] flex flex-col justify-between aspect-square mb-4">
                          <span className="text-[#8B5E3C] text-5xl font-serif leading-none">“</span>
                          <p className="text-[#4A3428] text-base font-semibold leading-relaxed my-2">
                            {quoteData?.text || "Collect moments, not things."}
                          </p>
                          <div className="flex justify-between items-end border-t border-[#E3D8C8]/60 pt-3">
                            <span className="text-[10px] text-[#8B5E3C] font-bold uppercase tracking-wider">
                              — {quoteData?.author || "Vibe"}
                            </span>
                            <span className="text-lg opacity-40">🌱</span>
                          </div>
                        </div>
                      )}

                      {/* Main Post Card */}
                      <div
                        onClick={() => {
                          if (post.type === "reel") {
                            navigate(`/reels?reelId=${post._id}`);
                          } else {
                            setSelectedPost(post);
                          }
                        }}
                        className="relative overflow-hidden rounded-2xl group cursor-pointer shadow-sm border border-[#E3D8C8] bg-[#EFE6DA]/40 group-hover:shadow-md transition-all duration-300"
                      >
                        {/* Post image/video static preview */}
                        {post.type === "reel" || post.mediaType === "video" || (post.mediaUrl && (post.mediaUrl.endsWith(".mp4") || post.mediaUrl.endsWith(".mov") || post.mediaUrl.includes("/video/upload/"))) ? (
                          <video
                            src={resolveUrl(post.mediaUrl)}
                            className="w-full object-cover rounded-2xl max-h-[380px] min-h-[160px]"
                            preload="metadata"
                            muted
                            playsInline
                          />
                        ) : (
                          <img
                            src={resolveUrl(post.mediaUrl || post.imageUrl)}
                            alt={post.caption || "Vibe Post"}
                            className="w-full object-cover rounded-2xl max-h-[380px] min-h-[160px]"
                            loading="lazy"
                          />
                        )}

                        {/* Top right icon badge (Photos vs Reels) */}
                        <div className="absolute top-3 right-3 p-1.5 bg-black/40 backdrop-blur-xs rounded-lg text-white">
                          {post.type === "reel" ? (
                            <Play className="h-4.5 w-4.5 fill-white text-white" />
                          ) : (
                            <Bookmark className="h-4.5 w-4.5" />
                          )}
                        </div>

                        {/* Bottom Info overlay on Hover */}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#2A1D16]/90 via-[#2A1D16]/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4 text-[#F5F0E8]">
                          
                          {/* Caption */}
                          {post.caption && (
                            <p className="text-xs font-medium line-clamp-2 mb-3 leading-relaxed">
                              {post.caption}
                            </p>
                          )}

                          <div className="flex items-center justify-between">
                            
                            {/* Author */}
                            <div className="flex items-center gap-2">
                              <Avatar className="h-7 w-7 border border-[#F5F0E8]/40">
                                <AvatarImage src={resolveUrl(post.author?.avatar)} />
                                <AvatarFallback className="bg-[#5C3E2F] text-[#F5F0E8] text-[10px] font-bold">
                                  {post.author?.username?.charAt(0).toUpperCase() || "U"}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-xs font-semibold truncate max-w-[80px]">
                                @{post.author?.username || "unknown"}
                              </span>
                            </div>

                            {/* Engagement icons */}
                            <div className="flex items-center gap-2">
                              {post.type === "reel" ? (
                                <div className="flex items-center gap-1 text-[11px] font-semibold bg-white/20 px-2 py-0.5 rounded-md">
                                  <Eye className="h-3.5 w-3.5" />
                                  <span>{formatCount(post.views || 0)}</span>
                                </div>
                              ) : (
                                <>
                                  <button
                                    onClick={(e) => handleLikePost(e, post)}
                                    className="hover:scale-110 transition active:scale-95"
                                  >
                                    <Heart
                                      className={cn(
                                        "h-4 w-4",
                                        post.isLiked ? "fill-red-500 text-red-500" : "text-white"
                                      )}
                                    />
                                  </button>
                                  <span className="text-[11px] font-semibold">{formatCount(post.likesCount || post.likes?.length)}</span>

                                  <button
                                    onClick={(e) => handleSavePost(e, post)}
                                    className="hover:scale-110 transition ml-1"
                                  >
                                    <Bookmark
                                      className={cn(
                                        "h-4 w-4",
                                        post.isSaved ? "fill-[#8B5E3C] text-[#8B5E3C]" : "text-white"
                                      )}
                                    />
                                  </button>
                                </>
                              )}
                            </div>

                          </div>
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* FETCHING NEXT PAGE LOADER */}
            {isFetchingNextPage && (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 text-[#8B5E3C] animate-spin" />
              </div>
            )}

            {/* Observer target */}
            <div ref={observerRef} className="h-4" />

            {/* Clickable Load More CTA */}
            {hasNextPage && !isFetchingNextPage && (
              <div className="flex justify-center mt-6">
                <Button
                  onClick={() => fetchNextPage()}
                  className="bg-[#EFE6DA] hover:bg-[#8B5E3C] hover:text-[#F5F0E8] text-[#8B5E3C] border border-[#E3D8C8] px-6 py-2 rounded-full text-sm font-semibold transition flex items-center gap-2 h-auto"
                >
                  Load more
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
            )}

          </div>
        )}

      </div>

      {/* 3. RIGHT SIDEBAR */}
      <div className="hidden xl:block w-80 space-y-6 flex-shrink-0">
        
        {/* WIDGET: MOTIVATIONAL THOUGHT */}
        <div className="bg-[#EFE6DA]/40 border border-[#E3D8C8] rounded-3xl p-5 relative overflow-hidden space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-[#8B5E3C] uppercase tracking-wider">Today's Motivational Thought</h3>
            <button
              onClick={() => setEditQuoteOpen(true)}
              className="p-1 hover:bg-[#EFE6DA] rounded-lg text-[#8B5E3C] transition"
            >
              <Edit className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="space-y-2">
            <span className="text-[#8B5E3C] text-4xl font-serif leading-none block">“</span>
            <p className="text-base font-bold italic leading-relaxed text-[#4A3428]">
              {quoteData?.text || "Believe in yourself a little more."}
            </p>
            <p className="text-xs text-[#8B5E3C] font-semibold text-right">
              — {quoteData?.author || "Vibe"}
            </p>
          </div>

          {/* Minimal heart SVG drawing outline on background */}
          <div className="absolute right-4 bottom-2 text-[#8B5E3C]/10 select-none pointer-events-none text-6xl">
            ♥
          </div>
        </div>

        {/* WIDGET: YOUR LATEST POST */}
        {latestPost && latestPost._id ? (
          <div className="bg-[#EFE6DA]/40 border border-[#E3D8C8] rounded-3xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-[#8B5E3C] uppercase tracking-wider">Your Latest Post</h3>
            
            <div className="flex gap-3">
              {latestPost.mediaType === "video" || (latestPost.mediaUrl && (latestPost.mediaUrl.endsWith(".mp4") || latestPost.mediaUrl.endsWith(".mov") || latestPost.mediaUrl.includes("/video/upload/"))) ? (
                <video
                  src={resolveUrl(latestPost.mediaUrl)}
                  className="h-16 w-16 object-cover rounded-xl border border-[#E3D8C8]"
                  preload="metadata"
                  muted
                  playsInline
                />
              ) : (
                <img
                  src={resolveUrl(latestPost.mediaUrl || latestPost.imageUrl)}
                  alt="Your latest post"
                  className="h-16 w-16 object-cover rounded-xl border border-[#E3D8C8]"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate text-[#4A3428]">
                  {latestPost.caption || "Untitled post"}
                </p>
                <p className="text-xs text-[#8B5E3C] mt-1">{formatTimeAgo(latestPost.createdAt)}</p>
              </div>
            </div>

            <div className="flex items-center justify-around border-t border-b border-[#E3D8C8]/60 py-2 text-xs font-bold text-[#8B5E3C]">
              <div className="flex items-center gap-1">
                <Heart className="h-3.5 w-3.5 text-[#8B5E3C]" />
                <span>{formatCount(latestPost.likesCount)}</span>
              </div>
              <div className="flex items-center gap-1">
                <MessageCircle className="h-3.5 w-3.5 text-[#8B5E3C]" />
                <span>{formatCount(latestPost.commentsCount)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Eye className="h-3.5 w-3.5 text-[#8B5E3C]" />
                <span>{formatCount(latestPost.views)}</span>
              </div>
            </div>

            <button
              onClick={() => navigate(`/post/${latestPost._id}`)}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-[#EFE6DA] hover:bg-[#E2D6C5] text-[#8B5E3C] text-xs font-bold border border-[#E3D8C8] transition active:scale-95"
            >
              View post
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <div className="bg-[#EFE6DA]/40 border border-[#E3D8C8] rounded-3xl p-5 space-y-2 text-center">
            <h3 className="text-xs font-bold text-[#8B5E3C] uppercase tracking-wider">Your Latest Post</h3>
            <p className="text-xs text-[#8B5E3C]/60 italic py-2">No posts created yet</p>
          </div>
        )}

        {/* WIDGET: FRIENDS' LATEST POSTS */}
        <div className="bg-[#EFE6DA]/40 border border-[#E3D8C8] rounded-3xl p-5 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-[#8B5E3C] uppercase tracking-wider">Friends' Latest Posts</h3>
            <button
              onClick={() => navigate("/")}
              className="text-xs text-[#8B5E3C] hover:underline font-bold"
            >
              View all
            </button>
          </div>

          {Array.isArray(friendsPosts) && friendsPosts.length > 0 ? (
            <div className="space-y-3">
              {friendsPosts.map((post: any) => (
                <div
                  key={post._id}
                  onClick={() => navigate(`/post/${post._id}`)}
                  className="flex items-center justify-between hover:bg-[#EFE6DA]/60 p-1.5 rounded-xl transition cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8 border border-[#E3D8C8]">
                      <AvatarImage src={resolveUrl(post.author?.avatar)} />
                      <AvatarFallback className="bg-[#5C3E2F] text-[#F5F0E8] text-xs font-bold">
                        {post.author?.username?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-xs font-bold">@{post.author?.username}</p>
                      <p className="text-[10px] text-[#8B5E3C] mt-0.5">{formatTimeAgo(post.createdAt)}</p>
                    </div>
                  </div>
                  {post.mediaType === "video" || (post.mediaUrl && (post.mediaUrl.endsWith(".mp4") || post.mediaUrl.endsWith(".mov") || post.mediaUrl.includes("/video/upload/"))) ? (
                    <video
                      src={resolveUrl(post.mediaUrl)}
                      className="h-10 w-10 object-cover rounded-lg border border-[#E3D8C8]"
                      preload="metadata"
                      muted
                      playsInline
                    />
                  ) : (
                    <img
                      src={resolveUrl(post.mediaUrl || post.imageUrl)}
                      alt="Friend post thumbnail"
                      className="h-10 w-10 object-cover rounded-lg border border-[#E3D8C8]"
                    />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#8B5E3C]/60 italic py-2 text-center">No posts from following users</p>
          )}
        </div>

        {/* WIDGET: PEOPLE YOU MAY KNOW */}
        <div className="bg-[#EFE6DA]/40 border border-[#E3D8C8] rounded-3xl p-5 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-[#8B5E3C] uppercase tracking-wider">People You May Know</h3>
            <button
              onClick={() => navigate("/discover")}
              className="text-xs text-[#8B5E3C] hover:underline font-bold"
            >
              View all
            </button>
          </div>

          {Array.isArray(suggestedUsers) && suggestedUsers.length > 0 ? (
            <div className="space-y-3">
              {suggestedUsers.map((user: any) => (
                <div
                  key={user._id}
                  className="flex items-center justify-between hover:bg-[#EFE6DA]/60 p-1.5 rounded-xl transition"
                >
                  <div
                    onClick={() => navigate(`/profile/${user.username}`)}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Avatar className="h-8 w-8 border border-[#E3D8C8]">
                      <AvatarImage src={resolveUrl(user.avatar)} />
                      <AvatarFallback className="bg-[#5C3E2F] text-[#F5F0E8] text-xs font-bold">
                        {user.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate max-w-[85px]">{user.name}</p>
                      <p className="text-[10px] text-[#8B5E3C] truncate max-w-[85px]">@{user.username}</p>
                    </div>
                  </div>
                  <Button
                    onClick={(e) => handleFollowUser(e, user.username)}
                    className="bg-[#8B5E3C] hover:bg-[#5C3E2F] text-[#F5F0E8] rounded-full text-[10px] font-bold px-3 py-1 h-auto"
                  >
                    Follow
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#8B5E3C]/60 italic py-2 text-center">No suggestions available</p>
          )}
        </div>

        {/* WIDGET: TRENDING TOPICS */}
        <div className="bg-[#EFE6DA]/40 border border-[#E3D8C8] rounded-3xl p-5 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-[#8B5E3C] uppercase tracking-wider">Trending Topics</h3>
            <button
              onClick={() => {
                setActiveTab("Topics");
                queryClient.invalidateQueries({ queryKey: ["search-hashtags"] });
              }}
              className="text-xs text-[#8B5E3C] hover:underline font-bold"
            >
              View all
            </button>
          </div>

          {Array.isArray(trendingHashtags) && trendingHashtags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {trendingHashtags.map((tag: any, idx: number) => (
                <button
                  key={idx}
                  onClick={() => triggerSearch(tag.title)}
                  className="bg-[#EFE6DA] hover:bg-[#E2D6C5] border border-[#E3D8C8] text-[#8B5E3C] font-semibold text-xs px-3 py-1.5 rounded-full transition cursor-pointer"
                >
                  {tag.title}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#8B5E3C]/60 italic py-2 text-center">No trending hashtags found</p>
          )}
        </div>

      </div>

      {/* 4. MODALS / SHEET DIALOGS */}
      
      {/* DIALOG: EDIT MOTIVATIONAL THOUGHT */}
      <Dialog open={editQuoteOpen} onOpenChange={setEditQuoteOpen}>
        <DialogContent className="bg-[#F5F0E8] text-[#4A3428] border border-[#E3D8C8]">
          <DialogHeader>
            <DialogTitle className="text-[#8B5E3C]">Update Today's Motivational Thought</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#8B5E3C]">Quote Content</label>
              <textarea
                value={editQuoteText}
                onChange={(e) => setEditQuoteText(e.target.value)}
                className="w-full bg-[#EFE6DA] border border-[#E3D8C8] rounded-xl p-3 text-sm focus:ring-1 focus:ring-[#8B5E3C] outline-none text-[#4A3428] resize-none h-24"
                placeholder="Enter quote message..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#8B5E3C]">Author</label>
              <Input
                type="text"
                value={editQuoteAuthor}
                onChange={(e) => setEditQuoteAuthor(e.target.value)}
                className="bg-[#EFE6DA] border border-[#E3D8C8] rounded-xl text-sm focus-visible:ring-1 focus-visible:ring-[#8B5E3C] outline-none text-[#4A3428]"
                placeholder="Author name..."
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              onClick={() => setEditQuoteOpen(false)}
              className="bg-[#EFE6DA] hover:bg-[#E2D6C5] text-[#8B5E3C] rounded-full px-5 font-semibold"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveQuote}
              className="bg-[#8B5E3C] hover:bg-[#5C3E2F] text-[#F5F0E8] rounded-full px-5 font-bold"
            >
              Save Quote
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG: POST DETAILS */}
      {selectedPost && (
        <PostDetailModal
          open={!!selectedPost}
          onClose={() => setSelectedPost(null)}
          post={{
            ...selectedPost,
            imageUrl: resolveUrl(selectedPost.mediaUrl || selectedPost.imageUrl),
            likes: selectedPost.likesCount || selectedPost.likes?.length || 0,
            isLiked: selectedPost.isLiked,
            author: selectedPost.author,
            user: selectedPost.author, // Fallback adapt for PostDetailModal prop
          }}
        />
      )}

    </div>
  );
}
