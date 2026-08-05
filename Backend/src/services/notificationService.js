import { Notification, User } from "../models/index.js";
import { Op } from "sequelize";
import { getPagination } from "../utils/helpers.js";
import { emitNotificationCreated } from "../config/socket.js";
import { USER_STATUS } from "../config/constants.js";
import logger from "../config/logger.js";

export const createNotification = async (data) => {
  const notification = await Notification.create(data);
  return notification;
};

/**
 * Persist a notification for one user and push it live over the socket.
 * This is the only place that should call createNotification directly for
 * event-driven notifications — callers that only emitted a raw socket event
 * (no DB row) left every notification unreadable after a page refresh,
 * since the bell's "load history" call reads from this table.
 */
export const notifyUser = async (userId, { type, title, message, priority = "medium", link, metadata }) => {
  if (!userId) return null;

  try {
    const notification = await createNotification({
      userId,
      type,
      title,
      message,
      priority,
      link,
      metadata,
    });
    emitNotificationCreated(notification);
    return notification;
  } catch (error) {
    // A failed notification must never fail the business operation that
    // triggered it (e.g. a lab result save should still succeed)
    logger.error("Failed to create notification:", error);
    return null;
  }
};

/**
 * Same as notifyUser, fanned out to every active user with the given role.
 */
export const notifyRole = async (role, payload) => {
  const users = await User.findAll({
    where: { role, status: USER_STATUS.ACTIVE },
    attributes: ["id"],
  });

  return Promise.all(users.map((u) => notifyUser(u.id, payload)));
};

export const getNotifications = async (userId, query) => {
  const { page = 1, pageSize = 10, isRead, priority } = query;
  const { limit, offset } = getPagination(page, pageSize);

  const where = { userId };
  if (isRead !== undefined) where.isRead = isRead === "true";
  if (priority) where.priority = priority;

  const { count, rows } = await Notification.findAndCountAll({
    where,
    limit,
    offset,
    order: [["createdAt", "DESC"]],
  });

  return {
    notifications: rows,
    pagination: { page: parseInt(page), pageSize: limit, totalItems: count },
  };
};

export const markAsRead = async (id, userId) => {
  const notification = await Notification.findOne({ where: { id, userId } });

  if (!notification) throw new Error("Notification not found");

  await notification.update({ isRead: true, readAt: new Date() });
  return notification;
};

export const deleteNotification = async (id, userId) => {
  const notification = await Notification.findOne({ where: { id, userId } });

  if (!notification) throw new Error("Notification not found");

  await notification.destroy();
  return { message: "Notification deleted successfully" };
};

export const deleteAllNotifications = async (userId) => {
  await Notification.destroy({ where: { userId } });
  return { message: "All notifications deleted successfully" };
};
