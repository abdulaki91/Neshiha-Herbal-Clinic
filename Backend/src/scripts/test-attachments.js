import { sequelize, Patient, User, PatientAttachment } from "../models/index.js";
import { testConnection } from "../config/database.js";

async function run() {
  try {
    const connected = await testConnection();
    if (!connected) {
      console.error("Failed to connect to database");
      process.exit(1);
    }

    console.log("Database connected. Getting test patient and doctor...");
    const patient = await Patient.findOne();
    const user = await User.findOne();

    if (!patient || !user) {
      console.error("Please run seed and test-data scripts first!");
      process.exit(1);
    }

    console.log(`Using Patient: ${patient.firstName} ${patient.lastName} (${patient.id})`);
    console.log(`Using User: ${user.firstName} ${user.lastName} (${user.id})`);

    // Create attachment
    console.log("Creating test patient attachment...");
    const attachment = await PatientAttachment.create({
      patientId: patient.id,
      fileName: "test_report.pdf",
      filePath: "uploads/documents/test_report-12345.pdf",
      fileType: "application/pdf",
      uploadedBy: user.id,
    });

    console.log("✅ Attachment created successfully:", attachment.toJSON());

    // Fetch attachments
    console.log("Retrieving attachments for patient...");
    const list = await PatientAttachment.findAll({
      where: { patientId: patient.id },
    });
    console.log(`✅ Retrieved ${list.length} attachments:`);
    list.forEach(a => console.log(` - ${a.fileName} (${a.filePath})`));

    // Delete attachment
    console.log("Cleaning up test attachment...");
    await attachment.destroy();
    console.log("✅ Test attachment removed from database.");

    process.exit(0);
  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  }
}

run();
