import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
} from "react-icons/fi";
import toast from "react-hot-toast";
import axiosInstance from "../../lib/axios";
import useAuthStore from "../../store/authStore";
import HerbalMedicineForm from "../../components/doctor/HerbalMedicineForm";
import VitalSignsForm from "../../components/doctor/VitalSignsForm";
import InvestigationForm from "../../components/doctor/InvestigationForm";
import FollowUpIndicator from "../../components/doctor/FollowUpIndicator";
import ActivePrescriptions from "../../components/doctor/ActivePrescriptions";
import PendingInvestigations from "../../components/doctor/PendingInvestigations";
import ConsultationTab from "../../components/doctor/ConsultationTab";
import PatientHistoryTab from "../../components/doctor/PatientHistoryTab";

const DoctorQueuePage = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [queue, setQueue] = useState([]);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("consultation");
  const [showMedicineForm, setShowMedicineForm] = useState(false);

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

  useEffect(() => {
    fetchQueue();
  }, []);

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

  const fetchQueue = async () => {
    try {
      // Fetch both waiting and in_consultation
      const response = await axiosInstance.get("/visits/doctor/queue");
      const visits = response.data.data || response.data || [];
      setQueue(visits);
    } catch (error) {
      toast.error("Failed to fetch queue");
      setQueue([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStartConsultation = async (visit) => {
    if (visit.status === "in_consultation") {
      setSelectedVisit(visit);
      return;
    }

    try {
      // Update visit status to in_consultation
      await axiosInstance.put(`/visits/${visit.id}`, {
        status: "in_consultation",
        consultationStartTime: new Date().toLocaleTimeString("en-GB", {
          hour12: false,
        }),
      });

      setSelectedVisit(visit);
      toast.success("Consultation started");
      fetchQueue();
    } catch (error) {
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
    } catch (error) {
      toast.error("Failed to save consultation");
    }
  };

  const handleCompleteConsultation = async () => {
    if (!selectedVisit) return;

    if (!consultationData.diagnosis.length) {
      toast.error("Please add at least one diagnosis");
      return;
    }

    try {
      // Check if there are any prescriptions for this visit
      const prescriptionsResponse = await axiosInstance.get("/prescriptions", {
        params: { visitId: selectedVisit.id, status: "pending" },
      });

      const hasPendingPrescriptions =
        prescriptionsResponse.data.prescriptions?.length > 0;

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
      fetchQueue();
    } catch (error) {
      toast.error("Failed to complete consultation");
    }
  };

  const handleCancelConsultation = () => {
    setSelectedVisit(null);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  // Show consultation view if a visit is selected
  if (selectedVisit) {
    return (
      <div className="h-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Consultation</h1>
            <p className="text-gray-600 mt-1">
              Patient: {selectedVisit.patient?.firstName}{" "}
              {selectedVisit.patient?.lastName} • Visit #{" "}
              {selectedVisit.visitNumber}
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleSaveConsultation}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <FiSave />
              <span>Save Progress</span>
            </button>
            <button
              onClick={handleCancelConsultation}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
            >
              <FiX />
              <span>Cancel</span>
            </button>
          </div>
        </div>

        {/* Patient Info Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Patient Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-500">Patient ID</p>
              <p className="font-medium text-gray-800">
                {selectedVisit.patient?.patientId}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Age / Gender</p>
              <p className="font-medium text-gray-800">
                {selectedVisit.patient?.age} years •{" "}
                {selectedVisit.patient?.gender}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Blood Group</p>
              <p className="font-medium text-gray-800">
                {selectedVisit.patient?.bloodGroup || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <p className="font-medium text-gray-800">
                {selectedVisit.patient?.phone}
              </p>
            </div>
          </div>

          {/* Allergies & Chronic Diseases Alert */}
          {(selectedVisit.patient?.knownAllergies?.length > 0 ||
            selectedVisit.patient?.chronicDiseases?.length > 0) && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <FiAlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <div className="flex-1">
                  {selectedVisit.patient?.knownAllergies?.length > 0 && (
                    <div className="mb-2">
                      <p className="font-semibold text-red-800">Allergies:</p>
                      <p className="text-sm text-red-700">
                        {selectedVisit.patient.knownAllergies.join(", ")}
                      </p>
                    </div>
                  )}
                  {selectedVisit.patient?.chronicDiseases?.length > 0 && (
                    <div>
                      <p className="font-semibold text-red-800">
                        Chronic Diseases:
                      </p>
                      <p className="text-sm text-red-700">
                        {selectedVisit.patient.chronicDiseases.join(", ")}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Follow-up Indicator */}
        <div className="mb-6">
          <FollowUpIndicator
            patientId={selectedVisit.patient?.id}
            currentVisitDate={selectedVisit.visitDate}
          />
        </div>

        {/* Active Prescriptions & Pending Investigations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <ActivePrescriptions patientId={selectedVisit.patient?.id} />
          <PendingInvestigations patientId={selectedVisit.patient?.id} />
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-4 px-6">
              <button
                onClick={() => setActiveTab("consultation")}
                className={`py-4 px-2 border-b-2 font-medium transition ${
                  activeTab === "consultation"
                    ? "border-emerald-600 text-emerald-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Consultation
              </button>
              <button
                onClick={() => setActiveTab("vitals")}
                className={`py-4 px-2 border-b-2 font-medium transition ${
                  activeTab === "vitals"
                    ? "border-emerald-600 text-emerald-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Vital Signs
              </button>
              <button
                onClick={() => setActiveTab("investigation")}
                className={`py-4 px-2 border-b-2 font-medium transition ${
                  activeTab === "investigation"
                    ? "border-emerald-600 text-emerald-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Investigation
              </button>
              <button
                onClick={() => setActiveTab("medicine")}
                className={`py-4 px-2 border-b-2 font-medium transition ${
                  activeTab === "medicine"
                    ? "border-emerald-600 text-emerald-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Herbal Medicine
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={`py-4 px-2 border-b-2 font-medium transition ${
                  activeTab === "history"
                    ? "border-emerald-600 text-emerald-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Patient History
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === "consultation" && (
              <ConsultationTab
                data={consultationData}
                onChange={setConsultationData}
                onComplete={handleCompleteConsultation}
              />
            )}
            {activeTab === "vitals" && (
              <VitalSignsForm visitId={selectedVisit.id} onSave={fetchQueue} />
            )}
            {activeTab === "investigation" && (
              <InvestigationForm
                visitId={selectedVisit.id}
                patientId={selectedVisit.patient?.id}
                onSave={fetchQueue}
              />
            )}
            {activeTab === "medicine" && (
              <HerbalMedicineForm
                visitId={selectedVisit.id}
                patientId={selectedVisit.patient?.id}
                onSave={fetchQueue}
              />
            )}
            {activeTab === "history" && (
              <PatientHistoryTab patientId={selectedVisit.patient?.id} />
            )}
          </div>
        </div>
      </div>
    );
  }

  // Show queue list
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Patient Queue</h1>
        <button
          onClick={fetchQueue}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
        >
          Refresh Queue
        </button>
      </div>

      {queue.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <FiCheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No patients waiting</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {queue.map((visit, index) => (
            <div
              key={visit.id}
              className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6 flex-1">
                  {/* Queue Number */}
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-full flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">
                      {index + 1}
                    </span>
                  </div>

                  {/* Patient Info */}
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-800 mb-1">
                      {visit.patient?.firstName} {visit.patient?.lastName}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span className="flex items-center space-x-1">
                        <FiUser className="w-4 h-4" />
                        <span>
                          {visit.patient?.age} years • {visit.patient?.gender}
                        </span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <FiFileText className="w-4 h-4" />
                        <span>{visit.patient?.patientId}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <FiClock className="w-4 h-4" />
                        <span>Arrived: {visit.arrivalTime}</span>
                      </span>
                    </div>
                    {visit.chiefComplaint && (
                      <p className="mt-2 text-sm text-gray-700">
                        <span className="font-medium">Chief Complaint:</span>{" "}
                        {visit.chiefComplaint}
                      </p>
                    )}
                  </div>
                </div>

                {/* Status Badge */}
                {visit.status === "in_consultation" && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full mr-4">
                    In Consultation
                  </span>
                )}

                {/* Action Button */}
                <button
                  onClick={() => handleStartConsultation(visit)}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:from-emerald-700 hover:to-teal-700 transition font-medium"
                >
                  {visit.status === "in_consultation"
                    ? "Continue Consultation"
                    : "Start Consultation"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DoctorQueuePage;
