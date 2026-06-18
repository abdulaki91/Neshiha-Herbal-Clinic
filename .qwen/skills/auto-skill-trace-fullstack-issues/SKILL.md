---
name: trace-fullstack-issues
description: Debug frontend-backend-database mismatches by tracing the full chain: route registration → API calls → backend route definitions → database schema. Use when a page doesn't load, an API call 404s, or a write operation 500s with column errors in this fullstack app.
source: auto-skill
extracted_at: '2026-06-18T07:19:32.321Z'
---

# Trace Fullstack Issues

When a feature page doesn't work or an API call returns an error, trace the complete chain from frontend to database before making changes.

## 1. Route registration (404 on page load)

Check `Frontend/src/App.jsx` under the `<Route path="/portal">` group.
- Sidebar links to a path? Verify a `<Route path="...">` child exists for it.
- Common symptom: page is imported but no route exists → clicking the sidebar link hits the 404 catch-all.

## 2. Frontend API call (404 on data fetch)

Read the page/component to find the exact endpoint.
- Look for `axiosInstance.get("/...")` or similar calls.
- The path is relative to `/api/v1` (the axios base URL).

## 3. Backend route definition

`Backend/src/routes/<resource>Routes.js`.
- The route path inside the router is appended to the mount point in `Backend/src/app.js`.
- A path like `/queue` in `visitRoutes.js` becomes `/api/v1/visits/queue` — **not** nested paths like `/doctor/queue` unless explicitly written that way.
- If the frontend calls `/visits/doctor/queue` but the route is `/queue`, it's a 404.

## 4. Backend authorization (403)

Check `authorize(...)` on the route. If the user's role isn't listed, the backend returns 403.

## 5. Controller/service response shape

Confirm the service returns the shape the frontend expects. Frontend destructures `response.data.data` or `response.data.medicines` — mismatches cause silent empty states.

## 6. Database schema mismatch (500 with column errors)

When the backend 500s with errors like `column "X" does not exist` or `null value in column "Y" violates not-null constraint`, the PostgreSQL table schema is out of sync with the Sequelize model.

### Diagnosis
- Read the model (`Backend/src/models/<Model>.js`) to see expected columns.
- Read `Backend/src/config/database.js` — note `underscored: true` means camelCase model fields become snake_case columns (e.g., `medicineId` → `medicine_id`, but `id` stays `id`).
- Compare the error column name against model fields.

### Fix — targeted SQL, NOT Sequelize sync

**Do NOT use `sequelize.sync({ alter: true })` or `syncDatabase()` on startup.** It will attempt to alter every table and can fail on existing data with constraint conflicts (e.g., UNIQUE on populated tables, NOT NULL violations on old rows).

Instead, add targeted `ALTER TABLE` statements in `Backend/src/server.js` that run once on startup:

```js
// Add missing column
await sequelize.query(
  `ALTER TABLE medicines ADD COLUMN IF NOT EXISTS code VARCHAR(255)`
);

// Fix old column that model no longer owns (drop NOT NULL on orphaned column)
await sequelize.query(
  `ALTER TABLE medicines ALTER COLUMN medicine_id DROP NOT NULL`
);
```

- Use `ADD COLUMN IF NOT EXISTS` for new columns.
- Use `DROP NOT NULL` on old columns the model doesn't set, to prevent insert failures.
- Wrap in try/catch so server still starts if the fix already ran.
- Run each statement as a separate `sequelize.query()` call — PostgreSQL doesn't allow multiple statements in one query.

### If the table is completely mismatched

If the table structure is fundamentally different from the model, run the migration script:
```
node Backend/src/scripts/migrate.js
```
This drops and recreates all tables. **Destroys all data** — use only as last resort.

## Fix priority

1. Fix frontend URL to match backend route (when backend is correct).
2. Add missing route in App.jsx.
3. Expand validators to match form fields.
4. Add targeted ALTER TABLE for missing/conflicting columns.
5. Only change backend route path if the frontend's expectation is clearly better.

## Common bug patterns to recognize

### Pattern A: CRUD endpoint mismatch (DELETE → PATCH/PUT)

**Symptom:** Frontend calls `DELETE /resource/:id` but backend has no DELETE route. Returns 404.

**Root cause:** Backend implements soft-delete/state-change patterns (stop, cancel) instead of hard DELETE.

**Checklist:**
- Compare every frontend `axiosInstance.delete(...)` against `Backend/src/routes/<resource>Routes.js`.
- Backend alternatives for this project:
  - Prescriptions: `PATCH /prescriptions/:id/stop` (with `{ reason }` body)
  - Investigations: `PUT /investigations/:id` (with `{ status: "cancelled" }`)
  - Medicines: `DELETE` exists but is a soft delete (sets isActive=false)
- Update frontend to call the correct endpoint, and update the confirmation message (e.g., "cancel" instead of "delete").

### Pattern B: Express-validator field name typo

**Symptom:** Frontend sends `{ treatmentPlan: "..." }` but backend validation never catches it — data passes through unvalidated.

**Root cause:** `body("treatment Plan")` has a space — validator looks for a literal key `"treatment Plan"` which the frontend never sends.

**Fix:** Match the validator field name exactly to the frontend's camelCase key: `body("treatmentPlan")`.

### Pattern C: `.trim()` on array fields

**Symptom:** `body("diagnosis").optional().trim()` — the frontend sends an array (e.g., `["Common Cold"]`). `.trim()` is for strings; its behavior on arrays is unpredictable.

**Fix:** Use `body("diagnosis").optional()` without `.trim()` for array fields. Arrays pass through `isArray()` or similar checks, not string sanitizers.

### Pattern D: Dead onClick buttons

**Symptom:** Navigation buttons render but clicking them does nothing. No console errors.

**Root cause:** Missing `useNavigate`, no `onClick` handler, no `Link`/`NavLink` wrapper. Plain `<button>` with text only.

**Fix:**
1. Add `import { useNavigate } from "react-router-dom"`.
2. Add `const navigate = useNavigate()`.
3. Wire `onClick={() => navigate("/portal/patients/:id")}`.
4. If the target route or page component doesn't exist, create both (new page in `pages/portal/`, import + route in `App.jsx`).

### Pattern E: Component missing a needed prop

**Symptom:** A form/modal always starts blank even when it should be pre-filled (e.g., "New Visit" from a specific patient).

**Root cause:** The parent page doesn't read URL search params (`useSearchParams`), and the child component doesn't accept a `defaultPatientId` prop.

**Fix:**
1. Parent reads `searchParams.get("patientId")` and passes it down.
2. Child component accepts it and uses `setValue("patientId", defaultPatientId)` in a `useEffect`.
3. Set up the `useForm` with `defaultValues` using the prop.

### Pattern F: Underscored Sequelize column mismatch

**Symptom:** Error mentions `column "medicine_id" violates not-null constraint` but the Sequelize model has `id` (UUID), not `medicine_id`.

**Root cause:** The database table has an orphaned `medicine_id` column (possibly from a previous schema version). The model uses `id` as primary key and never sets `medicine_id`, so it gets NULL on insert.

**Fix:** Add targeted ALTER: `ALTER TABLE medicines ALTER COLUMN medicine_id DROP NOT NULL`. This is distinct from the "missing column" case — here the column exists but causes collisions because the model doesn't own it.

### Pattern G: Socket.io CORS is separate from Express CORS

**Symptom:** `Access-Control-Allow-Origin` header still shows the old origin after adding a new origin to Express CORS. Socket.io polling requests (`/socket.io/`) are blocked.

**Root cause:** Socket.io initializes its own HTTP server with its own `cors` option in `Backend/src/config/socket.js`. The Express `cors()` middleware only covers REST API routes, not WebSocket/polling connections.

**Common JS logic bug:**
```js
// BROKEN — "http://localhost:5173" is truthy, so || short-circuits
// Only ever allows localhost:5173
origin: process.env.FRONTEND_URL || "http://localhost:5173" || "http://localhost:5174"

// CORRECT — use an array
origin: [
  process.env.FRONTEND_URL || "http://localhost:5173",
  "http://localhost:5174",
]
```

**Fix:** Find `new Server(httpServer, { cors: { origin: ... } })` in `socket.js` and change to an array if multiple origins are needed.

### Pattern H: ApiResponse.paginated() data-path mismatch (silent empty states)

**Symptom:** API returns 200 with data visible in the network tab, but the frontend shows an empty list — no medicines in dropdown, no patients in table, no visits. No console errors.

**Root cause:** The backend wraps paginated responses in:
```json
{ "success": true, "data": [...items], "pagination": {...} }
```
But the frontend destructures `response.data.medicines` / `response.data.patients` / `response.data.visits` / `response.data.prescriptions` / `response.data.investigations` / `response.data.dispenses`. These keys don't exist — the array is at `response.data.data`.

**Systematic fix:** Grep the entire frontend for `response.data.<plural-name>` patterns (e.g., `response.data.patients`, `response.data.medicines`) and replace with `response.data.data || response.data || []`. The fallback `|| response.data` handles non-paginated `ApiResponse.success()` responses where data is at the top-level `data` key, and `|| []` prevents crashes.

**Files typically affected in this project:**
- `PatientsPage.jsx`, `VisitsPage.jsx`, `MedicinesPage.jsx`
- `VisitForm.jsx`, `HerbalMedicineForm.jsx`, `InvestigationForm.jsx`
- `ActivePrescriptions.jsx`, `PendingInvestigations.jsx`

### Pattern I: Sequelize include attributes reference wrong model

**Symptom:** Backend 500 error when querying a resource with includes. Stack trace shows Sequelize trying to select a column that doesn't exist on the included model.

**Root cause:** The `attributes` array in a Sequelize `include` references a column name that belongs to the **querying** model, not the **included** model.

**Example:**
```js
// BROKEN — medicineId is a FK on prescriptions, not a column on medicines
include: [{
  model: Medicine,
  as: "medicine",
  attributes: ["id", "medicineId", "name", "strength"]
}]

// CORRECT — use columns that actually exist on the Medicine model
include: [{
  model: Medicine,
  as: "medicine",
  attributes: ["id", "code", "name", "strength"]
}]
```

**Fix:** Read the included model (`Backend/src/models/<Model>.js`) to verify every attribute exists. Common mistakes: `medicineId` (FK, not column), `unit` (doesn't exist), `category` (may exist but check).

### Pattern J: Missing query parameter in service destructuring

**Symptom:** Frontend sends `?visitId=<uuid>` but the filter has no effect — all records are returned regardless of visitId.

**Root cause:** The service function destructures `query` to extract filter params, but a parameter used by the frontend was never added to the destructuring.

**Example:**
```js
// BROKEN — visitId sent by frontend, never extracted
const { page, pageSize, patientId, medicineId } = query;

// CORRECT
const { page, pageSize, patientId, medicineId, visitId } = query;
// then: if (visitId) where.visitId = visitId;
```

**Fix:** Compare the frontend's `axiosInstance.get("/...", { params: { visitId, patientId, ... } })` call with the backend service's destructured `query` object. Add any missing parameters and wire them into the `where` clause.

### Pattern K: FK never populated on write → read filter returns empty

**Symptom:** A page filters by a relationship (e.g., "My Patients" filtered by `consultedBy` doctor) and always shows empty, even when the doctor has consulted patients. No errors — just zero results. Console logs show the data is an empty array.

**Root cause:** The write path that creates/updates the related record never populates the FK column. The read path queries `WHERE fk_column = :value` but the column is NULL for all rows. This often happens when the frontend's write call doesn't include the FK field, and the backend blindly spreads `req.body` into the update without auto-assigning missing FKs.

**Example — My Patients page (`consultedBy` doctor filter):**
1. Frontend sends `GET /patients?consultedBy=<doctorUserId>&page=1`
2. Backend service queries `Visit.findAll({ where: { doctorId: consultedBy } })` to find which patients this doctor has seen
3. `handleStartConsultation` sends `{ status: "in_consultation" }` **without** `doctorId` → `Visit.doctorId` stays NULL
4. The filter finds zero visits → returns empty

**Fix — Backend auto-assignment:**

In the service's update function, auto-assign the FK when it's NULL and a status change implies the relationship should exist:

```js
// In visitService.updateVisit / updateVisitStatus
// V1 (narrow) — only fires on waiting→other transition; misses visits completed before the fix
if (
  visit.status === VISIT_STATUS.WAITING &&
  data.status &&
  data.status !== VISIT_STATUS.WAITING &&
  !visit.doctorId
) {
  data.doctorId = updatedBy;
}

// V2 (broader, preferred) — fires on ANY status change for a visit without a doctor
// This also covers visits that were created/completed before the fix was deployed
if (!visit.doctorId && data.status) {
  data.doctorId = updatedBy;
}

// For status-only endpoint:
if (!visit.doctorId) {
  updates.doctorId = updatedBy;
}
```

**Fix — Backend defensive early return:**

When the FK-filtering subquery returns no matches, return empty immediately instead of passing an empty array to Sequelize's `where.id = []`:

```js
const visitedPatientIds = await Visit.findAll({
  attributes: ["patientId"],
  where: { doctorId: consultedBy },
});
if (visitedPatientIds.length === 0) {
  return { patients: [], pagination: { page, pageSize: limit, totalItems: 0 } };
}
where.id = visitedPatientIds.map((v) => v.patientId);
```

**Fix — Frontend useEffect deps:**

Ensure the fetch `useEffect` includes the user ID as a dependency so it re-fires if the user object hydrates after the first render:

```js
useEffect(() => {
  if (user?.id) {
    fetchPatients();
  }
}, [page, search, user?.id]);
```

**Fix — Backfill existing records:**

After deploying the auto-assignment fix, run a one-off query to backfill existing records:

```sql
-- PostgreSQL: updates visits that have no doctorId but do have a status implying a doctor
-- (adjust based on how your app assigns doctors — may need a different heuristic)
UPDATE visits SET doctor_id = updated_by
WHERE doctor_id IS NULL AND status != 'waiting' AND updated_by IS NOT NULL;
```

**Checklist:**
1. Trace the frontend write call (PUT/POST) to see which fields are sent.
2. Compare against the model's FK columns — is the FK field present in the request body?
3. If missing, add auto-assignment in the backend service (more reliable than fixing every frontend call site).
4. Broaden the auto-assign trigger beyond the specific status transition — existing records may already be past the "waiting" gate.
5. Add defensive early-return in the read service when the FK subquery yields no matches.
6. Add user/identity deps to the frontend `useEffect`.
7. Backfill existing records with a targeted SQL UPDATE.

### Pattern L: Edit button on relationship-list opens wrong form

**Symptom:** A page lists records filtered by a relationship (e.g., "My Patients" — patients consulted by this doctor). Clicking the edit button (✏️) opens a form to edit the **parent** record (patient demographics: name, phone, address) when it should open the **relationship** form (consultation details: chief complaint, diagnosis, treatment plan).

**Root cause:** The edit button is wired to a form modal designed for the parent entity (`PatientForm`), but in the context of a relationship-filtered list, the user expects to edit the relationship data (the visit/consultation that links them).

**Fix:** Instead of opening a modal form, navigate to the entity's detail page where the relationship is managed. The detail page typically has:
- Full visit history
- Consultation management
- "New Visit" button
- All the context a doctor needs for a consulted patient

```jsx
// BEFORE — opens wrong form
<button onClick={() => {
  setEditingPatient(patient);
  setShowForm(true);
}}>
  <FiEdit2 />
</button>

// AFTER — navigates to detail page with consultation context
<button onClick={() => navigate(`/portal/patients/${patient.id}`)}>
  <FiEdit2 />
</button>
```

**Key insight:** The "root" of the relationship is not the patient row — it's the visit row. The doctor sees the patient card because of a visit, so the edit action should lead to visit/consultation management, not patient demographics. Navigate to the detail page instead of opening a modal for the wrong entity.

**Also clean up:** Remove unused imports (`PatientForm`), unused state (`editingPatient`, `showForm`), and the modal JSX block.

### Pattern M: Role/permission expansion — adding a role to multiple endpoints and UI elements

**Symptom:** You need to grant an existing role (e.g., `doctor`) the same capabilities as another role (e.g., `data_clerk`). This spans backend route authorization AND frontend role-gated UI.

**Systematic approach:**

1. **Find all backend gaps:** Grep all route files for `authorize` calls that include the source role but exclude the target role:
   ```
   grep -rn "authorize.*DATA_CLERK" Backend/src/routes/
   ```
   For each match, check if `DOCTOR` is also listed. If not, add it.

2. **Find all frontend gaps:** Grep the entire frontend for role checks that gate features:
   ```
   grep -rn "data_clerk\|DATA_CLERK" Frontend/src/
   ```
   Look for patterns like:
   - `user?.role === "data_clerk" || user?.role === "super_admin"` → add `|| user?.role === "doctor"`
   - `canRegister = ["super_admin", "data_clerk"].includes(user?.role)` → add `"doctor"`
   - `showSection = role === "data_clerk"` → add `|| role === "doctor"`

3. **Common files to update:**
   - `Backend/src/routes/patientRoutes.js` — POST create, POST photo upload
   - `Backend/src/routes/visitRoutes.js` — POST create, PATCH assign-doctor
   - `Backend/src/routes/prescriptionRoutes.js` — POST dispense
   - `Frontend/src/pages/portal/PatientsPage.jsx` — Register Patient button
   - `Frontend/src/components/portal/Sidebar.jsx` — navigation links, recent patients section

4. **Verify:** After adding the role to backend `authorize()`, ensure the frontend also shows the corresponding UI elements. A backend-only fix means the role *can* access the endpoint but has no button to click.

### Pattern N: Conditional branch silently chooses wrong path (combined Pattern H + Pattern J)

**Symptom:** An if/else branch always takes the wrong path with no console errors or visible failures. The system appears to work but data never reaches the next stage.

**Example — handleCompleteConsultation bug:**

The doctor's "Complete Consultation" button checks whether there are pending prescriptions to decide the next visit status:
```js
const r = await axios.get("/prescriptions", { params: { visitId, status: "pending" } });
const hasPending = r.data.prescriptions?.length > 0;  // ALWAYS undefined → false
const nextStatus = hasPending ? "pending_payment" : "completed";
```

Two combined bugs made this always choose `"completed"`:
- **Pattern H:** `r.data.prescriptions` should be `r.data` (paginated response has array at `data`, not `data.prescriptions`)
- **Pattern J:** `visitId` was never extracted in the backend service, so the query returned ALL prescriptions, not the current visit's

Either bug alone might still produce truthy values (if other visits had prescriptions), but together they guaranteed `undefined?.length > 0` → `false`, silently breaking the doctor→cashier handoff.

**Checklist for similar silent branches:**
1. When a conditional branch depends on API response data, verify the response path with `console.log` of the raw response.
2. Check that all query params sent by the frontend are destructured and filtered in the backend service.
3. If the branch has no `else` error handling, it can fail silently — add a `console.log` in both branches to confirm which path is taken.

### Pattern O: Cashier payment + dispensing merged into one step

**Scenario:** The cashier also acts as pharmacist in a small clinic. Payment and dispensing happen together — the patient pays and receives medicine immediately. No separate dispensing tab or step.

**Implementation:**

1. **Backend — processPayment auto-dispenses:** Modify `paymentService.processPayment` to create `MedicineDispense` records and set prescription status to `"dispensed"` in the same transaction as payment processing. No separate `"paid"` step needed:

```js
// In the transaction, for each pending prescription:
const medicine = await Medicine.findByPk(prescription.medicineId, { transaction });
await MedicineDispense.create({
  prescriptionId: prescription.id,
  patientId: prescription.patientId,
  medicineId: prescription.medicineId,
  visitId: prescription.visitId,
  dispensedBy: cashierId,
  quantity: prescription.quantity,
  dosage: prescription.dosage,
  frequency: prescription.frequency,
  route: prescription.route,
  duration: prescription.duration,
  instructions: prescription.instructions,
  batchNumber: medicine?.batchNumber,
  expiryDate: medicine?.expiryDate,
}, { transaction });
await prescription.update({
  status: PRESCRIPTION_STATUS.DISPENSED,
  dispensedDate: new Date(),
  dispensedBy: cashierId,
}, { transaction });
```

2. **Backend:** Add CASHIER to dispense route for manual dispense edge cases:
   ```js
   authorize(ROLES.DOCTOR, ROLES.CASHIER)
   ```

3. **Backend:** Make dispense quantity optional (defaults to full prescribed amount):
   ```js
   body("quantity").optional().isInt({ min: 1 })
   const dispenseQuantity = quantity || prescription.quantity;
   ```

4. **Frontend:** Single payment view with "Receive Payment & Dispense" button. No second tab needed. Toast says "Payment received — medicine dispensed to patient."

5. **Import:** Add `MedicineDispense` to the import in `paymentService.js`:
   ```js
   import { Payment, Visit, Prescription, MedicineDispense, Patient, Medicine, User, sequelize } from "../models/index.js";
   ```

### Pattern P: `undefined` in useEffect deps array causes missed re-fetches

**Symptom:** A page fetches data with a filter that depends on `user.id`, but if `user` is `null` on the first render (e.g., Zustand persist hydrates asynchronously), the fetch never re-runs after `user` becomes available.

**Example:**
```js
// BROKEN — if user is null on first render, fetchPatients runs with consultedBy: undefined
// and never re-runs when user loads because user is not in deps
useEffect(() => {
  fetchPatients();
}, [page, search]);

// CORRECT — guard on user.id and add it to deps
useEffect(() => {
  if (user?.id) {
    fetchPatients();
  }
}, [page, search, user?.id]);
```

**Why this matters:** `fetchPatients` uses `user.id` from the closure. If `user` changes (null → object), the function reference doesn't change, but the captured `user.id` value is stale. Adding `user?.id` to deps forces a re-fetch when the user identity becomes available.

**Also check:** The `fetchPatients` function itself should handle the case where `user?.id` is missing (defensive `if (!user?.id) return;`).

### Pattern R: Socket.io emitters defined but never called (silent real-time failure)

**Symptom:** The socket infrastructure is fully built — server initialized, auth middleware working, emitter functions defined and exported, frontend listeners registered — but no real-time events fire. The backend never broadcasts.

**Root cause:** The emitter functions in `socket.js` are exported but never imported or called by any controller or service. The pipes are laid but no water flows through them. This happens because socket wiring is often done as a separate "infrastructure" task, and the business logic files are never updated to call the emitters.

**Systematic fix for each resource:**

1. Import the emitter in the controller:
   ```js
   import { emitPatientRegistered } from "../config/socket.js";
   ```

2. Call it after the successful DB operation:
   ```js
   export const createPatient = asyncHandler(async (req, res) => {
     const patient = await patientService.createPatient(req.body, req.user.id);
     emitPatientRegistered(patient);  // ← broadcast to all relevant roles
     return ApiResponse.created(res, patient, "Patient registered successfully");
   });
   ```

3. **Wire every write operation** (create, update, status change, delete):
   - `patientController`: `createPatient` → `emitPatientRegistered`
   - `visitController`: `createVisit` → `emitVisitCreated`, `updateVisit`/`updateVisitStatus` → `emitVisitStatusChanged`
   - `prescriptionController`: `createPrescription` → `emitPrescriptionCreated`, `dispenseMedicine` → `emitMedicineDispensed`
   - `paymentController`: `processPayment` → `emitPaymentCompleted`
   - `medicineController`: low stock check → `emitLowStockAlert`

4. **Add new events as needed** — e.g., `emitPaymentCompleted` didn't exist originally, had to be added:
   ```js
   export const emitPaymentCompleted = (payment) => {
     emitToRole("cashier", "payment:completed", payment);
     emitToRole("doctor", "payment:completed", payment);
     emitToRole("super_admin", "payment:completed", payment);
   };
   // Also add to default export
   ```

5. **Frontend — add listeners for new events:**
   ```js
   socket.on("payment:completed", (payment) => {
     if (["super_admin", "doctor", "cashier"].includes(user?.role)) {
       toast.success(`Payment received: ${payment.amount} ETB`);
     }
   });
   // Cleanup: socket.off("payment:completed");
   ```

6. **Auto-refresh pages on relevant events:**
   ```js
   // CashierPage: refresh pending payments list when events suggest changes
   socket.on("visit:status-changed", () => fetchPendingPayments());
   socket.on("payment:completed", () => fetchPendingPayments());
   
   // DoctorQueuePage: refresh queue
   socket.on("queue:updated", () => fetchQueue());
   socket.on("visit:status-changed", () => fetchQueue());
   
   // PatientsPage: refresh list
   socket.on("patient:registered", () => fetchPatients());
   ```

**Checklist:**
1. Grep for `import.*socket` in `Backend/src/controllers/` — if zero matches, emitters are never called.
2. For each controller that does a write (POST/PUT/PATCH), add the import and emit call.
3. For each new event, add a frontend listener in `PortalLayout.jsx` (for toasts) AND in the relevant page (for auto-refresh).
4. Add cleanup (`socket.off`) for every `socket.on` in useEffect returns.

### Pattern S: Print receipt in new window with auto-print

**Scenario:** Cashier needs to print a receipt showing clinic header, patient info, doctor, prescribed medicines with dosage/instructions, and total. The receipt should auto-trigger the browser print dialog.

**Implementation:**

```js
const handlePrintReceipt = (visit) => {
  const printWindow = window.open("", "_blank", "width=380,height=600");
  if (!printWindow) return;

  const rows = visit.prescriptions.map(p => `
    <tr>
      <td><strong>${p.medicine?.name}</strong> ${p.medicine?.strength || ""}
        <br><span style="font-size:11px">Qty: ${p.quantity} • ${p.dosage} • ${p.frequency}</span>
        ${p.instructions ? `<br><em>${p.instructions}</em>` : ""}
      </td>
      <td style="text-align:right">${p.totalAmount} ETB</td>
    </tr>`).join("");

  const html = `<!DOCTYPE html>
  <html><head><meta charset="UTF-8"><title>Receipt</title>
  <style>body{font-family:monospace;max-width:380px;margin:0 auto;padding:16px}
  .divider{border-top:1px dashed #000;margin:10px 0}
  @media print{body{padding:8px}}</style></head>
  <body>
    <div style="text-align:center"><h2>Clinic Name</h2><p>${new Date().toLocaleString()}</p></div>
    <div class="divider"></div>
    <p><strong>Patient:</strong> ${visit.patient?.firstName} ${visit.patient?.lastName}</p>
    <p><strong>Doctor:</strong> Dr. ${visit.doctor?.firstName} ${visit.doctor?.lastName}</p>
    <div class="divider"></div>
    <table>${rows}</table>
    <div class="divider"></div>
    <p style="text-align:right"><strong>TOTAL: ${total} ETB</strong></p>
    <script>window.onload=function(){window.print();window.close();}</script>
  </body></html>`;

  printWindow.document.write(html);
  printWindow.document.close();
};
```

**Key details:**
- Use `window.open("", "_blank", "width=...,height=...")` for a popup-sized window.
- Inline `<style>` with `@media print` for printer-friendly formatting.
- `<script>window.onload=function(){window.print();window.close();}</script>` auto-triggers print.
- Use monospace font for receipt-style alignment.
- Include instructions field if present (`p.instructions`).

### Pattern T: Count badges on sidebar nav items and header bell (real-time via socket)

**Scenario:** Show live count badges on sidebar navigation items (e.g., queue count for doctor, pending payments for cashier) and on the header bell icon. Counts update in real-time via socket events.

**Sidebar badges:**

```jsx
// State
const [counts, setCounts] = useState({});

// Fetch initial count + listen for updates
useEffect(() => {
  // Initial fetch
  const fetchCounts = async () => {
    if (user?.role === "doctor") {
      const res = await axiosInstance.get("/visits/queue");
      setCounts(c => ({ ...c, "/portal/queue": res.data?.data?.length || 0 }));
    }
    if (user?.role === "cashier") {
      const res = await axiosInstance.get("/payments/pending", { params: { pageSize: 1 } });
      setCounts(c => ({ ...c, "/portal/cashier": res.data?.pagination?.totalItems || 0 }));
    }
  };
  fetchCounts();

  const socket = getSocket();
  if (!socket) return;

  // Increment on new
  socket.on("queue:updated", () => setCounts(c => ({ ...c, "/portal/queue": (c["/portal/queue"]||0)+1 })));
  // Decrement on completion  
  socket.on("payment:completed", () => setCounts(c => ({ ...c, "/portal/cashier": Math.max(0,(c["/portal/cashier"]||1)-1) })));

  return () => { socket.off("queue:updated"); socket.off("payment:completed"); };
}, [user?.role]);

// Mark items that should have badges
doctor: [
  { name: "Queue", to: "/portal/queue", icon: FiCalendar, showBadge: true },
  ...
]

// Render badge
{link.showBadge && counts[link.to] > 0 && (
  <span className="ml-auto min-w-[22px] h-5 flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full px-1.5">
    {counts[link.to] > 99 ? "99+" : counts[link.to]}
  </span>
)}
```

**Header bell badge:**

```jsx
const [notifCount, setNotifCount] = useState(0);

useEffect(() => {
  const socket = getSocket();
  if (!socket) return;
  const inc = () => setNotifCount(c => c + 1);
  socket.on("notification:new", inc);
  socket.on("visit:status-changed", inc);
  socket.on("patient:registered", inc);
  return () => { socket.off("notification:new", inc); socket.off("visit:status-changed", inc); socket.off("patient:registered", inc); };
}, []);

// Render
<button onClick={() => setNotifCount(0)} className="relative">
  <FiBell />
  {notifCount > 0 && (
    <span className="absolute -top-0.5 -right-0.5 min-w-[20px] h-5 flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full px-1">
      {notifCount > 99 ? "99+" : notifCount}
    </span>
  )}
</button>
```

**Key patterns:**
- Use `counts[link.to]` as the key so badge maps to URL — no separate mapping needed.
- Increment on create/arrive events, decrement on complete/clear events.
- Clicking the bell resets the counter to 0.
- Max display: "99+" for numbers over 99.
- Both sidebar and badge need `getSocket()` import and cleanup in useEffect.

### Pattern U: Moving action button from inside a tab to below tabs (always visible)

**Scenario:** A "Complete Consultation" button lives inside the Consultation tab component. When the doctor switches to other tabs (Vital Signs, Herbal Medicine, History), the button disappears. The doctor should be able to complete the consultation from any tab.

**Fix:**

1. **Remove the button from the tab component** (`ConsultationTab.jsx`):
   - Delete the button JSX block
   - Remove `onComplete` from the component's prop destructuring

2. **Add the button below the tabs** in the parent (`ConsultationPanel`):
   ```jsx
   {/* After the tabs div closes */}
   <div className="bg-white rounded-xl shadow-sm p-4 border-t-2 border-emerald-100">
     <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
       {/* Optional: diagnosis summary so doctor sees current state */}
       <div className="flex-1">
         <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Diagnosis</p>
         {consultationData.diagnosis.length > 0 ? (
           <div className="flex flex-wrap gap-1.5">
             {consultationData.diagnosis.map((d, i) => (
               <span key={i} className="px-2.5 py-1 bg-red-50 text-red-700 rounded-full text-sm">{d}</span>
             ))}
           </div>
         ) : <p className="text-sm text-gray-400 italic">No diagnosis added yet</p>}
       </div>
       <button onClick={onComplete} className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg">
         Complete Consultation
       </button>
     </div>
   </div>
   ```

3. **Responsive:**
   - Use `flex-col sm:flex-row` so it stacks vertically on mobile.
   - Button: `w-full sm:w-auto` so it fills width on mobile, natural width on desktop.

4. **Do NOT use `sticky` or `fixed`** unless the user explicitly asks for it — let it scroll with the content.

### Pattern Q: Revenue/payment reporting (daily/weekly/monthly)

**Scenario:** Cashier needs a daily, weekly, and monthly report of paid prescriptions showing total revenue, prescription count, payment method breakdown, and transaction list.

**Backend — Service function:**

```js
export const getRevenueReport = async (period = "daily", date) => {
  const refDate = date ? new Date(date) : new Date();
  let startDate, endDate;

  if (period === "daily") {
    startDate = new Date(refDate); startDate.setHours(0,0,0,0);
    endDate = new Date(refDate); endDate.setHours(23,59,59,999);
  } else if (period === "weekly") {
    const day = refDate.getDay();
    startDate = new Date(refDate); startDate.setDate(refDate.getDate() - day); startDate.setHours(0,0,0,0);
    endDate = new Date(startDate); endDate.setDate(startDate.getDate() + 6); endDate.setHours(23,59,59,999);
  } else if (period === "monthly") {
    startDate = new Date(refDate.getFullYear(), refDate.getMonth(), 1);
    endDate = new Date(refDate.getFullYear(), refDate.getMonth() + 1, 0, 23, 59, 59, 999);
  }

  const payments = await Payment.findAll({
    where: { paidAt: { [Op.between]: [startDate, endDate] }, status: "paid" },
    include: [
      { model: Patient, as: "patient", attributes: ["id", "patientId", "firstName", "lastName", "phone"] },
      { model: Visit, as: "visit", attributes: ["id", "visitNumber", "visitDate"] },
      { model: User, as: "cashier", attributes: ["id", "firstName", "lastName"] },
    ],
    order: [["paidAt", "DESC"]],
  });

  // Compute summaries
  const totalRevenue = payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
  const byMethod = {};
  payments.forEach(p => { byMethod[p.paymentMethod || "other"] = (byMethod[p.paymentMethod || "other"] || 0) + parseFloat(p.amount || 0); });

  return {
    period, startDate, endDate,
    summary: { totalRevenue, totalPrescriptions: payments.length, byPaymentMethod: byMethod },
    payments: payments.map(p => ({ id: p.id, paymentNumber: p.paymentNumber, amount: parseFloat(p.amount || 0), paymentMethod: p.paymentMethod, paidAt: p.paidAt, transactionId: p.transactionId, patient: p.patient, visit: p.visit, cashier: p.cashier })),
  };
};
```

**Backend — Route + Controller:**
- Add `router.get("/revenue", reportController.getRevenueReport)` to `reportRoutes.js`
- Add CASHIER to the `authorize()` call: `authorize(ROLES.SUPER_ADMIN, ROLES.STAFF_MANAGER, ROLES.DOCTOR, ROLES.CASHIER)`
- Controller: `const { period, date } = req.query; const report = await reportService.getRevenueReport(period, date);`

**Frontend — Report page:**

Create a page with three period tabs (Daily/Weekly/Monthly) that calls `GET /reports/revenue?period=daily|weekly|monthly&date=YYYY-MM-DD`:

- **Summary cards:** Total Revenue (ETB), Prescriptions Paid count, Period range
- **Payment method breakdown:** Cards for cash, transfer, mobile_money
- **Transactions table:** Patient name/ID, Payment #, Amount, Method, Date/Time, Cashier name
- **Date picker:** For daily (date input) and monthly (month input). Weekly auto-calculates from current date.

**Sidebar:** Add `{ name: "Reports", to: "/portal/reports", icon: FiFileText }` to the cashier navigation array.

**Route:** Add `<Route path="reports" element={<CashierReportsPage />} />` in App.jsx under the portal route group.

### Pattern R: Socket.io infrastructure defined but emitters never called

**Symptom:** The socket server is running, clients connect, but no real-time events fire. The backend has a `socket.js` with emitter functions like `emitPatientRegistered()`, but patients created by a clerk never appear on the doctor's screen until a manual refresh.

**Root cause:** The socket infrastructure (server, auth middleware, rooms, emitter functions) is fully defined, but **no controller or service imports or calls the emitter functions**. They are orphaned exports.

**Diagnosis:**
1. Check `Backend/src/config/socket.js` — verify emitter functions exist and are exported.
2. Grep `Backend/src/controllers/` and `Backend/src/services/` for `import.*socket` — if zero matches, emitters are never called.
3. Check frontend `lib/socket.js` for `initializeSocket` and `connectSocket` calls — connection works.
4. Check frontend pages for `socket.on(...)` listeners — they exist but never receive events.

**Fix — Wire emitters into controllers:**

```js
// In each controller that creates/updates records:
import { emitPatientRegistered } from "../config/socket.js";

export const createPatient = asyncHandler(async (req, res) => {
  const patient = await patientService.createPatient(req.body, req.user.id);
  emitPatientRegistered(patient);  // ← ADD THIS
  return ApiResponse.created(res, patient, "...");
});
```

**Standard wiring table for this project:**

| Controller | After action | Emitter to call |
|---|---|---|
| `patientController.createPatient` | Patient created | `emitPatientRegistered(patient)` |
| `visitController.createVisit` | Visit created | `emitVisitCreated(visit)` |
| `visitController.updateVisit` | Visit updated | `emitVisitStatusChanged(visit)` |
| `visitController.updateVisitStatus` | Status changed | `emitVisitStatusChanged(visit)` |
| `prescriptionController.createPrescription` | Rx created | `emitPrescriptionCreated(prescription)` |
| `prescriptionController.dispenseMedicine` | Med dispensed | `emitMedicineDispensed(result)` |
| `paymentController.processPayment` | Payment done | `emitPaymentCompleted(payment)` |

**Fix — Add frontend listeners for auto-refresh:**

```js
// In page components — listen for relevant events and re-fetch data
useEffect(() => {
  const socket = getSocket();
  if (!socket) return;
  const handleRefresh = () => fetchData();
  socket.on("visit:status-changed", handleRefresh);
  socket.on("prescription:created", handleRefresh);
  return () => {
    socket.off("visit:status-changed", handleRefresh);
    socket.off("prescription:created", handleRefresh);
  };
}, []);
```

**Page-specific listeners:**

| Page | Events to listen for | Action |
|---|---|---|
| DoctorQueuePage | `queue:updated`, `visit:status-changed` | Re-fetch queue |
| CashierPage | `visit:status-changed`, `prescription:created`, `payment:completed` | Re-fetch pending payments |
| PatientsPage | `patient:registered` | Re-fetch patient list |
| PortalLayout | All events | Toast notifications |

**New event — payment:completed:** If the socket config doesn't have a payment event, add one:

```js
export const emitPaymentCompleted = (payment) => {
  emitToRole("cashier", "payment:completed", payment);
  emitToRole("doctor", "payment:completed", payment);
  emitToRole("super_admin", "payment:completed", payment);
};
```

### Pattern S: Action button hidden inside a tab — move to persistent bottom bar

**Symptom:** The "Complete Consultation" button is inside the Consultation tab. When the doctor switches to Vital Signs, Herbal Medicine, or History tabs, the button disappears and the doctor can't complete the consultation.

**Root cause:** The button is rendered inside a tab panel that only shows when its tab is active:
```jsx
{activeTab === "consultation" && (
  <ConsultationTab>
    ...
    <button onClick={onComplete}>Complete Consultation</button>
  </ConsultationTab>
)}
```

**Fix — Move button outside the tab conditional, after the tabs container:**

1. Remove the button from the tab component (e.g., `ConsultationTab`).
2. Add it after the tabs `<div>`, always visible:

```jsx
<div className="bg-white rounded-xl shadow-sm">
  {/* Tabs */}
  <div className="border-b">
    <nav className="flex">...</nav>
  </div>
  <div className="p-4">
    {activeTab === "consultation" && <ConsultationTab ... />}
    {activeTab === "vitals" && <VitalSignsForm ... />}
    ...
  </div>
</div>

{/* Always-visible bottom bar */}
<div className="bg-white rounded-xl shadow-sm p-4 border-t-2 border-emerald-100">
  <div className="flex items-start justify-between gap-4">
    {/* Left: Summary of key data (e.g., diagnoses) */}
    <div className="flex-1">
      {data.diagnosis.length > 0 ? (
        data.diagnosis.map((d, i) => <span key={i} className="...">{d}</span>)
      ) : (
        <p className="text-sm text-gray-400 italic">No diagnosis added yet</p>
      )}
    </div>
    {/* Right: Action button */}
    <button onClick={onComplete} className="px-6 py-3 bg-emerald-600 text-white rounded-lg">
      Complete Consultation
    </button>
  </div>
</div>
```

**Key insight:** Action buttons that need to be accessible regardless of which tab is open should live outside the tab panel. A sticky bottom bar with a summary of critical data + the action button is a clean pattern.

### Pattern T: Making a form field optional

**Symptom:** A form blocks submission with "Please add at least one diagnosis", but the business rule changes — diagnosis should be optional. Need to remove the validation.

**Two places to fix:**

1. **Frontend validation guard** — Remove the early-return check:
```js
// REMOVE this block:
if (!consultationData.diagnosis.length) {
  toast.error("Please add at least one diagnosis");
  return;
}
```

2. **Label indicator** — Remove the `*` from the label:
```jsx
// BEFORE: <label>Diagnosis *</label>
// AFTER:  <label>Diagnosis</label>
```

If a field was previously required in a form but is now optional, check both the frontend validation (toast + early return) and the UI indicator (asterisk, "(required)" text). The backend validator should also be checked if one exists.
