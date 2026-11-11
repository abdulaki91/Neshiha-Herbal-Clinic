import {
  Patient,
  Visit,
  Medicine,
  Prescription,
  MedicineDispense,
  Payment,
  RegistrationPayment,
  User,
} from "../models/index.js";
import { Op } from "sequelize";
import sequelize from "../config/database.js";

export const getPatientReport = async (query) => {
  const { startDate, endDate, gender } = query;

  const where = { isActive: true };

  if (startDate && endDate) {
    where.createdAt = {
      [Op.between]: [new Date(startDate), new Date(endDate)],
    };
  }
  if (gender) where.gender = gender;

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

/**
 * Get the structured financial report for a period: consultation/
 * prescription payments and patient registration fees are two distinct
 * revenue sources (different collectors, different flows — see
 * RegistrationPayment.js), so they're reported as separate, clearly
 * labeled sections rather than blended into one number, alongside a grand
 * total for the period.
 * @param {string} period - "daily", "weekly", or "monthly"
 * @param {string} date - reference date (ISO format), defaults to today
 */
export const getRevenueReport = async (period = "daily", date) => {
  const refDate = date ? new Date(date) : new Date();
  let startDate, endDate;

  if (period === "daily") {
    startDate = new Date(refDate);
    startDate.setHours(0, 0, 0, 0);
    endDate = new Date(refDate);
    endDate.setHours(23, 59, 59, 999);
  } else if (period === "weekly") {
    const day = refDate.getDay();
    startDate = new Date(refDate);
    startDate.setDate(refDate.getDate() - day);
    startDate.setHours(0, 0, 0, 0);
    endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    endDate.setHours(23, 59, 59, 999);
  } else if (period === "monthly") {
    startDate = new Date(refDate.getFullYear(), refDate.getMonth(), 1);
    endDate = new Date(refDate.getFullYear(), refDate.getMonth() + 1, 0);
    endDate.setHours(23, 59, 59, 999);
  }

  const [payments, registrationFees] = await Promise.all([
    Payment.findAll({
      where: {
        paidAt: { [Op.between]: [startDate, endDate] },
        status: "paid",
      },
      include: [
        {
          model: Patient,
          as: "patient",
          attributes: ["id", "patientId", "firstName", "lastName", "phone"],
        },
        {
          model: Visit,
          as: "visit",
          attributes: ["id", "visitNumber", "visitDate"],
        },
        {
          model: User,
          as: "cashier",
          attributes: ["id", "firstName", "lastName"],
        },
      ],
      order: [["paidAt", "DESC"]],
    }),
    RegistrationPayment.findAll({
      where: { paidAt: { [Op.between]: [startDate, endDate] } },
      include: [
        {
          model: Patient,
          as: "patient",
          attributes: ["id", "patientId", "firstName", "lastName", "phone"],
        },
        {
          model: User,
          as: "receivedByUser",
          attributes: ["id", "firstName", "lastName"],
        },
      ],
      order: [["paidAt", "DESC"]],
    }),
  ]);

  const consultationRevenue = payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
  const registrationFeeRevenue = registrationFees.reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);

  // Group by day for chart data — one merged timeline covering both
  // revenue sources, so the day-by-day trend reflects total clinic income.
  const dayTotals = {};
  const dayEntry = (day) =>
    (dayTotals[day] ||= { consultationRevenue: 0, registrationFeeRevenue: 0 });
  for (const p of payments) {
    const day = new Date(p.paidAt).toISOString().split("T")[0];
    dayEntry(day).consultationRevenue += parseFloat(p.amount || 0);
  }
  for (const r of registrationFees) {
    const day = new Date(r.paidAt).toISOString().split("T")[0];
    dayEntry(day).registrationFeeRevenue += parseFloat(r.amount || 0);
  }

  // Payment method breakdowns, kept separate per source — "cash" from a
  // registration fee and "cash" from a prescription payment are still
  // worth distinguishing in a structured report.
  const byPaymentMethod = {};
  for (const p of payments) {
    const method = p.paymentMethod || "other";
    byPaymentMethod[method] = (byPaymentMethod[method] || 0) + parseFloat(p.amount || 0);
  }
  const registrationByPaymentMethod = {};
  for (const r of registrationFees) {
    const method = r.paymentMethod || "other";
    registrationByPaymentMethod[method] =
      (registrationByPaymentMethod[method] || 0) + parseFloat(r.amount || 0);
  }

  const round = (n) => Math.round(n * 100) / 100;

  return {
    period,
    startDate: startDate.toISOString().split("T")[0],
    endDate: endDate.toISOString().split("T")[0],
    summary: {
      grandTotal: round(consultationRevenue + registrationFeeRevenue),
      consultationRevenue: round(consultationRevenue),
      registrationFeeRevenue: round(registrationFeeRevenue),
      totalPayments: payments.length,
      totalRegistrations: registrationFees.length,
      byPaymentMethod,
      registrationByPaymentMethod,
    },
    revenueByDay: Object.entries(dayTotals)
      .map(([day, totals]) => ({
        day,
        consultationRevenue: round(totals.consultationRevenue),
        registrationFeeRevenue: round(totals.registrationFeeRevenue),
        total: round(totals.consultationRevenue + totals.registrationFeeRevenue),
      }))
      .sort((a, b) => a.day.localeCompare(b.day)),
    payments: payments.map((p) => ({
      id: p.id,
      paymentNumber: p.paymentNumber,
      amount: parseFloat(p.amount || 0),
      paymentMethod: p.paymentMethod,
      paidAt: p.paidAt,
      transactionId: p.transactionId,
      patient: p.patient,
      visit: p.visit,
      cashier: p.cashier,
    })),
    registrationFees: registrationFees.map((r) => ({
      id: r.id,
      amount: parseFloat(r.amount || 0),
      paymentMethod: r.paymentMethod,
      paidAt: r.paidAt,
      transactionId: r.transactionId,
      patient: r.patient,
      receivedBy: r.receivedByUser,
    })),
  };
};
