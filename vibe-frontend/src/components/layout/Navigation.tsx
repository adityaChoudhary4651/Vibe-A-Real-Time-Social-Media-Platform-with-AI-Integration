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
export function DesktopSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMsgCount, setUnreadMsgCount] = useState(0);
  const { socket } = useSocket();

  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchCounts = () => {
      getUnreadCount().then(setUnreadCount).catch(() => {});
      getUnreadMessageCount().then(setUnreadMsgCount).catch(() => {});
    };

    fetchCounts();

    window.addEventListener("messagesRead", fetchCounts);

    if (socket) {
      socket.on("receive_message", () => {
        // If not on messages page, increment count
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

  const handleProfileClick = () => {
    if (isAuthenticated) navigate("/profile");
    else navigate("/auth");
  };

  return (
    <aside className="hidden lg:flex flex-col w-64 xl:w-72 h-screen sticky top-0 border-r border-border bg-card/50 backdrop-blur-sm">
      <div className="p-6">
        <Link to="/" className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-xl">V</span>
          </div>
          <span className="text-2xl font-bold gradient-text">Vibe</span>
        </Link>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const isProfile = item.path === "/profile";

          if (isProfile) {
            return (
              <button
                key={item.path}
                onClick={handleProfileClick}
                className={cn(
                  "nav-link relative w-full text-left transition-all duration-200 active:scale-[0.98]",
                  isActive && "nav-link-active"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute inset-0 bg-secondary rounded-xl"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-3">
                  <item.icon
                    className={cn("h-5 w-5 transition-colors", isActive && "text-primary")}
                  />
                  <span>{item.label}</span>
                </span>
              </button>
            );
          }

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "nav-link relative transition-all duration-200 active:scale-[0.98]",
                isActive && "nav-link-active"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="activeNav"
                  className="absolute inset-0 bg-secondary rounded-xl"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}

              <span className="relative z-10 flex items-center gap-3">
                {/* 🔔 BADGE — ONLY ADDITION */}
                <span className="relative">
                  <item.icon
                    className={cn("h-5 w-5 transition-colors", isActive && "text-primary")}
                  />
                  {item.path === "/notifications" && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 min-w-[16px] px-1 rounded-full text-[10px] font-semibold bg-destructive text-destructive-foreground flex items-center justify-center">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                  {item.path === "/messages" && unreadMsgCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 min-w-[16px] px-1 rounded-full text-[10px] font-semibold bg-destructive text-destructive-foreground flex items-center justify-center">
                      {unreadMsgCount > 7 ? "7+" : unreadMsgCount}
                    </span>
                  )}
                </span>

                <span>{item.label}</span>
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <button
          onClick={handleProfileClick}
          className="flex items-center gap-3 px-3 py-2 w-full hover:bg-secondary rounded-xl transition-all duration-200 active:scale-[0.98]"
        >
          <div className="h-10 w-10 rounded-full bg-gradient-primary flex items-center justify-center">
            <span className="text-primary-foreground font-semibold text-sm">
              {isAuthenticated ? user?.name?.charAt(0).toUpperCase() || "U" : "?"}
            </span>
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-semibold truncate">
              {isAuthenticated ? user?.username || "user" : "Guest"}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {isAuthenticated ? user?.name || "User" : "Tap to sign in"}
            </p>
          </div>
        </button>
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
      getUnreadMessageCount().then(setUnreadMsgCount).catch(() => {});
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
        <h1 className={cn(
          "font-bold",
          location.pathname === "/" ? "text-2xl gradient-text" : "text-lg"
        )}>
          {getTitle()}
        </h1>

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
