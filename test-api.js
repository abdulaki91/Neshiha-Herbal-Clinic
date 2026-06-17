// Quick test script to verify API is working
import fetch from "node-fetch";

const API_URL = "http://localhost:5000/api/v1";

// Test credentials (doctor user from seed data)
const TEST_USER = {
  email: "doctor@neshihaclinic.com",
  password: "Doctor@123",
};

async function testAPI() {
  try {
    console.log("1️⃣ Testing login...");
    const loginResponse = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(TEST_USER),
    });

    const loginData = await loginResponse.json();
    console.log("✅ Login successful:", {
      success: loginData.success,
      user: loginData.data?.user?.email,
      hasToken: !!loginData.data?.accessToken,
    });

    const token = loginData.data?.accessToken;

    if (!token) {
      console.error("❌ No access token received");
      return;
    }

    console.log("\n2️⃣ Testing visits endpoint...");
    const visitsResponse = await fetch(
      `${API_URL}/visits?status=waiting&sortBy=arrivalTime&sortOrder=ASC`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );

    const visitsData = await visitsResponse.json();
    console.log("📦 Visits response:", JSON.stringify(visitsData, null, 2));
    console.log("\n✅ Visit count:", visitsData.data?.length || 0);

    if (visitsData.data && visitsData.data.length > 0) {
      console.log("\n👥 Waiting patients:");
      visitsData.data.forEach((visit, index) => {
        console.log(
          `  ${index + 1}. ${visit.patient?.firstName} ${visit.patient?.lastName} - ${visit.chiefComplaint}`,
        );
      });
    } else {
      console.log("\n⚠️ No waiting patients found");
      console.log("Troubleshooting:");
      console.log("  - Run: cd Backend && npm run test-data");
      console.log("  - Check if visits exist in database");
      console.log("  - Verify visit_date is today");
    }
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

testAPI();
