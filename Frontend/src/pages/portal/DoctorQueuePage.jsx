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
      console.log("🔍 Fetching queue with params:", {
        status: "waiting",
        sortBy: "arrivalTime",
        sortOrder: "ASC",
      });

      const response = await axiosInstance.get("/visits", {
        params: {
          status: "waiting",
          sortBy: "arrivalTime",
          sortOrder: "ASC",
        },
      });

      console.log("📦 Raw API response:", response);
      console.log("📋 Response data structure:", {
        hasData: !!response.data,
        hasVisits: !!response.data?.visits,
        visitCount: response.data?.visits?.length || 0,
        visits: response.data?.visits || response.data || [],
      });

      // Handle both response.data.visits and response.data directly
      const visits = response.data?.visits || response.data || [];
      console.log("✅ Setting queue with visits:", visits);
      setQueue(visits);
    } catch (error) {
      console.error("❌ Queue fetch error:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);
      toast.error(
        "Failed to fetch queue: " +
          (error.response?.data?.message || error.message),
      );
      setQueue([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStartConsultation = async (visit) => {
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
      await axiosInstance.put(`/visits/${selectedVisit.id}`, {
        ...consultationData,
        status: "completed",
        consultationEndTime: new Date().toLocaleTimeString("en-GB", {
          hour12: false,
        }),
      });

      toast.success("Consultation completed successfully");
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

                {/* Action Button */}
                <button
                  onClick={() => handleStartConsultation(visit)}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:from-emerald-700 hover:to-teal-700 transition font-medium"
                >
                  Start Consultation
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Consultation Tab Component
const ConsultationTab = ({ data, onChange, onComplete }) => {
  const [newSymptom, setNewSymptom] = useState("");
  const [newDiagnosis, setNewDiagnosis] = useState("");

  const handleAddSymptom = () => {
    if (newSymptom.trim()) {
      onChange({
        ...data,
        symptoms: [...data.symptoms, newSymptom.trim()],
      });
      setNewSymptom("");
    }
  };

  const handleRemoveSymptom = (index) => {
    onChange({
      ...data,
      symptoms: data.symptoms.filter((_, i) => i !== index),
    });
  };

  const handleAddDiagnosis = () => {
    if (newDiagnosis.trim()) {
      onChange({
        ...data,
        diagnosis: [...data.diagnosis, newDiagnosis.trim()],
      });
      setNewDiagnosis("");
    }
  };

  const handleRemoveDiagnosis = (index) => {
    onChange({
      ...data,
      diagnosis: data.diagnosis.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="space-y-6">
      {/* Chief Complaint */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Chief Complaint *
        </label>
        <textarea
          value={data.chiefComplaint}
          onChange={(e) =>
            onChange({ ...data, chiefComplaint: e.target.value })
          }
          rows={2}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          placeholder="Main reason for visit..."
        />
      </div>

      {/* Symptoms */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Symptoms
        </label>
        <div className="flex space-x-2 mb-2">
          <input
            type="text"
            value={newSymptom}
            onChange={(e) => setNewSymptom(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleAddSymptom()}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            placeholder="Add symptom..."
          />
          <button
            onClick={handleAddSymptom}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            <FiPlus />
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {data.symptoms.map((symptom, index) => (
            <span
              key={index}
              className="inline-flex items-center space-x-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
            >
              <span>{symptom}</span>
              <button
                onClick={() => handleRemoveSymptom(index)}
                className="hover:text-blue-600"
              >
                <FiX className="w-4 h-4" />
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* History of Present Illness */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          History of Present Illness
        </label>
        <textarea
          value={data.historyOfPresentIllness}
          onChange={(e) =>
            onChange({ ...data, historyOfPresentIllness: e.target.value })
          }
          rows={3}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          placeholder="Detailed history of the current condition..."
        />
      </div>

      {/* Physical Examination */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Physical Examination
        </label>
        <textarea
          value={data.physicalExamination}
          onChange={(e) =>
            onChange({ ...data, physicalExamination: e.target.value })
          }
          rows={3}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          placeholder="Physical examination findings..."
        />
      </div>

      {/* Diagnosis */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Diagnosis *
        </label>
        <div className="flex space-x-2 mb-2">
          <input
            type="text"
            value={newDiagnosis}
            onChange={(e) => setNewDiagnosis(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleAddDiagnosis()}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            placeholder="Add diagnosis..."
          />
          <button
            onClick={handleAddDiagnosis}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            <FiPlus />
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {data.diagnosis.map((diag, index) => (
            <span
              key={index}
              className="inline-flex items-center space-x-2 px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm"
            >
              <span>{diag}</span>
              <button
                onClick={() => handleRemoveDiagnosis(index)}
                className="hover:text-red-600"
              >
                <FiX className="w-4 h-4" />
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Treatment Plan */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Treatment Plan
        </label>
        <textarea
          value={data.treatmentPlan}
          onChange={(e) => onChange({ ...data, treatmentPlan: e.target.value })}
          rows={3}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          placeholder="Treatment plan and recommendations..."
        />
      </div>

      {/* Doctor Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Doctor's Notes
        </label>
        <textarea
          value={data.doctorNotes}
          onChange={(e) => onChange({ ...data, doctorNotes: e.target.value })}
          rows={3}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          placeholder="Additional notes..."
        />
      </div>

      {/* Follow-up Date */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Follow-up Date
        </label>
        <input
          type="date"
          value={data.followUpDate}
          onChange={(e) => onChange({ ...data, followUpDate: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        />
      </div>

      {/* Complete Button */}
      <div className="flex justify-end space-x-3 pt-4 border-t">
        <button
          onClick={onComplete}
          className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:from-emerald-700 hover:to-teal-700 transition font-medium"
        >
          Complete Consultation
        </button>
      </div>
    </div>
  );
};

// Patient History Tab
const PatientHistoryTab = ({ patientId }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, [patientId]);

  const fetchHistory = async () => {
    try {
      const response = await axiosInstance.get(`/visits`, {
        params: {
          patientId,
          status: "completed",
          sortBy: "visitDate",
          sortOrder: "DESC",
        },
      });
      setHistory(response.data.visits || []);
    } catch (error) {
      toast.error("Failed to fetch patient history");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading history...</div>;
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No previous visits found
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {history.map((visit) => (
        <div key={visit.id} className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-semibold text-gray-800">
                Visit #{visit.visitNumber}
              </p>
              <p className="text-sm text-gray-500">
                {new Date(visit.visitDate).toLocaleDateString()} •{" "}
                {visit.doctor?.firstName} {visit.doctor?.lastName}
              </p>
            </div>
          </div>
          {visit.diagnosis && (
            <div className="mb-2">
              <p className="text-sm font-medium text-gray-700">Diagnosis:</p>
              <p className="text-sm text-gray-600">
                {Array.isArray(visit.diagnosis)
                  ? visit.diagnosis.join(", ")
                  : visit.diagnosis}
              </p>
            </div>
          )}
          {visit.treatmentPlan && (
            <div>
              <p className="text-sm font-medium text-gray-700">Treatment:</p>
              <p className="text-sm text-gray-600">{visit.treatmentPlan}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default DoctorQueuePage;
