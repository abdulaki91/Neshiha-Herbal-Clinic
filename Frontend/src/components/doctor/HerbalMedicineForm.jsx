import { useState, useEffect } from "react";
import { FiPlus, FiTrash2, FiSave, FiPackage } from "react-icons/fi";
import toast from "react-hot-toast";
import axiosInstance from "../../lib/axios";
import useAuthStore from "../../store/authStore";

const HerbalMedicineForm = ({ visitId, patientId, onSave }) => {
  const { user } = useAuthStore();
  const [medicines, setMedicines] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [dispensedMedicines, setDispensedMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form state for new prescription
  const [formData, setFormData] = useState({
    medicineId: "",
    medicineName: "",
    dosage: "",
    dosageAmount: "",
    dosageUnit: "gram",
    frequency: "twice-daily",
    frequencyDetail: "",
    route: "oral",
    duration: "",
    durationUnit: "days",
    quantity: "",
    instructions: "",
    reason: "",
  });

  useEffect(() => {
    fetchMedicines();
    fetchPrescriptions();
    fetchDispensedMedicines();
  }, [visitId]);

  const fetchMedicines = async () => {
    try {
      const response = await axiosInstance.get("/medicines", {
        params: { status: "available", limit: 1000 },
      });
      setMedicines(response.data.medicines || []);
    } catch (error) {
      toast.error("Failed to fetch medicines");
    } finally {
      setLoading(false);
    }
  };

  const fetchPrescriptions = async () => {
    try {
      const response = await axiosInstance.get(`/prescriptions`, {
        params: { visitId },
      });
      setPrescriptions(response.data.prescriptions || []);
    } catch (error) {
      console.error("Failed to fetch prescriptions:", error);
    }
  };

  const fetchDispensedMedicines = async () => {
    try {
      const response = await axiosInstance.get(`/medicines/dispenses`, {
        params: { visitId },
      });
      setDispensedMedicines(response.data.dispenses || []);
    } catch (error) {
      console.error("Failed to fetch dispensed medicines:", error);
    }
  };

  const handleMedicineSelect = (medicineId) => {
    const selected = medicines.find((m) => m.id === medicineId);
    if (selected) {
      setFormData({
        ...formData,
        medicineId: selected.id,
        medicineName: selected.name,
      });
    }
  };

  const handleAddPrescription = async () => {
    // Validation
    if (!formData.medicineId) {
      toast.error("Please select a herbal medicine");
      return;
    }
    if (!formData.dosageAmount) {
      toast.error("Please enter dosage amount");
      return;
    }
    if (!formData.quantity) {
      toast.error("Please enter quantity");
      return;
    }

    try {
      const dosage = `${formData.dosageAmount}${formData.dosageUnit}`;
      const frequency =
        formData.frequency === "custom"
          ? formData.frequencyDetail
          : formData.frequency.replace("-", " ");
      const duration = `${formData.duration} ${formData.durationUnit}`;

      const prescriptionData = {
        visitId,
        patientId,
        medicineId: formData.medicineId,
        doctorId: user.id,
        dosage,
        frequency,
        route: formData.route,
        duration,
        quantity: parseInt(formData.quantity),
        instructions: formData.instructions,
        reason: formData.reason,
        prescribedDate: new Date().toISOString(),
      };

      // Create prescription
      await axiosInstance.post("/prescriptions", prescriptionData);

      toast.success("Medicine prescribed successfully");

      // Reset form
      setFormData({
        medicineId: "",
        medicineName: "",
        dosage: "",
        dosageAmount: "",
        dosageUnit: "gram",
        frequency: "twice-daily",
        frequencyDetail: "",
        route: "oral",
        duration: "",
        durationUnit: "days",
        quantity: "",
        instructions: "",
        reason: "",
        dispenseNow: true,
      });

      setShowAddForm(false);
      fetchPrescriptions();
      fetchDispensedMedicines();
      onSave && onSave();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add medicine");
    }
  };

  const handleDeletePrescription = async (prescriptionId) => {
    if (!confirm("Are you sure you want to delete this prescription?")) return;

    try {
      await axiosInstance.delete(`/prescriptions/${prescriptionId}`);
      toast.success("Prescription deleted");
      fetchPrescriptions();
      fetchDispensedMedicines();
    } catch (error) {
      toast.error("Failed to delete prescription");
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading medicines...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Add Medicine Button */}
      {!showAddForm && (
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
        >
          <FiPlus />
          <span>Add Herbal Medicine</span>
        </button>
      )}

      {/* Add Medicine Form */}
      {showAddForm && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-800">
              Prescribe Herbal Medicine
            </h4>
            <button
              onClick={() => setShowAddForm(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>

          {/* Medicine Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Herbal Medicine *
            </label>
            <select
              value={formData.medicineId}
              onChange={(e) => handleMedicineSelect(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="">-- Select Medicine --</option>
              {medicines.map((medicine) => (
                <option key={medicine.id} value={medicine.id}>
                  {medicine.name} - {medicine.strength} (Price:{" "}
                  {medicine.sellingPrice} ETB | Available:{" "}
                  {medicine.availableQuantity} {medicine.dosageForm})
                </option>
              ))}
            </select>
          </div>

          {/* Dosage */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dosage Amount *
              </label>
              <input
                type="number"
                value={formData.dosageAmount}
                onChange={(e) =>
                  setFormData({ ...formData, dosageAmount: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="e.g., 10, 50, 100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unit *
              </label>
              <select
                value={formData.dosageUnit}
                onChange={(e) =>
                  setFormData({ ...formData, dosageUnit: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="gram">Gram (g)</option>
                <option value="mg">Milligram (mg)</option>
                <option value="ml">Milliliter (ml)</option>
                <option value="tsp">Teaspoon</option>
                <option value="tbsp">Tablespoon</option>
                <option value="cup">Cup</option>
                <option value="piece">Piece(s)</option>
              </select>
            </div>
          </div>

          {/* Frequency */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Frequency *
            </label>
            <select
              value={formData.frequency}
              onChange={(e) =>
                setFormData({ ...formData, frequency: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="once-daily">Once daily</option>
              <option value="twice-daily">Twice daily</option>
              <option value="three-times-daily">Three times daily</option>
              <option value="four-times-daily">Four times daily</option>
              <option value="every-4-hours">Every 4 hours</option>
              <option value="every-6-hours">Every 6 hours</option>
              <option value="every-8-hours">Every 8 hours</option>
              <option value="every-12-hours">Every 12 hours</option>
              <option value="before-meals">Before meals</option>
              <option value="after-meals">After meals</option>
              <option value="at-bedtime">At bedtime</option>
              <option value="as-needed">As needed</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          {formData.frequency === "custom" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom Frequency
              </label>
              <input
                type="text"
                value={formData.frequencyDetail}
                onChange={(e) =>
                  setFormData({ ...formData, frequencyDetail: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Describe the frequency..."
              />
            </div>
          )}

          {/* Route */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Route of Administration *
            </label>
            <select
              value={formData.route}
              onChange={(e) =>
                setFormData({ ...formData, route: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="oral">Oral (by mouth)</option>
              <option value="topical">Topical (apply to skin)</option>
              <option value="inhalation">Inhalation (breathe in)</option>
              <option value="sublingual">Sublingual (under tongue)</option>
              <option value="rectal">Rectal</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Duration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration *
              </label>
              <input
                type="number"
                value={formData.duration}
                onChange={(e) =>
                  setFormData({ ...formData, duration: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="e.g., 7, 14, 30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration Unit
              </label>
              <select
                value={formData.durationUnit}
                onChange={(e) =>
                  setFormData({ ...formData, durationUnit: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="days">Days</option>
                <option value="weeks">Weeks</option>
                <option value="months">Months</option>
              </select>
            </div>
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Total Quantity to Dispense *
            </label>
            <input
              type="number"
              value={formData.quantity}
              onChange={(e) =>
                setFormData({ ...formData, quantity: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Total quantity"
            />
          </div>

          {/* Reason for Prescription */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Prescription
            </label>
            <input
              type="text"
              value={formData.reason}
              onChange={(e) =>
                setFormData({ ...formData, reason: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="e.g., Pain relief, Blood pressure, etc."
            />
          </div>

          {/* Instructions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Special Instructions
            </label>
            <textarea
              value={formData.instructions}
              onChange={(e) =>
                setFormData({ ...formData, instructions: e.target.value })
              }
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Special instructions for the patient (e.g., take with food, avoid alcohol, etc.)"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleAddPrescription}
              className="flex items-center space-x-2 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
            >
              <FiSave />
              <span>Save Prescription</span>
            </button>
          </div>
        </div>
      )}

      {/* Dispensed Medicines List */}
      {dispensedMedicines.length > 0 && (
        <div>
          <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2">
            <FiPackage className="text-emerald-600" />
            <span>Dispensed Medicines</span>
          </h4>
          <div className="space-y-3">
            {dispensedMedicines.map((dispense) => (
              <div
                key={dispense.id}
                className="bg-green-50 border border-green-200 rounded-lg p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h5 className="font-semibold text-gray-800 mb-1">
                      {dispense.medicine?.name}
                    </h5>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Dosage:</span>{" "}
                        {dispense.dosage}
                      </div>
                      <div>
                        <span className="font-medium">Frequency:</span>{" "}
                        {dispense.frequency}
                      </div>
                      <div>
                        <span className="font-medium">Route:</span>{" "}
                        {dispense.route}
                      </div>
                      <div>
                        <span className="font-medium">Duration:</span>{" "}
                        {dispense.duration}
                      </div>
                      <div>
                        <span className="font-medium">Quantity:</span>{" "}
                        {dispense.quantity}
                      </div>
                      <div className="md:col-span-3">
                        <span className="font-medium">Dispensed:</span>{" "}
                        {new Date(dispense.dispensedDate).toLocaleDateString()}{" "}
                        at {dispense.dispensedTime}
                      </div>
                    </div>
                    {dispense.instructions && (
                      <p className="mt-2 text-sm text-gray-700">
                        <span className="font-medium">Instructions:</span>{" "}
                        {dispense.instructions}
                      </p>
                    )}
                    {dispense.reason && (
                      <p className="mt-1 text-sm text-gray-700">
                        <span className="font-medium">Reason:</span>{" "}
                        {dispense.reason}
                      </p>
                    )}
                  </div>
                  <span className="px-3 py-1 bg-green-600 text-white text-xs rounded-full">
                    Dispensed
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Prescribed but Not Dispensed */}
      {prescriptions.filter((p) => p.status === "pending").length > 0 && (
        <div>
          <h4 className="text-lg font-semibold text-gray-800 mb-4">
            Pending Prescriptions
          </h4>
          <div className="space-y-3">
            {prescriptions
              .filter((p) => p.status === "pending")
              .map((prescription) => (
                <div
                  key={prescription.id}
                  className="bg-yellow-50 border border-yellow-200 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h5 className="font-semibold text-gray-800 mb-1">
                        {prescription.medicine?.name}
                      </h5>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Dosage:</span>{" "}
                          {prescription.dosage}
                        </div>
                        <div>
                          <span className="font-medium">Frequency:</span>{" "}
                          {prescription.frequency}
                        </div>
                        <div>
                          <span className="font-medium">Route:</span>{" "}
                          {prescription.route}
                        </div>
                        <div>
                          <span className="font-medium">Duration:</span>{" "}
                          {prescription.duration}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="px-3 py-1 bg-yellow-600 text-white text-xs rounded-full">
                        Pending
                      </span>
                      <button
                        onClick={() =>
                          handleDeletePrescription(prescription.id)
                        }
                        className="text-red-600 hover:text-red-700"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {prescriptions.length === 0 && dispensedMedicines.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <FiPackage className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p>No medicines prescribed yet</p>
        </div>
      )}
    </div>
  );
};

export default HerbalMedicineForm;
