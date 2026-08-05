import { Op } from "sequelize";
import { BookingRequest, User, Visit } from "../models/index.js";
import { getPagination } from "../utils/helpers.js";

const httpError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

// Public: anyone can submit a booking request — no patient record exists
// yet, so there's nothing to authenticate against.
export const create = async (data) => {
  return BookingRequest.create({
    fullName: data.fullName,
    phone: data.phone,
    email: data.email || null,
    preferredDate: data.preferredDate,
    preferredTime: data.preferredTime || null,
    reason: data.reason || null,
  });
};

export const getAll = async (query) => {
  const { page = 1, pageSize = 10, status, search, sortBy = "createdAt", sortOrder = "DESC" } = query;
  const { limit, offset } = getPagination(page, pageSize);
  const where = {};

  if (status) where.status = status;
  if (search) {
    where[Op.or] = [
      { fullName: { [Op.iLike]: `%${search}%` } },
      { phone: { [Op.iLike]: `%${search}%` } },
      { email: { [Op.iLike]: `%${search}%` } },
    ];
  }

  const { count, rows } = await BookingRequest.findAndCountAll({
    where,
    limit,
    offset,
    order: [[sortBy, sortOrder]],
    include: [
      { model: User, as: "reviewer", attributes: ["id", "firstName", "lastName"] },
      { model: Visit, as: "convertedVisit", attributes: ["id", "visitNumber"] },
    ],
  });

  return {
    rows,
    pagination: { page: parseInt(page), pageSize: limit, totalItems: count },
  };
};

export const getById = async (id) => {
  const item = await BookingRequest.findByPk(id, {
    include: [
      { model: User, as: "reviewer", attributes: ["id", "firstName", "lastName"] },
      { model: Visit, as: "convertedVisit", attributes: ["id", "visitNumber"] },
    ],
  });
  if (!item) throw httpError("Booking request not found", 404);
  return item;
};

export const getPendingCount = async () => BookingRequest.count({ where: { status: "pending" } });

export const updateStatus = async (id, { status, staffNotes, convertedVisitId }, actor) => {
  const item = await BookingRequest.findByPk(id);
  if (!item) throw httpError("Booking request not found", 404);

  const payload = { reviewedBy: actor?.id };
  if (status) payload.status = status;
  if (staffNotes !== undefined) payload.staffNotes = staffNotes;
  if (convertedVisitId !== undefined) payload.convertedVisitId = convertedVisitId;

  await item.update(payload);
  return item;
};
