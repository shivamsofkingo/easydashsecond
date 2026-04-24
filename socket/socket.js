const { Server } = require("socket.io");
const http = require("http");
const express = require("express");
const GroupMessage = require("../models/groupMessage.js");

const app = express();

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    // origin: ["http://localhost:5173"],
    origin: "*",
    methods: ["GET", "POST", "DELETE"],
  },
});

const getReceiverSocketId = (receiverId) => {
  return userSocketMap[receiverId];
};
const userSocketMap = {};
const usersOnChatListPage = [];
io.on("connection", (socket) => {
  console.log("user connected", socket.id);
  const userId = socket.handshake.query.userId;
  if (userId) {
    userSocketMap[userId] = socket.id; 
  }
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  console.log("online users --> ", userSocketMap);

  socket.on("joinRoom", ({ adsId, myUserId, senderId }) => {
    const participants = [myUserId, senderId].sort();
    const roomId = `${adsId}_${participants[0]}_${participants[1]}`;
    socket.join(roomId);
    // console.log(`User ${myUserId} joined room ${roomId}`);
  });

  socket.on("joinChatListRoom", ({ myUserId }) => {
    if (myUserId && !usersOnChatListPage.includes(myUserId.toString())) {
      usersOnChatListPage.push(myUserId.toString());
    }
    // console.log(`User ${myUserId} joined the chat list page`);
    // console.log("Users on chat list page ->", usersOnChatListPage);
  });

  socket.on("leaveChatListRoom", ({ myUserId }) => {
    const index = usersOnChatListPage.indexOf(myUserId.toString());
    if (index > -1) {
      usersOnChatListPage.splice(index, 1);
    }
    // console.log(`User ${myUserId} left the chat list page`);
    // console.log("Users on chat list page ->", usersOnChatListPage);
  });

  socket.on("joinGroupRoom", ({ groupId }) => {
    if (!groupId) {
      return;
    }
    socket.join(groupId);
    console.log(`User ${socket.id} joined group room ${groupId}`);
  });

  socket.on("disconnect", () => {
    console.log("user disconnected", socket.id);
    const disconnectedUserId = Object.keys(userSocketMap).find(
      (id) => userSocketMap[id] === socket.id
    );
    if (disconnectedUserId) {
      delete userSocketMap[disconnectedUserId];
      io.emit("getOnlineUsers", Object.keys(userSocketMap));

      const index = usersOnChatListPage.indexOf(disconnectedUserId);
      if (index > -1) {
        usersOnChatListPage.splice(index, 1);
      }
      // console.log(`User ${disconnectedUserId} removed from chat list page`);
      // console.log("Users on chat list page ->", usersOnChatListPage);
    }
  });
});


module.exports = {
  app,
  io,
  server,
  getReceiverSocketId,
  userSocketMap,
  usersOnChatListPage
};
