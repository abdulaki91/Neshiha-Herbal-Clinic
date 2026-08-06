import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { apiLimiter } from "./middleware/rateLimiter.js";
import logger from "./config/logger.js";
import { allowedOrigins } from "./config/corsOrigins.js";

// Environment variables are loaded by config/loadEnv.js — the first thing
// server.js imports — or, for anything that imports this file standalone
// (scripts, tests), by config/database.js's own dotenv call. Not repeated
// here: this used to run after several of the imports above (logger,
// rateLimiter) had already read process.env at their own module-load
// time, so it was too late to matter for them anyway.

// Define dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import routes
import authRoutes from "./routes/authRoutes.js";
import staffRoutes from "./routes/staffRoutes.js";
import patientRoutes from "./routes/patientRoutes.js";
import visitRoutes from "./routes/visitRoutes.js";
import medicineRoutes from "./routes/medicineRoutes.js";
import prescriptionRoutes from "./routes/prescriptionRoutes.js";
import investigationRoutes from "./routes/investigationRoutes.js";
import medicineDispenseRoutes from "./routes/medicineDispenseRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import settingRoutes from "./routes/settingRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import testimonialRoutes from "./routes/testimonialRoutes.js";
import successStoryRoutes from "./routes/successStoryRoutes.js";
import faqRoutes from "./routes/faqRoutes.js";
import teamMemberRoutes from "./routes/teamMemberRoutes.js";
import partnerRoutes from "./routes/partnerRoutes.js";
import bannerRoutes from "./routes/bannerRoutes.js";
import serviceRoutes from "./routes/serviceRoutes.js";
import publicContentRoutes from "./routes/publicContentRoutes.js";
import bookingRequestRoutes from "./routes/bookingRequestRoutes.js";

// Create Express app
const app = express();

// Serve static upload files
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Security middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

// CORS configuration
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);

// Body parser middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// HTTP request logger
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(
    morgan("combined", {
      stream: {
        write: (message) => logger.info(message.trim()),
      },
    }),
  );
}

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// Explicitly disable caching for every API response. The production host
// (cPanel's LiteSpeed reverse proxy in front of "Setup Node.js App") adds
// its own default `Cache-Control: public, max-age=2592000` to any proxied
// response that doesn't set one itself — confirmed via curl against the
// live backend, even on 401s and DELETE/POST responses. The data coming
// out of Node was always fresh (nothing in this codebase sets
// Cache-Control), but browsers honor that header and serve GET responses
// from their own local cache for up to 30 days, so a write would succeed
// on the server while every list view kept silently showing stale cached
// data — this is what looked like "queue not created" / "can't delete
// medicine" in production. An explicit header here overrides the proxy's
// default, since the origin's own Cache-Control always wins.
app.use("/api", (req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

// API version
const API_VERSION = process.env.API_VERSION || "v1";

// Rate limiting disabled for now — was causing 429s during normal use
// (the doctor consultation view alone fires well over 100 requests per
// 15-minute window). Re-enable by uncommenting once tuned appropriately.
// app.use(`/api/${API_VERSION}`, apiLimiter);

// Mount routes
app.use(`/api/${API_VERSION}/auth`, authRoutes);
app.use(`/api/${API_VERSION}/staff`, staffRoutes);
app.use(`/api/${API_VERSION}/patients`, patientRoutes);
app.use(`/api/${API_VERSION}/visits`, visitRoutes);
app.use(`/api/${API_VERSION}/medicines`, medicineRoutes);
app.use(`/api/${API_VERSION}/prescriptions`, prescriptionRoutes);
app.use(`/api/${API_VERSION}/investigations`, investigationRoutes);
app.use(`/api/${API_VERSION}/medicine-dispenses`, medicineDispenseRoutes);
app.use(`/api/${API_VERSION}/dashboard`, dashboardRoutes);
app.use(`/api/${API_VERSION}/reports`, reportRoutes);
app.use(`/api/${API_VERSION}/settings`, settingRoutes);
app.use(`/api/${API_VERSION}/notifications`, notificationRoutes);
app.use(`/api/${API_VERSION}/payments`, paymentRoutes);
app.use(`/api/${API_VERSION}/testimonials`, testimonialRoutes);
app.use(`/api/${API_VERSION}/success-stories`, successStoryRoutes);
app.use(`/api/${API_VERSION}/faqs`, faqRoutes);
app.use(`/api/${API_VERSION}/team-members`, teamMemberRoutes);
app.use(`/api/${API_VERSION}/partners`, partnerRoutes);
app.use(`/api/${API_VERSION}/banners`, bannerRoutes);
app.use(`/api/${API_VERSION}/services`, serviceRoutes);
app.use(`/api/${API_VERSION}/public`, publicContentRoutes);
app.use(`/api/${API_VERSION}/booking-requests`, bookingRequestRoutes);

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

export default app;
