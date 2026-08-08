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
  ChevronLeft,
  Bookmark,
  ChevronUp,
  MessageCircle,
  Coins,
  Heading1,
  Image as ImageIcon,
  Smile,
  Mic,
  Paperclip,
  BookmarkCheck,
  Headphones,
  Check,
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

// Preset cover selections
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

  // Active conversation state (holds a conversation object when clicked; null for list view)
  const [activeConvo, setActiveConvo] = useState<any>(null);

  // Form states for creating new conversation
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [selectedThumb, setSelectedThumb] = useState(presetThumbnails[0].url);

  // Detail View replies input & list
  const [replyInput, setReplyInput] = useState("");
  const [voiceJoined, setVoiceJoined] = useState(false);

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
    badgeGreen: isDark ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-green-50 text-green-700 border border-green-200",
  };

  // Mock initial conversations data matching the provided screenshots
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

  // Mock initial replies list for the active conversation matching detail view
  const [replies, setReplies] = useState([
    {
      id: "r1",
      author: "aryan",
      avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80",
      time: "3h ago",
      score: 186,
      isAuthor: true,
      isPinned: true,
      body: [
        "AI tools are improving insanely fast. From code generation to debugging, even system design suggestions.",
        "Do you think AI will replace programmers completely in the next 10 years?"
      ],
      avatars: [
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80",
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80",
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80",
      ],
      extraCount: "+12",
      bookmarked: false
    },
    {
      id: "r2",
      author: "code_with_candy",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80",
      time: "2h ago",
      score: 128,
      isAuthor: false,
      badgeText: "Top opinion",
      body: [
        "I don't think AI will replace programmers, but it will definitely replace programmers who don't use AI.",
        "Future belongs to those who can build with AI, not against it."
      ],
      avatars: [
        "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80",
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80",
        "https://api.dicebear.com/7.x/initials/svg?seed=Aditya",
      ],
      extraCount: "+8",
      bookmarked: false
    },
    {
      id: "r3",
      author: "dev_rahul",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80",
      time: "2h ago",
      score: 97,
      isAuthor: false,
      badgeText: "Top opinion",
      body: [
        "AI is great at generating code, but it doesn't understand business logic, user needs, or edge cases like humans.",
        "Programmers won't be replaced, but their role will evolve."
      ],
      avatars: [
        "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80",
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80",
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80",
      ],
      extraCount: "+5",
      bookmarked: false
    }
  ]);

  // Handle Voting
  const handleVote = (id: string, increment: number) => {
    setReplies(prev => prev.map(r => r.id === id ? { ...r, score: r.score + increment } : r));
  };

  // Add Dynamic Reply
  const handlePostReply = () => {
    if (!replyInput.trim()) {
      toast.error("Please write something first");
      return;
    }
    const newReply = {
      id: "r_" + Date.now(),
      author: "you",
      avatar: "https://api.dicebear.com/7.x/initials/svg?seed=You",
      time: "Just now",
      score: 1,
      isAuthor: false,
      isPinned: false,
      body: [replyInput],
      avatars: [],
      extraCount: "",
      bookmarked: false
    };
    setReplies([...replies, newReply]);
    setReplyInput("");
    toast.success("Reply posted successfully!");
  };

  // Toggle Bookmark for reply
  const toggleBookmarkReply = (id: string) => {
    setReplies(prev => prev.map(r => r.id === id ? { ...r, bookmarked: !r.bookmarked } : r));
    toast.success("Bookmark updated");
  };

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
    if (activeConvo && activeConvo.id === id) {
      setActiveConvo(null);
    }
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
          CASE 1: CONVERSATION LIST VIEW
         ==================================================== */}
      {!activeConvo ? (
        <>
          {/* Middle Column (Scrollable Feed) */}
          <div className="flex-1 h-full overflow-y-auto pr-1 pb-16 lg:pb-6 space-y-5 scrollbar-hide">
            
            {/* Search & Action Bar */}
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

            {/* Title */}
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

            {/* Cards Feed */}
            <div className="space-y-4">
              {filteredConversations.length > 0 ? (
                filteredConversations.map((convo) => (
                  <div
                    key={convo.id}
                    className={cn(
                      "border rounded-2xl p-4 shadow-2xs hover:shadow-xs transition flex flex-col md:flex-row items-stretch gap-4 relative",
                      theme.card
                    )}
                  >
                    {/* Thumbnail Cover */}
                    <div className="w-full md:w-36 h-28 md:h-24 rounded-xl overflow-hidden shrink-0 border relative">
                      <img src={convo.thumbnailUrl} alt={convo.title} className="w-full h-full object-cover" />
                      {convo.badgeText && (
                        <span className={cn(
                          "absolute top-2 left-2 text-[8px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider",
                          convo.badgeType === "active" && "bg-red-500 text-white",
                          convo.badgeType === "hot" && "bg-[#8B5E3C] text-white",
                          convo.badgeType === "active-green" && "bg-green-500 text-white",
                          convo.badgeType === "trending" && "bg-orange-500 text-white"
                        )}>
                          {convo.badgeText === "Active now" ? "🔥 Active now" : 
                           convo.badgeText === "Hot" ? "🔥 Hot" : 
                           convo.badgeText === "Active" ? "🟢 Active" : `🔥 ${convo.badgeText}`}
                        </span>
                      )}
                    </div>

                    {/* Content */}
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

                      {/* Counters */}
                      <div className="flex flex-wrap items-center gap-4 text-[10px] opacity-75 mt-2 font-bold">
                        <div className="flex items-center">
                          <div className="flex -space-x-1.5 mr-1.5">
                            {convo.avatars.map((av, idx) => (
                              <Avatar key={idx} className="h-5 w-5 border border-white dark:border-[#2A1D16]">
                                <AvatarImage src={av} />
                                <AvatarFallback className="text-[8px]">U</AvatarFallback>
                              </Avatar>
                            ))}
                          </div>
                          <span className="text-[9px] font-semibold">{convo.participantCountLabel}</span>
                        </div>

                        <div className="flex items-center gap-1">
                          <MessageSquare className="h-3.5 w-3.5 opacity-70" />
                          <span>{convo.replies >= 1000 ? `${(convo.replies / 1000).toFixed(1)}K` : convo.replies} replies</span>
                        </div>

                        <div className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5 opacity-70" />
                          <span>{convo.participants} participants</span>
                        </div>
                      </div>
                    </div>

                    {/* Option & Action Column */}
                    <div className="flex md:flex-col justify-between items-center md:items-end self-stretch shrink-0 pt-1">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition opacity-60 hover:opacity-100">
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className={cn("border font-semibold text-xs", theme.card, theme.textPrimary)}>
                          <DropdownMenuItem onClick={() => {
                            navigator.clipboard.writeText(window.location.href);
                            toast.success("Sharing link copied!");
                          }} className="flex items-center gap-1.5">
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
                        onClick={() => setActiveConvo(convo)}
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

          {/* Right Sidebar Column (Independent Scroll) */}
          <div className="hidden xl:block w-76 h-full overflow-y-auto pr-1 pb-16 space-y-5 flex-shrink-0 scrollbar-hide">
            {/* Trending topics */}
            <div className={cn("border rounded-2xl p-4 shadow-2xs space-y-3", theme.card)}>
              <h2 className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-1">
                <span>TRENDING TOPICS</span>
                <Flame className="h-3.5 w-3.5 text-orange-500 fill-orange-500" />
              </h2>
              <div className="space-y-2.5">
                {[{ name: "AI", count: "5.2K discussions" }, { name: "Anime", count: "3.8K discussions" }, { name: "Technology", count: "2.9K discussions" }, { name: "Gaming", count: "2.1K discussions" }].map((topic) => (
                  <div key={topic.name} onClick={() => setSearchQuery(topic.name)} className="flex items-center justify-between p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer">
                    <div className="flex items-center gap-2">
                      <span className="font-bold opacity-60">#</span>
                      <div className="leading-tight">
                        <p className="text-xs font-bold">{topic.name}</p>
                        <p className="text-[9px] opacity-60">{topic.count}</p>
                      </div>
                    </div>
                    <TrendingUp className="h-3.5 w-3.5 text-green-600" />
                  </div>
                ))}
              </div>
            </div>

            {/* Suggested For You */}
            <div className={cn("border rounded-2xl p-4 shadow-2xs space-y-3", theme.card)}>
              <h2 className="text-xs font-extrabold uppercase tracking-wider">SUGGESTED FOR YOU</h2>
              <div className="space-y-3">
                {[{ id: "c1", name: "Tech Enthusiasts", count: "1.8K members", initials: "TE" }, { id: "c2", name: "Mindful Minds", count: "2.3K members", initials: "MM" }].map((comm) => {
                  const isJoined = !!joinedCommunities[comm.id];
                  return (
                    <div key={comm.id} className="flex items-center justify-between gap-2 p-1 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8 rounded-xl border">
                          <AvatarFallback className="bg-[#5C3E2F] text-white text-xs">{comm.initials}</AvatarFallback>
                        </Avatar>
                        <div className="leading-tight">
                          <p className="text-[11px] font-bold">{comm.name}</p>
                          <p className="text-[8px] opacity-60">{comm.count}</p>
                        </div>
                      </div>
                      <Button onClick={() => {
                        setJoinedCommunities(p => ({ ...p, [comm.id]: !p[comm.id] }));
                        toast.success(isJoined ? "Left community" : "Joined community!");
                      }} className={cn("rounded-full px-3 py-1 h-auto text-[9px] font-bold border", isJoined ? "bg-[#8B5E3C] text-white" : theme.btnOutline)}>
                        {isJoined ? "Leave" : "Join"}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      ) : (
        
        // ====================================================
        // CASE 2: CONVERSATION DETAIL VIEW (MATCHES SPECIFIC SCREENSHOT)
        // ====================================================
        <>
          {/* Main Feed Area (Detail Content) */}
          <div className="flex-1 h-full overflow-y-auto pr-1 pb-16 lg:pb-6 space-y-5 scrollbar-hide">
            
            {/* Top Navigation Row */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setActiveConvo(null)}
                className={cn("flex items-center gap-1.5 text-xs font-bold transition hover:opacity-85", theme.textSecondary)}
              >
                <ChevronLeft className="h-4 w-4" />
                Back to Conversations
              </button>

              <div className="flex items-center gap-2.5">
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    toast.success("Sharing URL copied!");
                  }}
                  variant="outline"
                  className={cn("rounded-full px-4 h-8 text-[11px] font-bold border flex items-center gap-1.5", theme.inputBg, theme.border, theme.textPrimary)}
                >
                  <Share2 className="h-3.5 w-3.5" />
                  Share
                </Button>
                <button className="p-2 rounded-full border hover:bg-black/5 dark:hover:bg-white/5 transition border-[#8B5E3C]/20 text-[#8B5E3C] dark:text-[#E8AC7D]">
                  <Bookmark className="h-3.5 w-3.5" />
                </button>
                <button className="p-2 rounded-full border hover:bg-black/5 dark:hover:bg-white/5 transition border-[#8B5E3C]/20 text-[#8B5E3C] dark:text-[#E8AC7D]">
                  <MoreVertical className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Conversation Overview Card */}
            <div className={cn("border rounded-[24px] p-4 flex flex-col md:flex-row items-center md:items-start gap-4 shadow-2xs", theme.card)}>
              <img
                src={activeConvo.thumbnailUrl}
                alt={activeConvo.title}
                className="w-full md:w-36 h-28 md:h-24 rounded-xl object-cover border shrink-0"
              />
              <div className="flex-grow space-y-2 min-w-0">
                <h2 className="text-lg md:text-xl font-bold leading-tight font-serif tracking-tight">
                  {activeConvo.title}
                </h2>
                <p className="text-[10px] opacity-60 font-semibold leading-none">
                  Started by <span className={cn("font-bold", theme.textSecondary)}>@{activeConvo.startedBy}</span> • 3h ago • Edited 2h ago
                </p>
                <p className="text-xs opacity-80 leading-relaxed">
                  {activeConvo.description}
                </p>

                {/* Sub category pills */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {["AI", "Programming", "Future", "Debate"].map((tag) => (
                    <span
                      key={tag}
                      className={cn("px-3 py-0.5 rounded-full text-[10px] font-bold", theme.pillInactive)}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Status Statistics Row */}
            <div className={cn("border rounded-[20px] p-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-center font-bold text-xs shadow-2xs", theme.card)}>
              <div className="flex flex-col items-center justify-center p-1.5">
                <div className="flex items-center gap-1.5">
                  <MessageSquare className="h-4 w-4 opacity-75" />
                  <span>{activeConvo.replies}</span>
                </div>
                <span className="text-[9px] opacity-50 uppercase tracking-wider mt-1 block">Replies</span>
              </div>
              <div className="flex flex-col items-center justify-center p-1.5 border-l border-[#8B5E3C]/10">
                <div className="flex items-center gap-1.5">
                  <Users className="h-4 w-4 opacity-75" />
                  <span>{activeConvo.participants}</span>
                </div>
                <span className="text-[9px] opacity-50 uppercase tracking-wider mt-1 block">Participants</span>
              </div>
              <div className="flex flex-col items-center justify-center p-1.5 border-l border-[#8B5E3C]/10">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <span>23</span>
                </div>
                <span className="text-[9px] opacity-50 uppercase tracking-wider mt-1 block">Online now</span>
              </div>
              <div className="flex flex-col items-center justify-center p-1.5 border-l border-[#8B5E3C]/10">
                <div className="flex items-center gap-1 text-orange-500">
                  <Flame className="h-4 w-4 fill-orange-500" />
                  <span>Active</span>
                </div>
                <span className="text-[9px] opacity-50 uppercase tracking-wider mt-1 block">Hot discussion</span>
              </div>
            </div>

            {/* Sub-tabs / Filters Row */}
            <div className="flex items-center justify-between border-b border-dashed border-[#8B5E3C]/15 py-1">
              <div className="flex items-center gap-4 text-xs font-bold opacity-75">
                {["Top", "Latest", "Unanswered", "Polls", "Media", "Files"].map((tab) => (
                  <button
                    key={tab}
                    className={cn(
                      "py-1 relative",
                      tab === "Top" ? "text-[#8B5E3C] dark:text-[#E8AC7D] border-b-2 border-[#8B5E3C]" : "hover:opacity-100 opacity-70"
                    )}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1 text-xs font-semibold opacity-85">
                <span>Sort: Top</span>
                <ChevronDown className="h-3.5 w-3.5" />
              </div>
            </div>

            {/* Thoughts / Reply Input Widget */}
            <div className={cn("border rounded-[20px] p-3 space-y-3 shadow-2xs", theme.card)}>
              <div className="flex items-start gap-2.5">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src="https://api.dicebear.com/7.x/initials/svg?seed=Aryan" />
                  <AvatarFallback>A</AvatarFallback>
                </Avatar>
                <textarea
                  placeholder="Share your thoughts..."
                  rows={2}
                  value={replyInput}
                  onChange={(e) => setReplyInput(e.target.value)}
                  className={cn("flex-grow resize-none text-xs font-semibold focus:outline-none bg-transparent pt-1 placeholder-opacity-50", theme.textPrimary)}
                />
              </div>

              <div className="flex items-center justify-between border-t border-[#8B5E3C]/10 pt-2 text-[10px] font-bold">
                <div className="flex items-center gap-4 opacity-75 text-[#8B5E3C] dark:text-[#E8AC7D]">
                  <button className="flex items-center gap-1 hover:opacity-80">
                    <Heading1 className="h-3.5 w-3.5" />
                    <span>Text</span>
                  </button>
                  <button className="flex items-center gap-1 hover:opacity-80">
                    <ImageIcon className="h-3.5 w-3.5" />
                    <span>Image</span>
                  </button>
                  <button className="flex items-center gap-1 hover:opacity-80">
                    <Smile className="h-3.5 w-3.5" />
                    <span>GIF</span>
                  </button>
                  <button className="flex items-center gap-1 hover:opacity-80">
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    <span>Poll</span>
                  </button>
                  <button className="flex items-center gap-1 hover:opacity-80">
                    <Mic className="h-3.5 w-3.5" />
                    <span>Voice</span>
                  </button>
                  <button className="flex items-center gap-1 hover:opacity-80">
                    <Paperclip className="h-3.5 w-3.5" />
                    <span>File</span>
                  </button>
                </div>

                <Button
                  onClick={handlePostReply}
                  className={cn("rounded-full px-5 py-1.5 h-auto text-[11px] font-bold", theme.btnPrimary)}
                >
                  Post Reply
                </Button>
              </div>
            </div>

            {/* Replies Feed List */}
            <div className="space-y-4 pt-1">
              {replies.map((reply) => (
                <div
                  key={reply.id}
                  className={cn("border rounded-[20px] p-4 flex gap-4 shadow-2xs relative", theme.card)}
                >
                  {/* Left Column: Vote Scorers */}
                  <div className="flex flex-col items-center gap-1.5 p-1 rounded-xl bg-black/5 dark:bg-white/5 self-start shrink-0 min-w-[32px]">
                    <button
                      onClick={() => handleVote(reply.id, 1)}
                      className="p-1 hover:text-green-500 transition-colors"
                      aria-label="Upvote"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <span className="text-xs font-bold">{reply.score}</span>
                    <button
                      onClick={() => handleVote(reply.id, -1)}
                      className="p-1 hover:text-red-500 transition-colors rotate-180"
                      aria-label="Downvote"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Right Column: Content and Actions */}
                  <div className="flex-1 space-y-2 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7 border shrink-0">
                          <AvatarImage src={reply.avatar} />
                          <AvatarFallback>U</AvatarFallback>
                        </Avatar>
                        <div className="leading-tight">
                          <span className="text-xs font-extrabold">@{reply.author}</span>
                          {reply.isAuthor && (
                            <span className={cn("ml-1.5 px-2 py-0.5 rounded-full text-[8px] font-bold uppercase", theme.badgeGreen)}>
                              Author
                            </span>
                          )}
                          {reply.badgeText && (
                            <span className={cn("ml-1.5 px-2 py-0.5 rounded-full text-[8px] font-bold uppercase", theme.badgeGreen)}>
                              {reply.badgeText}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] opacity-50 font-medium">• {reply.time}</span>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-1 opacity-50 hover:opacity-100">
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className={cn("border font-semibold text-xs", theme.card, theme.textPrimary)}>
                          <DropdownMenuItem onClick={() => handleShareConversation("Reply by " + reply.author)} className="flex items-center gap-1">
                            <Share2 className="h-3.5 w-3.5" /> Share Reply
                          </DropdownMenuItem>
                          {reply.author === "you" && (
                            <DropdownMenuItem onClick={() => setReplies(replies.filter(r => r.id !== reply.id))} className="flex items-center gap-1 text-red-500">
                              <Trash2 className="h-3.5 w-3.5" /> Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Paragraph list */}
                    <div className="space-y-1 text-xs opacity-90 leading-relaxed font-semibold">
                      {reply.body.map((pText, pIdx) => (
                        <p key={pIdx}>{pText}</p>
                      ))}
                    </div>

                    {/* Avatars participants line if existing */}
                    {(reply.avatars && reply.avatars.length > 0) && (
                      <div className="flex items-center gap-2 pt-1 font-bold text-[9px]">
                        <div className="flex -space-x-1.5">
                          {reply.avatars.map((av, idx) => (
                            <Avatar key={idx} className="h-5 w-5 border border-white dark:border-[#2A1D16]">
                              <AvatarImage src={av} />
                              <AvatarFallback>U</AvatarFallback>
                            </Avatar>
                          ))}
                        </div>
                        <span className="opacity-60">{reply.extraCount}</span>
                        {reply.isPinned && (
                          <span className="text-green-600 dark:text-green-400 flex items-center gap-1 font-bold">
                            ★ Pinned by aryan
                          </span>
                        )}
                      </div>
                    )}

                    {/* Footer Row */}
                    <div className="flex items-center justify-between border-t border-[#8B5E3C]/10 pt-2 text-[10px] font-extrabold opacity-75">
                      <div className="flex items-center gap-4 text-[#8B5E3C] dark:text-[#E8AC7D]">
                        <button className="flex items-center gap-1 hover:opacity-85" onClick={() => toast.success("Opening reply form")}>
                          <MessageCircle className="h-3.5 w-3.5" />
                          <span>Reply</span>
                        </button>
                        <button className="flex items-center gap-1 hover:opacity-85" onClick={() => handleShareConversation("Reply by " + reply.author)}>
                          <Share2 className="h-3.5 w-3.5" />
                          <span>Share</span>
                        </button>
                        <button className="flex items-center gap-1 hover:opacity-85" onClick={() => toast.success("Tipped author +10 Vibes!")}>
                          <Coins className="h-3.5 w-3.5" />
                          <span>Tip</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-3">
                        <button onClick={() => toggleBookmarkReply(reply.id)} className="p-1 hover:opacity-100">
                          {reply.bookmarked ? (
                            <BookmarkCheck className="h-3.5 w-3.5 text-[#8B5E3C]" />
                          ) : (
                            <Bookmark className="h-3.5 w-3.5 text-[#8B5E3C]/60" />
                          )}
                        </button>
                        <button className="p-1 opacity-60 hover:opacity-100">
                          <MoreVertical className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ====================================================
              RIGHT SIDEBAR (DETAIL SCREEN WIDGETS)
             ==================================================== */}
          <div className="hidden xl:block w-76 h-full overflow-y-auto pr-1 pb-16 space-y-5 flex-shrink-0 scrollbar-hide">
            
            {/* Widget A: About this conversation */}
            <div className={cn("border rounded-2xl p-4 shadow-2xs space-y-3.5 text-xs font-semibold", theme.card)}>
              <h2 className="text-xs font-extrabold uppercase tracking-wider">About this conversation</h2>
              <p className="text-[11px] opacity-75 leading-relaxed font-normal">
                A discussion about the impact of AI on programming jobs and the future of software development.
              </p>
              
              <div className="space-y-2 border-t border-dashed border-[#8B5E3C]/15 pt-3 leading-snug">
                <div className="flex justify-between items-center">
                  <span className="opacity-60 text-[10px]">Started by</span>
                  <div className="flex items-center gap-1">
                    <Avatar className="h-5 w-5 border">
                      <AvatarImage src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80" />
                    </Avatar>
                    <span className="font-bold">@aryan</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-60 text-[10px]">Created</span>
                  <span className="font-bold">3h ago</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-60 text-[10px]">Last activity</span>
                  <span className="font-bold">18 sec ago</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-60 text-[10px]">Category</span>
                  <span className="font-bold text-[#8B5E3C] dark:text-[#E8AC7D]">Technology</span>
                </div>
                
                <div className="space-y-1 pt-1.5">
                  <span className="opacity-60 text-[10px] block">Tags</span>
                  <div className="flex flex-wrap gap-1">
                    {["AI", "Programming", "Future"].map((t) => (
                      <span key={t} className="px-2 py-0.5 rounded-full text-[9px] bg-black/5 dark:bg-white/5 border text-opacity-80">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Widget B: Popular opinions */}
            <div className={cn("border rounded-2xl p-4 shadow-2xs space-y-3.5", theme.card)}>
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-extrabold uppercase tracking-wider">Popular opinions</h2>
                <button className={cn("text-[9px] font-bold hover:underline", theme.textSecondary)}>View all</button>
              </div>

              <div className="space-y-3">
                {[
                  { score: 128, text: "AI won't replace programmers", replies: "42 replies" },
                  { score: 97, text: "Programmers' role will evolve", replies: "28 replies" }
                ].map((op, idx) => (
                  <div key={idx} className="flex gap-2.5 items-start p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer">
                    <div className="flex flex-col items-center bg-black/5 dark:bg-white/5 px-1.5 py-0.5 rounded-md text-[10px] font-extrabold leading-none mt-0.5">
                      <ChevronUp className="h-3 w-3" />
                      <span>{op.score}</span>
                    </div>
                    <div className="min-w-0 leading-tight">
                      <p className="text-[11px] font-extrabold truncate">{op.text}</p>
                      <p className="text-[9px] opacity-60 mt-0.5">{op.replies}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Widget C: Active now */}
            <div className={cn("border rounded-2xl p-4 shadow-2xs space-y-3", theme.card)}>
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-extrabold uppercase tracking-wider">Active now • 23</h2>
                <ChevronRight className="h-3.5 w-3.5 opacity-60 hover:opacity-100 cursor-pointer" />
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-1">
                {[
                  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80",
                  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80",
                  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80",
                  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80",
                  "https://api.dicebear.com/7.x/initials/svg?seed=Aditya",
                  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80",
                ].map((uImg, uIdx) => (
                  <Avatar key={uIdx} className="h-7 w-7 border shrink-0">
                    <AvatarImage src={uImg} />
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                ))}
              </div>
            </div>

            {/* Widget D: Voice room live */}
            <div className={cn("border rounded-2xl p-4 shadow-2xs space-y-3.5", theme.card)}>
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-1">
                  <span>Voice room</span>
                </h2>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
                  Live now
                </span>
              </div>

              <div className="space-y-1 font-semibold leading-tight pt-1">
                <h3 className="text-xs font-extrabold flex items-center gap-1.5">
                  AI & Future of Programming
                  <span className="flex items-center gap-0.5 h-3">
                    <span className="w-0.5 h-2 bg-green-500 animate-pulse" />
                    <span className="w-0.5 h-3 bg-green-500 animate-pulse [animation-delay:-0.2s]" />
                    <span className="w-0.5 h-1.5 bg-green-500 animate-pulse [animation-delay:-0.4s]" />
                  </span>
                </h3>
                <p className="text-[9px] opacity-60">8 people speaking • 23 listening</p>
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-1">
                {[
                  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80",
                  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80",
                  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80",
                ].map((sImg, sIdx) => (
                  <Avatar key={sIdx} className="h-6 w-6 border border-white dark:border-[#2A1D16] shrink-0">
                    <AvatarImage src={sImg} />
                    <AvatarFallback>S</AvatarFallback>
                  </Avatar>
                ))}
              </div>

              <Button
                onClick={() => {
                  setVoiceJoined(!voiceJoined);
                  if (!voiceJoined) toast.success("Joined Voice Room. Unmuted!");
                  else toast.info("Disconnected from voice room");
                }}
                className={cn(
                  "w-full rounded-full py-1.5 h-auto text-[10px] font-bold flex items-center justify-center gap-1.5",
                  voiceJoined ? "bg-[#8B5E3C] text-white" : "bg-[#8B5E3C]/10 text-[#8B5E3C] dark:bg-[#FAF6F0]/10 dark:text-[#E8AC7D] hover:bg-[#8B5E3C]/20"
                )}
              >
                {voiceJoined ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    Listening...
                  </>
                ) : (
                  <>
                    <Headphones className="h-3.5 w-3.5" />
                    Join Voice Room
                  </>
                )}
              </Button>
            </div>
          </div>
        </>
      )}

    </div>
  );
}
