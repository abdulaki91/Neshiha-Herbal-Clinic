import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { FiX, FiSave, FiImage, FiUploadCloud } from "react-icons/fi";
import toast from "react-hot-toast";
import { useCreateBanner, useUpdateBanner } from "../../hooks/useBanners";
import TranslatableInput from "./TranslatableInput";
import { BOOKING_CTA_LINK } from "../BannerStrip";

const backendBase = (import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1").replace(
  "/api/v1",
  "",
);

// The API stores full ISO timestamps; <input type="date"> wants YYYY-MM-DD
const toDateInput = (value) => (value ? value.slice(0, 10) : "");

const BannerForm = ({ item = null, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const isEdit = !!item;
  const fileInputRef = useRef(null);
  const [preview, setPreview] = useState(item?.image ? `${backendBase}/${item.image}` : null);

  const createMutation = useCreateBanner();
  const updateMutation = useUpdateBanner();
  const saving = createMutation.isPending || updateMutation.isPending;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      ctaLink: item?.ctaLink || "",
      startDate: toDateInput(item?.startDate),
      endDate: toDateInput(item?.endDate),
      status: item?.status || "draft",
      title: { en: "", am: "", om: "", ar: "", ...item?.title },
      subtitle: { en: "", am: "", om: "", ar: "", ...item?.subtitle },
      ctaText: { en: "", am: "", om: "", ar: "", ...item?.ctaText },
    },
  });

  useEffect(() => {
    return () => {
      if (preview && !preview.startsWith("http")) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setValue("imageFile", file);
    setPreview(URL.createObjectURL(file));
  };

  // The booking form is an in-page modal, not a real URL — offer it as a
  // one-click choice instead of leaving admins to guess a link for it
  // (this is exactly what went wrong before: a banner's button was typed
  // in as "/portal", which is the staff login page, not the booking form).
  const ctaLinkValue = watch("ctaLink");
  const isBookingLink = ctaLinkValue === BOOKING_CTA_LINK;

  const onSubmit = async (data) => {
    const payload = {
      ...data,
      startDate: data.startDate || null,
      endDate: data.endDate || null,
    };
    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id: item.id, ...payload });
        toast.success(t("contentAdmin.banners.updateSuccess"));
      } else {
        await createMutation.mutateAsync(payload);
        toast.success(t("contentAdmin.banners.createSuccess"));
      }
      onSuccess?.();
    } catch (error) {
      toast.error(error.response?.data?.message || t("contentAdmin.banners.saveError"));
    }
  };

  const inputClass = "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-lg flex items-center justify-center">
              <FiImage className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">
              {isEdit ? t("contentAdmin.banners.editTitle") : t("contentAdmin.banners.addTitle")}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition">
            <FiX className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          <div>
            {preview ? (
              <img src={preview} alt="" className="w-full h-32 rounded-lg object-cover border border-gray-200 mb-3" />
            ) : (
              <div className="w-full h-32 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 mb-3">
                <FiUploadCloud className="w-8 h-8" />
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
            >
              {t("contentAdmin.common.uploadImage")}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          </div>

          <TranslatableInput
            register={register}
            name="title"
            label={t("contentAdmin.banners.bannerTitle")}
            required
            error={errors.title?.en}
          />
          <TranslatableInput register={register} name="subtitle" label={t("contentAdmin.banners.subtitleLabel")} />
          <TranslatableInput register={register} name="ctaText" label={t("contentAdmin.banners.ctaText")} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  {t("contentAdmin.banners.ctaLink")}
                </label>
                <label className="flex items-center gap-1.5 text-xs text-emerald-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isBookingLink}
                    onChange={(e) =>
                      setValue("ctaLink", e.target.checked ? BOOKING_CTA_LINK : "")
                    }
                    className="w-3.5 h-3.5 text-emerald-600 rounded"
                  />
                  {t("contentAdmin.banners.linkToBookingForm")}
                </label>
              </div>
              <input
                type="text"
                {...register("ctaLink")}
                disabled={isBookingLink}
                className={`${inputClass} disabled:bg-gray-50 disabled:text-gray-400`}
                placeholder="https://... or #services"
              />
              {isBookingLink && (
                <p className="mt-1 text-xs text-gray-400">
                  {t("contentAdmin.banners.linkToBookingFormHint")}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("contentAdmin.common.status")}
              </label>
              <select {...register("status")} className={inputClass}>
                <option value="draft">{t("contentAdmin.common.draft")}</option>
                <option value="published">{t("contentAdmin.common.published")}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("contentAdmin.banners.startDate")}
              </label>
              <input type="date" {...register("startDate")} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("contentAdmin.banners.endDate")}
              </label>
              <input type="date" {...register("endDate")} className={inputClass} />
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
              className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50 shadow-md"
            >
              <FiSave />
              <span>{saving ? t("common.saving") : t("common.save")}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BannerForm;
