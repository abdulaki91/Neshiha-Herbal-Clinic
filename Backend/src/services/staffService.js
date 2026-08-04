import { User } from "../models/index.js";
import { ROLES, USER_STATUS, ERROR_MESSAGES } from "../config/constants.js";
import { Op } from "sequelize";
import { getPagination } from "../utils/helpers.js";

/**
 * Create new staff member
 */
export const createStaff = async (data, createdBy) => {
  // Check if email already exists
  const existingUser = await User.findOne({ where: { email: data.email } });
  if (existingUser) {
    throw new Error("Email already exists");
  }

  // Create user
  const staff = await User.create({
    ...data,
    createdBy,
  });

  return staff.toJSON();
};

/**
 * Get all staff with pagination and filters
 */
export const getAllStaff = async (query) => {
  const {
    page = 1,
    pageSize = 10,
    role,
    status,
    search,
    sortBy = "createdAt",
    sortOrder = "DESC",
  } = query;

  const { limit, offset } = getPagination(page, pageSize);

  const where = {};

  // Filter by role
  if (role) {
    where.role = role;
  }

  // Filter by status
  if (status) {
    where.status = status;
  }

  // Search by name, email, or phone
  if (search) {
    where[Op.or] = [
      { firstName: { [Op.iLike]: `%${search}%` } },
      { lastName: { [Op.iLike]: `%${search}%` } },
      { email: { [Op.iLike]: `%${search}%` } },
      { phone: { [Op.iLike]: `%${search}%` } },
    ];
  }

  const { count, rows } = await User.findAndCountAll({
    where,
    limit,
    offset,
    order: [[sortBy, sortOrder]],
    attributes: { exclude: ["password", "refreshToken", "resetPasswordToken"] },
  });

  return {
    staff: rows,
    pagination: {
      page: parseInt(page),
      pageSize: limit,
      totalItems: count,
    },
  };
};

/**
 * Get staff by ID
 */
export const getStaffById = async (id) => {
  const staff = await User.findByPk(id, {
    attributes: { exclude: ["password", "refreshToken", "resetPasswordToken"] },
  });

  if (!staff) {
    throw new Error(ERROR_MESSAGES.NOT_FOUND);
  }

  return staff;
};

/**
 * Update staff
 */
export const updateStaff = async (id, data, updatedBy) => {
  const staff = await User.findByPk(id);

  if (!staff) {
    throw new Error(ERROR_MESSAGES.NOT_FOUND);
  }

  // Don't allow email change if it exists for another user
  if (data.email && data.email !== staff.email) {
    const existingUser = await User.findOne({
      where: {
        email: data.email,
        id: { [Op.ne]: id },
      },
    });

    if (existingUser) {
      throw new Error("Email already exists");
    }
  }

  // Remove fields that shouldn't be updated via this endpoint
  delete data.password;
  delete data.refreshToken;
  delete data.resetPasswordToken;
  delete data.loginAttempts;
  delete data.lockUntil;

  await staff.update({
    ...data,
    updatedBy,
  });

  return staff.toJSON();
};

/**
 * Delete staff (soft delete - set to inactive)
 */
export const deleteStaff = async (id, actorId) => {
  const staff = await User.findByPk(id);

  if (!staff) {
    throw new Error(ERROR_MESSAGES.NOT_FOUND);
  }

  if (actorId && staff.id === actorId) {
    throw new Error("You cannot delete your own account");
  }

  await staff.update({ status: USER_STATUS.INACTIVE, refreshToken: null });

  return { message: "Staff deleted successfully" };
};

/**
 * Activate staff
 */
export const activateStaff = async (id) => {
  const staff = await User.findByPk(id);

  if (!staff) {
    throw new Error(ERROR_MESSAGES.NOT_FOUND);
  }

  // Clear the lockout so a reactivated account can sign in immediately
  await staff.update({
    status: USER_STATUS.ACTIVE,
    loginAttempts: 0,
    lockUntil: null,
  });

  return staff.toJSON();
};

/**
 * Deactivate staff
 */
export const deactivateStaff = async (id, actorId) => {
  const staff = await User.findByPk(id);

  if (!staff) {
    throw new Error(ERROR_MESSAGES.NOT_FOUND);
  }

  if (actorId && staff.id === actorId) {
    throw new Error("You cannot deactivate your own account");
  }

  // Drop the refresh token so existing sessions cannot be renewed
  await staff.update({ status: USER_STATUS.INACTIVE, refreshToken: null });

  return staff.toJSON();
};

/**
 * Reset a staff member's password (admin initiated)
 */
export const resetStaffPassword = async (id, password, updatedBy) => {
  const staff = await User.findByPk(id);

  if (!staff) {
    throw new Error(ERROR_MESSAGES.NOT_FOUND);
  }

  // Password is hashed by the User model's beforeUpdate hook
  await staff.update({
    password,
    updatedBy,
    // Clear any pending self-service reset and unlock the account
    resetPasswordToken: null,
    resetPasswordExpire: null,
    refreshToken: null,
    loginAttempts: 0,
    lockUntil: null,
  });

  return { message: "Password reset successfully" };
};

/**
 * Get staff statistics
 */
export const getStaffStats = async () => {
  const totalStaff = await User.count();
  const activeStaff = await User.count({
    where: { status: USER_STATUS.ACTIVE },
  });
  const inactiveStaff = await User.count({
    where: { status: USER_STATUS.INACTIVE },
  });
  const suspendedStaff = await User.count({
    where: { status: USER_STATUS.SUSPENDED },
  });

  const doctors = await User.count({ where: { role: ROLES.DOCTOR } });
  const dataClerks = await User.count({ where: { role: ROLES.DATA_CLERK } });
  const cashiers = await User.count({ where: { role: ROLES.CASHIER } });
  const staffManagers = await User.count({
    where: { role: ROLES.STAFF_MANAGER },
  });
  const superAdmins = await User.count({ where: { role: ROLES.SUPER_ADMIN } });

  return {
    total: totalStaff,
    active: activeStaff,
    inactive: inactiveStaff,
    suspended: suspendedStaff,
    byRole: {
      doctors,
      dataClerks,
      cashiers,
      staffManagers,
      superAdmins,
    },
  };
};
