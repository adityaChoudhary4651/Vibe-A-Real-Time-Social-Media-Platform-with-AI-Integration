import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  Search,
  Film,
  MessageCircle,
  Bell,
  User,
  PlusSquare,
  Compass,
  Users,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { getUnreadCount } from "@/api/notifications";
import { getUnreadMessageCount } from "@/api/messages";
import { useEffect, useState } from "react";
import { useSocket } from "@/contexts/SocketContext";

/* ======================
   NAV ITEMS
====================== */
const navItems = [
  { icon: Home, label: "Home", path: "/" },
  { icon: Search, label: "Search", path: "/search" },
  { icon: Compass, label: "Discover", path: "/discover" },
  { icon: Film, label: "Reels", path: "/reels" },
  { icon: PlusSquare, label: "Create", path: "/create" },
  { icon: MessageCircle, label: "Messages", path: "/messages" },
  { icon: Bell, label: "Notifications", path: "/notifications" },
  { icon: Users, label: "Communities", path: "/communities" },
  { icon: Sparkles, label: "Vibe AI", path: "/vibe-ai" },
  { icon: User, label: "Profile", path: "/profile" },
];

/* ======================
   DESKTOP SIDEBAR
====================== */
import { Moon, Sun, LogOut } from "lucide-react";
import { toast } from "sonner";
import { resolveUrl } from "../../config";

export function DesktopSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();

  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMsgCount, setUnreadMsgCount] = useState(0);
  const { socket } = useSocket();

  // Synchronized global dark mode state
  const [isDark, setIsDark] = useState(() => localStorage.getItem("vibe_theme") === "dark");

  useEffect(() => {
    const handleThemeChange = () => {
      setIsDark(localStorage.getItem("vibe_theme") === "dark");
    };
    window.addEventListener("themeChange", handleThemeChange);
    return () => window.removeEventListener("themeChange", handleThemeChange);
  }, []);

  const toggleDarkMode = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    localStorage.setItem("vibe_theme", nextDark ? "dark" : "light");
    localStorage.setItem("vibe_dark_mode", nextDark ? "true" : "false");
    if (nextDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    window.dispatchEvent(new Event("themeChange"));
  };

  const isCreatePage = location.pathname === "/create" || location.pathname === "/messages" || location.pathname === "/communities" || location.pathname === "/notifications" || location.pathname === "/vibe-ai";

  // Single unified theme — same on all pages
  const theme = {
    card: isDark ? "bg-[#2A1D16]" : "bg-[#EFE6DA]",
    cardBorder: isDark ? "border-[#3D2A1F]" : "border-[#E3D8C8]",
    textPrimary: isDark ? "text-[#F5F0E8]" : "text-[#4A3428]",
    textSecondary: isDark ? "text-[#D2C5B4]" : "text-[#8B5E3C]",
    border: isDark ? "border-[#3D2A1F]" : "border-[#E3D8C8]",
    navActive: isDark ? "bg-[#3D2A1F] text-[#F5F0E8]" : "bg-[#EFE6DA] text-[#4A3428]",
    navHover: isDark ? "hover:bg-[#2A1D16]/80 text-[#D2C5B4]" : "hover:bg-[#EFE6DA]/70 text-[#5A3A22]",
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchCounts = () => {
      getUnreadCount().then(setUnreadCount).catch(() => { });
      getUnreadMessageCount().then(setUnreadMsgCount).catch(() => { });
    };

    fetchCounts();

    window.addEventListener("messagesRead", fetchCounts);

    if (socket) {
      socket.on("receive_message", () => {
        if (location.pathname !== "/messages") {
          setUnreadMsgCount(prev => prev + 1);
        }
      });

      socket.on("notification", () => {
        setUnreadCount(prev => prev + 1);
      });
    }

    return () => {
      window.removeEventListener("messagesRead", fetchCounts);
      if (socket) {
        socket.off("receive_message");
        socket.off("notification");
      }
    };
  }, [isAuthenticated, socket, location.pathname]);

  const sidebarNavItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: Search, label: "Search", path: "/search" },
    { icon: Compass, label: "Discover", path: "/discover" },
    { icon: Film, label: "Reels", path: "/reels" },
    { icon: PlusSquare, label: "Create", path: "/create" },
    { icon: MessageCircle, label: "Messages", path: "/messages", badge: unreadMsgCount },
    { icon: Bell, label: "Notifications", path: "/notifications", badge: unreadCount },
    { icon: Users, label: "Community", path: "/communities" },
    { icon: Sparkles, label: "Vibe AI", path: "/vibe-ai" },
    { icon: User, label: "Profile", path: "/profile" },
  ];

  return (
    <aside
      className={cn(
        "hidden lg:flex w-[205px] xl:w-[220px] shrink-0 sticky top-0 h-screen flex-col justify-between py-5 border-r pr-2 pl-2 transition-all duration-300",
        isDark ? "bg-[#1F140E] border-[#3D2A1F]" : "bg-[#F5F0E8] border-[#E3D8C8]"
      )}
    >
      <div className="space-y-4 flex flex-col flex-1">
        {/* Logo */}
        <div className="flex items-center gap-2 px-1">
          <span className={cn(
            "text-2xl font-extrabold tracking-widest font-serif transition-colors duration-300",
            isDark ? "text-[#F5F0E8]" : "text-[#8B5E3C]"
          )}>
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
                className={cn(
                  "flex items-center justify-between px-2 py-2.5 rounded-[14px] transition-all duration-300 group",
                  isActive
                    ? `${theme.navActive} font-semibold`
                    : `${theme.navHover}`
                )}
              >
                <span className="flex items-center gap-2">
                  <item.icon
                    className={cn(
                      "h-[18px] w-[18px] transition-all duration-300 group-hover:scale-105",
                      isActive ? theme.textSecondary : "opacity-70 group-hover:opacity-100"
                    )}
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
      <div className={cn("pt-4 border-t border-dashed space-y-2.5", isDark ? "border-[#3D2A1F]/60" : "border-[#C8B9A6]/30")}>
        {/* Dark Mode Toggle */}
        <div className={`flex items-center justify-between p-2 rounded-[14px] ${theme.card} border ${theme.cardBorder}`}>
          <div className="flex items-center gap-2">
            {isDark ? <Moon className="h-3.5 w-3.5 text-[#8B5E3C]" /> : <Sun className="h-3.5 w-3.5 text-[#8B5E3C]" />}
            <span className={`text-[11px] font-medium tracking-wide ${theme.textPrimary}`}>Dark Mode</span>
          </div>
          <button
            onClick={toggleDarkMode}
            className="w-9 h-5 rounded-full relative p-0.5 transition-colors duration-300 focus:outline-none"
            style={{ backgroundColor: isDark ? "#8B5E3C" : "#C8B9A6" }}
            aria-label="Toggle Dark Mode"
          >
            <div
              className={cn("w-4 h-4 rounded-full transition-transform duration-300", isDark ? "bg-[#F5F0E8]" : "bg-white")}
              style={{ transform: isDark ? "translateX(16px)" : "translateX(0px)" }}
            />
          </button>
        </div>

        {/* Logout Button */}
        {isAuthenticated && (
          <button
            onClick={() => {
              logout();
              toast.success("Logged out successfully");
              navigate("/login");
            }}
            className="flex items-center gap-2 w-full px-2.5 py-2 rounded-[14px] text-[11px] font-semibold uppercase tracking-wider text-red-400 hover:bg-red-50/10 transition-all duration-300 text-left"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Logout</span>
          </button>
        )}

        {/* User profile card */}
        <div
          onClick={() => isAuthenticated && navigate("/profile")}
          className={`flex items-center gap-2 p-2 rounded-[14px] ${theme.card} border ${theme.cardBorder} cursor-pointer hover:opacity-90`}
        >
          <img
            src={resolveUrl(user?.avatar) || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150"}
            alt="user avatar"
            className="h-6 w-6 rounded-full object-cover border border-[#8B5E3C]/30"
          />
          <div className="flex-1 min-w-0">
            <p className={`text-[9px] ${theme.textSecondary}`}>Find Your VIBE(●'◡'●)</p>
            <p className={`text-[11px] font-semibold truncate ${theme.textPrimary}`}>{user?.username || "vibe_user"}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

/* ======================
   MOBILE BOTTOM NAV
====================== */
export function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { socket } = useSocket();

  const [unreadMsgCount, setUnreadMsgCount] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchCount = () => {
      getUnreadMessageCount().then(setUnreadMsgCount).catch(() => { });
    };

    fetchCount();

    window.addEventListener("messagesRead", fetchCount);

    if (socket) {
      socket.on("receive_message", () => {
        if (location.pathname !== "/messages") {
          setUnreadMsgCount(prev => prev + 1);
        }
      });
    }

    return () => {
      window.removeEventListener("messagesRead", fetchCount);
      if (socket) {
        socket.off("receive_message");
      }
    };
  }, [isAuthenticated, socket, location.pathname]);

  const [isDark, setIsDark] = useState(() => localStorage.getItem("vibe_theme") === "dark");


  useEffect(() => {
    const handleThemeChange = () => {
      setIsDark(localStorage.getItem("vibe_theme") === "dark");
    };
    window.addEventListener("themeChange", handleThemeChange);
    return () => window.removeEventListener("themeChange", handleThemeChange);
  }, []);

  const handleProfileClick = () => {
    if (isAuthenticated) navigate("/profile");
    else navigate("/auth");
  };

  const mobileNavItems = [
    { icon: Home, path: "/" },
    { icon: Search, path: "/search" },
    { icon: Compass, path: "/discover" },
    { icon: Film, path: "/reels" },
    { icon: Users, path: "/communities" },
    { icon: MessageCircle, path: "/messages" },
    { icon: User, path: "/profile" },
  ];

  const themeTextActive = isDark ? "text-[#F5F0E8]" : "text-[#8B5E3C]";
  const themeTextInactive = isDark ? "text-[#D2C5B4]/60" : "text-[#8B5E3C]/50";

  return (
    <nav className={cn(
      "lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t safe-area-pb transition-colors duration-300",
      isDark ? "bg-[#1F140E] border-[#3D2A1F]" : "bg-[#F5F0E8] border-[#E3D8C8]"
    )}>
      <div className="flex items-center justify-around h-16 px-2">
        {mobileNavItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path === "/profile" && location.pathname.startsWith("/profile"));
          const isProfile = item.path === "/profile";

          if (isProfile) {
            return (
              <button
                key={item.path}
                onClick={handleProfileClick}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-all duration-200 min-w-[44px] active:scale-95",
                  isActive ? themeTextActive : themeTextInactive
                )}
              >
                <motion.div whileTap={{ scale: 0.9 }} className="relative">
                  <item.icon className={cn("h-6 w-6", isActive && "drop-shadow-sm")} />
                  {isActive && (
                    <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#8B5E3C]" />
                  )}
                </motion.div>
              </button>
            );
          }

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-all duration-200 min-w-[44px] active:scale-95",
                isActive ? themeTextActive : themeTextInactive
              )}
            >
              <motion.div whileTap={{ scale: 0.9 }} className="relative">
                <item.icon className={cn("h-6 w-6", isActive && "drop-shadow-sm")} />
                {isActive && (
                  <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#8B5E3C]" />
                )}
                {item.path === "/messages" && unreadMsgCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 min-w-[16px] px-1 rounded-full text-[10px] font-semibold bg-[#8B5E3C] text-white flex items-center justify-center pointer-events-none">
                    {unreadMsgCount > 7 ? "7+" : unreadMsgCount}
                  </span>
                )}
              </motion.div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

/* ======================
   MOBILE HEADER
====================== */
export function MobileHeader() {
  const location = useLocation();
  const [isDark, setIsDark] = useState(() => localStorage.getItem("vibe_theme") === "dark");

  useEffect(() => {
    const handleThemeChange = () => {
      setIsDark(localStorage.getItem("vibe_theme") === "dark");
    };
    window.addEventListener("themeChange", handleThemeChange);
    return () => window.removeEventListener("themeChange", handleThemeChange);
  }, []);

  const getTitle = () => {
    switch (location.pathname) {
      case "/": return "VIBE";
      case "/search": return "Search";
      case "/discover": return "Discover";
      case "/reels": return "Reels";
      case "/messages": return "Messages";
      case "/notifications": return "Notifications";
      case "/communities": return "Communities";
      case "/profile": return "Profile";
      case "/create": return "Create";
      default: return "VIBE";
    }
  };

  const isHome = location.pathname === "/";

  return (
    <header className={cn(
      "lg:hidden sticky top-0 z-40 border-b transition-colors duration-300",
      isDark ? "bg-[#1F140E] border-[#3D2A1F]" : "bg-[#F5F0E8] border-[#E3D8C8]"
    )}>
      <div className="flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-2">
          <h1 className={cn(
            "font-extrabold tracking-widest font-serif transition-colors duration-300",
            isHome ? "text-2xl" : "text-lg font-semibold tracking-normal",
            isDark ? "text-[#F5F0E8]" : "text-[#8B5E3C]"
          )}>
            {getTitle()}
          </h1>
          {isHome && (
            <span className={cn(
              "text-[9px] font-semibold rounded-full px-1.5 py-0.5 animate-pulse border",
              isDark ? "bg-[#251711] text-[#D2C5B4] border-[#3D2A1A]" : "bg-[#EFE6DA] text-[#8B5E3C] border-[#C8B9A6]"
            )}>
              Beta
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isHome && (
            <>
              <Link
                to="/notifications"
                className={cn(
                  "p-2 rounded-xl transition-colors",
                  isDark ? "hover:bg-[#140C09] text-[#D2C5B4]" : "hover:bg-[#EFE6DA] text-[#8B5E3C]"
                )}
              >
                <Bell className="h-5 w-5" />
              </Link>
              <Link
                to="/create"
                className={cn(
                  "p-2 rounded-xl transition-colors",
                  isDark ? "hover:bg-[#140C09] text-[#D2C5B4]" : "hover:bg-[#EFE6DA] text-[#8B5E3C]"
                )}
              >
                <PlusSquare className="h-5 w-5" />
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
