import { Medicine, User } from "../models/index.js";
import { Op } from "sequelize";
import { getPagination, isExpired } from "../utils/helpers.js";
import { ERROR_MESSAGES, MEDICINE_STATUS } from "../config/constants.js";
import sequelize from "../config/database.js";
import { emitLowStockAlert } from "../config/socket.js";
import * as notificationService from "./notificationService.js";

/**
 * Called after any operation that reduces stock (manual adjustment,
 * dispensing). Only alerts on the transition INTO low/out-of-stock —
 * without the previousStatus check, every dispense of an already-low item
 * would re-notify every admin, which trains people to ignore the alert.
 */
export const alertIfLowStock = (medicine, previousStatus) => {
  const isLowOrOut =
    medicine.status === MEDICINE_STATUS.LOW_STOCK ||
    medicine.status === MEDICINE_STATUS.OUT_OF_STOCK;

  if (!isLowOrOut || medicine.status === previousStatus) return;

  emitLowStockAlert(medicine);

  notificationService.notifyRole("super_admin", {
    type: "low_stock",
    title:
      medicine.status === MEDICINE_STATUS.OUT_OF_STOCK
        ? "Medicine out of stock"
        : "Medicine running low",
    message: `${medicine.name} — ${medicine.availableQuantity} unit(s) remaining`,
    priority: medicine.status === MEDICINE_STATUS.OUT_OF_STOCK ? "urgent" : "high",
    link: "/portal/medicines",
    metadata: { medicineId: medicine.id },
  });
};

export const createMedicine = async (data, createdBy) => {
  const medicine = await Medicine.create({ ...data, createdBy });
  return medicine;
};

export const getAllMedicines = async (query) => {
  const {
    page = 1,
    pageSize = 10,
    search,
    category,
    status,
    sortBy = "name",
    sortOrder = "ASC",
  } = query;

  const { limit, offset } = getPagination(page, pageSize);
  const where = { isActive: true };

  if (category) where.category = category;
  if (status) where.status = status;

  if (search) {
    where[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { genericName: { [Op.like]: `%${search}%` } },
      { code: { [Op.like]: `%${search}%` } },
      { barcode: { [Op.like]: `%${search}%` } },
    ];
  }

  const { count, rows } = await Medicine.findAndCountAll({
    where,
    limit,
    offset,
    order: [[sortBy, sortOrder]],
  });

  return {
    medicines: rows,
    pagination: { page: parseInt(page), pageSize: limit, totalItems: count },
  };
};

export const getMedicineById = async (id) => {
  const medicine = await Medicine.findByPk(id);
  if (!medicine) throw new Error(ERROR_MESSAGES.NOT_FOUND);
  return medicine;
};

export const updateMedicine = async (id, data, updatedBy) => {
  const medicine = await Medicine.findByPk(id);
  if (!medicine) throw new Error(ERROR_MESSAGES.NOT_FOUND);
  await medicine.update({ ...data, updatedBy });
  return medicine;
};

export const deleteMedicine = async (id) => {
  const medicine = await Medicine.findByPk(id);
  if (!medicine) throw new Error(ERROR_MESSAGES.NOT_FOUND);
  await medicine.update({ isActive: false });
  return { message: "Medicine deleted successfully" };
};

export const adjustStock = async (id, quantity, type, updatedBy) => {
  const medicine = await Medicine.findByPk(id);
  if (!medicine) throw new Error(ERROR_MESSAGES.NOT_FOUND);

  const newQuantity =
    type === "add"
      ? medicine.availableQuantity + quantity
      : medicine.availableQuantity - quantity;

  if (newQuantity < 0) throw new Error("Insufficient stock");

  const previousStatus = medicine.status;
  await medicine.update({ availableQuantity: newQuantity, updatedBy });
  alertIfLowStock(medicine, previousStatus);
  return medicine;
};

export const getLowStockMedicines = async () => {
  return await Medicine.findAll({
    where: {
      isActive: true,
      availableQuantity: { [Op.lte]: sequelize.col("minimum_stock") },
    },
  });
};

export const getExpiredMedicines = async () => {
  return await Medicine.findAll({
    where: {
      isActive: true,
      expiryDate: { [Op.lt]: new Date() },
    },
  });
};

export const getMedicineStats = async () => {
  const total = await Medicine.count({ where: { isActive: true } });
  const available = await Medicine.count({
    where: { status: MEDICINE_STATUS.AVAILABLE },
  });
  const lowStock = await Medicine.count({
    where: { status: MEDICINE_STATUS.LOW_STOCK },
  });
  const outOfStock = await Medicine.count({
    where: { status: MEDICINE_STATUS.OUT_OF_STOCK },
  });
  const expired = await Medicine.count({
    where: { status: MEDICINE_STATUS.EXPIRED },
  });

  return { total, available, lowStock, outOfStock, expired };
};
