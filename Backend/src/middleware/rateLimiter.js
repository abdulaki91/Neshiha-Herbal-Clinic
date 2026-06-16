import rateLimit from "express-rate-limit";
import { ApiResponse } from "../utils/response.js";

/**
 * General API rate limiter
 */
export const apiLimiter = rateLimit({
  windowMs: (parseInt(process.env.RATE_LIMIT_WINDOW) || 15) * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: "Too many requests from this IP, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return ApiResponse.error(
      res,
      "Too many requests, please try again later",
      429,
    );
  },
});

/**
 * Strict rate limiter for authentication routes
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  skipSuccessfulRequests: true,
  message: "Too many login attempts, please try again later",
  handler: (req, res) => {
    return ApiResponse.error(
      res,
      "Too many login attempts, please try again after 15 minutes",
      429,
    );
  },
});

/**
 * Password reset rate limiter
 */
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 requests per hour
  message: "Too many password reset attempts",
  handler: (req, res) => {
    return ApiResponse.error(
      res,
      "Too many password reset attempts, please try again later",
      429,
    );
  },
});
