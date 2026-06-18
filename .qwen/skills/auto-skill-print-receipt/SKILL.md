---
name: print-receipt
description: Create printable receipt components using react-to-print — forwardRef component, useReactToPrint hook with dynamic document title, auto-trigger on state change
source: auto-skill
extracted_at: '2026-06-18T14:30:00.000Z'
---

# Printable Receipt with react-to-print

Replace `window.open` + raw HTML + `window.print()` with react-to-print for type-safe, React-native printable components with dynamic file names.

## 1. Install

```bash
npm install react-to-print
```

## 2. Create PrintableReceipt component

Use `forwardRef` so `useReactToPrint` can capture the content. Style inline for thermal/receipt printer look:

```jsx
import React, { forwardRef } from "react";

const formatETB = (amount) => parseFloat(amount || 0).toFixed(2);

const PrintableReceipt = forwardRef(({ visit }, ref) => {
  const prescriptions = visit?.prescriptions || visit?.visit?.prescriptions || [];
  const patient = visit?.patient || visit?.visit?.patient || {};
  const doctor = visit?.doctor || visit?.visit?.doctor;
  const total = prescriptions.reduce(
    (sum, p) => sum + parseFloat(p.totalAmount || p.unitPrice * p.quantity || 0), 0,
  );

  return (
    <div ref={ref} style={styles.page}>
      <div style={styles.center}>
        <h2 style={styles.clinicName}>Neshiha Herbal Clinic</h2>
        <p style={styles.subtitle}>Clinic Management System</p>
        <p style={styles.date}>
          {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
        </p>
      </div>
      <div style={styles.divider} />
      <p><strong>Patient:</strong> {patient.firstName} {patient.lastName}</p>
      <p><strong>ID:</strong> {patient.patientId}</p>
      {doctor && <p><strong>Doctor:</strong> Dr. {doctor.firstName} {doctor.lastName}</p>}
      <div style={styles.divider} />
      <p style={styles.sectionTitle}>Prescribed Medicines:</p>
      <table style={styles.table}>
        <tbody>
          {prescriptions.map((p) => (
            <tr key={p.id}>
              <td style={styles.tdLeft}>
                <strong>{p.medicine?.name || "—"}</strong>
                <br/><span style={styles.medMeta}>
                  Qty: {p.quantity} • {p.dosage || "—"} • {p.frequency || "—"}
                  {p.route ? ` • ${p.route}` : ""}
                  {p.instructions && <><br/><em>{p.instructions}</em></>}
                </span>
              </td>
              <td style={styles.tdRight}>
                {formatETB(p.totalAmount || p.unitPrice * p.quantity)} ETB
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={styles.divider} />
      <p style={styles.total}><strong>TOTAL: {formatETB(total)} ETB</strong></p>
      <div style={styles.divider} />
      <div style={styles.footer}>
        <p>Thank you for choosing Neshiha Herbal Clinic</p>
      </div>
    </div>
  );
});
PrintableReceipt.displayName = "PrintableReceipt";

const styles = {
  page: { fontFamily: '"Courier New", monospace', fontSize: 12, padding: 16, maxWidth: 380, margin: "0 auto" },
  center: { textAlign: "center" },
  clinicName: { fontSize: 14, marginBottom: 2 },
  subtitle: { fontSize: 10, color: "#555" },
  date: { fontSize: 10, marginTop: 4 },
  divider: { borderTop: "1px dashed #000", margin: "10px 0" },
  sectionTitle: { fontWeight: "bold", marginBottom: 6 },
  table: { width: "100%", borderCollapse: "collapse" },
  tdLeft: { padding: "6px 4px", borderBottom: "1px dashed #ccc", verticalAlign: "top" },
  tdRight: { padding: "6px 4px", borderBottom: "1px dashed #ccc", textAlign: "right", whiteSpace: "nowrap" },
  medMeta: { fontSize: 11, color: "#555" },
  total: { fontSize: 14, textAlign: "right" },
  footer: { textAlign: "center", marginTop: 12, fontSize: 10, color: "#555" },
};

export default PrintableReceipt;
```

**Key pattern:** Always handle both `visit.prescriptions` and `visit.visit?.prescriptions` — the data shape differs between pending-payments (direct prescriptions) and payment-history (nested under `visit.prescriptions`).

## 3. Use in the parent component

Three parts: a ref, the `useReactToPrint` hook, and a hidden `<PrintableReceipt>`:

```jsx
import { useRef, useState, useCallback, useEffect } from "react";
import { useReactToPrint } from "react-to-print";
import PrintableReceipt from "../../components/PrintableReceipt";

const CashierPage = () => {
  const [printVisit, setPrintVisit] = useState(null);
  const printRef = useRef(null);

  // Dynamic document title = patient name for save dialog
  const printPageLabel = useCallback(() => {
    const p = printVisit?.patient || printVisit?.visit?.patient || {};
    return `Receipt_${p.firstName || ""}_${p.lastName || ""}`.replace(/\s+/g, "_");
  }, [printVisit]);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: printPageLabel,
    onAfterPrint: () => setPrintVisit(null),  // clear after printing
  });

  // Auto-trigger print when printVisit state is set
  useEffect(() => {
    if (printVisit) handlePrint();
  }, [printVisit, handlePrint]);

  return (
    <>
      {/* ... page content ... */}

      {/* Print button — just set state, the effect triggers actual print */}
      <button onClick={() => setPrintVisit(someVisit)}>
        <FiPrinter /> Print
      </button>

      {/* Hidden — rendered but invisible; react-to-print captures it */}
      <div style={{ display: "none" }}>
        <PrintableReceipt ref={printRef} visit={printVisit} />
      </div>
    </>
  );
};
```

## 4. Why this pattern is better than `window.open`

| `window.open` + raw HTML | `react-to-print` |
|---|---|
| JSX not available — build HTML strings | Full React component with JSX |
| No type safety for data fields | TypeScript/JSX catches missing props |
| `window.print()` may be blocked by popup blocker | Uses the current DOM — no popup |
| File name requires `document.title` hack | `documentTitle` callback in hook |
| Hard to test | Normal React component, testable |
| No cleanup after print | `onAfterPrint` callback handles cleanup |

## 5. File name customization

The `documentTitle` callback receives nothing but runs in the component closure, so it can access `printVisit` state. Spaces are replaced with underscores for clean file names. The browser's print/save dialog uses this as the default filename.

## 6. Auto-trigger from payment flow

When payment is confirmed, set the visit to `setPrintVisit` and the `useEffect` auto-triggers the print dialog. The `onAfterPrint` callback clears the state so no stale data lingers: