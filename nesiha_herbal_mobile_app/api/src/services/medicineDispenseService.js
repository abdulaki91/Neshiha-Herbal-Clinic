import {
  MedicineDispense,
  Patient,
  Medicine,
  Prescription,
} from "../models/index.js";
import { Op } from "sequelize";
import { getPagination } from "../utils/helpers.js";
import { ERROR_MESSAGES } from "../config/constants.js";

/**
 * Create medicine dispense record
 */
export const createDispense = async (data, dispensedBy) => {
  const {
    prescriptionId,
    patientId,
    medicineId,
    quantityDispensed,
    batchNumber,
    expiryDate,
    notes,
  } = data;

  // Verify prescription exists
  const prescription = await Prescription.findByPk(prescriptionId);
  if (!prescription) {
    throw new Error("Prescription not found");
  }

  // Verify patient exists
  const patient = await Patient.findByPk(patientId);
  if (!patient) {
    throw new Error("Patient not found");
  }

  // Verify medicine exists
  const medicine = await Medicine.findByPk(medicineId);
  if (!medicine) {
    throw new Error("Medicine not found");
  }

  // Check if quantity dispensed exceeds prescribed quantity
  if (quantityDispensed > prescription.quantity) {
    throw new Error("Quantity dispensed cannot exceed prescribed quantity");
  }

  // Create dispense record
  const dispense = await MedicineDispense.create({
    prescriptionId,
    patientId,
    medicineId,
    dispensedBy,
    quantityDispensed,
    batchNumber,
    expiryDate,
    notes,
    dispensedDate: new Date(),
  });

  return dispense;
};

/**
 * Get all dispense records
 */
export const getAllDispenses = async (query) => {
  const {
    page = 1,
    pageSize = 10,
    patientId,
    medicineId,
    visitId,
    dispensedBy,
    startDate,
    endDate,
    sortBy = "dispensedDate",
    sortOrder = "DESC",
  } = query;

  const { limit, offset } = getPagination(page, pageSize);

  const where = {};

  if (patientId) where.patientId = patientId;
  if (medicineId) where.medicineId = medicineId;
  if (visitId) where.visitId = visitId;
  if (dispensedBy) where.dispensedBy = dispensedBy;

  if (startDate && endDate) {
    where.dispensedDate = {
      [Op.between]: [new Date(startDate), new Date(endDate)],
    };
  } else if (startDate) {
    where.dispensedDate = {
      [Op.gte]: new Date(startDate),
    };
  } else if (endDate) {
    where.dispensedDate = {
      [Op.lte]: new Date(endDate),
    };
  }

  const { count, rows } = await MedicineDispense.findAndCountAll({
    where,
    limit,
    offset,
    order: [[sortBy, sortOrder]],
    include: [
      {
        model: Patient,
        as: "patient",
        attributes: ["id", "patientId", "firstName", "lastName", "phone"],
      },
      {
        model: Medicine,
        as: "medicine",
        attributes: ["id", "code", "name", "strength", "dosageForm"],
      },
      {
        model: Prescription,
        as: "prescription",
        attributes: ["id", "dosage", "frequency", "duration"],
      },
    ],
  });

  return {
    dispenses: rows,
    pagination: {
      page: parseInt(page),
      pageSize: limit,
      totalItems: count,
    },
  };
};

/**
 * Get dispense by ID
 */
export const getDispenseById = async (id) => {
  const dispense = await MedicineDispense.findByPk(id, {
    include: [
      {
        model: Patient,
        as: "patient",
      },
      {
        model: Medicine,
        as: "medicine",
      },
      {
        model: Prescription,
        as: "prescription",
      },
    ],
  });

  if (!dispense) {
    throw new Error(ERROR_MESSAGES.NOT_FOUND);
  }

  return dispense;
};

/**
 * Get dispenses by patient
 */
export const getDispensesByPatient = async (patientId, query = {}) => {
  const {
    page = 1,
    pageSize = 10,
    sortBy = "dispensedDate",
    sortOrder = "DESC",
  } = query;

  const { limit, offset } = getPagination(page, pageSize);

  const { count, rows } = await MedicineDispense.findAndCountAll({
    where: { patientId },
    limit,
    offset,
    order: [[sortBy, sortOrder]],
    include: [
      {
        model: Medicine,
        as: "medicine",
        attributes: ["id", "code", "name", "strength", "dosageForm"],
      },
      {
        model: Prescription,
        as: "prescription",
        attributes: ["id", "dosage", "frequency", "duration"],
      },
    ],
  });

  return {
    dispenses: rows,
    pagination: {
      page: parseInt(page),
      pageSize: limit,
      totalItems: count,
    },
  };
};

/**
 * Get dispenses by prescription
 */
export const getDispensesByPrescription = async (prescriptionId) => {
  const dispenses = await MedicineDispense.findAll({
    where: { prescriptionId },
    order: [["dispensedDate", "DESC"]],
    include: [
      {
        model: Medicine,
        as: "medicine",
        attributes: ["id", "code", "name", "strength", "dosageForm"],
      },
    ],
  });

  return dispenses;
};
