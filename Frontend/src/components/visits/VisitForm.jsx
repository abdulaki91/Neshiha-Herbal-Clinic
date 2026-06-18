import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { FiX } from "react-icons/fi";
import axiosInstance from "../../lib/axios";
import toast from "react-hot-toast";

const VisitForm = ({ onClose, onSuccess, defaultPatientId }) => {
  const { t } = useTranslation();
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      patientId: defaultPatientId || "",
      visitDate: new Date().toISOString().split("T")[0],
      arrivalTime: new Date().toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    },
  });

  useEffect(() => {
    fetchPatients();
  }, [searchTerm]);

  useEffect(() => {
    if (defaultPatientId) {
      setValue("patientId", defaultPatientId);
    }
  }, [defaultPatientId, setValue]);

  const fetchPatients = async () => {
    try {
      const response = await axiosInstance.get("/patients", {
        params: { pageSize: 50, search: searchTerm },
      });
      setPatients(response.data.data || response.data || []);
    } catch (error) {
      console.error(t("visitForm.fetchError"));
      setPatients([]);
    }
  };

  const onSubmit = async (data) => {
    try {
      await axiosInstance.post("/visits", data);
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.message || t("visitForm.createError"));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white flex items-center justify-between">
          <h2 className="text-2xl font-bold">{t("visitForm.title")}</h2>
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
                {t("visitForm.patientLabel")}
              </label>
              <select
                {...register("patientId", { required: t("visitForm.patientRequired") })}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
              >
                <option value="">{t("visitForm.patientPlaceholder")}</option>
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
                {t("visitForm.chiefComplaintLabel")}
              </label>
              <textarea
                {...register("chiefComplaint")}
                rows="4"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                placeholder={t("visitForm.chiefComplaintPlaceholder")}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("visitForm.visitDateLabel")}
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
                {t("visitForm.arrivalTimeLabel")}
              </label>
              <input
                type="time"
                {...register("arrivalTime", {
                  required: t("visitForm.arrivalTimeRequired"),
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
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? t("visitForm.creating") : t("visitForm.createButton")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VisitForm;
