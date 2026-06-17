import { useState } from "react";
import { FiX, FiSave } from "react-icons/fi";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import axiosInstance from "../../lib/axios";

const MedicineForm = ({ medicine = null, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const isEdit = !!medicine;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: medicine || {
      name: "",
      code: "",
      genericName: "",
      strength: "",
      dosageForm: "",
      category: "",
      manufacturer: "",
      availableQuantity: 0,
      minimumStock: 10,
      expiryDate: "",
      requiresPrescription: true,
      instructions: "",
    },
  });

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      if (isEdit) {
        await axiosInstance.put(`/medicines/${medicine.id}`, data);
        toast.success("Medicine updated successfully");
      } else {
        await axiosInstance.post("/medicines", data);
        toast.success("Medicine added successfully");
      }
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save medicine");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-gray-800">
            {isEdit ? "Edit Medicine" : "Add New Medicine"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <FiX className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Medicine Name *
              </label>
              <input
                type="text"
                {...register("name", { required: "Name is required" })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none ${
                  errors.name ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="e.g. Garlic Extract"
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
              )}
            </div>

            {/* Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Medicine Code *
              </label>
              <input
                type="text"
                {...register("code", { required: "Code is required" })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none ${
                  errors.code ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="e.g. HERB-001"
              />
              {errors.code && (
                <p className="mt-1 text-xs text-red-500">{errors.code.message}</p>
              )}
            </div>

            {/* Generic Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Generic Name
              </label>
              <input
                type="text"
                {...register("genericName")}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder="e.g. Allium sativum"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <input
                type="text"
                {...register("category")}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder="e.g. Herbal Supplement"
              />
            </div>

            {/* Strength */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Strength
              </label>
              <input
                type="text"
                {...register("strength")}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder="e.g. 500mg"
              />
            </div>

            {/* Dosage Form */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dosage Form
              </label>
              <select
                {...register("dosageForm")}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option value="">Select Form</option>
                <option value="Tablet">Tablet</option>
                <option value="Capsule">Capsule</option>
                <option value="Syrup">Syrup</option>
                <option value="Powder">Powder</option>
                <option value="Extract">Extract</option>
                <option value="Tea">Tea</option>
                <option value="Oil">Oil</option>
              </select>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Available Quantity
              </label>
              <input
                type="number"
                {...register("availableQuantity", { min: 0 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            {/* Expiry Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expiry Date
              </label>
              <input
                type="date"
                {...register("expiryDate")}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          {/* Instructions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Instructions
            </label>
            <textarea
              {...register("instructions")}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
              placeholder="How to prepare or use this medicine..."
            ></textarea>
          </div>

          {/* Submit */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition disabled:opacity-50"
            >
              <FiSave />
              <span>{loading ? "Saving..." : isEdit ? "Update" : "Save"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MedicineForm;
