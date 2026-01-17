import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

// Configure Socket.IO with CORS for both development and production
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === "production" 
      ? ["https://chatting-pro.onrender.com", process.env.CLIENT_URL].filter(Boolean)
      : ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175"],
    credentials: true,
  },
  // Improve connection stability
  pingTimeout: 60000,
  pingInterval: 25000,
});

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

// used to store online users
const userSocketMap = {}; // {userId: socketId}

// Track typing status
const typingUsers = {}; // {recipientId: {senderId: timestamp}}

io.on("connection", (socket) => {
  console.log("A user connected", socket.id);

  const userId = socket.handshake.query.userId;
  if (userId) userSocketMap[userId] = socket.id;

  // io.emit() is used to send events to all the connected clients
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // ============ Typing Indicator ============
  
  socket.on("typing", (data) => {
    const receiverSocketId = userSocketMap[data.receiverId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("userTyping", {
        senderId: userId,
        isTyping: true,
      });
    }
  });

  socket.on("stopTyping", (data) => {
    const receiverSocketId = userSocketMap[data.receiverId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("userTyping", {
        senderId: userId,
        isTyping: false,
      });
    }
  });

  // ============ Read Receipts ============
  
  socket.on("messageRead", (data) => {
    const senderSocketId = userSocketMap[data.senderId];
    if (senderSocketId) {
      io.to(senderSocketId).emit("messageReadReceipt", {
        messageId: data.messageId,
        readBy: userId,
        readAt: new Date(),
      });
    }
  });

  socket.on("messagesRead", (data) => {
    const senderSocketId = userSocketMap[data.senderId];
    if (senderSocketId) {
      io.to(senderSocketId).emit("allMessagesRead", {
        readBy: userId,
        conversationWith: userId,
        readAt: new Date(),
      });
    }
  });

  // ============ Message Reactions ============
  
  socket.on("addReaction", (data) => {
    const receiverSocketId = userSocketMap[data.receiverId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messageReaction", {
        messageId: data.messageId,
        reaction: data.reaction,
        reactedBy: userId,
      });
    }
  });

  // ============ WebRTC Signaling for Video/Audio Calls ============

  // Handle call initiation
  socket.on("callUser", (data) => {
    const receiverSocketId = userSocketMap[data.userToCall];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("incomingCall", {
        signal: data.signalData,
        from: data.from,
        callerName: data.callerName,
        callerPic: data.callerPic,
        callType: data.callType,
      });
    } else {
      // User is offline
      socket.emit("callFailed", { reason: "User is offline" });
    }
  });

  // Handle call answer
  socket.on("answerCall", (data) => {
    const callerSocketId = userSocketMap[data.to];
    if (callerSocketId) {
      io.to(callerSocketId).emit("callAccepted", data.signal);
    }
  });

  // Handle call rejection
  socket.on("rejectCall", (data) => {
    const callerSocketId = userSocketMap[data.to];
    if (callerSocketId) {
      io.to(callerSocketId).emit("callRejected");
    }
  });

  // Handle call end
  socket.on("endCall", (data) => {
    const otherUserSocketId = userSocketMap[data.to];
    if (otherUserSocketId) {
      io.to(otherUserSocketId).emit("callEnded");
    }
  });

  // Handle ICE candidates (for improved connectivity)
  socket.on("iceCandidate", (data) => {
    const receiverSocketId = userSocketMap[data.to];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("iceCandidate", {
        candidate: data.candidate,
        from: userId,
      });
    }
  });

  // ============ Message Operations ============

  // Message deleted
  socket.on("deleteMessage", (data) => {
    const receiverSocketId = userSocketMap[data.receiverId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messageDeleted", {
        messageId: data.messageId,
        deletedForEveryone: data.deletedForEveryone,
      });
    }
  });

  // Message starred
  socket.on("starMessage", (data) => {
    // Just local, no need to broadcast
  });

  // Message forwarded
  socket.on("forwardMessage", (data) => {
    data.receiverIds.forEach((receiverId) => {
      const receiverSocketId = userSocketMap[receiverId];
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("newMessage", data.message);
      }
    });
  });

  // ============ End WebRTC Signaling ============

  socket.on("disconnect", () => {
    console.log("A user disconnected", socket.id);
    // Store last seen time
    userLastSeen[userId] = new Date();
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
    io.emit("userLastSeen", { userId, lastSeen: userLastSeen[userId] });
  });
});

// Store last seen times
const userLastSeen = {};

// Export last seen getter
export function getUserLastSeen(userId) {
  return userLastSeen[userId];
}

export { io, app, server };
