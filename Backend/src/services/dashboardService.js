import {
  Patient,
  Visit,
  User,
  Medicine,
  Prescription,
  MedicineDispense,
} from "../models/index.js";
import { Op } from "sequelize";
import { VISIT_STATUS, MEDICINE_STATUS, ROLES } from "../config/constants.js";

export const getAdminDashboard = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const totalPatients = await Patient.count({ where: { isActive: true } });
  const todayPatients = await Visit.count({
    where: { visitDate: today.toISOString().split("T")[0] },
  });
  const totalDoctors = await User.count({ where: { role: ROLES.DOCTOR } });
  const totalStaff = await User.count();
  const todayVisits = await Visit.count({
    where: { visitDate: today.toISOString().split("T")[0] },
  });
  const completedVisits = await Visit.count({
    where: {
      visitDate: today.toISOString().split("T")[0],
      status: VISIT_STATUS.COMPLETED,
    },
  });
  const waitingPatients = await Visit.count({
    where: {
      visitDate: today.toISOString().split("T")[0],
      status: VISIT_STATUS.WAITING,
    },
  });

  const lowStockMedicines = await Medicine.count({
    where: { status: MEDICINE_STATUS.LOW_STOCK, isActive: true },
  });
  const expiredMedicines = await Medicine.count({
    where: { status: MEDICINE_STATUS.EXPIRED, isActive: true },
  });

  // Monthly visits trend (last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  return {
    summary: {
      totalPatients,
      todayPatients,
      totalDoctors,
      totalStaff,
      todayVisits,
      completedVisits,
      waitingPatients,
      lowStockMedicines,
      expiredMedicines,
    },
  };
};

export const getDoctorDashboard = async (doctorId) => {
  const today = new Date().toISOString().split("T")[0];

  const todayQueue = await Visit.count({
    where: {
      doctorId,
      visitDate: today,
      status: { [Op.in]: [VISIT_STATUS.WAITING, VISIT_STATUS.IN_CONSULTATION] },
    },
  });

  const todayCompleted = await Visit.count({
    where: {
      doctorId,
      visitDate: today,
      status: VISIT_STATUS.COMPLETED,
    },
  });

  const waitingPatients = await Visit.findAll({
    where: {
      doctorId,
      visitDate: today,
      status: VISIT_STATUS.WAITING,
    },
    include: [
      {
        model: Patient,
        as: "patient",
        attributes: [
          "id",
          "patientId",
          "firstName",
          "lastName",
          "age",
          "gender",
        ],
      },
    ],
    order: [["arrivalTime", "ASC"]],
    limit: 10,
  });

  const todayPrescriptions = await Prescription.count({
    where: {
      doctorId,
      prescribedDate: { [Op.gte]: new Date(today) },
    },
  });

  const todayDispensed = await MedicineDispense.count({
    where: {
      dispensedBy: doctorId,
      dispensedDate: { [Op.gte]: new Date(today) },
    },
  });

  return {
    todayQueue,
    todayCompleted,
    waitingPatients,
    todayPrescriptions,
    todayDispensed,
  };
};

export const getClerkDashboard = async () => {
  const today = new Date().toISOString().split("T")[0];

  const todayRegistrations = await Patient.count({
    where: {
      createdAt: { [Op.gte]: new Date(today) },
    },
  });

  const todayVisits = await Visit.count({
    where: { visitDate: today },
  });

  const waitingPatients = await Visit.count({
    where: {
      visitDate: today,
      status: VISIT_STATUS.WAITING,
    },
  });

  const recentPatients = await Patient.findAll({
    order: [["createdAt", "DESC"]],
    limit: 10,
    attributes: [
      "id",
      "patientId",
      "firstName",
      "lastName",
      "phone",
      "createdAt",
    ],
  });

  return {
    todayRegistrations,
    todayVisits,
    waitingPatients,
    recentPatients,
  };
};
