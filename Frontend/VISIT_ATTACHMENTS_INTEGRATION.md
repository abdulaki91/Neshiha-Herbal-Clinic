# Visit Attachments Feature - Integration Guide

## Overview

This guide explains how to integrate the new visit attachments feature into the doctor's queue/consultation section. This feature allows doctors to upload images, PDFs, medical documents, and other files directly to a patient's record during consultation.

## What Was Added

### Backend (Already Implemented ✅)

1. **New API Endpoints:**
   - `POST /api/v1/visits/:id/attachments` - Upload single file
   - `POST /api/v1/visits/:id/attachments/multiple` - Upload multiple files
   - `GET /api/v1/visits/:id/attachments` - Get all visit attachments

2. **Enhanced Services:**
   - `visitController.js` - Added upload handlers
   - `patientAttachmentService.js` - Added visit-specific queries
   - `visitRoutes.js` - Added new routes with proper authentication

3. **File Support:**
   - Images: JPEG, PNG, GIF, WebP, BMP
   - Documents: PDF, Word, Excel, TXT, CSV
   - Max file size: 5MB per file
   - Multiple file upload support (up to 10 files)

### Frontend (Already Implemented ✅)

1. **React Hooks:**
   - `useUploadVisitAttachment()` - Upload single file
   - `useUploadMultipleVisitAttachments()` - Upload multiple files
   - `useVisitAttachments(visitId)` - Get visit attachments

2. **React Component:**
   - `VisitAttachmentUpload.jsx` - Complete upload UI component
   - Features drag-and-drop, file preview, and attachment list

## Integration Steps

### Step 1: Import the Component

In your doctor queue or consultation page component, import the new component:

```jsx
import VisitAttachmentUpload from "../components/visits/VisitAttachmentUpload";
```

### Step 2: Add to Your Consultation UI

Add the component to your consultation/queue page where doctors view patient information:

```jsx
const DoctorConsultation = () => {
  const { id } = useParams(); // Visit ID from URL
  const { data: visit } = useVisit(id);

  return (
    <div className="consultation-page">
      {/* Existing consultation form */}
      <div className="patient-info">
        <h2>
          {visit?.patient?.firstName} {visit?.patient?.lastName}
        </h2>
        {/* ... other patient info */}
      </div>

      <div className="vital-signs">{/* ... vital signs form */}</div>

      <div className="diagnosis-section">{/* ... diagnosis form */}</div>

      {/* NEW: Add the attachment upload component */}
      <VisitAttachmentUpload visitId={id} patientId={visit?.patient?.id} />

      {/* ... rest of the consultation form */}
    </div>
  );
};
```

### Step 3: Alternative - Add to Queue Item

If you want to add it directly in the queue list for quick access:

```jsx
const QueueItem = ({ visit }) => {
  const [showAttachments, setShowAttachments] = useState(false);

  return (
    <div className="queue-item">
      <div className="patient-summary">
        <h3>
          {visit.patient.firstName} {visit.patient.lastName}
        </h3>
        <button onClick={() => setShowAttachments(!showAttachments)}>
          📎 Attachments
        </button>
      </div>

      {showAttachments && (
        <VisitAttachmentUpload
          visitId={visit.id}
          patientId={visit.patient.id}
        />
      )}
    </div>
  );
};
```

### Step 4: Add to Existing Doctor Portal

If you have a doctor portal page, integrate it there:

**Example: `Frontend/src/pages/portal/DoctorPortal.jsx`**

```jsx
import { useState } from "react";
import { useQueue, useVisit } from "../../hooks/useVisits";
import VisitAttachmentUpload from "../../components/visits/VisitAttachmentUpload";

const DoctorPortal = () => {
  const { data: queue } = useQueue();
  const [selectedVisit, setSelectedVisit] = useState(null);
  const { data: visit } = useVisit(selectedVisit);

  return (
    <div className="doctor-portal">
      {/* Queue Sidebar */}
      <aside className="queue-sidebar">
        <h2>Today's Queue</h2>
        {queue?.map((item) => (
          <div
            key={item.id}
            onClick={() => setSelectedVisit(item.id)}
            className={selectedVisit === item.id ? "active" : ""}
          >
            {item.patient.firstName} {item.patient.lastName}
          </div>
        ))}
      </aside>

      {/* Main Consultation Area */}
      <main className="consultation-area">
        {visit ? (
          <>
            <h2>
              Patient: {visit.patient.firstName} {visit.patient.lastName}
            </h2>

            {/* Vital Signs */}
            <section>
              <h3>Vital Signs</h3>
              {/* ... vital signs form */}
            </section>

            {/* Diagnosis */}
            <section>
              <h3>Diagnosis & Notes</h3>
              {/* ... diagnosis form */}
            </section>

            {/* Attachments - NEW! */}
            <section>
              <VisitAttachmentUpload
                visitId={visit.id}
                patientId={visit.patient.id}
              />
            </section>

            {/* Prescription */}
            <section>
              <h3>Prescription</h3>
              {/* ... prescription form */}
            </section>
          </>
        ) : (
          <p>Select a patient from the queue</p>
        )}
      </main>
    </div>
  );
};

export default DoctorPortal;
```

## Component Props

### VisitAttachmentUpload

| Prop        | Type          | Required | Description                 |
| ----------- | ------------- | -------- | --------------------------- |
| `visitId`   | string (UUID) | ✅ Yes   | The ID of the current visit |
| `patientId` | string (UUID) | ✅ Yes   | The ID of the patient       |

## Features Included

### 1. **Drag and Drop Upload**

- Users can drag files directly into the drop zone
- Visual feedback when dragging files

### 2. **Single or Multiple File Upload**

- Toggle between single and multiple file upload modes
- Upload up to 10 files at once

### 3. **File Type Validation**

- Only allows supported file types
- Shows error for unsupported files

### 4. **File Preview**

- Shows selected files before upload
- Displays file name and size
- Shows appropriate icons for different file types

### 5. **Attachment List**

- Displays all uploaded attachments for the visit
- Shows file name, type, and upload time
- Click to view/download files
- Delete functionality with confirmation

### 6. **Loading States**

- Shows spinner during upload
- Disables buttons during operations
- Shows loading state when fetching attachments

### 7. **Error Handling**

- Shows user-friendly error messages
- Handles network errors gracefully

## Styling Customization

The component comes with comprehensive CSS styling. To customize:

1. **Modify colors:** Edit the CSS variables or color values in `VisitAttachmentUpload.css`
2. **Change layout:** Adjust padding, margins, and flex properties
3. **Add themes:** Wrap in a theme provider or add theme classes

### Example: Custom Colors

```css
/* Add to your global CSS or component CSS */
.visit-attachment-upload {
  --primary-color: #your-color;
  --secondary-color: #your-color;
}

.upload-button {
  background: linear-gradient(
    135deg,
    var(--primary-color),
    var(--secondary-color)
  );
}
```

## Usage Examples

### Example 1: Basic Integration

```jsx
import VisitAttachmentUpload from "../components/visits/VisitAttachmentUpload";

function ConsultationPage({ visitId, patientId }) {
  return (
    <div>
      <h2>Consultation</h2>
      <VisitAttachmentUpload visitId={visitId} patientId={patientId} />
    </div>
  );
}
```

### Example 2: With Tabs

```jsx
import { Tab, Tabs } from "your-ui-library";
import VisitAttachmentUpload from "../components/visits/VisitAttachmentUpload";

function ConsultationTabs({ visitId, patientId }) {
  return (
    <Tabs>
      <Tab label="Vital Signs">{/* Vital signs form */}</Tab>
      <Tab label="Diagnosis">{/* Diagnosis form */}</Tab>
      <Tab label="Attachments">
        <VisitAttachmentUpload visitId={visitId} patientId={patientId} />
      </Tab>
      <Tab label="Prescription">{/* Prescription form */}</Tab>
    </Tabs>
  );
}
```

### Example 3: Collapsible Section

```jsx
import { useState } from "react";
import VisitAttachmentUpload from "../components/visits/VisitAttachmentUpload";

function ConsultationForm({ visitId, patientId }) {
  const [showAttachments, setShowAttachments] = useState(false);

  return (
    <div>
      <h2>Consultation</h2>

      {/* Other sections */}

      <div className="collapsible-section">
        <button onClick={() => setShowAttachments(!showAttachments)}>
          {showAttachments ? "▼" : "▶"} Attachments & Documents
        </button>

        {showAttachments && (
          <VisitAttachmentUpload visitId={visitId} patientId={patientId} />
        )}
      </div>
    </div>
  );
}
```

## API Usage (Without Component)

If you want to build your own UI, you can use the hooks directly:

```jsx
import {
  useUploadVisitAttachment,
  useVisitAttachments,
} from "../hooks/useVisits";

function CustomUploadUI({ visitId, patientId }) {
  const uploadMutation = useUploadVisitAttachment();
  const { data: attachments } = useVisitAttachments(visitId);

  const handleUpload = async (file) => {
    const formData = new FormData();
    formData.append("document", file);

    try {
      await uploadMutation.mutateAsync({
        id: visitId,
        patientId,
        formData,
      });
      alert("Uploaded!");
    } catch (error) {
      alert("Error: " + error.message);
    }
  };

  return (
    <div>
      <input type="file" onChange={(e) => handleUpload(e.target.files[0])} />

      <ul>
        {attachments?.map((att) => (
          <li key={att.id}>{att.fileName}</li>
        ))}
      </ul>
    </div>
  );
}
```

## Testing

### Manual Testing Steps

1. **Start Backend Server:**

   ```bash
   cd Backend
   npm start
   ```

2. **Start Frontend:**

   ```bash
   cd Frontend
   npm run dev
   ```

3. **Login as Doctor**

4. **Navigate to Queue/Consultation Page**

5. **Test Upload:**
   - Select a patient from the queue
   - Try uploading different file types (image, PDF, etc.)
   - Verify files appear in the attachments list
   - Click on file links to view/download

6. **Test Multiple Upload:**
   - Switch to "Multiple Files" mode
   - Select several files at once
   - Verify all files upload successfully

7. **Test Drag and Drop:**
   - Drag a file onto the drop zone
   - Verify it gets added to selected files

8. **Test Delete:**
   - Click delete button on an attachment
   - Confirm deletion
   - Verify attachment is removed

## Troubleshooting

### Issue: Files Not Uploading

**Check:**

1. Backend server is running
2. File size is under 5MB
3. File type is supported
4. User has doctor/data clerk role
5. Visit ID and Patient ID are valid

### Issue: Attachments Not Showing

**Check:**

1. Visit ID is correct
2. Network request succeeds (check browser console)
3. Backend route is accessible
4. User is authenticated

### Issue: "File type not allowed" Error

**Solution:**

- Add the file type to `ALLOWED_FILE_TYPES` in Backend `.env`:

```env
ALLOWED_FILE_TYPES=image/jpeg,image/png,application/pdf,application/msword
```

### Issue: CORS Errors

**Solution:**

- Ensure backend CORS is configured for your frontend URL
- Check `Backend/src/app.js` for CORS settings

## Environment Variables

Add these to your `.env` files if not already present:

### Backend `.env`

```env
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=image/jpeg,image/jpg,image/png,image/gif,image/webp,image/bmp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain,text/csv
```

### Frontend `.env`

```env
VITE_API_URL=http://localhost:5000
```

## Security Notes

✅ **Implemented Security Features:**

- JWT authentication required
- Role-based authorization (only doctors and data clerks can upload)
- File type validation
- File size limits
- Sanitized file names
- Audit logging for all uploads

## Support & Questions

For issues or questions:

1. Check the Backend logs: `Backend/logs/combined.log`
2. Check browser console for frontend errors
3. Review API documentation: `Backend/VISIT_ATTACHMENTS_API.md`

## Summary

The visit attachments feature is now ready to use! Simply:

1. Import the `VisitAttachmentUpload` component
2. Add it to your consultation page
3. Pass `visitId` and `patientId` props
4. Done! ✨

The component handles all the complexity including:

- File uploads (single and multiple)
- Drag and drop
- File preview
- Attachment listing
- File deletion
- Error handling
- Loading states

Everything is production-ready and follows best practices for security, user experience, and code organization.
