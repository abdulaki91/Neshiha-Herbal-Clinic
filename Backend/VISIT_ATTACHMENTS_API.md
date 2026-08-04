# Visit Attachments API Documentation

This document describes the new API endpoints that allow doctors to upload images, files, and documents to patient records during consultations in the queue section.

## Overview

Doctors can now upload medical documents, images (X-rays, lab results, photos), PDFs, and other relevant files directly during patient consultations. These attachments are linked to both the patient record and the specific visit for better organization and traceability.

## New API Endpoints

### 1. Upload Single Attachment During Consultation

**Endpoint:** `POST /api/v1/visits/:id/attachments`

**Description:** Upload a single file/document to a patient's record during a specific visit/consultation.

**Access:** Private (Doctor, Data Clerk)

**Request:**
- **URL Parameter:** `id` - Visit ID (UUID)
- **Body:** `multipart/form-data`
  - `document` (file) - The file to upload

**Response:**
```json
{
  "success": true,
  "message": "Attachment uploaded successfully",
  "data": {
    "id": "uuid",
    "patientId": "uuid",
    "visitId": "uuid",
    "fileName": "lab_result.pdf",
    "filePath": "uploads/documents/lab_result-1234567890.pdf",
    "fileType": "application/pdf",
    "uploadedBy": "uuid",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

**Example Usage (JavaScript/React):**
```javascript
import { useUploadVisitAttachment } from "../hooks/useVisits";

const VisitConsultation = ({ visitId, patientId }) => {
  const uploadMutation = useUploadVisitAttachment();

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    const formData = new FormData();
    formData.append("document", file);

    try {
      await uploadMutation.mutateAsync({
        id: visitId,
        patientId,
        formData,
      });
      alert("File uploaded successfully!");
    } catch (error) {
      console.error("Upload failed:", error);
    }
  };

  return (
    <div>
      <input type="file" onChange={handleFileUpload} />
      {uploadMutation.isLoading && <p>Uploading...</p>}
    </div>
  );
};
```

**Example cURL:**
```bash
curl -X POST \
  http://localhost:5000/api/v1/visits/123e4567-e89b-12d3-a456-426614174000/attachments \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "document=@/path/to/file.pdf"
```

---

### 2. Upload Multiple Attachments During Consultation

**Endpoint:** `POST /api/v1/visits/:id/attachments/multiple`

**Description:** Upload multiple files/documents at once to a patient's record during a specific visit/consultation.

**Access:** Private (Doctor, Data Clerk)

**Request:**
- **URL Parameter:** `id` - Visit ID (UUID)
- **Body:** `multipart/form-data`
  - `documents` (files) - Multiple files to upload (max 10)

**Response:**
```json
{
  "success": true,
  "message": "5 attachment(s) uploaded successfully",
  "data": [
    {
      "id": "uuid1",
      "patientId": "uuid",
      "visitId": "uuid",
      "fileName": "xray_chest.jpg",
      "filePath": "uploads/documents/xray_chest-1234567890.jpg",
      "fileType": "image/jpeg",
      "uploadedBy": "uuid",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    },
    {
      "id": "uuid2",
      "patientId": "uuid",
      "visitId": "uuid",
      "fileName": "blood_test.pdf",
      "filePath": "uploads/documents/blood_test-1234567891.pdf",
      "fileType": "application/pdf",
      "uploadedBy": "uuid",
      "createdAt": "2024-01-15T10:30:01Z",
      "updatedAt": "2024-01-15T10:30:01Z"
    }
  ]
}
```

**Example Usage (JavaScript/React):**
```javascript
import { useUploadMultipleVisitAttachments } from "../hooks/useVisits";

const VisitConsultation = ({ visitId, patientId }) => {
  const uploadMultipleMutation = useUploadMultipleVisitAttachments();

  const handleMultipleFilesUpload = async (event) => {
    const files = Array.from(event.target.files);
    const formData = new FormData();
    
    files.forEach((file) => {
      formData.append("documents", file);
    });

    try {
      await uploadMultipleMutation.mutateAsync({
        id: visitId,
        patientId,
        formData,
      });
      alert(`${files.length} files uploaded successfully!`);
    } catch (error) {
      console.error("Upload failed:", error);
    }
  };

  return (
    <div>
      <input 
        type="file" 
        multiple 
        onChange={handleMultipleFilesUpload}
        accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
      />
      {uploadMultipleMutation.isLoading && <p>Uploading files...</p>}
    </div>
  );
};
```

**Example cURL:**
```bash
curl -X POST \
  http://localhost:5000/api/v1/visits/123e4567-e89b-12d3-a456-426614174000/attachments/multiple \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "documents=@/path/to/file1.pdf" \
  -F "documents=@/path/to/file2.jpg" \
  -F "documents=@/path/to/file3.png"
```

---

### 3. Get All Attachments for a Visit

**Endpoint:** `GET /api/v1/visits/:id/attachments`

**Description:** Retrieve all attachments uploaded during a specific visit/consultation.

**Access:** Private (All authenticated users)

**Request:**
- **URL Parameter:** `id` - Visit ID (UUID)

**Response:**
```json
{
  "success": true,
  "message": "Visit attachments retrieved successfully",
  "data": [
    {
      "id": "uuid1",
      "patientId": "uuid",
      "visitId": "uuid",
      "fileName": "xray_chest.jpg",
      "filePath": "uploads/documents/xray_chest-1234567890.jpg",
      "fileType": "image/jpeg",
      "uploadedBy": "uuid",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    },
    {
      "id": "uuid2",
      "patientId": "uuid",
      "visitId": "uuid",
      "fileName": "blood_test.pdf",
      "filePath": "uploads/documents/blood_test-1234567891.pdf",
      "fileType": "application/pdf",
      "uploadedBy": "uuid",
      "createdAt": "2024-01-15T10:31:00Z",
      "updatedAt": "2024-01-15T10:31:00Z"
    }
  ]
}
```

**Example Usage (JavaScript/React):**
```javascript
import { useVisitAttachments } from "../hooks/useVisits";

const VisitAttachmentsList = ({ visitId }) => {
  const { data: attachments, isLoading } = useVisitAttachments(visitId);

  if (isLoading) return <p>Loading attachments...</p>;

  return (
    <div>
      <h3>Visit Attachments</h3>
      {attachments?.length === 0 ? (
        <p>No attachments for this visit</p>
      ) : (
        <ul>
          {attachments?.map((attachment) => (
            <li key={attachment.id}>
              <a 
                href={`${API_URL}/${attachment.filePath}`} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                {attachment.fileName}
              </a>
              <span> ({attachment.fileType})</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
```

---

## Supported File Types

The following file types are supported for upload:

### Images
- JPEG/JPG (`image/jpeg`, `image/jpg`)
- PNG (`image/png`)
- GIF (`image/gif`)
- WebP (`image/webp`)
- BMP (`image/bmp`)

### Documents
- PDF (`application/pdf`)
- Microsoft Word (`.doc`, `.docx`)
- Microsoft Excel (`.xls`, `.xlsx`)
- Plain Text (`text/plain`)
- CSV (`text/csv`)

### File Size Limits
- Default max file size: **5MB** per file
- Configurable via `MAX_FILE_SIZE` environment variable

---

## File Storage Structure

Files are stored in the following directory structure:

```
Backend/
└── uploads/
    ├── documents/      # Medical documents, PDFs, Word files
    ├── photos/         # Patient photos
    ├── investigations/ # Investigation results
    └── others/         # Other file types
```

---

## Error Responses

### No File Uploaded
```json
{
  "success": false,
  "message": "Please upload a file"
}
```

### File Type Not Allowed
```json
{
  "success": false,
  "message": "File type application/x-executable not allowed"
}
```

### Visit Not Found
```json
{
  "success": false,
  "message": "Not found"
}
```

### File Too Large
```json
{
  "success": false,
  "message": "File too large"
}
```

---

## Related Endpoints

### Get Patient Attachments
To view all attachments for a patient (across all visits):

**Endpoint:** `GET /api/v1/patients/:id/attachments`

### Delete Attachment
To delete an attachment:

**Endpoint:** `DELETE /api/v1/patients/:id/attachments/:attachmentId`

**Access:** Private (Doctor, Admin)

---

## Frontend Implementation Example

Here's a complete example of a component for uploading attachments during consultation:

```jsx
import { useState } from "react";
import { useUploadVisitAttachment, useVisitAttachments } from "../hooks/useVisits";

const ConsultationAttachments = ({ visitId, patientId }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const uploadMutation = useUploadVisitAttachment();
  const { data: attachments, isLoading } = useVisitAttachments(visitId);

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert("Please select a file first");
      return;
    }

    const formData = new FormData();
    formData.append("document", selectedFile);

    try {
      await uploadMutation.mutateAsync({
        id: visitId,
        patientId,
        formData,
      });
      setSelectedFile(null);
      // Reset file input
      document.getElementById("file-input").value = "";
    } catch (error) {
      alert("Failed to upload file: " + error.message);
    }
  };

  return (
    <div className="consultation-attachments">
      <h3>Medical Documents & Images</h3>
      
      {/* Upload Section */}
      <div className="upload-section">
        <input
          id="file-input"
          type="file"
          onChange={handleFileChange}
          accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
        />
        <button 
          onClick={handleUpload} 
          disabled={!selectedFile || uploadMutation.isLoading}
        >
          {uploadMutation.isLoading ? "Uploading..." : "Upload"}
        </button>
        {selectedFile && <p>Selected: {selectedFile.name}</p>}
      </div>

      {/* Attachments List */}
      <div className="attachments-list">
        <h4>Uploaded Files</h4>
        {isLoading ? (
          <p>Loading...</p>
        ) : attachments?.length === 0 ? (
          <p>No attachments yet</p>
        ) : (
          <ul>
            {attachments?.map((attachment) => (
              <li key={attachment.id}>
                <a 
                  href={`http://localhost:5000/${attachment.filePath}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  📎 {attachment.fileName}
                </a>
                <span className="file-type">
                  {attachment.fileType.split("/")[1]?.toUpperCase()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ConsultationAttachments;
```

---

## Security Considerations

1. **Authentication Required:** All endpoints require valid JWT authentication
2. **Authorization:** Only doctors and data clerks can upload files
3. **File Type Validation:** Only allowed file types can be uploaded
4. **File Size Limits:** Files exceeding the size limit are rejected
5. **Audit Logging:** All uploads are logged for audit trail
6. **Sanitized Filenames:** File names are sanitized to prevent directory traversal attacks

---

## Configuration

Add these environment variables to your `.env` file:

```env
# Maximum file size in bytes (default: 5MB)
MAX_FILE_SIZE=5242880

# Allowed file types (comma-separated MIME types)
ALLOWED_FILE_TYPES=image/jpeg,image/jpg,image/png,image/gif,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document
```

---

## Testing

### Test Single Upload
```bash
# Replace with actual visit ID and token
VISIT_ID="your-visit-id"
TOKEN="your-auth-token"

curl -X POST \
  "http://localhost:5000/api/v1/visits/${VISIT_ID}/attachments" \
  -H "Authorization: Bearer ${TOKEN}" \
  -F "document=@test-file.pdf"
```

### Test Multiple Upload
```bash
curl -X POST \
  "http://localhost:5000/api/v1/visits/${VISIT_ID}/attachments/multiple" \
  -H "Authorization: Bearer ${TOKEN}" \
  -F "documents=@file1.jpg" \
  -F "documents=@file2.pdf" \
  -F "documents=@file3.png"
```

### Get Visit Attachments
```bash
curl -X GET \
  "http://localhost:5000/api/v1/visits/${VISIT_ID}/attachments" \
  -H "Authorization: Bearer ${TOKEN}"
```

---

## Integration Notes

1. **Existing Patient Attachments:** The existing patient attachment endpoints (`/patients/:id/attachments`) continue to work as before
2. **Visit Context:** When uploading via visit endpoints, the attachment is automatically linked to both the patient and the visit
3. **File Retrieval:** Files can be accessed via their `filePath` property (e.g., `http://localhost:5000/uploads/documents/file.pdf`)
4. **Real-time Updates:** The frontend hooks automatically invalidate and refetch queries after successful uploads

---

## Summary

This feature enables doctors to:
- ✅ Upload single or multiple files during patient consultation
- ✅ Support for various file types (images, PDFs, documents)
- ✅ Automatic linking to patient record and specific visit
- ✅ View all attachments for a specific visit
- ✅ Access attachments from patient history
- ✅ Audit trail for all uploads

The implementation is secure, well-documented, and fully integrated with the existing patient and visit management system.
