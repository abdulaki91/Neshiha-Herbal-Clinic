import { Notification } from "../models/index.js";
import { Op } from "sequelize";
import { getPagination } from "../utils/helpers.js";

export const createNotification = async (data) => {
  const notification = await Notification.create(data);
  return notification;
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
