import { ApiResponse } from "../utils/response.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import * as notificationService from "../services/notificationService.js";
import * as pushService from "../services/pushService.js";

const LANGUAGES = ["en", "om", "am", "ar"];
const PLATFORMS = ["android", "ios"];

/**
 * @route   POST /api/v1/notifications/devices
 * @desc    Register the signed-in user's phone for push notifications
 *          (body: { token, platform?, language? })
 */
export const registerDevice = asyncHandler(async (req, res) => {
  const { token, platform, language } = req.body || {};
  if (typeof token !== "string" || token.length < 20 || token.length > 512) {
    return ApiResponse.badRequest(res, "A valid device token is required");
  }
  await pushService.registerDevice(req.user.id, {
    token,
    platform: PLATFORMS.includes(platform) ? platform : "android",
    language: LANGUAGES.includes(language) ? language : "en",
  });
  return ApiResponse.success(
    res,
    { pushEnabled: pushService.isPushEnabled() },
    "Device registered for notifications",
  );
});

/**
 * @route   DELETE /api/v1/notifications/devices
 * @desc    Stop pushes to this phone (body: { token }); called on sign-out
 */
export const unregisterDevice = asyncHandler(async (req, res) => {
  const { token } = req.body || {};
  if (typeof token === "string" && token) {
    await pushService.unregisterDevice(req.user.id, token);
  }
  return ApiResponse.success(res, null, "Device unregistered");
});

export const getNotifications = asyncHandler(async (req, res) => {
  const result = await notificationService.getNotifications(
    req.user.id,
    req.query,
  );
  return ApiResponse.paginated(
    res,
    result.notifications,
    result.pagination,
    "Notifications retrieved successfully",
  );
});

export const markAsRead = asyncHandler(async (req, res) => {
  const notification = await notificationService.markAsRead(
    req.params.id,
    req.user.id,
  );
  return ApiResponse.success(res, notification, "Notification marked as read");
});

export const deleteNotification = asyncHandler(async (req, res) => {
  const result = await notificationService.deleteNotification(
    req.params.id,
    req.user.id,
  );
  return ApiResponse.success(res, null, result.message);
});

export const deleteAllNotifications = asyncHandler(async (req, res) => {
  const result = await notificationService.deleteAllNotifications(req.user.id);
  return ApiResponse.success(res, null, result.message);
});
