# Doctor Workflow Guide - Neshiha Herbal Clinic

## Complete Doctor Consultation Flow

This guide explains the complete workflow for doctors in the traditional herbal clinic management system.

---

## 📋 Overview

The doctor acts as both clinician and pharmacist, managing:

- Patient consultations
- Vital signs recording
- Investigations requests
- **Herbal medicine prescription and dispensing**

---

## 🔄 Complete Workflow

### Step 1: Data Clerk Registers Patient

1. Data clerk logs in and goes to **Patients** page
2. Clicks **Register New Patient** button
3. Fills patient information including:
   - Personal details (name, age, gender, contact)
   - Medical history (allergies, chronic diseases)
   - Other relevant information
4. Saves patient record

### Step 2: Data Clerk Creates Visit

1. Data clerk goes to **Visits** page
2. Clicks **Create New Visit** button
3. Selects the registered patient
4. Optionally assigns a doctor
5. Enters chief complaint (main reason for visit)
6. Saves visit - Status becomes **"Waiting"**

### Step 3: Patient Appears in Doctor's Queue

1. Doctor logs in and sees the **Dashboard**
2. Dashboard shows "In Queue" count
3. Doctor clicks **Queue** menu item
4. Sees list of waiting patients in order of arrival
5. Each patient card shows:
   - Queue number (1, 2, 3...)
   - Patient name, age, gender
   - Patient ID
   - Arrival time
   - Chief complaint (if provided)

### Step 4: Doctor Starts Consultation

1. Doctor clicks **"Start Consultation"** button on patient card
2. System updates visit status to **"In Consultation"**
3. Records consultation start time
4. Opens comprehensive consultation interface with tabs

---

## 📑 Consultation Tabs

### Tab 1: Consultation

**Purpose:** Record clinical findings and diagnosis

**Fields:**

- **Chief Complaint\*** (required) - Main reason for visit
- **Symptoms** - Add multiple symptoms (e.g., "headache", "fever", "cough")
- **History of Present Illness** - Detailed history of current condition
- **Physical Examination** - Physical examination findings
- **Diagnosis\*** (required) - Add one or more diagnoses
- **Treatment Plan** - Overall treatment approach
- **Doctor's Notes** - Additional notes for record
- **Follow-up Date** - Next appointment date

**Actions:**

- Add/remove symptoms with + button
- Add/remove diagnoses with + button
- Click "Complete Consultation" when done

---

### Tab 2: Vital Signs

**Purpose:** Record patient vital signs

**Fields:**

- **Temperature (°C)** - Normal: 36.5-37.5°C
- **Blood Pressure (mmHg)** - Systolic/Diastolic (Normal: 120/80)
- **Heart Rate (bpm)** - Normal: 60-100
- **Respiratory Rate (per min)** - Normal: 12-20
- **Oxygen Saturation (%)** - Normal: 95-100%
- **Weight (kg)**
- **Height (cm)**
- **BMI** - Automatically calculated from weight and height

**Features:**

- Reference ranges shown for each vital sign
- BMI category displayed (Underweight/Normal/Overweight/Obese)
- Save button to update vital signs

---

### Tab 3: Investigation

**Purpose:** Request laboratory or imaging tests

**Fields:**

- **Investigation Type\*** - Blood Test, Urine Test, X-Ray, Ultrasound, CT, MRI, etc.
- **Test Name\*** - Specific test (e.g., "Complete Blood Count", "Liver Function Test")
- **Urgency** - Routine / Urgent / STAT (Immediate)
- **Scheduled Date** - When test should be performed
- **Instructions** - Special preparation or notes

**Features:**

- Add multiple investigations
- Track investigation status (Requested → In Progress → Completed)
- View results when available
- Delete pending investigations

---

### Tab 4: Herbal Medicine (MAIN FEATURE)

**Purpose:** Prescribe and dispense traditional herbal medicines

#### Adding Herbal Medicine:

1. **Click "Add Herbal Medicine"** button

2. **Fill Prescription Form:**

   **Medicine Selection:**
   - Select from available herbal medicines
   - Shows available quantity for each medicine

   **Dosage:**
   - Amount: Number (e.g., 10, 50, 100)
   - Unit: Gram / Milligram / Milliliter / Teaspoon / Tablespoon / Cup / Piece(s)

   **Frequency:** Choose from:
   - Once daily
   - Twice daily
   - Three times daily
   - Four times daily
   - Every 4/6/8/12 hours
   - Before meals
   - After meals
   - At bedtime
   - As needed
   - Custom (enter custom text)

   **Route of Administration:**
   - Oral (by mouth)
   - Topical (apply to skin)
   - Inhalation (breathe in)
   - Sublingual (under tongue)
   - Rectal
   - Other

   **Duration:**
   - Number + Unit (Days / Weeks / Months)
   - Example: 7 days, 2 weeks, 1 month

   **Quantity:**
   - Total quantity to dispense

   **Reason:** Why the medicine is prescribed

   **Instructions:** Special instructions for patient

   **Dispense Now Checkbox:**
   - ✅ Checked: Prescribe AND dispense immediately (default)
   - ☐ Unchecked: Only create prescription (dispense later)

3. **Click "Prescribe & Dispense"** button

4. **System Actions:**
   - Creates prescription record
   - If "Dispense Now" is checked:
     - Creates dispense record with today's date and current time
     - Records doctor as dispenser
     - Reduces medicine stock automatically
     - Adds to patient's permanent medicine history
     - Updates visit record

#### Medicine Records Show:

**For Dispensed Medicines (Green Card):**

- Medicine name
- Dosage and unit
- Frequency
- Route of administration
- Duration
- Quantity dispensed
- Date and time dispensed
- Special instructions
- Reason for prescription
- "Dispensed" badge

**For Pending Prescriptions (Yellow Card):**

- Medicine details
- "Pending" badge
- Delete option (if not yet dispensed)

---

### Tab 5: Patient History

**Purpose:** View previous visits and treatments

**Shows:**

- List of all completed visits
- Visit date and doctor name
- Previous diagnoses
- Previous treatment plans
- Helps doctor make informed decisions

---

## ✅ Completing the Consultation

1. **Ensure all required fields are filled:**
   - Chief Complaint (in Consultation tab)
   - At least one Diagnosis (in Consultation tab)

2. **Save progress regularly:**
   - Click "Save Progress" button at top of page
   - Saves all entered data without completing visit

3. **When ready to finish:**
   - Go to **Consultation** tab
   - Click **"Complete Consultation"** button
   - System validates required fields
   - Updates visit status to **"Completed"**
   - Records consultation end time
   - Removes patient from queue
   - Returns doctor to queue page

4. **Patient record permanently stores:**
   - Complete visit details
   - All vital signs
   - All investigations
   - All prescriptions
   - All dispensed medicines with dates and times
   - Visit rounds count (increments each visit)

---

## 🔄 Visit Round Tracking

The system automatically tracks **how many times a patient has visited:**

- Each completed visit increments the patient's visit count
- Shows in patient history
- Helps track recurring patients
- Useful for chronic condition management

---

## 💊 Medicine Inventory Management

**Automatic Stock Updates:**

- When medicine is dispensed, quantity automatically reduces
- Low stock alerts trigger when quantity falls below minimum
- Doctor can see available quantity before prescribing
- System prevents dispensing more than available quantity

**Medicine Fields (Backend):**

- Medicine name and generic name
- Strength (e.g., "500mg", "100g")
- Dosage form (e.g., "Powder", "Liquid", "Capsule")
- Category (e.g., "Pain Relief", "Digestive", "Immune Booster")
- Manufacturer and supplier
- Batch number and expiry date
- Purchase price and selling price
- Available quantity
- Minimum stock level
- Storage location
- Status (Available / Low Stock / Out of Stock / Expired)

---

## 🎯 Best Practices

### For Data Clerks:

1. ✅ Enter accurate patient information
2. ✅ Record chief complaint clearly
3. ✅ Assign doctor if known
4. ✅ Verify patient identity before creating visit

### For Doctors:

1. ✅ Review patient allergies and chronic diseases (shown in red alert box)
2. ✅ Check patient history before prescribing
3. ✅ Record vital signs for every consultation
4. ✅ Add detailed physical examination notes
5. ✅ Prescribe appropriate herbal medicines with clear instructions
6. ✅ Use "Dispense Now" for immediate treatment
7. ✅ Set follow-up dates for chronic conditions
8. ✅ Save progress regularly during long consultations
9. ✅ Review investigation results before completing consultation
10. ✅ Ensure all required fields are filled before completing

---

## 🔐 Role-Based Access

**Doctor Role Can:**

- ✅ View queue of waiting patients
- ✅ Start and complete consultations
- ✅ Record vital signs
- ✅ Request investigations
- ✅ Prescribe medicines
- ✅ Dispense medicines immediately
- ✅ View patient history
- ✅ View all patients (read-only)
- ❌ Cannot register new patients (Data Clerk only)
- ❌ Cannot edit patient demographics (Data Clerk only)

---

## 📊 Real-Time Updates

The system uses **Socket.io** for real-time updates:

- New patients automatically appear in queue
- Queue updates when other doctors accept patients
- Medicine stock updates in real-time
- Notifications for low stock alerts
- Visit status changes broadcast to relevant users

---

## 🚨 Error Handling

**Common Validations:**

- Cannot complete consultation without diagnosis
- Cannot dispense more medicine than available in stock
- Cannot start consultation if another doctor already started
- Cannot add medicine without selecting from list
- Must enter dosage amount and quantity

**Error Messages:**

- Clear, actionable error messages shown
- Success confirmations for all actions
- Automatic retry suggestions for network errors

---

## 📱 Responsive Design

The doctor interface works on:

- Desktop computers (optimal)
- Tablets (landscape mode recommended)
- Mobile phones (limited functionality)

---

## 🔄 Visit Status Flow

```
WAITING → IN CONSULTATION → COMPLETED
   ↓              ↓              ↓
Created by   Started by    Finished by
Data Clerk     Doctor        Doctor
```

**Cancelled Status:**

- Visits can be cancelled if patient leaves before consultation
- Data clerk or doctor can cancel from Visits page

---

## 📈 Dashboard Metrics

**Doctor Dashboard Shows:**

- In Queue: Number of patients waiting
- Completed Today: Consultations completed today
- Prescriptions: Medicines prescribed today
- Dispensed: Medicines dispensed today
- Waiting Patients: List with quick "Start Consultation" button

---

## 💡 Tips for Traditional Herbal Clinic

1. **Medicine Naming:**
   - Use local herbal medicine names
   - Add generic/scientific names in brackets
   - Example: "Damakese (Ocimum lamiifolium)"

2. **Dosage Units:**
   - Grams for powders
   - Milliliters for liquids
   - Teaspoons/Tablespoons for home measurements
   - Pieces for leaves or roots

3. **Instructions:**
   - Be specific: "Mix with warm water and drink"
   - Include preparation: "Boil in water for 10 minutes"
   - Timing: "Take on empty stomach in the morning"
   - Warnings: "Avoid cold drinks while taking"

4. **Follow-up:**
   - Schedule follow-up for chronic conditions
   - Track patient progress across visits
   - Adjust treatments based on previous visits

---

## 🎓 Training Checklist

- [ ] Data Clerk can register patients
- [ ] Data Clerk can create visits
- [ ] Doctor can view queue
- [ ] Doctor can start consultation
- [ ] Doctor can record vital signs
- [ ] Doctor can request investigations
- [ ] Doctor can prescribe herbal medicines
- [ ] Doctor can dispense medicines immediately
- [ ] Doctor can view patient history
- [ ] Doctor can complete consultation
- [ ] System updates medicine stock automatically
- [ ] Real-time updates work correctly

---

## 📞 Support

For technical issues or questions, contact your system administrator.

**System Version:** 1.0
**Last Updated:** June 2026
