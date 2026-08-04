import React, { forwardRef } from "react";

/**
 * Clinical handout for the patient — dosage/instructions only, no pricing.
 * Billing is handled separately by PrintableReceipt at the cashier.
 */
const PrintablePrescriptionSlip = forwardRef(
  ({ visit, patient, doctor, prescriptions = [] }, ref) => {
    const p = patient || visit?.patient || {};
    const doc = doctor || visit?.doctor;

    return (
      <div ref={ref} style={styles.page}>
        <div style={styles.center}>
          <h2 style={styles.clinicName}>Neshiha Herbal Clinic</h2>
          <p style={styles.subtitle}>Herbal Prescription</p>
          <p style={styles.date}>
            {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
          </p>
        </div>

        <div style={styles.divider} />

        <p>
          <strong>Patient:</strong> {p.firstName} {p.lastName}
        </p>
        <p>
          <strong>ID:</strong> {p.patientId}
        </p>
        {p.age && (
          <p>
            <strong>Age / Gender:</strong> {p.age}y · {p.gender}
          </p>
        )}
        {visit?.visitNumber && (
          <p>
            <strong>Visit:</strong> #{visit.visitNumber}
          </p>
        )}
        {doc && (
          <p>
            <strong>Doctor:</strong> Dr. {doc.firstName} {doc.lastName}
          </p>
        )}

        <div style={styles.divider} />

        <p style={styles.rxMark}>℞</p>

        {prescriptions.length === 0 ? (
          <p style={styles.empty}>No medicines prescribed for this visit.</p>
        ) : (
          prescriptions.map((rx, idx) => (
            <div key={rx.id || idx} style={styles.item}>
              <p style={styles.itemName}>
                {idx + 1}. {rx.medicine?.name || "—"}
                {rx.medicine?.strength ? ` (${rx.medicine.strength})` : ""}
              </p>
              <p style={styles.itemMeta}>
                Qty: {rx.quantity} &bull; {rx.dosage || "—"} &bull;{" "}
                {rx.frequency || "—"}
                {rx.route ? ` &bull; ${rx.route}` : ""}
                {rx.duration ? ` &bull; ${rx.duration}` : ""}
              </p>
              {rx.instructions && (
                <p style={styles.itemInstructions}>
                  <em>{rx.instructions}</em>
                </p>
              )}
            </div>
          ))
        )}

        <div style={styles.divider} />

        <div style={styles.footer}>
          <p>Take exactly as directed. Contact the clinic with any concerns.</p>
          <p style={styles.disclaimer}>This is a computer-generated document</p>
        </div>
      </div>
    );
  },
);

PrintablePrescriptionSlip.displayName = "PrintablePrescriptionSlip";

const styles = {
  page: {
    fontFamily: '"Courier New", monospace',
    fontSize: 12,
    padding: 16,
    maxWidth: 380,
    margin: "0 auto",
  },
  center: { textAlign: "center" },
  clinicName: { fontSize: 14, marginBottom: 2 },
  subtitle: { fontSize: 10, color: "#555" },
  date: { fontSize: 10, marginTop: 4 },
  divider: { borderTop: "1px dashed #000", margin: "10px 0" },
  rxMark: { fontSize: 20, fontWeight: "bold", margin: "0 0 6px" },
  empty: { fontSize: 11, color: "#777", fontStyle: "italic" },
  item: { marginBottom: 10 },
  itemName: { fontWeight: "bold", marginBottom: 2 },
  itemMeta: { fontSize: 11, color: "#333" },
  itemInstructions: { fontSize: 11, color: "#555", marginTop: 2 },
  footer: { textAlign: "center", marginTop: 12, fontSize: 10, color: "#555" },
  disclaimer: { fontSize: 9, color: "#aaa", marginTop: 8 },
};

export default PrintablePrescriptionSlip;
