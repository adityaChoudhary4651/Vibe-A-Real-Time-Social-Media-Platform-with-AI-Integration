import { useEffect } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { useSocket } from "@/contexts/SocketContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function SocketNotificationListener() {
  const { socket } = useSocket();
  const { user } = useAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (!socket || !user) return;

    const handleReceiveMessage = (msg: any) => {
      // Don't show toast if user is the sender
      const senderId = msg.sender?._id || msg.sender;
      if (String(senderId) === String(user.id || user._id)) return;

      const activeConvId = searchParams.get("conversation");
      const isViewingCurrentConv = location.pathname === "/messages" && activeConvId === msg.conversation;

      if (!isViewingCurrentConv) {
        toast(`New message from @${msg.sender?.username || "user"}`, {
          description: msg.text ? (msg.text.length > 60 ? msg.text.substring(0, 60) + "..." : msg.text) : "Sent an image attachment",
          action: {
            label: "View",
            onClick: () => {
              window.location.href = `/messages?conversation=${msg.conversation}`;
            }
          }
        });
      }
    };

    const handleReceiveCommunityMessage = (msg: any) => {
      // Don't show toast if user is the sender
      const senderId = msg.sender?._id || msg.sender;
      if (String(senderId) === String(user.id || user._id)) return;

      toast(`New post in community by @${msg.sender?.username || "user"}`, {
        description: msg.text ? (msg.text.length > 50 ? msg.text.substring(0, 50) + "..." : msg.text) : "Shared a photo",
        duration: 3000
      });
    };

    socket.on("receive_message", handleReceiveMessage);
    socket.on("receive_community_message", handleReceiveCommunityMessage);

    return () => {
      socket.off("receive_message", handleReceiveMessage);
      socket.off("receive_community_message", handleReceiveCommunityMessage);
    };
  }, [socket, user, location.pathname, searchParams]);

  return null;
}
