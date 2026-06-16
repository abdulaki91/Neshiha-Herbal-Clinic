import {
  Prescription,
  MedicineDispense,
  Medicine,
  Patient,
  Visit,
  User,
} from "../models/index.js";
import { Op } from "sequelize";
import { getPagination } from "../utils/helpers.js";
import { ERROR_MESSAGES, PRESCRIPTION_STATUS } from "../config/constants.js";
import sequelize from "../config/database.js";

export const createPrescription = async (data, doctorId) => {
  const { visitId, patientId, medicineId, quantity } = data;

  // Verify medicine has sufficient stock
  const medicine = await Medicine.findByPk(medicineId);
  if (!medicine) throw new Error("Medicine not found");
  if (medicine.availableQuantity < quantity) {
    throw new Error("Insufficient medicine stock");
  }

  const prescription = await Prescription.create({
    ...data,
    doctorId,
    createdBy: doctorId,
  });

  return prescription;
};

export const getAllPrescriptions = async (query) => {
  const {
    page = 1,
    pageSize = 10,
    patientId,
    doctorId,
    status,
    sortBy = "prescribedDate",
    sortOrder = "DESC",
  } = query;

  const { limit, offset } = getPagination(page, pageSize);
  const where = {};

  if (patientId) where.patientId = patientId;
  if (doctorId) where.doctorId = doctorId;
  if (status) where.status = status;

  const { count, rows } = await Prescription.findAndCountAll({
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
        model: Medicine,
        as: "medicine",
        attributes: ["id", "medicineId", "name", "strength"],
      },
      {
        model: User,
        as: "doctor",
        attributes: ["id", "firstName", "lastName"],
      },
    ],
  });

  return {
    prescriptions: rows,
    pagination: { page: parseInt(page), pageSize: limit, totalItems: count },
  };
};

export const getPrescriptionById = async (id) => {
  const prescription = await Prescription.findByPk(id, {
    include: [
      { model: Patient, as: "patient" },
      { model: Medicine, as: "medicine" },
      {
        model: User,
        as: "doctor",
        attributes: ["id", "firstName", "lastName"],
      },
      { model: Visit, as: "visit" },
    ],
  });

  if (!prescription) throw new Error(ERROR_MESSAGES.NOT_FOUND);
  return prescription;
};

export const dispenseMedicine = async (
  prescriptionId,
  quantity,
  dispensedBy,
) => {
  const transaction = await sequelize.transaction();

  try {
    const prescription = await Prescription.findByPk(prescriptionId, {
      transaction,
    });
    if (!prescription) throw new Error("Prescription not found");

    const medicine = await Medicine.findByPk(prescription.medicineId, {
      transaction,
    });
    if (!medicine) throw new Error("Medicine not found");
    if (medicine.availableQuantity < quantity) {
      throw new Error("Insufficient medicine stock");
    }

    // Update medicine stock
    await medicine.update(
      { availableQuantity: medicine.availableQuantity - quantity },
      { transaction },
    );

    // Create dispense record
    const dispense = await MedicineDispense.create(
      {
        prescriptionId: prescription.id,
        patientId: prescription.patientId,
        medicineId: prescription.medicineId,
        visitId: prescription.visitId,
        dispensedBy,
        quantity,
        dosage: prescription.dosage,
        frequency: prescription.frequency,
        route: prescription.route,
        duration: prescription.duration,
        instructions: prescription.instructions,
        reason: prescription.reason,
        batchNumber: medicine.batchNumber,
        expiryDate: medicine.expiryDate,
      },
      { transaction },
    );

    // Update prescription status
    await prescription.update(
      {
        status: PRESCRIPTION_STATUS.DISPENSED,
        dispensedDate: new Date(),
        dispensedBy,
      },
      { transaction },
    );

    await transaction.commit();
    return { prescription, dispense };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

export const stopPrescription = async (prescriptionId, reason, doctorId) => {
  const prescription = await Prescription.findByPk(prescriptionId);
  if (!prescription) throw new Error(ERROR_MESSAGES.NOT_FOUND);

  await prescription.update({
    status: PRESCRIPTION_STATUS.STOPPED,
    stoppedDate: new Date(),
    stoppedReason: reason,
    updatedBy: doctorId,
  });

  return prescription;
};
