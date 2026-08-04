import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FiUser,
  FiPhone,
  FiCalendar,
  FiMapPin,
  FiArrowLeft,
  FiPlus,
  FiClock,
  FiHeart,
  FiAlertCircle,
} from "react-icons/fi";
import axiosInstance from "../../lib/axios";
import toast from "react-hot-toast";

const PatientDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPatientDetails();
  }, [id]);

  const fetchPatientDetails = async () => {
    try {
      setLoading(true);
      const [patientRes, historyRes] = await Promise.all([
        axiosInstance.get(`/patients/${id}`),
        axiosInstance.get(`/patients/${id}/history`),
      ]);
      setPatient(patientRes.data.data || patientRes.data);
      setHistory(historyRes.data.data || historyRes.data);
    } catch {
      toast.error("Failed to load patient details");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      waiting: "bg-yellow-100 text-yellow-800",
      in_consultation: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const parseArray = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    try {
      return JSON.parse(value);
    } catch {
      return [];
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 text-lg">Patient not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate("/portal/patients")}
        className="flex items-center space-x-2 text-gray-600 hover:text-emerald-600 transition"
      >
        <FiArrowLeft />
        <span>Back to Patients</span>
      </button>

      {/* Patient Info Card */}
      <div className="bg-white rounded-2xl shadow-sm shadow-slate-200/60 p-6">
        <div className="flex items-start space-x-4 mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
            {patient.firstName?.[0]}
            {patient.lastName?.[0]}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-800">
              {patient.firstName} {patient.middleName} {patient.lastName}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Patient ID: {patient.patientId}
            </p>
            <div className="flex items-center flex-wrap gap-4 mt-3 text-sm text-gray-600">
              <span className="flex items-center">
                <FiUser className="w-4 h-4 mr-1.5" />
                {patient.age}y • {patient.gender}
              </span>
              {patient.bloodGroup && (
                <span className="flex items-center">
                  <FiHeart className="w-4 h-4 mr-1.5 text-red-500" />
                  {patient.bloodGroup}
                </span>
              )}
              <span className="flex items-center">
                <FiPhone className="w-4 h-4 mr-1.5" />
                {patient.phone}
              </span>
              {patient.city && (
                <span className="flex items-center">
                  <FiMapPin className="w-4 h-4 mr-1.5" />
                  {patient.city}
                </span>
              )}
              <span className="flex items-center">
                <FiCalendar className="w-4 h-4 mr-1.5" />
                Reg: {new Date(patient.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
          <button
            onClick={() => navigate(`/portal/visits/new?patientId=${patient.id}`)}
            className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition text-sm flex-shrink-0"
          >
            <FiPlus />
            <span>New Visit</span>
          </button>
        </div>

        {/* Alerts */}
        {(patient.knownAllergies?.length > 0 ||
          patient.chronicDiseases?.length > 0) && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
            <div className="flex items-start space-x-2">
              <FiAlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div className="flex-1 text-sm">
                {patient.knownAllergies?.length > 0 && (
                  <div className="mb-1">
                    <span className="font-semibold text-red-800">
                      Allergies:{" "}
                    </span>
                    <span className="text-red-700">
                      {patient.knownAllergies.join(", ")}
                    </span>
                  </div>
                )}
                {patient.chronicDiseases?.length > 0 && (
                  <div>
                    <span className="font-semibold text-red-800">
                      Chronic:{" "}
                    </span>
                    <span className="text-red-700">
                      {patient.chronicDiseases.join(", ")}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Details Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          {patient.email && (
            <div>
              <p className="text-gray-500">Email</p>
              <p className="font-medium text-gray-800">{patient.email}</p>
            </div>
          )}
          {patient.address && (
            <div>
              <p className="text-gray-500">Address</p>
              <p className="font-medium text-gray-800">{patient.address}</p>
            </div>
          )}
          {patient.occupation && (
            <div>
              <p className="text-gray-500">Occupation</p>
              <p className="font-medium text-gray-800">{patient.occupation}</p>
            </div>
          )}
          {patient.maritalStatus && (
            <div>
              <p className="text-gray-500">Marital Status</p>
              <p className="font-medium text-gray-800">
                {patient.maritalStatus}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Visit History */}
      <div className="bg-white rounded-2xl shadow-sm shadow-slate-200/60 p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">
          Visit History
        </h2>

        {history?.visits?.length > 0 ? (
          <div className="space-y-3">
            {history.visits.map((visit) => (
              <div
                key={visit.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      Visit #{visit.visitNumber}
                    </h3>
                    <div className="flex items-center space-x-3 text-xs text-gray-500 mt-0.5">
                      <span>
                        {new Date(visit.visitDate).toLocaleDateString()}
                      </span>
                      <span>{visit.arrivalTime}</span>
                      {visit.doctor && (
                        <span>
                          Dr. {visit.doctor.firstName} {visit.doctor.lastName}
                        </span>
                      )}
                    </div>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(visit.status)}`}
                  >
                    {visit.status.replace("_", " ")}
                  </span>
                </div>

                {visit.chiefComplaint && (
                  <p className="text-sm text-gray-600 mb-2">
                    <span className="font-medium">Complaint:</span>{" "}
                    {visit.chiefComplaint}
                  </p>
                )}

                {visit.diagnosis && parseArray(visit.diagnosis).length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {parseArray(visit.diagnosis).map((d, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full"
                      >
                        {d}
                      </span>
                    ))}
                  </div>
                )}

                {visit.treatmentPlan && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Treatment:</span>{" "}
                    {visit.treatmentPlan}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <FiClock className="w-12 h-12 mx-auto mb-3" />
            <p>No previous visits</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientDetailPage;
