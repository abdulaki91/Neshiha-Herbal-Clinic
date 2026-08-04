import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { FiX, FiUserCheck, FiCalendar } from "react-icons/fi";
import axiosInstance from "../../lib/axios";
import toast from "react-hot-toast";

const todayStr = () => new Date().toISOString().split("T")[0];
const nowTimeStr = () =>
  new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

const VisitForm = ({
  onClose,
  onSuccess,
  defaultPatientId,
  initialMode = "walk_in",
}) => {
  const { t } = useTranslation();
  const [patients, setPatients] = useState([]);
  const [mode, setMode] = useState(initialMode);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      patientId: defaultPatientId || "",
      visitDate: todayStr(),
      arrivalTime: nowTimeStr(),
      scheduledTime: nowTimeStr(),
    },
  });

  const visitDate = watch("visitDate");

  useEffect(() => {
    fetchPatients();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (defaultPatientId) {
      setValue("patientId", defaultPatientId);
    }
  }, [defaultPatientId, setValue]);

  // Switching to appointment mode on today's date reads oddly ("appointment
  // for right now"); nudge the date forward so the intent is unambiguous
  useEffect(() => {
    if (mode === "appointment" && visitDate === todayStr()) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setValue("visitDate", tomorrow.toISOString().split("T")[0]);
    }
    if (mode === "walk_in") {
      setValue("visitDate", todayStr());
    }
  }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchPatients = async () => {
    try {
      const response = await axiosInstance.get("/patients", {
        params: { pageSize: 50 },
      });
      setPatients(response.data.data || response.data || []);
    } catch {
      console.error(t("visitForm.fetchError"));
      setPatients([]);
    }
  };

  const onSubmit = async (data) => {
    try {
      const payload =
        mode === "appointment"
          ? {
              patientId: data.patientId,
              chiefComplaint: data.chiefComplaint,
              visitDate: data.visitDate,
              scheduledTime: data.scheduledTime,
              status: "scheduled",
            }
          : {
              patientId: data.patientId,
              chiefComplaint: data.chiefComplaint,
              visitDate: data.visitDate,
              arrivalTime: data.arrivalTime,
            };

      await axiosInstance.post("/visits", payload);
      toast.success(
        mode === "appointment"
          ? t("visitForm.scheduleSuccess")
          : t("visitForm.createSuccess"),
      );
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
          <h2 className="text-2xl font-bold">
            {mode === "appointment"
              ? t("visitForm.scheduleTitle")
              : t("visitForm.title")}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        {/* Mode toggle */}
        <div className="p-6 pb-0">
          <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-xl">
            <button
              type="button"
              onClick={() => setMode("walk_in")}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                mode === "walk_in"
                  ? "bg-white text-emerald-700 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <FiUserCheck className="w-4 h-4" />
              {t("visitForm.mode.walkIn")}
            </button>
            <button
              type="button"
              onClick={() => setMode("appointment")}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                mode === "appointment"
                  ? "bg-white text-emerald-700 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <FiCalendar className="w-4 h-4" />
              {t("visitForm.mode.appointment")}
            </button>
          </div>
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {mode === "appointment"
                    ? t("visitForm.appointmentDateLabel")
                    : t("visitForm.visitDateLabel")}
                </label>
                <input
                  type="date"
                  min={mode === "appointment" ? todayStr() : undefined}
                  {...register("visitDate", { required: true })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                />
              </div>

              {mode === "appointment" ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("visitForm.scheduledTimeLabel")}
                  </label>
                  <input
                    type="time"
                    {...register("scheduledTime", {
                      required: t("visitForm.scheduledTimeRequired"),
                    })}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                  />
                  {errors.scheduledTime && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.scheduledTime.message}
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("visitForm.arrivalTimeLabel")}
                  </label>
                  <input
                    type="time"
                    {...register("arrivalTime", {
                      required: t("visitForm.arrivalTimeRequired"),
                    })}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                  />
                  {errors.arrivalTime && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.arrivalTime.message}
                    </p>
                  )}
                </div>
              )}
            </div>

            {mode === "appointment" && (
              <p className="text-xs text-gray-500 bg-emerald-50 border border-emerald-100 rounded-lg p-3">
                {t("visitForm.appointmentHint")}
              </p>
            )}
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
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 hover:-translate-y-0.5 font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {isSubmitting
                ? t("visitForm.creating")
                : mode === "appointment"
                  ? t("visitForm.scheduleButton")
                  : t("visitForm.createButton")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VisitForm;
