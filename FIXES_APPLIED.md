# Fixes Applied - Waiting Patients Issue

## Problem

Doctor's Queue page showing "No patients waiting" even though there are waiting visits in the database.

## Root Causes Identified

### 1. Queue Filter Too Restrictive

**File:** `Frontend/src/pages/portal/DoctorQueuePage.jsx`
**Issue:** Was filtering by `doctorId: user.id` - but visits created by data clerk don't have doctor assigned yet
**Fix:** Removed doctorId filter, now fetches all waiting visits

### 2. Missing Patient Details in API Response

**File:** `Backend/src/services/visitService.js`
**Issue:** API was only returning basic patient info (id, name, phone)
**Fix:** Added all necessary patient fields:

- age
- gender
- bloodGroup
- knownAllergies
- chronicDiseases
- middleName

### 3. Dashboard Button Not Clickable

**File:** `Frontend/src/pages/portal/DashboardPage.jsx`
**Issue:** "Start Consultation" button had no onClick handler
**Fix:** Added navigation to queue page with visitId parameter

### 4. Auto-Start Consultation Not Working

**File:** `Frontend/src/pages/portal/DoctorQueuePage.jsx`  
**Issue:** Clicking from dashboard didn't auto-start consultation
**Fix:** Added URL parameter detection and auto-start logic

## Changes Made

### Frontend Changes:

#### 1. DoctorQueuePage.jsx

```javascript
// OLD - Too restrictive
const response = await axiosInstance.get("/visits", {
  params: {
    status: "waiting",
    doctorId: user.id, // ❌ This filters out visits without doctor
    sortBy: "arrivalTime",
    sortOrder: "ASC",
  },
});

// NEW - Shows all waiting visits
const response = await axiosInstance.get("/visits", {
  params: {
    status: "waiting", // ✅ Only filter by status
    sortBy: "arrivalTime",
    sortOrder: "ASC",
  },
});
```

Added auto-start consultation:

```javascript
// Import useSearchParams
import { useNavigate, useSearchParams } from "react-router-dom";

// In component
const [searchParams] = useSearchParams();

// Auto-start consultation if visitId in URL
useEffect(() => {
  const visitId = searchParams.get("visitId");
  if (visitId && queue.length > 0) {
    const visit = queue.find((v) => v.id === visitId);
    if (visit) {
      handleStartConsultation(visit);
    }
  }
}, [queue, searchParams]);
```

#### 2. DashboardPage.jsx

```javascript
// Added import
import { useNavigate } from "react-router-dom";

// In component
const navigate = useNavigate();

// Fixed button
<button
  onClick={() => navigate(`/portal/queue?visitId=${visit.id}`)}
  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
>
  Start Consultation
</button>;
```

### Backend Changes:

#### visitService.js

```javascript
// Enhanced patient data in API response
include: [
  {
    model: Patient,
    as: "patient",
    attributes: [
      "id",
      "patientId",
      "firstName",
      "middleName",  // Added
      "lastName",
      "age",  // Added
      "gender",  // Added
      "phone",
      "bloodGroup",  // Added
      "knownAllergies",  // Added
      "chronicDiseases",  // Added
    ],
  },
  ...
]
```

## How to Test

### 1. Check if Visits Exist

```bash
cd Backend
npm run test-data
```

This creates:

- 5 patients
- 3 waiting visits with status="waiting"

### 2. Login as Doctor

- URL: http://localhost:5174
- Email: doctor@neshihaclinic.com
- Password: Doctor@123

### 3. Go to Queue

- Click "Queue" in sidebar
- Should see 3-4 waiting patients
- Each card shows:
  - Queue number (1, 2, 3...)
  - Patient name, age, gender
  - Patient ID
  - Chief complaint
  - "Start Consultation" button

### 4. Test Dashboard Button

- Go to "Dashboard"
- See "Waiting Patients" section
- Click "Start Consultation" on any patient
- Should navigate to Queue and auto-start consultation

## Expected Behavior Now

✅ **Queue Page:**

- Shows ALL waiting patients (not just assigned to this doctor)
- Sorted by arrival time (earliest first)
- Displays complete patient info
- "Start Consultation" button works

✅ **Dashboard:**

- Shows waiting patients list
- "Start Consultation" button navigates to Queue
- Auto-starts consultation for that patient

✅ **Consultation:**

- Opens with all patient details
- Shows allergies & chronic diseases in red alert
- All 5 tabs work (Consultation, Vitals, Investigation, Medicine, History)
- Can save progress or complete consultation

## Why Visits Might Still Not Show

### Issue 1: No Test Data

**Solution:** Run `npm run test-data` in Backend folder

### Issue 2: Old Visit Date

Test data creates visits for TODAY only. If you created visits yesterday, they won't show.
**Solution:** Create new visit as data clerk, or check database

### Issue 3: Visit Status Not "waiting"

If visits are "in_consultation" or "completed", they won't show in queue.
**Solution:** Check database or create new visits

### Issue 4: Backend Not Running

**Solution:** Ensure backend is on http://localhost:5000

### Issue 5: Authentication Issue

**Solution:** Logout and login again to refresh token

## Database Query to Verify

Check visits in database:

```sql
SELECT
  visit_number,
  patient_id,
  status,
  visit_date,
  arrival_time,
  chief_complaint
FROM visits
WHERE status = 'waiting'
ORDER BY arrival_time ASC;
```

Should return rows if visits exist.

## API Test

Open browser console (F12) on http://localhost:5174:

```javascript
fetch("http://localhost:5000/api/v1/visits?status=waiting", {
  headers: {
    Authorization: "Bearer " + localStorage.getItem("accessToken"),
  },
})
  .then((res) => res.json())
  .then((data) => console.log("Visits:", data));
```

Should return visits array with patient details.

## Files Modified

### Frontend:

1. ✅ `src/pages/portal/DoctorQueuePage.jsx`
   - Removed doctorId filter
   - Added error handling
   - Added auto-start consultation
2. ✅ `src/pages/portal/DashboardPage.jsx`
   - Added useNavigate import
   - Added onClick to "Start Consultation" button
3. ✅ `src/pages/portal/VisitsPage.jsx`
   - Fixed data.visits array handling
4. ✅ `src/components/visits/VisitForm.jsx`
   - Added arrivalTime field (required)
   - Fixed patient array handling

### Backend:

1. ✅ `src/services/visitService.js`
   - Enhanced patient data in API response
   - Added age, gender, allergies, chronic diseases

## Status: ✅ FIXED

All changes have been applied. The queue should now show waiting patients correctly.

## Next Steps

1. **Restart both servers:**

   ```bash
   # Kill all
   Stop-Process -Name node -Force

   # Start backend
   cd Backend
   npm run dev

   # Start frontend
   cd Frontend
   npm run dev
   ```

2. **Create test data:**

   ```bash
   cd Backend
   npm run test-data
   ```

3. **Test the flow:**
   - Login as doctor
   - Go to Queue
   - See waiting patients!

---

**Date:** June 16, 2026
**Status:** ✅ Complete
