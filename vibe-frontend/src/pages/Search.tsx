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
  useSearchAll,
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
    navActive: isDark ? "bg-[#5C3E2F] text-[#F5F0E8]" : "bg-[#5C3E2F] text-[#F5F0E8]",
    navHover: isDark ? "hover:bg-[#2A1D16]/50" : "hover:bg-[#EFE6DA]/50",
    inputBg: isDark ? "bg-[#2A1D16]" : "bg-[#EFE6DA]/70",
    inputBorder: isDark ? "border-[#3D2A1F]" : "border-[#E3D8C8]",
    tabInactive: isDark ? "bg-[#2A1D16] text-[#D2C5B4]" : "bg-[#EFE6DA] text-[#8B5E3C]",
    tabHover: isDark ? "hover:bg-[#3D2A1F]" : "hover:bg-[#E2D6C5]",
    filterBg: isDark ? "bg-[#2A1D16]/40" : "bg-[#EFE6DA]/40",
    filterBgSolid: isDark ? "bg-[#2A1D16]" : "bg-[#EFE6DA]",
    filterHover: isDark ? "hover:bg-[#3D2A1F]" : "hover:bg-[#EFE6DA]/85",
    btnBg: isDark ? "bg-[#2A1D16] hover:bg-[#3D2A1F] border-[#3D2A1F] text-[#D2C5B4]" : "bg-[#EFE6DA] hover:bg-[#E2D6C5] border-[#E3D8C8] text-[#8B5E3C]",
    widgetCard: isDark ? "bg-[#2A1D16]/60 border-[#3D2A1F]" : "bg-[#EFE6DA]/40 border-[#E3D8C8]",
    hoverRow: isDark ? "hover:bg-[#3D2A1F]/60" : "hover:bg-[#EFE6DA]/60",
    dropdownBg: isDark ? "bg-[#2A1D16] border-[#3D2A1F]" : "bg-[#FBF9F6] border-[#E3D8C8]",
    // Shorthand color values for inline style usage
    clrPrimary: isDark ? "#F5F0E8" : "#4A3428",
    clrSecondary: isDark ? "#D2C5B4" : "#8B5E3C",
    clrCardBg: isDark ? "#2A1D16" : "#EFE6DA",
    clrBorder: isDark ? "#3D2A1F" : "#E3D8C8",
  };

  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"All" | "People" | "Posts" | "Reels" | "Topics" | "Communities">("All");
  const [mediaFilter, setMediaFilter] = useState<"All" | "Photos" | "Reels">("All");
  const [isFocused, setIsFocused] = useState(false);
  const [activeSuggestionIdx, setActiveSuggestionIdx] = useState(-1);

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
  const searchAllQuery = useSearchAll(activeTab === "All" ? debouncedQuery : "");

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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveSuggestionIdx((prev) => 
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveSuggestionIdx((prev) => (prev > -1 ? prev - 1 : -1));
    } else if (e.key === "Escape") {
      setIsFocused(false);
      (e.target as HTMLInputElement).blur();
    } else if (e.key === "Enter") {
      if (activeSuggestionIdx > -1 && suggestions[activeSuggestionIdx]) {
        e.preventDefault();
        const selected = suggestions[activeSuggestionIdx];
        if (selected.type === "user") {
          addRecentSearchMutation.mutate("@" + selected.text);
          navigate(`/profile/${selected.text}`);
        } else {
          triggerSearch(selected.text);
        }
      }
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

  const { users = [], posts = [], reels = [], communities = [], hashtags = [] } = searchAllQuery.data || {};
  const allResultsCount = users.length + posts.length + reels.length + communities.length + hashtags.length;

  const queryHistory = recentSearches.filter((h: any) => !h.term.startsWith("@") && !h.term.startsWith("#"));
  const profileHistory = recentSearches.filter((h: any) => h.term.startsWith("@"));
  const hashtagHistory = recentSearches.filter((h: any) => h.term.startsWith("#"));

  const isSearchLoading = activeTab === "All" && debouncedQuery ? searchAllQuery.isLoading : activeQuery.isLoading;
  const isSearchEmpty = !!debouncedQuery && !isSearchLoading && (
    activeTab === "All" ? allResultsCount === 0 : itemsList.length === 0
  );

  return (
    <div className={cn("flex w-full min-h-screen p-3 sm:p-6 gap-6 font-sans transition-colors duration-500", theme.bg, theme.textPrimary)}>
      {/* 1. MAIN CONTENT AREA */}
      <div className="flex-1 space-y-6 max-w-full overflow-hidden">
        
        {/* SEARCH BAR CONTAINER */}
        <div className="relative w-full" ref={dropdownRef}>
          <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full">
            <div className={cn("relative flex-1 border rounded-2xl flex items-center px-4 py-2 transition focus-within:ring-2 focus-within:ring-[#8B5E3C] focus-within:border-[#8B5E3C]", theme.inputBg, theme.inputBorder)}>
              <SearchIcon className={cn("h-5 w-5 mr-3 flex-shrink-0", theme.textSecondary)} />
              <Input
                type="text"
                value={searchQuery}
                onFocus={() => setIsFocused(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setActiveSuggestionIdx(-1);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Search for people, posts, reels, topics, communities..."
                className={cn("bg-transparent border-none text-base outline-none ring-0 w-full focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-none focus-visible:border-none shadow-none h-9 p-0", theme.textPrimary)}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className={cn("p-1", theme.textSecondary)}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Button
              type="button"
              className={cn("border p-3 rounded-2xl flex-shrink-0", theme.btnBg)}
            >
              <SlidersHorizontal className="h-5 w-5" />
            </Button>
          </form>

          {/* FOCUS HISTORY & SUGGESTIONS OVERLAY */}
          {isFocused && (
            <div className={cn("absolute top-[105%] left-0 right-0 border rounded-2xl shadow-xl z-50 p-4 max-h-[380px] overflow-y-auto space-y-4", theme.dropdownBg)}>
              
              {/* SUGGESTIONS SECTION (WHEN QUERY ENTERED) */}
              {searchQuery.trim() && suggestions.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-[#8B5E3C] uppercase tracking-wider">Suggestions</h4>
                  <div className="space-y-1">
                    {suggestions.map((item: any, idx: number) => {
                      const isActive = idx === activeSuggestionIdx;
                      return (
                        <button
                          key={idx}
                          onClick={() => {
                            if (item.type === "user") {
                              addRecentSearchMutation.mutate("@" + item.text);
                              navigate(`/profile/${item.text}`);
                            } else {
                              triggerSearch(item.text);
                            }
                          }}
                          className={cn(
                            "flex items-center gap-3 w-full p-2 rounded-xl text-left transition",
                            isActive ? "bg-[#8B5E3C]/20 border border-[#8B5E3C]/35" : "hover:bg-[#EFE6DA]/40"
                          )}
                        >
                          <Avatar className={cn("h-8 w-8 border", theme.cardBorder)}>
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
                      );
                    })}
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
                  : cn(theme.tabInactive, theme.tabHover)
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* SUB-FILTERS / MEDIA FILTERS (Photos vs Reels - visible on All, Posts, Reels) */}
        {(activeTab === "All" || activeTab === "Posts" || activeTab === "Reels") && (
          <div className="flex justify-between items-center flex-wrap gap-3">
            <div className={cn("flex items-center gap-2 p-1 rounded-xl border", theme.filterBg, theme.cardBorder)}>
              {(["All", "Photos", "Reels"] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setMediaFilter(filter)}
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer",
                    mediaFilter === filter
                      ? "bg-[#5C3E2F] text-[#F5F0E8] shadow-xs"
                      : cn(theme.textSecondary, theme.filterHover)
                  )}
                >
                  {filter === "All" ? "All (Both)" : filter === "Photos" ? "Photos Only" : "Reels Only"}
                </button>
              ))}
            </div>

            <div className={cn("text-xs font-semibold px-3 py-1.5 rounded-xl border", theme.textSecondary, theme.filterBg, theme.cardBorder)}>
              Sort By: <span className={cn("font-bold", theme.textPrimary)}>Most Relevant</span>
            </div>
          </div>
        )}

        {/* LOADING STATE */}
        {isSearchLoading && (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="h-10 w-10 text-[#8B5E3C] animate-spin" />
            <p className="text-sm font-semibold text-[#8B5E3C]">Fetching actual MongoDB results...</p>
          </div>
        )}

        {/* EMPTY STATE */}
        {isSearchEmpty && (
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

        {/* RESULTS AND DEFAULT CONTENT VIEWER */}
        {!isSearchLoading && !isSearchEmpty && (
          <div className="space-y-6">
            {/* case 1: Aggregated multi-category view under All tab (only when search query exists) */}
            {activeTab === "All" && debouncedQuery ? (
              <div className="space-y-8">
                {/* PEOPLE SECTION */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                    <Users className="h-4 w-4 text-[#8B5E3C]" />
                    <span>People ({Math.min(6, users.length)})</span>
                  </h3>
                  {users.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {users.slice(0, 6).map((user: any) => (
                        <div
                          key={user._id}
                          className={cn("border p-4 rounded-2xl flex flex-col items-center text-center space-y-3", theme.widgetCard)}
                        >
                          <Avatar className={cn("h-12 w-12 border-2", theme.cardBorder)}>
                            <AvatarImage src={resolveUrl(user.avatar)} />
                            <AvatarFallback className="bg-[#5C3E2F] text-[#F5F0E8] text-sm font-bold">
                              {user.username.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className={cn("font-bold text-sm line-clamp-1", theme.textPrimary)}>{user.name}</h4>
                            <p className={cn("text-xs font-semibold", theme.textSecondary)}>@{user.username}</p>
                          </div>
                          {user.bio && <p className={cn("text-[11px] line-clamp-1 h-4 text-center w-full", theme.textSecondary)}>{user.bio}</p>}
                          
                          <div className="flex gap-2 w-full pt-1">
                            <Button
                              onClick={() => {
                                addRecentSearchMutation.mutate("@" + user.username);
                                navigate(`/profile/${user.username}`);
                              }}
                              className={cn("flex-1 rounded-xl text-xs py-1.5 h-auto font-semibold border transition", theme.filterBgSolid, theme.tabHover, theme.cardBorder, theme.textSecondary)}
                            >
                              Profile
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[#8B5E3C]/60 italic pl-1">No matching people</p>
                  )}
                  {users.length > 6 && (
                    <Button
                      onClick={() => setActiveTab("People")}
                      className={cn("text-xs font-bold uppercase tracking-wider", theme.textSecondary, "hover:underline bg-transparent hover:bg-transparent shadow-none p-0 flex items-center gap-1")}
                    >
                      Meet more people <ArrowRight className="h-3 w-3" />
                    </Button>
                  )}
                </div>

                {/* POSTS SECTION */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4 text-[#8B5E3C]" />
                    <span>Posts ({Math.min(6, posts.length)})</span>
                  </h3>
                  {posts.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {posts.slice(0, 6).map((post: any) => (
                        <div
                          key={post._id}
                          onClick={() => setSelectedPost(post)}
                          className={cn("relative overflow-hidden rounded-2xl group cursor-pointer shadow-xs border h-40", theme.cardBorder, theme.card)}
                        >
                          {post.mediaUrl && (post.mediaUrl.endsWith(".mp4") || post.mediaUrl.endsWith(".mov") || post.mediaUrl.includes("/video/upload/")) ? (
                            <video src={resolveUrl(post.mediaUrl)} className="w-full h-full object-cover rounded-2xl animate-pulse" muted playsInline />
                          ) : (
                            <img src={resolveUrl(post.mediaUrl || post.imageUrl)} alt={post.caption} className="w-full h-full object-cover rounded-2xl" />
                          )}
                          <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition flex flex-col justify-end p-2 text-white">
                            <p className="text-[10px] line-clamp-2 leading-snug">{post.caption}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[#8B5E3C]/60 italic pl-1">No matching posts</p>
                  )}
                  {posts.length > 6 && (
                    <Button
                      onClick={() => setActiveTab("Posts")}
                      className={cn("text-xs font-bold uppercase tracking-wider", theme.textSecondary, "hover:underline bg-transparent hover:bg-transparent shadow-none p-0 flex items-center gap-1")}
                    >
                      See more posts <ArrowRight className="h-3 w-3" />
                    </Button>
                  )}
                </div>

                {/* REELS SECTION */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                    <Play className="h-4 w-4 text-[#8B5E3C]" />
                    <span>Reels ({Math.min(6, reels.length)})</span>
                  </h3>
                  {reels.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {reels.slice(0, 6).map((reel: any) => (
                        <div
                          key={reel._id}
                          onClick={() => navigate(`/reels?reelId=${reel._id}`)}
                          className={cn("relative overflow-hidden rounded-2xl group cursor-pointer shadow-xs border h-40", theme.cardBorder, theme.card)}
                        >
                          <video src={resolveUrl(reel.mediaUrl)} className="w-full h-full object-cover rounded-2xl" muted playsInline />
                          <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition flex flex-col justify-end p-2 text-white">
                            <p className="text-[10px] line-clamp-2 leading-snug">{reel.caption}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[#8B5E3C]/60 italic pl-1">No matching reels</p>
                  )}
                  {reels.length > 6 && (
                    <Button
                      onClick={() => setActiveTab("Reels")}
                      className={cn("text-xs font-bold uppercase tracking-wider", theme.textSecondary, "hover:underline bg-transparent hover:bg-transparent shadow-none p-0 flex items-center gap-1")}
                    >
                      Explore more reels <ArrowRight className="h-3 w-3" />
                    </Button>
                  )}
                </div>

                {/* TOPICS SECTION */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                    <Tag className="h-4 w-4 text-[#8B5E3C]" />
                    <span>Topics ({Math.min(6, hashtags.length)})</span>
                  </h3>
                  {hashtags.length > 0 ? (
                    <div className="flex flex-wrap gap-2.5">
                      {hashtags.slice(0, 6).map((tag: any, idx: number) => (
                        <button
                          key={idx}
                          onClick={() => triggerSearch(tag.title)}
                          className={cn("px-4 py-2 border rounded-xl font-semibold transition text-xs flex items-center gap-1.5", theme.widgetCard, theme.hoverRow)}
                        >
                          <Tag className="h-3.5 w-3.5 text-[#8B5E3C]" />
                          <span>{tag.title}</span>
                          <span className="text-[10px] opacity-60">({tag.postsCount})</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[#8B5E3C]/60 italic pl-1">No matching topics</p>
                  )}
                  {hashtags.length > 6 && (
                    <Button
                      onClick={() => setActiveTab("Topics")}
                      className={cn("text-xs font-bold uppercase tracking-wider", theme.textSecondary, "hover:underline bg-transparent hover:bg-transparent shadow-none p-0 flex items-center gap-1")}
                    >
                      See more topics <ArrowRight className="h-3 w-3" />
                    </Button>
                  )}
                </div>

                {/* COMMUNITIES SECTION */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                    <Users className="h-4 w-4 text-[#8B5E3C]" />
                    <span>Communities ({Math.min(6, communities.length)})</span>
                  </h3>
                  {communities.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {communities.slice(0, 6).map((c: any) => (
                        <div
                          key={c._id}
                          className={cn("border p-4 rounded-2xl flex flex-col justify-between space-y-3", theme.widgetCard)}
                        >
                          <div className="flex gap-2">
                            <Avatar className={cn("h-10 w-10 rounded-xl border", theme.cardBorder)}>
                              <AvatarImage src={resolveUrl(c.avatar)} />
                              <AvatarFallback className={cn("font-bold rounded-xl", theme.card, theme.textSecondary)}>
                                {c.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 leading-tight">
                              <h4 className={cn("font-bold text-sm truncate", theme.textPrimary)}>{c.name}</h4>
                              <p className="text-[10px] opacity-60 mt-0.5">{c.members?.length || 0} Members</p>
                            </div>
                          </div>
                          <Button
                            onClick={() => navigate(`/communities`)}
                            className="w-full bg-[#8B5E3C] hover:bg-[#5C3E2F] text-white rounded-xl text-xs py-1.5 h-auto font-bold"
                          >
                            View Community
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[#8B5E3C]/60 italic pl-1">No matching communities</p>
                  )}
                  {communities.length > 6 && (
                    <Button
                      onClick={() => setActiveTab("Communities")}
                      className={cn("text-xs font-bold uppercase tracking-wider", theme.textSecondary, "hover:underline bg-transparent hover:bg-transparent shadow-none p-0 flex items-center gap-1")}
                    >
                      Discover more communities <ArrowRight className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              /* case 2: Individual tab content (e.g. People, Posts, Reels, Topics, Communities, or All without active query) */
              <div className="space-y-6">
                {activeTab === "People" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {itemsList.map((user: any) => (
                      <div
                        key={user._id}
                        className={cn("border p-4 rounded-2xl flex flex-col items-center text-center space-y-3", theme.widgetCard)}
                      >
                        <Avatar className={cn("h-16 w-16 border-2", theme.cardBorder)}>
                          <AvatarImage src={resolveUrl(user.avatar)} />
                          <AvatarFallback className="bg-[#5C3E2F] text-[#F5F0E8] text-lg font-bold">
                            {user.username.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className={cn("font-bold text-base line-clamp-1", theme.textPrimary)}>{user.name}</h4>
                          <p className={cn("text-xs font-semibold", theme.textSecondary)}>@{user.username}</p>
                        </div>
                        {user.bio && <p className={cn("text-xs line-clamp-2 h-8", theme.textSecondary)}>{user.bio}</p>}
                        
                        <div className={cn("flex gap-4 text-xs font-semibold", theme.textSecondary)}>
                          <p>{formatCount(user.followers?.length)} Followers</p>
                          <p>{formatCount(user.following?.length)} Following</p>
                        </div>

                        <div className="flex gap-2 w-full pt-1">
                          <Button
                            onClick={() => {
                              addRecentSearchMutation.mutate("@" + user.username);
                              navigate(`/profile/${user.username}`);
                            }}
                            className={cn("flex-1 rounded-xl text-xs py-1.5 h-auto font-semibold border transition", theme.filterBgSolid, theme.tabHover, theme.cardBorder, theme.textSecondary)}
                          >
                            Profile
                          </Button>
                          {currentUser?.username !== user.username && (
                            <Button
                              onClick={(e) => handleFollowUser(e, user.username)}
                              className={cn(
                                "flex-1 rounded-xl text-xs py-1.5 h-auto font-bold transition",
                                user.followers?.includes(currentUser?.id)
                                  ? cn(theme.filterBgSolid, theme.textSecondary, theme.cardBorder, "hover:bg-destructive/10 hover:text-destructive border border-destructive/20")
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
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {itemsList.map((tag: any, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => triggerSearch(tag.title)}
                        className={cn("border p-4 rounded-2xl text-left space-y-3 transition flex flex-col justify-between", theme.widgetCard, theme.hoverRow)}
                      >
                        <div className="h-10 w-10 bg-[#5C3E2F]/10 rounded-xl flex items-center justify-center text-[#5C3E2F]">
                          <Tag className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className={cn("font-bold text-base line-clamp-1", theme.textPrimary)}>{tag.title}</h4>
                          <p className={cn("text-xs font-semibold mt-1", theme.textSecondary)}>
                            {formatCount(tag.postsCount)} posts
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : activeTab === "Communities" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {itemsList.map((c: any) => (
                      <div
                        key={c._id}
                        className={cn("border p-4 rounded-2xl flex flex-col justify-between space-y-4", theme.widgetCard)}
                      >
                        <div className="flex gap-3">
                          <Avatar className={cn("h-12 w-12 rounded-xl border", theme.cardBorder)}>
                            <AvatarImage src={resolveUrl(c.avatar)} />
                            <AvatarFallback className={cn("font-bold rounded-xl", theme.card, theme.textSecondary)}>
                              {c.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h4 className={cn("font-bold text-base line-clamp-1", theme.textPrimary)}>{c.name}</h4>
                            <p className={cn("text-xs font-semibold mt-0.5", theme.textSecondary)}>
                              {formatCount(c.memberCount || c.members?.length)} Members
                            </p>
                          </div>
                        </div>
                        <p className={cn("text-xs line-clamp-2 h-8", theme.textSecondary)}>{c.description}</p>
                        <Button
                          onClick={() => navigate(`/communities`)}
                          className="w-full bg-[#8B5E3C] hover:bg-[#5C3E2F] text-[#F5F0E8] rounded-xl text-xs py-2 font-bold"
                        >
                          View Community
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="columns-2 md:columns-3 gap-4 space-y-4">
                    {itemsList.map((post: any, idx: number) => {
                      const showEmbedQuote = activeTab === "All" && idx === 3;
                      return (
                        <div key={post._id} className="break-inside-avoid">
                          {showEmbedQuote && (
                            <div className={cn("p-6 rounded-2xl border flex flex-col justify-between aspect-square mb-4", theme.card, theme.cardBorder)}>
                              <span className={cn("text-5xl font-serif leading-none", theme.textSecondary)}>“</span>
                              <p className={cn("text-base font-semibold leading-relaxed my-2", theme.textPrimary)}>
                                {quoteData?.text || "Collect moments, not things."}
                              </p>
                              <div className={cn("flex justify-between items-end border-t pt-3", theme.cardBorder)}>
                                <span className={cn("text-[10px] font-bold uppercase tracking-wider", theme.textSecondary)}>
                                  — {quoteData?.author || "Vibe"}
                                </span>
                                <span className="text-lg opacity-40">🌱</span>
                              </div>
                            </div>
                          )}

                          <div
                            onClick={() => {
                              if (post.type === "reel") {
                                navigate(`/reels?reelId=${post._id}`);
                              } else {
                                setSelectedPost(post);
                              }
                            }}
                            className={cn("relative overflow-hidden rounded-2xl group cursor-pointer shadow-sm border transition-all duration-300 group-hover:shadow-md", theme.cardBorder, isDark ? "bg-[#2A1D16]/40" : "bg-[#EFE6DA]/40")}
                          >
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

                            <div className="absolute top-3 right-3 p-1.5 bg-black/40 backdrop-blur-xs rounded-lg text-white">
                              {post.type === "reel" ? (
                                <Play className="h-4.5 w-4.5 fill-white text-white" />
                              ) : (
                                <Bookmark className="h-4.5 w-4.5" />
                              )}
                            </div>

                            <div className="absolute inset-0 bg-gradient-to-t from-[#2A1D16]/90 via-[#2A1D16]/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4 text-[#F5F0E8]">
                              {post.caption && (
                                <p className="text-xs font-medium line-clamp-2 mb-3 leading-relaxed">
                                  {post.caption}
                                </p>
                              )}

                              <div className="flex items-center justify-between">
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
                                        <Heart className={cn("h-4 w-4", post.isLiked ? "fill-red-500 text-red-500" : "text-white")} />
                                      </button>
                                      <span className="text-[11px] font-semibold">{formatCount(post.likesCount || post.likes?.length)}</span>

                                      <button
                                        onClick={(e) => handleSavePost(e, post)}
                                        className="hover:scale-110 transition ml-1"
                                      >
                                        <Bookmark className={cn("h-4 w-4", post.isSaved ? "fill-[#8B5E3C] text-[#8B5E3C]" : "text-white")} />
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
        )}

      </div>

      {/* 3. RIGHT SIDEBAR */}
      <div className="hidden xl:block w-80 space-y-6 flex-shrink-0">
        
        {/* WIDGET: MOTIVATIONAL THOUGHT */}
        <div className={cn("border rounded-3xl p-5 relative overflow-hidden space-y-4", theme.widgetCard)}>
          <div className="flex justify-between items-center">
            <h3 className={cn("text-xs font-bold uppercase tracking-wider", theme.textSecondary)}>Today's Motivational Thought</h3>
            <button
              onClick={() => setEditQuoteOpen(true)}
              className={cn("p-1 rounded-lg transition", theme.tabHover, theme.textSecondary)}
            >
              <Edit className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="space-y-2">
            <span className={cn("text-4xl font-serif leading-none block", theme.textSecondary)}>“</span>
            <p className={cn("text-base font-bold italic leading-relaxed", theme.textPrimary)}>
              {quoteData?.text || "Believe in yourself a little more."}
            </p>
            <p className={cn("text-xs font-semibold text-right", theme.textSecondary)}>
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
          <div className={cn("border rounded-3xl p-5 space-y-4", theme.widgetCard)}>
            <h3 className={cn("text-xs font-bold uppercase tracking-wider", theme.textSecondary)}>Your Latest Post</h3>
            
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
                <p className={cn("text-sm font-semibold truncate", theme.textPrimary)}>
                  {latestPost.caption || "Untitled post"}
                </p>
                <p className={cn("text-xs mt-1", theme.textSecondary)}>{formatTimeAgo(latestPost.createdAt)}</p>
              </div>
            </div>

            <div className={cn("flex items-center justify-around border-t border-b py-2 text-xs font-bold", theme.cardBorder, theme.textSecondary)}>
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
              className={cn("w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold border transition active:scale-95", theme.filterBgSolid, theme.tabHover, theme.cardBorder, theme.textSecondary)}
            >
              View post
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <div className={cn("border rounded-3xl p-5 space-y-2 text-center", theme.widgetCard)}>
            <h3 className={cn("text-xs font-bold uppercase tracking-wider", theme.textSecondary)}>Your Latest Post</h3>
            <p className={cn("text-xs italic py-2 opacity-60", theme.textSecondary)}>No posts created yet</p>
          </div>
        )}

        {/* WIDGET: FRIENDS' LATEST POSTS */}
        <div className={cn("border rounded-3xl p-5 space-y-4", theme.widgetCard)}>
          <div className="flex justify-between items-center">
            <h3 className={cn("text-xs font-bold uppercase tracking-wider", theme.textSecondary)}>Friends' Latest Posts</h3>
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
                  className={cn("flex items-center justify-between p-1.5 rounded-xl transition cursor-pointer", theme.hoverRow)}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className={cn("h-8 w-8 border", theme.cardBorder)}>
                      <AvatarImage src={resolveUrl(post.author?.avatar)} />
                      <AvatarFallback className="bg-[#5C3E2F] text-[#F5F0E8] text-xs font-bold">
                        {post.author?.username?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                        <p className={cn("text-xs font-bold", theme.textPrimary)}>@{post.author?.username}</p>
                        <p className={cn("text-[10px] mt-0.5", theme.textSecondary)}>{formatTimeAgo(post.createdAt)}</p>
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
        <div className={cn("border rounded-3xl p-5 space-y-4", theme.widgetCard)}>
          <div className="flex justify-between items-center">
            <h3 className={cn("text-xs font-bold uppercase tracking-wider", theme.textSecondary)}>People You May Know</h3>
            <button
              onClick={() => navigate("/discover")}
              className={cn("text-xs hover:underline font-bold", theme.textSecondary)}
            >
              View all
            </button>
          </div>

          {Array.isArray(suggestedUsers) && suggestedUsers.length > 0 ? (
            <div className="space-y-3">
              {suggestedUsers.map((user: any) => (
                <div
                  key={user._id}
                  className={cn("flex items-center justify-between p-1.5 rounded-xl transition", theme.hoverRow)}
                >
                  <div
                    onClick={() => navigate(`/profile/${user.username}`)}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Avatar className={cn("h-8 w-8 border", theme.cardBorder)}>
                      <AvatarImage src={resolveUrl(user.avatar)} />
                      <AvatarFallback className="bg-[#5C3E2F] text-[#F5F0E8] text-xs font-bold">
                        {user.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className={cn("text-xs font-bold truncate max-w-[85px]", theme.textPrimary)}>{user.name}</p>
                      <p className={cn("text-[10px] truncate max-w-[85px]", theme.textSecondary)}>@{user.username}</p>
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
            <p className={cn("text-xs italic py-2 text-center opacity-60", theme.textSecondary)}>No suggestions available</p>
          )}
        </div>

        {/* WIDGET: TRENDING TOPICS */}
        <div className={cn("border rounded-3xl p-5 space-y-4", theme.widgetCard)}>
          <div className="flex justify-between items-center">
            <h3 className={cn("text-xs font-bold uppercase tracking-wider", theme.textSecondary)}>Trending Topics</h3>
            <button
              onClick={() => {
                setActiveTab("Topics");
                queryClient.invalidateQueries({ queryKey: ["search-hashtags"] });
              }}
              className={cn("text-xs hover:underline font-bold", theme.textSecondary)}
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
                  className={cn("font-semibold text-xs px-3 py-1.5 rounded-full border transition cursor-pointer", theme.filterBgSolid, theme.tabHover, theme.cardBorder, theme.textSecondary)}
                >
                  {tag.title}
                </button>
              ))}
            </div>
          ) : (
            <p className={cn("text-xs italic py-2 text-center opacity-60", theme.textSecondary)}>No trending hashtags found</p>
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
