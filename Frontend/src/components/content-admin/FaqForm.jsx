import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { FiX, FiSave, FiHelpCircle } from "react-icons/fi";
import toast from "react-hot-toast";
import { useCreateFaq, useUpdateFaq } from "../../hooks/useFaqs";
import TranslatableInput from "./TranslatableInput";

const FaqForm = ({ item = null, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const isEdit = !!item;

  const createMutation = useCreateFaq();
  const updateMutation = useUpdateFaq();
  const saving = createMutation.isPending || updateMutation.isPending;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      category: item?.category || "",
      status: item?.status || "draft",
      question: { en: "", am: "", om: "", ar: "", ...item?.question },
      answer: { en: "", am: "", om: "", ar: "", ...item?.answer },
    },
  });

  const onSubmit = async (data) => {
    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id: item.id, ...data });
        toast.success(t("contentAdmin.faqs.updateSuccess"));
      } else {
        await createMutation.mutateAsync(data);
        toast.success(t("contentAdmin.faqs.createSuccess"));
      }
      onSuccess?.();
    } catch (error) {
      toast.error(error.response?.data?.message || t("contentAdmin.faqs.saveError"));
    }
  };

  const inputClass = "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-lg flex items-center justify-center">
              <FiHelpCircle className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">
              {isEdit ? t("contentAdmin.faqs.editTitle") : t("contentAdmin.faqs.addTitle")}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition">
            <FiX className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          <TranslatableInput
            register={register}
            name="question"
            label={t("contentAdmin.faqs.question")}
            required
            error={errors.question?.en}
          />
          <TranslatableInput
            register={register}
            name="answer"
            label={t("contentAdmin.faqs.answer")}
            multiline
            rows={4}
            required
            error={errors.answer?.en}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("contentAdmin.faqs.category")}
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

export default FaqForm;
