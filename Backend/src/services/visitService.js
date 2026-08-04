import { Visit, Patient, User } from "../models/index.js";
import { Op } from "sequelize";
import { getPagination, calculateBMI } from "../utils/helpers.js";
import { ERROR_MESSAGES, VISIT_STATUS } from "../config/constants.js";

// errorHandler reads err.statusCode; without it, every thrown error is a 500
const httpError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

/**
 * Create new visit
 */
export const createVisit = async (data, createdBy) => {
  const { patientId } = data;

  // Verify patient exists
  const patient = await Patient.findByPk(patientId);
  if (!patient) {
    throw new Error("Patient not found");
  }

  // Parse symptoms if it's an array
  if (Array.isArray(data.symptoms)) {
    data.symptoms = JSON.stringify(data.symptoms);
  }

  const visit = await Visit.create({
    ...data,
    createdBy,
  });

  return visit;
};

/**
 * Get all visits with pagination and filters
 */
export const getAllVisits = async (query) => {
  const {
    page = 1,
    pageSize = 10,
    status,
    patientId,
    doctorId,
    visitDate,
    sortBy = "createdAt",
    sortOrder = "DESC",
  } = query;

  const { limit, offset } = getPagination(page, pageSize);

  const where = {};

  if (status) where.status = status;
  if (patientId) where.patientId = patientId;
  if (doctorId) where.doctorId = doctorId;
  if (visitDate) where.visitDate = visitDate;

  const { count, rows } = await Visit.findAndCountAll({
    where,
    limit,
    offset,
    order: [[sortBy, sortOrder]],
    include: [
      {
        model: Patient,
        as: "patient",
        attributes: [
          "id",
          "patientId",
          "firstName",
          "middleName",
          "lastName",
          "age",
          "gender",
          "phone",
          "bloodGroup",
          "knownAllergies",
          "chronicDiseases",
        ],
      },
      {
        model: User,
        as: "doctor",
        attributes: ["id", "firstName", "lastName", "specialization"],
      },
    ],
  });

  // Parse JSON fields in patient data
  const visitsWithParsedData = rows.map((visit) => {
    const visitData = visit.toJSON();
    if (visitData.patient) {
      if (visitData.patient.knownAllergies) {
        try {
          visitData.patient.knownAllergies = JSON.parse(
            visitData.patient.knownAllergies,
          );
        } catch (e) {
          visitData.patient.knownAllergies = [];
        }
      } else {
        visitData.patient.knownAllergies = [];
      }

      if (visitData.patient.chronicDiseases) {
        try {
          visitData.patient.chronicDiseases = JSON.parse(
            visitData.patient.chronicDiseases,
          );
        } catch (e) {
          visitData.patient.chronicDiseases = [];
        }
      } else {
        visitData.patient.chronicDiseases = [];
      }
    }
    return visitData;
  });

  return {
    visits: visitsWithParsedData,
    pagination: {
      page: parseInt(page),
      pageSize: limit,
      totalItems: count,
    },
  };
};

/**
 * Get visit by ID
 */
export const getVisitById = async (id) => {
  const visit = await Visit.findByPk(id, {
    include: [
      {
        model: Patient,
        as: "patient",
      },
      {
        model: User,
        as: "doctor",
        attributes: ["id", "firstName", "lastName", "specialization"],
      },
    ],
  });

  if (!visit) {
    throw new Error(ERROR_MESSAGES.NOT_FOUND);
  }

  // Parse JSON fields in patient data
  const visitData = visit.toJSON();
  if (visitData.patient) {
    if (visitData.patient.knownAllergies) {
      try {
        visitData.patient.knownAllergies = JSON.parse(
          visitData.patient.knownAllergies,
        );
      } catch (e) {
        visitData.patient.knownAllergies = [];
      }
    } else {
      visitData.patient.knownAllergies = [];
    }

    if (visitData.patient.chronicDiseases) {
      try {
        visitData.patient.chronicDiseases = JSON.parse(
          visitData.patient.chronicDiseases,
        );
      } catch (e) {
        visitData.patient.chronicDiseases = [];
      }
    } else {
      visitData.patient.chronicDiseases = [];
    }
  }

  return visitData;
};

/**
 * Update visit
 */
export const updateVisit = async (id, data, updatedBy) => {
  const visit = await Visit.findByPk(id);

  if (!visit) {
    throw new Error(ERROR_MESSAGES.NOT_FOUND);
  }

  // Calculate BMI if weight and height provided
  if ((data.weight && visit.height) || (data.height && visit.weight)) {
    const weight = data.weight || visit.weight;
    const height = data.height || visit.height;
    data.bmi = calculateBMI(weight, height);
  }

  // Convert empty followUpDate to null
  if (data.followUpDate === "") {
    data.followUpDate = null;
  }

  // Auto-assign doctor when visit has no doctor and status is being changed
  if (!visit.doctorId && data.status) {
    data.doctorId = updatedBy;
  }

  // Parse symptoms if it's an array
  if (Array.isArray(data.symptoms)) {
    data.symptoms = JSON.stringify(data.symptoms);
  }

  // Parse diagnosis if it's an array
  if (Array.isArray(data.diagnosis)) {
    data.diagnosis = JSON.stringify(data.diagnosis);
  }

  await visit.update({
    ...data,
    updatedBy,
  });

  return visit;
};

/**
 * Update visit status
 */
export const updateVisitStatus = async (id, status, updatedBy) => {
  const visit = await Visit.findByPk(id);

  if (!visit) {
    throw new Error(ERROR_MESSAGES.NOT_FOUND);
  }

  const updates = { status, updatedBy };

  // Auto-assign doctor when visit has no doctor and status is being changed
  if (!visit.doctorId) {
    updates.doctorId = updatedBy;
  }

  // Set consultation times based on status
  if (status === VISIT_STATUS.IN_CONSULTATION && !visit.consultationStartTime) {
    const now = new Date();
    updates.consultationStartTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
  }

  if (status === VISIT_STATUS.COMPLETED && !visit.consultationEndTime) {
    const now = new Date();
    updates.consultationEndTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
  }

  await visit.update(updates);

  return visit;
};

/**
 * Get upcoming scheduled appointments (not yet checked in).
 * These are deliberately excluded from getDoctorQueue, which only ever
 * looks at today's WAITING/IN_CONSULTATION visits — an appointment stays
 * invisible to the doctor queue until front desk checks the patient in.
 */
export const getAppointments = async (query) => {
  const {
    page = 1,
    pageSize = 20,
    startDate,
    endDate,
    doctorId,
    search,
  } = query;

  const { limit, offset } = getPagination(page, pageSize);

  const where = { status: VISIT_STATUS.SCHEDULED };
  if (doctorId) where.doctorId = doctorId;

  const today = new Date().toISOString().split("T")[0];
  if (startDate && endDate) {
    where.visitDate = { [Op.between]: [startDate, endDate] };
  } else if (startDate) {
    where.visitDate = { [Op.gte]: startDate };
  } else if (endDate) {
    where.visitDate = { [Op.lte]: endDate };
  } else {
    // Default to today-and-forward so past no-shows don't clutter the list
    where.visitDate = { [Op.gte]: today };
  }

  const patientWhere = {};
  if (search) {
    patientWhere[Op.or] = [
      { firstName: { [Op.iLike]: `%${search}%` } },
      { lastName: { [Op.iLike]: `%${search}%` } },
      { patientId: { [Op.iLike]: `%${search}%` } },
      { phone: { [Op.iLike]: `%${search}%` } },
    ];
  }

  const { count, rows } = await Visit.findAndCountAll({
    where,
    limit,
    offset,
    order: [
      ["visitDate", "ASC"],
      ["scheduledTime", "ASC"],
    ],
    include: [
      {
        model: Patient,
        as: "patient",
        where: Object.keys(patientWhere).length > 0 ? patientWhere : undefined,
        attributes: [
          "id",
          "patientId",
          "firstName",
          "lastName",
          "phone",
          "age",
          "gender",
        ],
      },
      {
        model: User,
        as: "doctor",
        attributes: ["id", "firstName", "lastName", "specialization"],
      },
    ],
  });

  return {
    appointments: rows,
    pagination: {
      page: parseInt(page),
      pageSize: limit,
      totalItems: count,
    },
  };
};

/**
 * Check a scheduled appointment in, moving it onto today's doctor queue.
 * Only valid on the appointment's own date — checking in early would put a
 * visit dated for next week onto today's queue, which would be confusing
 * for the doctor and wrong for same-day reporting.
 */
export const checkInAppointment = async (id, updatedBy) => {
  const visit = await Visit.findByPk(id);

  if (!visit) {
    throw httpError(ERROR_MESSAGES.NOT_FOUND, 404);
  }

  if (visit.status !== VISIT_STATUS.SCHEDULED) {
    throw httpError("This visit is not a pending appointment", 400);
  }

  const today = new Date().toISOString().split("T")[0];
  if (visit.visitDate !== today) {
    throw httpError(
      "This appointment is not scheduled for today and cannot be checked in yet",
      400,
    );
  }

  const now = new Date();
  await visit.update({
    status: VISIT_STATUS.WAITING,
    arrivalTime: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`,
    updatedBy,
  });

  return visit;
};

/**
 * Get doctor queue (waiting and in-consultation patients)
 */
export const getDoctorQueue = async (doctorId) => {
  const queue = await Visit.findAll({
    where: {
      [Op.or]: [
        {
          doctorId,
          status: [VISIT_STATUS.WAITING, VISIT_STATUS.IN_CONSULTATION],
        },
        { doctorId: null, status: VISIT_STATUS.WAITING },
      ],
      visitDate: new Date().toISOString().split("T")[0],
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
          "phone",
          "age",
          "gender",
          "knownAllergies",
          "chronicDiseases",
        ],
      },
    ],
    order: [["arrivalTime", "ASC"]],
  });

  // Parse JSON fields in patient data
  const visitsWithParsedData = queue.map((visit) => {
    const visitData = visit.toJSON();
    if (visitData.patient) {
      if (visitData.patient.knownAllergies) {
        try {
          visitData.patient.knownAllergies = JSON.parse(
            visitData.patient.knownAllergies,
          );
        } catch (e) {
          visitData.patient.knownAllergies = [];
        }
      } else {
        visitData.patient.knownAllergies = [];
      }

      if (visitData.patient.chronicDiseases) {
        try {
          visitData.patient.chronicDiseases = JSON.parse(
            visitData.patient.chronicDiseases,
          );
        } catch (e) {
          visitData.patient.chronicDiseases = [];
        }
      } else {
        visitData.patient.chronicDiseases = [];
      }
    }
    return visitData;
  });

  return visitsWithParsedData;
};

/**
 * Assign doctor to visit
 */
export const assignDoctor = async (visitId, doctorId, updatedBy) => {
  const visit = await Visit.findByPk(visitId);

  if (!visit) {
    throw new Error(ERROR_MESSAGES.NOT_FOUND);
  }

  await visit.update({
    doctorId,
    status: VISIT_STATUS.IN_CONSULTATION,
    updatedBy,
  });

  return visit;
};

/**
 * Record vital signs
 */
export const recordVitalSigns = async (id, vitalData, updatedBy) => {
  const visit = await Visit.findByPk(id);

  if (!visit) {
    throw new Error(ERROR_MESSAGES.NOT_FOUND);
  }

  // Calculate BMI if weight and height provided
  if (vitalData.weight && vitalData.height) {
    vitalData.bmi = calculateBMI(vitalData.weight, vitalData.height);
  }

  await visit.update({
    ...vitalData,
    updatedBy,
  });

  return visit;
};

/**
 * Get completed consultations for doctor (with full patient history)
 */
export const getCompletedConsultations = async (doctorId, query = {}) => {
  const { page = 1, pageSize = 20, search, startDate, endDate } = query;

  const { limit, offset } = getPagination(page, pageSize);

  const where = {
    doctorId,
    status: VISIT_STATUS.COMPLETED,
  };

  // Filter by date range
  if (startDate && endDate) {
    where.visitDate = {
      [Op.between]: [startDate, endDate],
    };
  } else if (startDate) {
    where.visitDate = {
      [Op.gte]: startDate,
    };
  } else if (endDate) {
    where.visitDate = {
      [Op.lte]: endDate,
    };
  }

  // Build patient search condition
  const patientWhere = {};
  if (search) {
    patientWhere[Op.or] = [
      { firstName: { [Op.iLike]: `%${search}%` } },
      { middleName: { [Op.iLike]: `%${search}%` } },
      { lastName: { [Op.iLike]: `%${search}%` } },
      { patientId: { [Op.iLike]: `%${search}%` } },
      { cardNumber: { [Op.iLike]: `%${search}%` } },
      { phone: { [Op.iLike]: `%${search}%` } },
    ];
  }

  const { count, rows } = await Visit.findAndCountAll({
    where,
    limit,
    offset,
    order: [
      ["visitDate", "DESC"],
      ["consultationEndTime", "DESC"],
    ],
    include: [
      {
        model: Patient,
        as: "patient",
        where: Object.keys(patientWhere).length > 0 ? patientWhere : undefined,
        attributes: [
          "id",
          "patientId",
          "firstName",
          "middleName",
          "lastName",
          "age",
          "gender",
          "phone",
          "bloodGroup",
          "knownAllergies",
          "chronicDiseases",
          "photo",
        ],
      },
      {
        model: User,
        as: "doctor",
        attributes: ["id", "firstName", "lastName", "specialization"],
      },
    ],
  });

  // Parse JSON fields in patient data
  const visitsWithParsedData = rows.map((visit) => {
    const visitData = visit.toJSON();
    if (visitData.patient) {
      if (visitData.patient.knownAllergies) {
        try {
          visitData.patient.knownAllergies = JSON.parse(
            visitData.patient.knownAllergies,
          );
        } catch (e) {
          visitData.patient.knownAllergies = [];
        }
      } else {
        visitData.patient.knownAllergies = [];
      }

      if (visitData.patient.chronicDiseases) {
        try {
          visitData.patient.chronicDiseases = JSON.parse(
            visitData.patient.chronicDiseases,
          );
        } catch (e) {
          visitData.patient.chronicDiseases = [];
        }
      } else {
        visitData.patient.chronicDiseases = [];
      }
    }

    // Parse visit diagnosis and symptoms
    if (visitData.diagnosis) {
      try {
        visitData.diagnosis = JSON.parse(visitData.diagnosis);
      } catch (e) {
        // Keep as string if not JSON
      }
    }

    if (visitData.symptoms) {
      try {
        visitData.symptoms = JSON.parse(visitData.symptoms);
      } catch (e) {
        // Keep as string if not JSON
      }
    }

    return visitData;
  });

  return {
    consultations: visitsWithParsedData,
    pagination: {
      page: parseInt(page),
      pageSize: limit,
      totalItems: count,
    },
  };
};
