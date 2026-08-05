import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// The one place .env gets loaded, and the first thing server.js imports —
// ES module imports execute in the order they're written, depth-first,
// before the importing file's own code runs, so anything imported *after*
// this in server.js (the whole app.js tree: logger, rate limiter, database,
// ...) is guaranteed to see process.env already populated. Several of those
// modules read env vars at their own top level, so loading this any later
// (e.g. inside app.js, after some of its imports) silently missed values.
//
// In production you set real environment variables on the host/platform
// and never upload .env — dotenv.config() simply does nothing if the file
// isn't there, and it never overwrites a variable process.env already has,
// so this is safe either way.
dotenv.config({ path: path.join(__dirname, "../../.env") });

// Fail fast and loudly at boot if a secret the app can't safely run
// without is missing, instead of limping along with `undefined` and
// surfacing a confusing error later on someone's first login attempt.
// Only enforced in production — local dev keeps working via .env or the
// (insecure, dev-only) fallbacks already baked into config/database.js.
const REQUIRED_IN_PRODUCTION = [
  "JWT_SECRET",
  "JWT_REFRESH_SECRET",
  "DB_HOST",
  "DB_NAME",
  "DB_USER",
  "DB_PASSWORD",
];

if (process.env.NODE_ENV === "production") {
  const missing = REQUIRED_IN_PRODUCTION.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    // eslint-disable-next-line no-console
    console.error(
      `❌ Missing required environment variable(s): ${missing.join(", ")}\n` +
        "   Set these on your hosting platform's environment configuration " +
        "(see Backend/.env.example for the full list) — do not upload .env.",
    );
    process.exit(1);
  }
}
