import jwt from "jsonwebtoken";
import { ApiResponse } from "../utils/response.js";
import { User } from "../models/index.js";
import { ERROR_MESSAGES, USER_STATUS } from "../config/constants.js";

/**
 * Verify JWT token and attach user to request
 */
export const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return ApiResponse.unauthorized(res, ERROR_MESSAGES.UNAUTHORIZED);
    }

    const token = authHeader.substring(7);

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from database
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ["password"] },
    });

    if (!user) {
      return ApiResponse.unauthorized(res, ERROR_MESSAGES.UNAUTHORIZED);
    }

    // Check if user is active
    if (user.status !== USER_STATUS.ACTIVE) {
      return ApiResponse.forbidden(res, ERROR_MESSAGES.ACCOUNT_INACTIVE);
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return ApiResponse.unauthorized(res, ERROR_MESSAGES.INVALID_TOKEN);
    }
    if (error.name === "TokenExpiredError") {
      return ApiResponse.unauthorized(res, ERROR_MESSAGES.TOKEN_EXPIRED);
    }
    return ApiResponse.serverError(res, error.message);
  }
};

/**
 * Check if user has required role(s)
 */
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return ApiResponse.unauthorized(res, ERROR_MESSAGES.UNAUTHORIZED);
    }

    if (!allowedRoles.includes(req.user.role)) {
      return ApiResponse.forbidden(res, ERROR_MESSAGES.FORBIDDEN);
    }

    next();
  };
};

/**
 * Check if user has required permission
 */
export const checkPermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return ApiResponse.unauthorized(res, ERROR_MESSAGES.UNAUTHORIZED);
    }

    // Import PERMISSIONS from constants
    import("../config/constants.js").then(({ PERMISSIONS }) => {
      const userPermissions = PERMISSIONS[req.user.role] || [];

      if (
        !userPermissions.includes(permission) &&
        !userPermissions.includes("manage_all")
      ) {
        return ApiResponse.forbidden(res, ERROR_MESSAGES.FORBIDDEN);
      }

      next();
    });
  };
};

/**
 * Optional authentication - attaches user if token is valid, but doesn't fail if not
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const user = await User.findByPk(decoded.id, {
        attributes: { exclude: ["password"] },
      });

      if (user && user.status === USER_STATUS.ACTIVE) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    // Continue without user
    next();
  }
};
