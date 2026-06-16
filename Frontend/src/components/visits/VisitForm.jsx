import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { FiX } from "react-icons/fi";
import axiosInstance from "../../lib/axios";
import toast from "react-hot-toast";

const VisitForm = ({ onClose, onSuccess }) => {
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();

  useEffect(() => {
    fetchPatients();
  }, [searchTerm]);

  const fetchPatients = async () => {
    try {
      const response = await axiosInstance.get("/patients", {
        params: { pageSize: 50, search: searchTerm },
      });
      setPatients(response.data.patients || response.data || []);
    } catch (error) {
      console.error("Failed to fetch patients");
      setPatients([]);
    }
  };

  const onSubmit = async (data) => {
    try {
      await axiosInstance.post("/visits", data);
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create visit");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white flex items-center justify-between">
          <h2 className="text-2xl font-bold">Create New Visit</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Patient *
              </label>
              <select
                {...register("patientId", { required: "Patient is required" })}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
              >
                <option value="">Select patient</option>
                {patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.firstName} {patient.lastName} - {patient.patientId}
                  </option>
                ))}
              </select>
              {errors.patientId && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.patientId.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chief Complaint
              </label>
              <textarea
                {...register("chiefComplaint")}
                rows="4"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                placeholder="Describe the patient's main complaint..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Visit Date
              </label>
              <input
                type="date"
                {...register("visitDate")}
                defaultValue={new Date().toISOString().split("T")[0]}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Arrival Time *
              </label>
              <input
                type="time"
                {...register("arrivalTime", {
                  required: "Arrival time is required",
                })}
                defaultValue={new Date().toLocaleTimeString("en-GB", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
              />
              {errors.arrivalTime && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.arrivalTime.message}
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Creating..." : "Create Visit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VisitForm;
