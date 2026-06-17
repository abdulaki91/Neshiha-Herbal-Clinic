import { sequelize } from "../models/index.js";
import Patient from "../models/Patient.js";
import Visit from "../models/Visit.js";
import User from "../models/User.js";
import Medicine from "../models/Medicine.js";
import logger from "../config/logger.js";
import { testConnection } from "../config/database.js";
import {
  generatePatientId,
  generateCardNumber,
  generateVisitNumber,
} from "../utils/helpers.js";

const createTestData = async () => {
  try {
    // Test database connection
    const connected = await testConnection();
    if (!connected) {
      logger.error("Failed to connect to database");
      process.exit(1);
    }

    logger.info("Creating test data...");

    // Get the doctor user
    const doctor = await User.findOne({
      where: { email: "doctor@neshihaclinic.com" },
    });
    const clerk = await User.findOne({
      where: { email: "clerk@neshihaclinic.com" },
    });

    if (!doctor || !clerk) {
      logger.error(
        "Doctor or Clerk user not found. Please run seed script first.",
      );
      process.exit(1);
    }

    // Create test patients
    const testPatients = [
      {
        firstName: "Abebe",
        middleName: "Kebede",
        lastName: "Tesfaye",
        gender: "male",
        dateOfBirth: "1980-05-15",
        age: 44,
        phone: "+251911234567",
        email: "abebe@example.com",
        region: "Addis Ababa",
        city: "Addis Ababa",
        subCity: "Bole",
        woreda: "03",
        address: "Bole Road, near Mexican Embassy",
        bloodGroup: "O+",
        weight: 75.5,
        height: 175,
        maritalStatus: "married",
        occupation: "Teacher",
        knownAllergies: JSON.stringify(["Penicillin", "Peanuts"]),
        chronicDiseases: JSON.stringify(["Hypertension"]),
        registeredBy: clerk.id,
      },
      {
        firstName: "Tigist",
        middleName: "Alemayehu",
        lastName: "Hailu",
        gender: "female",
        dateOfBirth: "1992-08-22",
        age: 32,
        phone: "+251922345678",
        email: "tigist@example.com",
        region: "Addis Ababa",
        city: "Addis Ababa",
        subCity: "Kirkos",
        woreda: "08",
        address: "Megenagna area",
        bloodGroup: "A+",
        weight: 62.0,
        height: 165,
        maritalStatus: "single",
        occupation: "Nurse",
        knownAllergies: JSON.stringify([]),
        chronicDiseases: JSON.stringify([]),
        registeredBy: clerk.id,
      },
      {
        firstName: "Mulugeta",
        middleName: "Tadesse",
        lastName: "Bekele",
        gender: "male",
        dateOfBirth: "1975-03-10",
        age: 49,
        phone: "+251933456789",
        email: "mulugeta@example.com",
        region: "Addis Ababa",
        city: "Addis Ababa",
        subCity: "Yeka",
        woreda: "12",
        address: "Gerji area, behind Total gas station",
        bloodGroup: "B+",
        weight: 82.3,
        height: 178,
        maritalStatus: "married",
        occupation: "Business Owner",
        knownAllergies: JSON.stringify([]),
        chronicDiseases: JSON.stringify([
          "Diabetes Type 2",
          "High Cholesterol",
        ]),
        registeredBy: clerk.id,
      },
      {
        firstName: "Hanna",
        middleName: "Mesfin",
        lastName: "Gebre",
        gender: "female",
        dateOfBirth: "1998-11-05",
        age: 26,
        phone: "+251944567890",
        email: "hanna@example.com",
        region: "Addis Ababa",
        city: "Addis Ababa",
        subCity: "Arada",
        woreda: "05",
        address: "Piazza, near St. George Church",
        bloodGroup: "AB+",
        weight: 58.0,
        height: 162,
        maritalStatus: "single",
        occupation: "Student",
        knownAllergies: JSON.stringify(["Dust", "Pollen"]),
        chronicDiseases: JSON.stringify([]),
        registeredBy: clerk.id,
      },
      {
        firstName: "Dawit",
        middleName: "Girma",
        lastName: "Abate",
        gender: "male",
        dateOfBirth: "1988-07-18",
        age: 36,
        phone: "+251955678901",
        email: "dawit@example.com",
        region: "Addis Ababa",
        city: "Addis Ababa",
        subCity: "Kolfe",
        woreda: "07",
        address: "Kolfe area, near Bethel Church",
        bloodGroup: "O-",
        weight: 70.0,
        height: 172,
        maritalStatus: "married",
        occupation: "Engineer",
        knownAllergies: JSON.stringify([]),
        chronicDiseases: JSON.stringify([]),
        registeredBy: clerk.id,
      },
    ];

    const createdPatients = [];
    for (const patientData of testPatients) {
      const existing = await Patient.findOne({
        where: { phone: patientData.phone },
      });

      if (!existing) {
        const patient = await Patient.create({
          ...patientData,
          patientId: await generatePatientId(),
          cardNumber: await generateCardNumber(),
        });
        createdPatients.push(patient);
        logger.info(
          `✅ Patient created: ${patient.firstName} ${patient.lastName}`,
        );
      } else {
        createdPatients.push(existing);
        logger.info(
          `ℹ️ Patient already exists: ${existing.firstName} ${existing.lastName}`,
        );
      }
    }

    // Create test visits for 3 patients (waiting status)
    const visitsToCreate = [
      {
        patient: createdPatients[0],
        chiefComplaint: "Headache and fever for 3 days",
        arrivalTime: "09:30:00",
      },
      {
        patient: createdPatients[1],
        chiefComplaint: "Stomach pain and nausea",
        arrivalTime: "10:15:00",
      },
      {
        patient: createdPatients[2],
        chiefComplaint: "High blood sugar levels, follow-up visit",
        arrivalTime: "11:00:00",
      },
    ];

    for (const visitData of visitsToCreate) {
      const existingVisit = await Visit.findOne({
        where: {
          patientId: visitData.patient.id,
          visitDate: new Date().toISOString().split("T")[0],
          status: "waiting",
        },
      });

      if (!existingVisit) {
        const visit = await Visit.create({
          visitNumber: await generateVisitNumber(),
          patientId: visitData.patient.id,
          doctorId: doctor.id,
          visitDate: new Date().toISOString().split("T")[0],
          arrivalTime: visitData.arrivalTime,
          status: "waiting",
          chiefComplaint: visitData.chiefComplaint,
          createdBy: clerk.id,
        });
        logger.info(
          `✅ Visit created for ${visitData.patient.firstName} ${visitData.patient.lastName} - ${visit.visitNumber}`,
        );
      } else {
        logger.info(
          `ℹ️ Visit already exists for ${visitData.patient.firstName} ${visitData.patient.lastName}`,
        );
      }
    }

    // Ensure medicines exist
    const medicineCount = await Medicine.count();
    logger.info(`ℹ️ Current medicine count: ${medicineCount}`);

    if (medicineCount === 0) {
      logger.info("⚠️ No medicines found. Please run seed script first.");
    }

    logger.info("✅ Test data creation completed successfully");
    process.exit(0);
  } catch (error) {
    logger.error("Test data creation failed:", error);
    process.exit(1);
  }
};

createTestData();
