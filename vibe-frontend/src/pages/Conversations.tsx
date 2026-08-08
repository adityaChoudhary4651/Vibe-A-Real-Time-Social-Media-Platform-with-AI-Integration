import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search as SearchIcon,
  Plus,
  Flame,
  Users,
  Sparkles,
  User,
  CheckCircle,
  SlidersHorizontal,
  ChevronDown,
  MessageSquare,
  MoreVertical,
  ArrowRight,
  TrendingUp,
  Share2,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

// Preset thumbnail selections for new conversations
const presetThumbnails = [
  { label: "AI & Cybernetics", url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200" },
  { label: "Entertainment & Gaming", url: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200" },
  { label: "Hardware & Gadgets", url: "https://images.unsplash.com/photo-1496181130204-755241544e35?w=200" },
  { label: "Anime & Manga", url: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=200" },
  { label: "Travel & Scenery", url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=200" }
];

export default function Conversations() {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(() => localStorage.getItem("vibe_theme") === "dark");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("Trending");
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form states for creating new conversation
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [selectedThumb, setSelectedThumb] = useState(presetThumbnails[0].url);

  // Interactive UI States for right sidebar widgets
  const [listeningRooms, setListeningRooms] = useState<Record<string, boolean>>({});
  const [joinedCommunities, setJoinedCommunities] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const handleThemeChange = () => {
      setIsDark(localStorage.getItem("vibe_theme") === "dark");
    };
    window.addEventListener("themeChange", handleThemeChange);
    return () => window.removeEventListener("themeChange", handleThemeChange);
  }, []);

  // Theme settings
  const theme = {
    bg: isDark ? "bg-[#1E120C]" : "bg-[#FAF6F0]",
    card: isDark ? "bg-[#2A1D16] border-[#3D2A1F]" : "bg-white border-[#EFE6DA]",
    textPrimary: isDark ? "text-[#F5F0E8]" : "text-[#4A3428]",
    textSecondary: isDark ? "text-[#D2C5B4]" : "text-[#8B5E3C]",
    border: isDark ? "border-[#3D2A1F]" : "border-[#EFE6DA]",
    inputBg: isDark ? "bg-[#2A1D16] text-[#F5F0E8]" : "bg-[#FAF6F0] text-[#4A3428]",
    pillActive: "bg-[#5C3E2F] text-white hover:bg-[#4A3225]",
    pillInactive: isDark ? "bg-[#2A1D16] text-[#D2C5B4] hover:bg-[#3D2A1F]" : "bg-[#F5F0E8] text-[#8B5E3C] hover:bg-[#EFE6DA]",
    btnPrimary: "bg-[#5C3E2F] text-white hover:bg-[#4A3225] transition-colors",
    btnOutline: isDark 
      ? "border-[#E8AC7D] text-[#E8AC7D] hover:bg-[#E8AC7D]/10 bg-transparent transition-colors" 
      : "border-[#8B5E3C] text-[#8B5E3C] hover:bg-[#8B5E3C]/10 bg-transparent transition-colors",
  };

  // Mock initial conversations data matching the provided screenshot
  const [conversations, setConversations] = useState([
    {
      id: "1",
      title: "Will AI replace programmers in the next 10 years?",
      startedBy: "aryan",
      startedAt: "3h ago",
      description: "Let's discuss the future of coding, jobs, and AI...",
      thumbnailUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200",
      replies: 428,
      participants: 167,
      badgeText: "Active now",
      badgeType: "active",
      participantCountLabel: "+183",
      avatars: [
        "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80",
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80",
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80",
      ]
    },
    {
      id: "2",
      title: "Marvel or DC: Who's winning the decade?",
      startedBy: "candy",
      startedAt: "5h ago",
      description: "Movies, series, characters, everything. Your pick?",
      thumbnailUrl: "https://images.unsplash.com/photo-1569003339405-ea396a5a8a90?w=200",
      replies: 1200,
      participants: 642,
      badgeText: "Hot",
      badgeType: "hot",
      participantCountLabel: "+89",
      avatars: [
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80",
        "https://api.dicebear.com/7.x/initials/svg?seed=Aditya",
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80",
      ]
    },
    {
      id: "3",
      title: "Best Laptop under ₹70,000 in 2024?",
      startedBy: "rahul",
      startedAt: "6h ago",
      description: "For coding, gaming and everyday use. Need suggestions!",
      thumbnailUrl: "https://images.unsplash.com/photo-1496181130204-755241544e35?w=200",
      replies: 232,
      participants: 118,
      badgeText: "Active",
      badgeType: "active-green",
      participantCountLabel: "+54",
      avatars: [
        "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80",
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80",
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80",
      ]
    },
    {
      id: "4",
      title: "Which anime had the best plot twist?",
      startedBy: "otaku_kid",
      startedAt: "8h ago",
      description: "Drop your mind-blowing anime moments!",
      thumbnailUrl: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=200",
      replies: 186,
      participants: 93,
      badgeText: "Trending",
      badgeType: "trending",
      participantCountLabel: "+37",
      avatars: [
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80",
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80",
        "https://api.dicebear.com/7.x/initials/svg?seed=Aditya",
      ]
    },
    {
      id: "5",
      title: "Solo travel: Life changing or overrated?",
      startedBy: "wanderer",
      startedAt: "1d ago",
      description: "Share your experiences and tips for solo travelers.",
      thumbnailUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=200",
      replies: 94,
      participants: 61,
      badgeText: "Active",
      badgeType: "active-green",
      participantCountLabel: "+26",
      avatars: [
        "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80",
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80",
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80",
      ]
    }
  ]);

  // Handling submission of custom new conversation
  const handleCreateConversation = () => {
    if (!newTitle.trim()) {
      toast.error("Please enter a title");
      return;
    }
    const newConvo = {
      id: String(conversations.length + 1),
      title: newTitle,
      startedBy: "you",
      startedAt: "Just now",
      description: newDesc || "No description provided.",
      thumbnailUrl: selectedThumb,
      replies: 0,
      participants: 1,
      badgeText: "Active now",
      badgeType: "active",
      participantCountLabel: "",
      avatars: ["https://api.dicebear.com/7.x/initials/svg?seed=You"]
    };

    setConversations([newConvo, ...conversations]);
    toast.success("Conversation created successfully!");
    setNewTitle("");
    setNewDesc("");
    setShowCreateModal(false);
  };

  const handleDeleteConversation = (id: string) => {
    setConversations(conversations.filter(c => c.id !== id));
    toast.success("Conversation deleted");
  };

  const handleShareConversation = (title: string) => {
    navigator.clipboard.writeText(window.location.href);
    toast.success(`Copied sharing link for: "${title}"`);
  };

  // Filter lists based on selected tag and search query
  const filteredConversations = conversations.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className={cn("flex w-full h-full p-3 sm:p-6 gap-6 font-sans transition-colors duration-500 overflow-hidden", theme.bg, theme.textPrimary)}>
      
      {/* ====================================================
          1. MAIN FEED AREA (MIDDLE COLUMN) - Independent Scroll
         ==================================================== */}
      <div className="flex-1 h-full overflow-y-auto pr-1 pb-16 lg:pb-6 space-y-5 scrollbar-hide">
        
        {/* Search and Action Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full">
            <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn("w-full pl-10 pr-4 py-2.5 rounded-full text-xs font-semibold border focus:outline-none transition", theme.inputBg, theme.border)}
            />
          </div>

          <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
            <DialogTrigger asChild>
              <Button className={cn("rounded-full px-5 text-xs font-bold shrink-0 flex items-center gap-1.5", theme.btnPrimary)}>
                <Plus className="h-4 w-4" />
                Start Conversation
              </Button>
            </DialogTrigger>
            <DialogContent className={cn("border max-w-md", theme.card, theme.textPrimary)}>
              <DialogHeader>
                <DialogTitle className="font-serif text-lg font-bold">Start a New Discussion</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4 text-xs font-semibold">
                <div className="space-y-1.5">
                  <label>Title</label>
                  <Input
                    placeholder="e.g. Is remote work here to stay?"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className={cn("rounded-xl border font-normal", theme.inputBg, theme.border)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label>Description / Hook</label>
                  <Textarea
                    placeholder="What should we discuss?"
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    className={cn("rounded-xl border font-normal", theme.inputBg, theme.border)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label>Cover Theme</label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    {presetThumbnails.map((preset) => (
                      <button
                        key={preset.url}
                        type="button"
                        onClick={() => setSelectedThumb(preset.url)}
                        className={cn(
                          "flex items-center gap-2 p-1.5 border rounded-xl transition text-[10px]",
                          selectedThumb === preset.url ? "border-[#8B5E3C] bg-[#8B5E3C]/10 font-bold" : theme.border
                        )}
                      >
                        <img src={preset.url} alt={preset.label} className="w-8 h-8 rounded-lg object-cover" />
                        <span className="truncate">{preset.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreateConversation} className={cn("rounded-xl", theme.btnPrimary)}>
                  Create Conversation
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Page Title & Subtitle */}
        <div className="leading-tight pt-1">
          <h1 className={cn("text-2xl font-bold tracking-tight font-serif", theme.textPrimary)}>
            Conversations
          </h1>
          <p className={cn("text-xs opacity-75 mt-0.5 font-medium", theme.textSecondary)}>
            Join the discussions that matter
          </p>
        </div>

        {/* Filter Pills row */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto scrollbar-hide py-1 border-b border-dashed border-[#8B5E3C]/15">
          <div className="flex items-center gap-2">
            {[
              { label: "Trending", icon: Flame },
              { label: "Following", icon: Users },
              { label: "New", icon: Sparkles },
              { label: "My Discussions", icon: User },
              { label: "Solved", icon: CheckCircle }
            ].map((filter) => {
              const Icon = filter.icon;
              const isActive = selectedFilter === filter.label;
              return (
                <button
                  key={filter.label}
                  onClick={() => setSelectedFilter(filter.label)}
                  className={cn(
                    "flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-bold transition duration-200 shrink-0",
                    isActive ? theme.pillActive : theme.pillInactive
                  )}
                >
                  <Icon className="h-3 w-3" />
                  <span>{filter.label}</span>
                </button>
              );
            })}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={cn("flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-bold border transition", theme.pillInactive, theme.border)}>
                <SlidersHorizontal className="h-3 w-3" />
                <span>Filter</span>
                <ChevronDown className="h-3 w-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className={cn("border font-semibold text-xs", theme.card, theme.textPrimary)}>
              <DropdownMenuItem onClick={() => toast.info("Sorting by reply count")}>Most Replies</DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast.info("Sorting by creation date")}>Recently Created</DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast.info("Filtering unsolved posts")}>Unsolved Only</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* List of Conversation Cards */}
        <div className="space-y-4">
          {filteredConversations.length > 0 ? (
            filteredConversations.map((convo) => (
              <div
                key={convo.id}
                className={cn(
                  "border rounded-2xl p-4 shadow-2xs hover:shadow-xs transition flex flex-col md:flex-row items-center md:items-start gap-4 relative",
                  theme.card
                )}
              >
                {/* Thumbnail Image */}
                <div className="w-full md:w-36 h-28 md:h-24 rounded-xl overflow-hidden shrink-0 border relative">
                  <img
                    src={convo.thumbnailUrl}
                    alt={convo.title}
                    className="w-full h-full object-cover"
                  />
                  {convo.badgeText && (
                    <span
                      className={cn(
                        "absolute top-2 left-2 text-[8px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider",
                        convo.badgeType === "active" && "bg-red-500 text-white",
                        convo.badgeType === "hot" && "bg-[#8B5E3C] text-white",
                        convo.badgeType === "active-green" && "bg-green-500 text-white",
                        convo.badgeType === "trending" && "bg-orange-500 text-white"
                      )}
                    >
                      {convo.badgeText === "Active now" ? "🔥 Active now" : 
                       convo.badgeText === "Hot" ? "🔥 Hot" : 
                       convo.badgeText === "Active" ? "🟢 Active" : `🔥 ${convo.badgeText}`}
                    </span>
                  )}
                </div>

                {/* Card Main Info */}
                <div className="flex-1 min-w-0 space-y-1.5 flex flex-col justify-between self-stretch">
                  <div>
                    <h3 className={cn("font-bold text-sm md:text-base leading-tight hover:underline cursor-pointer", theme.textPrimary)}>
                      {convo.title}
                    </h3>
                    <p className="text-[10px] opacity-60 mt-0.5 font-semibold">
                      Started by <span className={cn("font-bold", theme.textSecondary)}>@{convo.startedBy}</span> • {convo.startedAt}
                    </p>
                    <p className={cn("text-xs opacity-75 mt-1 line-clamp-2", theme.textPrimary)}>
                      {convo.description}
                    </p>
                  </div>

                  {/* Badges and Counts */}
                  <div className="flex flex-wrap items-center gap-4 text-[10px] opacity-75 mt-2 font-bold">
                    {/* Participant Avatars */}
                    <div className="flex items-center">
                      <div className="flex -space-x-1.5 mr-1.5">
                        {convo.avatars.map((avUrl, index) => (
                          <Avatar key={index} className="h-5 w-5 border border-white dark:border-[#2A1D16]">
                            <AvatarImage src={avUrl} />
                            <AvatarFallback className="text-[8px]">U</AvatarFallback>
                          </Avatar>
                        ))}
                      </div>
                      <span className="text-[9px] font-semibold">{convo.participantCountLabel}</span>
                    </div>

                    {/* Replies count */}
                    <div className="flex items-center gap-1">
                      <MessageSquare className="h-3.5 w-3.5 opacity-70" />
                      <span>
                        {convo.replies >= 1000 ? `${(convo.replies / 1000).toFixed(1)}K` : convo.replies} replies
                      </span>
                    </div>

                    {/* Participants count */}
                    <div className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5 opacity-70" />
                      <span>{convo.participants} participants</span>
                    </div>
                  </div>
                </div>

                {/* Right Side Options & Actions */}
                <div className="flex md:flex-col justify-between items-center md:items-end h-full self-stretch shrink-0 pt-1">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition opacity-60 hover:opacity-100">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className={cn("border font-semibold text-xs", theme.card, theme.textPrimary)}>
                      <DropdownMenuItem onClick={() => handleShareConversation(convo.title)} className="flex items-center gap-1.5">
                        <Share2 className="h-3.5 w-3.5" /> Share
                      </DropdownMenuItem>
                      {convo.startedBy === "you" && (
                        <DropdownMenuItem onClick={() => handleDeleteConversation(convo.id)} className="flex items-center gap-1.5 text-red-500">
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Button
                    onClick={() => {
                      toast.success(`Joining: "${convo.title}"`);
                      navigate("/messages");
                    }}
                    className={cn("rounded-full px-5 py-1.5 h-auto text-[11px] font-bold mt-4 md:mt-0", theme.btnPrimary)}
                  >
                    Continue
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-10 opacity-60 italic text-xs font-semibold">
              No conversations match your search.
            </div>
          )}
        </div>
      </div>

      {/* ====================================================
          2. WIDGETS SIDEBAR (RIGHT COLUMN) - Independent Scroll
         ==================================================== */}
      <div className="hidden xl:block w-76 h-full overflow-y-auto pr-1 pb-16 space-y-5 flex-shrink-0 scrollbar-hide">
        
        {/* Widget 1 — Trending Topics */}
        <div className={cn("border rounded-2xl p-4 shadow-2xs space-y-3", theme.card)}>
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-1">
              <span>TRENDING TOPICS</span>
              <Flame className="h-3.5 w-3.5 text-orange-500 fill-orange-500" />
            </h2>
          </div>

          <div className="space-y-2.5">
            {[
              { name: "AI", count: "5.2K discussions" },
              { name: "Anime", count: "3.8K discussions" },
              { name: "Technology", count: "2.9K discussions" },
              { name: "Gaming", count: "2.1K discussions" },
              { name: "Movies", count: "1.9K discussions" }
            ].map((topic) => (
              <div
                key={topic.name}
                onClick={() => setSearchQuery(topic.name)}
                className="flex items-center justify-between p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold opacity-60">#</span>
                  <div className="leading-tight">
                    <p className="text-xs font-bold">{topic.name}</p>
                    <p className="text-[9px] opacity-60">{topic.count}</p>
                  </div>
                </div>
                <TrendingUp className="h-3.5 w-3.5 text-green-600 shrink-0" />
              </div>
            ))}
          </div>

          <button
            onClick={() => navigate("/search")}
            className={cn("w-full text-center text-[10px] font-bold flex items-center justify-center gap-1 mt-1 hover:underline", theme.textSecondary)}
          >
            View all topics <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        {/* Widget 2 — Live Voice Rooms */}
        <div className={cn("border rounded-2xl p-4 shadow-2xs space-y-3", theme.card)}>
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5">
              <span>LIVE VOICE ROOMS</span>
            </h2>
          </div>

          <div className="space-y-3">
            {[
              { id: "v1", name: "AI: Friend or Foe?", count: "126 listening", initials: "AI" },
              { id: "v2", name: "Startup Founders Hangout", count: "78 listening", initials: "SF" },
              { id: "v3", name: "Anime Watch Party", count: "54 listening", initials: "AW" }
            ].map((room) => {
              const isListening = !!listeningRooms[room.id];
              return (
                <div key={room.id} className="flex items-center justify-between gap-2 p-1 rounded-lg">
                  <div className="flex items-center gap-2 min-w-0">
                    <Avatar className="h-8 w-8 rounded-xl border">
                      <AvatarFallback className="bg-[#8B5E3C]/10 text-[#8B5E3C] font-bold text-xs">
                        {room.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 leading-tight">
                      <p className="text-[11px] font-bold truncate">{room.name}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-[8px] opacity-60">{room.count}</span>
                        {isListening && (
                          <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                        )}
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() => {
                      setListeningRooms(prev => {
                        const next = { ...prev, [room.id]: !prev[room.id] };
                        if (next[room.id]) toast.success(`Listening in "${room.name}"`);
                        else toast.info(`Left "${room.name}"`);
                        return next;
                      });
                    }}
                    className={cn(
                      "rounded-full px-3 py-1 h-auto text-[9px] font-bold border shrink-0",
                      isListening ? "bg-[#8B5E3C] text-white hover:bg-[#5C3E2F]" : theme.btnOutline
                    )}
                  >
                    {isListening ? "Leave" : "Join"}
                  </Button>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => navigate("/communities")}
            className={cn("w-full text-center text-[10px] font-bold flex items-center justify-center gap-1 mt-1 hover:underline", theme.textSecondary)}
          >
            View all rooms <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        {/* Widget 3 — Suggested For You */}
        <div className={cn("border rounded-2xl p-4 shadow-2xs space-y-3", theme.card)}>
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-extrabold uppercase tracking-wider">
              SUGGESTED FOR YOU
            </h2>
            <button
              onClick={() => navigate("/communities")}
              className={cn("text-[9px] font-bold hover:underline", theme.textSecondary)}
            >
              View all
            </button>
          </div>

          <div className="space-y-3">
            {[
              { id: "c1", name: "Tech Enthusiasts", count: "1.8K members", initials: "TE" },
              { id: "c2", name: "Mindful Minds", count: "2.3K members", initials: "MM" },
              { id: "c3", name: "Creative Corner", count: "1.2K members", initials: "CC" }
            ].map((comm) => {
              const isJoined = !!joinedCommunities[comm.id];
              return (
                <div key={comm.id} className="flex items-center justify-between gap-2 p-1 rounded-lg">
                  <div className="flex items-center gap-2 min-w-0">
                    <Avatar className="h-8 w-8 rounded-xl border">
                      <AvatarFallback className="bg-[#5C3E2F] text-[#F5F0E8] font-bold text-xs">
                        {comm.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 leading-tight">
                      <p className="text-[11px] font-bold truncate">{comm.name}</p>
                      <p className="text-[8px] opacity-60 mt-0.5">{comm.count}</p>
                    </div>
                  </div>

                  <Button
                    onClick={() => {
                      setJoinedCommunities(prev => {
                        const next = { ...prev, [comm.id]: !prev[comm.id] };
                        if (next[comm.id]) toast.success(`Joined community: "${comm.name}"`);
                        else toast.info(`Left community: "${comm.name}"`);
                        return next;
                      });
                    }}
                    className={cn(
                      "rounded-full px-3 py-1 h-auto text-[9px] font-bold border shrink-0",
                      isJoined ? "bg-[#8B5E3C] text-white hover:bg-[#5C3E2F]" : theme.btnOutline
                    )}
                  >
                    {isJoined ? "Leave" : "Join"}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
}
