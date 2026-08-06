// Single source of truth for which frontend origins the API (app.js) and
// Socket.IO (config/socket.js) accept requests from. Reused in both so
// they can never drift apart.
//
// Set ALLOWED_ORIGINS on the host as a comma-separated list — e.g. in
// production:
//   ALLOWED_ORIGINS=https://nesihaherbalclinic.abdulaki.com
// or, if you need more than one (an apex + www variant, a staging site,
// ...):
//   ALLOWED_ORIGINS=https://nesihaherbalclinic.abdulaki.com,https://www.nesihaherbalclinic.abdulaki.com
//
// FRONTEND_URL is still read as a fallback for a single-origin setup.
// The local Vite dev server ports are always allowed on top of whatever's
// configured, so local development never breaks because of this.
const DEV_ORIGINS = ["http://localhost:5173", "http://localhost:5174"];

const configuredOrigins = (process.env.ALLOWED_ORIGINS || process.env.FRONTEND_URL || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

export const allowedOrigins = [...new Set([...configuredOrigins, ...DEV_ORIGINS])];

console.log("[DEBUG corsOrigins] process.env.ALLOWED_ORIGINS =", JSON.stringify(process.env.ALLOWED_ORIGINS));
console.log("[DEBUG corsOrigins] process.env.FRONTEND_URL =", JSON.stringify(process.env.FRONTEND_URL));
console.log("[DEBUG corsOrigins] computed allowedOrigins =", allowedOrigins);
