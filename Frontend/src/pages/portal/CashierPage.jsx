import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  FiDollarSign, FiSearch, FiUser, FiCalendar,
  FiClock, FiX, FiCheck, FiPrinter, FiEye,
  FiClock as FiHistory,
} from "react-icons/fi";
import toast from "react-hot-toast";
import axiosInstance from "../../lib/axios";
import { getSocket } from "../../lib/socket";
import { usePendingPayments, usePaymentHistory, useProcessPayment } from "../../hooks/usePayments";

const formatETB = (amount) => parseFloat(amount || 0).toFixed(2);

const CashierPage = () => {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [viewPayment, setViewPayment] = useState(null);
  const [paymentData, setPaymentData] = useState({
    amount: 0, paymentMethod: "cash", transactionId: "", notes: "",
  });

  const { data: pendingPayments = [], isLoading: pendingLoading } = usePendingPayments(
    activeTab === "pending" ? searchTerm : "",
  );
  const { data: recentPayments = [], isLoading: recentLoading } = usePaymentHistory(
    activeTab === "recent" ? { pageSize: 50 } : { pageSize: 0 },
  );
  const processPayment = useProcessPayment();

  const isLoading = activeTab === "pending" ? pendingLoading : recentLoading;

  // Real-time: invalidate on socket events
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const invalidate = () => qc.invalidateQueries({ queryKey: ["payments"] });
    socket.on("visit:status-changed", invalidate);
    socket.on("prescription:created", invalidate);
    socket.on("payment:completed", invalidate);
    return () => {
      socket.off("visit:status-changed", invalidate);
      socket.off("prescription:created", invalidate);
      socket.off("payment:completed", invalidate);
    };
  }, [qc]);

  const handleProcessPaymentClick = (visit) => {
    setSelectedVisit(visit);
    const total = visit.prescriptions.reduce(
      (sum, p) => sum + parseFloat(p.totalAmount || p.unitPrice * p.quantity || 0),
      0,
    );
    setPaymentData({ amount: total, paymentMethod: "cash", transactionId: "", notes: "" });
  };

  const handleProcessPayment = () => {
    if (!selectedVisit) return;
    processPayment.mutate(
      { visitId: selectedVisit.id, ...paymentData },
      {
        onSuccess: () => {
          handlePrintReceipt(selectedVisit);
          setSelectedVisit(null);
          toast.success("Payment received — medicine dispensed to patient");
          qc.invalidateQueries({ queryKey: ["payments"] });
        },
        onError: (error) => {
          toast.error(error.response?.data?.message || "Failed to process payment");
        },
      },
    );
  };

  const handlePrintReceipt = (visit) => {
    const prescriptions = visit.prescriptions || visit.visit?.prescriptions || [];
    const patient = visit.patient || visit.visit?.patient || {};
    const doctor = visit.doctor || visit.visit?.doctor;
    const total = prescriptions.reduce(
      (sum, p) => sum + parseFloat(p.totalAmount || p.unitPrice * p.quantity || 0),
      0,
    );
    const printWindow = window.open("", "_blank", "width=380,height=600");
    if (!printWindow) return;

    const rows = prescriptions
      .map(
        (p) => `
      <tr>
        <td style="padding:6px 4px;border-bottom:1px dashed #ccc;vertical-align:top">
          <strong>${p.medicine?.name || "—"}</strong>
          ${p.medicine?.strength ? ` (${p.medicine.strength})` : ""}
          <br><span style="font-size:11px;color:#555">
            Qty: ${p.quantity} &bull; ${p.dosage || "—"} &bull; ${p.frequency || "—"}
            ${p.route ? ` &bull; ${p.route}` : ""}
            ${p.duration ? ` &bull; ${p.duration}` : ""}
            ${p.instructions ? `<br><em>${p.instructions}</em>` : ""}
          </span>
        </td>
        <td style="padding:6px 4px;border-bottom:1px dashed #ccc;text-align:right;white-space:nowrap">
          ${formatETB(p.totalAmount || p.unitPrice * p.quantity)} ETB
        </td>
      </tr>`,
      )
      .join("");

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Receipt</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: 'Courier New', monospace; font-size:12px; padding:16px; max-width:380px; margin:0 auto; }
    .center { text-align:center; }
    .bold { font-weight:bold; }
    .divider { border-top:1px dashed #000; margin:10px 0; }
    @media print { body { padding:8px; } }
  </style>
</head>
<body>
  <div class="center">
    <h2 style="font-size:14px;margin-bottom:2px">Neshiha Herbal Clinic</h2>
    <p style="font-size:10px;color:#555">Clinic Management System</p>
    <p style="font-size:10px;margin-top:4px">${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</p>
  </div>
  <div class="divider"></div>
  <p><strong>Patient:</strong> ${patient.firstName || "—"} ${patient.lastName || ""}</p>
  <p><strong>ID:</strong> ${patient.patientId || "—"}</p>
  ${visit.visitNumber ? `<p><strong>Visit:</strong> #${visit.visitNumber}</p>` : ""}
  ${doctor ? `<p><strong>Doctor:</strong> Dr. ${doctor.firstName} ${doctor.lastName}</p>` : ""}
  <div class="divider"></div>
  <p class="bold" style="margin-bottom:6px">Prescribed Medicines:</p>
  <table style="width:100%;border-collapse:collapse">${rows}</table>
  <div class="divider"></div>
  <p style="font-size:14px;text-align:right"><strong>TOTAL: ${formatETB(total)} ETB</strong></p>
  <div class="divider"></div>
  <div class="center" style="margin-top:12px">
    <p style="font-size:10px;color:#555">Thank you for choosing</p>
    <p style="font-size:10px;color:#555">Neshiha Herbal Clinic</p>
    <p style="font-size:9px;color:#aaa;margin-top:8px">This is a computer-generated receipt</p>
  </div>
  <script>window.onload=function(){window.print();window.close();}</script>
</body>
</html>`;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  if (isLoading && !pendingPayments.length && !recentPayments.length) {
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
        <p className="text-gray-600 mt-1">Receive payments, dispense medicine &amp; print receipts</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 mb-6 w-fit">
        <button
          onClick={() => setActiveTab("pending")}
          className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition ${
            activeTab === "pending" ? "bg-white text-emerald-700 shadow-sm" : "text-gray-600 hover:text-gray-800"
          }`}
        >
          <FiDollarSign className="w-4 h-4" />
          <span>Pending</span>
        </button>
        <button
          onClick={() => setActiveTab("recent")}
          className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition ${
            activeTab === "recent" ? "bg-white text-emerald-700 shadow-sm" : "text-gray-600 hover:text-gray-800"
          }`}
        >
          <FiHistory className="w-4 h-4" />
          <span>Recent Payments</span>
        </button>
      </div>

      {/* ===== PENDING TAB ===== */}
      {activeTab === "pending" && (
        <>
          <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchPendingPayments()}
                placeholder="Search by patient name or ID..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>

          {pendingPayments.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <FiDollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No pending payments</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {pendingPayments.map((visit) => (
                <div key={visit.id} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <FiUser className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-gray-800">
                            {visit.patient?.firstName} {visit.patient?.lastName}
                          </h3>
                          <p className="text-sm text-gray-500">
                            ID: {visit.patient?.patientId} • Visit #: {visit.visitNumber}
                            {visit.doctor ? ` • Dr. ${visit.doctor.firstName} ${visit.doctor.lastName}` : ""}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2 mb-4">
                        {visit.prescriptions.map((p) => (
                          <div key={p.id} className="bg-gray-50 p-3 rounded-lg">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className="font-semibold text-gray-800">
                                  {p.medicine?.name}
                                  {p.medicine?.strength ? ` (${p.medicine.strength})` : ""}
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  Qty: {p.quantity} &bull; {p.dosage || "—"} &bull; {p.frequency || "—"}
                                  {p.route ? ` &bull; ${p.route}` : ""}
                                  {p.duration ? ` &bull; ${p.duration}` : ""}
                                </p>
                                {p.instructions && (
                                  <p className="text-xs text-blue-700 mt-1 italic bg-blue-50 px-2 py-0.5 rounded">
                                    📝 {p.instructions}
                                  </p>
                                )}
                              </div>
                              <span className="font-semibold text-gray-800 whitespace-nowrap ml-3">
                                {formatETB(p.totalAmount || p.unitPrice * p.quantity)} ETB
                              </span>
                            </div>
                          </div>
                        ))}
                        <div className="flex justify-end pt-2 border-t font-bold text-lg text-emerald-700">
                          Total:{" "}
                          {visit.prescriptions
                            .reduce((sum, p) => sum + parseFloat(p.totalAmount || p.unitPrice * p.quantity || 0), 0)
                            .toFixed(2)}{" "}
                          ETB
                        </div>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span className="flex items-center space-x-1">
                          <FiClock className="w-4 h-4" />
                          <span>{visit.arrivalTime}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <FiCalendar className="w-4 h-4" />
                          <span>{new Date(visit.visitDate).toLocaleDateString()}</span>
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col space-y-2 flex-shrink-0">
                      <button
                        onClick={() => handleProcessPaymentClick(visit)}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium flex items-center space-x-2 text-sm"
                      >
                        <FiDollarSign />
                        <span>Receive &amp; Dispense</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ===== RECENT PAYMENTS TAB ===== */}
      {activeTab === "recent" && (
        <>
          {recentPayments.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <FiHistory className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No recent payments</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {recentPayments.map((payment) => (
                <div key={payment.id} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <FiCheck className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-gray-800">
                            {payment.patient?.firstName} {payment.patient?.lastName}
                          </h3>
                          <p className="text-sm text-gray-500">
                            ID: {payment.patient?.patientId} • {payment.paymentNumber}
                            {payment.cashier ? ` • by ${payment.cashier.firstName}` : ""}
                          </p>
                        </div>
                      </div>

                      {/* Payment summary */}
                      <div className="flex flex-wrap gap-3 text-sm mb-3">
                        <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full font-semibold">
                          {formatETB(payment.amount)} ETB
                        </span>
                        <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full capitalize">
                          {(payment.paymentMethod || "").replace("_", " ")}
                        </span>
                        <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full flex items-center gap-1">
                          <FiClock className="w-3 h-3" />
                          {new Date(payment.paidAt).toLocaleString()}
                        </span>
                      </div>

                      {/* Quick medicines list */}
                      {payment.visit?.prescriptions?.length > 0 && (
                        <div className="text-sm text-gray-600">
                          {payment.visit.prescriptions.map((p) => (
                            <span key={p.id} className="inline-block bg-gray-50 px-2 py-0.5 rounded mr-1 mb-1">
                              {p.medicine?.name} ×{p.quantity}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col space-y-2 flex-shrink-0">
                      <button
                        onClick={() => setViewPayment(payment)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center space-x-2 text-sm"
                      >
                        <FiEye />
                        <span>View</span>
                      </button>
                      <button
                        onClick={() => handlePrintReceipt(payment)}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium flex items-center space-x-2 text-sm"
                      >
                        <FiPrinter />
                        <span>Print</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Payment Modal */}
      {selectedVisit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-2xl font-bold text-gray-800">Receive Payment</h2>
              <button onClick={() => setSelectedVisit(null)} className="text-gray-500 hover:text-gray-700">
                <FiX className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-emerald-50 p-4 rounded-lg">
                <p className="text-sm text-emerald-700 font-medium">Total Amount Due</p>
                <p className="text-3xl font-bold text-emerald-900">{paymentData.amount.toFixed(2)} ETB</p>
              </div>
              {selectedVisit.prescriptions?.length > 0 && (
                <div className="bg-blue-50 p-3 rounded-lg text-sm">
                  <p className="font-medium text-blue-800 mb-2">Medicines to dispense:</p>
                  {selectedVisit.prescriptions.map((p) => (
                    <div key={p.id} className="mb-2 last:mb-0">
                      <div className="flex items-start gap-1 text-blue-800">
                        <FiCheck className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="font-medium">{p.medicine?.name}</span>
                          {p.medicine?.strength ? ` (${p.medicine.strength})` : ""}
                          {" × "}{p.quantity}
                          <span className="text-blue-600 ml-1">— {formatETB(p.totalAmount || p.unitPrice * p.quantity)} ETB</span>
                          <div className="text-xs text-blue-600 mt-0.5">
                            {p.dosage} &bull; {p.frequency}
                            {p.route ? ` &bull; ${p.route}` : ""}
                            {p.duration ? ` &bull; ${p.duration}` : ""}
                          </div>
                          {p.instructions && (
                            <p className="text-xs text-blue-500 italic mt-0.5">📝 {p.instructions}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                <select
                  value={paymentData.paymentMethod}
                  onChange={(e) => setPaymentData({ ...paymentData, paymentMethod: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="cash">Cash</option>
                  <option value="transfer">Bank Transfer</option>
                  <option value="mobile_money">Mobile Money (Telebirr/CBE Birr)</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Transaction ID / Reference (Optional)</label>
                <input type="text" value={paymentData.transactionId} onChange={(e) => setPaymentData({ ...paymentData, transactionId: e.target.value })} placeholder="e.g., TXN123456" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea value={paymentData.notes} onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })} rows={2} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500" />
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3 sticky bottom-0 bg-white">
              <button onClick={() => setSelectedVisit(null)} className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition">Cancel</button>
              <button onClick={handleProcessPayment} className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium">Confirm Payment &amp; Dispense</button>
            </div>
          </div>
        </div>
      )}

      {/* View Payment Detail Modal */}
      {viewPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-2xl font-bold text-gray-800">Payment Details</h2>
              <button onClick={() => setViewPayment(null)} className="text-gray-500 hover:text-gray-700">
                <FiX className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Payment #</p>
                  <p className="font-semibold">{viewPayment.paymentNumber}</p>
                </div>
                <div>
                  <p className="text-gray-500">Amount</p>
                  <p className="font-semibold text-emerald-700">{formatETB(viewPayment.amount)} ETB</p>
                </div>
                <div>
                  <p className="text-gray-500">Method</p>
                  <p className="font-semibold capitalize">{(viewPayment.paymentMethod || "").replace("_", " ")}</p>
                </div>
                <div>
                  <p className="text-gray-500">Date</p>
                  <p className="font-semibold">{new Date(viewPayment.paidAt).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-500">Cashier</p>
                  <p className="font-semibold">{viewPayment.cashier?.firstName} {viewPayment.cashier?.lastName}</p>
                </div>
                <div>
                  <p className="text-gray-500">Patient</p>
                  <p className="font-semibold">{viewPayment.patient?.firstName} {viewPayment.patient?.lastName}</p>
                </div>
              </div>

              {viewPayment.visit?.prescriptions?.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-semibold text-gray-800 mb-3">Prescribed Medicines</p>
                  {viewPayment.visit.prescriptions.map((p) => (
                    <div key={p.id} className="mb-3 last:mb-0 pb-3 last:pb-0 border-b last:border-b-0 border-gray-200">
                      <p className="font-medium text-gray-800">
                        {p.medicine?.name}
                        {p.medicine?.strength ? ` (${p.medicine.strength})` : ""}
                        {" × "}{p.quantity} — {formatETB(p.totalAmount || p.unitPrice * p.quantity)} ETB
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {p.dosage || "—"} &bull; {p.frequency || "—"}
                        {p.route ? ` &bull; ${p.route}` : ""}
                        {p.duration ? ` &bull; ${p.duration}` : ""}
                      </p>
                      {p.instructions && (
                        <p className="text-xs text-blue-600 italic mt-1 bg-blue-50 px-2 py-1 rounded">
                          📝 {p.instructions}
                        </p>
                      )}
                    </div>
                  ))}
                  <div className="flex justify-end pt-2 border-t font-bold text-emerald-700 mt-2">
                    Total: {formatETB(viewPayment.amount)} ETB
                  </div>
                </div>
              )}

              {viewPayment.transactionId && (
                <div className="text-sm">
                  <p className="text-gray-500">Transaction ID</p>
                  <p className="font-mono">{viewPayment.transactionId}</p>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3 sticky bottom-0 bg-white">
              <button onClick={() => setViewPayment(null)} className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition">Close</button>
              <button onClick={() => { handlePrintReceipt(viewPayment); setViewPayment(null); }} className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium flex items-center space-x-2">
                <FiPrinter />
                <span>Print Receipt</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashierPage;
