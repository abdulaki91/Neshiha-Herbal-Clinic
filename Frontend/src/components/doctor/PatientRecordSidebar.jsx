import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  FiX, FiUser, FiCalendar, FiFileText, FiPlus, FiTrash2,
  FiEye, FiSave, FiEdit2, FiUploadCloud, FiClock, FiActivity
} from "react-icons/fi";
import toast from "react-hot-toast";
import {
  usePatient,
  usePatientHistory,
  useUpdatePatient,
  usePatientAttachments,
  useUploadPatientAttachment,
  useDeletePatientAttachment
} from "../../hooks/usePatients";

const getFileUrl = (filePath) => {
  const backendBase = import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace("/api/v1", "")
    : "http://localhost:5000";
  return `${backendBase}/${filePath}`;
};

const PatientRecordSidebar = ({ isOpen, onClose, patientId, visitId }) => {
  const { t } = useTranslation();
  const [activeSubTab, setActiveSubTab] = useState("demographics");
  const [isEditing, setIsEditing] = useState(false);

  // Fetch patient data using React Query hooks
  const { data: patient, refetch: refetchPatient } = usePatient(patientId);
  const { data: history, refetch: refetchHistory } = usePatientHistory(patientId);
  const { data: attachments = [], refetch: refetchAttachments } = usePatientAttachments(patientId);

  // Mutation hooks
  const updatePatient = useUpdatePatient();
  const uploadAttachment = useUploadPatientAttachment();
  const deleteAttachment = useDeletePatientAttachment();

  // Local form states for editing demographics
  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    gender: "",
    dateOfBirth: "",
    phone: "",
    email: "",
    address: "",
    bloodGroup: "",
    maritalStatus: "",
    occupation: "",
    knownAllergies: "",
    chronicDiseases: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
  });

  // Load patient data into edit form
  useEffect(() => {
    if (patient) {
      setFormData({
        firstName: patient.firstName || "",
        middleName: patient.middleName || "",
        lastName: patient.lastName || "",
        gender: patient.gender || "",
        dateOfBirth: patient.dateOfBirth ? patient.dateOfBirth.split("T")[0] : "",
        phone: patient.phone || "",
        email: patient.email || "",
        address: patient.address || "",
        bloodGroup: patient.bloodGroup || "",
        maritalStatus: patient.maritalStatus || "",
        occupation: patient.occupation || "",
        knownAllergies: Array.isArray(patient.knownAllergies)
          ? patient.knownAllergies.join(", ")
          : patient.knownAllergies || "",
        chronicDiseases: Array.isArray(patient.chronicDiseases)
          ? patient.chronicDiseases.join(", ")
          : patient.chronicDiseases || "",
        emergencyContactName: patient.emergencyContactName || "",
        emergencyContactPhone: patient.emergencyContactPhone || "",
      });
    }
  }, [patient, isOpen]);

  if (!isOpen || !patient) return null;

  // Handle Edit Submission
  const handleSave = async (e) => {
    e.preventDefault();
    try {
      // Parse allergies and chronic diseases back into JSON arrays
      const processedAllergies = formData.knownAllergies
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s !== "");
      const processedDiseases = formData.chronicDiseases
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s !== "");

      await updatePatient.mutateAsync({
        id: patientId,
        ...formData,
        knownAllergies: processedAllergies,
        chronicDiseases: processedDiseases,
      });

      toast.success("Patient record updated successfully");
      setIsEditing(false);
      refetchPatient();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update record");
    }
  };

  // Handle File Upload
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const data = new FormData();
    data.append("document", file);
    if (visitId) {
      data.append("visitId", visitId);
    }

    try {
      const uploadPromise = uploadAttachment.mutateAsync({
        id: patientId,
        formData: data,
      });

      await toast.promise(uploadPromise, {
        loading: "Uploading file...",
        success: "File attached successfully",
        error: "Failed to upload file",
      });

      refetchAttachments();
      refetchHistory(); // History might show newly added files
    } catch (err) {
      console.error(err);
    }
  };

  // Handle File Deletion
  const handleDeleteFile = async (attachmentId) => {
    if (!window.confirm("Are you sure you want to delete this file?")) return;

    try {
      await deleteAttachment.mutateAsync({
        id: patientId,
        attachmentId,
      });
      toast.success("File deleted successfully");
      refetchAttachments();
      refetchHistory();
    } catch (err) {
      toast.error("Failed to delete file");
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Container */}
      <div className="fixed inset-y-0 right-0 z-50 w-[480px] bg-slate-50 shadow-2xl flex flex-col h-full border-l border-slate-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-700 to-teal-700 p-5 text-white flex-shrink-0 flex items-center justify-between shadow-md">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <FiUser className="w-5 h-5" />
              <span>Patient File Drawer</span>
            </h2>
            <p className="text-xs text-emerald-100 mt-1">
              ID: {patient.patientId} · Card: {patient.cardNumber}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="bg-white border-b border-slate-200 flex-shrink-0 px-4 py-2 flex space-x-1">
          {[
            { key: "demographics", label: "Record Data" },
            { key: "files", label: `Attachments (${attachments.length})` },
            { key: "history", label: "Visit History" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveSubTab(tab.key)}
              className={`flex-1 py-2 text-center text-xs font-semibold rounded-lg transition ${
                activeSubTab === tab.key
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* TAB 1: DEMOGRAPHICS (Record Data) */}
          {activeSubTab === "demographics" && (
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-800 text-sm">
                  Clinical & Demographics Info
                </h3>
                <button
                  type="button"
                  onClick={() => setIsEditing(!isEditing)}
                  className="flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 transition"
                >
                  <FiEdit2 className="w-3.5 h-3.5" />
                  <span>{isEditing ? "View Mode" : "Edit Record"}</span>
                </button>
              </div>

              {isEditing ? (
                <form onSubmit={handleSave} className="space-y-4 text-xs">
                  {/* Name section */}
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">First Name</label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Middle Name</label>
                      <input
                        type="text"
                        value={formData.middleName}
                        onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Last Name</label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                        required
                      />
                    </div>
                  </div>

                  {/* Phone / Email */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Phone Number</label>
                      <input
                        type="text"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Email Address</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                      />
                    </div>
                  </div>

                  {/* Allergies / Chronic */}
                  <div>
                    <label className="block font-medium text-red-700 mb-1">Allergies (comma separated)</label>
                    <input
                      type="text"
                      value={formData.knownAllergies}
                      onChange={(e) => setFormData({ ...formData, knownAllergies: e.target.value })}
                      placeholder="e.g. Penicillin, Peanuts"
                      className="w-full px-2.5 py-1.5 border border-red-200 rounded focus:ring-1 focus:ring-red-500 focus:border-red-500 outline-none bg-red-50/20"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-red-700 mb-1">Chronic Conditions (comma separated)</label>
                    <input
                      type="text"
                      value={formData.chronicDiseases}
                      onChange={(e) => setFormData({ ...formData, chronicDiseases: e.target.value })}
                      placeholder="e.g. Hypertension, Diabetes"
                      className="w-full px-2.5 py-1.5 border border-red-200 rounded focus:ring-1 focus:ring-red-500 focus:border-red-500 outline-none bg-red-50/20"
                    />
                  </div>

                  {/* Demographics details */}
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Blood Group</label>
                      <select
                        value={formData.bloodGroup}
                        onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded outline-none"
                      >
                        <option value="">N/A</option>
                        {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map(g => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Marital Status</label>
                      <select
                        value={formData.maritalStatus}
                        onChange={(e) => setFormData({ ...formData, maritalStatus: e.target.value })}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded outline-none font-medium capitalize"
                      >
                        <option value="">N/A</option>
                        {["single", "married", "divorced", "widowed"].map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Occupation</label>
                      <input
                        type="text"
                        value={formData.occupation}
                        onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                      />
                    </div>
                  </div>

                  {/* Address */}
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Address Detail</label>
                    <textarea
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      rows={2}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                    />
                  </div>

                  {/* Emergency Contact */}
                  <div className="bg-slate-50 p-2.5 rounded border border-slate-150 grid grid-cols-2 gap-2 mt-2">
                    <span className="col-span-2 text-xs font-bold text-slate-700">Emergency Contact</span>
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Contact Name</label>
                      <input
                        type="text"
                        value={formData.emergencyContactName}
                        onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Contact Phone</label>
                      <input
                        type="text"
                        value={formData.emergencyContactPhone}
                        onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded outline-none"
                      />
                    </div>
                  </div>

                  {/* Save button */}
                  <button
                    type="submit"
                    className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold rounded shadow-md hover:from-emerald-700 hover:to-teal-700 transition"
                  >
                    <FiSave className="w-4 h-4" />
                    <span>Save Patient Record</span>
                  </button>
                </form>
              ) : (
                <div className="space-y-4 text-xs">
                  {/* View Details Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-slate-400 font-medium">Full Name</p>
                      <p className="text-sm font-semibold text-slate-800">
                        {patient.firstName} {patient.middleName} {patient.lastName}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-medium">Gender & Age</p>
                      <p className="text-sm font-semibold text-slate-800 capitalize">
                        {patient.gender} · {patient.age} years old
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-medium">Phone Number</p>
                      <p className="text-sm font-semibold text-slate-800">{patient.phone}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-medium">Email Address</p>
                      <p className="text-sm font-semibold text-slate-800">{patient.email || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-medium">Blood Group</p>
                      <p className="text-sm font-semibold text-slate-800">{patient.bloodGroup || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-medium">Marital Status</p>
                      <p className="text-sm font-semibold text-slate-800 capitalize">{patient.maritalStatus || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-medium">Occupation</p>
                      <p className="text-sm font-semibold text-slate-800">{patient.occupation || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-medium">Address</p>
                      <p className="text-sm font-semibold text-slate-800">{patient.address || "N/A"}</p>
                    </div>
                  </div>

                  {/* Red Alerts */}
                  {(patient.knownAllergies?.length > 0 || patient.chronicDiseases?.length > 0) && (
                    <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg space-y-2 mt-4">
                      {patient.knownAllergies?.length > 0 && (
                        <div>
                          <span className="font-bold text-red-800">Allergies: </span>
                          <span className="text-red-700">
                            {Array.isArray(patient.knownAllergies)
                              ? patient.knownAllergies.join(", ")
                              : patient.knownAllergies}
                          </span>
                        </div>
                      )}
                      {patient.chronicDiseases?.length > 0 && (
                        <div>
                          <span className="font-bold text-red-800">Chronic Diseases: </span>
                          <span className="text-red-700">
                            {Array.isArray(patient.chronicDiseases)
                              ? patient.chronicDiseases.join(", ")
                              : patient.chronicDiseases}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Emergency Contact */}
                  <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg mt-4">
                    <p className="font-bold text-slate-700 mb-2">Emergency Contact</p>
                    <div className="grid grid-cols-2 gap-2 text-slate-600">
                      <div>
                        <p className="text-[10px] text-slate-400">Name</p>
                        <p className="font-semibold">{patient.emergencyContactName || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400">Phone</p>
                        <p className="font-semibold">{patient.emergencyContactPhone || "N/A"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ATTACHMENTS */}
          {activeSubTab === "files" && (
            <div className="space-y-4">
              {/* File Upload Box */}
              <div className="bg-white rounded-xl border-2 border-dashed border-slate-350 p-6 text-center hover:border-emerald-500 transition duration-150 relative">
                <FiUploadCloud className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700 mb-1">
                  Upload Lab Reports or Files
                </p>
                <p className="text-[10px] text-slate-400 mb-3">
                  Allows image files (JPEG, PNG) or PDFs up to 5MB
                </p>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>

              {/* Attachments List */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100 shadow-sm">
                <div className="bg-slate-50 px-4 py-2 border-b border-slate-150">
                  <h4 className="text-xs font-bold text-slate-700">Uploaded Files</h4>
                </div>

                {attachments.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    <FiFileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <span>No files uploaded yet for this patient</span>
                  </div>
                ) : (
                  attachments.map((file) => {
                    const isImg = file.fileType?.startsWith("image/");
                    return (
                      <div key={file.id} className="p-3.5 flex items-start gap-3 hover:bg-slate-50 transition text-xs">
                        {/* Thumbnail / Icon */}
                        {isImg ? (
                          <div className="w-12 h-12 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 flex-shrink-0">
                            <img
                              src={getFileUrl(file.filePath)}
                              alt={file.fileName}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-lg flex items-center justify-center flex-shrink-0 font-bold border border-rose-200">
                            PDF
                          </div>
                        )}

                        {/* File Details */}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-800 truncate" title={file.fileName}>
                            {file.fileName}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Uploaded on {new Date(file.createdAt).toLocaleDateString()}
                          </p>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <a
                            href={getFileUrl(file.filePath)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-slate-100 rounded transition"
                            title="View File"
                          >
                            <FiEye className="w-4 h-4" />
                          </a>
                          <button
                            onClick={() => handleDeleteFile(file.id)}
                            className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-slate-100 rounded transition"
                            title="Delete File"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 3: VISITS HISTORY */}
          {activeSubTab === "history" && (
            <div className="space-y-4">
              {history?.visits?.length > 0 ? (
                history.visits.map((visit) => {
                  let diagnosisList = [];
                  try {
                    diagnosisList = visit.diagnosis
                      ? (Array.isArray(visit.diagnosis) ? visit.diagnosis : JSON.parse(visit.diagnosis))
                      : [];
                  } catch {
                    diagnosisList = typeof visit.diagnosis === "string" ? [visit.diagnosis] : [];
                  }

                  return (
                    <div
                      key={visit.id}
                      className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition text-xs space-y-2.5"
                    >
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <div>
                          <p className="font-bold text-slate-800">Visit #{visit.visitNumber}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                            <FiCalendar className="w-3.5 h-3.5" />
                            <span>{new Date(visit.visitDate).toLocaleDateString()}</span>
                            {visit.doctor && (
                              <span>Dr. {visit.doctor.firstName} {visit.doctor.lastName}</span>
                            )}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            visit.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {visit.status.replace("_", " ")}
                        </span>
                      </div>

                      {/* Complaint */}
                      {visit.chiefComplaint && (
                        <div>
                          <p className="text-[10px] text-slate-400 font-semibold uppercase">Chief Complaint</p>
                          <p className="text-slate-700 mt-0.5">{visit.chiefComplaint}</p>
                        </div>
                      )}

                      {/* Diagnosis */}
                      {diagnosisList.length > 0 && (
                        <div>
                          <p className="text-[10px] text-slate-400 font-semibold uppercase">Diagnosis</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {diagnosisList.map((d, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 bg-red-50 text-red-700 rounded-full font-medium"
                              >
                                {d}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Treatment */}
                      {visit.treatmentPlan && (
                        <div>
                          <p className="text-[10px] text-slate-400 font-semibold uppercase">Treatment Plan</p>
                          <p className="text-slate-700 mt-0.5">{visit.treatmentPlan}</p>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-xs">
                  <FiClock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <span>No previous visit history available</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default PatientRecordSidebar;
