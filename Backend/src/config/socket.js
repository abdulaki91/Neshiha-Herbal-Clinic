import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { User, Patient } from "../models/index.js";
import logger from "./logger.js";
import { allowedOrigins } from "./corsOrigins.js";
import { pushToRoles, pushToUsers, pushTextToUser } from "../services/pushService.js";

// Firebase pushes reach the mobile app when it is closed or in the
// background (while it is open, the socket events below already alert it).
// Only events worth interrupting someone for are pushed; `destination`
// tells the app which screen to open when the notification is tapped.
const fullName = (p) => [p?.firstName, p?.lastName].filter(Boolean).join(" ");
const money = (v) => Number(v || 0).toLocaleString("en-US");

let io;

// Store connected users
const connectedUsers = new Map();

/**
 * Initialize Socket.io
 */
export const initializeSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST"],
      credentials: true,
    },
    // Match the client (lib/socket.js): Phusion Passenger doesn't support
    // the WebSocket upgrade, so only advertise polling — matches what the
    // client actually uses and keeps both sides in agreement.
    transports: ["polling"],
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
  pushToRoles(["doctor"], "patientRegistered",
    { firstName: patient?.firstName, lastName: patient?.lastName },
    { event: "patient:registered", destination: "patients" });
};

/**
 * Emit new visit created
 */
export const emitVisitCreated = (visit) => {
  emitToRole("doctor", "visit:created", visit);
  // Walk-ins go straight to the queue; scheduled appointments only join it
  // when checked in (see emitPatientCheckedIn).
  if (visit?.status === "waiting") {
    pushToRoles(["doctor"], "newPatientInQueue", {},
      { event: "queue:updated", destination: "queue" });
  }

  // Emit to queue updates
  if (io) {
    io.to("queue:updates").emit("queue:updated", visit);
  }
};

/**
 * Emit visit status changed. Cashier is included because a visit moving to
 * "pending_payment" (a doctor finishing a consultation with prescriptions
 * attached) is the cashier's only signal that a new payment is waiting —
 * see CashierPage.jsx's listener for this exact event.
 */
export const emitVisitStatusChanged = (visit) => {
  emitToRole("doctor", "visit:status-changed", visit);
  emitToRole("data_clerk", "visit:status-changed", visit);
  emitToRole("cashier", "visit:status-changed", visit);

  // A finished consultation with unpaid medicine is the cashier's cue.
  if (visit?.status === "pending_payment") {
    // updateVisit returns the bare row, so look the patient up when absent.
    const patient = visit.patient
      ? Promise.resolve(visit.patient)
      : Patient.findByPk(visit.patientId, { attributes: ["firstName", "lastName"] });
    patient
      .catch(() => null)
      .then((p) =>
        pushToRoles(["cashier"], "billPending", { name: fullName(p) },
          { event: "visit:status-changed", destination: "cashier" }));
  }

  if (io) {
    io.to("queue:updates").emit("queue:updated", visit);
  }
};

/**
 * Emit prescription created. Also reaches cashier: a prescription added to
 * a visit that's already pending payment changes the amount due, and
 * CashierPage.jsx listens for this to keep the total in sync.
 */
export const emitPrescriptionCreated = (prescription) => {
  emitToUser(prescription.doctorId, "prescription:created", prescription);
  emitToRole("cashier", "prescription:created", prescription);
};

/**
 * Emit medicine dispensed
 */
export const emitMedicineDispensed = (dispense) => {
  emitToRole("doctor", "medicine:dispensed", dispense);
};

/**
 * Emit low stock alert
 */
export const emitLowStockAlert = (medicine) => {
  emitToRole("doctor", "medicine:low-stock", medicine);
  emitToRole("data_clerk", "medicine:low-stock", medicine);
  pushToRoles(["doctor", "data_clerk"], "lowStock", { name: medicine?.name },
    { event: "medicine:low-stock", destination: "medicines" });
};

/**
 * Emit notification created
 */
export const emitNotificationCreated = (notification) => {
  emitToUser(notification.userId, "notification:new", notification);
  pushTextToUser(notification.userId, notification.title, notification.message,
    { event: "notification:new" });
};

/**
 * Emit staff created
 */
export const emitStaffCreated = (staff) => {
  emitToRole("super_admin", "staff:created", staff);
  emitToRole("staff_manager", "staff:created", staff);
  pushToRoles(["super_admin", "staff_manager"], "staffCreated", {},
    { event: "staff:created", destination: "staff" });
};

/**
 * Emit new investigation/lab test requested. Only doctors can create or
 * complete investigations in this system (no separate lab-tech role), so
 * this is for multi-doctor visibility and admin oversight, not a handoff.
 */
export const emitInvestigationCreated = (investigation) => {
  emitToRole("doctor", "investigation:created", investigation);
  pushToRoles(["doctor"], "investigationRequested", { test: investigation?.testName },
    { event: "investigation:created", destination: "laboratory" });
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
  pushToUsers([investigation?.requestedBy], "investigationResult",
    { test: investigation?.testName },
    { event: "investigation:result-added", destination: "laboratory" });
};

/**
 * Emit payment completed
 */
export const emitPaymentCompleted = (payment) => {
  emitToRole("cashier", "payment:completed", payment);
  emitToRole("doctor", "payment:completed", payment);
  pushToRoles(["doctor"], "paymentReceived", { amount: money(payment?.amount) },
    { event: "payment:completed", destination: "reports" });
};

/**
 * Emit a new public "Book Appointment" submission — to whoever handles
 * patient intake, so it doesn't just sit unseen in the portal.
 */
export const emitBookingRequestCreated = (booking) => {
  emitToRole("data_clerk", "booking-request:created", booking);
  emitToRole("doctor", "booking-request:created", booking);
  pushToRoles(["data_clerk", "doctor"], "bookingRequest", { name: booking?.fullName },
    { event: "booking-request:created", destination: "bookings" });
};

/**
 * Emit a registration fee collected at patient intake. Doctor-only, like
 * every other financial event (see emitPaymentCompleted) — this is what
 * lets the doctor reports page live-update without a manual refresh.
 */
export const emitRegistrationFeeCollected = (registrationPayment) => {
  emitToRole("doctor", "registration-fee:collected", registrationPayment);
  pushToRoles(["doctor"], "registrationFee", { amount: money(registrationPayment?.amount) },
    { event: "registration-fee:collected", destination: "reports" });
};

/**
 * A visit's details changed but its status did not (consultation autosave,
 * vitals, diagnosis …). Lets open screens refresh quietly — no toasts, no
 * "queue:updated", no push.
 */
export const emitVisitUpdated = (visit) => {
  emitToRole("doctor", "visit:updated", visit);
  emitToRole("data_clerk", "visit:updated", visit);
};

/**
 * A scheduled appointment was checked in — the patient now waits in the
 * doctor's queue. Same socket events as any status change, plus a push.
 */
export const emitPatientCheckedIn = (visit) => {
  emitVisitStatusChanged(visit);
  pushToRoles(["doctor"], "newPatientInQueue", {},
    { event: "queue:updated", destination: "queue" });
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
  emitInvestigationCreated,
  emitInvestigationResultAdded,
  emitPaymentCompleted,
  emitBookingRequestCreated,
  emitRegistrationFeeCollected,
  emitPatientCheckedIn,
  emitVisitUpdated,
};
