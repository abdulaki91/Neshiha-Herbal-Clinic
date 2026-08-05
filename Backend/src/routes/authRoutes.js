import express from "express";
import * as authController from "../controllers/authController.js";
import * as authValidator from "../validators/authValidator.js";
import { validate } from "../middleware/validator.js";
import { authenticate } from "../middleware/auth.js";
import {
  authLimiter,
  passwordResetLimiter,
} from "../middleware/rateLimiter.js";

const router = express.Router();

// Public routes
// Rate limiting disabled for now (see app.js) — authLimiter/passwordResetLimiter
// are still imported so this is a one-line revert once re-enabled.
router.post(
  "/login",
  // authLimiter,
  authValidator.loginValidator,
  validate,
  authController.login,
);
router.post(
  "/refresh",
  authValidator.refreshTokenValidator,
  validate,
  authController.refreshToken,
);
router.post(
  "/forgot-password",
  // passwordResetLimiter,
  authValidator.forgotPasswordValidator,
  validate,
  authController.forgotPassword,
);
router.post(
  "/reset-password",
  authValidator.resetPasswordValidator,
  validate,
  authController.resetPassword,
);

// Protected routes
router.post("/logout", authenticate, authController.logout);
router.put(
  "/change-password",
  authenticate,
  authValidator.changePasswordValidator,
  validate,
  authController.changePassword,
);
router.get("/profile", authenticate, authController.getProfile);

export default router;
