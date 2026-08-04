# Quick Start Guide - Visit Attachments Feature

## 🚀 5-Minute Setup

### Prerequisites

- Backend server running
- Frontend server running
- Doctor account credentials

### Step 1: Verify Backend is Ready (30 seconds)

```bash
# Navigate to backend
cd Backend

# Check if server is running
# If not, start it:
npm start
```

✅ **Success indicator**: Server running on `http://localhost:5000`

### Step 2: Test API Endpoints (1 minute)

```bash
# Get your auth token (login first via API or frontend)
# Replace {TOKEN} with your actual JWT token
# Replace {VISIT_ID} with an actual visit ID

# Test 1: Get visit attachments (should return empty array or existing attachments)
curl -X GET \
  "http://localhost:5000/api/v1/visits/{VISIT_ID}/attachments" \
  -H "Authorization: Bearer {TOKEN}"

# Expected: {"success": true, "data": [], ...}
```

If you get a successful response, the backend is ready! ✅

### Step 3: Add Component to Frontend (2 minutes)

Find your doctor queue or consultation component. Common locations:

- `Frontend/src/pages/portal/DoctorPortal.jsx`
- `Frontend/src/pages/DoctorDashboard.jsx`
- `Frontend/src/components/doctor/Consultation.jsx`

Add this import at the top:

```jsx
import VisitAttachmentUpload from "../components/visits/VisitAttachmentUpload";
```

Add the component where you want it to appear:

```jsx
<VisitAttachmentUpload
  visitId={currentVisit.id}
  patientId={currentVisit.patient.id}
/>
```

### Step 4: Test in Browser (1.5 minutes)

1. Open frontend: `http://localhost:5173` (or your port)
2. Login as doctor
3. Navigate to queue/consultation page
4. You should see the "📋 Medical Documents & Images" section
5. Try uploading a file (image or PDF)
6. Verify it appears in the list below

**Success!** 🎉 You're done!

---

## 🔍 Detailed Testing Checklist

### Backend Testing

#### ✅ Test 1: Upload Single File

```bash
# Create a test file
echo "Test medical document" > test.txt

# Upload it
curl -X POST \
  "http://localhost:5000/api/v1/visits/{VISIT_ID}/attachments" \
  -H "Authorization: Bearer {TOKEN}" \
  -F "document=@test.txt"

# Expected response:
# {
#   "success": true,
#   "message": "Attachment uploaded successfully",
#   "data": {
#     "id": "uuid",
#     "fileName": "test.txt",
#     ...
#   }
# }
```

#### ✅ Test 2: Upload Multiple Files

```bash
# Upload multiple files
curl -X POST \
  "http://localhost:5000/api/v1/visits/{VISIT_ID}/attachments/multiple" \
  -H "Authorization: Bearer {TOKEN}" \
  -F "documents=@file1.jpg" \
  -F "documents=@file2.pdf"

# Expected: Array of uploaded files
```

#### ✅ Test 3: Get Visit Attachments

```bash
curl -X GET \
  "http://localhost:5000/api/v1/visits/{VISIT_ID}/attachments" \
  -H "Authorization: Bearer {TOKEN}"

# Expected: Array of attachments for the visit
```

#### ✅ Test 4: Error Handling - No File

```bash
curl -X POST \
  "http://localhost:5000/api/v1/visits/{VISIT_ID}/attachments" \
  -H "Authorization: Bearer {TOKEN}"

# Expected: {"success": false, "message": "Please upload a file"}
```

#### ✅ Test 5: Error Handling - Invalid File Type

```bash
# Try uploading an .exe file (not allowed)
curl -X POST \
  "http://localhost:5000/api/v1/visits/{VISIT_ID}/attachments" \
  -H "Authorization: Bearer {TOKEN}" \
  -F "document=@malicious.exe"

# Expected: Error about file type not allowed
```

### Frontend Testing

#### ✅ Test 1: Component Renders

- [ ] Component appears on consultation page
- [ ] Upload section is visible
- [ ] Attachments list is visible
- [ ] No console errors

#### ✅ Test 2: File Selection

- [ ] Click "Select File" works
- [ ] Selected file appears in list
- [ ] File size is shown
- [ ] Upload button becomes enabled

#### ✅ Test 3: Upload Single File

- [ ] Click "Upload" button
- [ ] See loading spinner
- [ ] Get success message
- [ ] File appears in attachments list
- [ ] Upload form resets

#### ✅ Test 4: Upload Multiple Files

- [ ] Switch to "Multiple Files" mode
- [ ] Select multiple files
- [ ] All files show in preview
- [ ] Click "Upload"
- [ ] All files upload successfully
- [ ] All appear in attachments list

#### ✅ Test 5: Drag and Drop

- [ ] Drag a file over drop zone
- [ ] Drop zone changes color
- [ ] Drop file
- [ ] File appears as selected
- [ ] Can upload successfully

#### ✅ Test 6: View Attachment

- [ ] Click on attachment file name
- [ ] File opens in new tab/downloads
- [ ] Correct file is shown

#### ✅ Test 7: Delete Attachment

- [ ] Click delete button (🗑️)
- [ ] Confirmation dialog appears
- [ ] Confirm deletion
- [ ] File removed from list
- [ ] Database record deleted

#### ✅ Test 8: Error Handling

- [ ] Try uploading file > 5MB
- [ ] See appropriate error message
- [ ] Try uploading unsupported file type
- [ ] See appropriate error message

---

## 🎯 Quick Integration Examples

### Example 1: Simplest Integration

```jsx
// In your consultation page
import VisitAttachmentUpload from "../components/visits/VisitAttachmentUpload";

function Consultation({ visitId, patientId }) {
  return (
    <div>
      <h2>Consultation</h2>
      {/* Your existing forms */}

      {/* Add this: */}
      <VisitAttachmentUpload visitId={visitId} patientId={patientId} />
    </div>
  );
}
```

### Example 2: With Conditional Rendering

```jsx
function Consultation({ visit }) {
  if (!visit) return <p>Loading...</p>;

  return (
    <div>
      <h2>Consultation for {visit.patient.firstName}</h2>

      {visit.status === "in_consultation" && (
        <VisitAttachmentUpload
          visitId={visit.id}
          patientId={visit.patient.id}
        />
      )}
    </div>
  );
}
```

### Example 3: With Tabs

```jsx
import { Tabs, Tab } from "your-ui-library";

function Consultation({ visit }) {
  return (
    <Tabs>
      <Tab label="Vitals">{/* Vitals form */}</Tab>

      <Tab label="Diagnosis">{/* Diagnosis form */}</Tab>

      <Tab label="Attachments">
        <VisitAttachmentUpload
          visitId={visit.id}
          patientId={visit.patient.id}
        />
      </Tab>

      <Tab label="Prescription">{/* Prescription form */}</Tab>
    </Tabs>
  );
}
```

---

## 🐛 Common Issues & Solutions

### Issue 1: "Component not found" error

**Problem:** Cannot find VisitAttachmentUpload component

**Solution:**

```bash
# Check if file exists
ls Frontend/src/components/visits/VisitAttachmentUpload.jsx

# If not found, file may be in wrong location
# Adjust import path accordingly
```

### Issue 2: API returns 401 Unauthorized

**Problem:** Not authenticated

**Solution:**

- Ensure you're logged in
- Check JWT token is valid and not expired
- Check Authorization header is being sent

### Issue 3: "File type not allowed"

**Problem:** Trying to upload unsupported file type

**Solution:**

```env
# Add to Backend/.env
ALLOWED_FILE_TYPES=image/jpeg,image/png,application/pdf,your/mime-type
```

### Issue 4: Files not uploading (no error)

**Problem:** Silent failure

**Solution:**

1. Check browser console for errors
2. Check network tab for failed requests
3. Check backend logs: `Backend/logs/combined.log`
4. Verify `uploads/` directory exists and is writable

### Issue 5: CORS error

**Problem:** CORS policy blocking requests

**Solution:**

```javascript
// Backend/src/app.js
// Ensure CORS is configured
app.use(
  cors({
    origin: "http://localhost:5173", // Your frontend URL
    credentials: true,
  }),
);
```

### Issue 6: "Visit not found" error

**Problem:** Invalid visit ID

**Solution:**

- Verify visit ID is correct UUID format
- Check visit exists in database
- Ensure you're passing the correct prop

---

## 📊 Verification Checklist

After integration, verify these work:

### Backend ✅

- [ ] Server starts without errors
- [ ] Upload endpoints respond (test with curl)
- [ ] Files are saved to `Backend/uploads/`
- [ ] Database records are created
- [ ] Audit logs are written

### Frontend ✅

- [ ] Component renders without errors
- [ ] Upload button works
- [ ] Files appear in list after upload
- [ ] Can view/download uploaded files
- [ ] Can delete uploaded files
- [ ] Loading states show correctly
- [ ] Error messages display properly

### Integration ✅

- [ ] Upload from frontend saves to backend
- [ ] Get attachments retrieves uploaded files
- [ ] Files are linked to correct visit
- [ ] Files are linked to correct patient
- [ ] Multiple uploads work
- [ ] Drag-and-drop works

---

## 🎓 Tutorial: First Upload

1. **Start both servers**

   ```bash
   # Terminal 1
   cd Backend
   npm start

   # Terminal 2
   cd Frontend
   npm run dev
   ```

2. **Login as doctor**
   - Go to `http://localhost:5173`
   - Login with doctor credentials

3. **Navigate to queue**
   - Click on "Queue" or "Consultation"
   - Select a patient from today's queue

4. **Find attachments section**
   - Scroll down to "📋 Medical Documents & Images"
   - Should see upload area

5. **Upload your first file**
   - Click "Click to select" or drag a file
   - Choose an image or PDF
   - Click "Upload" button
   - Wait for success message

6. **Verify**
   - File should appear in list below
   - Click file name to view/download
   - Check `Backend/uploads/documents/` for physical file

**Congratulations!** 🎉 Your first medical document is uploaded!

---

## 📝 Notes

- **File Size Limit**: Default 5MB, configurable in `.env`
- **Supported Types**: Images (JPEG, PNG, GIF, WebP, BMP), Documents (PDF, Word, Excel, TXT, CSV)
- **Max Multiple Upload**: 10 files at once
- **Storage**: Files stored in `Backend/uploads/`
- **Database**: Records in `patient_attachments` table
- **Security**: JWT required, role-based access (Doctor/Data Clerk only)

---

## 🔗 Next Steps

1. **Customize styling**: Edit `VisitAttachmentUpload.css`
2. **Add features**: File preview modal, image thumbnails, etc.
3. **Integrate with workflow**: Add to your consultation process
4. **Train users**: Show doctors how to use the feature

---

## 📞 Need Help?

- **API Documentation**: `Backend/VISIT_ATTACHMENTS_API.md`
- **Integration Guide**: `Frontend/VISIT_ATTACHMENTS_INTEGRATION.md`
- **System Flow**: `ATTACHMENT_FLOW_DIAGRAM.md`
- **Backend Logs**: `Backend/logs/combined.log`
- **Browser Console**: Press F12 to see frontend errors

---

## ✨ Success Criteria

Your implementation is successful when:

✅ Component renders without errors  
✅ Can upload single file  
✅ Can upload multiple files  
✅ Uploaded files appear in list  
✅ Can view/download files  
✅ Can delete files  
✅ Files are saved to disk  
✅ Database records are created  
✅ Proper error messages shown

**You're all set!** 🚀
