---
name: trace-fullstack-issues
description: Debug frontend-backend-database mismatches by tracing the full chain: route registration → API calls → backend route definitions → database schema. Use when a page doesn't load, an API call 404s, or a write operation 500s with column errors in this fullstack app.
source: auto-skill
extracted_at: '2026-06-17T11:30:00.000Z'
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

