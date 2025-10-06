import { Server } from "socket.io";
import http from "http";

import express from "express";

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5143",
      "http://localhost:3000",
    ],
    credentials: true,
  },
});

// Used to store online users and their status
const onlineUserSocketMap = {}; // {userId: {socketId, isViewingStatus}}

// create a helper function to get receiver's socket ID
export function getReceiveSocketId(userId) {
  return onlineUserSocketMap[userId]?.socketId;
}

// connect socket with the server and then disconnect it
io.on("connection", (socket) => {
  console.log("A user connected", socket.id);

  const userId = socket.handshake.query.userId;
  if (userId) {
    // Initialize or update user's socket info
    onlineUserSocketMap[userId] = {
      socketId: socket.id,
      isViewingStatus: false,
    };
    console.log(`User ${userId} connected with socket ID ${socket.id}`);
    console.log("Current online users:", Object.keys(onlineUserSocketMap));
  } else {
    console.log("User connected without userId in handshake query");
  }

  // io.emit is used to send events to all the connected clients
  io.emit("getOnlineUsers", Object.keys(onlineUserSocketMap));

  // Listen for new message events
  socket.on("newMessage", (message) => {
    console.log(`Socket ${socket.id} received newMessage event:`, message);
    // Broadcast to all clients
    io.emit("newMessage", message);
  });

  // Handle status viewing state
  socket.on("statusViewingStarted", () => {
    if (userId) {
      onlineUserSocketMap[userId].isViewingStatus = true;
      console.log(`User ${userId} started viewing status`);
    }
  });

  socket.on("statusViewingEnded", () => {
    if (userId) {
      onlineUserSocketMap[userId].isViewingStatus = false;
      console.log(`User ${userId} stopped viewing status`);
    }
  });

  // for disconnection
  socket.on("disconnect", () => {
    console.log("A user disconnected", socket.id);

    // delete the onlineUsers
    if (userId) {
      delete onlineUserSocketMap[userId];
      console.log(`User ${userId} disconnected`);
      console.log("Remaining online users:", Object.keys(onlineUserSocketMap));
    }
    io.emit("getOnlineUsers", Object.keys(onlineUserSocketMap));
  });
});

export { io, app, server };
