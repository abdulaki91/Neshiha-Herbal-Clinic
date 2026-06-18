import React, { forwardRef } from "react";

const formatETB = (amount) => parseFloat(amount || 0).toFixed(2);

const PrintableReceipt = forwardRef(({ visit }, ref) => {
  const prescriptions = visit?.prescriptions || visit?.visit?.prescriptions || [];
  const patient = visit?.patient || visit?.visit?.patient || {};
  const doctor = visit?.doctor || visit?.visit?.doctor;
  const total = prescriptions.reduce(
    (sum, p) => sum + parseFloat(p.totalAmount || p.unitPrice * p.quantity || 0),
    0,
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
      {visit?.visitNumber && <p><strong>Visit:</strong> #{visit.visitNumber}</p>}
      {doctor && <p><strong>Doctor:</strong> Dr. {doctor.firstName} {doctor.lastName}</p>}

      <div style={styles.divider} />

      <p style={styles.sectionTitle}>Prescribed Medicines:</p>
      <table style={styles.table}>
        <tbody>
          {prescriptions.map((p) => (
            <tr key={p.id}>
              <td style={styles.tdLeft}>
                <strong>{p.medicine?.name || "—"}</strong>
                {p.medicine?.strength ? ` (${p.medicine.strength})` : ""}
                <br />
                <span style={styles.medMeta}>
                  Qty: {p.quantity} &bull; {p.dosage || "—"} &bull; {p.frequency || "—"}
                  {p.route ? ` &bull; ${p.route}` : ""}
                  {p.duration ? ` &bull; ${p.duration}` : ""}
                  {p.instructions && (
                    <>
                      <br />
                      <em>{p.instructions}</em>
                    </>
                  )}
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

      <p style={styles.total}>
        <strong>TOTAL: {formatETB(total)} ETB</strong>
      </p>

      <div style={styles.divider} />

      <div style={styles.footer}>
        <p>Thank you for choosing</p>
        <p>Neshiha Herbal Clinic</p>
        <p style={styles.disclaimer}>This is a computer-generated receipt</p>
      </div>
    </div>
  );
});

PrintableReceipt.displayName = "PrintableReceipt";

// ---------------------------------------------------------------------------
// Styles (mimic thermal / receipt printer look)
// ---------------------------------------------------------------------------
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
  sectionTitle: { fontWeight: "bold", marginBottom: 6 },
  table: { width: "100%", borderCollapse: "collapse" },
  tdLeft: {
    padding: "6px 4px",
    borderBottom: "1px dashed #ccc",
    verticalAlign: "top",
  },
  tdRight: {
    padding: "6px 4px",
    borderBottom: "1px dashed #ccc",
    textAlign: "right",
    whiteSpace: "nowrap",
  },
  medMeta: { fontSize: 11, color: "#555" },
  total: { fontSize: 14, textAlign: "right" },
  footer: { textAlign: "center", marginTop: 12, fontSize: 10, color: "#555" },
  disclaimer: { fontSize: 9, color: "#aaa", marginTop: 8 },
};

export default PrintableReceipt;
