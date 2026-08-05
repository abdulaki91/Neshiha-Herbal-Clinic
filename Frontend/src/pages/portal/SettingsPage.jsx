import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import {
  FiSave,
  FiHome,
  FiClock,
  FiBell,
  FiFileText,
  FiBriefcase,
  FiShare2,
  FiUploadCloud,
} from "react-icons/fi";
import toast from "react-hot-toast";
import useAuthStore from "../../store/authStore";
import {
  useSettings,
  useUpdateSettings,
  useUploadLogo,
} from "../../hooks/useSettings";
import TranslatableInput from "../../components/content-admin/TranslatableInput";

const emptyLocaleValue = () => ({ en: "", am: "", om: "", ar: "" });

const WEEKDAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

// The API stores TIME values as HH:mm:ss but <input type="time"> wants HH:mm
const toTimeInput = (value) => (value ? value.slice(0, 5) : "");

const Section = ({ icon, title, description, children }) => {
  const Icon = icon;
  return (
    <div className="bg-white rounded-2xl shadow-sm shadow-slate-200/60 border border-gray-100 p-6">
      <div className="flex items-center space-x-3 mb-5">
        <div className="p-2.5 bg-emerald-50 rounded-lg">
          <Icon className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <h2 className="font-bold text-gray-800">{title}</h2>
          {description && (
            <p className="text-xs text-gray-500">{description}</p>
          )}
        </div>
      </div>
      {children}
    </div>
  );
};

const Field = ({ label, hint, children }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label}
    </label>
    {children}
    {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
  </div>
);

const inputClass =
  "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition";

const SettingsPage = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const canEdit = user?.role === "super_admin";

  const { data: settings, isLoading, isError } = useSettings();
  const updateSettings = useUpdateSettings();
  const uploadLogo = useUploadLogo();
  const logoInputRef = useRef(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm();

  const handleLogoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await uploadLogo.mutateAsync(file);
      toast.success(t("settings.business.logoUploadSuccess"));
    } catch (error) {
      toast.error(
        error.response?.data?.message || t("settings.business.logoUploadError"),
      );
    } finally {
      e.target.value = "";
    }
  };

  const logoUrl = settings?.clinicLogo
    ? `${(import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1").replace("/api/v1", "")}/${settings.clinicLogo}`
    : null;

  // Populate the form once the settings arrive
  useEffect(() => {
    if (!settings) return;
    reset({
      clinicName: settings.clinicName || "",
      clinicPhone: settings.clinicPhone || "",
      clinicEmail: settings.clinicEmail || "",
      clinicAddress: settings.clinicAddress || "",
      timezone: settings.timezone || "Africa/Addis_Ababa",
      currency: settings.currency || "ETB",
      dateFormat: settings.dateFormat || "YYYY-MM-DD",
      timeFormat: settings.timeFormat || "24h",
      lowStockThreshold: settings.lowStockThreshold ?? 10,
      appointmentDuration: settings.appointmentDuration ?? 30,
      workingHoursStart: toTimeInput(settings.workingHoursStart) || "08:00",
      workingHoursEnd: toTimeInput(settings.workingHoursEnd) || "17:00",
      workingDays: settings.workingDays || [],
      enableEmailNotifications: !!settings.enableEmailNotifications,
      enableSMSNotifications: !!settings.enableSMSNotifications,
      termsAndConditions: settings.termsAndConditions || "",
      privacyPolicy: settings.privacyPolicy || "",
      tagline: { ...emptyLocaleValue(), ...settings.tagline },
      mission: { ...emptyLocaleValue(), ...settings.mission },
      vision: { ...emptyLocaleValue(), ...settings.vision },
      aboutText: { ...emptyLocaleValue(), ...settings.aboutText },
      yearsExperience: settings.yearsExperience ?? "",
      patientsServed: settings.patientsServed ?? "",
      treatmentsOffered: settings.treatmentsOffered ?? "",
      whatsappNumber: settings.whatsappNumber || "",
      facebookUrl: settings.facebookUrl || "",
      instagramUrl: settings.instagramUrl || "",
      tiktokUrl: settings.tiktokUrl || "",
      twitterUrl: settings.twitterUrl || "",
      googleMapsEmbedUrl: settings.googleMapsEmbedUrl || "",
    });
  }, [settings, reset]);

  const onSubmit = async (data) => {
    const payload = {
      ...data,
      lowStockThreshold: Number(data.lowStockThreshold),
      appointmentDuration: Number(data.appointmentDuration),
      // Checkbox groups yield false for "none selected"; normalise to an array
      workingDays: Array.isArray(data.workingDays) ? data.workingDays : [],
      yearsExperience: data.yearsExperience === "" ? null : Number(data.yearsExperience),
      patientsServed: data.patientsServed === "" ? null : Number(data.patientsServed),
      treatmentsOffered: data.treatmentsOffered === "" ? null : Number(data.treatmentsOffered),
    };

    try {
      await updateSettings.mutateAsync(payload);
      toast.success(t("settings.saveSuccess"));
    } catch (error) {
      // Field-level validation errors live in `errors`, not `message`
      // (which is just the generic "Validation failed") — surface the
      // actual reason instead of a dead-end toast.
      const fieldErrors = error.response?.data?.errors;
      if (Array.isArray(fieldErrors) && fieldErrors.length > 0) {
        toast.error(fieldErrors.map((e) => e.message).join(" "));
      } else {
        toast.error(error.response?.data?.message || t("settings.saveError"));
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-12 text-center text-red-500 bg-white rounded-2xl shadow-sm shadow-slate-200/60">
        {t("settings.loadError")}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          {t("settings.title")}
        </h1>
        <p className="text-gray-500 mt-1">{t("settings.subtitle")}</p>
      </div>

      {!canEdit && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
          {t("settings.readOnlyNotice")}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <fieldset disabled={!canEdit} className="space-y-6 border-0 p-0 m-0">
          <Section
            icon={FiHome}
            title={t("settings.clinic.title")}
            description={t("settings.clinic.description")}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field label={t("settings.clinic.name")}>
                <input
                  type="text"
                  {...register("clinicName")}
                  className={inputClass}
                />
              </Field>

              <Field label={t("settings.clinic.phone")}>
                <input
                  type="tel"
                  {...register("clinicPhone")}
                  className={inputClass}
                />
              </Field>

              <Field label={t("settings.clinic.email")}>
                <input
                  type="email"
                  {...register("clinicEmail", {
                    pattern: {
                      value: /^\S+@\S+\.\S+$/,
                      message: t("settings.clinic.emailInvalid"),
                    },
                  })}
                  className={inputClass}
                />
                {errors.clinicEmail && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.clinicEmail.message}
                  </p>
                )}
              </Field>

              <Field label={t("settings.clinic.currency")}>
                <input
                  type="text"
                  {...register("currency")}
                  className={inputClass}
                />
              </Field>

              <div className="md:col-span-2">
                <Field label={t("settings.clinic.address")}>
                  <textarea
                    {...register("clinicAddress")}
                    rows={2}
                    className={`${inputClass} resize-none`}
                  />
                </Field>
              </div>
            </div>
          </Section>

          <Section
            icon={FiBriefcase}
            title={t("settings.business.title")}
            description={t("settings.business.description")}
          >
            <div className="space-y-6">
              <Field label={t("settings.business.logo")}>
                <div className="flex items-center gap-4">
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt={t("settings.business.logo")}
                      className="w-16 h-16 rounded-lg object-cover border border-gray-200"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                      <FiUploadCloud className="w-6 h-6" />
                    </div>
                  )}
                  <div>
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      disabled={uploadLogo.isPending}
                      className="px-4 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
                    >
                      {uploadLogo.isPending
                        ? t("common.saving")
                        : t("settings.business.uploadLogo")}
                    </button>
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="hidden"
                    />
                  </div>
                </div>
              </Field>

              <TranslatableInput
                register={register}
                name="tagline"
                label={t("settings.business.tagline")}
              />
              <TranslatableInput
                register={register}
                name="mission"
                label={t("settings.business.mission")}
                multiline
              />
              <TranslatableInput
                register={register}
                name="vision"
                label={t("settings.business.vision")}
                multiline
              />
              <TranslatableInput
                register={register}
                name="aboutText"
                label={t("settings.business.aboutText")}
                multiline
                rows={4}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Field label={t("settings.business.yearsExperience")}>
                  <input
                    type="number"
                    min={0}
                    {...register("yearsExperience")}
                    className={inputClass}
                  />
                </Field>
                <Field label={t("settings.business.patientsServed")}>
                  <input
                    type="number"
                    min={0}
                    {...register("patientsServed")}
                    className={inputClass}
                  />
                </Field>
                <Field label={t("settings.business.treatmentsOffered")}>
                  <input
                    type="number"
                    min={0}
                    {...register("treatmentsOffered")}
                    className={inputClass}
                  />
                </Field>
              </div>
            </div>
          </Section>

          <Section
            icon={FiShare2}
            title={t("settings.contact.title")}
            description={t("settings.contact.description")}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field label={t("settings.contact.whatsapp")}>
                <input
                  type="tel"
                  {...register("whatsappNumber")}
                  className={inputClass}
                />
              </Field>
              <Field label={t("settings.contact.facebook")}>
                <input
                  type="url"
                  placeholder="https://facebook.com/..."
                  {...register("facebookUrl")}
                  className={inputClass}
                />
              </Field>
              <Field label={t("settings.contact.instagram")}>
                <input
                  type="url"
                  placeholder="https://instagram.com/..."
                  {...register("instagramUrl")}
                  className={inputClass}
                />
              </Field>
              <Field label={t("settings.contact.tiktok")}>
                <input
                  type="url"
                  placeholder="https://tiktok.com/@..."
                  {...register("tiktokUrl")}
                  className={inputClass}
                />
              </Field>
              <Field label={t("settings.contact.twitter")}>
                <input
                  type="url"
                  placeholder="https://x.com/..."
                  {...register("twitterUrl")}
                  className={inputClass}
                />
              </Field>
              <div className="md:col-span-2">
                <Field
                  label={t("settings.contact.googleMaps")}
                  hint={t("settings.contact.googleMapsHint")}
                >
                  <input
                    type="text"
                    placeholder="https://www.google.com/maps/embed?..."
                    {...register("googleMapsEmbedUrl")}
                    className={inputClass}
                  />
                </Field>
              </div>
            </div>
          </Section>

          <Section
            icon={FiClock}
            title={t("settings.schedule.title")}
            description={t("settings.schedule.description")}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field label={t("settings.schedule.opensAt")}>
                <input
                  type="time"
                  {...register("workingHoursStart")}
                  className={inputClass}
                />
              </Field>

              <Field label={t("settings.schedule.closesAt")}>
                <input
                  type="time"
                  {...register("workingHoursEnd")}
                  className={inputClass}
                />
              </Field>

              <Field label={t("settings.schedule.timezone")}>
                <input
                  type="text"
                  {...register("timezone")}
                  className={inputClass}
                />
              </Field>

              <Field
                label={t("settings.schedule.appointmentDuration")}
                hint={t("settings.schedule.minutesHint")}
              >
                <input
                  type="number"
                  min={5}
                  {...register("appointmentDuration", { min: 5 })}
                  className={inputClass}
                />
              </Field>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("settings.schedule.workingDays")}
                </label>
                <div className="flex flex-wrap gap-2">
                  {WEEKDAYS.map((day) => (
                    <label
                      key={day}
                      className="flex items-center space-x-2 px-3 py-2 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition"
                    >
                      <input
                        type="checkbox"
                        value={day}
                        {...register("workingDays")}
                        className="w-4 h-4 text-emerald-600 rounded"
                      />
                      <span className="text-sm text-gray-700">
                        {t(`settings.weekdays.${day}`)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </Section>

          <Section
            icon={FiBell}
            title={t("settings.operations.title")}
            description={t("settings.operations.description")}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field
                label={t("settings.operations.lowStockThreshold")}
                hint={t("settings.operations.lowStockHint")}
              >
                <input
                  type="number"
                  min={1}
                  {...register("lowStockThreshold", { min: 1 })}
                  className={inputClass}
                />
              </Field>

              <Field label={t("settings.operations.dateFormat")}>
                <select {...register("dateFormat")} className={inputClass}>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                </select>
              </Field>

              <Field label={t("settings.operations.timeFormat")}>
                <select {...register("timeFormat")} className={inputClass}>
                  <option value="24h">{t("settings.operations.hour24")}</option>
                  <option value="12h">{t("settings.operations.hour12")}</option>
                </select>
              </Field>

              <div className="space-y-3 pt-6">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register("enableEmailNotifications")}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <span className="text-sm text-gray-700">
                    {t("settings.operations.emailNotifications")}
                  </span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register("enableSMSNotifications")}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <span className="text-sm text-gray-700">
                    {t("settings.operations.smsNotifications")}
                  </span>
                </label>
              </div>
            </div>
          </Section>

          <Section
            icon={FiFileText}
            title={t("settings.legal.title")}
            description={t("settings.legal.description")}
          >
            <div className="space-y-6">
              <Field label={t("settings.legal.terms")}>
                <textarea
                  {...register("termsAndConditions")}
                  rows={4}
                  className={`${inputClass} resize-none`}
                />
              </Field>

              <Field label={t("settings.legal.privacy")}>
                <textarea
                  {...register("privacyPolicy")}
                  rows={4}
                  className={`${inputClass} resize-none`}
                />
              </Field>
            </div>
          </Section>
        </fieldset>

        {canEdit && (
          <div className="flex justify-end sticky bottom-4">
            <button
              type="submit"
              disabled={updateSettings.isPending || !isDirty}
              className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50 shadow-lg"
            >
              <FiSave />
              <span>
                {updateSettings.isPending
                  ? t("common.saving")
                  : t("settings.saveButton")}
              </span>
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default SettingsPage;
