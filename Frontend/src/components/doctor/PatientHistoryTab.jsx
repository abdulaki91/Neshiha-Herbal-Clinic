import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import axiosInstance from "../../lib/axios";

// Strip the trailing " *" / ":" that some form labels carry.
const label = (s) => String(s || "").replace(/\s*[*:]\s*$/, "");

const toList = (v) => {
  if (Array.isArray(v)) return v;
  if (typeof v === "string" && v.trim()) {
    try {
      const parsed = JSON.parse(v);
      return Array.isArray(parsed) ? parsed : [String(parsed)];
    } catch {
      return v.split(",").map((s) => s.trim()).filter(Boolean);
    }
  }
  return [];
};

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : "—");
const money = (v) => `${Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} ETB`;

const Field = ({ title, children }) =>
  children ? (
    <div className="mb-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-white/50">{title}</p>
      <div className="text-sm text-gray-700 dark:text-white/80 whitespace-pre-line">{children}</div>
    </div>
  ) : null;

/**
 * A returning patient's full record, one card per previous visit: complaint
 * and symptoms, vital signs, history and examination, diagnosis, treatment,
 * notes, follow-up, every medicine received (quantity, dosage, price,
 * paid/dispensed), investigations with results, and the payment.
 * Data: GET /patients/:id/history (visits include prescriptions with their
 * medicine, investigations and payments).
 */
const PatientHistoryTab = ({ patientId, currentVisitId }) => {
  const { t } = useTranslation();
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await axiosInstance.get(`/patients/${patientId}/history`);
        const patient = response.data || {};
        setVisits(
          (patient.visits || []).filter(
            (v) => v.id !== currentVisitId && !["cancelled", "scheduled"].includes(v.status),
          ),
        );
      } catch {
        toast.error(t("patientHistory.fetchError"));
      } finally {
        setLoading(false);
      }
    };
    if (patientId) fetchHistory();
  }, [patientId, currentVisitId, t]);

  if (loading) {
    return <div className="text-center py-8">{t("patientHistory.loading")}</div>;
  }

  if (visits.length === 0) {
    return <div className="text-center py-8 text-gray-500">{t("patientHistory.empty")}</div>;
  }

  return (
    <div className="space-y-4">
      {visits.map((visit) => {
        const diagnosis = toList(visit.diagnosis);
        const symptoms = toList(visit.symptoms);
        const meds = visit.prescriptions || [];
        const tests = visit.investigations || [];
        const vitals = [
          visit.temperature != null && `${label(t("vitalSigns.temperatureLabel"))}: ${visit.temperature}`,
          (visit.bloodPressureSystolic != null || visit.bloodPressureDiastolic != null) &&
            `${label(t("vitalSigns.bloodPressureLabel"))}: ${visit.bloodPressureSystolic ?? "—"}/${visit.bloodPressureDiastolic ?? "—"}`,
          visit.heartRate != null && `${label(t("vitalSigns.heartRateLabel"))}: ${visit.heartRate}`,
          visit.respiratoryRate != null && `${label(t("vitalSigns.respiratoryRateLabel"))}: ${visit.respiratoryRate}`,
          visit.oxygenSaturation != null && `${label(t("vitalSigns.oxygenSaturationLabel"))}: ${visit.oxygenSaturation}`,
          visit.weight != null && `${label(t("vitalSigns.weightLabel"))}: ${visit.weight}`,
          visit.height != null && `${label(t("vitalSigns.heightLabel"))}: ${visit.height}`,
          visit.bmi != null && `BMI: ${Number(visit.bmi).toFixed(1)}`,
        ].filter(Boolean);

        return (
          <div key={visit.id} className="border border-gray-200 dark:border-white/10 rounded-lg p-4">
            <div className="flex items-start justify-between mb-3 gap-3">
              <div>
                <p className="font-semibold text-gray-800 dark:text-white">
                  {fmtDate(visit.visitDate)} · {t("patientHistory.visitNumberPrefix")}
                  {visit.visitNumber}
                </p>
                {visit.doctor && (
                  <p className="text-sm text-gray-500 dark:text-white/60">
                    {t("common.doctorPrefix")} {visit.doctor.firstName} {visit.doctor.lastName}
                  </p>
                )}
              </div>
            </div>

            <Field title={label(t("consultation.chiefComplaintLabel"))}>{visit.chiefComplaint}</Field>
            <Field title={t("consultation.symptomsLabel")}>{symptoms.join(", ")}</Field>

            {vitals.length > 0 && (
              <Field title={t("vitalSigns.title")}>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {vitals.map((v) => (
                    <span key={v} className="px-2 py-0.5 rounded-full text-xs bg-sky-50 text-sky-800 dark:bg-sky-500/15 dark:text-sky-200">
                      {v}
                    </span>
                  ))}
                </div>
              </Field>
            )}

            <Field title={t("consultation.historyOfPresentIllnessLabel")}>{visit.historyOfPresentIllness}</Field>
            <Field title={t("consultation.physicalExaminationLabel")}>{visit.physicalExamination}</Field>
            <Field title={label(t("patientHistory.diagnosisLabel"))}>{diagnosis.join(", ")}</Field>
            <Field title={label(t("patientHistory.treatmentLabel"))}>{visit.treatmentPlan}</Field>
            <Field title={t("consultation.doctorNotesLabel")}>{visit.doctorNotes}</Field>
            <Field title={t("consultation.followUpDateLabel")}>
              {visit.followUpDate ? fmtDate(visit.followUpDate) : null}
            </Field>

            <div className="mt-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-white/50 mb-1">
                {t("herbalMedicine.listTitle")}
              </p>
              {meds.length === 0 ? (
                <p className="text-sm text-gray-500">{t("herbalMedicine.emptyList")}</p>
              ) : (
                <ul className="space-y-2">
                  {meds.map((rx) => (
                    <li key={rx.id} className="text-sm rounded-md bg-gray-50 dark:bg-white/5 px-3 py-2">
                      <div className="flex justify-between gap-2">
                        <span className="font-medium text-gray-800 dark:text-white">
                          {rx.medicine?.name || t("prescription.medicineFallback")}
                          {rx.medicine?.strength ? ` (${rx.medicine.strength})` : ""} × {rx.quantity}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-white/60">
                          {t(`prescription.status.${rx.status}`, rx.status)}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-white/60">
                        {[rx.dosage, rx.frequency, rx.duration].filter(Boolean).join(" · ")}
                        {rx.totalAmount != null ? ` · ${money(rx.totalAmount)}` : ""}
                        {rx.dispensedDate ? ` · ${t("pharmacy.status.dispensed")} ${fmtDate(rx.dispensedDate)}` : ""}
                      </div>
                      {rx.instructions && (
                        <div className="text-xs italic text-gray-500 dark:text-white/60">{rx.instructions}</div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {tests.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-white/50 mb-1">
                  {t("doctorQueue.tabs.investigation")}
                </p>
                <ul className="space-y-2">
                  {tests.map((inv) => (
                    <li key={inv.id} className="text-sm rounded-md bg-gray-50 dark:bg-white/5 px-3 py-2">
                      <div className="flex justify-between gap-2">
                        <span className="font-medium text-gray-800 dark:text-white">
                          {inv.testName} · {inv.investigationType}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-white/60">
                          {t(`investigation.status.${inv.status === "in_progress" ? "inProgress" : inv.status}`)}
                        </span>
                      </div>
                      {inv.results && (
                        <div className="text-xs text-gray-600 dark:text-white/70">
                          {t("laboratory.detail.results")} {inv.results}
                        </div>
                      )}
                      {inv.interpretation && (
                        <div className="text-xs text-gray-600 dark:text-white/70">
                          {t("laboratory.detail.interpretation")} {inv.interpretation}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {(visit.payments || []).map((pay) => (
              <p key={pay.id} className="mt-3 text-xs text-gray-500 dark:text-white/60">
                {t("common.paymentNumber")} {pay.paymentNumber} · {money(pay.amount)} · {pay.paymentMethod} ·{" "}
                {fmtDate(pay.paidAt)}
              </p>
            ))}
          </div>
        );
      })}
    </div>
  );
};

export default PatientHistoryTab;
