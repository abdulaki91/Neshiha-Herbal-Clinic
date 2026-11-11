import {
  Payment,
  Visit,
  Prescription,
  MedicineDispense,
  Patient,
  Medicine,
  User,
  sequelize,
} from "../models/index.js";
import {
  VISIT_STATUS,
  PRESCRIPTION_STATUS,
  ERROR_MESSAGES,
} from "../config/constants.js";
import { generatePaymentNumber, getPagination } from "../utils/helpers.js";
import { Op } from "sequelize";

/**
 * Get all pending payments (visits with pending_payment status)
 */
export const getPendingPayments = async (query) => {
  const { page = 1, pageSize = 10, search } = query;
  const { limit, offset } = getPagination(page, pageSize);

  const where = { status: VISIT_STATUS.PENDING_PAYMENT };

  const { count, rows } = await Visit.findAndCountAll({
    where,
    limit,
    offset,
    order: [["updatedAt", "DESC"]],
    include: [
      {
        model: Patient,
        as: "patient",
        attributes: ["id", "patientId", "firstName", "lastName", "phone"],
        where: search
          ? {
              [Op.or]: [
                { firstName: { [Op.like]: `%${search}%` } },
                { lastName: { [Op.like]: `%${search}%` } },
                { patientId: { [Op.like]: `%${search}%` } },
              ],
            }
          : undefined,
      },
      {
        model: Prescription,
        as: "prescriptions",
        attributes: ["id", "quantity", "unitPrice", "totalAmount", "status", "dosage", "frequency", "route", "duration", "instructions"],
        include: [
          {
            model: Medicine,
            as: "medicine",
            attributes: ["id", "name", "sellingPrice", "strength"],
          },
        ],
      },
      {
        model: User,
        as: "doctor",
        attributes: ["id", "firstName", "lastName"],
      },
    ],
  });

  return {
    visits: rows,
    pagination: {
      page: parseInt(page),
      pageSize: limit,
      totalItems: count,
    },
  };
};

/**
 * Get payment details by visit ID
 */
export const getPaymentDetails = async (visitId) => {
  const visit = await Visit.findByPk(visitId, {
    include: [
      {
        model: Patient,
        as: "patient",
      },
      {
        model: Prescription,
        as: "prescriptions",
        include: [
          {
            model: Medicine,
            as: "medicine",
          },
        ],
      },
    ],
  });

  if (!visit) {
    throw new Error(ERROR_MESSAGES.NOT_FOUND);
  }

  return visit;
};

/**
 * Process payment
 */
export const processPayment = async (visitId, paymentData, cashierId) => {
  const transaction = await sequelize.transaction();

  try {
    const visit = await Visit.findByPk(visitId, {
      include: [{ model: Prescription, as: "prescriptions" }],
      transaction,
    });

    if (!visit) {
      throw new Error(ERROR_MESSAGES.NOT_FOUND);
    }

    // Create payment record
    const payment = await Payment.create(
      {
        paymentNumber: generatePaymentNumber(),
        visitId: visit.id,
        patientId: visit.patientId,
        amount: paymentData.amount,
        paymentMethod: paymentData.paymentMethod,
        status: "paid",
        transactionId: paymentData.transactionId,
        notes: paymentData.notes,
        cashierId,
        paidAt: new Date(),
        createdBy: cashierId,
      },
      { transaction },
    );

    // Update visit status to COMPLETED
    // Note: In some workflows, it might go to a 'READY_FOR_DISPENSING' status,
    // but here we'll use COMPLETED or just update prescription status.
    await visit.update({ status: VISIT_STATUS.COMPLETED }, { transaction });

    // Update prescriptions to DISPENSED and create dispense records
    for (const prescription of visit.prescriptions) {
      if (prescription.status === PRESCRIPTION_STATUS.PENDING) {
        const medicine = await Medicine.findByPk(prescription.medicineId, { transaction });
        await MedicineDispense.create(
          {
            prescriptionId: prescription.id,
            patientId: prescription.patientId,
            medicineId: prescription.medicineId,
            visitId: prescription.visitId,
            dispensedBy: cashierId,
            quantity: prescription.quantity,
            dosage: prescription.dosage,
            frequency: prescription.frequency,
            route: prescription.route,
            duration: prescription.duration,
            instructions: prescription.instructions,
            batchNumber: medicine?.batchNumber,
            expiryDate: medicine?.expiryDate,
          },
          { transaction },
        );
        await prescription.update(
          {
            status: PRESCRIPTION_STATUS.DISPENSED,
            dispensedDate: new Date(),
            dispensedBy: cashierId,
          },
          { transaction },
        );
      }
    }

    await transaction.commit();
    return payment;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

/**
 * Get payment history
 */
export const getPaymentHistory = async (query) => {
  const { page = 1, pageSize = 10, search } = query;
  const { limit, offset } = getPagination(page, pageSize);

  const where = {};
  if (search) {
    where[Op.or] = [
      { paymentNumber: { [Op.like]: `%${search}%` } },
    ];
  }

  const { count, rows } = await Payment.findAndCountAll({
    where,
    limit,
    offset,
    order: [["paidAt", "DESC"]],
    include: [
      {
        model: Patient,
        as: "patient",
        attributes: ["id", "patientId", "firstName", "lastName", "phone"],
      },
      {
        model: Visit,
        as: "visit",
        attributes: ["id", "visitNumber", "visitDate", "doctorId"],
        include: [
          {
            model: Prescription,
            as: "prescriptions",
            attributes: ["id", "quantity", "unitPrice", "totalAmount", "dosage", "frequency", "route", "duration", "instructions"],
            include: [
              {
                model: Medicine,
                as: "medicine",
                attributes: ["id", "name", "strength"],
              },
            ],
          },
          {
            model: User,
            as: "doctor",
            attributes: ["id", "firstName", "lastName"],
          },
        ],
      },
      {
        model: User,
        as: "cashier",
        attributes: ["id", "firstName", "lastName"],
      },
    ],
  });

  return {
    payments: rows,
    pagination: {
      page: parseInt(page),
      pageSize: limit,
      totalItems: count,
    },
  };
};
