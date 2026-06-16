import {
  Patient,
  Visit,
  Medicine,
  Prescription,
  MedicineDispense,
  User,
} from "../models/index.js";
import { Op } from "sequelize";
import sequelize from "../config/database.js";

export const getPatientReport = async (query) => {
  const { startDate, endDate, gender, bloodGroup } = query;

  const where = { isActive: true };

  if (startDate && endDate) {
    where.createdAt = {
      [Op.between]: [new Date(startDate), new Date(endDate)],
    };
  }
  if (gender) where.gender = gender;
  if (bloodGroup) where.bloodGroup = bloodGroup;

  const patients = await Patient.findAll({
    where,
    order: [["createdAt", "DESC"]],
  });

  const summary = {
    total: patients.length,
    male: patients.filter((p) => p.gender === "male").length,
    female: patients.filter((p) => p.gender === "female").length,
  };

  return { patients, summary };
};

export const getVisitReport = async (query) => {
  const { startDate, endDate, doctorId, status } = query;

  const where = {};

  if (startDate && endDate) {
    where.visitDate = { [Op.between]: [startDate, endDate] };
  }
  if (doctorId) where.doctorId = doctorId;
  if (status) where.status = status;

  const visits = await Visit.findAll({
    where,
    include: [
      {
        model: Patient,
        as: "patient",
        attributes: ["id", "patientId", "firstName", "lastName"],
      },
      {
        model: User,
        as: "doctor",
        attributes: ["id", "firstName", "lastName"],
      },
    ],
    order: [["visitDate", "DESC"]],
  });

  const summary = {
    total: visits.length,
    completed: visits.filter((v) => v.status === "completed").length,
    cancelled: visits.filter((v) => v.status === "cancelled").length,
  };

  return { visits, summary };
};

export const getMedicineReport = async (query) => {
  const { category, status } = query;

  const where = { isActive: true };
  if (category) where.category = category;
  if (status) where.status = status;

  const medicines = await Medicine.findAll({ where, order: [["name", "ASC"]] });

  const summary = {
    total: medicines.length,
    totalValue: medicines.reduce(
      (sum, m) => sum + (m.availableQuantity * m.sellingPrice || 0),
      0,
    ),
    lowStock: medicines.filter((m) => m.status === "low_stock").length,
    expired: medicines.filter((m) => m.status === "expired").length,
  };

  return { medicines, summary };
};

export const getDailyReport = async (
  date = new Date().toISOString().split("T")[0],
) => {
  const visitCount = await Visit.count({ where: { visitDate: date } });
  const patientCount = await Patient.count({
    where: { createdAt: { [Op.gte]: new Date(date) } },
  });
  const prescriptionCount = await Prescription.count({
    where: { prescribedDate: { [Op.gte]: new Date(date) } },
  });
  const dispensedCount = await MedicineDispense.count({
    where: { dispensedDate: { [Op.gte]: new Date(date) } },
  });

  return {
    date,
    visitCount,
    patientCount,
    prescriptionCount,
    dispensedCount,
  };
};

export const getMonthlyReport = async (year, month) => {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  const visitCount = await Visit.count({
    where: { visitDate: { [Op.between]: [startDate, endDate] } },
  });

  const patientCount = await Patient.count({
    where: { createdAt: { [Op.between]: [startDate, endDate] } },
  });

  return { year, month, visitCount, patientCount };
};

export const getYearlyReport = async (year) => {
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31);

  const visitCount = await Visit.count({
    where: { visitDate: { [Op.between]: [startDate, endDate] } },
  });

  const patientCount = await Patient.count({
    where: { createdAt: { [Op.between]: [startDate, endDate] } },
  });

  return { year, visitCount, patientCount };
};
