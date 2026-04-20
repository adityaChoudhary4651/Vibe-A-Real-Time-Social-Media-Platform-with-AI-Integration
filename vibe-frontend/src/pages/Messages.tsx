import { useEffect, useState, useRef } from "react";
import { useOutletContext, useSearchParams } from "react-router-dom";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search,
  Edit,
  Phone,
  Video,
  MoreVertical,
  Send,
  Image,
  ArrowLeft,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ChatActionMenu } from "@/components/shared/ChatActionMenu";
import { getConversations, createConversation } from "@/api/conversations";
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

  /** ✅ SINGLE SOURCE OF TRUTH */
  const myUserId = user?.id ?? "";

  const [searchParams, setSearchParams] = useSearchParams();
  const conversationParam = searchParams.get("conversation");

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(conversationParam);
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState("");
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [followers, setFollowers] = useState<ChatUser[]>([]);

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
    // Update sidebar for messages received while NOT in the chat
    if (!socket) return;

    const handleGlobalMessage = (msg: Message) => {
      // Find which conversation this message belongs to
      // The backend message object usually has transitionId or similar
      // In this app, it seems Message has 'conversation' field (ID)
      
      setConversations((prev) => {
        const convIndex = prev.findIndex(c => c._id === (msg as any).conversation);
        if (convIndex === -1) return prev; // Should handle new conversations too but let's keep it simple

        const newConversations = [...prev];
        newConversations[convIndex] = {
          ...newConversations[convIndex],
          lastMessage: msg
        };
        
        // Move to top if it's a new message
        const [movedConv] = newConversations.splice(convIndex, 1);
        return [movedConv, ...newConversations];
      });
    };

    socket.on("receive_message", handleGlobalMessage);
    return () => {
      socket.off("receive_message", handleGlobalMessage);
    };
  }, [socket]);

  useEffect(() => {
    if (!selectedChat || !socket) return;

    // Join the conversation room
    socket.emit("join_conversation", selectedChat);

    getMessages(selectedChat)
      .then((msgs) => {
        setMessages(msgs);

        // Mark as read in the sidebar list too
        setConversations(prev => prev.map(c =>
          c._id === selectedChat && c.lastMessage
            ? { ...c, lastMessage: { ...c.lastMessage, isRead: true } }
            : c
        ));

        // Sync notification dots
        window.dispatchEvent(new CustomEvent("messagesRead"));
      })
      .catch(console.error);

    // Listen for new messages
    const handleReceiveMessage = (msg: Message) => {
      if (String(msg._id) === String(selectedChat)) { // Check if it belongs to current chat
           // Actually the server sends it to the room, but good to double check if needed.
           // However, msg.conversation might be what we need to check if we were listening globally.
           // Since we joined a room, we only get messages for THIS room.
      }
      
      setMessages((prev) => {
        // Avoid duplicates if we sent it and already added it
        if (prev.find(m => m._id === msg._id)) return prev;
        return [...prev, msg];
      });

      // Update sidebar
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
    if (!message.trim() || !selectedChat) return;

    try {
      const msg = await sendMessage(selectedChat, message);

      setMessages((prev) => [...prev, msg]);
      setMessage("");

      setConversations((prev) =>
        prev.map((c) =>
          c._id === selectedChat ? { ...c, lastMessage: msg } : c
        )
      );
    } catch (err) {
      console.error(err);
    }
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
              <Button variant="ghost" size="icon-sm" onClick={handleOpenNewChat}>
                <Edit className="h-5 w-5" />
              </Button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search messages" className="pl-10 h-10" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {conversations.map((conv) => {
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

                    // Locally mark as read to clear highlight immediately
                    setConversations(prev => prev.map(c =>
                      c._id === conv._id && c.lastMessage
                        ? { ...c, lastMessage: { ...c.lastMessage, isRead: true } }
                        : c
                    ));

                    // Dispatch event to update notification dots in Navigation
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
                        <span className="mr-1">[sent u message]</span>
                      )}
                      {conv.lastMessage?.text || "Start a conversation"}
                    </p>
                  </div>

                  <ChatActionMenu
                    type="message"
                    itemId={conv._id}
                    itemName={otherUser.username}
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

                  <p className="font-semibold">
                    {
                      selectedConversation.participants.find(
                        (p) => p._id !== myUserId
                      )?.username
                    }
                  </p>
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
                        <Avatar className="h-8 w-8 mb-1">
                          <AvatarImage src={msg.sender.avatar} />
                          <AvatarFallback>
                            {msg.sender.username?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      )}

                      <div className={cn("max-w-[75%] flex flex-col", isMine ? "items-end" : "items-start")}>
                        {!isMine && (
                          <span className="text-xs text-muted-foreground ml-1 mb-1">
                            {msg.sender.username}
                          </span>
                        )}

                        <div
                          className={cn(
                            "rounded-2xl px-4 py-2.5 w-fit",
                            isMine
                              ? "bg-primary text-primary-foreground rounded-br-sm"
                              : "bg-secondary rounded-bl-sm"
                          )}
                        >
                          <p className="text-sm">{msg.text}</p>
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

              {/* Input */}
              <div className="p-4 border-t border-border">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon">
                    <Image className="h-5 w-5" />
                  </Button>

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
                  />

                  <Button
                    size="icon"
                    className="rounded-full"
                    onClick={handleSend}
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
    </div>
  );
}
