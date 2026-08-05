import { useEffect, useState } from "react";
import {
  FiPackage,
  FiSearch,
  FiCheck,
  FiClock,
  FiUser,
  FiCalendar,
  FiAlertCircle,
  FiFileText,
} from "react-icons/fi";
import toast from "react-hot-toast";
import axiosInstance from "../../lib/axios";
import useAuthStore from "../../store/authStore";
import { getSocket } from "../../lib/socket";

const PharmacyPage = () => {
  const { user } = useAuthStore();
  const [prescriptions, setPrescriptions] = useState([]);
  const [filteredPrescriptions, setFilteredPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("paid");
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [dispensingData, setDispensingData] = useState({
    quantityDispensed: "",
    batchNumber: "",
    expiryDate: "",
    notes: "",
  });

  useEffect(() => {
    fetchPrescriptions();
  }, [statusFilter]);

  useEffect(() => {
    filterPrescriptions();
  }, [searchTerm, prescriptions]);

  // Real-time: another pharmacist dispensing, or a doctor prescribing,
  // should refresh this queue without waiting for a manual reload
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const refresh = () => fetchPrescriptions();
    socket.on("prescription:created", refresh);
    socket.on("medicine:dispensed", refresh);
    return () => {
      socket.off("prescription:created", refresh);
      socket.off("medicine:dispensed", refresh);
    };
  }, [statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/prescriptions", {
        params: {
          status: statusFilter,
          sortBy: "prescribedDate",
          sortOrder: "DESC",
          pageSize: 100,
        },
      });

      const data = response.data?.prescriptions || response.data || [];
      setPrescriptions(data);
      setFilteredPrescriptions(data);
    } catch (error) {
      console.error("Failed to fetch prescriptions:", error);
      toast.error("Failed to load prescriptions");
      setPrescriptions([]);
      setFilteredPrescriptions([]);
    } finally {
      setLoading(false);
    }
  };

  const filterPrescriptions = () => {
    if (!searchTerm.trim()) {
      setFilteredPrescriptions(prescriptions);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = prescriptions.filter((prescription) => {
      const patientName =
        `${prescription.patient?.firstName || ""} ${prescription.patient?.lastName || ""}`.toLowerCase();
      const patientId = prescription.patient?.patientId?.toLowerCase() || "";
      const medicineName = prescription.medicine?.name?.toLowerCase() || "";

      return (
        patientName.includes(term) ||
        patientId.includes(term) ||
        medicineName.includes(term)
      );
    });

    setFilteredPrescriptions(filtered);
  };

  const handleDispenseClick = (prescription) => {
    setSelectedPrescription(prescription);
    setDispensingData({
      quantityDispensed: prescription.quantity.toString(),
      batchNumber: "",
      expiryDate: "",
      notes: "",
    });
  };

  const handleDispense = async () => {
    if (!selectedPrescription) return;

    // Validation
    if (
      !dispensingData.quantityDispensed ||
      dispensingData.quantityDispensed <= 0
    ) {
      toast.error("Please enter a valid quantity");
      return;
    }

    if (!dispensingData.batchNumber) {
      toast.error("Please enter batch number");
      return;
    }

    if (!dispensingData.expiryDate) {
      toast.error("Please enter expiry date");
      return;
    }

    try {
      // Update prescription status to dispensed
      await axiosInstance.put(`/prescriptions/${selectedPrescription.id}`, {
        status: "dispensed",
        dispensedDate: new Date().toISOString(),
        dispensedBy: user.id,
      });

      // Create medicine dispense record
      await axiosInstance.post("/medicine-dispenses", {
        prescriptionId: selectedPrescription.id,
        patientId: selectedPrescription.patientId,
        medicineId: selectedPrescription.medicineId,
        quantityDispensed: parseInt(dispensingData.quantityDispensed),
        batchNumber: dispensingData.batchNumber,
        expiryDate: dispensingData.expiryDate,
        notes: dispensingData.notes,
        dispensedBy: user.id,
      });

      toast.success("Medicine dispensed successfully");
      setSelectedPrescription(null);
      setDispensingData({
        quantityDispensed: "",
        batchNumber: "",
        expiryDate: "",
        notes: "",
      });
      fetchPrescriptions();
    } catch (error) {
      console.error("Failed to dispense medicine:", error);
      toast.error(
        error.response?.data?.message || "Failed to dispense medicine",
      );
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
      dispensed: "bg-green-100 text-green-800 border-green-300",
      completed: "bg-blue-100 text-blue-800 border-blue-300",
      stopped: "bg-red-100 text-red-800 border-red-300",
    };
    return colors[status] || "bg-gray-100 text-gray-800 border-gray-300";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Pharmacy</h1>
        <p className="text-gray-600 mt-1">
          Manage medicine prescriptions and dispensing
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm shadow-slate-200/60 p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by patient name, ID, or medicine..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          {/* Status Filter */}
          <div className="flex flex-wrap gap-2">
            {["paid", "dispensed", "completed", "pending"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  statusFilter === status
                    ? "bg-emerald-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Prescriptions List */}
      {filteredPrescriptions.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm shadow-slate-200/60 p-12 text-center">
          <FiPackage className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">
            {searchTerm
              ? "No prescriptions found matching your search"
              : `No ${statusFilter} prescriptions`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredPrescriptions.map((prescription) => (
            <div
              key={prescription.id}
              className="bg-white rounded-2xl shadow-sm shadow-slate-200/60 p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-3">
                  {/* Patient Info */}
                  <div>
                    <div className="flex items-center space-x-3 mb-2">
                      <FiUser className="w-5 h-5 text-gray-400" />
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">
                          {prescription.patient?.firstName}{" "}
                          {prescription.patient?.lastName}
                        </h3>
                        <p className="text-sm text-gray-600">
                          ID: {prescription.patient?.patientId} • Age:{" "}
                          {prescription.patient?.age} • Phone:{" "}
                          {prescription.patient?.phone}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Medicine Details */}
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-emerald-900 text-lg mb-2">
                          {prescription.medicine?.name || "Medicine"}
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div>
                            <p className="text-emerald-700 font-medium">
                              Dosage
                            </p>
                            <p className="text-emerald-900">
                              {prescription.dosage}
                            </p>
                          </div>
                          <div>
                            <p className="text-emerald-700 font-medium">
                              Frequency
                            </p>
                            <p className="text-emerald-900">
                              {prescription.frequency}
                            </p>
                          </div>
                          <div>
                            <p className="text-emerald-700 font-medium">
                              Duration
                            </p>
                            <p className="text-emerald-900">
                              {prescription.duration}
                            </p>
                          </div>
                          <div>
                            <p className="text-emerald-700 font-medium">
                              Quantity
                            </p>
                            <p className="text-emerald-900 text-lg font-bold">
                              {prescription.quantity}
                            </p>
                          </div>
                        </div>
                        {prescription.instructions && (
                          <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded">
                            <p className="text-xs font-medium text-blue-800">
                              Instructions:
                            </p>
                            <p className="text-sm text-blue-900">
                              {prescription.instructions}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Prescription Info */}
                  <div className="flex items-center space-x-6 text-sm text-gray-600">
                    <span className="flex items-center space-x-1">
                      <FiCalendar className="w-4 h-4" />
                      <span>
                        Prescribed:{" "}
                        {new Date(
                          prescription.prescribedDate,
                        ).toLocaleDateString()}
                      </span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <FiUser className="w-4 h-4" />
                      <span>
                        Dr. {prescription.doctor?.firstName}{" "}
                        {prescription.doctor?.lastName}
                      </span>
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(prescription.status)}`}
                    >
                      {prescription.status.charAt(0).toUpperCase() +
                        prescription.status.slice(1)}
                    </span>
                  </div>
                </div>

                {/* Action Button */}
                {(prescription.status === "paid" || prescription.status === "pending") && (
                  <button
                    onClick={() => handleDispenseClick(prescription)}
                    className="ml-6 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 hover:-translate-y-0.5 font-medium flex items-center space-x-2"
                  >
                    <FiCheck className="w-5 h-5" />
                    <span>Dispense</span>
                  </button>
                )}

                {prescription.status === "dispensed" && (
                  <div className="ml-6 text-center">
                    <FiCheck className="w-8 h-8 text-green-600 mx-auto mb-1" />
                    <p className="text-sm text-green-600 font-medium">
                      Dispensed
                    </p>
                    {prescription.dispensedDate && (
                      <p className="text-xs text-gray-500">
                        {new Date(
                          prescription.dispensedDate,
                        ).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dispensing Modal */}
      {selectedPrescription && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800">
                Dispense Medicine
              </h2>
              <p className="text-gray-600 mt-1">
                {selectedPrescription.patient?.firstName}{" "}
                {selectedPrescription.patient?.lastName} •{" "}
                {selectedPrescription.medicine?.name}
              </p>
            </div>

            <div className="p-6 space-y-4">
              {/* Prescription Details Summary */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-2">
                  Prescription Details
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-600">Dosage</p>
                    <p className="font-medium">{selectedPrescription.dosage}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Frequency</p>
                    <p className="font-medium">
                      {selectedPrescription.frequency}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Duration</p>
                    <p className="font-medium">
                      {selectedPrescription.duration}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Prescribed Quantity</p>
                    <p className="font-medium text-lg">
                      {selectedPrescription.quantity}
                    </p>
                  </div>
                </div>
              </div>

              {/* Dispensing Form */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity to Dispense *
                </label>
                <input
                  type="number"
                  value={dispensingData.quantityDispensed}
                  onChange={(e) =>
                    setDispensingData({
                      ...dispensingData,
                      quantityDispensed: e.target.value,
                    })
                  }
                  min="1"
                  max={selectedPrescription.quantity}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Batch Number *
                </label>
                <input
                  type="text"
                  value={dispensingData.batchNumber}
                  onChange={(e) =>
                    setDispensingData({
                      ...dispensingData,
                      batchNumber: e.target.value,
                    })
                  }
                  placeholder="e.g., BATCH-2026-001"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expiry Date *
                </label>
                <input
                  type="date"
                  value={dispensingData.expiryDate}
                  onChange={(e) =>
                    setDispensingData({
                      ...dispensingData,
                      expiryDate: e.target.value,
                    })
                  }
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={dispensingData.notes}
                  onChange={(e) =>
                    setDispensingData({
                      ...dispensingData,
                      notes: e.target.value,
                    })
                  }
                  rows={3}
                  placeholder="Any additional notes..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setSelectedPrescription(null)}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDispense}
                className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 hover:-translate-y-0.5 font-medium"
              >
                Confirm Dispensing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PharmacyPage;
