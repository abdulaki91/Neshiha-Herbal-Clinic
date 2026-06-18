import { useState, useEffect } from "react";
import { FiPlus, FiTrash2, FiSave, FiPackage } from "react-icons/fi";
import toast from "react-hot-toast";
import axiosInstance from "../../lib/axios";
import useAuthStore from "../../store/authStore";
import { useTranslation } from "react-i18next";

const HerbalMedicineForm = ({ visitId, patientId, onSave }) => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [medicines, setMedicines] = useState();
  console.log(medicines);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  const [formData, setFormData] = useState({
    medicineId: "",
    medicineName: "",
    unitPrice: "",
    quantity: "",
    instructions: "",
  });

  useEffect(() => {
    fetchMedicines();
    fetchPrescriptions();
  }, [visitId]);

  const fetchMedicines = async () => {
    try {
      const response = await axiosInstance.get("/medicines", {
        params: { status: "available", limit: 1000 },
      });
      console.log(response.data);

      setMedicines(response.data?.data || response.data || []);
    } catch {
      toast.error(t("herbalMedicine.fetchError"));
    } finally {
      setLoading(false);
    }
  };

  const fetchPrescriptions = async () => {
    try {
      const response = await axiosInstance.get("/prescriptions", {
        params: { visitId },
      });
      setPrescriptions(response.data?.data || response.data || []);
    } catch {
      // silent
    }
  };

  const handleMedicineSelect = (medicineId) => {
    const selected = medicines.find((m) => m.id === medicineId);
    if (selected) {
      setFormData({
        ...formData,
        medicineId: selected.id,
        medicineName: selected.name,
        unitPrice: selected.sellingPrice || "",
      });
    }
  };

  const totalAmount =
    formData.unitPrice && formData.quantity
      ? (parseFloat(formData.unitPrice) * parseInt(formData.quantity)).toFixed(2)
      : "0.00";

  const handleAddPrescription = async () => {
    if (!formData.medicineId) {
      toast.error(t("herbalMedicine.selectError"));
      return;
    }
    if (!formData.quantity || parseInt(formData.quantity) <= 0) {
      toast.error(t("herbalMedicine.quantityError"));
      return;
    }

    try {
      await axiosInstance.post("/prescriptions", {
        visitId,
        patientId,
        medicineId: formData.medicineId,
        doctorId: user.id,
        quantity: parseInt(formData.quantity),
        unitPrice: parseFloat(formData.unitPrice) || 0,
        totalAmount: parseFloat(totalAmount),
        dosage: "As prescribed",
        frequency: "As directed",
        route: "oral",
        instructions: formData.instructions,
        prescribedDate: new Date().toISOString(),
      });

      toast.success(t("herbalMedicine.prescribeSuccess"));

      setFormData({
        medicineId: "",
        medicineName: "",
        unitPrice: "",
        quantity: "",
        instructions: "",
      });
      setShowAddForm(false);
      fetchPrescriptions();
      onSave && onSave();
    } catch (error) {
      toast.error(error.response?.data?.message || t("herbalMedicine.addError"));
    }
  };

  const handleCancelPrescription = async (prescriptionId) => {
    if (!confirm(t("herbalMedicine.cancelConfirm"))) return;

    try {
      await axiosInstance.patch(`/prescriptions/${prescriptionId}/stop`, {
        reason: "cancelled",
      });
      toast.success(t("herbalMedicine.cancelSuccess"));
      fetchPrescriptions();
    } catch {
      toast.error(t("herbalMedicine.cancelError"));
    }
  };

  if (loading) {
    return <div className="text-center py-8">{t("herbalMedicine.loading")}</div>;
  }

  return (
    <div className="space-y-6">
      {!showAddForm && (
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
        >
          <FiPlus />
          <span>{t("herbalMedicine.addButton")}</span>
        </button>
      )}

      {showAddForm && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-800">
              {t("herbalMedicine.prescribeTitle")}
            </h4>
            <button
              onClick={() => setShowAddForm(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              {t("common.cancel")}
            </button>
          </div>

          {/* Medicine Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("herbalMedicine.selectLabel")}
            </label>
            <select
              value={formData.medicineId}
              onChange={(e) => handleMedicineSelect(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">{t("herbalMedicine.selectPlaceholder")}</option>
              {medicines.map((medicine) => (
                <option key={medicine.id} value={medicine.id}>
                  {medicine.name}
                  {medicine.strength ? ` - ${medicine.strength}` : ""}
                  {medicine.sellingPrice ? ` (${medicine.sellingPrice} ${t("common.currency.etb")})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Price and Quantity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("herbalMedicine.unitPriceLabel")}
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.unitPrice}
                onChange={(e) =>
                  setFormData({ ...formData, unitPrice: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                placeholder={t("herbalMedicine.unitPricePlaceholder")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("herbalMedicine.quantityLabel")}
              </label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({ ...formData, quantity: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                placeholder={t("herbalMedicine.quantityPlaceholder")}
              />
            </div>
          </div>

          {/* Total */}
          <div className="bg-emerald-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-emerald-700">
                {t("herbalMedicine.totalLabel")}
              </span>
              <span className="text-2xl font-bold text-emerald-900">
                {totalAmount} {t("common.currency.etb")}
              </span>
            </div>
          </div>

          {/* Instructions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("herbalMedicine.instructionsLabel")}
            </label>
            <textarea
              value={formData.instructions}
              onChange={(e) =>
                setFormData({ ...formData, instructions: e.target.value })
              }
              rows={2}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              placeholder={t("herbalMedicine.instructionsPlaceholder")}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
            >
              {t("common.cancel")}
            </button>
            <button
              onClick={handleAddPrescription}
              className="flex items-center space-x-2 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
            >
              <FiSave />
              <span>{t("herbalMedicine.saveButton")}</span>
            </button>
          </div>
        </div>
      )}

      {/* Prescriptions List */}
      {prescriptions.length > 0 ? (
        <div className="space-y-3">
          <h4 className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
            <FiPackage className="text-emerald-600" />
            <span>{t("herbalMedicine.listTitle")}</span>
          </h4>
          {prescriptions.map((prescription) => (
            <div
              key={prescription.id}
              className={`border rounded-lg p-4 ${
                prescription.status === "pending"
                  ? "bg-yellow-50 border-yellow-200"
                  : prescription.status === "paid"
                    ? "bg-green-50 border-green-200"
                    : "bg-gray-50 border-gray-200"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h5 className="font-semibold text-gray-800">
                    {prescription.medicine?.name}
                  </h5>
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                    <span>
                      {prescription.quantity} x{" "}
                      {parseFloat(prescription.unitPrice || 0).toFixed(2)} {t("common.currency.etb")}
                    </span>
                    <span className="font-bold text-emerald-700">
                      {t("herbalMedicine.totalPrefix")}
                      {parseFloat(prescription.totalAmount || 0).toFixed(2)} {t("common.currency.etb")}
                    </span>
                  </div>
                  {prescription.instructions && (
                    <p className="text-xs text-gray-500 mt-1">
                      {prescription.instructions}
                    </p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <span
                    className={`px-2 py-1 text-xs rounded-full font-medium ${
                      prescription.status === "pending"
                        ? "bg-yellow-200 text-yellow-800"
                        : prescription.status === "paid"
                          ? "bg-green-200 text-green-800"
                          : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {t(`prescription.status.${prescription.status}`)}
                  </span>
                  {prescription.status === "pending" && (
                    <button
                      onClick={() =>
                        handleCancelPrescription(prescription.id)
                      }
                      className="text-red-600 hover:text-red-700"
                    >
                      <FiTrash2 />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <FiPackage className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>{t("herbalMedicine.emptyList")}</p>
        </div>
      )}
    </div>
  );
};

export default HerbalMedicineForm;
