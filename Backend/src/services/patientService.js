import { Patient, User } from "../models/index.js";
import { Op } from "sequelize";
import { getPagination, calculateAge } from "../utils/helpers.js";
import { ERROR_MESSAGES } from "../config/constants.js";

/**
 * Create new patient
 */
export const createPatient = async (data, registeredBy) => {
  // Check for duplicate national ID
  if (data.nationalId) {
    const existing = await Patient.findOne({
      where: { nationalId: data.nationalId },
    });
    if (existing) {
      throw new Error("Patient with this National ID already exists");
    }
  }

  // Calculate age from date of birth
  if (data.dateOfBirth) {
    data.age = calculateAge(data.dateOfBirth);
  }

  // Parse JSON fields
  if (typeof data.knownAllergies === "string") {
    data.knownAllergies = data.knownAllergies;
  } else if (Array.isArray(data.knownAllergies)) {
    data.knownAllergies = JSON.stringify(data.knownAllergies);
  }

  if (typeof data.chronicDiseases === "string") {
    data.chronicDiseases = data.chronicDiseases;
  } else if (Array.isArray(data.chronicDiseases)) {
    data.chronicDiseases = JSON.stringify(data.chronicDiseases);
  }

  const patient = await Patient.create({
    ...data,
    registeredBy,
  });

  return patient;
};

/**
 * Get all patients with pagination and filters
 */
export const getAllPatients = async (query) => {
  const {
    page = 1,
    pageSize = 10,
    search,
    gender,
    bloodGroup,
    isActive = true,
    sortBy = "createdAt",
    sortOrder = "DESC",
  } = query;

  const { limit, offset } = getPagination(page, pageSize);

  const where = { isActive };

  // Filter by gender
  if (gender) {
    where.gender = gender;
  }

  // Filter by blood group
  if (bloodGroup) {
    where.bloodGroup = bloodGroup;
  }

  // Search by name, patient ID, card number, or phone
  if (search) {
    where[Op.or] = [
      { firstName: { [Op.iLike]: `%${search}%` } },
      { middleName: { [Op.iLike]: `%${search}%` } },
      { lastName: { [Op.iLike]: `%${search}%` } },
      { patientId: { [Op.iLike]: `%${search}%` } },
      { cardNumber: { [Op.iLike]: `%${search}%` } },
      { phone: { [Op.iLike]: `%${search}%` } },
      { nationalId: { [Op.iLike]: `%${search}%` } },
    ];
  }

  const { count, rows } = await Patient.findAndCountAll({
    where,
    limit,
    offset,
    order: [[sortBy, sortOrder]],
    include: [
      {
        model: User,
        as: "registeredByUser",
        attributes: ["id", "firstName", "lastName", "email"],
      },
    ],
  });

  // Parse JSON fields in patient data
  const patientsWithParsedData = rows.map((patient) => {
    const patientData = patient.toJSON();
    if (patientData.knownAllergies) {
      try {
        patientData.knownAllergies = JSON.parse(patientData.knownAllergies);
      } catch (e) {
        patientData.knownAllergies = [];
      }
    } else {
      patientData.knownAllergies = [];
    }

    if (patientData.chronicDiseases) {
      try {
        patientData.chronicDiseases = JSON.parse(patientData.chronicDiseases);
      } catch (e) {
        patientData.chronicDiseases = [];
      }
    } else {
      patientData.chronicDiseases = [];
    }
    return patientData;
  });

  return {
    patients: patientsWithParsedData,
    pagination: {
      page: parseInt(page),
      pageSize: limit,
      totalItems: count,
    },
  };
};

/**
 * Get patient by ID
 */
export const getPatientById = async (id) => {
  const patient = await Patient.findByPk(id, {
    include: [
      {
        model: User,
        as: "registeredByUser",
        attributes: ["id", "firstName", "lastName", "email"],
      },
    ],
  });

  if (!patient) {
    throw new Error(ERROR_MESSAGES.NOT_FOUND);
  }

  // Parse JSON fields
  const patientData = patient.toJSON();
  if (patientData.knownAllergies) {
    try {
      patientData.knownAllergies = JSON.parse(patientData.knownAllergies);
    } catch (e) {
      patientData.knownAllergies = [];
    }
  } else {
    patientData.knownAllergies = [];
  }

  if (patientData.chronicDiseases) {
    try {
      patientData.chronicDiseases = JSON.parse(patientData.chronicDiseases);
    } catch (e) {
      patientData.chronicDiseases = [];
    }
  } else {
    patientData.chronicDiseases = [];
  }

  return patientData;
};

/**
 * Update patient
 */
export const updatePatient = async (id, data, updatedBy) => {
  const patient = await Patient.findByPk(id);

  if (!patient) {
    throw new Error(ERROR_MESSAGES.NOT_FOUND);
  }

  // Check for duplicate national ID
  if (data.nationalId && data.nationalId !== patient.nationalId) {
    const existing = await Patient.findOne({
      where: {
        nationalId: data.nationalId,
        id: { [Op.ne]: id },
      },
    });

    if (existing) {
      throw new Error("Patient with this National ID already exists");
    }
  }

  // Recalculate age if date of birth changed
  if (data.dateOfBirth && data.dateOfBirth !== patient.dateOfBirth) {
    data.age = calculateAge(data.dateOfBirth);
  }

  // Parse JSON fields
  if (typeof data.knownAllergies === "object") {
    data.knownAllergies = JSON.stringify(data.knownAllergies);
  }

  if (typeof data.chronicDiseases === "object") {
    data.chronicDiseases = JSON.stringify(data.chronicDiseases);
  }

  await patient.update({
    ...data,
    updatedBy,
  });

  return patient;
};

/**
 * Delete patient (soft delete)
 */
export const deletePatient = async (id) => {
  const patient = await Patient.findByPk(id);

  if (!patient) {
    throw new Error(ERROR_MESSAGES.NOT_FOUND);
  }

  await patient.update({ isActive: false });

  return { message: "Patient deleted successfully" };
};

/**
 * Get patient complete history
 */
export const getPatientHistory = async (id) => {
  const {
    Patient: PatientModel,
    Visit,
    Prescription,
    MedicineDispense,
    Investigation,
  } = await import("../models/index.js");

  const patient = await PatientModel.findByPk(id, {
    include: [
      {
        model: Visit,
        as: "visits",
        include: [
          {
            model: User,
            as: "doctor",
            attributes: ["id", "firstName", "lastName"],
          },
        ],
        order: [["visitDate", "DESC"]],
      },
      {
        model: Prescription,
        as: "prescriptions",
        order: [["prescribedDate", "DESC"]],
      },
      {
        model: MedicineDispense,
        as: "medicineDispenses",
        order: [["dispensedDate", "DESC"]],
      },
      {
        model: Investigation,
        as: "investigations",
        order: [["requestedDate", "DESC"]],
      },
    ],
  });

  if (!patient) {
    throw new Error(ERROR_MESSAGES.NOT_FOUND);
  }

  // Parse JSON fields
  const patientData = patient.toJSON();
  if (patientData.knownAllergies) {
    try {
      patientData.knownAllergies = JSON.parse(patientData.knownAllergies);
    } catch (e) {
      patientData.knownAllergies = [];
    }
  } else {
    patientData.knownAllergies = [];
  }

  if (patientData.chronicDiseases) {
    try {
      patientData.chronicDiseases = JSON.parse(patientData.chronicDiseases);
    } catch (e) {
      patientData.chronicDiseases = [];
    }
  } else {
    patientData.chronicDiseases = [];
  }

  return patientData;
};

/**
 * Upload patient photo
 */
export const uploadPatientPhoto = async (id, photoPath, updatedBy) => {
  const patient = await Patient.findByPk(id);

  if (!patient) {
    throw new Error(ERROR_MESSAGES.NOT_FOUND);
  }

  await patient.update({
    photo: photoPath,
    updatedBy,
  });

  return patient;
};

/**
 * Get patient statistics
 */
export const getPatientStats = async () => {
  const total = await Patient.count({ where: { isActive: true } });
  const male = await Patient.count({
    where: { gender: "male", isActive: true },
  });
  const female = await Patient.count({
    where: { gender: "female", isActive: true },
  });

  // Patients registered today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const registeredToday = await Patient.count({
    where: {
      isActive: true,
      createdAt: {
        [Op.gte]: today,
      },
    },
  });

  return {
    total,
    male,
    female,
    registeredToday,
  };
};
