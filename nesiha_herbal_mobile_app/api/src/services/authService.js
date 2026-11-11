import jwt from "jsonwebtoken";
import crypto from "crypto";
import { User } from "../models/index.js";
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "../config/constants.js";
import { createAuditLog } from "../middleware/audit.js";

/**
 * Generate JWT access token
 */
export const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE || "24h",
    },
  );
};

/**
 * Generate JWT refresh token
 */
export const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      type: "refresh",
    },
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: process.env.JWT_REFRESH_EXPIRE || "7d",
    },
  );
};

/**
 * Login user
 */
export const login = async (email, password, ipAddress, userAgent) => {
  // Find user
  const user = await User.findOne({ where: { email } });

  if (!user) {
    throw new Error(ERROR_MESSAGES.INVALID_CREDENTIALS);
  }

  // Check if account is locked
  if (user.isLocked()) {
    throw new Error(ERROR_MESSAGES.ACCOUNT_LOCKED);
  }

  // Check if account is active
  if (user.status !== "active") {
    throw new Error(ERROR_MESSAGES.ACCOUNT_INACTIVE);
  }

  // Verify password
  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    await user.incrementLoginAttempts();
    throw new Error(ERROR_MESSAGES.INVALID_CREDENTIALS);
  }

  // Reset login attempts
  await user.resetLoginAttempts();

  // Generate tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Update user
  await user.update({
    lastLogin: new Date(),
    refreshToken,
  });

  // Create audit log
  await createAuditLog({
    userId: user.id,
    action: "LOGIN",
    resource: "User",
    resourceId: user.id,
    description: "User logged in",
    ipAddress,
    userAgent,
  });

  return {
    user: user.toJSON(),
    accessToken,
    refreshToken,
  };
};

/**
 * Logout user
 */
export const logout = async (userId, ipAddress, userAgent) => {
  const user = await User.findByPk(userId);

  if (user) {
    await user.update({ refreshToken: null });

    await createAuditLog({
      userId,
      action: "LOGOUT",
      resource: "User",
      resourceId: userId,
      description: "User logged out",
      ipAddress,
      userAgent,
    });
  }

  return { message: SUCCESS_MESSAGES.LOGOUT_SUCCESS };
};

/**
 * Refresh access token
 */
export const refreshAccessToken = async (refreshToken) => {
  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Find user
    const user = await User.findByPk(decoded.id);

    if (!user || user.refreshToken !== refreshToken) {
      throw new Error(ERROR_MESSAGES.INVALID_TOKEN);
    }

    if (user.status !== "active") {
      throw new Error(ERROR_MESSAGES.ACCOUNT_INACTIVE);
    }

    // Generate new access token
    const accessToken = generateAccessToken(user);

    return {
      accessToken,
      user: user.toJSON(),
    };
  } catch (error) {
    throw new Error(ERROR_MESSAGES.INVALID_TOKEN);
  }
};

/**
 * Request password reset
 */
export const requestPasswordReset = async (email) => {
  const user = await User.findOne({ where: { email } });

  if (!user) {
    // Don't reveal that user doesn't exist
    return { message: SUCCESS_MESSAGES.PASSWORD_RESET_EMAIL_SENT };
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // Set token expiry (1 hour)
  const resetExpire = new Date(Date.now() + 60 * 60 * 1000);

  await user.update({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: resetExpire,
  });

  // TODO: Send email with reset link
  // const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

  return {
    message: SUCCESS_MESSAGES.PASSWORD_RESET_EMAIL_SENT,
    resetToken, // Remove in production, only for testing
  };
};

/**
 * Reset password
 */
export const resetPassword = async (token, newPassword) => {
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    where: {
      resetPasswordToken: hashedToken,
    },
  });

  if (!user || user.resetPasswordExpire < new Date()) {
    throw new Error("Invalid or expired reset token");
  }

  // Update password
  await user.update({
    password: newPassword,
    resetPasswordToken: null,
    resetPasswordExpire: null,
    refreshToken: null,
  });

  return { message: SUCCESS_MESSAGES.PASSWORD_RESET_SUCCESS };
};

/**
 * Change password
 */
export const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await User.scope("withPassword").findByPk(userId);

  if (!user) {
    throw new Error(ERROR_MESSAGES.NOT_FOUND);
  }

  // Verify current password
  const isMatch = await user.comparePassword(currentPassword);

  if (!isMatch) {
    throw new Error("Current password is incorrect");
  }

  // Update password
  await user.update({
    password: newPassword,
    refreshToken: null, // Invalidate all sessions
  });

  return { message: SUCCESS_MESSAGES.PASSWORD_CHANGED };
};
