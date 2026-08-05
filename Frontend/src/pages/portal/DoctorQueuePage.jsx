import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useReactToPrint } from "react-to-print";
import {
  FiUser,
  FiClock,
  FiFileText,
  FiActivity,
  FiHeart,
  FiAlertCircle,
  FiCheckCircle,
  FiX,
  FiPlus,
  FiSave,
  FiChevronLeft,
  FiChevronRight,
  FiUsers,
  FiPrinter,
} from "react-icons/fi";
import toast from "react-hot-toast";
import axiosInstance from "../../lib/axios";
import { getSocket } from "../../lib/socket";
import { useQueue } from "../../hooks/useVisits";
import useAuthStore from "../../store/authStore";
import HerbalMedicineForm from "../../components/doctor/HerbalMedicineForm";
import FollowUpIndicator from "../../components/doctor/FollowUpIndicator";
import ActivePrescriptions from "../../components/doctor/ActivePrescriptions";
import PendingInvestigations from "../../components/doctor/PendingInvestigations";
import ConsultationTab from "../../components/doctor/ConsultationTab";
import PatientHistoryTab from "../../components/doctor/PatientHistoryTab";
import PatientRecordSidebar from "../../components/doctor/PatientRecordSidebar";
import PrintablePrescriptionSlip from "../../components/doctor/PrintablePrescriptionSlip";

const addPatientToRecent = (patient) => {
  if (!patient) return;
  const saved = localStorage.getItem("recentPatients");
  let patients = [];
  try {
    patients = saved ? JSON.parse(saved) : [];
  } catch {
    patients = [];
  }
  const filtered = patients.filter((p) => p.id !== patient.id);
  filtered.unshift({
    id: patient.id,
    patientId: patient.patientId,
    firstName: patient.firstName,
    lastName: patient.lastName,
  });
  localStorage.setItem("recentPatients", JSON.stringify(filtered));
  window.dispatchEvent(new Event("recentPatientsUpdated"));
};

const DoctorQueuePage = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [activeTab, setActiveTab] = useState("consultation");
  const [showMobileConsultation, setShowMobileConsultation] = useState(false);
  const [isRecordSidebarOpen, setIsRecordSidebarOpen] = useState(false);

  // Consultation data
  const [consultationData, setConsultationData] = useState({
    chiefComplaint: "",
    symptoms: [],
    historyOfPresentIllness: "",
    pastHistory: "",
    physicalExamination: "",
    diagnosis: [],
    treatmentPlan: "",
    doctorNotes: "",
    followUpDate: "",
  });

  const qc = useQueryClient();
  const { user } = useAuthStore();
  const { data: queue = [], isLoading } = useQueue();
  const refreshQueue = () => qc.invalidateQueries({ queryKey: ["queue"] });

  // Printable herbal prescription slip
  const [printPayload, setPrintPayload] = useState(null);
  const [printLoading, setPrintLoading] = useState(false);
  const printRef = useRef(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: printPayload?.patient
      ? `${printPayload.patient.firstName}-${printPayload.patient.lastName}-Rx`
      : "Prescription",
    onAfterPrint: () => setPrintPayload(null),
  });

  useEffect(() => {
    if (printPayload) handlePrint();
  }, [printPayload, handlePrint]);

  const handlePrintPrescription = async (visit) => {
    if (!visit) return;
    setPrintLoading(true);
    try {
      const response = await axiosInstance.get("/prescriptions", {
        params: { visitId: visit.id, pageSize: 100 },
      });
      const prescriptions = response.data?.data || response.data || [];
      if (prescriptions.length === 0) {
        toast.error(t("doctorQueue.consultation.printNoPrescriptions"));
        return;
      }
      setPrintPayload({ visit, patient: visit.patient, doctor: user, prescriptions });
    } catch {
      toast.error(t("doctorQueue.consultation.printError"));
    } finally {
      setPrintLoading(false);
    }
  };

  // Real-time: invalidate queue on socket events
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const invalidate = refreshQueue;
    socket.on("queue:updated", invalidate);
    socket.on("visit:status-changed", invalidate);
    return () => {
      socket.off("queue:updated", invalidate);
      socket.off("visit:status-changed", invalidate);
    };
  }, [qc]);

  // Auto-start consultation if visitId is in URL
  useEffect(() => {
    const visitId = searchParams.get("visitId");
    if (visitId && queue.length > 0) {
      const visit = queue.find((v) => v.id === visitId);
      if (visit) {
        handleStartConsultation(visit);
      }
    }
  }, [queue, searchParams]);

  const handleStartConsultation = async (visit) => {
    // Save patient to recent list
    if (visit.patient) {
      addPatientToRecent(visit.patient);
    }

    if (visit.status === "in_consultation") {
      setSelectedVisit(visit);
      setShowMobileConsultation(true);
      return;
    }

    try {
      await axiosInstance.put(`/visits/${visit.id}`, {
        status: "in_consultation",
        consultationStartTime: new Date().toLocaleTimeString("en-GB", {
          hour12: false,
        }),
      });

      setSelectedVisit(visit);
      setShowMobileConsultation(true);
      toast.success(
        "Consultation started — patient stays in queue until saved",
      );
      refreshQueue();
    } catch {
      toast.error("Failed to start consultation");
    }
  };

  const handleSaveConsultation = async () => {
    if (!selectedVisit) return;

    try {
      await axiosInstance.put(`/visits/${selectedVisit.id}`, {
        ...consultationData,
        consultationEndTime: new Date().toLocaleTimeString("en-GB", {
          hour12: false,
        }),
      });

      toast.success("Consultation details saved");
      refreshQueue();
    } catch {
      toast.error("Failed to save consultation");
    }
  };

  const handleCompleteConsultation = async () => {
    if (!selectedVisit) return;

    try {
      const prescriptionsResponse = await axiosInstance.get("/prescriptions", {
        params: { visitId: selectedVisit.id, status: "pending" },
      });

      const pendingPrescriptions = prescriptionsResponse.data || [];
      const hasPendingPrescriptions = pendingPrescriptions.length > 0;

      const nextStatus = hasPendingPrescriptions
        ? "pending_payment"
        : "completed";

      await axiosInstance.put(`/visits/${selectedVisit.id}`, {
        ...consultationData,
        status: nextStatus,
        consultationEndTime: new Date().toLocaleTimeString("en-GB", {
          hour12: false,
        }),
      });

      if (hasPendingPrescriptions) {
        toast.success("Consultation sent to Cashier for payment");
      } else {
        toast.success("Consultation completed successfully");
      }

      setSelectedVisit(null);
      setShowMobileConsultation(false);
      setConsultationData({
        chiefComplaint: "",
        symptoms: [],
        historyOfPresentIllness: "",
        pastHistory: "",
        physicalExamination: "",
        diagnosis: [],
        treatmentPlan: "",
        doctorNotes: "",
        followUpDate: "",
      });
      refreshQueue();
    } catch {
      toast.error("Failed to complete consultation");
    }
  };

  const handleDeselectVisit = () => {
    setSelectedVisit(null);
    setShowMobileConsultation(false);
    setConsultationData({
      chiefComplaint: "",
      symptoms: [],
      historyOfPresentIllness: "",
      pastHistory: "",
      physicalExamination: "",
      diagnosis: [],
      treatmentPlan: "",
      doctorNotes: "",
      followUpDate: "",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  // ==================== MOBILE VIEW ====================
  // On mobile, show either the queue or the consultation (not both)
  const isMobile = typeof window !== "undefined" && window.innerWidth < 1024;

  if (isMobile && showMobileConsultation && selectedVisit) {
    return (
      <div className="h-full">
        {/* Mobile back button */}
        <button
          onClick={handleDeselectVisit}
          className="flex items-center space-x-2 mb-4 px-3 py-2 bg-gray-100 rounded-lg text-gray-700 hover:bg-gray-200 transition"
        >
          <FiChevronLeft />
          <span>{t("doctorQueue.backToQueue")}</span>
        </button>
        <ConsultationPanel
          selectedVisit={selectedVisit}
          consultationData={consultationData}
          setConsultationData={setConsultationData}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onSave={handleSaveConsultation}
          onComplete={handleCompleteConsultation}
          onBack={handleDeselectVisit}
          refreshQueue={refreshQueue}
          onOpenSidebar={() => setIsRecordSidebarOpen(true)}
          onPrintPrescription={handlePrintPrescription}
          printLoading={printLoading}
        />
        <div style={{ display: "none" }}>
          <PrintablePrescriptionSlip
            ref={printRef}
            visit={printPayload?.visit}
            patient={printPayload?.patient}
            doctor={printPayload?.doctor}
            prescriptions={printPayload?.prescriptions || []}
          />
        </div>
      </div>
    );
  }

  // ==================== DESKTOP VIEW — SPLIT LAYOUT ====================
  return (
    <div className="flex gap-6 h-full">
      {/* LEFT PANEL — Queue */}
      <div
        className={`${
          selectedVisit ? "w-2/5" : "w-full"
        } overflow-y-auto transition-all duration-300`}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              {t("doctorQueue.title")}
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {queue.length} {t("doctorQueue.queueStats.patients")}{" "}
              {queue.filter((v) => v.status === "in_consultation").length > 0
                ? `· ${
                    queue.filter((v) => v.status === "in_consultation").length
                  } ${t("doctorQueue.queueStats.inConsultation")}`
                : ""}
            </p>
          </div>
          <button
            onClick={refreshQueue}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition text-sm"
          >
            {t("doctorQueue.refreshQueue")}
          </button>
        </div>

        {queue.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm shadow-slate-200/60 p-12 text-center">
            <FiCheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">
              {t("doctorQueue.empty.title")}
            </p>
            <p className="text-gray-400 text-sm mt-1">
              {t("doctorQueue.empty.subtitle")}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {queue.map((visit, index) => {
              const isSelected = selectedVisit?.id === visit.id;
              const isInConsultation = visit.status === "in_consultation";
              const isConsultingOthers =
                selectedVisit && !isSelected && isInConsultation;

              return (
                <div
                  key={visit.id}
                  className={`bg-white rounded-2xl shadow-sm shadow-slate-200/60 p-4 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer border-2 ${
                    isSelected
                      ? "border-emerald-500 bg-emerald-50"
                      : "border-transparent"
                  }`}
                  onClick={() => handleStartConsultation(visit)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1 min-w-0">
                      {/* Queue Number */}
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                          isSelected
                            ? "bg-gradient-to-br from-emerald-600 to-teal-600"
                            : isInConsultation
                              ? "bg-blue-500"
                              : "bg-gray-200"
                        }`}
                      >
                        <span
                          className={`text-lg font-bold ${
                            isSelected || isInConsultation
                              ? "text-white"
                              : "text-gray-600"
                          }`}
                        >
                          {index + 1}
                        </span>
                      </div>

                      {/* Patient Info */}
                      <div className="flex-1 min-w-0">
                        <h3
                          className={`font-semibold truncate ${
                            isSelected ? "text-emerald-800" : "text-gray-800"
                          }`}
                        >
                          {visit.patient?.firstName} {visit.patient?.lastName}
                        </h3>
                        <div className="flex items-center space-x-3 text-xs text-gray-500 mt-0.5">
                          <span className="flex items-center space-x-1">
                            <FiUser className="w-3 h-3" />
                            <span>
                              {visit.patient?.age}y · {visit.patient?.gender}
                            </span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <FiClock className="w-3 h-3" />
                            <span>{visit.arrivalTime}</span>
                          </span>
                        </div>
                        {visit.chiefComplaint && (
                          <p className="mt-1 text-xs text-gray-600 truncate">
                            <span className="font-medium">
                              {t("doctorQueue.queue.chiefComplaintPrefix")}
                            </span>{" "}
                            {visit.chiefComplaint}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Status + Action */}
                    <div className="flex items-center space-x-2 flex-shrink-0 ml-3">
                      {isInConsultation && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full whitespace-nowrap">
                          {isConsultingOthers
                            ? t("doctorQueue.status.withAnotherDoctor")
                            : isSelected
                              ? t("doctorQueue.status.active")
                              : t("doctorQueue.status.inProgress")}
                        </span>
                      )}
                      <button
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                          isSelected
                            ? "bg-emerald-600 text-white"
                            : isInConsultation && !isConsultingOthers
                              ? "bg-blue-600 text-white hover:bg-blue-700"
                              : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                        }`}
                      >
                        {isSelected
                          ? t("doctorQueue.actions.consulting")
                          : isInConsultation && !isConsultingOthers
                            ? t("doctorQueue.actions.continue")
                            : t("doctorQueue.actions.start")}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* RIGHT PANEL — Consultation */}
      {selectedVisit && (
        <div className="w-3/5 overflow-y-auto border-l border-gray-200 pl-6">
          <ConsultationPanel
            selectedVisit={selectedVisit}
            consultationData={consultationData}
            setConsultationData={setConsultationData}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onSave={handleSaveConsultation}
            onComplete={handleCompleteConsultation}
            onBack={handleDeselectVisit}
            refreshQueue={refreshQueue}
            onOpenSidebar={() => setIsRecordSidebarOpen(true)}
            onPrintPrescription={handlePrintPrescription}
            printLoading={printLoading}
          />
          <PatientRecordSidebar
            isOpen={isRecordSidebarOpen}
            onClose={() => setIsRecordSidebarOpen(false)}
            patientId={selectedVisit.patient?.id}
            visitId={selectedVisit.id}
          />
        </div>
      )}

      {/* Empty state when no patient selected */}
      {!selectedVisit && queue.length > 0 && (
        <div className="hidden lg:flex w-3/5 items-center justify-center border-l border-gray-200 pl-6">
          <div className="text-center text-gray-400">
            <FiUsers className="w-20 h-20 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">
              {t("doctorQueue.rightPanel.selectPatient")}
            </p>
            <p className="text-sm mt-1">
              {t("doctorQueue.rightPanel.selectPatientHint")}
            </p>
          </div>
        </div>
      )}

      <div style={{ display: "none" }}>
        <PrintablePrescriptionSlip
          ref={printRef}
          visit={printPayload?.visit}
          patient={printPayload?.patient}
          doctor={printPayload?.doctor}
          prescriptions={printPayload?.prescriptions || []}
        />
      </div>
    </div>
  );
};

// ==================== Consultation Panel (shared by mobile + desktop) ====================
const ConsultationPanel = ({
  selectedVisit,
  consultationData,
  setConsultationData,
  activeTab,
  setActiveTab,
  onSave,
  onComplete,
  onBack,
  refreshQueue,
  onOpenSidebar,
  onPrintPrescription,
  printLoading,
}) => {
  const { t } = useTranslation();

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {t("doctorQueue.consultation.title")}
          </h1>
          <p className="text-gray-600 text-sm mt-0.5">
            {selectedVisit.patient?.firstName} {selectedVisit.patient?.lastName}{" "}
            • {t("common.visitNumber")} {selectedVisit.visitNumber}
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={onOpenSidebar}
            className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition text-sm font-semibold shadow-sm"
          >
            <FiFileText className="w-4 h-4" />
            <span>Patient File Drawer</span>
          </button>
          <button
            onClick={() => onPrintPrescription?.(selectedVisit)}
            disabled={printLoading}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm disabled:opacity-50"
          >
            <FiPrinter />
            <span>{t("doctorQueue.consultation.printPrescription")}</span>
          </button>
          <button
            onClick={onSave}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
          >
            <FiSave />
            <span>{t("doctorQueue.consultation.saveProgress")}</span>
          </button>
          <button
            onClick={onBack}
            className="flex items-center space-x-2 px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition text-sm"
          >
            <FiX />
          </button>
        </div>
      </div>

      {/* Patient Info Card */}
      <div className="bg-white rounded-2xl shadow-sm shadow-slate-200/60 p-4 mb-4">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">
          {t("doctorQueue.consultation.patientInfo")}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div>
            <p className="text-xs text-gray-500">{t("common.patientId")}</p>
            <p className="font-medium text-gray-800">
              {selectedVisit.patient?.patientId}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">
              {t("doctorQueue.consultation.ageGender")}
            </p>
            <p className="font-medium text-gray-800">
              {selectedVisit.patient?.age}y · {selectedVisit.patient?.gender}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">
              {t("doctorQueue.consultation.bloodGroup")}
            </p>
            <p className="font-medium text-gray-800">
              {selectedVisit.patient?.bloodGroup || t("common.notAvailable")}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">{t("common.phone")}</p>
            <p className="font-medium text-gray-800">
              {selectedVisit.patient?.phone}
            </p>
          </div>
        </div>

        {(selectedVisit.patient?.knownAllergies?.length > 0 ||
          selectedVisit.patient?.chronicDiseases?.length > 0) && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <FiAlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
              <div className="flex-1 text-sm">
                {selectedVisit.patient?.knownAllergies?.length > 0 && (
                  <div className="mb-1">
                    <span className="font-semibold text-red-800">
                      {t("doctorQueue.consultation.allergies")}{" "}
                    </span>
                    <span className="text-red-700">
                      {selectedVisit.patient.knownAllergies.join(", ")}
                    </span>
                  </div>
                )}
                {selectedVisit.patient?.chronicDiseases?.length > 0 && (
                  <div>
                    <span className="font-semibold text-red-800">
                      {t("doctorQueue.consultation.chronic")}{" "}
                    </span>
                    <span className="text-red-700">
                      {selectedVisit.patient.chronicDiseases.join(", ")}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Follow-up Indicator */}
      <div className="mb-4">
        <FollowUpIndicator
          patientId={selectedVisit.patient?.id}
          currentVisitDate={selectedVisit.visitDate}
        />
      </div>

      {/* Active Prescriptions & Pending Investigations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <ActivePrescriptions patientId={selectedVisit.patient?.id} />
        <PendingInvestigations patientId={selectedVisit.patient?.id} />
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-sm shadow-slate-200/60 mb-4">
        <div className="border-b border-gray-200 overflow-x-auto">
          <nav className="flex space-x-1 px-4 min-w-max">
            {[
              {
                key: "consultation",
                label: t("doctorQueue.tabs.consultation"),
              },
              { key: "medicine", label: t("doctorQueue.tabs.herbalMedicine") },
              { key: "history", label: t("doctorQueue.tabs.history") },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`py-3 px-3 border-b-2 font-medium text-sm transition whitespace-nowrap ${
                  activeTab === tab.key
                    ? "border-emerald-600 text-emerald-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-4">
          {activeTab === "consultation" && (
            <ConsultationTab
              data={consultationData}
              onChange={setConsultationData}
            />
          )}
          {activeTab === "medicine" && (
            <HerbalMedicineForm
              visitId={selectedVisit.id}
              patientId={selectedVisit.patient?.id}
              onSave={refreshQueue}
            />
          )}
          {activeTab === "history" && (
            <PatientHistoryTab patientId={selectedVisit.patient?.id} />
          )}
        </div>
      </div>

      {/* Diagnosis summary + Complete button */}
      <div className="bg-white rounded-2xl shadow-sm shadow-slate-200/60 p-4 border-t-2 border-emerald-100">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          {/* Diagnosis summary */}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
              {t("doctorQueue.consultation.diagnosisTitle")}
            </p>
            {consultationData.diagnosis.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {consultationData.diagnosis.map((d, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center px-2.5 py-1 bg-red-50 text-red-700 rounded-full text-sm font-medium"
                  >
                    {d}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">
                {t("doctorQueue.consultation.noDiagnosis")}
              </p>
            )}
          </div>

          {/* Complete button */}
          <button
            onClick={onComplete}
            className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 hover:-translate-y-0.5 font-medium shadow-md text-center"
          >
            {t("doctorQueue.consultation.completeConsultation")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DoctorQueuePage;
