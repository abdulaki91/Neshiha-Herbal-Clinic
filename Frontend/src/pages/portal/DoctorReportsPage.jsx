import { useState } from "react";
import {
  FiDollarSign, FiCalendar, FiTrendingUp, FiPackage, FiUser, FiClock, FiUserPlus,
} from "react-icons/fi";
import { useReportsRevenue } from "../../hooks/useDashboard";

const PERIODS = { DAILY: "daily", WEEKLY: "weekly", MONTHLY: "monthly" };

// Tailwind's build-time scanner needs full literal class strings — not
// `bg-${color}-100` — so each color variant is spelled out here instead of
// composed from a prop.
const CARD_COLORS = {
  teal: { bg: "bg-teal-100", text: "text-teal-600" },
  emerald: { bg: "bg-emerald-100", text: "text-emerald-600" },
  blue: { bg: "bg-blue-100", text: "text-blue-600" },
  purple: { bg: "bg-purple-100", text: "text-purple-600" },
};

const SummaryCard = ({ icon, color, label, value, sub }) => {
  const Icon = icon;
  const { bg, text } = CARD_COLORS[color];
  return (
    <div className="bg-white rounded-2xl shadow-sm shadow-slate-200/60 p-6">
      <div className="flex items-center space-x-3">
        <div className={`w-12 h-12 ${bg} rounded-lg flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${text}`} />
        </div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-800">{value}</p>
          {sub && <p className="text-xs text-gray-400">{sub}</p>}
        </div>
      </div>
    </div>
  );
};

const MethodBreakdown = ({ title, byMethod }) =>
  byMethod && Object.keys(byMethod).length > 0 ? (
    <div className="bg-white rounded-2xl shadow-sm shadow-slate-200/60 p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
      <div className="flex flex-wrap gap-4">
        {Object.entries(byMethod).map(([method, amount]) => (
          <div key={method} className="bg-gray-50 rounded-lg px-4 py-3">
            <p className="text-xs text-gray-500 uppercase">{method.replace("_", " ")}</p>
            <p className="text-lg font-semibold text-gray-800">{amount.toLocaleString()} ETB</p>
          </div>
        ))}
      </div>
    </div>
  ) : null;

const DoctorReportsPage = () => {
  const [period, setPeriod] = useState(PERIODS.DAILY);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const { data: report, isLoading } = useReportsRevenue(period, date);

  const periodLabel =
    period === PERIODS.DAILY ? "Today" : period === PERIODS.WEEKLY ? "This Week" : "This Month";

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Financial Reports</h1>
          <p className="text-gray-500 mt-1">Registration fees and consultation/prescription revenue</p>
        </div>
      </div>

      {/* Period Tabs */}
      <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 mb-6 w-fit">
        {[
          { key: PERIODS.DAILY, label: "Daily" },
          { key: PERIODS.WEEKLY, label: "Weekly" },
          { key: PERIODS.MONTHLY, label: "Monthly" },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setPeriod(key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${
              period === key
                ? "bg-white text-emerald-700 shadow-sm"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Date Picker (for daily view) */}
      {period === PERIODS.DAILY && (
        <div className="flex items-center space-x-3 mb-6">
          <FiCalendar className="text-gray-400" />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
          />
        </div>
      )}

      {period === PERIODS.MONTHLY && (
        <div className="flex items-center space-x-3 mb-6">
          <FiCalendar className="text-gray-400" />
          <input
            type="month"
            value={date.substring(0, 7)}
            onChange={(e) => setDate(e.target.value + "-01")}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
          />
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
        </div>
      )}

      {/* Report Content */}
      {!isLoading && report && (
        <>
          {/* Grand total + revenue source breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <SummaryCard
              icon={FiTrendingUp}
              color="teal"
              label="Grand Total"
              value={`${report.summary?.grandTotal?.toLocaleString()} ETB`}
              sub={`${periodLabel} · ${report.startDate} – ${report.endDate}`}
            />
            <SummaryCard
              icon={FiDollarSign}
              color="emerald"
              label="Consultation Revenue"
              value={`${report.summary?.consultationRevenue?.toLocaleString()} ETB`}
              sub={`${report.summary?.totalPayments ?? 0} payment(s)`}
            />
            <SummaryCard
              icon={FiUserPlus}
              color="blue"
              label="Registration Fee Revenue"
              value={`${report.summary?.registrationFeeRevenue?.toLocaleString()} ETB`}
              sub={`${report.summary?.totalRegistrations ?? 0} registration(s)`}
            />
            <SummaryCard
              icon={FiPackage}
              color="purple"
              label="Prescriptions Paid"
              value={report.summary?.totalPayments ?? 0}
            />
          </div>

          {/* Revenue by Day */}
          {report.revenueByDay?.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm shadow-slate-200/60 overflow-hidden mb-8">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800">Revenue by Day</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-gray-500 border-b border-gray-100">
                      <th className="px-6 py-3 font-medium">Date</th>
                      <th className="px-6 py-3 font-medium">Consultation Revenue</th>
                      <th className="px-6 py-3 font-medium">Registration Fees</th>
                      <th className="px-6 py-3 font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.revenueByDay.map((row) => (
                      <tr key={row.day} className="border-b border-gray-50 hover:bg-gray-50 transition text-sm">
                        <td className="px-6 py-3 text-gray-700">{row.day}</td>
                        <td className="px-6 py-3 text-gray-600">{row.consultationRevenue.toLocaleString()} ETB</td>
                        <td className="px-6 py-3 text-gray-600">{row.registrationFeeRevenue.toLocaleString()} ETB</td>
                        <td className="px-6 py-3 font-semibold text-emerald-700">{row.total.toLocaleString()} ETB</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ===== Consultation / Prescription Payments ===== */}
          <h2 className="text-lg font-bold text-gray-800 mb-4">Consultation &amp; Prescription Payments</h2>
          <MethodBreakdown title="By Payment Method" byMethod={report.summary?.byPaymentMethod} />

          <div className="bg-white rounded-2xl shadow-sm shadow-slate-200/60 overflow-hidden mb-10">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">
                Payment Transactions ({report.payments?.length || 0})
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-500 border-b border-gray-100">
                    <th className="px-6 py-3 font-medium">Patient</th>
                    <th className="px-6 py-3 font-medium">Payment #</th>
                    <th className="px-6 py-3 font-medium">Amount</th>
                    <th className="px-6 py-3 font-medium">Method</th>
                    <th className="px-6 py-3 font-medium">Date &amp; Time</th>
                    <th className="px-6 py-3 font-medium">Cashier</th>
                  </tr>
                </thead>
                <tbody>
                  {report.payments?.map((payment) => (
                    <tr
                      key={payment.id}
                      className="border-b border-gray-50 hover:bg-gray-50 transition text-sm"
                    >
                      <td className="px-6 py-3">
                        <div className="flex items-center space-x-2">
                          <FiUser className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-gray-800">
                            {payment.patient?.firstName} {payment.patient?.lastName}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 ml-6">
                          {payment.patient?.patientId}
                        </p>
                      </td>
                      <td className="px-6 py-3 text-gray-600">{payment.paymentNumber}</td>
                      <td className="px-6 py-3 font-semibold text-emerald-700">
                        {payment.amount?.toLocaleString()} ETB
                      </td>
                      <td className="px-6 py-3">
                        <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs capitalize">
                          {(payment.paymentMethod || "").replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-gray-600">
                        <div className="flex items-center space-x-1">
                          <FiClock className="w-3 h-3" />
                          <span>{new Date(payment.paidAt).toLocaleString()}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-gray-600">
                        {payment.cashier?.firstName} {payment.cashier?.lastName}
                      </td>
                    </tr>
                  ))}
                  {(!report.payments || report.payments.length === 0) && (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                        No payments found for this period
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ===== Registration Fees ===== */}
          <h2 className="text-lg font-bold text-gray-800 mb-4">Patient Registration Fees</h2>
          <MethodBreakdown title="By Payment Method" byMethod={report.summary?.registrationByPaymentMethod} />

          <div className="bg-white rounded-2xl shadow-sm shadow-slate-200/60 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">
                Registration Fees ({report.registrationFees?.length || 0})
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-500 border-b border-gray-100">
                    <th className="px-6 py-3 font-medium">Patient</th>
                    <th className="px-6 py-3 font-medium">Amount</th>
                    <th className="px-6 py-3 font-medium">Method</th>
                    <th className="px-6 py-3 font-medium">Date &amp; Time</th>
                    <th className="px-6 py-3 font-medium">Collected By</th>
                  </tr>
                </thead>
                <tbody>
                  {report.registrationFees?.map((fee) => (
                    <tr
                      key={fee.id}
                      className="border-b border-gray-50 hover:bg-gray-50 transition text-sm"
                    >
                      <td className="px-6 py-3">
                        <div className="flex items-center space-x-2">
                          <FiUser className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-gray-800">
                            {fee.patient?.firstName} {fee.patient?.lastName}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 ml-6">
                          {fee.patient?.patientId}
                        </p>
                      </td>
                      <td className="px-6 py-3 font-semibold text-emerald-700">
                        {fee.amount?.toLocaleString()} ETB
                      </td>
                      <td className="px-6 py-3">
                        <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs capitalize">
                          {fee.paymentMethod}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-gray-600">
                        <div className="flex items-center space-x-1">
                          <FiClock className="w-3 h-3" />
                          <span>{new Date(fee.paidAt).toLocaleString()}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-gray-600">
                        {fee.receivedBy?.firstName} {fee.receivedBy?.lastName}
                      </td>
                    </tr>
                  ))}
                  {(!report.registrationFees || report.registrationFees.length === 0) && (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                        No registration fees found for this period
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Empty state (no report + not loading) */}
      {!isLoading && !report && (
        <div className="bg-white rounded-2xl shadow-sm shadow-slate-200/60 p-12 text-center">
          <FiDollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No report data available</p>
        </div>
      )}
    </div>
  );
};

export default DoctorReportsPage;
