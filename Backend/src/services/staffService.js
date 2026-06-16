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
export const deleteStaff = async (id) => {
  const staff = await User.findByPk(id);

  if (!staff) {
    throw new Error(ERROR_MESSAGES.NOT_FOUND);
  }

  await staff.update({ status: USER_STATUS.INACTIVE });

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

  await staff.update({ status: USER_STATUS.ACTIVE });

  return staff.toJSON();
};

/**
 * Deactivate staff
 */
export const deactivateStaff = async (id) => {
  const staff = await User.findByPk(id);

  if (!staff) {
    throw new Error(ERROR_MESSAGES.NOT_FOUND);
  }

  await staff.update({ status: USER_STATUS.INACTIVE });

  return staff.toJSON();
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

  const doctors = await User.count({ where: { role: ROLES.DOCTOR } });
  const dataClerks = await User.count({ where: { role: ROLES.DATA_CLERK } });
  const staffManagers = await User.count({
    where: { role: ROLES.STAFF_MANAGER },
  });
  const superAdmins = await User.count({ where: { role: ROLES.SUPER_ADMIN } });

  return {
    total: totalStaff,
    active: activeStaff,
    inactive: inactiveStaff,
    byRole: {
      doctors,
      dataClerks,
      staffManagers,
      superAdmins,
    },
  };
};
