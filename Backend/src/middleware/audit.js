import { AuditLog } from "../models/index.js";
import logger from "../config/logger.js";

// Never persist credentials or tokens into the audit trail
const SENSITIVE_FIELDS = [
  "password",
  "newPassword",
  "currentPassword",
  "confirmPassword",
  "token",
  "accessToken",
  "refreshToken",
  "resetPasswordToken",
];

/**
 * Return a copy of a payload with sensitive fields masked
 */
export const redact = (payload) => {
  if (!payload || typeof payload !== "object") return payload;

  const safe = Array.isArray(payload) ? [...payload] : { ...payload };

  for (const field of SENSITIVE_FIELDS) {
    if (field in safe) safe[field] = "[REDACTED]";
  }

  return safe;
};

/**
 * Create audit log entry
 */
export const createAuditLog = async (data) => {
  try {
    await AuditLog.create(data);
  } catch (error) {
    logger.error("Failed to create audit log:", error);
  }
};

/**
 * Audit middleware for logging actions
 */
export const auditLogger = (action, resource) => {
  return async (req, res, next) => {
    // Store original json function
    const originalJson = res.json;

    // Override json function to capture response
    res.json = function (data) {
      // Create audit log if request was successful
      if (res.statusCode < 400) {
        createAuditLog({
          userId: req.user?.id,
          action,
          resource,
          resourceId: req.params.id || data?.data?.id,
          description: `${action} ${resource}`,
          newValues:
            action === "CREATE" || action === "UPDATE"
              ? redact(req.body)
              : undefined,
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.headers["user-agent"],
        });
      }

      // Call original json function
      return originalJson.call(this, data);
    };

    next();
  };
};

/**
 * Audit update with old and new values
 */
export const auditUpdate = (resource) => {
  return async (req, res, next) => {
    // Store original model in request for comparison
    if (req.params.id) {
      try {
        const { [resource]: Model } = await import("../models/index.js");
        const original = await Model.findByPk(req.params.id);
        req.originalData = original?.toJSON();
      } catch (error) {
        logger.error("Failed to fetch original data for audit:", error);
      }
    }

    // Store original json function
    const originalJson = res.json;

    // Override json function
    res.json = function (data) {
      if (res.statusCode < 400 && req.originalData) {
        createAuditLog({
          userId: req.user?.id,
          action: "UPDATE",
          resource,
          resourceId: req.params.id,
          description: `Updated ${resource}`,
          oldValues: redact(req.originalData),
          newValues: redact(req.body),
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.headers["user-agent"],
        });
      }

      return originalJson.call(this, data);
    };

    next();
  };
};
