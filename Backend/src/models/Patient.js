import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import { GENDER, BLOOD_GROUP, MARITAL_STATUS } from "../config/constants.js";
import { generatePatientId, generateCardNumber } from "../utils/helpers.js";

const Patient = sequelize.define(
  "Patient",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    patientId: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    cardNumber: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    nationalId: {
      type: DataTypes.STRING,
      unique: true,
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    middleName: {
      type: DataTypes.STRING,
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    gender: {
      type: DataTypes.ENUM(...Object.values(GENDER)),
      allowNull: false,
    },
    dateOfBirth: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    age: {
      type: DataTypes.INTEGER,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    alternativePhone: {
      type: DataTypes.STRING,
    },
    email: {
      type: DataTypes.STRING,
      validate: {
        isEmail: true,
      },
    },
    region: {
      type: DataTypes.STRING,
    },
    city: {
      type: DataTypes.STRING,
    },
    subCity: {
      type: DataTypes.STRING,
    },
    woreda: {
      type: DataTypes.STRING,
    },
    address: {
      type: DataTypes.TEXT,
    },
    emergencyContactName: {
      type: DataTypes.STRING,
    },
    emergencyContactPhone: {
      type: DataTypes.STRING,
    },
    emergencyContactRelation: {
      type: DataTypes.STRING,
    },
    bloodGroup: {
      type: DataTypes.ENUM(...Object.values(BLOOD_GROUP)),
    },
    weight: {
      type: DataTypes.DECIMAL(5, 2),
      comment: "Weight in kg",
    },
    height: {
      type: DataTypes.DECIMAL(5, 2),
      comment: "Height in cm",
    },
    maritalStatus: {
      type: DataTypes.ENUM(...Object.values(MARITAL_STATUS)),
    },
    occupation: {
      type: DataTypes.STRING,
    },
    insuranceProvider: {
      type: DataTypes.STRING,
    },
    insuranceNumber: {
      type: DataTypes.STRING,
    },
    photo: {
      type: DataTypes.STRING,
    },
    knownAllergies: {
      type: DataTypes.TEXT,
      comment: "JSON array of allergies",
    },
    chronicDiseases: {
      type: DataTypes.TEXT,
      comment: "JSON array of chronic diseases",
    },
    pastMedicalHistory: {
      type: DataTypes.TEXT,
    },
    pastSurgicalHistory: {
      type: DataTypes.TEXT,
    },
    currentMedications: {
      type: DataTypes.TEXT,
      comment: "Current medications patient is taking",
    },
    familyMedicalHistory: {
      type: DataTypes.TEXT,
    },
    smokingStatus: {
      type: DataTypes.STRING,
    },
    alcoholStatus: {
      type: DataTypes.STRING,
    },
    otherLifestyleNotes: {
      type: DataTypes.TEXT,
    },
    notes: {
      type: DataTypes.TEXT,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    registeredBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    updatedBy: {
      type: DataTypes.UUID,
      references: {
        model: "users",
        key: "id",
      },
    },
  },
  {
    tableName: "patients",
    timestamps: true,
    hooks: {
      beforeValidate: async (patient) => {
        if (!patient.patientId) {
          patient.patientId = generatePatientId();
        }
        if (!patient.cardNumber) {
          patient.cardNumber = generateCardNumber();
        }
      },
    },
  },
);

// Instance methods
Patient.prototype.getFullName = function () {
  return `${this.firstName} ${this.middleName ? this.middleName + " " : ""}${this.lastName}`;
};

export default Patient;
