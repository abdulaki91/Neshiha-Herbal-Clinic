# API Quick Reference Guide

## Base URL

```
http://localhost:5000/api/v1
```

## Authentication

All protected routes require this header:

```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

---

## 🔐 Authentication Endpoints

### Login

```http
POST /auth/login
Content-Type: application/json

{
  "email": "admin@neshihaclinic.com",
  "password": "Admin@123"
}
```

### Get Profile

```http
GET /auth/profile
Authorization: Bearer {token}
```

### Change Password

```http
PUT /auth/change-password
Authorization: Bearer {token}

{
  "currentPassword": "Admin@123",
  "newPassword": "NewPassword@123"
}
```

### Refresh Token

```http
POST /auth/refresh

{
  "refreshToken": "your_refresh_token"
}
```

---

## 👥 Staff Management

### List Staff

```http
GET /staff?page=1&pageSize=10&role=doctor&status=active
Authorization: Bearer {token}
```

### Create Staff

```http
POST /staff
Authorization: Bearer {token}

{
  "email": "newdoctor@clinic.com",
  "password": "Doctor@123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+251911234567",
  "role": "doctor",
  "department": "General Medicine",
  "specialization": "Internal Medicine"
}
```

### Update Staff

```http
PUT /staff/{id}
Authorization: Bearer {token}

{
  "firstName": "Jane",
  "phone": "+251911234568"
}
```

---

## 🏥 Patient Management

### Register Patient

```http
POST /patients
Authorization: Bearer {token}

{
  "firstName": "Abebe",
  "middleName": "Kebede",
  "lastName": "Tadesse",
  "gender": "male",
  "dateOfBirth": "1990-05-15",
  "phone": "+251911222333",
  "email": "abebe@email.com",
  "nationalId": "ET1234567890",
  "bloodGroup": "A+",
  "city": "Addis Ababa",
  "subCity": "Bole",
  "woreda": "07",
  "emergencyContactName": "Almaz Tadesse",
  "emergencyContactPhone": "+251911444555",
  "knownAllergies": ["Penicillin"],
  "chronicDiseases": ["Hypertension"]
}
```

### List Patients

```http
GET /patients?page=1&pageSize=10&search=Abebe
Authorization: Bearer {token}
```

### Get Patient Details

```http
GET /patients/{id}
Authorization: Bearer {token}
```

### Get Patient History

```http
GET /patients/{id}/history
Authorization: Bearer {token}
```

### Upload Patient Photo

```http
POST /patients/{id}/photo
Authorization: Bearer {token}
Content-Type: multipart/form-data

photo: [file]
```

---

## 📋 Visit Management

### Create Visit

```http
POST /visits
Authorization: Bearer {token}

{
  "patientId": "uuid-here",
  "chiefComplaint": "Fever and headache for 3 days",
  "visitDate": "2024-01-15"
}
```

### Get Doctor Queue

```http
GET /visits/queue
Authorization: Bearer {token}
```

### Record Vital Signs

```http
POST /visits/{id}/vitals
Authorization: Bearer {token}

{
  "temperature": 38.5,
  "bloodPressureSystolic": 120,
  "bloodPressureDiastolic": 80,
  "heartRate": 75,
  "respiratoryRate": 18,
  "oxygenSaturation": 98,
  "weight": 70,
  "height": 175
}
```

### Update Visit

```http
PUT /visits/{id}
Authorization: Bearer {token}

{
  "diagnosis": "Acute viral infection",
  "treatmentPlan": "Paracetamol 500mg TDS for 5 days, rest and fluids",
  "doctorNotes": "Patient advised to return if symptoms worsen",
  "followUpDate": "2024-01-22"
}
```

### Update Visit Status

```http
PATCH /visits/{id}/status
Authorization: Bearer {token}

{
  "status": "completed"
}
```

---

## 💊 Medicine Management

### List Medicines

```http
GET /medicines?page=1&pageSize=10&search=Paracetamol&category=Analgesic
Authorization: Bearer {token}
```

### Create Medicine

```http
POST /medicines
Authorization: Bearer {token}

{
  "name": "Paracetamol",
  "genericName": "Acetaminophen",
  "strength": "500mg",
  "dosageForm": "Tablet",
  "category": "Analgesic",
  "manufacturer": "PharmaCo",
  "availableQuantity": 500,
  "minimumStock": 50,
  "sellingPrice": 2.50,
  "purchasePrice": 1.50,
  "expiryDate": "2025-12-31"
}
```

### Get Low Stock Medicines

```http
GET /medicines/low-stock
Authorization: Bearer {token}
```

### Get Expired Medicines

```http
GET /medicines/expired
Authorization: Bearer {token}
```

### Adjust Stock

```http
PATCH /medicines/{id}/adjust-stock
Authorization: Bearer {token}

{
  "quantity": 100,
  "type": "add"
}
```

---

## 📝 Prescription Management

### Create Prescription

```http
POST /prescriptions
Authorization: Bearer {token}

{
  "visitId": "uuid-here",
  "patientId": "uuid-here",
  "medicineId": "uuid-here",
  "dosage": "500mg",
  "frequency": "three_times_daily",
  "route": "oral",
  "duration": "5 days",
  "quantity": 15,
  "instructions": "Take after meals",
  "reason": "Fever and pain"
}
```

### Dispense Medicine

```http
POST /prescriptions/{id}/dispense
Authorization: Bearer {token}

{
  "quantity": 15
}
```

### Stop Prescription

```http
PATCH /prescriptions/{id}/stop
Authorization: Bearer {token}

{
  "reason": "Patient developed allergic reaction"
}
```

---

## 🔬 Investigation Management

### Create Investigation

```http
POST /investigations
Authorization: Bearer {token}

{
  "visitId": "uuid-here",
  "patientId": "uuid-here",
  "investigationType": "Blood Test",
  "testName": "Complete Blood Count (CBC)",
  "instructions": "Fasting required",
  "urgency": "routine"
}
```

### Add Results

```http
POST /investigations/{id}/results
Authorization: Bearer {token}
Content-Type: multipart/form-data

results: "WBC: 7000, RBC: 4.5M, Platelets: 250K"
resultFile: [file]
```

---

## 📊 Dashboard

### Admin Dashboard

```http
GET /dashboard/admin
Authorization: Bearer {token}
```

### Doctor Dashboard

```http
GET /dashboard/doctor
Authorization: Bearer {token}
```

### Clerk Dashboard

```http
GET /dashboard/clerk
Authorization: Bearer {token}
```

---

## 📈 Reports

### Patient Report

```http
GET /reports/patients?startDate=2024-01-01&endDate=2024-01-31&gender=male
Authorization: Bearer {token}
```

### Visit Report

```http
GET /reports/visits?startDate=2024-01-01&endDate=2024-01-31&status=completed
Authorization: Bearer {token}
```

### Medicine Report

```http
GET /reports/medicines?category=Antibiotic&status=available
Authorization: Bearer {token}
```

### Daily Report

```http
GET /reports/daily?date=2024-01-15
Authorization: Bearer {token}
```

### Monthly Report

```http
GET /reports/monthly?year=2024&month=1
Authorization: Bearer {token}
```

---

## ⚙️ Settings

### Get Settings

```http
GET /settings
Authorization: Bearer {token}
```

### Update Settings

```http
PUT /settings
Authorization: Bearer {token}

{
  "clinicName": "Neshiha Herbal Clinic",
  "clinicPhone": "+251911123456",
  "clinicEmail": "info@neshihaclinic.com",
  "lowStockThreshold": 10,
  "enableEmailNotifications": true
}
```

---

## 🔔 Notifications

### Get Notifications

```http
GET /notifications?page=1&isRead=false&priority=high
Authorization: Bearer {token}
```

### Mark as Read

```http
PATCH /notifications/{id}/read
Authorization: Bearer {token}
```

### Delete Notification

```http
DELETE /notifications/{id}
Authorization: Bearer {token}
```

---

## 📋 Common Query Parameters

### Pagination

```
page=1
pageSize=10
```

### Sorting

```
sortBy=createdAt
sortOrder=DESC
```

### Filtering

```
status=active
role=doctor
gender=male
category=Antibiotic
```

### Search

```
search=keyword
```

---

## 🔒 Role Access Summary

| Endpoint             | Super Admin | Staff Manager | Data Clerk | Doctor      |
| -------------------- | ----------- | ------------- | ---------- | ----------- |
| Auth (all)           | ✅          | ✅            | ✅         | ✅          |
| Staff Management     | ✅          | ✅            | ❌         | ❌          |
| Patient Registration | ✅          | ❌            | ✅         | ❌          |
| Patient View         | ✅          | ✅            | ✅         | ✅          |
| Visit Creation       | ✅          | ❌            | ✅         | ❌          |
| Visit Management     | ✅          | ❌            | ❌         | ✅          |
| Medicine Management  | ✅          | ❌            | ❌         | ❌          |
| Prescriptions        | ✅          | ❌            | ❌         | ✅          |
| Investigations       | ✅          | ❌            | ❌         | ✅          |
| Dashboard            | ✅ (All)    | ❌            | ✅ (Clerk) | ✅ (Doctor) |
| Reports              | ✅          | ✅            | ❌         | ✅          |
| Settings             | ✅          | ❌            | ❌         | ❌          |

---

## ✅ Success Response Format

```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## ❌ Error Response Format

```json
{
  "success": false,
  "message": "Error message",
  "errors": [ ... ],
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## 📄 Paginated Response Format

```json
{
  "success": true,
  "message": "Data retrieved successfully",
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "totalItems": 50,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## 🧪 Testing with cURL

### Example: Complete Patient Registration Flow

```bash
# 1. Login as Data Clerk
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"clerk@neshihaclinic.com","password":"Clerk@123"}'

# 2. Register Patient
curl -X POST http://localhost:5000/api/v1/patients \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"firstName":"Test","lastName":"Patient","gender":"male","dateOfBirth":"1995-01-01","phone":"+251911111111"}'

# 3. Create Visit
curl -X POST http://localhost:5000/api/v1/visits \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"patientId":"PATIENT_UUID","chiefComplaint":"General checkup"}'
```

---

For more details, see the full README.md and INSTALLATION.md files.
