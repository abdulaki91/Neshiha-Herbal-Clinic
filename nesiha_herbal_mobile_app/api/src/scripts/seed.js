import { User, Patient, Medicine, Setting } from "../models/index.js";
import logger from "../config/logger.js";
import { testConnection } from "../config/database.js";
import { ROLES } from "../config/constants.js";

const runSeeder = async () => {
  try {
    // Test database connection
    const connected = await testConnection();

    if (!connected) {
      logger.error("Failed to connect to database");
      process.exit(1);
    }

    logger.info("Seeding database...");

    // Create Super Admin
    const adminExists = await User.findOne({
      where: { email: "admin@neshihaclinic.com" },
    });

    if (!adminExists) {
      const superAdmin = await User.create({
        email: "admin@neshihaclinic.com",
        password: "Admin@123",
        role: ROLES.SUPER_ADMIN,
        firstName: "Super",
        lastName: "Admin",
        phone: "+251911000000",
        status: "active",
      });
      logger.info(`✅ Super Admin created: ${superAdmin.email}`);
    } else {
      logger.info("Super Admin already exists");
    }

    // Create Staff Manager
    const managerExists = await User.findOne({
      where: { email: "manager@neshihaclinic.com" },
    });

    if (!managerExists) {
      const manager = await User.create({
        email: "manager@neshihaclinic.com",
        password: "Manager@123",
        role: ROLES.STAFF_MANAGER,
        firstName: "Staff",
        lastName: "Manager",
        phone: "+251911000001",
        status: "active",
      });
      logger.info(`✅ Staff Manager created: ${manager.email}`);
    } else {
      logger.info("Staff Manager already exists");
    }

    // Create Doctor
    const doctorExists = await User.findOne({
      where: { email: "doctor@neshihaclinic.com" },
    });

    if (!doctorExists) {
      const doctor = await User.create({
        email: "doctor@neshihaclinic.com",
        password: "Doctor@123",
        role: ROLES.DOCTOR,
        firstName: "Dr. John",
        lastName: "Smith",
        phone: "+251911000002",
        department: "General Medicine",
        specialization: "Internal Medicine",
        licenseNumber: "MED-12345",
        status: "active",
      });
      logger.info(`✅ Doctor created: ${doctor.email}`);
    } else {
      logger.info("Doctor already exists");
    }

    // Create Data Clerk
    const clerkExists = await User.findOne({
      where: { email: "clerk@neshihaclinic.com" },
    });

    if (!clerkExists) {
      const clerk = await User.create({
        email: "clerk@neshihaclinic.com",
        password: "Clerk@123",
        role: ROLES.DATA_CLERK,
        firstName: "Data",
        lastName: "Clerk",
        phone: "+251911000003",
        status: "active",
      });
      logger.info(`✅ Data Clerk created: ${clerk.email}`);
    } else {
      logger.info("Data Clerk already exists");
    }

    // Create Cashier
    const cashierExists = await User.findOne({
      where: { email: "cashier@neshihaclinic.com" },
    });

    if (!cashierExists) {
      const cashier = await User.create({
        email: "cashier@neshihaclinic.com",
        password: "Cashier@123",
        role: ROLES.CASHIER,
        firstName: "Cashier",
        lastName: "User",
        phone: "+251911000004",
        status: "active",
      });
      logger.info(`✅ Cashier created: ${cashier.email}`);
    } else {
      logger.info("Cashier already exists");
    }

    // Create Sample Medicines
    const medicineCount = await Medicine.count();

    if (medicineCount === 0) {
      const medicines = [
        {
          name: "Paracetamol",
          genericName: "Acetaminophen",
          strength: "500mg",
          dosageForm: "Tablet",
          category: "Analgesic",
          manufacturer: "PharmaCo",
          availableQuantity: 500,
          minimumStock: 50,
          sellingPrice: 2.5,
          purchasePrice: 1.5,
          expiryDate: "2025-12-31",
          requiresPrescription: false,
        },
        {
          name: "Amoxicillin",
          genericName: "Amoxicillin",
          strength: "250mg",
          dosageForm: "Capsule",
          category: "Antibiotic",
          manufacturer: "MediCo",
          availableQuantity: 300,
          minimumStock: 30,
          sellingPrice: 5.0,
          purchasePrice: 3.0,
          expiryDate: "2025-10-31",
          requiresPrescription: true,
        },
        {
          name: "Ibuprofen",
          genericName: "Ibuprofen",
          strength: "400mg",
          dosageForm: "Tablet",
          category: "NSAID",
          manufacturer: "HealthPharma",
          availableQuantity: 400,
          minimumStock: 40,
          sellingPrice: 3.0,
          purchasePrice: 2.0,
          expiryDate: "2026-01-31",
          requiresPrescription: false,
        },
      ];

      for (const med of medicines) {
        await Medicine.create(med);
      }

      logger.info("✅ Sample medicines created");
    } else {
      logger.info("Medicines already exist");
    }

    // Create Settings
    const settingsExists = await Setting.findOne();

    if (!settingsExists) {
      await Setting.create({
        clinicName: "Neshiha Herbal Clinic",
        clinicPhone: "+251911123456",
        clinicEmail: "info@neshihaclinic.com",
        lowStockThreshold: 10,
        enableEmailNotifications: false,
        enableSMSNotifications: false,
      });
      logger.info("✅ Default settings created");
    } else {
      logger.info("Settings already exist");
    }

    logger.info("✅ Database seeding completed successfully");
    logger.info("\n📋 Default Credentials:");
    logger.info(
      "Super Admin - Email: admin@neshihaclinic.com, Password: Admin@123",
    );
    logger.info(
      "Staff Manager - Email: manager@neshihaclinic.com, Password: Manager@123",
    );
    logger.info(
      "Doctor - Email: doctor@neshihaclinic.com, Password: Doctor@123",
    );
    logger.info(
      "Data Clerk - Email: clerk@neshihaclinic.com, Password: Clerk@123",
    );
    logger.info(
      "Cashier - Email: cashier@neshihaclinic.com, Password: Cashier@123\n",
    );

    process.exit(0);
  } catch (error) {
    logger.error("Seeding failed:", error);
    process.exit(1);
  }
};

runSeeder();
