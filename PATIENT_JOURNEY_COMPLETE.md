# Complete Patient Journey Guide

## Neshiha Herbal Clinic System

This document describes the complete patient journey from registration to follow-up visits, including where data is stored and how to implement missing features.

---

## 📋 Patient Journey Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         PATIENT JOURNEY                              │
└─────────────────────────────────────────────────────────────────────┘

1. REGISTRATION (Data Clerk)
   ↓
2. CREATE VISIT (Data Clerk)
   ↓
3. WAITING QUEUE (All visits with status: waiting)
   ↓
4. CONSULTATION (Doctor)
   ├── Chief Complaint & Symptoms
   ├── Physical Examination
   ├── Vital Signs Recording
   ├── Diagnosis
   ├── Treatment Plan
   ├── Prescriptions (Herbal Medicines)
   ├── Investigation Orders (Lab Tests, X-Ray, etc.)
   └── Follow-up Date (if needed)
   ↓
5. COMPLETE VISIT (status: completed)
   ↓
6. DATA STORAGE IN DATABASE
   ├── Visit Record (visits table)
   ├── Prescriptions (prescriptions table)
   ├── Investigations (investigations table)
   └── Patient History (linked via patientId)
   ↓
7. FOLLOW-UP VISIT (New Visit with same patientId)
   └── View Previous Visit History
```

---

## 🗄️ Data Storage Structure

### 1. **Visit Record** (`visits` table)

When a consultation is completed, ALL consultation data is stored in the `visits` table:

```javascript
{
  id: "uuid",
  visitNumber: "V-2026-001234", // Auto-generated
  patientId: "uuid", // Links to patient
  doctorId: "uuid", // Links to doctor
  visitDate: "2026-06-16",
  arrivalTime: "09:30:00",
  consultationStartTime: "10:00:00",
  consultationEndTime: "10:45:00",
  status: "completed", // waiting → in_consultation → completed

  // Consultation Details
  chiefComplaint: "Severe headache for 3 days",
  symptoms: ["headache", "nausea", "fatigue"], // JSON array
  historyOfPresentIllness: "Patient reports...",
  pastHistory: "Previous conditions...",

  // Vital Signs
  temperature: 37.5,
  bloodPressureSystolic: 120,
  bloodPressureDiastolic: 80,
  heartRate: 75,
  respiratoryRate: 18,
  oxygenSaturation: 98,
  weight: 70.5,
  height: 170,
  bmi: 24.39,

  // Examination & Diagnosis
  physicalExamination: "Patient appears...",
  diagnosis: ["Tension headache", "Dehydration"], // JSON array
  treatmentPlan: "Herbal treatment with...",

  // Follow-up
  followUpDate: "2026-06-30", // If patient needs to return
  doctorNotes: "Additional notes...",

  createdBy: "uuid",
  updatedBy: "uuid",
  createdAt: "2026-06-16T09:30:00",
  updatedAt: "2026-06-16T10:45:00"
}
```

### 2. **Prescriptions** (`prescriptions` table)

Each medicine prescribed is stored as a separate record:

```javascript
{
  id: "uuid",
  visitId: "uuid", // Links to the visit
  patientId: "uuid", // Links to patient
  medicineId: "uuid", // Links to medicine
  doctorId: "uuid", // Prescribing doctor

  // Prescription Details
  dosage: "2 tablets",
  frequency: "twice_daily",
  route: "oral",
  duration: "7 days",
  quantity: 14, // Total tablets
  instructions: "Take after meals",
  reason: "For pain relief",

  // Status Tracking
  status: "pending", // pending → dispensed → completed
  prescribedDate: "2026-06-16T10:45:00",
  dispensedDate: null, // Set when pharmacist dispenses
  dispensedBy: null,

  refills: 0,
  refillsRemaining: 0,

  createdBy: "uuid",
  updatedBy: "uuid"
}
```

### 3. **Investigations** (`investigations` table)

Lab tests, X-rays, and other investigations ordered:

```javascript
{
  id: "uuid",
  visitId: "uuid", // Links to the visit
  patientId: "uuid", // Links to patient
  requestedBy: "uuid", // Doctor who ordered

  // Investigation Details
  investigationType: "Blood Test",
  testName: "Complete Blood Count (CBC)",
  instructions: "Fasting required",
  urgency: "routine", // routine | urgent | stat

  // Status & Results
  status: "requested", // requested → in_progress → completed
  requestedDate: "2026-06-16T10:45:00",
  scheduledDate: "2026-06-17T08:00:00",
  completedDate: null,
  results: null, // Lab results entered here
  resultFile: null, // Path to uploaded result file
  interpretation: null, // Doctor's interpretation

  performedBy: "Lab Technician Name",
  reviewedBy: null, // Doctor who reviewed results

  notes: "Additional notes...",
  createdBy: "uuid",
  updatedBy: "uuid"
}
```

### 4. **Medicine Dispensing** (`medicine_dispenses` table)

When pharmacist gives medicines to patient:

```javascript
{
  id: "uuid",
  prescriptionId: "uuid", // Links to prescription
  patientId: "uuid",
  medicineId: "uuid",
  dispensedBy: "uuid", // Pharmacist

  quantityDispensed: 14,
  dispensedDate: "2026-06-16T11:00:00",
  batchNumber: "BATCH-2026-001",
  expiryDate: "2027-06-30",

  notes: "Dispensed full quantity",
  createdAt: "2026-06-16T11:00:00"
}
```

---

## 🔄 Follow-Up Visit Flow

### When Patient Returns for Follow-Up:

1. **Data Clerk creates NEW visit** with same `patientId`
2. **System shows patient's history** in consultation view
3. **Doctor can view**:
   - Previous visits (all completed visits with same patientId)
   - Previous diagnoses
   - Previous prescriptions
   - Previous investigation results
   - Follow-up date from last visit

### Implementation in Current System:

✅ **Already Implemented:**

- Visit creation with follow-up date field
- Patient history tab showing previous visits
- Filtering visits by patientId

❌ **Missing/Needs Enhancement:**

- Highlight if today's visit is a scheduled follow-up
- Show last visit's diagnosis prominently
- Show active prescriptions from previous visits
- Show pending investigation results
- Alert if follow-up date was missed

---

## 🚀 Implementation Checklist

### Backend (Already Complete) ✅

- [x] Visit model with all fields
- [x] Prescription model
- [x] Investigation model
- [x] Medicine Dispense model
- [x] Visit service with status management
- [x] Prescription service
- [x] Investigation service
- [x] JSON parsing for knownAllergies and chronicDiseases

### Frontend (Current Status)

#### ✅ Implemented:

- [x] Patient registration
- [x] Visit creation
- [x] Doctor queue page
- [x] Consultation form (chief complaint, symptoms, diagnosis, etc.)
- [x] Vital signs form
- [x] Investigation form
- [x] Herbal medicine prescription form
- [x] Patient history tab
- [x] Visit completion workflow

#### ⚠️ Partially Implemented:

- [ ] **Follow-up visit indicator** - Show if visit is a scheduled follow-up
- [ ] **Previous visit summary** - Quick view of last visit details
- [ ] **Active prescriptions view** - Show ongoing medications
- [ ] **Investigation results tracking** - Lab/radiology results workflow

#### ❌ Not Yet Implemented:

- [ ] **Pharmacy module** - Medicine dispensing workflow
- [ ] **Laboratory module** - Investigation results entry
- [ ] **Follow-up reminders** - Notify patients of upcoming appointments
- [ ] **Visit timeline** - Visual timeline of patient's visits
- [ ] **Treatment effectiveness tracking** - Compare symptoms across visits

---

## 📊 Complete Data Flow Example

### Example: Patient with Hypertension

#### **Visit 1 (Initial Consultation)**

```
Date: 2026-06-16
Chief Complaint: "High blood pressure and headaches"
Diagnosis: ["Hypertension", "Stress-related headache"]
Treatment:
  - Prescribed: Herbal BP medication (30 days)
  - Investigation: Blood pressure monitoring
Follow-up: 2026-07-16 (30 days)

STORED IN:
- visits table (visit record)
- prescriptions table (herbal BP med)
- investigations table (BP monitoring order)
```

#### **Visit 2 (Follow-up - 30 days later)**

```
Date: 2026-07-16
System shows:
  - Last visit: 30 days ago
  - Last diagnosis: Hypertension
  - Active prescriptions: Herbal BP medication
  - Investigation results: BP readings

New Consultation:
Chief Complaint: "Feeling much better, BP stable"
Diagnosis: ["Hypertension - controlled"]
Treatment:
  - Continue herbal BP medication (refill for 30 days)
  - Reduce dosage if BP remains stable
Follow-up: 2026-08-16 (30 days)

STORED IN:
- NEW visit record (Visit 2)
- NEW prescription (refill)
- Links to same patientId (shows history)
```

---

## 🔍 Key Features to Enhance Follow-Up Experience

### 1. **Follow-Up Badge**

When creating a visit, check if there's a previous visit with a follow-up date matching today:

```javascript
// In frontend: CheckFollowUp component
const checkFollowUp = async (patientId) => {
  const lastVisit = await getLastVisit(patientId);
  if (lastVisit?.followUpDate === today) {
    return {
      isFollowUp: true,
      lastVisit: lastVisit,
      daysSinceLastVisit: calculateDays(lastVisit.visitDate, today),
    };
  }
  return { isFollowUp: false };
};
```

### 2. **Previous Visit Summary Card**

Show in consultation view:

```jsx
{
  isPreviousVisit && (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <h4 className="font-semibold text-blue-800 mb-2">
        Previous Visit: {lastVisit.visitDate}
      </h4>
      <div className="text-sm text-blue-700">
        <p>
          <strong>Diagnosis:</strong> {lastVisit.diagnosis.join(", ")}
        </p>
        <p>
          <strong>Treatment:</strong> {lastVisit.treatmentPlan}
        </p>
        <p>
          <strong>Follow-up scheduled for:</strong> {lastVisit.followUpDate}
        </p>
      </div>
    </div>
  );
}
```

### 3. **Active Medications View**

Show prescriptions from last visit that are still active:

```javascript
// In backend: prescriptionService.js
export const getActivePrescriptions = async (patientId) => {
  return await Prescription.findAll({
    where: {
      patientId,
      status: ["pending", "dispensed", "refilled"],
      prescribedDate: {
        [Op.gte]: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
      },
    },
    include: [{ model: Medicine, as: "medicine" }],
  });
};
```

### 4. **Investigation Results Tracking**

Add investigation results workflow:

```javascript
// New page: LaboratoryPage.jsx
// Shows pending investigations
// Lab tech can enter results
// Results linked back to visit and patient
```

---

## 📱 Recommended New Pages/Components

### 1. **Pharmacy Module** (`PharmacyPage.jsx`)

- View pending prescriptions
- Dispense medicines
- Track medicine stock
- Print prescription labels

### 2. **Laboratory Module** (`LaboratoryPage.jsx`)

- View pending investigations
- Enter test results
- Upload result files (PDF, images)
- Mark investigations as completed

### 3. **Follow-up Dashboard** (`FollowUpPage.jsx`)

- List patients with upcoming follow-ups
- Send reminders (SMS/Email)
- Track missed appointments
- Reschedule follow-ups

### 4. **Patient Timeline** (`PatientTimelinePage.jsx`)

- Visual timeline of all visits
- Show diagnoses over time
- Track treatment effectiveness
- View all prescriptions and investigations

---

## 🎯 Summary

### Where Consultation Data is Stored:

1. **Visit details** → `visits` table (all consultation info, diagnosis, notes)
2. **Prescriptions** → `prescriptions` table (each medicine as separate record)
3. **Investigations** → `investigations` table (lab tests, x-rays, etc.)
4. **Medicine dispensing** → `medicine_dispenses` table (when pharmacist gives medicine)

### Follow-Up Visit Process:

1. **Data clerk creates NEW visit** with same patient
2. **System retrieves history** using patientId
3. **Doctor sees previous visits** in history tab
4. **New consultation** is stored as separate visit record
5. **All visits linked** through patientId for complete patient history

### Current Status:

✅ **Core functionality is complete** - consultation, prescriptions, investigations, and history tracking all work!

⚠️ **Enhancements needed** for better follow-up experience:

- Follow-up visit indicators
- Previous visit summary cards
- Active medications display
- Pharmacy dispensing module
- Laboratory results module

---

## 📌 Next Steps

1. **Test current flow end-to-end** - Create patient → Visit → Consultation → Complete
2. **Add follow-up indicators** - Show when visit is a scheduled follow-up
3. **Implement pharmacy module** - Medicine dispensing workflow
4. **Implement lab module** - Investigation results entry
5. **Add reporting** - Treatment outcomes, follow-up compliance, etc.

The foundation is solid! The system properly stores all data and maintains patient history. Focus on enhancing the user experience for follow-up visits and adding the pharmacy/lab workflows.
