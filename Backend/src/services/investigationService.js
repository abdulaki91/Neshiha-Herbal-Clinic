import { Investigation, Patient, Visit, User } from "../models/index.js";
import { Op } from "sequelize";
import { getPagination } from "../utils/helpers.js";
import { ERROR_MESSAGES, INVESTIGATION_STATUS } from "../config/constants.js";

export const createInvestigation = async (data, requestedBy) => {
  const investigation = await Investigation.create({
    ...data,
    requestedBy,
    createdBy: requestedBy,
  });
  return investigation;
};

export const getAllInvestigations = async (query) => {
  const {
    page = 1,
    pageSize = 10,
    patientId,
    visitId,
    status,
    urgency,
    sortBy = "requestedDate",
    sortOrder = "DESC",
  } = query;

  const { limit, offset } = getPagination(page, pageSize);
  const where = {};

  if (patientId) where.patientId = patientId;
  if (visitId) where.visitId = visitId;
  if (status) where.status = status;
  if (urgency) where.urgency = urgency;

  const { count, rows } = await Investigation.findAndCountAll({
    where,
    limit,
    offset,
    order: [[sortBy, sortOrder]],
    include: [
      {
        model: Patient,
        as: "patient",
        attributes: ["id", "patientId", "firstName", "lastName"],
      },
      {
        model: Visit,
        as: "visit",
        attributes: ["id", "visitNumber", "visitDate"],
      },
      {
        model: User,
        as: "requestedByUser",
        attributes: ["id", "firstName", "lastName"],
      },
    ],
  });

  return {
    investigations: rows,
    pagination: { page: parseInt(page), pageSize: limit, totalItems: count },
  };
};

export const getInvestigationById = async (id) => {
  const investigation = await Investigation.findByPk(id, {
    include: [
      { model: Patient, as: "patient" },
      { model: Visit, as: "visit" },
      {
        model: User,
        as: "requestedByUser",
        attributes: ["id", "firstName", "lastName"],
      },
      {
        model: User,
        as: "reviewedByUser",
        attributes: ["id", "firstName", "lastName"],
      },
    ],
  });

  if (!investigation) throw new Error(ERROR_MESSAGES.NOT_FOUND);
  return investigation;
};

export const updateInvestigation = async (id, data, updatedBy) => {
  const investigation = await Investigation.findByPk(id);
  if (!investigation) throw new Error(ERROR_MESSAGES.NOT_FOUND);

  await investigation.update({ ...data, updatedBy });
  return investigation;
};

export const addResults = async (id, results, resultFile, reviewedBy) => {
  const investigation = await Investigation.findByPk(id);
  if (!investigation) throw new Error(ERROR_MESSAGES.NOT_FOUND);

  await investigation.update({
    results,
    resultFile,
    status: INVESTIGATION_STATUS.COMPLETED,
    completedDate: new Date(),
    reviewedBy,
    updatedBy: reviewedBy,
  });

  return investigation;
};
