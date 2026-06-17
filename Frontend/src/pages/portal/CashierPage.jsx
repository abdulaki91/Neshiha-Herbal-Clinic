import { useEffect, useState } from "react";
import {
  FiDollarSign,
  FiSearch,
  FiCheck,
  FiClock,
  FiUser,
  FiCalendar,
  FiFileText,
  FiPrinter,
  FiX,
} from "react-icons/fi";
import toast from "react-hot-toast";
import axiosInstance from "../../lib/axios";
import useAuthStore from "../../store/authStore";

const CashierPage = () => {
  const { user } = useAuthStore();
  const [pendingPayments, setPendingPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [paymentData, setPaymentData] = useState({
    amount: 0,
    paymentMethod: "cash",
    transactionId: "",
    notes: "",
  });

  useEffect(() => {
    fetchPendingPayments();
  }, []);

  const fetchPendingPayments = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/payments/pending", {
        params: { search: searchTerm },
      });
      setPendingPayments(response.data.data?.visits || []);
    } catch (error) {
      toast.error("Failed to fetch pending payments");
    } finally {
      setLoading(false);
    }
  };

  const handleProcessPaymentClick = (visit) => {
    setSelectedVisit(visit);
    const total = visit.prescriptions.reduce((sum, p) => {
      return sum + parseFloat(p.totalAmount || p.unitPrice * p.quantity || 0);
    }, 0);

    setPaymentData({
      amount: total,
      paymentMethod: "cash",
      transactionId: "",
      notes: "",
    });
  };

  const handleProcessPayment = async () => {
    if (!selectedVisit) return;

    try {
      await axiosInstance.post(`/payments/${selectedVisit.id}`, paymentData);
      toast.success("Payment processed successfully");
      setSelectedVisit(null);
      fetchPendingPayments();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to process payment");
    }
  };

  if (loading && !pendingPayments.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Cashier Dashboard</h1>
        <p className="text-gray-600 mt-1">Process payments for prescriptions</p>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && fetchPendingPayments()}
            placeholder="Search by patient name or ID..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Pending Payments List */}
      {pendingPayments.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <FiDollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No pending payments found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {pendingPayments.map((visit) => (
            <div
              key={visit.id}
              className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                      <FiUser className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800">
                        {visit.patient?.firstName} {visit.patient?.lastName}
                      </h3>
                      <p className="text-sm text-gray-500">
                        ID: {visit.patient?.patientId} • Visit #:{" "}
                        {visit.visitNumber}
                      </p>
                    </div>
                  </div>

                  {/* Prescriptions Summary */}
                  <div className="space-y-2 mb-4">
                    {visit.prescriptions.map((p) => (
                      <div
                        key={p.id}
                        className="flex justify-between text-sm bg-gray-50 p-2 rounded"
                      >
                        <span>
                          {p.medicine?.name} ({p.quantity} x{" "}
                          {parseFloat(p.unitPrice || 0).toFixed(2)} ETB)
                        </span>
                        <span className="font-semibold">
                          {parseFloat(p.totalAmount || p.unitPrice * p.quantity || 0).toFixed(2)}{" "}
                          ETB
                        </span>
                      </div>
                    ))}
                    <div className="flex justify-end pt-2 border-t font-bold text-lg text-emerald-700">
                      Total:{" "}
                      {visit.prescriptions
                        .reduce(
                          (sum, p) =>
                            sum + parseFloat(p.totalAmount || p.unitPrice * p.quantity || 0),
                          0,
                        )
                        .toFixed(2)}{" "}
                      ETB
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span className="flex items-center space-x-1">
                      <FiClock className="w-4 h-4" />
                      <span>Arrived: {visit.arrivalTime}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <FiCalendar className="w-4 h-4" />
                      <span>
                        Date: {new Date(visit.visitDate).toLocaleDateString()}
                      </span>
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleProcessPaymentClick(visit)}
                  className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium flex items-center space-x-2"
                >
                  <FiDollarSign />
                  <span>Process Payment</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Payment Modal */}
      {selectedVisit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">
                Process Payment
              </h2>
              <button
                onClick={() => setSelectedVisit(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-emerald-50 p-4 rounded-lg">
                <p className="text-sm text-emerald-700 font-medium">
                  Total Amount Due
                </p>
                <p className="text-3xl font-bold text-emerald-900">
                  {paymentData.amount.toFixed(2)} ETB
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method
                </label>
                <select
                  value={paymentData.paymentMethod}
                  onChange={(e) =>
                    setPaymentData({
                      ...paymentData,
                      paymentMethod: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="cash">Cash</option>
                  <option value="transfer">Bank Transfer</option>
                  <option value="mobile_money">
                    Mobile Money (Telebirr/CBE Birr)
                  </option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Transaction ID / Reference (Optional)
                </label>
                <input
                  type="text"
                  value={paymentData.transactionId}
                  onChange={(e) =>
                    setPaymentData({
                      ...paymentData,
                      transactionId: e.target.value,
                    })
                  }
                  placeholder="e.g., TXN123456"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={paymentData.notes}
                  onChange={(e) =>
                    setPaymentData({ ...paymentData, notes: e.target.value })
                  }
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setSelectedVisit(null)}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleProcessPayment}
                className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium"
              >
                Confirm Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashierPage;
