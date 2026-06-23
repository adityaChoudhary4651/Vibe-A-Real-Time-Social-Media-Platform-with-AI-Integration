import { useState, useEffect, useRef } from "react";
import { useOutletContext, Link } from "react-router-dom";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Users, Settings, Send, MoreVertical, Loader2, ArrowLeft, Image as ImageIcon } from "lucide-react";
import { motion } from "framer-motion";
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

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImageFile(file);
      setImagePreviewUrl(URL.createObjectURL(file));
    }
  };

  const isInChat = selectedCommunityId !== null;

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

  return (
    <div className={cn(
      "flex flex-col w-full max-w-full overflow-hidden",
      isInChat
        ? "fixed inset-0 z-50 bg-background"
        : "h-[calc(100vh-8rem)] lg:h-screen"
    )}>
      <div className="flex flex-1 h-full overflow-hidden">
        {/* Communities list */}
        <div className={cn(
          "w-full lg:w-80 xl:w-96 border-r border-border flex flex-col h-full",
          selectedCommunityId && "hidden lg:flex"
        )}>
          <div className="p-4 border-b border-border space-y-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Communities</h2>
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-white text-black hover:bg-white/90 rounded-full shadow-glow-sm h-9 px-4 text-xs font-bold transition-all"
              >
                <Plus className="h-4 w-4 mr-1" />
                New
              </Button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search communities"
                className="pl-10 h-10"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary" /></div>
            ) : communities.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm flex flex-col items-center gap-2">
                <Users className="h-8 w-8 opacity-20" />
                <p>No communities found</p>
              </div>
            ) : communities.map((community) => (
              <motion.div
                key={community._id}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "w-full flex items-center gap-3 p-4 hover:bg-secondary/50 transition-colors cursor-pointer group",
                  selectedCommunityId === community._id && "bg-secondary"
                )}
                onClick={() => setSelectedCommunityId(community._id)}
              >
                <Avatar className="h-14 w-14">
                  <AvatarImage src={resolveUrl(community.avatar)} />
                  <AvatarFallback className="text-lg">
                    {community.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold truncate">{community.name}</p>
                    {community.isJoined && (
                      <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-medium">Joined</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{community.description}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    <Users className="h-3 w-3" />
                    <span>{(community.memberCount || 0).toLocaleString()} members</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Community view */}
        <div className={cn(
          "flex-1 flex flex-col h-full bg-background",
          !selectedCommunityId && "hidden lg:flex"
        )}>
          {selectedCommunityId && selectedCommunity ? (
            <>
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setSelectedCommunityId(null)}
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={resolveUrl(selectedCommunity.avatar)} />
                    <AvatarFallback>{selectedCommunity.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{selectedCommunity.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(selectedCommunity.memberCount || 0).toLocaleString()} members
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant={selectedCommunity.isJoined ? "secondary" : "default"}
                    size="sm"
                    onClick={() => toggleJoin(selectedCommunity._id)}
                    className="rounded-full"
                  >
                    {selectedCommunity.isJoined ? "Joined" : "Join"}
                  </Button>
                  <div className="flex items-center gap-2">
                    {selectedCommunity.creator?._id === user?.id && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setShowSettingsModal(true)}
                      >
                        <Settings className="h-5 w-5" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-2 opacity-50">
                    <Send className="h-8 w-8" />
                    <p className="text-sm">Start the conversation</p>
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
                          "flex items-end gap-2",
                          isMine ? "justify-end" : "justify-start"
                        )}
                      >
                        {!isMine && (
                          <Link to={`/profile/${msg.sender?.username}`}>
                            <Avatar className="h-8 w-8 mb-1 hover:opacity-85 transition-opacity">
                              <AvatarImage src={resolveUrl(msg.sender?.avatar)} />
                              <AvatarFallback className="text-[10px]">
                                {msg.sender?.username?.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          </Link>
                        )}

                        <div className={cn("max-w-[75%] flex flex-col", isMine ? "items-end" : "items-start")}>
                          {!isMine && (
                            <Link to={`/profile/${msg.sender?.username}`}>
                              <span className="text-[10px] text-muted-foreground ml-1 mb-1 hover:underline">
                                {msg.sender?.username}
                              </span>
                            </Link>
                          )}

                          <div
                            className={cn(
                              "rounded-2xl px-4 py-2.5 w-fit",
                              isMine
                                ? "bg-primary text-primary-foreground rounded-br-sm"
                                : "bg-secondary rounded-bl-sm"
                            )}
                          >
                            {msg.mediaUrl && (
                              <img
                                src={resolveUrl(msg.mediaUrl)}
                                alt="Attachment"
                                className="max-w-xs max-h-48 object-cover rounded-lg mb-1"
                              />
                            )}
                            {msg.text && <p className="text-sm">{msg.text}</p>}
                            <p className="text-[10px] mt-1 opacity-70">
                              {new Date(msg.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Image Preview Area */}
              {imagePreviewUrl && (
                <div className="px-4 py-2 border-t border-border bg-secondary/20 flex items-center gap-3 relative flex-shrink-0">
                  <img
                    src={imagePreviewUrl}
                    alt="Preview"
                    className="h-16 w-16 object-cover rounded-lg border border-border"
                  />
                  <button
                    onClick={() => {
                      setSelectedImageFile(null);
                      setImagePreviewUrl(null);
                    }}
                    className="absolute top-1 left-16 bg-destructive text-destructive-foreground rounded-full h-4 w-4 flex items-center justify-center shadow-sm"
                    type="button"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  <p className="text-xs text-muted-foreground">Image selected. Press send to upload.</p>
                </div>
              )}

              {/* Input */}
              <div className="p-4 border-t border-border">
                {selectedCommunity.isJoined ? (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="flex-shrink-0"
                      onClick={() => fileInputRef.current?.click()}
                      type="button"
                    >
                      <ImageIcon className="h-5 w-5" />
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageSelect}
                    />
                    <Input
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder="Message..."
                      className="flex-1 h-10"
                      disabled={isSending}
                    />
                    <Button
                      size="icon"
                      className="rounded-full h-10 w-10 flex-shrink-0"
                      disabled={(!message.trim() && !selectedImageFile) || isSending}
                      onClick={handleSendMessage}
                    >
                      {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                    </Button>
                  </div>
                ) : (
                  <div className="text-center p-2 text-sm text-muted-foreground">
                    Join this community to participate in the chat
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="h-24 w-24 rounded-full bg-secondary flex items-center justify-center mb-4">
                <Users className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Vibe Communities</h3>
              <p className="text-muted-foreground mb-6 max-w-sm">
                Discover groups that match your interests or create your own hub for shared thoughts.
              </p>
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-white text-black hover:bg-white/90 rounded-full shadow-glow-lg px-8 h-12 text-base font-bold transition-all"
              >
                <Plus className="h-5 w-5 mr-2" />
                Start New Community
              </Button>
            </div>
          )}
        </div>
      </div>

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