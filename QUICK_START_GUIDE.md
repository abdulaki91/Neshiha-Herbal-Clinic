# Quick Start Guide - Neshiha Herbal Clinic

## 🚀 System is Ready!

Both Backend and Frontend are running. Test data has been created.

---

## 📍 Access URLs

- **Frontend:** http://localhost:5174
- **Backend API:** http://localhost:5000/api/v1
- **Backend Server:** http://localhost:5000

---

## 🔐 Test Accounts

### 1. Super Admin

- **Email:** `admin@neshihaclinic.com`
- **Password:** `Admin@123`
- **Can:** Manage everything (staff, patients, visits, reports, settings)

### 2. Staff Manager

- **Email:** `manager@neshihaclinic.com`
- **Password:** `Manager@123`
- **Can:** Manage staff accounts only

### 3. Doctor

- **Email:** `doctor@neshihaclinic.com`
- **Password:** `Doctor@123`
- **Can:** View queue, start consultations, prescribe medicines, dispense medicines

### 4. Data Clerk

- **Email:** `clerk@neshihaclinic.com`
- **Password:** `Clerk@123`
- **Can:** Register patients, create visits, send patients to doctor

---

## 📋 Test Data Available

### Patients (5 Created):

1. **Abebe Tesfaye** - 44M, Has Hypertension, Allergic to Penicillin & Peanuts
2. **Tigist Hailu** - 32F, No conditions
3. **Mulugeta Bekele** - 49M, Has Diabetes & High Cholesterol
4. **Hanna Gebre** - 26F, Allergic to Dust & Pollen
5. **Dawit Abate** - 36M, No conditions

### Waiting Visits (3 Created):

1. **Abebe** - "Headache and fever for 3 days" - Arrived 09:30
2. **Tigist** - "Stomach pain and nausea" - Arrived 10:15
3. **Mulugeta** - "High blood sugar levels, follow-up visit" - Arrived 11:00

### Medicines (3 Available):

1. **Paracetamol** - 500mg Tablets (Stock: 1000)
2. **Amoxicillin** - 250mg Capsules (Stock: 500)
3. **Ibuprofen** - 400mg Tablets (Stock: 800)

---

## 🎯 Complete Workflow Test

### Step 1: Login as Data Clerk

```
URL: http://localhost:5174
Email: clerk@neshihaclinic.com
Password: Clerk@123
```

**What You'll See:**

- Dashboard showing today's registrations
- Menu: Dashboard, Patients, Visits

### Step 2: View Patients (Data Clerk)

1. Click **"Patients"** in sidebar
2. You'll see 5 registered patients
3. Click **"Register Patient"** to add more (optional)

### Step 3: Create a New Visit (Data Clerk)

1. Click **"Visits"** in sidebar
2. Click **"New Visit"** button (top right)
3. Select a patient from dropdown (e.g., "Hanna Gebre")
4. Enter Chief Complaint: "Severe headache since yesterday"
5. Visit Date: (Today's date - auto-filled)
6. Arrival Time: (Current time - auto-filled)
7. Click **"Create Visit"**
8. Success! Visit created with status "Waiting"

### Step 4: Logout and Login as Doctor

1. Click Logout (bottom of sidebar)
2. Login with doctor credentials:
   ```
   Email: doctor@neshihaclinic.com
   Password: Doctor@123
   ```

**What You'll See:**

- Dashboard with queue statistics
- Menu: Dashboard, Queue, Patients, Visits

### Step 5: View Queue (Doctor)

1. Click **"Queue"** in sidebar
2. You'll see 4 waiting patients in numbered cards:
   - Queue #1: Abebe
   - Queue #2: Tigist
   - Queue #3: Mulugeta
   - Queue #4: Hanna (just created)
3. Each card shows:
   - Patient name, age, gender
   - Patient ID
   - Arrival time
   - Chief complaint

### Step 6: Start Consultation (Doctor)

1. Click **"Start Consultation"** on Abebe's card
2. System opens full consultation interface
3. **Patient Info Card shows:**
   - Patient ID, Age, Gender, Blood Group, Phone
   - 🚨 RED ALERT BOX: "Allergies: Penicillin, Peanuts"
   - 🚨 RED ALERT BOX: "Chronic Diseases: Hypertension"

### Step 7: Record Vital Signs (Doctor)

1. Click **"Vital Signs"** tab
2. Fill in:
   - Temperature: `37.2` (°C)
   - Blood Pressure: `140` / `90` (mmHg)
   - Heart Rate: `78` (bpm)
   - Respiratory Rate: `16` (per min)
   - Oxygen Saturation: `98` (%)
   - Weight: `75.5` (kg)
   - Height: `175` (cm)
3. BMI auto-calculates: **24.65** (Normal)
4. Click **"Save Vitals"**
5. Success notification

### Step 8: Request Investigation (Doctor) - Optional

1. Click **"Investigation"** tab
2. Click **"Request Investigation"**
3. Select Investigation Type: "Blood Test"
4. Test Name: "Complete Blood Count"
5. Urgency: "Routine"
6. Click **"Request Investigation"**
7. Investigation card appears with status "Requested"

### Step 9: Prescribe Herbal Medicine (Doctor)

1. Click **"Herbal Medicine"** tab
2. Click **"Add Herbal Medicine"** button
3. **Fill Prescription Form:**
   - Select Medicine: "Paracetamol - 500mg (Available: 1000 Tablets)"
   - Dosage Amount: `500`
   - Unit: `mg`
   - Frequency: `Three times daily`
   - Route: `Oral (by mouth)`
   - Duration: `7` Days
   - Quantity: `21` (7 days × 3 times)
   - Reason: `Pain relief and fever reduction`
   - Instructions: `Take with food. Drink plenty of water.`
   - ✅ **"Dispense Now"** is checked
4. Click **"Prescribe & Dispense"**
5. Green card appears showing:
   - Medicine dispensed
   - Date and time of dispensing
   - All details
   - "Dispensed" badge

### Step 10: Fill Consultation Details (Doctor)

1. Click **"Consultation"** tab
2. **Chief Complaint:** `Headache and fever for 3 days` (already filled)
3. **Symptoms:** Type `headache` → Click + button
   - Add more: `fever`, `body ache`, `weakness`
4. **History:** `Patient reports headache started 3 days ago with high fever`
5. **Physical Examination:** `Alert and oriented. Mild dehydration noted.`
6. **Diagnosis:** Type `Viral Fever` → Click + button
   - Add: `Dehydration`
7. **Treatment Plan:** `Rest, hydration, antipyretics for 7 days`
8. **Doctor's Notes:** `Patient advised to return if fever persists beyond 3 days`
9. **Follow-up Date:** Select date 1 week from today
10. Click **"Save Progress"** (saves without completing)

### Step 11: Complete Consultation (Doctor)

1. Review all tabs to ensure everything is filled
2. Go back to **"Consultation"** tab
3. Click **"Complete Consultation"** button (bottom)
4. Success! Returns to queue page
5. **Abebe is removed from queue**
6. Only 3 patients remain in queue

### Step 12: View Completed Visit (Doctor)

1. Click **"Visits"** in sidebar
2. Click **"completed"** filter button
3. See Abebe's completed visit with green badge
4. Click on visit card to see summary

### Step 13: Check Medicine Stock (Admin)

1. Logout from doctor
2. Login as admin:
   ```
   Email: admin@neshihaclinic.com
   Password: Admin@123
   ```
3. _(Medicine management UI not implemented yet)_
4. **Backend has automatically reduced stock:**
   - Paracetamol: 1000 → 979 (21 tablets dispensed)

---

## ✅ Complete Feature Checklist

### Data Clerk Features:

- ✅ Register new patients
- ✅ View all patients
- ✅ Search patients
- ✅ Create new visits
- ✅ View all visits
- ✅ Filter visits by status
- ✅ Dashboard with today's stats

### Doctor Features:

- ✅ View patient queue (waiting patients)
- ✅ Start consultation
- ✅ View patient allergies & chronic diseases (alert)
- ✅ Record vital signs with auto BMI calculation
- ✅ Request investigations
- ✅ Prescribe herbal medicines
- ✅ Dispense medicines immediately
- ✅ Fill consultation details (symptoms, diagnosis, treatment)
- ✅ Complete consultation
- ✅ View patient history (previous visits)
- ✅ Save progress during consultation
- ✅ Dashboard with queue statistics

### System Features:

- ✅ Real-time updates (Socket.io)
- ✅ Automatic stock reduction
- ✅ Permanent medicine history
- ✅ Visit round tracking
- ✅ Role-based access control
- ✅ Responsive design
- ✅ Toast notifications
- ✅ Form validation
- ✅ Error handling

---

## 🔄 What Happens Behind the Scenes

### When Doctor Dispenses Medicine:

1. ✅ Prescription record created in database
2. ✅ Dispense record created with timestamp
3. ✅ Medicine stock automatically reduced
4. ✅ Added to patient's permanent medicine history
5. ✅ Doctor's name recorded as dispenser
6. ✅ Visit updated with medicine information
7. ✅ Real-time notification sent (if others watching)

### When Consultation Completes:

1. ✅ Visit status changes to "completed"
2. ✅ Consultation end time recorded
3. ✅ All data saved to database
4. ✅ Patient removed from queue
5. ✅ Doctor dashboard updated
6. ✅ Visit count incremented for patient
7. ✅ Audit log created

---

## 🐛 Troubleshooting

### Frontend Not Loading?

```bash
cd Frontend
npm install
npm run dev
```

Access at: http://localhost:5174

### Backend Not Running?

```bash
cd Backend
npm install
npm run dev
```

Should show: "Server running on http://localhost:5000"

### No Patients in Queue?

```bash
cd Backend
npm run test-data
```

This creates 5 patients and 3 waiting visits

### Can't Login?

Make sure backend is running. Check:

- URL is http://localhost:5174 (note port 5174, not 5173)
- Backend is on http://localhost:5000
- Use exact credentials from above

### Database Connection Error?

Check Backend/.env file:

- DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD are correct
- PostgreSQL is running

---

## 📱 UI Navigation Guide

### Sidebar Menu Items (Role-Based):

**Data Clerk:**

- 🏠 Dashboard
- 👥 Patients
- 📅 Visits

**Doctor:**

- 🏠 Dashboard
- 📋 Queue ← **Main feature**
- 👥 Patients (view only)
- 📅 Visits (view only)

**Super Admin:**

- 🏠 Dashboard
- 👥 Staff
- 👥 Patients
- 📅 Visits
- 📊 Reports
- ⚙️ Settings

---

## 🎨 UI Color Coding

- **Green Card** = Dispensed Medicine ✅
- **Yellow Card** = Pending Prescription ⏳
- **Red Alert Box** = Allergies/Chronic Diseases ⚠️
- **Blue Card** = Information
- **Emerald Gradient** = Primary Actions

---

## 📊 Dashboard Metrics

### Doctor Dashboard Shows:

- **In Queue:** Number of waiting patients
- **Completed Today:** Consultations finished today
- **Prescriptions:** Medicines prescribed today
- **Dispensed:** Medicines dispensed today
- **Waiting Patients List:** With "Start Consultation" buttons

### Data Clerk Dashboard Shows:

- **Registered Today:** New patients today
- **Today's Visits:** All visits created today
- **Waiting Patients:** Patients in queue
- **Recent Registrations:** Last patients registered

---

## 💡 Tips for Best Experience

1. **Start with Data Clerk:** Register patients and create visits first
2. **Then Login as Doctor:** Process the waiting patients
3. **Pay Attention to Alerts:** Red boxes show important patient info
4. **Dispense Immediately:** Check "Dispense Now" by default
5. **Save Progress:** Use "Save Progress" for long consultations
6. **Complete Diagnosis:** Can't complete without at least one diagnosis
7. **Check Patient History:** Review previous visits before prescribing
8. **Use Appropriate Units:** Grams for powders, ml for liquids
9. **Add Clear Instructions:** Help patients understand how to use medicine
10. **Follow-up Dates:** Set for chronic conditions

---

## 🎓 Training Sequence

**Day 1 - Data Clerk:**

1. Register 5 test patients
2. Create 10 test visits
3. Practice search and filtering

**Day 2 - Doctor:**

1. Process all waiting patients
2. Record vital signs for each
3. Prescribe and dispense medicines
4. Complete consultations

**Day 3 - Full Workflow:**

1. Data clerk creates new visit
2. Doctor immediately sees in queue
3. Complete consultation end-to-end
4. Verify medicine stock reduced
5. Check patient history updated

---

## 📞 System Status

**Backend:** ✅ Running on port 5000
**Frontend:** ✅ Running on port 5174
**Database:** ✅ PostgreSQL connected
**Socket.io:** ✅ Real-time enabled
**Test Data:** ✅ Created (5 patients, 3 visits, 3 medicines)

---

## 🎉 You're Ready!

Open http://localhost:5174 and start testing!

**Recommended Test Flow:**

1. Login as Data Clerk → Create a new visit
2. Login as Doctor → Go to Queue
3. Click "Start Consultation" on first patient
4. Complete all tabs (Vital Signs, Medicine, Consultation)
5. Click "Complete Consultation"
6. See patient removed from queue!

**Have fun! 🌿💊**
