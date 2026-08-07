import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Activity,
  ChevronRight,
  Heart,
  MessageSquare,
  UserPlus,
  Share2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ActivitySidebarProps {
  className?: string;
  isMobilePage?: boolean;
}

export function ActivitySidebar({ className, isMobilePage = false }: ActivitySidebarProps) {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(() => localStorage.getItem("vibe_theme") === "dark");

  useEffect(() => {
    const handleThemeChange = () => {
      setIsDark(localStorage.getItem("vibe_theme") === "dark");
    };
    window.addEventListener("themeChange", handleThemeChange);
    return () => window.removeEventListener("themeChange", handleThemeChange);
  }, []);

  const theme = {
    card: isDark ? "bg-[#2A1D16] border-[#3D2A1F]" : "bg-[#EFE6DA] border-[#E3D8C8]",
    textPrimary: isDark ? "text-[#F5F0E8]" : "text-[#4A3428]",
    textSecondary: isDark ? "text-[#D2C5B4]" : "text-[#8B5E3C]",
    border: isDark ? "border-[#3D2A1F]" : "border-[#E3D8C8]",
    hoverBg: isDark ? "hover:bg-[#3D2A1F]/30" : "hover:bg-[#EFE6DA]/40",
    shadow: "shadow-2xs",
  };

  const TypingIndicator = () => (
    <span className="flex items-center gap-0.5 ml-1 h-2.5">
      <span className="h-1 w-1 rounded-full bg-green-500 animate-bounce [animation-delay:-0.3s]"></span>
      <span className="h-1 w-1 rounded-full bg-green-500 animate-bounce [animation-delay:-0.15s]"></span>
      <span className="h-1 w-1 rounded-full bg-green-500 animate-bounce"></span>
    </span>
  );

  return (
    <div className={cn("flex flex-col justify-start space-y-3 h-full max-h-[95vh] overflow-hidden select-none", className)}>
      {/* Header */}
      <div className="flex items-start gap-2 px-1 pb-1">
        <Activity className={cn("h-5 w-5 mt-0.5 animate-pulse", theme.textSecondary)} />
        <div>
          <h2 className={cn("text-base font-bold tracking-wide font-serif", theme.textPrimary)}>
            Activity
          </h2>
          <p className={cn("text-[10px] opacity-70", theme.textPrimary)}>
            What's happening in your world
          </p>
        </div>
      </div>

      {/* 1. CONTINUE CONVERSATIONS */}
      <div className={cn("border rounded-[20px] p-3 shadow-2xs hover:scale-[1.005] transition-transform duration-200 h-[115px] flex flex-col justify-between", theme.card)}>
        <div className="flex items-center justify-between border-b border-dashed pb-1.5 border-[#C8B9A6]/15">
          <h3 className={cn("text-[10px] font-bold uppercase tracking-wider flex items-center gap-1", theme.textPrimary)}>
            💬 Continue Conversations
          </h3>
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#8B5E3C]/10 text-[#8B5E3C] dark:bg-[#EFE6DA]/15 dark:text-[#EFE6DA]">3</span>
        </div>

        <div className="relative flex items-center flex-1 my-1">
          {/* Horizontal scroll container */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pr-8 w-full py-0.5">
            {/* Aryan */}
            <div 
              onClick={() => navigate("/messages")}
              className={cn("flex items-start gap-1.5 p-1.5 rounded-xl bg-white/35 dark:bg-black/10 border border-[#8B5E3C]/10 w-[95px] h-[56px] shrink-0 cursor-pointer transition-all hover:scale-[1.02]", theme.hoverBg)}
            >
              <div className="relative shrink-0">
                <img 
                  src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100" 
                  alt="Aryan" 
                  className="h-6 w-6 rounded-full object-cover border border-[#8B5E3C]/20"
                />
                <span className="absolute bottom-0 right-0 h-1.5 w-1.5 rounded-full bg-green-500 border border-white dark:border-[#2A1D16]" />
              </div>
              <div className="min-w-0 leading-tight">
                <p className={cn("text-[9px] font-bold truncate", theme.textPrimary)}>Aryan</p>
                <div className="flex items-center mt-0.5">
                  <span className="text-[8px] font-semibold text-green-500">Typing</span>
                  <TypingIndicator />
                </div>
                <span className="text-[7px] opacity-50 block mt-0.5">@n</span>
              </div>
            </div>

            {/* Candy */}
            <div 
              onClick={() => navigate("/messages")}
              className={cn("flex items-start gap-1.5 p-1.5 rounded-xl bg-white/35 dark:bg-black/10 border border-[#8B5E3C]/10 w-[95px] h-[56px] shrink-0 cursor-pointer transition-all hover:scale-[1.02]", theme.hoverBg)}
            >
              <div className="relative shrink-0">
                <img 
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100" 
                  alt="Candy" 
                  className="h-6 w-6 rounded-full object-cover border border-[#8B5E3C]/20"
                />
                <span className="absolute bottom-0 right-0 h-1.5 w-1.5 rounded-full bg-green-500 border border-white dark:border-[#2A1D16]" />
              </div>
              <div className="min-w-0 leading-tight">
                <p className={cn("text-[9px] font-bold truncate", theme.textPrimary)}>Candy</p>
                <p className={cn("text-[8px] opacity-75 truncate mt-0.5", theme.textPrimary)}>Sent a photo</p>
                <span className="text-[7px] opacity-50 block mt-0.5">2m</span>
              </div>
            </div>

            {/* Rahul */}
            <div 
              onClick={() => navigate("/messages")}
              className={cn("flex items-start gap-1.5 p-1.5 rounded-xl bg-white/35 dark:bg-black/10 border border-[#8B5E3C]/10 w-[95px] h-[56px] shrink-0 cursor-pointer transition-all hover:scale-[1.02]", theme.hoverBg)}
            >
              <div className="relative shrink-0">
                <img 
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100" 
                  alt="Rahul" 
                  className="h-6 w-6 rounded-full object-cover border border-[#8B5E3C]/20"
                />
                <span className="absolute bottom-0 right-0 h-1.5 w-1.5 rounded-full bg-green-500 border border-white dark:border-[#2A1D16]" />
              </div>
              <div className="min-w-0 leading-tight">
                <p className={cn("text-[9px] font-bold truncate", theme.textPrimary)}>Rahul</p>
                <p className={cn("text-[8px] opacity-75 truncate mt-0.5", theme.textPrimary)}>Voice message</p>
                <span className="text-[7px] opacity-50 block mt-0.5">15m</span>
              </div>
            </div>
          </div>

          {/* Fade Right Overlay + Chevron Link */}
          <div className="absolute right-0 top-0 bottom-0 flex items-center pl-4 bg-gradient-to-l from-[#EFE6DA] dark:from-[#2A1D16] via-[#EFE6DA]/70 dark:via-[#2A1D16]/70 to-transparent pointer-events-none">
            <button 
              onClick={() => navigate("/messages")}
              className="p-0.5 rounded-full bg-[#8B5E3C]/20 dark:bg-black/30 hover:bg-[#8B5E3C]/30 text-[#8B5E3C] dark:text-[#E8AC7D] transition-colors pointer-events-auto"
              aria-label="View conversations"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. REPLIES */}
      <div className={cn("border rounded-[20px] p-3 shadow-2xs hover:scale-[1.005] transition-transform duration-200 h-[110px] flex flex-col justify-between", theme.card)}>
        <div className="flex items-center justify-between border-b border-dashed pb-1.5 border-[#C8B9A6]/15">
          <h3 className={cn("text-[10px] font-bold uppercase tracking-wider flex items-center gap-1", theme.textPrimary)}>
            💬 Replies
          </h3>
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#8B5E3C]/10 text-[#8B5E3C] dark:bg-[#EFE6DA]/15 dark:text-[#EFE6DA]">2</span>
        </div>

        <div className="flex-1 flex flex-col justify-center space-y-1.5 my-1 min-h-0">
          {/* Priya */}
          <div 
            onClick={() => navigate("/notifications")}
            className={cn("flex items-center justify-between gap-2 p-0.5 rounded-lg cursor-pointer transition-all", theme.hoverBg)}
          >
            <div className="flex items-center gap-2 min-w-0">
              <img 
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100" 
                alt="Priya" 
                className="h-7 w-7 rounded-full object-cover border border-[#8B5E3C]/20 shrink-0"
              />
              <p className={cn("text-[10px] leading-snug min-w-0 truncate", theme.textPrimary)}>
                <span className="font-bold">Priya</span> replied to your comment
              </p>
            </div>
            <span className="text-[8px] opacity-65 shrink-0">1m</span>
          </div>

          {/* Aditya */}
          <div 
            onClick={() => navigate("/notifications")}
            className={cn("flex items-center justify-between gap-2 p-0.5 rounded-lg cursor-pointer transition-all", theme.hoverBg)}
          >
            <div className="flex items-center gap-2 min-w-0">
              <img 
                src="https://api.dicebear.com/7.x/initials/svg?seed=Aditya" 
                alt="Aditya" 
                className="h-7 w-7 rounded-full object-cover border border-[#8B5E3C]/20 shrink-0"
              />
              <p className={cn("text-[10px] leading-snug min-w-0 truncate", theme.textPrimary)}>
                <span className="font-bold">Aditya</span> mentioned you in a comment
              </p>
            </div>
            <span className="text-[8px] opacity-65 shrink-0">2h</span>
          </div>
        </div>
      </div>

      {/* 3. LIVE NOW */}
      <div className={cn("border rounded-[20px] p-3 shadow-2xs hover:scale-[1.005] transition-transform duration-200 h-[110px] flex flex-col justify-between", theme.card)}>
        <div className="flex items-center justify-between border-b border-dashed pb-1.5 border-[#C8B9A6]/15">
          <h3 className={cn("text-[10px] font-bold uppercase tracking-wider flex items-center gap-1", theme.textPrimary)}>
            🎙 Live Now
          </h3>
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#8B5E3C]/10 text-[#8B5E3C] dark:bg-[#EFE6DA]/15 dark:text-[#EFE6DA]">2</span>
        </div>

        <div className="flex-1 flex flex-col justify-center space-y-2 my-1 min-h-0">
          {/* Anime India */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="relative shrink-0">
                <div className="h-7 w-7 rounded-[8px] bg-red-500/10 text-red-500 flex items-center justify-center font-bold text-[10px] border border-red-500/25">
                  AI
                </div>
                <span className="absolute bottom-0 right-0 h-1.5 w-1.5 rounded-full bg-green-500 border border-white dark:border-[#2A1D16]" />
              </div>
              <div className="min-w-0 leading-tight">
                <p className={cn("text-[10px] font-bold truncate", theme.textPrimary)}>Anime India</p>
                <p className="text-[8px] opacity-60">Voice room is live</p>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[8px] font-bold text-green-600 dark:text-green-400 flex items-center gap-0.5">
                <span className="h-1 w-1 rounded-full bg-green-500 animate-pulse"></span>
                18 online
              </span>
              <button 
                onClick={() => navigate("/communities")}
                className="px-2.5 py-0.5 rounded-full text-[8px] font-bold uppercase transition-all duration-200 border border-[#8B5E3C] bg-[#8B5E3C] text-white hover:bg-transparent hover:text-[#8B5E3C]"
              >
                Join
              </button>
            </div>
          </div>

          {/* Study Group */}
          <div 
            onClick={() => navigate("/communities")}
            className={cn("flex items-center justify-between gap-2 p-0.5 rounded-lg cursor-pointer transition-colors", theme.hoverBg)}
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="h-7 w-7 rounded-[8px] bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold text-[10px] border border-blue-500/25 shrink-0">
                SG
              </div>
              <div className="min-w-0 leading-tight">
                <p className={cn("text-[10px] font-bold truncate", theme.textPrimary)}>Study Group</p>
                <p className="text-[8px] opacity-60">12 unread messages</p>
              </div>
            </div>
            <ChevronRight className="h-3.5 w-3.5 opacity-50 shrink-0" />
          </div>
        </div>
      </div>

      {/* 4. FRIENDS ONLINE */}
      <div className={cn("border rounded-[20px] p-3 shadow-2xs hover:scale-[1.005] transition-transform duration-200 h-[80px] flex flex-col justify-between", theme.card)}>
        <div className="flex items-center justify-between border-b border-dashed pb-1 border-[#C8B9A6]/15">
          <h3 className={cn("text-[10px] font-bold uppercase tracking-wider flex items-center gap-1", theme.textPrimary)}>
            🟢 Friends Online
          </h3>
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#8B5E3C]/10 text-[#8B5E3C] dark:bg-[#EFE6DA]/15 dark:text-[#EFE6DA]">12</span>
        </div>

        <div className="flex items-center justify-between px-1 mt-1">
          {/* Aryan */}
          <div onClick={() => navigate("/messages")} className="flex flex-col items-center cursor-pointer">
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100" 
                alt="Aryan" 
                className="h-7 w-7 rounded-full object-cover border border-[#8B5E3C]/20"
              />
              <span className="absolute bottom-0 right-0 h-1.5 w-1.5 rounded-full bg-green-500 border border-white dark:border-[#2A1D16]" />
            </div>
            <span className={cn("text-[8px] font-semibold mt-0.5 text-center max-w-[40px] truncate", theme.textPrimary)}>Aryan</span>
          </div>

          {/* Candy */}
          <div onClick={() => navigate("/messages")} className="flex flex-col items-center cursor-pointer">
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100" 
                alt="Candy" 
                className="h-7 w-7 rounded-full object-cover border border-[#8B5E3C]/20"
              />
              <span className="absolute bottom-0 right-0 h-1.5 w-1.5 rounded-full bg-green-500 border border-white dark:border-[#2A1D16]" />
            </div>
            <span className={cn("text-[8px] font-semibold mt-0.5 text-center max-w-[40px] truncate", theme.textPrimary)}>Candy</span>
          </div>

          {/* Rahul */}
          <div onClick={() => navigate("/messages")} className="flex flex-col items-center cursor-pointer">
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100" 
                alt="Rahul" 
                className="h-7 w-7 rounded-full object-cover border border-[#8B5E3C]/20"
              />
              <span className="absolute bottom-0 right-0 h-1.5 w-1.5 rounded-full bg-green-500 border border-white dark:border-[#2A1D16]" />
            </div>
            <span className={cn("text-[8px] font-semibold mt-0.5 text-center max-w-[40px] truncate", theme.textPrimary)}>Rahul</span>
          </div>

          {/* Sneha */}
          <div onClick={() => navigate("/messages")} className="flex flex-col items-center cursor-pointer">
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100" 
                alt="Sneha" 
                className="h-7 w-7 rounded-full object-cover border border-[#8B5E3C]/20"
              />
              <span className="absolute bottom-0 right-0 h-1.5 w-1.5 rounded-full bg-green-500 border border-white dark:border-[#2A1D16]" />
            </div>
            <span className={cn("text-[8px] font-semibold mt-0.5 text-center max-w-[40px] truncate", theme.textPrimary)}>Sneha</span>
          </div>

          {/* More */}
          <div onClick={() => navigate("/messages")} className="flex flex-col items-center cursor-pointer justify-center">
            <div className={cn("h-7 w-7 rounded-full flex items-center justify-center border border-dashed text-[10px] font-bold hover:bg-[#8B5E3C] hover:text-white hover:border-[#8B5E3C] transition-colors shrink-0", theme.textSecondary, theme.border)}>
              ...
            </div>
            <span className={cn("text-[8px] font-semibold mt-0.5", theme.textPrimary)}>More</span>
          </div>
        </div>
      </div>

      {/* 5. RECENT ACTIVITY */}
      <div className={cn("border rounded-[20px] p-3 shadow-2xs hover:scale-[1.005] transition-transform duration-200 h-[145px] flex flex-col justify-between", theme.card)}>
        <div className="flex items-center justify-between border-b border-dashed pb-1.5 border-[#C8B9A6]/15">
          <h3 className={cn("text-[10px] font-bold uppercase tracking-wider flex items-center gap-1", theme.textPrimary)}>
            ⚡ Recent Activity
          </h3>
        </div>

        <div className="flex-1 flex flex-col justify-center space-y-1 my-1.5 min-h-0">
          {/* Likes */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <Heart className="h-3 w-3 text-red-500 fill-red-500 shrink-0" />
              <p className={cn("text-[9px] leading-none truncate", theme.textPrimary)}>6 new likes on your post</p>
            </div>
            <span className="text-[8px] opacity-60">10m</span>
          </div>

          {/* Comments */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <MessageSquare className="h-3 w-3 text-blue-500 shrink-0" />
              <p className={cn("text-[9px] leading-none truncate", theme.textPrimary)}>3 new comments</p>
            </div>
            <span className="text-[8px] opacity-60">25m</span>
          </div>

          {/* Follows */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <UserPlus className="h-3 w-3 text-green-500 shrink-0" />
              <p className={cn("text-[9px] leading-none truncate", theme.textPrimary)}>2 new followers</p>
            </div>
            <span className="text-[8px] opacity-60">1h</span>
          </div>

          {/* Shares */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <Share2 className="h-3 w-3 text-purple-500 shrink-0" />
              <p className={cn("text-[9px] leading-none truncate", theme.textPrimary)}>5 new shares</p>
            </div>
            <span className="text-[8px] opacity-60">2h</span>
          </div>
        </div>

        <Link 
          to="/notifications" 
          className={cn("block text-center text-[9px] font-bold uppercase tracking-wider hover:underline", theme.textSecondary)}
        >
          See all
        </Link>
      </div>
    </div>
  );
}
