import { User } from "../models/index.js";
import { ROLES, USER_STATUS, ERROR_MESSAGES } from "../config/constants.js";
import { Op } from "sequelize";
import { getPagination } from "../utils/helpers.js";

// errorHandler reads err.statusCode, otherwise everything surfaces as a 500
const httpError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

/**
 * Only a super admin may create, modify or promote to the super_admin role.
 * Without this, a staff manager — who is authorized on the staff endpoints —
 * could promote themselves by posting role: "super_admin".
 */
const assertMayManageRole = (actor, targetRole) => {
  if (targetRole === ROLES.SUPER_ADMIN && actor?.role !== ROLES.SUPER_ADMIN) {
    throw httpError(
      "Only a super admin can manage super admin accounts",
      403,
    );
  }
};

/**
 * Create new staff member
 */
export const createStaff = async (data, actor) => {
  assertMayManageRole(actor, data.role);

  // Check if email already exists
  const existingUser = await User.findOne({ where: { email: data.email } });
  if (existingUser) {
    throw httpError("Email already exists", 409);
  }

  // Create user
  const staff = await User.create({
    ...data,
    createdBy: actor?.id,
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
    throw httpError(ERROR_MESSAGES.NOT_FOUND, 404);
  }

  return staff;
};

/**
 * Update staff
 */
export const updateStaff = async (id, data, actor) => {
  const staff = await User.findByPk(id);

  if (!staff) {
    throw httpError(ERROR_MESSAGES.NOT_FOUND, 404);
  }

  // A non-super-admin may neither promote to nor edit a super admin account
  if (data.role) assertMayManageRole(actor, data.role);
  assertMayManageRole(actor, staff.role);

  // Don't allow email change if it exists for another user
  if (data.email && data.email !== staff.email) {
    const existingUser = await User.findOne({
      where: {
        email: data.email,
        id: { [Op.ne]: id },
      },
    });

    if (existingUser) {
      throw httpError("Email already exists", 409);
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
    updatedBy: actor?.id,
  });

  return staff.toJSON();
};

/**
 * Delete staff (soft delete - set to inactive)
 */
export const deleteStaff = async (id, actor) => {
  const staff = await User.findByPk(id);

  if (!staff) {
    throw httpError(ERROR_MESSAGES.NOT_FOUND, 404);
  }

  assertMayManageRole(actor, staff.role);

  if (actor?.id && staff.id === actor.id) {
    throw httpError("You cannot delete your own account", 400);
  }

  await staff.update({ status: USER_STATUS.INACTIVE, refreshToken: null });

  return { message: "Staff deleted successfully" };
};

/**
 * Activate staff
 */
export const activateStaff = async (id, actor) => {
  const staff = await User.findByPk(id);

  if (!staff) {
    throw httpError(ERROR_MESSAGES.NOT_FOUND, 404);
  }

  assertMayManageRole(actor, staff.role);

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
export const deactivateStaff = async (id, actor) => {
  const staff = await User.findByPk(id);

  if (!staff) {
    throw httpError(ERROR_MESSAGES.NOT_FOUND, 404);
  }

  assertMayManageRole(actor, staff.role);

  if (actor?.id && staff.id === actor.id) {
    throw httpError("You cannot deactivate your own account", 400);
  }

  // Drop the refresh token so existing sessions cannot be renewed
  await staff.update({ status: USER_STATUS.INACTIVE, refreshToken: null });

  return staff.toJSON();
};

/**
 * Reset a staff member's password (admin initiated)
 */
export const resetStaffPassword = async (id, password, actor) => {
  const staff = await User.findByPk(id);

  if (!staff) {
    throw httpError(ERROR_MESSAGES.NOT_FOUND, 404);
  }

  // A staff manager must not be able to seize a super admin account
  assertMayManageRole(actor, staff.role);

  // Password is hashed by the User model's beforeUpdate hook
  await staff.update({
    password,
    updatedBy: actor?.id,
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
