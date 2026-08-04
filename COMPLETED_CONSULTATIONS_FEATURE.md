# Completed Consultations Sidebar Feature

## Overview

This feature provides a comprehensive sidebar that displays all completed consultations for doctors. When clicking on a consultation, it shows the complete patient history including all visits, prescriptions, investigations, and medical documents.

## ✨ Features

### 1. **Completed Consultations List**

- View all completed consultations by the logged-in doctor
- Search by patient name, ID, phone, or card number
- Filter by date range (start date and end date)
- Pagination support for large datasets
- Real-time data updates

### 2. **Consultation Cards**

- Patient name and ID
- Gender icon (👨/👩)
- Visit date and consultation time
- Diagnosis summary
- Quick access to full history

### 3. **Complete Patient History Modal**

When clicking "View Full History", shows:

#### Patient Information

- Full name, ID, age, gender
- Blood group
- Phone number
- Known allergies (highlighted)
- Chronic diseases

#### Visit History

- Timeline of all visits
- Doctor who saw the patient
- Visit status
- Symptoms, diagnosis, and treatment plan
- Visit date and time

#### Prescriptions

- All prescribed medications
- Dosage, frequency, and duration
- Prescription dates

#### Investigations

- Laboratory tests and imaging
- Test names and status
- Request dates

## 🔧 Backend Implementation

### New API Endpoint

**Endpoint:** `GET /api/v1/visits/completed`

**Description:** Get all completed consultations for the logged-in doctor

**Access:** Private (Doctor role only)

**Query Parameters:**

- `page` (optional) - Page number (default: 1)
- `pageSize` (optional) - Items per page (default: 20)
- `search` (optional) - Search patient name, ID, phone, etc.
- `startDate` (optional) - Filter from this date (YYYY-MM-DD)
- `endDate` (optional) - Filter to this date (YYYY-MM-DD)

**Response:**

```json
{
  "success": true,
  "message": "Completed consultations retrieved successfully",
  "data": [
    {
      "id": "visit-uuid",
      "visitDate": "2024-01-15",
      "consultationStartTime": "09:00:00",
      "consultationEndTime": "09:30:00",
      "status": "completed",
      "symptoms": ["Headache", "Fever"],
      "diagnosis": ["Common Cold"],
      "treatmentPlan": "Rest and hydration",
      "patient": {
        "id": "patient-uuid",
        "patientId": "P001",
        "firstName": "John",
        "middleName": "A",
        "lastName": "Doe",
        "age": 35,
        "gender": "male",
        "phone": "+1234567890",
        "bloodGroup": "O+",
        "knownAllergies": ["Penicillin"],
        "chronicDiseases": ["Hypertension"]
      },
      "doctor": {
        "id": "doctor-uuid",
        "firstName": "Jane",
        "lastName": "Smith",
        "specialization": "General Medicine"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 45
  }
}
```

**Example Requests:**

```bash
# Get all completed consultations
curl -X GET \
  "http://localhost:5000/api/v1/visits/completed" \
  -H "Authorization: Bearer {token}"

# Search for patient
curl -X GET \
  "http://localhost:5000/api/v1/visits/completed?search=John" \
  -H "Authorization: Bearer {token}"

# Filter by date range
curl -X GET \
  "http://localhost:5000/api/v1/visits/completed?startDate=2024-01-01&endDate=2024-01-31" \
  -H "Authorization: Bearer {token}"

# Pagination
curl -X GET \
  "http://localhost:5000/api/v1/visits/completed?page=2&pageSize=10" \
  -H "Authorization: Bearer {token}"
```

### Backend Files Modified

1. **`Backend/src/services/visitService.js`**
   - Added `getCompletedConsultations()` function
   - Supports search and date filtering
   - Includes patient and doctor information
   - Pagination support

2. **`Backend/src/controllers/visitController.js`**
   - Added `getCompletedConsultations()` controller
   - Extracts doctor ID from JWT token
   - Handles query parameters

3. **`Backend/src/routes/visitRoutes.js`**
   - Added `GET /completed` route
   - Requires authentication and doctor role

## 🎨 Frontend Implementation

### New Components

#### 1. **CompletedConsultationsSidebar**

**Location:** `Frontend/src/components/visits/CompletedConsultationsSidebar.jsx`

**Props:**

- `onSelectConsultation` (optional) - Callback when consultation is selected

**Features:**

- Search functionality
- Date range filters
- Clear filters button
- Consultation cards with patient info
- Click to view full history modal

**Example Usage:**

```jsx
import CompletedConsultationsSidebar from "../components/visits/CompletedConsultationsSidebar";

function DoctorPortal() {
  const handleSelectConsultation = (consultation) => {
    console.log("Selected:", consultation);
    // Do something with selected consultation
  };

  return (
    <div className="portal-layout">
      <aside className="sidebar">
        <CompletedConsultationsSidebar
          onSelectConsultation={handleSelectConsultation}
        />
      </aside>

      <main className="main-content">{/* Main consultation area */}</main>
    </div>
  );
}
```

### Frontend Hooks

**Added to `Frontend/src/hooks/useVisits.js`:**

```javascript
/**
 * Get completed consultations for the logged-in doctor
 */
export const useCompletedConsultations = (params = {}) =>
  useQuery({
    queryKey: ["visits", "completed", params],
    queryFn: () => axiosInstance.get("/visits/completed", { params }),
    select: (res) => ({
      consultations: res.data || [],
      pagination: res.pagination,
    }),
    staleTime: 30_000, // 30 seconds
  });
```

## 📖 Integration Guide

### Step 1: Add Sidebar to Doctor Portal

```jsx
// Example: DoctorPortal.jsx
import { useState } from "react";
import CompletedConsultationsSidebar from "../components/visits/CompletedConsultationsSidebar";

function DoctorPortal() {
  const [selectedConsultation, setSelectedConsultation] = useState(null);

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* Sidebar - Fixed width */}
      <aside style={{ width: "400px", overflowY: "auto" }}>
        <CompletedConsultationsSidebar
          onSelectConsultation={setSelectedConsultation}
        />
      </aside>

      {/* Main content area */}
      <main style={{ flex: 1, padding: "20px" }}>
        {selectedConsultation ? (
          <div>
            <h2>Selected Consultation</h2>
            <p>Patient: {selectedConsultation.patient.firstName}</p>
            {/* Display consultation details */}
          </div>
        ) : (
          <p>Select a consultation from the sidebar</p>
        )}
      </main>
    </div>
  );
}

export default DoctorPortal;
```

### Step 2: Alternative - Collapsible Sidebar

```jsx
import { useState } from "react";
import CompletedConsultationsSidebar from "../components/visits/CompletedConsultationsSidebar";

function DoctorPortal() {
  const [showSidebar, setShowSidebar] = useState(false);

  return (
    <div className="doctor-portal">
      {/* Toggle Button */}
      <button
        onClick={() => setShowSidebar(!showSidebar)}
        className="sidebar-toggle"
      >
        {showSidebar ? "Hide" : "Show"} History
      </button>

      {/* Sidebar */}
      {showSidebar && (
        <div className="sidebar-container">
          <CompletedConsultationsSidebar />
        </div>
      )}

      {/* Main Content */}
      <div className="main-content">{/* Your consultation interface */}</div>
    </div>
  );
}
```

### Step 3: With Tabs

```jsx
import { Tab, Tabs } from "your-ui-library";
import CompletedConsultationsSidebar from "../components/visits/CompletedConsultationsSidebar";
import QueueSection from "../components/visits/QueueSection";

function DoctorPortal() {
  return (
    <Tabs>
      <Tab label="Today's Queue">
        <QueueSection />
      </Tab>

      <Tab label="Completed Consultations">
        <CompletedConsultationsSidebar />
      </Tab>

      <Tab label="Appointments">{/* Appointments component */}</Tab>
    </Tabs>
  );
}
```

## 🎯 Use Cases

### Use Case 1: Review Past Consultations

A doctor wants to review consultations from last week:

1. Open sidebar
2. Set date range (start: 7 days ago, end: today)
3. Browse completed consultations
4. Click on a consultation to view full history

### Use Case 2: Find Patient History

A doctor sees a returning patient and wants to check previous visits:

1. Open sidebar
2. Search patient name or ID
3. Click on patient's previous consultation
4. View full history modal with all visits, prescriptions, etc.

### Use Case 3: Follow-up Review

A doctor wants to follow up on a specific diagnosis:

1. Open sidebar
2. Search for diagnosis in patient data
3. Review treatment plan and outcomes
4. Check if follow-up visits occurred

## 🔍 Search Functionality

The search feature searches across:

- Patient first name
- Patient middle name
- Patient last name
- Patient ID
- Card number
- Phone number

**Example:**

- Search "John" → Finds all Johns
- Search "P001" → Finds patient with ID P001
- Search "555-1234" → Finds patient with that phone number

## 📅 Date Filtering

**Options:**

1. **No dates** - Shows all completed consultations
2. **Start date only** - Shows consultations from that date onwards
3. **End date only** - Shows consultations up to that date
4. **Both dates** - Shows consultations within that range

**Example:**

- Start: 2024-01-01, End: 2024-01-31 → Shows January consultations
- Start: 2024-01-15, End: (empty) → Shows from Jan 15 onwards
- Start: (empty), End: 2024-01-31 → Shows up to Jan 31

## 🎨 Styling and Customization

### Custom Colors

Edit `CompletedConsultationsSidebar.css`:

```css
/* Change primary color */
.sidebar-header {
  background: linear-gradient(135deg, #your-color1 0%, #your-color2 100%);
}

.view-history-btn {
  background: linear-gradient(135deg, #your-color1, #your-color2);
}
```

### Layout Adjustments

```css
/* Make sidebar wider */
.completed-consultations-sidebar {
  width: 500px; /* Adjust as needed */
}

/* Adjust card spacing */
.consultation-item {
  margin-bottom: 20px; /* More/less space between cards */
}
```

## 🧪 Testing

### Backend Testing

```bash
# Test endpoint without filters
curl -X GET \
  "http://localhost:5000/api/v1/visits/completed" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test with search
curl -X GET \
  "http://localhost:5000/api/v1/visits/completed?search=John" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test with date filter
curl -X GET \
  "http://localhost:5000/api/v1/visits/completed?startDate=2024-01-01&endDate=2024-01-31" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test pagination
curl -X GET \
  "http://localhost:5000/api/v1/visits/completed?page=1&pageSize=5" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Frontend Testing

1. **Component Renders**
   - [ ] Sidebar displays without errors
   - [ ] Header shows correct title
   - [ ] Search box is visible
   - [ ] Date filters are visible

2. **Search Functionality**
   - [ ] Can type in search box
   - [ ] Results filter as you type
   - [ ] Shows "No consultations found" when no matches
   - [ ] Clear filters button appears when searching

3. **Date Filtering**
   - [ ] Can select start date
   - [ ] Can select end date
   - [ ] Results filter based on dates
   - [ ] Clear filters resets dates

4. **Consultation Cards**
   - [ ] Cards display patient info correctly
   - [ ] Gender icon shows correctly
   - [ ] Date and time formatted properly
   - [ ] Diagnosis shows if available
   - [ ] Hover effect works

5. **View History**
   - [ ] Click opens modal
   - [ ] Modal shows patient info
   - [ ] Visit history displays
   - [ ] Prescriptions show
   - [ ] Investigations show
   - [ ] Close button works
   - [ ] Click outside closes modal

## 🐛 Troubleshooting

### Issue: No consultations showing

**Solutions:**

1. Ensure doctor has completed consultations
2. Check if visits are marked as "completed" status
3. Verify JWT token is valid
4. Check backend logs for errors
5. Ensure doctorId matches the logged-in doctor

### Issue: Search not working

**Solutions:**

1. Check network tab for API errors
2. Verify search parameter is being sent
3. Clear browser cache
4. Check backend search logic

### Issue: Modal not opening

**Solutions:**

1. Check browser console for JavaScript errors
2. Verify `usePatientHistory` hook is working
3. Ensure patient ID is valid
4. Check if modal CSS is loaded

### Issue: Date filter not working

**Solutions:**

1. Ensure dates are in YYYY-MM-DD format
2. Check if dates are being sent to backend
3. Verify backend date filtering logic
4. Try different date ranges

## 📊 Performance Considerations

1. **Pagination:** Default page size is 20 to prevent loading too much data
2. **Stale Time:** 30 seconds cache to reduce unnecessary API calls
3. **Lazy Loading:** Patient history only loads when modal is opened
4. **Debounced Search:** Consider adding debounce for search input (optional)

### Optional: Add Search Debouncing

```jsx
import { useState, useEffect } from "react";
import { useDebounce } from "use-debounce"; // Install: npm install use-debounce

function CompletedConsultationsSidebar() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch] = useDebounce(searchTerm, 500); // 500ms delay

  const { data } = useCompletedConsultations({
    search: debouncedSearch, // Use debounced value
  });

  // ... rest of component
}
```

## 🚀 Future Enhancements

Potential features to add:

1. **Export to PDF** - Export patient history as PDF
2. **Print View** - Print-friendly version of history
3. **Advanced Filters** - Filter by diagnosis, treatment, etc.
4. **Sort Options** - Sort by date, patient name, etc.
5. **Favorite Patients** - Mark patients for quick access
6. **Notes** - Add private notes to consultations
7. **Statistics** - Show consultation statistics (avg time, common diagnoses, etc.)
8. **Reminders** - Set reminders for follow-ups
9. **Bulk Actions** - Select multiple consultations for bulk operations
10. **Timeline View** - Alternative timeline view of consultations

## 📚 Related Features

This feature works seamlessly with:

- **Visit Attachments** - View uploaded documents in history
- **Prescriptions** - All prescriptions shown in history
- **Investigations** - Lab results and imaging in history
- **Patient Management** - Links to full patient records

## 🎉 Summary

The Completed Consultations Sidebar provides doctors with:

✅ Easy access to all past consultations  
✅ Powerful search and filtering  
✅ Complete patient history at a click  
✅ Professional, modern UI  
✅ Responsive design  
✅ Smooth animations and transitions  
✅ Print-ready patient history

This feature significantly improves the doctor's workflow by providing quick access to historical data and comprehensive patient information.
