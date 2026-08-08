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
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#8B5E3C]/10 text-[#8B5E3C] dark:bg-[#EFE6DA]/15 dark:text-[#EFE6DA]">0</span>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <p className={cn("text-[10px] opacity-60 italic text-center", theme.textPrimary)}>
            No active chats. Start one now!
          </p>
        </div>
      </div>

      {/* 2. REPLIES */}
      <div className={cn("border rounded-[20px] p-3 shadow-2xs hover:scale-[1.005] transition-transform duration-200 h-[110px] flex flex-col justify-between", theme.card)}>
        <div className="flex items-center justify-between border-b border-dashed pb-1.5 border-[#C8B9A6]/15">
          <h3 className={cn("text-[10px] font-bold uppercase tracking-wider flex items-center gap-1", theme.textPrimary)}>
            💬 Replies
          </h3>
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#8B5E3C]/10 text-[#8B5E3C] dark:bg-[#EFE6DA]/15 dark:text-[#EFE6DA]">0</span>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <p className={cn("text-[10px] opacity-60 italic text-center", theme.textPrimary)}>
            No new replies.
          </p>
        </div>
      </div>

      {/* 3. LIVE NOW */}
      <div className={cn("border rounded-[20px] p-3 shadow-2xs hover:scale-[1.005] transition-transform duration-200 h-[110px] flex flex-col justify-between", theme.card)}>
        <div className="flex items-center justify-between border-b border-dashed pb-1.5 border-[#C8B9A6]/15">
          <h3 className={cn("text-[10px] font-bold uppercase tracking-wider flex items-center gap-1", theme.textPrimary)}>
            🎙 Live Now
          </h3>
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#8B5E3C]/20 text-[#8B5E3C] dark:bg-[#EFE6DA]/15 dark:text-[#EFE6DA]">Coming Soon</span>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center space-y-1">
          <p className="text-[10px] font-bold text-[#8B5E3C] dark:text-[#E8AC7D]">🎙 Live Audio Rooms</p>
          <p className={cn("text-[8px] opacity-65 text-center px-2", theme.textPrimary)}>
            Host and join real-time voice conversations with communities.
          </p>
        </div>
      </div>

      {/* 4. FRIENDS ONLINE */}
      <div className={cn("border rounded-[20px] p-3 shadow-2xs hover:scale-[1.005] transition-transform duration-200 h-[80px] flex flex-col justify-between", theme.card)}>
        <div className="flex items-center justify-between border-b border-dashed pb-1 border-[#C8B9A6]/15">
          <h3 className={cn("text-[10px] font-bold uppercase tracking-wider flex items-center gap-1", theme.textPrimary)}>
            🟢 Friends Online
          </h3>
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#8B5E3C]/10 text-[#8B5E3C] dark:bg-[#EFE6DA]/15 dark:text-[#EFE6DA]">0</span>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <p className={cn("text-[10px] opacity-60 italic text-center", theme.textPrimary)}>
            No friends online right now.
          </p>
        </div>
      </div>

      {/* 5. RECENT ACTIVITY */}
      <div className={cn("border rounded-[20px] p-3 shadow-2xs hover:scale-[1.005] transition-transform duration-200 h-[145px] flex flex-col justify-between", theme.card)}>
        <div className="flex items-center justify-between border-b border-dashed pb-1.5 border-[#C8B9A6]/15">
          <h3 className={cn("text-[10px] font-bold uppercase tracking-wider flex items-center gap-1", theme.textPrimary)}>
            ⚡ Recent Activity
          </h3>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <p className={cn("text-[10px] opacity-60 italic text-center", theme.textPrimary)}>
            No recent notifications.
          </p>
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
