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
 * Look up an active (non-deleted) staff member or throw 404.
 * Deleted staff are hidden everywhere except direct DB inspection.
 */
const findStaffOrThrow = async (id) => {
  const staff = await User.findOne({ where: { id, deletedAt: null } });

  if (!staff) {
    throw httpError(ERROR_MESSAGES.NOT_FOUND, 404);
  }

  return staff;
};

/**
 * Create new staff member
 */
export const createStaff = async (data, actor) => {
  assertMayManageRole(actor, data.role);

  // Check if email already exists (a deleted staff member's email is free to reuse)
  const existingUser = await User.findOne({
    where: { email: data.email, deletedAt: null },
  });
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

  // Deleted staff never appear in listings
  const where = { deletedAt: null };

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
  const staff = await User.findOne({
    where: { id, deletedAt: null },
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
  const staff = await findStaffOrThrow(id);

  // A non-super-admin may neither promote to nor edit a super admin account
  if (data.role) assertMayManageRole(actor, data.role);
  assertMayManageRole(actor, staff.role);

  // Don't allow email change if it exists for another (non-deleted) user
  if (data.email && data.email !== staff.email) {
    const existingUser = await User.findOne({
      where: {
        email: data.email,
        id: { [Op.ne]: id },
        deletedAt: null,
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
 * Delete staff (soft delete - hidden from listings, row kept for FK integrity
 * with visits/prescriptions/payments/audit logs)
 */
export const deleteStaff = async (id, actor) => {
  const staff = await findStaffOrThrow(id);

  assertMayManageRole(actor, staff.role);

  if (actor?.id && staff.id === actor.id) {
    throw httpError("You cannot delete your own account", 400);
  }

  await staff.update({
    status: USER_STATUS.INACTIVE,
    refreshToken: null,
    deletedAt: new Date(),
  });

  return { message: "Staff deleted successfully" };
};

/**
 * Activate staff
 */
export const activateStaff = async (id, actor) => {
  const staff = await findStaffOrThrow(id);

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
  const staff = await findStaffOrThrow(id);

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
  const staff = await findStaffOrThrow(id);

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
  const [
    totalStaff,
    activeStaff,
    inactiveStaff,
    suspendedStaff,
    doctors,
    dataClerks,
    cashiers,
    staffManagers,
    superAdmins,
  ] = await Promise.all([
    User.count({ where: { deletedAt: null } }),
    User.count({ where: { deletedAt: null, status: USER_STATUS.ACTIVE } }),
    User.count({ where: { deletedAt: null, status: USER_STATUS.INACTIVE } }),
    User.count({ where: { deletedAt: null, status: USER_STATUS.SUSPENDED } }),
    User.count({ where: { deletedAt: null, role: ROLES.DOCTOR } }),
    User.count({ where: { deletedAt: null, role: ROLES.DATA_CLERK } }),
    User.count({ where: { deletedAt: null, role: ROLES.CASHIER } }),
    User.count({ where: { deletedAt: null, role: ROLES.STAFF_MANAGER } }),
    User.count({ where: { deletedAt: null, role: ROLES.SUPER_ADMIN } }),
  ]);

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
