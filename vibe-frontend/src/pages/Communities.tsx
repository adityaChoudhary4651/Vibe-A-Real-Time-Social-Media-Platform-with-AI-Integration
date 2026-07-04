import { useState, useEffect, useRef } from "react";
import { useOutletContext, Link } from "react-router-dom";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Plus,
  Search,
  Users,
  Settings,
  Send,
  MoreVertical,
  Loader2,
  ArrowLeft,
  Image as ImageIcon,
  Smile,
  Mic,
  X,
  CheckCheck
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { CreateCommunityModal } from "@/components/shared/CreateCommunityModal";
import { CommunitySettingsModal } from "@/components/shared/CommunitySettingsModal";
import {
  fetchCommunities,
  fetchCommunityMessages,
  sendCommunityMessage,
  toggleCommunityJoin,
  createCommunity
} from "@/api/community";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useSocket } from "@/contexts/SocketContext";
import { resolveUrl } from "../config";

type LayoutOutletContext = {
  setHideBottomNav?: (hide: boolean) => void;
};

interface Community {
  _id: string;
  name: string;
  description: string;
  memberCount: number;
  avatar: string;
  isJoined: boolean;
  category: string;
  members: string[];
  creator: {
    _id: string;
    username: string;
    avatar?: string;
  };
}

export default function Communities() {
  const { setHideBottomNav } = useOutletContext<LayoutOutletContext>();
  const { user } = useAuth();
  const { socket } = useSocket();
  const [selectedCommunityId, setSelectedCommunityId] = useState<string | null>(null);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Image attachment state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  // Dark Mode state tracking
  const isDarkState = () => localStorage.getItem("vibe_theme") === "dark";
  const [isDark, setIsDark] = useState(isDarkState);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImageFile(file);
      setImagePreviewUrl(URL.createObjectURL(file));
    }
  };

  const isInChat = selectedCommunityId !== null;

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
    setHideBottomNav?.(isInChat);
    return () => setHideBottomNav?.(false);
  }, [isInChat, setHideBottomNav]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    loadCommunities();
  }, [searchQuery]);

  useEffect(() => {
    if (selectedCommunityId && socket) {
      loadMessages();

      // Join community room
      socket.emit("join_community", selectedCommunityId);

      // Listen for messages
      const handleReceiveCommunityMessage = (msg: any) => {
        setMessages((prev) => {
          if (prev.find(m => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
      };

      socket.on("receive_community_message", handleReceiveCommunityMessage);

      return () => {
        socket.off("receive_community_message", handleReceiveCommunityMessage);
      };
    }
  }, [selectedCommunityId, socket]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadCommunities = async () => {
    try {
      const data = await fetchCommunities(searchQuery);
      const transformed = data.map((c: any) => ({
        ...c,
        memberCount: c.members.length,
        isJoined: c.members.includes(user?.id)
      }));
      setCommunities(transformed);
    } catch (err) {
      toast.error("Failed to load communities");
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    if (!selectedCommunityId) return;
    try {
      const data = await fetchCommunityMessages(selectedCommunityId);
      setMessages(data);
    } catch (err) {
      console.error("Message load failed");
    }
  };

  const toggleJoin = async (id: string) => {
    try {
      const result = await toggleCommunityJoin(id);
      setCommunities(prev => prev.map(c =>
        c._id === id ? { ...c, isJoined: result.isJoined, memberCount: result.memberCount } : c
      ));
      if (result.isJoined) {
        toast.success("Joined community!");
      } else {
        toast.info("Left community");
      }
    } catch (err) {
      toast.error("Action failed");
    }
  };

  const handleSendMessage = async () => {
    if ((!message.trim() && !selectedImageFile) || !selectedCommunityId || isSending) return;
    try {
      setIsSending(true);
      const newMsg = await sendCommunityMessage(selectedCommunityId, message, selectedImageFile || undefined);
      setMessages(prev => {
        if (prev.find(m => m._id === newMsg._id)) return prev;
        return [...prev, newMsg];
      });
      setMessage("");
      setSelectedImageFile(null);
      setImagePreviewUrl(null);
    } catch (err) {
      toast.error("Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  const handleCreateCommunity = async (data: { name: string; description: string; image?: string }) => {
    try {
      const newComm = await createCommunity({
        name: data.name,
        description: data.description,
        avatar: data.image
      });
      setCommunities(prev => [newComm, ...prev]);
      setSelectedCommunityId(newComm._id);
      toast.success("Community created!");
    } catch (err) {
      toast.error("Creation failed");
    }
  };

  const selectedCommunity = communities.find((c) => c._id === selectedCommunityId);

  // Dynamic Theme Colors
  const themeCard = isDark ? "bg-[#2A1D16]" : "bg-[#FFFDF9]";
  const themeBorder = isDark ? "border-[#3D2A1F]" : "border-[#E3D8C8]";
  const themeTextPrimary = isDark ? "text-[#F5F0E8]" : "text-[#5A3A22]";
  const themeTextSecondary = isDark ? "text-[#D2C5B4]" : "text-[#8B5E3C]";

  return (
    <div className={cn(
      "w-full h-full flex flex-col lg:flex-row gap-6 p-4 md:p-6 lg:p-8 overflow-hidden select-none transition-colors duration-300",
      isDark ? "bg-[#1F140E] text-[#F5F0E8]" : "bg-[#F8F4EE] text-[#5A3A22]"
    )}>
      
      {/* ========================================================
          1. LEFT COLUMN: Communities list card
          ======================================================== */}
      <Card variant="outline" className={cn(
        "w-full lg:w-[360px] shrink-0 rounded-[24px] border p-4 flex flex-col h-full min-h-0 overflow-hidden relative transition-colors duration-300",
        themeCard, themeBorder,
        selectedCommunityId && "hidden lg:flex" // Hide on mobile when chat is active
      )}>
        
        {/* Header */}
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
          <h2 className={cn("text-3xl font-extrabold font-serif tracking-tight transition-colors duration-300", themeTextPrimary)}>
            Communities
          </h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className={cn(
              "text-xs font-bold py-2 px-4 rounded-full border transition-all active:scale-95 flex items-center gap-1.5",
              isDark
                ? "bg-[#3D2A1F] border-[#3D2A1F] text-[#F5F0E8]"
                : "bg-[#FFFDF9] border-[#8B5E3C]/15 text-[#8B5E3C] hover:bg-[#8B5E3C] hover:text-[#FFFDF9] hover:border-[#8B5E3C]"
            )}
          >
            <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
            New
          </button>
        </div>

        {/* Search Input */}
        <div className="relative mb-3 flex-shrink-0">
          <Search className={cn("absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4", themeTextSecondary)} />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search communities..."
            className={cn(
              "pl-9 h-10 border rounded-[16px] text-xs placeholder-[#8B5E3C]/50 outline-none w-full shadow-none focus-visible:ring-0 focus-visible:ring-offset-0",
              isDark ? "bg-[#1F140E]/40 border-[#3D2A1F]" : "bg-[#F2E8DC]/20 border-[#8B5E3C]/12"
            )}
          />
        </div>

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto pr-1 mt-2 space-y-2 scrollbar-none">
          {loading ? (
            <div className="flex justify-center p-8"><Loader2 className={cn("animate-spin", themeTextSecondary)} /></div>
          ) : communities.length === 0 ? (
            <div className={cn("p-8 text-center text-xs font-bold flex flex-col items-center gap-2", themeTextSecondary)}>
              <Users className="h-8 w-8 opacity-20" />
              <p>No communities found</p>
            </div>
          ) : (
            communities.map((community) => {
              const isSelected = selectedCommunityId === community._id;
              return (
                <motion.div
                  key={community._id}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-[20px] transition-colors cursor-pointer group",
                    isSelected
                      ? (isDark ? "bg-[#3D2A1F]" : "bg-[#F2E8DC]/60")
                      : (isDark ? "hover:bg-[#3D2A1F]/30" : "hover:bg-[#F2E8DC]/20")
                  )}
                  onClick={() => setSelectedCommunityId(community._id)}
                >
                  <Avatar className="h-11 w-11 border border-[#8B5E3C]/10 flex-shrink-0">
                    <AvatarImage src={resolveUrl(community.avatar)} />
                    <AvatarFallback className={themeTextSecondary}>
                      {community.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between">
                      <p className={cn("text-xs font-extrabold truncate", themeTextPrimary)}>{community.name}</p>
                      {community.isJoined && (
                        <span className={cn(
                          "text-[9px] font-bold px-2 py-0.5 rounded-full border",
                          isDark ? "bg-[#3D2A1F] border-[#3D2A1F] text-[#D2C5B4]" : "bg-[#F2E8DC]/40 border-[#8B5E3C]/10 text-[#8B5E3C]"
                        )}>
                          Joined
                        </span>
                      )}
                    </div>
                    <p className={cn("text-[11px] truncate mt-0.5 leading-tight opacity-80", themeTextSecondary)}>{community.description}</p>
                    <div className={cn("flex items-center gap-1 text-[10px] font-bold mt-1.5", themeTextSecondary)}>
                      <Users className="h-3 w-3 stroke-[2.2]" />
                      <span>{(community.memberCount || 0).toLocaleString()} members</span>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </Card>

      {/* ========================================================
          2. RIGHT COLUMN: Chat view card
          ======================================================== */}
      <Card variant="outline" className={cn(
        "flex-1 rounded-[24px] border flex flex-col h-full min-h-0 overflow-hidden relative transition-colors duration-300",
        themeCard, themeBorder,
        !selectedCommunityId && "hidden lg:flex" // Hide on mobile if no active community
      )}>
        {selectedCommunityId && selectedCommunity ? (
          <>
            {/* Chat Header */}
            <div className={cn("flex justify-between items-center p-3.5 border-b flex-shrink-0", themeBorder)}>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedCommunityId(null)}
                  className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center transition-colors border active:scale-95 lg:hidden",
                    isDark ? "bg-[#1F140E]/40 hover:bg-[#1F140E]/80 border-[#3D2A1F] text-[#D2C5B4]" : "bg-[#F2E8DC]/40 hover:bg-[#F2E8DC]/80 border-[#8B5E3C]/8 text-[#8B5E3C]"
                  )}
                  aria-label="Back to communities list"
                >
                  <ArrowLeft className="h-4.5 w-4.5 stroke-[2.5]" />
                </button>

                <Avatar className="h-9 w-9 border border-[#8B5E3C]/10 flex-shrink-0">
                  <AvatarImage src={resolveUrl(selectedCommunity.avatar)} />
                  <AvatarFallback>{selectedCommunity.name.charAt(0)}</AvatarFallback>
                </Avatar>
                
                <div className="text-left">
                  <p className={cn("text-sm font-extrabold leading-none", themeTextPrimary)}>{selectedCommunity.name}</p>
                  <p className={cn("text-[10px] font-bold leading-none mt-1", themeTextSecondary)}>
                    {(selectedCommunity.memberCount || 0).toLocaleString()} members
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleJoin(selectedCommunity._id)}
                  className={cn(
                    "text-xs font-bold py-1.5 px-4 rounded-full border transition-all active:scale-95",
                    selectedCommunity.isJoined
                      ? (isDark ? "bg-[#3D2A1F] border-[#3D2A1F] text-[#F5F0E8]" : "bg-[#F2E8DC]/50 border-[#8B5E3C]/15 text-[#8B5E3C]")
                      : (isDark ? "bg-[#F5F0E8] border-none text-[#1F140E] hover:bg-[#F5F0E8]/90" : "bg-[#8B5E3C] border-none text-white hover:bg-[#8B5E3C]/90")
                  )}
                >
                  {selectedCommunity.isJoined ? "Joined" : "Join"}
                </button>

                {selectedCommunity.creator?._id === user?.id && (
                  <button
                    onClick={() => setShowSettingsModal(true)}
                    className={cn(
                      "w-9 h-9 rounded-full flex items-center justify-center transition-colors border active:scale-95",
                      isDark ? "bg-[#1F140E]/40 hover:bg-[#1F140E]/80 border-[#3D2A1F] text-[#D2C5B4]" : "bg-[#F2E8DC]/40 hover:bg-[#F2E8DC]/80 border-[#8B5E3C]/8 text-[#8B5E3C]"
                    )}
                    aria-label="Community Settings"
                  >
                    <Settings className="h-4.5 w-4.5 stroke-[2.2]" />
                  </button>
                )}
              </div>
            </div>

            {/* Message Pane */}
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

              {messages.length === 0 ? (
                <div className={cn("h-full flex flex-col items-center justify-center gap-2 opacity-50", themeTextSecondary)}>
                  <Send className="h-8 w-8 stroke-[2]" />
                  <p className="text-xs font-bold">Start the conversation</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMine = String(msg.sender?._id) === String(user?.id);
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
                        <Link to={`/profile/${msg.sender?.username}`} className="flex-shrink-0">
                          <Avatar className="h-8 w-8 mb-1 border border-[#8B5E3C]/10 flex-shrink-0 hover:opacity-85 transition-opacity">
                            <AvatarImage src={resolveUrl(msg.sender?.avatar)} />
                            <AvatarFallback>{msg.sender?.username?.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                        </Link>
                      )}

                      <div className={cn("max-w-[70%] flex flex-col", isMine ? "items-end" : "items-start")}>
                        {!isMine && (
                          <Link to={`/profile/${msg.sender?.username}`} className="hover:underline">
                            <span className={cn("text-[9px] font-bold ml-1.5 mb-1 block", themeTextSecondary)}>
                              {msg.sender?.username}
                            </span>
                          </Link>
                        )}

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
                })
              )}
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
              {selectedCommunity.isJoined ? (
                <>
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
                          handleSendMessage();
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
                      <ImageIcon className="h-5 w-5 stroke-[2]" />
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
                    onClick={handleSendMessage}
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
                </>
              ) : (
                <div className={cn("text-center w-full py-2.5 text-xs font-bold block", themeTextSecondary)}>
                  Join this community to participate in the chat
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className={cn("h-24 w-24 rounded-full flex items-center justify-center mb-4 border border-dashed", themeBorder)}>
              <Users className={cn("h-10 w-10 text-muted-foreground", themeTextSecondary)} />
            </div>
            <h3 className={cn("text-xl font-extrabold font-serif mb-2", themeTextPrimary)}>Vibe Communities</h3>
            <p className={cn("text-xs font-semibold mb-6 leading-normal max-w-xs", themeTextSecondary)}>
              Discover groups that match your interests or create your own hub for shared thoughts.
            </p>
            <Button
              onClick={() => setShowCreateModal(true)}
              className={cn(
                "rounded-full px-6 font-bold text-xs text-white",
                isDark ? "bg-[#3D2A1F] hover:bg-[#3D2A1F]/90" : "bg-[#8B5E3C] hover:bg-[#8B5E3C]/95"
              )}
            >
              Start New Community
            </Button>
          </div>
        )}
      </Card>

      <CreateCommunityModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onCreate={handleCreateCommunity}
      />

      {selectedCommunity && (
        <CommunitySettingsModal
          open={showSettingsModal}
          onOpenChange={setShowSettingsModal}
          community={selectedCommunity}
          onUpdate={(updated) => {
            setCommunities(prev => prev.map(c =>
              c._id === updated._id ? { ...c, ...updated } : c
            ));
          }}
        />
      )}
    </div>
  );
}