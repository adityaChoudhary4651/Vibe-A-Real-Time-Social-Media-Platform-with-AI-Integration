import { useEffect, useState, useRef } from "react";
import { useOutletContext, useSearchParams, Link } from "react-router-dom";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
} from "lucide-react";
import { motion } from "framer-motion";
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
};

/* =====================
   COMPONENT
 ===================== */

export default function Messages() {
  const { setHideBottomNav } = useOutletContext<LayoutOutletContext>();
  const { user } = useAuth();
  const { socket } = useSocket();

  const myUserId = user?.id ?? "";

  const [searchParams, setSearchParams] = useSearchParams();
  const conversationParam = searchParams.get("conversation");

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(conversationParam);
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState("");
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [showEditChats, setShowEditChats] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [followers, setFollowers] = useState<ChatUser[]>([]);
  const [isSending, setIsSending] = useState(false);

  // Image attachment state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  // Call connection states
  const [callOpen, setCallOpen] = useState(false);
  const [callType, setCallType] = useState<"voice" | "video">("voice");
  const [incomingCall, setIncomingCall] = useState<any | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const selectedConversation = conversations.find(
    (c) => c._id === selectedChat
  );

  const isInChat = selectedChat !== null;

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
      // If caller is already in another call, reject the incoming call request
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

  /* =====================
     RENDER
  ===================== */

  return (
    <div
      className={cn(
        "flex flex-col w-full max-w-full overflow-hidden",
        isInChat
          ? "fixed inset-0 z-50 bg-background"
          : "h-[calc(100vh-8rem)] lg:h-screen"
      )}
    >
      <div className="flex flex-1 h-full overflow-hidden">
        {/* Conversations list */}
        <div
          className={cn(
            "w-full lg:w-80 xl:w-96 border-r border-border flex flex-col h-full",
            selectedChat && "hidden lg:flex"
          )}
        >
          <div className="p-4 border-b border-border space-y-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Messages</h2>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon-sm" onClick={() => setShowEditChats(true)}>
                  <Settings className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon-sm" onClick={handleOpenNewChat}>
                  <Edit className="h-5 w-5" />
                </Button>
              </div>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search messages"
                className="pl-10 h-10"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {conversations.filter((conv) => {
              const otherUser = conv.participants.find((p) => p._id !== myUserId);
              if (!otherUser) return false;
              return (
                otherUser.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (otherUser.name && otherUser.name.toLowerCase().includes(searchQuery.toLowerCase()))
              );
            }).map((conv) => {
              const otherUser = conv.participants.find(
                (p) => p._id !== myUserId
              );

              if (!otherUser) return null;

              return (
                <motion.div
                  key={conv._id}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    "w-full flex items-center gap-3 p-4 hover:bg-secondary/50 transition-colors group cursor-pointer",
                    selectedChat === conv._id && "bg-secondary"
                  )}
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
                >
                  <Avatar className="h-14 w-14">
                    <AvatarImage src={otherUser.avatar} />
                    <AvatarFallback>
                      {otherUser.username.charAt(0)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold truncate">
                        {otherUser.username}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {conv.lastMessage
                          ? new Date(conv.lastMessage.createdAt).toLocaleTimeString(
                            [],
                            { hour: "2-digit", minute: "2-digit" }
                          )
                          : ""}
                      </span>
                    </div>

                    <p className={cn(
                      "text-sm truncate",
                      !conv.lastMessage?.isRead && String(conv.lastMessage?.sender?._id) !== String(myUserId)
                        ? "text-primary font-bold"
                        : "text-muted-foreground"
                    )}>
                      {!conv.lastMessage?.isRead && String(conv.lastMessage?.sender?._id) !== String(myUserId) && (
                        <span className="mr-1">[new message]</span>
                      )}
                      {conv.lastMessage?.mediaUrl ? "[Image Attachment]" : conv.lastMessage?.text || "Start a conversation"}
                    </p>
                  </div>

                  <ChatActionMenu
                    type="message"
                    itemId={conv._id}
                    itemName={otherUser.username}
                    onAction={handleChatMenuAction}
                    isMuted={conv.mutedBy?.includes(myUserId)}
                    isFavorite={conv.favorites?.includes(myUserId)}
                  />
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Chat view */}
        <div
          className={cn(
            "flex-1 flex flex-col h-full bg-background",
            !selectedChat && "hidden lg:flex"
          )}
        >
          {selectedChat && selectedConversation ? (
            <>
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setSelectedChat(null)}
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>

                  {(() => {
                    const otherUser = selectedConversation.participants.find(
                      (p) => p._id !== myUserId
                    );
                    return otherUser ? (
                      <Link
                        to={`/profile/${otherUser.username}`}
                        className="font-semibold hover:underline cursor-pointer"
                      >
                        {otherUser.username}
                      </Link>
                    ) : null;
                  })()}
                </div>

                {/* CALL BUTTONS */}
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon-sm" onClick={() => initiateCall("voice")}>
                    <Phone className="h-5 w-5 text-muted-foreground hover:text-foreground" />
                  </Button>
                  <Button variant="ghost" size="icon-sm" onClick={() => initiateCall("video")}>
                    <Video className="h-5 w-5 text-muted-foreground hover:text-foreground" />
                  </Button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => {
                  const isMine = String(msg.sender._id) === String(myUserId);

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
                        <Link to={`/profile/${msg.sender.username}`}>
                          <Avatar className="h-8 w-8 mb-1 hover:opacity-85 transition-opacity">
                            <AvatarImage src={msg.sender.avatar} />
                            <AvatarFallback>
                              {msg.sender.username?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                        </Link>
                      )}

                      <div className={cn("max-w-[75%] flex flex-col", isMine ? "items-end" : "items-start")}>
                        {!isMine && (
                          <Link to={`/profile/${msg.sender.username}`}>
                            <span className="text-xs text-muted-foreground ml-1 mb-1 hover:underline cursor-pointer">
                              {msg.sender.username}
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
                              src={msg.mediaUrl}
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
                })}
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
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => fileInputRef.current?.click()}
                    type="button"
                  >
                    <Image className="h-5 w-5" />
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
                        handleSend();
                      }
                    }}
                    placeholder="Message..."
                    disabled={isSending}
                  />

                  <Button
                    size="icon"
                    className="rounded-full"
                    onClick={handleSend}
                    disabled={(!message.trim() && !selectedImageFile) || isSending}
                  >
                    <Send className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="h-24 w-24 rounded-full bg-secondary flex items-center justify-center mb-4">
                <Send className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Your Messages</h3>
              <p className="text-muted-foreground mb-4">
                Send private messages to friends
              </p>
              <Button onClick={handleOpenNewChat}>Send Message</Button>
            </div>
          )}
        </div>
      </div>

      {/* NEW MESSAGE MODAL */}
      <Dialog open={isNewChatOpen} onOpenChange={setIsNewChatOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Message</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col max-h-[60vh] overflow-y-auto">
            {followers.length === 0 ? (
              <p className="p-8 text-center text-muted-foreground">
                No followers found to message
              </p>
            ) : (
              followers.map((follower) => (
                <div
                  key={follower._id}
                  className="flex items-center gap-3 p-3 hover:bg-secondary cursor-pointer transition-colors"
                  onClick={() => handleSelectUser(follower._id)}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={follower.avatar} />
                    <AvatarFallback>{follower.username.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{follower.username}</p>
                    <p className="text-sm text-muted-foreground truncate">{follower.username}</p>
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
