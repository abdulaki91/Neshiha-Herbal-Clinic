import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FiX, FiSave, FiChevronDown, FiChevronUp } from "react-icons/fi";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import axiosInstance from "../../lib/axios";

const MedicineForm = ({ medicine = null, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [herbalMode, setHerbalMode] = useState(true);
  const [showOptional, setShowOptional] = useState(false);
  const isEdit = !!medicine;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: medicine || {
      name: "",
      genericName: "",
      strength: "",
      dosageForm: "",
      category: "",
      manufacturer: "",
      supplier: "",
      batchNumber: "",
      storageLocation: "",
      availableQuantity: 0,
      minimumStock: 10,
      expiryDate: "",
      purchasePrice: "",
      sellingPrice: "",
      requiresPrescription: true,
      sideEffects: "",
      contraindications: "",
      instructions: "",
      notes: "",
    },
  });

  const onSubmit = async (data) => {
    try {
      setLoading(true);

      // Clean empty strings to not send them, but keep 0 and false
      const cleaned = Object.fromEntries(
        Object.entries(data).filter(
          ([, v]) => v !== "" && v !== null && v !== undefined,
        ),
      );

      if (isEdit) {
        await axiosInstance.put(`/medicines/${medicine.id}`, cleaned);
        toast.success(t("medicineForm.updateSuccess"));
      } else {
        await axiosInstance.post("/medicines", cleaned);
        toast.success(t("medicineForm.addSuccess"));
      }
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.message || t("medicineForm.saveError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2L4 12l2 2 1-1v6h10v-6l1 1 2-2L12 2z" /></svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                {isEdit ? t("medicineForm.editTitle") : t("medicineForm.addTitle")}
              </h2>
              <p className="text-xs text-gray-500">
                {herbalMode
                  ? t("medicineForm.herbalModeHint")
                  : t("medicineForm.standardModeHint")}
              </p>
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
          {/* Mode Toggle */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <span className="text-lg">🌿</span>
              <span className="text-sm font-medium text-gray-700">
                {t("medicineForm.modeToggleLabel")}
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={herbalMode}
                onChange={(e) => setHerbalMode(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* Herbal Mode — Name only */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("medicineForm.nameLabel")}
            </label>
            <input
              type="text"
              {...register("name", { required: t("medicineForm.nameRequired") })}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-lg ${
                errors.name ? "border-red-500" : "border-gray-300"
              }`}
              placeholder={t("medicineForm.namePlaceholder")}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
            )}
            {herbalMode && (
              <p className="mt-1 text-xs text-gray-400 flex items-center">
                <span className="mr-1">🌿</span>
                {t("medicineForm.autoCodeHint")}
              </p>
            )}
          </div>

          {/* Standard mode — Code field */}
          {!herbalMode && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("medicineForm.codeLabel")}
              </label>
              <input
                type="text"
                {...register("code")}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder={t("medicineForm.codePlaceholder")}
              />
              <p className="mt-1 text-xs text-gray-400">
                {t("medicineForm.codeAutoHint")}
              </p>
            </div>
          )}

          {/* Standard mode — Grid fields */}
          {!herbalMode && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("medicineForm.genericNameLabel")}
                </label>
                <input
                  type="text"
                  {...register("genericName")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder={t("medicineForm.genericNamePlaceholder")}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("medicineForm.categoryLabel")}
                </label>
                <input
                  type="text"
                  {...register("category")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder={t("medicineForm.categoryPlaceholder")}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("medicineForm.strengthLabel")}
                </label>
                <input
                  type="text"
                  {...register("strength")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder={t("medicineForm.strengthPlaceholder")}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("medicineForm.dosageFormLabel")}
                </label>
                <select
                  {...register("dosageForm")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="">{t("medicineForm.dosageFormPlaceholder")}</option>
                  <option value="Tablet">{t("medicineForm.dosageForm.tablet")}</option>
                  <option value="Capsule">{t("medicineForm.dosageForm.capsule")}</option>
                  <option value="Syrup">{t("medicineForm.dosageForm.syrup")}</option>
                  <option value="Powder">{t("medicineForm.dosageForm.powder")}</option>
                  <option value="Extract">{t("medicineForm.dosageForm.extract")}</option>
                  <option value="Tea">{t("medicineForm.dosageForm.tea")}</option>
                  <option value="Oil">{t("medicineForm.dosageForm.oil")}</option>
                  <option value="Cream">{t("medicineForm.dosageForm.cream")}</option>
                  <option value="Tincture">{t("medicineForm.dosageForm.tincture")}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("medicineForm.manufacturerLabel")}
                </label>
                <input
                  type="text"
                  {...register("manufacturer")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("medicineForm.supplierLabel")}
                </label>
                <input
                  type="text"
                  {...register("supplier")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("medicineForm.batchNumberLabel")}
                </label>
                <input
                  type="text"
                  {...register("batchNumber")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("medicineForm.storageLocationLabel")}
                </label>
                <input
                  type="text"
                  {...register("storageLocation")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("medicineForm.availableQuantityLabel")}
                </label>
                <input
                  type="number"
                  {...register("availableQuantity", { min: 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("medicineForm.minimumStockLabel")}
                </label>
                <input
                  type="number"
                  {...register("minimumStock", { min: 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("medicineForm.purchasePriceLabel")}
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register("purchasePrice")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("medicineForm.sellingPriceLabel")}
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register("sellingPrice")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("medicineForm.expiryDateLabel")}
                </label>
                <input
                  type="date"
                  {...register("expiryDate")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="flex items-center space-x-3 pt-6">
                <input
                  type="checkbox"
                  {...register("requiresPrescription")}
                  id="requiresPrescription"
                  className="w-4 h-4 text-emerald-600 rounded"
                />
                <label
                  htmlFor="requiresPrescription"
                  className="text-sm font-medium text-gray-700"
                >
                  {t("medicineForm.requiresPrescriptionLabel")}
                </label>
              </div>
            </div>
          )}

          {/* Herbal Mode — Optional details expandable */}
          {herbalMode && (
            <div>
              <button
                type="button"
                onClick={() => setShowOptional(!showOptional)}
                className="flex items-center space-x-2 text-sm text-gray-500 hover:text-emerald-600 transition"
              >
                {showOptional ? (
                  <FiChevronUp className="w-4 h-4" />
                ) : (
                  <FiChevronDown className="w-4 h-4" />
                )}
                <span>{t("medicineForm.optionalDetails")}</span>
                <span className="text-xs text-gray-400">
                  {t("medicineForm.optionalDetailsHint")}
                </span>
              </button>

              {showOptional && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t("medicineForm.genericNameLabel")}
                    </label>
                    <input
                      type="text"
                      {...register("genericName")}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t("medicineForm.categoryLabel")}
                    </label>
                    <input
                      type="text"
                      {...register("category")}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t("medicineForm.strengthLabel")}
                    </label>
                    <input
                      type="text"
                      {...register("strength")}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t("medicineForm.dosageFormLabel")}
                    </label>
                    <select
                      {...register("dosageForm")}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none text-sm"
                    >
                      <option value="">{t("medicineForm.dosageFormPlaceholder")}</option>
                      <option value="Tablet">{t("medicineForm.dosageForm.tablet")}</option>
                      <option value="Capsule">{t("medicineForm.dosageForm.capsule")}</option>
                      <option value="Syrup">{t("medicineForm.dosageForm.syrup")}</option>
                      <option value="Powder">{t("medicineForm.dosageForm.powder")}</option>
                      <option value="Extract">{t("medicineForm.dosageForm.extract")}</option>
                      <option value="Tea">{t("medicineForm.dosageForm.tea")}</option>
                      <option value="Oil">{t("medicineForm.dosageForm.oil")}</option>
                      <option value="Cream">{t("medicineForm.dosageForm.cream")}</option>
                      <option value="Tincture">{t("medicineForm.dosageForm.tincture")}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t("medicineForm.availableQuantityLabel")}
                    </label>
                    <input
                      type="number"
                      {...register("availableQuantity", { min: 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t("medicineForm.sellingPriceLabel")}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      {...register("sellingPrice")}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none text-sm"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t("medicineForm.instructionsLabel")}
                    </label>
                    <textarea
                      {...register("instructions")}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none text-sm resize-none"
                      placeholder={t("medicineForm.instructionsPlaceholder")}
                    ></textarea>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t("medicineForm.notesLabel")}
                    </label>
                    <textarea
                      {...register("notes")}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none text-sm resize-none"
                      placeholder={t("medicineForm.notesPlaceholder")}
                    ></textarea>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Standard mode — Textareas */}
          {!herbalMode && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("medicineForm.instructionsLabel")}
                </label>
                <textarea
                  {...register("instructions")}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                  placeholder={t("medicineForm.instructionsPlaceholderAlt")}
                ></textarea>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("medicineForm.sideEffectsLabel")}
                  </label>
                  <textarea
                    {...register("sideEffects")}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                  ></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("medicineForm.contraindicationsLabel")}
                  </label>
                  <textarea
                    {...register("contraindications")}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                  ></textarea>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("medicineForm.notesLabel")}
                </label>
                <textarea
                  {...register("notes")}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                ></textarea>
              </div>
            </>
          )}

          {/* Submit */}
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
              disabled={loading}
              className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50 shadow-md"
            >
              <FiSave />
              <span>{loading ? t("medicineForm.saving") : isEdit ? t("medicineForm.updateButton") : t("medicineForm.addButton")}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MedicineForm;
