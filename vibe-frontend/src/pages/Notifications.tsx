import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Heart,
  MessageCircle,
  UserPlus,
  AtSign,
  DollarSign,
  Film,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/api/notifications";

/* ======================
   TYPES
====================== */
type NotificationType = "like" | "comment" | "follow";

interface Notification {
  _id: string;
  type: NotificationType;
  sender: {
    username: string;
    avatar: string;
  };
  post?: {
    _id: string;
    mediaUrl: string;
  };
  isRead: boolean;
  createdAt: string;
}

/* ======================
   FILTERS
====================== */
const filters = ["All", "Likes", "Comments", "Follows"];

/* ======================
   COMPONENT
====================== */
export default function Notifications() {
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeFilter, setActiveFilter] = useState("All");
  const [loading, setLoading] = useState(true);

  /* ======================
     FETCH
  ====================== */
  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getNotifications();
        setNotifications(data);
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, []);

  /* ======================
     HELPERS
  ====================== */
  const getIcon = (type: NotificationType) => {
    switch (type) {
      case "like":
        return <Heart className="h-4 w-4 fill-destructive text-destructive" />;
      case "comment":
        return <MessageCircle className="h-4 w-4 text-primary" />;
      case "follow":
        return <UserPlus className="h-4 w-4 text-primary" />;
    }
  };

  const getText = (n: Notification) => {
    if (n.type === "like") return "liked your post";
    if (n.type === "comment") return "commented on your post";
    if (n.type === "follow") return "started following you";
    return "";
  };

  const formatTime = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  /* ======================
     FILTERING
  ====================== */
  const filteredNotifications = useMemo(() => {
    if (activeFilter === "All") return notifications;

    return notifications.filter((n) => {
      if (activeFilter === "Likes") return n.type === "like";
      if (activeFilter === "Comments") return n.type === "comment";
      if (activeFilter === "Follows") return n.type === "follow";
      return true;
    });
  }, [activeFilter, notifications]);

  /* ======================
     HANDLERS
  ====================== */
  const handleClick = async (n: Notification) => {
    if (!n.isRead) {
      await markNotificationRead(n._id);
      setNotifications((prev) =>
        prev.map((x) =>
          x._id === n._id ? { ...x, isRead: true } : x
        )
      );
    }

    if (n.type === "follow") {
      navigate(`/profile/${n.sender.username}`);
    } else if (n.post) {
      navigate(`/post/${n.post._id}`);
    }
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead();
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, isRead: true }))
    );
  };

  /* ======================
     RENDER
  ====================== */
  if (loading) return null;

  return (
    <div className="min-h-screen">
      {/* Filters */}
      <div className="sticky top-0 z-10 glass border-b border-border/50 lg:relative lg:bg-transparent lg:backdrop-blur-none lg:border-0 lg:border-b lg:border-border">
        <div className="flex gap-2 p-4 overflow-x-auto scrollbar-hide">
          {filters.map((filter) => (
            <Button
              key={filter}
              variant={activeFilter === filter ? "default" : "secondary"}
              size="sm"
              onClick={() => setActiveFilter(filter)}
              className="rounded-full whitespace-nowrap"
            >
              {filter}
            </Button>
          ))}

          {notifications.some((n) => !n.isRead) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllRead}
              className="ml-auto"
            >
              Mark all as read
            </Button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="divide-y divide-border">
        <AnimatePresence mode="popLayout">
          {filteredNotifications.map((n, index) => (
            <motion.div
              key={n._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ delay: index * 0.03 }}
              className={cn(
                "flex items-center gap-3 p-4 hover:bg-secondary/30 transition-colors cursor-pointer",
                !n.isRead && "bg-primary/5"
              )}
              onClick={() => handleClick(n)}
            >
              <div className="relative">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={n.sender.avatar} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {n.sender.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-card border border-border flex items-center justify-center">
                  {getIcon(n.type)}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  <span className="font-semibold hover:text-primary">
                    {n.sender.username}
                  </span>{" "}
                  <span className="text-foreground/80">
                    {getText(n)}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatTime(n.createdAt)}
                </p>
              </div>

              {n.post?.mediaUrl && (
                <img
                  src={n.post.mediaUrl}
                  alt=""
                  className="h-12 w-12 rounded-lg object-cover"
                />
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredNotifications.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center px-4">
          <div className="h-20 w-20 rounded-full bg-secondary flex items-center justify-center mb-4">
            <Heart className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">
            No notifications yet
          </h3>
          <p className="text-muted-foreground text-sm">
            When someone interacts with your content, you'll see it here.
          </p>
        </div>
      )}
    </div>
  );
}
