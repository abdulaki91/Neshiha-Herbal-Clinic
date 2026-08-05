import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Setting = sequelize.define(
  "Setting",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    clinicName: {
      type: DataTypes.STRING,
      defaultValue: "Neshiha Herbal Clinic",
    },
    clinicPhone: {
      type: DataTypes.STRING,
    },
    clinicEmail: {
      type: DataTypes.STRING,
    },
    clinicAddress: {
      type: DataTypes.TEXT,
    },
    clinicLogo: {
      type: DataTypes.STRING,
    },
    timezone: {
      type: DataTypes.STRING,
      defaultValue: "Africa/Addis_Ababa",
    },
    currency: {
      type: DataTypes.STRING,
      defaultValue: "ETB",
    },
    dateFormat: {
      type: DataTypes.STRING,
      defaultValue: "YYYY-MM-DD",
    },
    timeFormat: {
      type: DataTypes.STRING,
      defaultValue: "24h",
    },
    lowStockThreshold: {
      type: DataTypes.INTEGER,
      defaultValue: 10,
    },
    enableEmailNotifications: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    enableSMSNotifications: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    workingHoursStart: {
      type: DataTypes.TIME,
      defaultValue: "08:00:00",
    },
    workingHoursEnd: {
      type: DataTypes.TIME,
      defaultValue: "17:00:00",
    },
    workingDays: {
      type: DataTypes.JSONB,
      defaultValue: [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
      ],
    },
    appointmentDuration: {
      type: DataTypes.INTEGER,
      defaultValue: 30,
      comment: "Duration in minutes",
    },
    termsAndConditions: {
      type: DataTypes.TEXT,
    },
    privacyPolicy: {
      type: DataTypes.TEXT,
    },
    // Business Information — public "About" section content, translatable
    // per-locale as { en, am, om, ar } (en required, others optional).
    tagline: {
      type: DataTypes.JSONB,
    },
    mission: {
      type: DataTypes.JSONB,
    },
    vision: {
      type: DataTypes.JSONB,
    },
    aboutText: {
      type: DataTypes.JSONB,
    },
    yearsExperience: {
      type: DataTypes.INTEGER,
    },
    patientsServed: {
      type: DataTypes.INTEGER,
    },
    treatmentsOffered: {
      type: DataTypes.INTEGER,
    },
    // Contact Information — public site contact + social details
    whatsappNumber: {
      type: DataTypes.STRING,
    },
    facebookUrl: {
      type: DataTypes.STRING,
    },
    instagramUrl: {
      type: DataTypes.STRING,
    },
    tiktokUrl: {
      type: DataTypes.STRING,
    },
    twitterUrl: {
      type: DataTypes.STRING,
    },
    googleMapsEmbedUrl: {
      type: DataTypes.STRING,
    },
    metadata: {
      type: DataTypes.JSONB,
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
    tableName: "settings",
    timestamps: true,
  },
);

export default Setting;
