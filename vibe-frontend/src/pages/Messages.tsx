import { useEffect, useState, useRef } from "react";
import { useOutletContext, useSearchParams, Link } from "react-router-dom";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Search,
  Edit,
  MoreVertical,
  Send,
  Image,
  ArrowLeft,
  X,
  Settings,
  Phone,
  Video,
  Smile,
  Mic,
  PlusSquare,
  Sparkles,
  CheckCheck
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { ChatActionMenu } from "@/components/shared/ChatActionMenu";
import { ChatEditSheet } from "@/components/shared/ChatEditSheet";
import { CallOverlay } from "@/components/shared/CallOverlay";
import {
  getConversations,
  createConversation,
  muteConversation,
  archiveConversation,
  favoriteConversation,
  deleteConversation,
} from "@/api/conversations";
import { getMessages, sendMessage } from "@/api/messages";
import { fetchFollowers } from "@/api/profile";
import { useAuth } from "@/contexts/AuthContext";
import { useSocket } from "@/contexts/SocketContext";
import { resolveUrl } from "../config";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { toast } from "sonner";

/* =====================
   TYPES
   ===================== */
type LayoutOutletContext = {
  setHideBottomNav?: (hide: boolean) => void;
};

type ChatUser = {
  _id: string;
  username: string;
  avatar?: string;
  name?: string;
};

type Message = {
  _id: string;
  text: string;
  mediaUrl?: string;
  mediaType?: string;
  sender: ChatUser;
  createdAt: string;
  isRead?: boolean;
};

type Conversation = {
  _id: string;
  participants: ChatUser[];
  lastMessage?: Message;
  mutedBy?: string[];
  favorites?: string[];
};

export default function Messages() {
  const { setHideBottomNav } = useOutletContext<LayoutOutletContext>();
  const { user } = useAuth();
  const { socket } = useSocket();

  const myUserId = user?.id ?? "";

  const [searchParams, setSearchParams] = useSearchParams();
  const conversationParam = searchParams.get("conversation");

  /* =====================
     STATE
     ===================== */
  const isDarkState = () => localStorage.getItem("vibe_theme") === "dark";
  const [isDark, setIsDark] = useState(isDarkState);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(conversationParam);
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState("");
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [showEditChats, setShowEditChats] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [followers, setFollowers] = useState<ChatUser[]>([]);
  const [isSending, setIsSending] = useState(false);

  const [activeTab, setActiveTab] = useState<"all" | "unread" | "groups" | "requests">("all");

  // Image attachment state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  // Call connection states
  const [callOpen, setCallOpen] = useState(false);
  const [callType, setCallType] = useState<"voice" | "video">("voice");
  const [incomingCall, setIncomingCall] = useState<any | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedConversation = conversations.find(
    (c) => c._id === selectedChat
  );

  const isInChat = selectedChat !== null;

  /* =====================
     THEME OBSERVER
     ===================== */
  useEffect(() => {
    const handleThemeChange = () => {
      setIsDark(isDarkState());
    };
    window.addEventListener("themeChange", handleThemeChange);
    return () => window.removeEventListener("themeChange", handleThemeChange);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* =====================
     EFFECTS
     ===================== */
  useEffect(() => {
    setHideBottomNav?.(isInChat);
    return () => setHideBottomNav?.(false);
  }, [isInChat, setHideBottomNav]);

  useEffect(() => {
    getConversations()
      .then(setConversations)
      .catch(console.error);

    if (!socket) return;

    const handleGlobalMessage = (msg: Message) => {
      setConversations((prev) => {
        const convIndex = prev.findIndex(c => c._id === (msg as any).conversation);
        if (convIndex === -1) return prev;

        const newConversations = [...prev];
        newConversations[convIndex] = {
          ...newConversations[convIndex],
          lastMessage: msg
        };

        const [movedConv] = newConversations.splice(convIndex, 1);
        return [movedConv, ...newConversations];
      });
    };

    const handleIncomingCall = (data: any) => {
      if (callOpen) {
        socket.emit("reject_call", { callerId: data.callerId });
        return;
      }
      setIncomingCall(data);
      setCallType(data.callType);
      setCallOpen(true);
    };

    socket.on("receive_message", handleGlobalMessage);
    socket.on("incoming_call", handleIncomingCall);

    return () => {
      socket.off("receive_message", handleGlobalMessage);
      socket.off("incoming_call", handleIncomingCall);
    };
  }, [socket, callOpen]);

  useEffect(() => {
    if (!selectedChat || !socket) return;

    socket.emit("join_conversation", selectedChat);

    getMessages(selectedChat)
      .then((msgs) => {
        setMessages(msgs);

        setConversations(prev => prev.map(c =>
          c._id === selectedChat && c.lastMessage
            ? { ...c, lastMessage: { ...c.lastMessage, isRead: true } }
            : c
        ));

        window.dispatchEvent(new CustomEvent("messagesRead"));
      })
      .catch(console.error);

    const handleReceiveMessage = (msg: Message) => {
      setMessages((prev) => {
        if (prev.find(m => m._id === msg._id)) return prev;
        return [...prev, msg];
      });

      setConversations((prev) =>
        prev.map((c) =>
          c._id === selectedChat ? { ...c, lastMessage: msg } : c
        )
      );
    };

    socket.on("receive_message", handleReceiveMessage);

    return () => {
      socket.off("receive_message", handleReceiveMessage);
    };
  }, [selectedChat, socket]);

  /* =====================
     SEND MESSAGE
     ===================== */
  const handleSend = async () => {
    if ((!message.trim() && !selectedImageFile) || !selectedChat || isSending) return;

    setIsSending(true);
    try {
      const msg = await sendMessage(selectedChat, message, selectedImageFile || undefined);

      setMessages((prev) => {
        if (prev.find(m => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
      setMessage("");
      setSelectedImageFile(null);
      setImagePreviewUrl(null);

      setConversations((prev) =>
        prev.map((c) =>
          c._id === selectedChat ? { ...c, lastMessage: msg } : c
        )
      );
    } catch (err) {
      console.error(err);
      toast.error("Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImageFile(file);
      setImagePreviewUrl(URL.createObjectURL(file));
    }
  };

  /* =====================
     CALL INITIATION
     ===================== */
  const initiateCall = (type: "voice" | "video") => {
    const otherUser = selectedConversation?.participants.find((p) => p._id !== myUserId);
    if (!otherUser) {
      toast.error("Select a conversation to start a call");
      return;
    }

    setIncomingCall(null);
    setCallType(type);
    setCallOpen(true);
  };

  /* =====================
     NEW CHAT LOGIC
     ===================== */
  const handleOpenNewChat = async () => {
    setIsNewChatOpen(true);
    if (!user?.username || !user?.token) return;

    try {
      const data = await fetchFollowers(user.username, user.token);
      setFollowers(data);
    } catch (err) {
      console.error("Failed to fetch followers:", err);
    }
  };

  const handleSelectUser = async (userId: string) => {
    try {
      const conv = await createConversation(userId);
      setConversations((prev) => {
        if (prev.find((c) => c._id === conv._id)) return prev;
        return [conv, ...prev];
      });
      setSelectedChat(conv._id);
      setIsNewChatOpen(false);
      setSearchParams({ conversation: conv._id }, { replace: true });
    } catch (err) {
      console.error("Failed to start chat:", err);
    }
  };

  /* =====================
     BATCH CHAT ACTIONS
     ===================== */
  const handleBatchChatAction = async (action: "Muted" | "Archived" | "Deleted", selectedIds: string[]) => {
    for (const id of selectedIds) {
      try {
        if (action === "Deleted") {
          await deleteConversation(id);
          setConversations((prev) => prev.filter((c) => c._id !== id));
          if (selectedChat === id) {
            setSelectedChat(null);
            setSearchParams({}, { replace: true });
          }
        } else if (action === "Muted") {
          await muteConversation(id);
        } else if (action === "Archived") {
          await archiveConversation(id);
          setConversations((prev) => prev.filter((c) => c._id !== id));
          if (selectedChat === id) {
            setSelectedChat(null);
            setSearchParams({}, { replace: true });
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  /* =====================
     SINGLE CHAT MENU ACTIONS
     ===================== */
  const handleChatMenuAction = async (action: string, itemId: string) => {
    try {
      if (action === "delete") {
        await deleteConversation(itemId);
        setConversations((prev) => prev.filter((c) => c._id !== itemId));
        if (selectedChat === itemId) {
          setSelectedChat(null);
          setSearchParams({}, { replace: true });
        }
      } else if (action === "mute") {
        const res = await muteConversation(itemId);
        setConversations((prev) =>
          prev.map((c) =>
            c._id === itemId
              ? {
                  ...c,
                  mutedBy: res.isMuted
                    ? [...(c.mutedBy || []), myUserId]
                    : (c.mutedBy || []).filter((uid) => uid !== myUserId),
                }
              : c
          )
        );
      } else if (action === "archive") {
        await archiveConversation(itemId);
        setConversations((prev) => prev.filter((c) => c._id !== itemId));
        if (selectedChat === itemId) {
          setSelectedChat(null);
          setSearchParams({}, { replace: true });
        }
      } else if (action === "favorite") {
        const res = await favoriteConversation(itemId);
        setConversations((prev) =>
          prev.map((c) =>
            c._id === itemId
              ? {
                  ...c,
                  favorites: res.isFavorite
                    ? [...(c.favorites || []), myUserId]
                    : (c.favorites || []).filter((uid) => uid !== myUserId),
                }
              : c
          )
        );
      }
    } catch (err) {
      console.error(err);
      toast.error("Action failed");
    }
  };

  // Dynamic Theme Colors
  const themeCard = isDark ? "bg-[#2A1D16]" : "bg-[#FFFDF9]";
  const themeBorder = isDark ? "border-[#3D2A1F]" : "border-[#E3D8C8]";
  const themeTextPrimary = isDark ? "text-[#F5F0E8]" : "text-[#5A3A22]";
  const themeTextSecondary = isDark ? "text-[#D2C5B4]" : "text-[#8B5E3C]";

  // Filter Conversations list based on search and selected filter tab
  const filteredConversations = conversations.filter((conv) => {
    const otherUser = conv.participants.find((p) => p._id !== myUserId);
    if (!otherUser) return false;

    // Filter by tab type
    if (activeTab === "unread") {
      const isUnread = !conv.lastMessage?.isRead && String(conv.lastMessage?.sender?._id) !== String(myUserId);
      if (!isUnread) return false;
    }

    // Filter by search query
    return (
      otherUser.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (otherUser.name && otherUser.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  return (
    <div className={cn(
      "w-full h-full flex flex-col lg:flex-row gap-6 p-4 md:p-6 lg:p-8 overflow-hidden select-none transition-colors duration-300",
      isDark ? "bg-[#1F140E] text-[#F5F0E8]" : "bg-[#F8F4EE] text-[#5A3A22]"
    )}>
      
      {/* ========================================================
          1. MIDDLE COLUMN: Conversations List Card
          ======================================================== */}
      <Card variant="outline" className={cn(
        "w-full lg:w-[360px] shrink-0 rounded-[24px] border p-4 flex flex-col h-full min-h-0 overflow-hidden relative transition-colors duration-300",
        themeCard, themeBorder,
        selectedChat && "hidden lg:flex" // Hide on mobile if a chat is active
      )}>
        
        {/* Header */}
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
          <h2 className={cn("text-3xl font-extrabold font-serif tracking-tight transition-colors duration-300", themeTextPrimary)}>
            Messages
          </h2>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleOpenNewChat}
              className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center transition-colors border active:scale-95",
                isDark ? "bg-[#1F140E]/40 hover:bg-[#1F140E]/80 border-[#3D2A1F] text-[#D2C5B4]" : "bg-[#F2E8DC]/40 hover:bg-[#F2E8DC]/80 border-[#8B5E3C]/8 text-[#8B5E3C]"
              )}
              aria-label="New Message"
            >
              <Edit className="h-4.5 w-4.5 stroke-[2.2]" />
            </button>
            <button
              onClick={() => setShowEditChats(true)}
              className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center transition-colors border active:scale-95",
                isDark ? "bg-[#1F140E]/40 hover:bg-[#1F140E]/80 border-[#3D2A1F] text-[#D2C5B4]" : "bg-[#F2E8DC]/40 hover:bg-[#F2E8DC]/80 border-[#8B5E3C]/8 text-[#8B5E3C]"
              )}
              aria-label="Chat Settings"
            >
              <Settings className="h-4.5 w-4.5 stroke-[2.2]" />
            </button>
          </div>
        </div>

        {/* Search Conversations */}
        <div className="relative mb-3 flex-shrink-0">
          <Search className={cn("absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4", themeTextSecondary)} />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className={cn(
              "pl-9 h-10 border rounded-[16px] text-xs placeholder-[#8B5E3C]/50 outline-none w-full shadow-none focus-visible:ring-0 focus-visible:ring-offset-0",
              isDark ? "bg-[#1F140E]/40 border-[#3D2A1F]" : "bg-[#F2E8DC]/20 border-[#8B5E3C]/12"
            )}
          />
        </div>

        {/* Filters Tabs Row */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none flex-shrink-0">
          {[
            { id: "all" as const, label: "All" },
            { id: "unread" as const, label: "Unread" },
            { id: "groups" as const, label: "Groups" },
            { id: "requests" as const, label: "Requests" },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "py-1.5 px-3 rounded-full text-xs font-bold transition-all duration-200 border-none active:scale-95",
                  isActive
                    ? (isDark ? "bg-[#3D2A1F] text-[#F5F0E8]" : "bg-[#8B5E3C] text-white")
                    : (isDark ? "bg-transparent text-[#D2C5B4] hover:bg-[#3D2A1F]/30" : "bg-transparent text-[#8B5E3C] hover:bg-[#F2E8DC]/40")
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto pr-1 mt-3 space-y-2 scrollbar-none">
          {filteredConversations.length === 0 ? (
            <p className={cn("text-center py-8 text-xs font-semibold", themeTextSecondary)}>
              No conversations found
            </p>
          ) : (
            filteredConversations.map((conv) => {
              const otherUser = conv.participants.find(p => p._id !== myUserId);
              if (!otherUser) return null;

              const isSelected = selectedChat === conv._id;
              const hasUnread = !conv.lastMessage?.isRead && String(conv.lastMessage?.sender?._id) !== String(myUserId);

              return (
                <motion.div
                  key={conv._id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setSelectedChat(conv._id);
                    setSearchParams({ conversation: conv._id }, { replace: true });
                    setMessages([]);

                    setConversations(prev => prev.map(c =>
                      c._id === conv._id && c.lastMessage
                        ? { ...c, lastMessage: { ...c.lastMessage, isRead: true } }
                        : c
                    ));

                    window.dispatchEvent(new CustomEvent("messagesRead"));
                  }}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-[20px] transition-colors cursor-pointer group",
                    isSelected
                      ? (isDark ? "bg-[#3D2A1F]" : "bg-[#F2E8DC]/60")
                      : (isDark ? "hover:bg-[#3D2A1F]/30" : "hover:bg-[#F2E8DC]/20")
                  )}
                >
                  <div className="relative flex-shrink-0">
                    <img
                      src={resolveUrl(otherUser.avatar) || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"}
                      alt={otherUser.username}
                      className="h-11 w-11 rounded-full object-cover border border-[#8B5E3C]/12"
                    />
                    <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-[#FFFDF9]" />
                  </div>

                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between">
                      <p className={cn("text-xs font-extrabold truncate", themeTextPrimary)}>
                        {otherUser.username}
                      </p>
                      <span className={cn("text-[10px] font-semibold", themeTextSecondary)}>
                        {conv.lastMessage
                          ? new Date(conv.lastMessage.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                          : ""}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className={cn(
                        "text-[11px] truncate font-medium",
                        hasUnread ? "text-[#8B5E3C] font-extrabold" : "opacity-80"
                      )}>
                        {hasUnread && <span className="mr-1 font-bold">[new message]</span>}
                        {conv.lastMessage?.mediaUrl ? "[Image]" : conv.lastMessage?.text || "Start a conversation"}
                      </p>
                      {hasUnread && (
                        <span className="h-4.5 min-w-[18px] px-1.5 flex items-center justify-center text-[9px] font-bold rounded-full bg-[#8B5E3C] text-white">
                          1
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChatActionMenu
                      type="message"
                      itemId={conv._id}
                      itemName={otherUser.username}
                      onAction={handleChatMenuAction}
                      isMuted={conv.mutedBy?.includes(myUserId)}
                      isFavorite={conv.favorites?.includes(myUserId)}
                    />
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </Card>

      {/* ========================================================
          2. RIGHT COLUMN: Chat Pane Card
          ======================================================== */}
      <Card variant="outline" className={cn(
        "flex-1 rounded-[24px] border flex flex-col h-full min-h-0 overflow-hidden relative transition-colors duration-300",
        themeCard, themeBorder,
        !selectedChat && "hidden lg:flex" // Hide on mobile if no active chat
      )}>
        {selectedChat && selectedConversation ? (
          <>
            {/* Active Conversation Header */}
            <div className={cn("flex justify-between items-center p-3.5 border-b flex-shrink-0", themeBorder)}>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setSelectedChat(null);
                    setSearchParams({}, { replace: true });
                  }}
                  className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center transition-colors border active:scale-95 lg:hidden",
                    isDark ? "bg-[#1F140E]/40 hover:bg-[#1F140E]/80 border-[#3D2A1F] text-[#D2C5B4]" : "bg-[#F2E8DC]/40 hover:bg-[#F2E8DC]/80 border-[#8B5E3C]/8 text-[#8B5E3C]"
                  )}
                  aria-label="Back to conversations"
                >
                  <ArrowLeft className="h-4.5 w-4.5 stroke-[2.5]" />
                </button>

                {(() => {
                  const otherUser = selectedConversation.participants.find(p => p._id !== myUserId);
                  if (!otherUser) return null;

                  return (
                    <div className="flex items-center gap-2.5">
                      <div className="relative">
                        <img
                          src={resolveUrl(otherUser.avatar) || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"}
                          alt={otherUser.username}
                          className="h-9 w-9 rounded-full object-cover border border-[#8B5E3C]/12"
                        />
                        <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-[#FFFDF9]" />
                      </div>
                      <div className="text-left">
                        <Link to={`/profile/${otherUser.username}`} className={cn("text-sm font-extrabold hover:underline leading-none", themeTextPrimary)}>
                          {otherUser.username}
                        </Link>
                        <p className="text-[10px] text-green-500 font-bold leading-none mt-0.5">Online</p>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Call Buttons and Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => initiateCall("voice")}
                  className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center transition-colors border active:scale-95",
                    isDark ? "bg-[#1F140E]/40 hover:bg-[#1F140E]/80 border-[#3D2A1F] text-[#D2C5B4]" : "bg-[#F2E8DC]/40 hover:bg-[#F2E8DC]/80 border-[#8B5E3C]/8 text-[#8B5E3C]"
                  )}
                  aria-label="Audio Call"
                >
                  <Phone className="h-4.5 w-4.5 stroke-[2.2]" />
                </button>
                <button
                  onClick={() => initiateCall("video")}
                  className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center transition-colors border active:scale-95",
                    isDark ? "bg-[#1F140E]/40 hover:bg-[#1F140E]/80 border-[#3D2A1F] text-[#D2C5B4]" : "bg-[#F2E8DC]/40 hover:bg-[#F2E8DC]/80 border-[#8B5E3C]/8 text-[#8B5E3C]"
                  )}
                  aria-label="Video Call"
                >
                  <Video className="h-4.5 w-4.5 stroke-[2.2]" />
                </button>
                <button
                  className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center transition-colors border active:scale-95",
                    isDark ? "bg-[#1F140E]/40 hover:bg-[#1F140E]/80 border-[#3D2A1F] text-[#D2C5B4]" : "bg-[#F2E8DC]/40 hover:bg-[#F2E8DC]/80 border-[#8B5E3C]/8 text-[#8B5E3C]"
                  )}
                  aria-label="More actions"
                >
                  <MoreVertical className="h-4.5 w-4.5 stroke-[2.2]" />
                </button>
              </div>
            </div>

            {/* Chat Messages scroll area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-none bg-[#FFFDF9]/10">
              
              {/* Central mock date separator */}
              <div className="flex justify-center flex-shrink-0 my-2">
                <span className={cn(
                  "py-1 px-3.5 rounded-full text-[10px] font-bold border",
                  isDark ? "bg-[#3D2A1F] border-[#3D2A1F] text-[#D2C5B4]" : "bg-[#F2E8DC]/30 border-[#8B5E3C]/8 text-[#8B5E3C]"
                )}>
                  Today
                </span>
              </div>

              {messages.map((msg) => {
                const isMine = String(msg.sender._id) === String(myUserId);

                return (
                  <motion.div
                    key={msg._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "flex items-end gap-2.5",
                      isMine ? "justify-end" : "justify-start"
                    )}
                  >
                    {!isMine && (
                      <Link to={`/profile/${msg.sender.username}`} className="flex-shrink-0">
                        <img
                          src={resolveUrl(msg.sender.avatar) || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"}
                          alt={msg.sender.username}
                          className="h-8 w-8 rounded-full object-cover border border-[#8B5E3C]/12"
                        />
                      </Link>
                    )}

                    <div className={cn("max-w-[70%] flex flex-col", isMine ? "items-end" : "items-start")}>
                      <div className={cn(
                        "rounded-[20px] px-4 py-2.5 text-xs font-semibold leading-relaxed border transition-colors duration-300",
                        isMine
                          ? (isDark ? "bg-[#3D2A1F] border-[#3D2A1F] text-[#F5F0E8] rounded-br-sm" : "bg-[#8B5E3C] border-[#8B5E3C] text-[#FFFDF9] rounded-br-sm")
                          : (isDark ? "bg-[#2A1D16] border-[#3D2A1F] text-[#F5F0E8] rounded-bl-sm" : "bg-[#FFFDF9] border-[#E3D8C8] text-[#5A3A22] rounded-bl-sm")
                      )}>
                        {msg.mediaUrl && (
                          <img
                            src={resolveUrl(msg.mediaUrl)}
                            alt="Attachment"
                            className="max-w-xs max-h-48 object-cover rounded-lg mb-1.5 border border-transparent"
                          />
                        )}
                        {msg.text && <span className="inline">{msg.text}</span>}
                        
                        {/* Inline Time stamp and checkmarks */}
                        <span className={cn(
                          "text-[9px] font-bold ml-2 whitespace-nowrap inline-flex items-center gap-0.5 opacity-70",
                          isMine ? "text-white/80" : themeTextSecondary
                        )}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          {isMine && <CheckCheck className="h-3 w-3 stroke-[2.2] ml-0.5 text-white/90" />}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Image Preview Block */}
            {imagePreviewUrl && (
              <div className={cn("px-4 py-2 border-t flex items-center gap-3 relative flex-shrink-0", themeBorder, isDark ? "bg-[#3D2A1F]/30" : "bg-[#F2E8DC]/20")}>
                <img
                  src={imagePreviewUrl}
                  alt="Preview"
                  className={cn("h-16 w-16 object-cover rounded-lg border", themeBorder)}
                />
                <button
                  onClick={() => {
                    setSelectedImageFile(null);
                    setImagePreviewUrl(null);
                  }}
                  className="absolute top-1 left-16 bg-[#8B5E3C] text-white rounded-full h-4.5 w-4.5 flex items-center justify-center"
                  type="button"
                >
                  <X className="h-3 w-3" />
                </button>
                <p className={cn("text-xs font-semibold", themeTextSecondary)}>Image attachment selected.</p>
              </div>
            )}

            {/* Chat Input Bar */}
            <div className={cn("p-4 border-t flex items-center gap-3.5 flex-shrink-0 bg-transparent", themeBorder)}>
              
              {/* Pill Container */}
              <div className={cn(
                "flex-1 border rounded-full px-4.5 py-2.5 flex items-center gap-2.5 transition-colors duration-300",
                themeBorder, isDark ? "bg-[#1F140E]/40" : "bg-[#F2E8DC]/10"
              )}>
                <button type="button" className={cn("opacity-70 hover:opacity-100", themeTextSecondary)}>
                  <Smile className="h-5 w-5 stroke-[2]" />
                </button>
                
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Type a message..."
                  className={cn(
                    "flex-1 bg-transparent border-none outline-none focus:ring-0 text-sm placeholder-[#8B5E3C]/50 font-medium",
                    themeTextPrimary
                  )}
                  disabled={isSending}
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={cn("opacity-70 hover:opacity-100", themeTextSecondary)}
                >
                  <Image className="h-5 w-5 stroke-[2]" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageSelect}
                />

                <button type="button" className={cn("opacity-70 hover:opacity-100", themeTextSecondary)}>
                  <Mic className="h-5 w-5 stroke-[2]" />
                </button>
              </div>

              {/* Send Button */}
              <button
                onClick={handleSend}
                disabled={(!message.trim() && !selectedImageFile) || isSending}
                className={cn(
                  "w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 transition-all border-none active:scale-95 text-white disabled:opacity-40",
                  isDark ? "bg-[#3D2A1F] hover:bg-[#3D2A1F]/90" : "bg-[#8B5E3C] hover:bg-[#8B5E3C]/90"
                )}
              >
                {isSending ? (
                  <Loader2 className="h-4.5 w-4.5 animate-spin" />
                ) : (
                  <Send className="h-4.5 w-4.5 fill-white/10 stroke-[2]" />
                )}
              </button>

            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className={cn("h-24 w-24 rounded-full flex items-center justify-center mb-4 border border-dashed", themeBorder)}>
              <Send className={cn("h-10 w-10", themeTextSecondary)} />
            </div>
            <h3 className={cn("text-xl font-extrabold font-serif mb-2", themeTextPrimary)}>Your Messages</h3>
            <p className={cn("text-xs font-semibold mb-4 leading-normal max-w-[200px]", themeTextSecondary)}>
              Select a conversation or start a new dialogue with your followers.
            </p>
            <Button
              onClick={handleOpenNewChat}
              className={cn(
                "rounded-full px-6 font-bold text-xs text-white",
                isDark ? "bg-[#3D2A1F] hover:bg-[#3D2A1F]/90" : "bg-[#8B5E3C] hover:bg-[#8B5E3C]/95"
              )}
            >
              Send Message
            </Button>
          </div>
        )}
      </Card>

      {/* ========================================================
          3. EXTRA COMPONENT MODALS / OVERLAYS
          ======================================================== */}
      
      {/* NEW MESSAGE MODAL */}
      <Dialog open={isNewChatOpen} onOpenChange={setIsNewChatOpen}>
        <DialogContent className={cn("sm:max-w-md border rounded-[24px] p-5 shadow-none", themeCard, themeBorder)}>
          <DialogHeader className="border-b pb-2">
            <DialogTitle className={cn("text-lg font-serif font-extrabold", themeTextPrimary)}>New Message</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col max-h-[60vh] overflow-y-auto mt-2 space-y-1.5 scrollbar-none">
            {followers.length === 0 ? (
              <p className={cn("p-8 text-center text-xs font-semibold", themeTextSecondary)}>
                No followers found to message
              </p>
            ) : (
              followers.map((follower) => (
                <div
                  key={follower._id}
                  className={cn(
                    "flex items-center gap-3 p-2.5 rounded-[16px] cursor-pointer transition-colors",
                    isDark ? "hover:bg-[#3D2A1F]/40" : "hover:bg-[#F2E8DC]/30"
                  )}
                  onClick={() => handleSelectUser(follower._id)}
                >
                  <img
                    src={resolveUrl(follower.avatar) || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"}
                    alt={follower.username}
                    className="h-10 w-10 rounded-full object-cover border border-[#8B5E3C]/12"
                  />
                  <div className="flex-1 min-w-0 text-left">
                    <p className={cn("text-xs font-extrabold truncate", themeTextPrimary)}>{follower.username}</p>
                    <p className={cn("text-[10px] font-semibold truncate", themeTextSecondary)}>@{follower.username}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* EDIT CHATS SHEET (BATCH ACTIONS) */}
      <ChatEditSheet
        open={showEditChats}
        onOpenChange={setShowEditChats}
        chats={conversations.map((c) => {
          const otherUser = c.participants.find((p) => p._id !== myUserId);
          return {
            id: c._id,
            user: {
              username: otherUser?.username || "Unknown",
              avatar: otherUser?.avatar || "",
            },
          };
        })}
        onActionTriggered={handleBatchChatAction}
      />

      {/* CALL OVERLAY (voice & video) */}
      {callOpen && (
        <CallOverlay
          open={callOpen}
          onClose={() => {
            setCallOpen(false);
            setIncomingCall(null);
          }}
          recipientId={
            incomingCall?.callerId ||
            selectedConversation?.participants.find((p) => p._id !== myUserId)?._id ||
            ""
          }
          recipientName={
            incomingCall?.callerName ||
            selectedConversation?.participants.find((p) => p._id !== myUserId)?.username ||
            ""
          }
          recipientAvatar={
            incomingCall?.callerAvatar ||
            selectedConversation?.participants.find((p) => p._id !== myUserId)?.avatar ||
            ""
          }
          callType={callType}
          incomingCallData={incomingCall}
        />
      )}
    </div>
  );
}
