import { Server } from "socket.io";

let io;

export const initSocket = (server) => {
  const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:8080",
    "http://127.0.0.1:8080",
  ];
  if (process.env.FRONTEND_URL) {
    allowedOrigins.push(process.env.FRONTEND_URL.replace(/\/$/, ""));
  }

  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        // Dynamically reflect any requesting origin back as allowed to eliminate CORS errors in production
        callback(null, true);
      },
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    // Join a personal room for notifications
    socket.on("setup", (userId) => {
      socket.join(userId);
      console.log(`User ${userId} joined their personal room`);
      socket.emit("connected");
    });

    // Join a private conversation room
    socket.on("join_conversation", (conversationId) => {
      socket.join(conversationId);
      console.log(`User ${socket.id} joined conversation: ${conversationId}`);
    });

    // Send message event
    socket.on("send_message", (data) => {
      // data: { conversationId, message }
      socket.to(data.conversationId).emit("receive_message", data.message);
    });

    // Join a community room
    socket.on("join_community", (communityId) => {
      socket.join(communityId);
      console.log(`User ${socket.id} joined community: ${communityId}`);
    });

    // Join a post room for live likes/comments
    socket.on("join_post", (postId) => {
      socket.join(`post_${postId}`);
      console.log(`User ${socket.id} joined post room: post_${postId}`);
    });

    socket.on("leave_post", (postId) => {
      socket.leave(`post_${postId}`);
      console.log(`User ${socket.id} left post room: post_${postId}`);
    });

    // Join a story room for live likes/comments
    socket.on("join_story", (storyId) => {
      socket.join(`story_${storyId}`);
      console.log(`User ${socket.id} joined story room: story_${storyId}`);
    });

    socket.on("leave_story", (storyId) => {
      socket.leave(`story_${storyId}`);
      console.log(`User ${socket.id} left story room: story_${storyId}`);
    });

    // Send community message event
    socket.on("send_community_message", (data) => {
      // data: { communityId, message }
      socket.to(data.communityId).emit("receive_community_message", data.message);
    });

    // Handle typing indicators
    socket.on("typing", (data) => {
      // data: { room, username }
      socket.to(data.room).emit("user_typing", data);
    });

    socket.on("stop_typing", (data) => {
      socket.to(data.room).emit("user_stop_typing", data);
    });

    // === WebRTC SIGNALING EVENTS ===

    // Caller initiates call to Callee
    socket.on("call_user", (data) => {
      // data: { offer, calleeId, callerId, callerName, callerAvatar, callType }
      socket.to(data.calleeId).emit("incoming_call", {
        offer: data.offer,
        callerId: data.callerId,
        callerName: data.callerName,
        callerAvatar: data.callerAvatar,
        callType: data.callType,
      });
    });

    // Callee accepts the call
    socket.on("accept_call", (data) => {
      // data: { answer, callerId }
      socket.to(data.callerId).emit("call_accepted", {
        answer: data.answer,
      });
    });

    // Callee rejects the call
    socket.on("reject_call", (data) => {
      // data: { callerId }
      socket.to(data.callerId).emit("call_rejected");
    });

    // Peer exchanges ICE Candidate
    socket.on("ice_candidate", (data) => {
      // data: { candidate, recipientId, senderId }
      socket.to(data.recipientId).emit("ice_candidate", {
        candidate: data.candidate,
        senderId: data.senderId,
      });
    });

    // Hang up or Disconnect Call
    socket.on("end_call", (data) => {
      // data: { recipientId }
      socket.to(data.recipientId).emit("call_ended");
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};
