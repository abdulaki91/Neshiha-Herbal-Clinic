import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { User } from "../models/index.js";
import logger from "./logger.js";

let io;

// Store connected users
const connectedUsers = new Map();

/**
 * Initialize Socket.io
 */
export const initializeSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: [
        process.env.FRONTEND_URL || "http://localhost:5173",
        "http://localhost:5174",
      ],
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Authentication middleware for socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error("Authentication error: No token provided"));
      }

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from database
      const user = await User.findByPk(decoded.id, {
        attributes: { exclude: ["password"] },
      });

      if (!user || user.status !== "active") {
        return next(new Error("Authentication error: Invalid user"));
      }

      // Attach user to socket
      socket.user = user;
      next();
    } catch (error) {
      logger.error("Socket authentication error:", error);
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    const user = socket.user;
    logger.info(`User connected: ${user.email} (${user.role})`);

    // Store connected user
    connectedUsers.set(user.id, {
      socketId: socket.id,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    });

    // Join role-specific room
    socket.join(`role:${user.role}`);
    socket.join(`user:${user.id}`);

    // Emit connected users count to admins
    io.to("role:super_admin").emit("users:online", {
      count: connectedUsers.size,
      users: Array.from(connectedUsers.values()).map((u) => u.user),
    });

    // Handle join specific rooms
    socket.on("join:room", (room) => {
      socket.join(room);
      logger.info(`User ${user.email} joined room: ${room}`);
    });

    // Handle leave specific rooms
    socket.on("leave:room", (room) => {
      socket.leave(room);
      logger.info(`User ${user.email} left room: ${room}`);
    });

    // Handle patient queue subscription (for doctors)
    socket.on("subscribe:queue", () => {
      if (user.role === "doctor") {
        socket.join("queue:updates");
        logger.info(`Doctor ${user.email} subscribed to queue updates`);
      }
    });

    // Handle typing indicators for chat (future feature)
    socket.on("typing:start", (data) => {
      socket.broadcast.to(data.room).emit("user:typing", {
        userId: user.id,
        userName: `${user.firstName} ${user.lastName}`,
      });
    });

    socket.on("typing:stop", (data) => {
      socket.broadcast.to(data.room).emit("user:stopped-typing", {
        userId: user.id,
      });
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      logger.info(`User disconnected: ${user.email}`);
      connectedUsers.delete(user.id);

      // Emit updated online users count
      io.to("role:super_admin").emit("users:online", {
        count: connectedUsers.size,
        users: Array.from(connectedUsers.values()).map((u) => u.user),
      });
    });
  });

  logger.info("✅ Socket.io initialized successfully");
  return io;
};

/**
 * Get Socket.io instance
 */
export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
};

/**
 * Emit notification to specific user
 */
export const emitToUser = (userId, event, data) => {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, data);
};

/**
 * Emit notification to role
 */
export const emitToRole = (role, event, data) => {
  if (!io) return;
  io.to(`role:${role}`).emit(event, data);
};

/**
 * Emit notification to all connected users
 */
export const emitToAll = (event, data) => {
  if (!io) return;
  io.emit(event, data);
};

/**
 * Get connected users
 */
export const getConnectedUsers = () => {
  return Array.from(connectedUsers.values());
};

/**
 * Check if user is online
 */
export const isUserOnline = (userId) => {
  return connectedUsers.has(userId);
};

// Real-time event emitters

/**
 * Emit new patient registration
 */
export const emitPatientRegistered = (patient) => {
  emitToRole("doctor", "patient:registered", patient);
  emitToRole("data_clerk", "patient:registered", patient);
  emitToRole("super_admin", "patient:registered", patient);
};

/**
 * Emit new visit created
 */
export const emitVisitCreated = (visit) => {
  emitToRole("doctor", "visit:created", visit);
  emitToRole("super_admin", "visit:created", visit);

  // Emit to queue updates
  if (io) {
    io.to("queue:updates").emit("queue:updated", visit);
  }
};

/**
 * Emit visit status changed
 */
export const emitVisitStatusChanged = (visit) => {
  emitToRole("doctor", "visit:status-changed", visit);
  emitToRole("data_clerk", "visit:status-changed", visit);
  emitToRole("super_admin", "visit:status-changed", visit);

  if (io) {
    io.to("queue:updates").emit("queue:updated", visit);
  }
};

/**
 * Emit prescription created
 */
export const emitPrescriptionCreated = (prescription) => {
  emitToUser(prescription.doctorId, "prescription:created", prescription);
  emitToRole("super_admin", "prescription:created", prescription);
};

/**
 * Emit medicine dispensed
 */
export const emitMedicineDispensed = (dispense) => {
  emitToRole("doctor", "medicine:dispensed", dispense);
  emitToRole("super_admin", "medicine:dispensed", dispense);
};

/**
 * Emit low stock alert
 */
export const emitLowStockAlert = (medicine) => {
  emitToRole("super_admin", "medicine:low-stock", medicine);
};

/**
 * Emit notification created
 */
export const emitNotificationCreated = (notification) => {
  emitToUser(notification.userId, "notification:new", notification);
};

/**
 * Emit staff created
 */
export const emitStaffCreated = (staff) => {
  emitToRole("super_admin", "staff:created", staff);
  emitToRole("staff_manager", "staff:created", staff);
};

/**
 * Emit investigation result added
 */
export const emitInvestigationResultAdded = (investigation) => {
  emitToUser(
    investigation.requestedBy,
    "investigation:result-added",
    investigation,
  );
  emitToRole("super_admin", "investigation:result-added", investigation);
};

export default {
  initializeSocket,
  getIO,
  emitToUser,
  emitToRole,
  emitToAll,
  getConnectedUsers,
  isUserOnline,
  emitPatientRegistered,
  emitVisitCreated,
  emitVisitStatusChanged,
  emitPrescriptionCreated,
  emitMedicineDispensed,
  emitLowStockAlert,
  emitNotificationCreated,
  emitStaffCreated,
  emitInvestigationResultAdded,
};
