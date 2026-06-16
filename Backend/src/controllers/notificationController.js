import { ApiResponse } from "../utils/response.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import * as notificationService from "../services/notificationService.js";

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
