import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { FiX, FiSave, FiAward, FiUploadCloud, FiTrash2 } from "react-icons/fi";
import toast from "react-hot-toast";
import { useCreateSuccessStory, useUpdateSuccessStory } from "../../hooks/useSuccessStories";
import TranslatableInput from "./TranslatableInput";

const backendBase = (import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1").replace(
  "/api/v1",
  "",
);

const SuccessStoryForm = ({ item = null, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const isEdit = !!item;
  const fileInputRef = useRef(null);
  const [existingImages, setExistingImages] = useState(item?.images || []);
  const [newPreviews, setNewPreviews] = useState([]);

  const createMutation = useCreateSuccessStory();
  const updateMutation = useUpdateSuccessStory();
  const saving = createMutation.isPending || updateMutation.isPending;

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      category: item?.category || "",
      featured: item?.featured || false,
      status: item?.status || "draft",
      title: { en: "", am: "", om: "", ar: "", ...item?.title },
      description: { en: "", am: "", om: "", ar: "", ...item?.description },
      projectDetails: { en: "", am: "", om: "", ar: "", ...item?.projectDetails },
      outcomes: { en: "", am: "", om: "", ar: "", ...item?.outcomes },
    },
  });

  useEffect(() => {
    return () => newPreviews.forEach((p) => URL.revokeObjectURL(p.url));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilesChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setValue("imagesFiles", files);
    setNewPreviews(files.map((f) => ({ url: URL.createObjectURL(f) })));
  };

  const removeExistingImage = (path) => {
    setExistingImages((prev) => prev.filter((p) => p !== path));
  };

  const onSubmit = async (data) => {
    // If new files were picked they replace the array entirely (server
    // side); otherwise keep whatever the admin left in existingImages.
    const payload = { ...data };
    if (!payload.imagesFiles) payload.images = existingImages;

    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id: item.id, ...payload });
        toast.success(t("contentAdmin.successStories.updateSuccess"));
      } else {
        await createMutation.mutateAsync(payload);
        toast.success(t("contentAdmin.successStories.createSuccess"));
      }
      onSuccess?.();
    } catch (error) {
      toast.error(error.response?.data?.message || t("contentAdmin.successStories.saveError"));
    }
  };

  const inputClass = "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-lg flex items-center justify-center">
              <FiAward className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">
              {isEdit
                ? t("contentAdmin.successStories.editTitle")
                : t("contentAdmin.successStories.addTitle")}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition">
            <FiX className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("contentAdmin.successStories.images")}
            </label>
            <div className="flex flex-wrap gap-3 mb-3">
              {existingImages.map((path) => (
                <div key={path} className="relative">
                  <img
                    src={`${backendBase}/${path}`}
                    alt=""
                    className="w-16 h-16 rounded-lg object-cover border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => removeExistingImage(path)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center"
                  >
                    <FiTrash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {newPreviews.map((p, i) => (
                <img
                  key={i}
                  src={p.url}
                  alt=""
                  className="w-16 h-16 rounded-lg object-cover border border-emerald-300"
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
            >
              <FiUploadCloud className="w-4 h-4" />
              {t("contentAdmin.common.uploadImage")}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFilesChange}
              className="hidden"
            />
          </div>

          <TranslatableInput
            register={register}
            name="title"
            label={t("contentAdmin.successStories.storyTitle")}
            required
            error={errors.title?.en}
          />
          <TranslatableInput
            register={register}
            name="description"
            label={t("contentAdmin.successStories.description")}
            multiline
          />
          <TranslatableInput
            register={register}
            name="projectDetails"
            label={t("contentAdmin.successStories.projectDetails")}
            multiline
          />
          <TranslatableInput
            register={register}
            name="outcomes"
            label={t("contentAdmin.successStories.outcomes")}
            multiline
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("contentAdmin.successStories.category")}
              </label>
              <input type="text" {...register("category")} className={inputClass} />
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
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" {...register("featured")} className="w-4 h-4 text-emerald-600 rounded" />
                <span className="text-sm text-gray-700">{t("contentAdmin.successStories.featured")}</span>
              </label>
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

export default SuccessStoryForm;
