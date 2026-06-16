import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

let socket = null;

export const initializeSocket = (token) => {
  if (socket) {
    return socket;
  }

  socket = io(SOCKET_URL, {
    auth: {
      token,
    },
    autoConnect: false,
  });

  socket.on("connect", () => {
    console.log("✅ Socket connected:", socket.id);
  });

  socket.on("disconnect", () => {
    console.log("❌ Socket disconnected");
  });

  socket.on("connect_error", (error) => {
    console.error("Socket connection error:", error.message);
  });

  return socket;
};

export const connectSocket = () => {
  if (socket && !socket.connected) {
    socket.connect();
  }
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => {
  return socket;
};

export const subscribeToQueue = () => {
  if (socket) {
    socket.emit("subscribe:queue");
  }
};

export const joinRoom = (room) => {
  if (socket) {
    socket.emit("join:room", room);
  }
};

export const leaveRoom = (room) => {
  if (socket) {
    socket.emit("leave:room", room);
  }
};

export default {
  initializeSocket,
  connectSocket,
  disconnectSocket,
  getSocket,
  subscribeToQueue,
  joinRoom,
  leaveRoom,
};
