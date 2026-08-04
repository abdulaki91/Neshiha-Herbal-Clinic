import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { FiX, FiSave, FiUserPlus } from "react-icons/fi";
import toast from "react-hot-toast";
import useAuthStore from "../../store/authStore";
import { useCreateStaff, useUpdateStaff } from "../../hooks/useStaff";

// Only a super admin may create or promote another super admin
const ALL_ROLES = [
  "super_admin",
  "staff_manager",
  "data_clerk",
  "doctor",
  "cashier",
];

const StaffForm = ({ staff = null, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const isEdit = !!staff;

  const createStaff = useCreateStaff();
  const updateStaff = useUpdateStaff();
  const saving = createStaff.isPending || updateStaff.isPending;

  const availableRoles =
    user?.role === "super_admin"
      ? ALL_ROLES
      : ALL_ROLES.filter((r) => r !== "super_admin");

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      firstName: staff?.firstName || "",
      lastName: staff?.lastName || "",
      email: staff?.email || "",
      password: "",
      phone: staff?.phone || "",
      role: staff?.role || "data_clerk",
      status: staff?.status || "active",
      department: staff?.department || "",
      specialization: staff?.specialization || "",
      licenseNumber: staff?.licenseNumber || "",
      address: staff?.address || "",
    },
  });

  const selectedRole = watch("role");

  const onSubmit = async (data) => {
    // Drop empty optional fields so we don't overwrite stored values with ""
    const payload = Object.fromEntries(
      Object.entries(data).filter(([, v]) => v !== "" && v != null),
    );

    // Password is only ever set at creation; changing it uses the reset action
    if (isEdit) delete payload.password;

    try {
      if (isEdit) {
        await updateStaff.mutateAsync({ id: staff.id, ...payload });
        toast.success(t("staffForm.updateSuccess"));
      } else {
        await createStaff.mutateAsync(payload);
        toast.success(t("staffForm.createSuccess"));
      }
      onSuccess?.();
    } catch (error) {
      toast.error(
        error.response?.data?.message || t("staffForm.saveError"),
      );
    }
  };

  const inputClass = (hasError) =>
    `w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition ${
      hasError ? "border-red-500" : "border-gray-300"
    }`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-lg flex items-center justify-center">
              <FiUserPlus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                {isEdit ? t("staffForm.editTitle") : t("staffForm.addTitle")}
              </h2>
              <p className="text-xs text-gray-500">{t("staffForm.subtitle")}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <FiX className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("staffForm.firstNameLabel")} *
              </label>
              <input
                type="text"
                {...register("firstName", {
                  required: t("staffForm.firstNameRequired"),
                })}
                className={inputClass(errors.firstName)}
              />
              {errors.firstName && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.firstName.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("staffForm.lastNameLabel")} *
              </label>
              <input
                type="text"
                {...register("lastName", {
                  required: t("staffForm.lastNameRequired"),
                })}
                className={inputClass(errors.lastName)}
              />
              {errors.lastName && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.lastName.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("staffForm.emailLabel")} *
              </label>
              <input
                type="email"
                {...register("email", {
                  required: t("staffForm.emailRequired"),
                  pattern: {
                    value: /^\S+@\S+\.\S+$/,
                    message: t("staffForm.emailInvalid"),
                  },
                })}
                className={inputClass(errors.email)}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("staffForm.phoneLabel")} *
              </label>
              <input
                type="tel"
                {...register("phone", {
                  required: t("staffForm.phoneRequired"),
                })}
                className={inputClass(errors.phone)}
                placeholder={t("staffForm.phonePlaceholder")}
              />
              {errors.phone && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.phone.message}
                </p>
              )}
            </div>

            {!isEdit && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("staffForm.passwordLabel")} *
                </label>
                <input
                  type="password"
                  autoComplete="new-password"
                  {...register("password", {
                    required: t("staffForm.passwordRequired"),
                    minLength: {
                      value: 8,
                      message: t("staffForm.passwordTooShort"),
                    },
                    pattern: {
                      value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                      message: t("staffForm.passwordWeak"),
                    },
                  })}
                  className={inputClass(errors.password)}
                />
                {errors.password ? (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.password.message}
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-gray-400">
                    {t("staffForm.passwordHint")}
                  </p>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("staffForm.roleLabel")} *
              </label>
              <select
                {...register("role", { required: true })}
                className={inputClass(errors.role)}
              >
                {availableRoles.map((role) => (
                  <option key={role} value={role}>
                    {t(`roles.${role}`)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("staffForm.statusLabel")}
              </label>
              <select {...register("status")} className={inputClass(false)}>
                <option value="active">{t("staff.status.active")}</option>
                <option value="inactive">{t("staff.status.inactive")}</option>
                <option value="suspended">{t("staff.status.suspended")}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("staffForm.departmentLabel")}
              </label>
              <input
                type="text"
                {...register("department")}
                className={inputClass(false)}
              />
            </div>

            {selectedRole === "doctor" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("staffForm.specializationLabel")}
                  </label>
                  <input
                    type="text"
                    {...register("specialization")}
                    className={inputClass(false)}
                    placeholder={t("staffForm.specializationPlaceholder")}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("staffForm.licenseNumberLabel")}
                  </label>
                  <input
                    type="text"
                    {...register("licenseNumber")}
                    className={inputClass(false)}
                  />
                </div>
              </>
            )}

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("staffForm.addressLabel")}
              </label>
              <textarea
                {...register("address")}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:from-emerald-700 hover:to-teal-700 transition disabled:opacity-50 shadow-md"
            >
              <FiSave />
              <span>
                {saving
                  ? t("common.saving")
                  : isEdit
                    ? t("staffForm.updateButton")
                    : t("staffForm.createButton")}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StaffForm;
