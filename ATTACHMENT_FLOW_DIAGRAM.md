# Visit Attachments - System Flow Diagram

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     DOCTOR QUEUE / CONSULTATION                  │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                                                             │  │
│  │         VisitAttachmentUpload Component                    │  │
│  │                                                             │  │
│  │  [Upload Button]  [Drag & Drop Zone]  [File List]         │  │
│  │                                                             │  │
│  └───────────────────────────────────────────────────────────┘  │
│                          ▲                                        │
│                          │                                        │
│                          │ React Hooks                            │
│                          ▼                                        │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              useVisits.js (Frontend Hooks)                │  │
│  │                                                             │  │
│  │  • useUploadVisitAttachment()                             │  │
│  │  • useUploadMultipleVisitAttachments()                    │  │
│  │  • useVisitAttachments(visitId)                           │  │
│  │                                                             │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                             │
                             │ HTTP/HTTPS + JWT
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                         BACKEND API                              │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                  Visit Routes                              │  │
│  │                                                             │  │
│  │  POST   /api/v1/visits/:id/attachments                    │  │
│  │  POST   /api/v1/visits/:id/attachments/multiple           │  │
│  │  GET    /api/v1/visits/:id/attachments                    │  │
│  │                                                             │  │
│  └───────────────────────────────────────────────────────────┘  │
│                          ▲                                        │
│                          │                                        │
│        ┌─────────────────┼─────────────────┐                    │
│        │                 │                 │                     │
│        ▼                 ▼                 ▼                     │
│  [Auth Middleware] [Upload Middleware] [Audit Logger]          │
│                          │                                        │
│                          ▼                                        │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              Visit Controller                              │  │
│  │                                                             │  │
│  │  • uploadVisitAttachment()                                │  │
│  │  • uploadMultipleVisitAttachments()                       │  │
│  │  • getVisitAttachments()                                  │  │
│  │                                                             │  │
│  └───────────────────────────────────────────────────────────┘  │
│                          │                                        │
│                          ▼                                        │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │        Patient Attachment Service                          │  │
│  │                                                             │  │
│  │  • createAttachment()                                      │  │
│  │  • getAttachmentsByVisitId()                              │  │
│  │  • deleteAttachment()                                      │  │
│  │                                                             │  │
│  └───────────────────────────────────────────────────────────┘  │
│                          │                                        │
│                          ▼                                        │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                  Database (PostgreSQL)                     │  │
│  │                                                             │  │
│  │         patient_attachments Table                          │  │
│  │  ┌──────────────────────────────────────┐                 │  │
│  │  │ id           (UUID, PK)              │                 │  │
│  │  │ patientId    (UUID, FK → patients)   │                 │  │
│  │  │ visitId      (UUID, FK → visits) ✨  │                 │  │
│  │  │ fileName     (String)                │                 │  │
│  │  │ filePath     (String)                │                 │  │
│  │  │ fileType     (String)                │                 │  │
│  │  │ uploadedBy   (UUID, FK → users)      │                 │  │
│  │  │ createdAt    (Timestamp)             │                 │  │
│  │  │ updatedAt    (Timestamp)             │                 │  │
│  │  └──────────────────────────────────────┘                 │  │
│  │                                                             │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              File Storage (uploads/)                       │  │
│  │                                                             │  │
│  │  /uploads/documents/  ← Medical docs, PDFs                │  │
│  │  /uploads/photos/     ← Patient photos                    │  │
│  │  /uploads/investigations/ ← Lab results, X-rays           │  │
│  │  /uploads/others/     ← Other file types                  │  │
│  │                                                             │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Request Flow - Upload Single File

```
Doctor                    Frontend                Backend               Database
  │                          │                       │                     │
  │ 1. Select file           │                       │                     │
  ├─────────────────────────►│                       │                     │
  │                          │                       │                     │
  │ 2. Click Upload          │                       │                     │
  ├─────────────────────────►│                       │                     │
  │                          │                       │                     │
  │                          │ 3. POST /visits/:id/attachments           │
  │                          │    FormData(document) │                     │
  │                          ├──────────────────────►│                     │
  │                          │                       │                     │
  │                          │                       │ 4. Authenticate     │
  │                          │                       │    (JWT)            │
  │                          │                       │                     │
  │                          │                       │ 5. Validate file    │
  │                          │                       │    type & size      │
  │                          │                       │                     │
  │                          │                       │ 6. Save file        │
  │                          │                       │    to disk          │
  │                          │                       │    (uploads/)       │
  │                          │                       │                     │
  │                          │                       │ 7. Create record    │
  │                          │                       ├────────────────────►│
  │                          │                       │                     │
  │                          │                       │ 8. Return record    │
  │                          │                       │◄────────────────────┤
  │                          │                       │                     │
  │                          │ 9. Response (attachment data)               │
  │                          │◄──────────────────────┤                     │
  │                          │                       │                     │
  │                          │ 10. Update UI         │                     │
  │                          │     (show in list)    │                     │
  │                          │                       │                     │
  │ 11. See uploaded file    │                       │                     │
  │◄─────────────────────────┤                       │                     │
  │                          │                       │                     │
```

## Request Flow - Get Visit Attachments

```
Doctor                    Frontend                Backend               Database
  │                          │                       │                     │
  │ 1. Open consultation     │                       │                     │
  ├─────────────────────────►│                       │                     │
  │                          │                       │                     │
  │                          │ 2. useVisitAttachments(visitId)            │
  │                          │    GET /visits/:id/attachments              │
  │                          ├──────────────────────►│                     │
  │                          │                       │                     │
  │                          │                       │ 3. Authenticate     │
  │                          │                       │    (JWT)            │
  │                          │                       │                     │
  │                          │                       │ 4. Query by visitId │
  │                          │                       ├────────────────────►│
  │                          │                       │                     │
  │                          │                       │ 5. Return records   │
  │                          │                       │◄────────────────────┤
  │                          │                       │                     │
  │                          │ 6. Response (attachments array)             │
  │                          │◄──────────────────────┤                     │
  │                          │                       │                     │
  │                          │ 7. Display list       │                     │
  │                          │                       │                     │
  │ 8. View attachments      │                       │                     │
  │◄─────────────────────────┤                       │                     │
  │                          │                       │                     │
```

## Component Hierarchy

```
DoctorConsultationPage
│
├── PatientInfoSection
│   └── Patient details (name, age, etc.)
│
├── VitalSignsSection
│   └── Vital signs form
│
├── DiagnosisSection
│   └── Diagnosis and notes
│
├── VisitAttachmentUpload ✨ NEW
│   │
│   ├── UploadSection
│   │   ├── ModeSelector (Single/Multiple)
│   │   ├── DropZone
│   │   │   └── FileInput
│   │   ├── SelectedFilesList
│   │   └── UploadButton
│   │
│   └── AttachmentsList
│       ├── LoadingState
│       ├── EmptyState
│       └── AttachmentItems
│           ├── FileIcon
│           ├── FileName (Link)
│           ├── FileMetadata
│           └── DeleteButton
│
└── PrescriptionSection
    └── Prescription form
```

## Data Flow

```
1. FILE UPLOAD
   ┌──────────┐
   │  Doctor  │
   │  Selects │
   │   File   │
   └────┬─────┘
        │
        ▼
   ┌──────────────┐
   │   FormData   │
   │   Creation   │
   └────┬─────────┘
        │
        ▼
   ┌──────────────┐
   │  API Request │
   │  (POST)      │
   └────┬─────────┘
        │
        ▼
   ┌──────────────┐
   │  Middleware  │
   │  Validation  │
   └────┬─────────┘
        │
        ▼
   ┌──────────────┐
   │ Save to Disk │
   │ (uploads/)   │
   └────┬─────────┘
        │
        ▼
   ┌──────────────┐
   │  Save Record │
   │  to Database │
   └────┬─────────┘
        │
        ▼
   ┌──────────────┐
   │   Response   │
   │   to Client  │
   └────┬─────────┘
        │
        ▼
   ┌──────────────┐
   │  Update UI   │
   │ Display File │
   └──────────────┘

2. FILE RETRIEVAL
   ┌──────────┐
   │  Doctor  │
   │  Opens   │
   │  Visit   │
   └────┬─────┘
        │
        ▼
   ┌──────────────┐
   │  API Request │
   │  (GET)       │
   └────┬─────────┘
        │
        ▼
   ┌──────────────┐
   │    Query     │
   │   Database   │
   └────┬─────────┘
        │
        ▼
   ┌──────────────┐
   │   Response   │
   │ (Attachments)│
   └────┬─────────┘
        │
        ▼
   ┌──────────────┐
   │  Display in  │
   │     List     │
   └──────────────┘
```

## Security Layers

```
┌─────────────────────────────────────────────┐
│         Request from Frontend               │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│  Layer 1: Authentication Middleware         │
│  ✓ Verify JWT Token                         │
│  ✓ Validate User Session                    │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│  Layer 2: Authorization Middleware          │
│  ✓ Check User Role (Doctor/Data Clerk)     │
│  ✓ Verify Permissions                       │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│  Layer 3: Upload Middleware                 │
│  ✓ File Type Validation                     │
│  ✓ File Size Limit Check                    │
│  ✓ Sanitize File Name                       │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│  Layer 4: Controller Logic                  │
│  ✓ Validate Visit Exists                    │
│  ✓ Verify Patient Access                    │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│  Layer 5: Service Layer                     │
│  ✓ Business Logic Validation                │
│  ✓ Database Transaction                     │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│  Layer 6: Audit Logging                     │
│  ✓ Log Action & User                        │
│  ✓ Record Timestamp                         │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│          Success Response                    │
└─────────────────────────────────────────────┘
```

## Database Relationships

```
┌─────────────────┐
│     Users       │
│  (Doctors)      │
└────────┬────────┘
         │
         │ uploadedBy
         │
         ▼
┌─────────────────────────┐      ┌─────────────────┐
│  patient_attachments    │◄─────┤    Patients     │
│                         │      │                 │
│  • id                   │      └────────┬────────┘
│  • patientId ──────────────────────────┘
│  • visitId ──────────┐  │
│  • fileName           │  │
│  • filePath           │  │      ┌─────────────────┐
│  • fileType           │  └─────►│     Visits      │
│  • uploadedBy         │         │                 │
│  • createdAt          │         │  • id           │
│  • updatedAt          │         │  • patientId    │
└───────────────────────┘         │  • doctorId     │
                                  │  • status       │
                                  │  • visitDate    │
                                  └─────────────────┘
```

## Summary

This feature seamlessly integrates into the existing system by:

1. **Reusing existing models**: Uses `patient_attachments` table with `visitId` FK
2. **Following patterns**: Uses same structure as other controllers/services
3. **Maintaining security**: All existing security measures apply
4. **Preserving data**: Attachments linked to both patient AND visit
5. **Easy integration**: Simple component prop interface

The doctor can now upload medical documents during consultation without leaving the queue page!
