import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { FiX, FiCalendar, FiCheckCircle } from "react-icons/fi";
import { useSubmitBookingRequest } from "../hooks/usePublicContent";

const todayISO = () => new Date().toISOString().split("T")[0];

export default function BookingModal({ onClose }) {
  const { t } = useTranslation();
  const [submitted, setSubmitted] = useState(false);
  const submitBooking = useSubmitBookingRequest();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    try {
      await submitBooking.mutateAsync(data);
      setSubmitted(true);
    } catch {
      // Error is surfaced inline below via submitBooking.isError
    }
  };

  const inputClass = (hasError) =>
    `w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition ${
      hasError ? "border-red-400" : "border-gray-300"
    }`;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-xl flex items-center justify-center">
              <FiCalendar className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">
              {t("booking.title", "Book an Appointment")}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition">
            <FiX className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {submitted ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiCheckCircle className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">
              {t("booking.successTitle", "Request Received!")}
            </h3>
            <p className="text-gray-600 mb-6">
              {t(
                "booking.successMessage",
                "Thank you — our team will contact you shortly to confirm your appointment.",
              )}
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-semibold hover:from-emerald-700 hover:to-teal-700 transition"
            >
              {t("common.close", "Close")}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
            <p className="text-sm text-gray-500 -mt-1">
              {t(
                "booking.subtitle",
                "Tell us a little about you and when you'd like to visit — we'll reach out to confirm.",
              )}
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("booking.fullName", "Full Name")} *
              </label>
              <input
                type="text"
                {...register("fullName", { required: t("booking.requiredField", "This field is required") })}
                className={inputClass(errors.fullName)}
              />
              {errors.fullName && (
                <p className="mt-1 text-xs text-red-500">{errors.fullName.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("booking.phone", "Phone Number")} *
                </label>
                <input
                  type="tel"
                  {...register("phone", { required: t("booking.requiredField", "This field is required") })}
                  className={inputClass(errors.phone)}
                />
                {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("booking.email", "Email (optional)")}
                </label>
                <input
                  type="email"
                  {...register("email")}
                  className={inputClass(errors.email)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("booking.preferredDate", "Preferred Date")} *
                </label>
                <input
                  type="date"
                  min={todayISO()}
                  {...register("preferredDate", { required: t("booking.requiredField", "This field is required") })}
                  className={inputClass(errors.preferredDate)}
                />
                {errors.preferredDate && (
                  <p className="mt-1 text-xs text-red-500">{errors.preferredDate.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("booking.preferredTime", "Preferred Time")}
                </label>
                <select {...register("preferredTime")} className={inputClass()}>
                  <option value="">{t("booking.timeAny", "Any time")}</option>
                  <option value="morning">{t("booking.timeMorning", "Morning")}</option>
                  <option value="afternoon">{t("booking.timeAfternoon", "Afternoon")}</option>
                  <option value="evening">{t("booking.timeEvening", "Evening")}</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("booking.reason", "Reason for Visit (optional)")}
              </label>
              <textarea
                rows={3}
                {...register("reason")}
                className={`${inputClass()} resize-none`}
              />
            </div>

            {submitBooking.isError && (
              <p className="text-sm text-red-500">
                {submitBooking.error?.response?.data?.errors?.[0]?.message ||
                  submitBooking.error?.response?.data?.message ||
                  t("booking.submitError", "Something went wrong — please try again.")}
              </p>
            )}

            <button
              type="submit"
              disabled={submitBooking.isPending}
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-semibold hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50 shadow-md"
            >
              {submitBooking.isPending
                ? t("booking.submitting", "Submitting...")
                : t("booking.submit", "Request Appointment")}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
