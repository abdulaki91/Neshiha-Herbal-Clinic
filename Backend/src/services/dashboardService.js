import {
  Patient,
  Visit,
  User,
  Medicine,
  Prescription,
  MedicineDispense,
  Payment,
} from "../models/index.js";
import { Op } from "sequelize";
import { VISIT_STATUS, MEDICINE_STATUS, ROLES } from "../config/constants.js";

export const getAdminDashboard = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split("T")[0];

  // These nine counts are all independent reads — running them in parallel
  // turns nine sequential round trips into one, which is most of what made
  // the dashboard (the very first thing every user sees) slow to load
  const [
    totalPatients,
    todayPatients,
    totalDoctors,
    totalStaff,
    todayVisits,
    completedVisits,
    waitingPatients,
    lowStockMedicines,
    expiredMedicines,
  ] = await Promise.all([
    Patient.count({ where: { isActive: true } }),
    Visit.count({ where: { visitDate: todayStr } }),
    User.count({ where: { role: ROLES.DOCTOR } }),
    User.count(),
    Visit.count({ where: { visitDate: todayStr } }),
    Visit.count({
      where: { visitDate: todayStr, status: VISIT_STATUS.COMPLETED },
    }),
    Visit.count({
      where: { visitDate: todayStr, status: VISIT_STATUS.WAITING },
    }),
    Medicine.count({
      where: { status: MEDICINE_STATUS.LOW_STOCK, isActive: true },
    }),
    Medicine.count({
      where: { status: MEDICINE_STATUS.EXPIRED, isActive: true },
    }),
  ]);

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

  const [
    todayQueue,
    todayCompleted,
    waitingPatients,
    todayPrescriptions,
    todayDispensed,
  ] = await Promise.all([
    Visit.count({
      where: {
        doctorId,
        visitDate: today,
        status: {
          [Op.in]: [VISIT_STATUS.WAITING, VISIT_STATUS.IN_CONSULTATION],
        },
      },
    }),
    Visit.count({
      where: { doctorId, visitDate: today, status: VISIT_STATUS.COMPLETED },
    }),
    Visit.findAll({
      where: { doctorId, visitDate: today, status: VISIT_STATUS.WAITING },
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
    }),
    Prescription.count({
      where: { doctorId, prescribedDate: { [Op.gte]: new Date(today) } },
    }),
    MedicineDispense.count({
      where: {
        dispensedBy: doctorId,
        dispensedDate: { [Op.gte]: new Date(today) },
      },
    }),
  ]);

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

  const [todayRegistrations, todayVisits, waitingPatients, recentPatients] =
    await Promise.all([
      Patient.count({ where: { createdAt: { [Op.gte]: new Date(today) } } }),
      Visit.count({ where: { visitDate: today } }),
      Visit.count({ where: { visitDate: today, status: VISIT_STATUS.WAITING } }),
      Patient.findAll({
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
      }),
    ]);

  return {
    todayRegistrations,
    todayVisits,
    waitingPatients,
    recentPatients,
  };
};

// Revenue/financial totals are doctor-only (see reportRoutes.js's
// /reports/revenue) — this dashboard intentionally returns operational
// counts only, no monetary aggregates, even though a cashier processes
// the payments themselves.
export const getCashierDashboard = async () => {
  const today = new Date().toISOString().split("T")[0];

  const [pendingPayments, todayPaymentsCount, recentPayments] =
    await Promise.all([
      Visit.count({ where: { status: VISIT_STATUS.PENDING_PAYMENT } }),
      Payment.count({ where: { paidAt: { [Op.gte]: new Date(today) } } }),
      Payment.findAll({
        order: [["paidAt", "DESC"]],
        limit: 10,
        include: [
          {
            model: Patient,
            as: "patient",
            attributes: ["id", "patientId", "firstName", "lastName"],
          },
        ],
      }),
    ]);

  return {
    pendingPayments,
    todayPaymentsCount,
    recentPayments,
  };
};
