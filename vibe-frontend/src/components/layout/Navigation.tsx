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

  const isCreatePage = location.pathname === "/create";

  const theme = isCreatePage ? {
    card: isDark ? "bg-[#2A1D16]" : "bg-[#FFFDF9]",
    cardBorder: isDark ? "border-[#3D2A1F]" : "border-[#E3D8C8]",
    textPrimary: isDark ? "text-[#F5F0E8]" : "text-[#5A3A22]",
    textSecondary: isDark ? "text-[#D2C5B4]" : "text-[#8B5E3C]",
    border: isDark ? "border-[#3D2A1F]" : "border-[#E3D8C8]",
    navActive: isDark ? "bg-[#3D2A1F] text-[#F5F0E8]" : "bg-[#8B5E3C] text-[#FFFDF9]",
    navHover: isDark ? "hover:bg-[#2A1D16]/50 text-[#F5F0E8]" : "hover:bg-[#8B5E3C]/8 text-[#5A3A22]",
  } : {
    card: isDark ? "bg-[#2A1D16]" : "bg-[#EFE6DA]",
    cardBorder: isDark ? "border-[#3D2A1F]" : "border-[#E3D8C8]",
    textPrimary: isDark ? "text-[#F5F0E8]" : "text-[#4A3428]",
    textSecondary: isDark ? "text-[#D2C5B4]" : "text-[#8B5E3C]",
    border: isDark ? "border-[#3D2A1F]" : "border-[#E3D8C8]",
    navActive: isDark ? "bg-[#3D2A1F]" : "bg-[#EFE6DA]",
    navHover: isDark ? "hover:bg-[#2A1D16]/50" : "hover:bg-[#EFE6DA]/50",
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
        "w-[205px] xl:w-[220px] shrink-0 sticky top-0 h-screen flex flex-col justify-between py-5 border-r pr-2 pl-2 transition-all duration-300",
        isCreatePage
          ? (isDark ? "bg-[#1F140E] border-[#3D2A1F]" : "bg-[#F8F4EE] border-[#8B5E3C]/12")
          : theme.border
      )}
    >
      <div className="space-y-4 flex flex-col flex-1">
        {/* Logo */}
        <div className="flex items-center gap-2 px-1">
          <span className={cn(
            "text-2xl font-extrabold tracking-widest font-serif transition-colors duration-300",
            isCreatePage
              ? (isDark ? "text-[#F5F0E8]" : "text-[#8B5E3C]")
              : theme.textSecondary
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
                    ? `${isCreatePage ? (isDark ? "bg-[#3D2A1F] text-[#F5F0E8]" : "bg-[#8B5E3C] text-[#FFFDF9]") : theme.navActive} font-semibold`
                    : `${theme.navHover} ${isCreatePage ? (isDark ? "text-[#F5F0E8]" : "text-[#5A3A22]") : "text-opacity-80"}`
                )}
              >
                <span className="flex items-center gap-2">
                  <item.icon
                    className={cn(
                      "h-[18px] w-[18px] transition-all duration-300 group-hover:scale-105",
                      isActive
                        ? (isCreatePage ? (isDark ? "text-[#F5F0E8]" : "text-[#FFFDF9]") : theme.textSecondary)
                        : (isCreatePage ? (isDark ? "text-[#D2C5B4]" : "text-[#8B5E3C]") : "opacity-75 group-hover:opacity-100")
                    )}
                  />

                  <span className={cn(
                    "text-[13px] font-medium tracking-wide",
                    isActive && isCreatePage && (isDark ? "text-[#F5F0E8]" : "text-[#FFFDF9]")
                  )}>
                    {item.label}
                  </span>
                </span>

                {!!item.badge && item.badge > 0 && (
                  <span className={cn(
                    "h-5 min-w-[20px] px-1.5 flex items-center justify-center text-[10px] font-bold rounded-full",
                    isCreatePage
                      ? (isDark ? "bg-[#2A1D16] text-[#F5F0E8]" : "bg-[#5A3A22] text-[#FFFDF9]")
                      : "bg-[#8B5E3C] text-white"
                  )}>
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
            <span className={`text-[11px] font-medium tracking-wide ${isCreatePage ? (isDark ? "text-[#F5F0E8]" : "text-[#5A3A22]") : ""}`}>Dark Mode</span>
          </div>
          <button
            onClick={toggleDarkMode}
            className="w-9 h-5 bg-[#C8B9A6]/50 rounded-full relative p-0.5 transition-colors duration-300 focus:outline-none"
            style={{ backgroundColor: isDark ? "#8B5E3C" : (isCreatePage ? "#E6D3BE" : "") }}
            aria-label="Toggle Dark Mode"
          >
            <div
              className={cn(
                "w-4 h-4 rounded-full transition-transform duration-300",
                isCreatePage ? (isDark ? "bg-[#2A1D16]" : "bg-[#FFFDF9]") : "bg-[#F5F0E8]"
              )}
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
            className="flex items-center gap-2 w-full px-2.5 py-2 rounded-[14px] text-[11px] font-semibold uppercase tracking-wider text-red-500 hover:bg-red-50/10 transition-all duration-300 text-left"
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
            <p className={`text-[9px] ${isCreatePage ? (isDark ? "text-[#D2C5B4]" : "text-[#8B5E3C]") : "opacity-60"}`}>Find Your VIBE(●'◡'●)</p>
            <p className={`text-[11px] font-semibold truncate ${isCreatePage ? (isDark ? "text-[#F5F0E8]" : "text-[#5A3A22]") : ""}`}>{user?.username || "vibe_user"}</p>
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

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 glass border-t border-border/50 safe-area-pb">
      <div className="flex items-center justify-around h-16 px-2">
        {mobileNavItems.map((item) => {
          const isActive = location.pathname === item.path;
          const isProfile = item.path === "/profile";

          if (isProfile) {
            return (
              <button
                key={item.path}
                onClick={handleProfileClick}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-all duration-200 min-w-[60px] active:scale-95",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <motion.div whileTap={{ scale: 0.9 }} className="relative">
                  <item.icon className="h-6 w-6" />
                </motion.div>
              </button>
            );
          }

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-all duration-200 min-w-[60px] active:scale-95",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <motion.div whileTap={{ scale: 0.9 }} className="relative">
                <item.icon className="h-6 w-6" />
                {item.path === "/messages" && unreadMsgCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 min-w-[16px] px-1 rounded-full text-[10px] font-semibold bg-destructive text-destructive-foreground flex items-center justify-center pointer-events-none">
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
   MOBILE HEADER (UNCHANGED)
====================== */
export function MobileHeader() {
  const location = useLocation();

  const getTitle = () => {
    switch (location.pathname) {
      case "/": return "Vibe";
      case "/search": return "Search";
      case "/discover": return "Discover";
      case "/reels": return "Reels";
      case "/messages": return "Messages";
      case "/notifications": return "Notifications";
      case "/communities": return "Communities";
      case "/profile": return "Profile";
      case "/create": return "Create";
      default: return "Vibe";
    }
  };

  return (
    <header className="lg:hidden sticky top-0 z-40 glass border-b border-border/50">
      <div className="flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-2">
          <h1 className={cn(
            "font-bold",
            location.pathname === "/" ? "text-2xl gradient-text" : "text-lg"
          )}>
            {getTitle()}
          </h1>
          {location.pathname === "/" && (
            <span className="text-[9px] font-semibold bg-primary/20 text-primary border border-primary/30 rounded-full px-1.5 py-0.5 animate-pulse">
              Beta
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {location.pathname === "/" && (
            <>
              <Link to="/notifications" className="p-2 rounded-xl hover:bg-secondary transition-colors">
                <Bell className="h-5 w-5" />
              </Link>
              <Link to="/create" className="p-2 rounded-xl hover:bg-secondary transition-colors">
                <PlusSquare className="h-5 w-5" />
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
