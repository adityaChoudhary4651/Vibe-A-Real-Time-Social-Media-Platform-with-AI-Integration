import { Server } from "socket.io";

let io;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "*", // Adjust this in production
      methods: ["GET", "POST"],
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
