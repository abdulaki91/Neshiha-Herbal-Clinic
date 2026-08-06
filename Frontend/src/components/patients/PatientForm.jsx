import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { FiX } from "react-icons/fi";
import axiosInstance from "../../lib/axios";
import toast from "react-hot-toast";

// Display only — the amount actually charged is enforced server-side
// (REGISTRATION_FEE_AMOUNT in Backend/src/config/constants.js) and never
// taken from the request body.
const REGISTRATION_FEE_AMOUNT = 200;

const PatientForm = ({ onClose, onSuccess, patient, initialValues }) => {
  const { t } = useTranslation();
  const isEditing = !!patient;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: patient
      ? {
          firstName: patient.firstName || "",
          lastName: patient.lastName || "",
          gender: patient.gender || "",
          age: patient.age ?? "",
          phone: patient.phone || "",
          city: patient.city || "",
          woreda: patient.woreda || "",
        }
      : initialValues || {},
  });

  const onSubmit = async (data) => {
    try {
      if (isEditing) {
        await axiosInstance.put(`/patients/${patient.id}`, data);
        toast.success(t("patientForm.updateSuccess"));
      } else {
        await axiosInstance.post("/patients", data);
        toast.success(t("patientForm.registerSuccess"));
      }
      onSuccess();
    } catch (error) {
      toast.error(
        error.response?.data?.message || t("patientForm.saveError"),
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            {isEditing ? t("patientForm.editTitle") : t("patientForm.registerTitle")}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]"
        >
          {!isEditing && initialValues && (
            <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
              {t("patientForm.fromBookingNotice")}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Information */}
            <div className="col-span-2">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                {t("patientForm.personalInfoTitle")}
              </h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("patientForm.firstNameLabel")}
              </label>
              <input
                {...register("firstName", {
                  required: t("patientForm.firstNameRequired"),
                })}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                placeholder={t("patientForm.firstNamePlaceholder")}
              />
              {errors.firstName && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.firstName.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("patientForm.lastNameLabel")}
              </label>
              <input
                {...register("lastName", { required: t("patientForm.lastNameRequired") })}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                placeholder={t("patientForm.lastNamePlaceholder")}
              />
              {errors.lastName && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.lastName.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("patientForm.genderLabel")}
              </label>
              <select
                {...register("gender", { required: t("patientForm.genderRequired") })}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
              >
                <option value="">{t("patientForm.genderPlaceholder")}</option>
                <option value="male">{t("patientForm.genderMale")}</option>
                <option value="female">{t("patientForm.genderFemale")}</option>
                <option value="other">{t("patientForm.genderOther")}</option>
              </select>
              {errors.gender && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.gender.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("patientForm.ageLabel")}
              </label>
              <input
                type="number"
                min="0"
                max="150"
                {...register("age", {
                  required: t("patientForm.ageRequired"),
                  valueAsNumber: true,
                  min: { value: 0, message: t("patientForm.ageInvalid") },
                  max: { value: 150, message: t("patientForm.ageInvalid") },
                })}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                placeholder={t("patientForm.agePlaceholder")}
              />
              {errors.age && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.age.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("patientForm.phoneLabel")}
              </label>
              <input
                {...register("phone", { required: t("patientForm.phoneRequired") })}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                placeholder={t("patientForm.phonePlaceholder")}
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.phone.message}
                </p>
              )}
            </div>

            {/* Address Information */}
            <div className="col-span-2 mt-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                {t("patientForm.addressTitle")}
              </h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("patientForm.cityLabel")}
              </label>
              <input
                {...register("city")}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                placeholder={t("patientForm.cityPlaceholder")}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("patientForm.woredaLabel")}
              </label>
              <input
                {...register("woreda")}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                placeholder={t("patientForm.woredaPlaceholder")}
              />
            </div>

            {/* Registration Fee — required for new patients only; nothing
                to collect again when editing an existing one. */}
            {!isEditing && (
              <>
                <div className="col-span-2 mt-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-1">
                    {t("patientForm.registrationFeeTitle")}
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    {t("patientForm.registrationFeeNotice", { amount: REGISTRATION_FEE_AMOUNT })}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("patientForm.registrationFeeAmountLabel")}
                  </label>
                  <div className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-700 font-semibold">
                    {REGISTRATION_FEE_AMOUNT} ETB
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("patientForm.registrationFeeMethodLabel")}
                  </label>
                  <select
                    {...register("registrationFeeMethod", {
                      required: t("patientForm.registrationFeeMethodRequired"),
                    })}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                  >
                    <option value="">{t("patientForm.registrationFeeMethodPlaceholder")}</option>
                    <option value="cash">{t("patientForm.registrationFeeMethodCash")}</option>
                    <option value="transfer">{t("patientForm.registrationFeeMethodTransfer")}</option>
                    <option value="telebirr">{t("patientForm.registrationFeeMethodTelebirr")}</option>
                  </select>
                  {errors.registrationFeeMethod && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.registrationFeeMethod.message}
                    </p>
                  )}
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("patientForm.registrationFeeTransactionLabel")}
                  </label>
                  <input
                    {...register("registrationFeeTransactionId")}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                    placeholder={t("patientForm.registrationFeeTransactionPlaceholder")}
                  />
                </div>
              </>
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
              className="px-6 py-3 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting
                ? t("patientForm.saving")
                : isEditing
                  ? t("patientForm.updateButton")
                  : t("patientForm.registerButton")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PatientForm;
