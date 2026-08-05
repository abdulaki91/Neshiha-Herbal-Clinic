import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { FiX, FiSave, FiMessageSquare, FiUploadCloud } from "react-icons/fi";
import toast from "react-hot-toast";
import { useCreateTestimonial, useUpdateTestimonial } from "../../hooks/useTestimonials";
import TranslatableInput from "./TranslatableInput";

const backendBase = (import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1").replace(
  "/api/v1",
  "",
);

const TestimonialForm = ({ item = null, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const isEdit = !!item;
  const fileInputRef = useRef(null);
  const [preview, setPreview] = useState(item?.clientPhoto ? `${backendBase}/${item.clientPhoto}` : null);

  const createMutation = useCreateTestimonial();
  const updateMutation = useUpdateTestimonial();
  const saving = createMutation.isPending || updateMutation.isPending;

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      clientName: item?.clientName || "",
      company: item?.company || "",
      rating: item?.rating ?? 5,
      status: item?.status || "draft",
      role: { en: "", am: "", om: "", ar: "", ...item?.role },
      text: { en: "", am: "", om: "", ar: "", ...item?.text },
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

  const onSubmit = async (data) => {
    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id: item.id, ...data });
        toast.success(t("contentAdmin.testimonials.updateSuccess"));
      } else {
        await createMutation.mutateAsync(data);
        toast.success(t("contentAdmin.testimonials.createSuccess"));
      }
      onSuccess?.();
    } catch (error) {
      toast.error(error.response?.data?.message || t("contentAdmin.testimonials.saveError"));
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
              <FiMessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                {isEdit
                  ? t("contentAdmin.testimonials.editTitle")
                  : t("contentAdmin.testimonials.addTitle")}
              </h2>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition">
            <FiX className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          <div className="flex items-center gap-4">
            {preview ? (
              <img
                src={preview}
                alt=""
                className="w-16 h-16 rounded-full object-cover border border-gray-200"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                <FiUploadCloud className="w-6 h-6" />
              </div>
            )}
            <div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
              >
                {t("contentAdmin.common.uploadPhoto")}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("contentAdmin.testimonials.clientName")} *
              </label>
              <input
                type="text"
                {...register("clientName", {
                  required: t("contentAdmin.common.requiredField"),
                })}
                className={inputClass(errors.clientName)}
              />
              {errors.clientName && (
                <p className="mt-1 text-xs text-red-500">{errors.clientName.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("contentAdmin.testimonials.company")}
              </label>
              <input type="text" {...register("company")} className={inputClass()} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("contentAdmin.testimonials.rating")}
              </label>
              <select {...register("rating")} className={inputClass()}>
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>
                    {"★".repeat(n)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("contentAdmin.common.status")}
              </label>
              <select {...register("status")} className={inputClass()}>
                <option value="draft">{t("contentAdmin.common.draft")}</option>
                <option value="published">{t("contentAdmin.common.published")}</option>
              </select>
            </div>
          </div>

          <TranslatableInput
            register={register}
            name="role"
            label={t("contentAdmin.testimonials.role")}
          />
          <TranslatableInput
            register={register}
            name="text"
            label={t("contentAdmin.testimonials.text")}
            multiline
            rows={4}
            required
            error={errors.text?.en}
          />

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

export default TestimonialForm;
