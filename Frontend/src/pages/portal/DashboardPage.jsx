import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { FiUsers, FiCalendar, FiActivity, FiTrendingUp } from "react-icons/fi";
import useAuthStore from "../../store/authStore";
import { getSocket } from "../../lib/socket";
import { useDashboard } from "../../hooks/useDashboard";
import { useTranslation } from "react-i18next";

const DashboardPage = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { data: stats, isLoading } = useDashboard();
  const qc = useQueryClient();

  // Real-time: invalidate dashboard on socket events
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const invalidate = () => qc.invalidateQueries({ queryKey: ["dashboard"] });

    const attach = () => {
      socket.on("visit:status-changed", invalidate);
      socket.on("queue:updated", invalidate);
      socket.on("patient:registered", invalidate);
      socket.on("payment:completed", invalidate);
      socket.on("prescription:created", invalidate);
    };

    const detach = () => {
      socket.off("visit:status-changed", invalidate);
      socket.off("queue:updated", invalidate);
      socket.off("patient:registered", invalidate);
      socket.off("payment:completed", invalidate);
      socket.off("prescription:created", invalidate);
    };

    if (socket.connected) attach();
    socket.on("connect", attach);

    return () => {
      detach();
      socket.off("connect", attach);
    };
  }, [qc]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  // Admin Dashboard
  if (user?.role === "super_admin" || user?.role === "staff_manager") {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-800 mb-6">{t("dashboard.title")}</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title={t("dashboard.stats.totalPatients")}
            value={stats?.summary?.totalPatients || 0}
            icon={FiUsers}
            color="emerald"
          />
          <StatCard
            title={t("dashboard.stats.todayPatients")}
            value={stats?.summary?.todayPatients || 0}
            icon={FiCalendar}
            color="blue"
          />
          <StatCard
            title={t("dashboard.stats.todayVisits")}
            value={stats?.summary?.todayVisits || 0}
            icon={FiActivity}
            color="purple"
          />
          <StatCard
            title={t("dashboard.stats.waitingNow")}
            value={stats?.summary?.waitingPatients || 0}
            icon={FiTrendingUp}
            color="orange"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              {t("dashboard.quickStats.title")}
            </h3>
            <div className="space-y-3">
              <StatRow
                label={t("dashboard.stats.totalDoctors")}
                value={stats?.summary?.totalDoctors || 0}
              />
              <StatRow
                label={t("dashboard.stats.totalStaff")}
                value={stats?.summary?.totalStaff || 0}
              />
              <StatRow
                label={t("dashboard.stats.completedToday")}
                value={stats?.summary?.completedVisits || 0}
              />
              <StatRow
                label={t("dashboard.stats.lowStockItems")}
                value={stats?.summary?.lowStockMedicines || 0}
                color="orange"
              />
              <StatRow
                label={t("dashboard.stats.expiredMedicines")}
                value={stats?.summary?.expiredMedicines || 0}
                color="red"
              />
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-600 to-teal-600 rounded-xl shadow-sm p-6 text-white">
            <h3 className="text-lg font-semibold mb-4">{t("dashboard.systemStatus.title")}</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>{t("dashboard.systemStatus.database")}</span>
                <span className="flex items-center">
                  <span className="w-2 h-2 bg-green-300 rounded-full mr-2"></span>
                  {t("dashboard.systemStatus.online")}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>{t("dashboard.systemStatus.realtimeUpdates")}</span>
                <span className="flex items-center">
                  <span className="w-2 h-2 bg-green-300 rounded-full mr-2"></span>
                  {t("dashboard.systemStatus.connected")}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>{t("dashboard.systemStatus.lastBackup")}</span>
                <span>2 hours ago</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Doctor Dashboard
  if (user?.role === "doctor") {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          {t("dashboard.doctor.title")}
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title={t("dashboard.doctor.stats.inQueue")}
            value={stats?.todayQueue || 0}
            icon={FiUsers}
            color="emerald"
          />
          <StatCard
            title={t("dashboard.doctor.stats.completedToday")}
            value={stats?.todayCompleted || 0}
            icon={FiActivity}
            color="blue"
          />
          <StatCard
            title={t("dashboard.doctor.stats.prescriptions")}
            value={stats?.todayPrescriptions || 0}
            icon={FiCalendar}
            color="purple"
          />
          <StatCard
            title={t("dashboard.doctor.stats.dispensed")}
            value={stats?.todayDispensed || 0}
            icon={FiTrendingUp}
            color="orange"
          />
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            {t("dashboard.doctor.waitingPatients")}
          </h3>
          {stats?.waitingPatients?.length > 0 ? (
            <div className="space-y-3">
              {stats.waitingPatients.map((visit, idx) => (
                <div
                  key={visit.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                      <span className="text-emerald-600 font-bold">
                        {idx + 1}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">
                        {visit.patient?.firstName} {visit.patient?.lastName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {visit.patient?.age} {t("common.ageUnit.years")} • {visit.patient?.gender}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      navigate(`/portal/queue?visitId=${visit.id}`)
                    }
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
                  >
                    {t("dashboard.doctor.startConsultation")}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              {t("dashboard.doctor.empty.noPatients")}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Data Clerk Dashboard
  if (user?.role === "data_clerk") {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          {t("dashboard.dataClerk.title")}
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StatCard
            title={t("dashboard.dataClerk.stats.registeredToday")}
            value={stats?.todayRegistrations || 0}
            icon={FiUsers}
            color="emerald"
          />
          <StatCard
            title={t("dashboard.dataClerk.stats.todayVisits")}
            value={stats?.todayVisits || 0}
            icon={FiCalendar}
            color="blue"
          />
          <StatCard
            title={t("dashboard.dataClerk.stats.waitingPatients")}
            value={stats?.waitingPatients || 0}
            icon={FiActivity}
            color="orange"
          />
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            {t("dashboard.dataClerk.recentRegistrations")}
          </h3>
          {stats?.recentPatients?.length > 0 ? (
            <div className="space-y-3">
              {stats.recentPatients.map((patient) => (
                <div
                  key={patient.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-800">
                      {patient.firstName} {patient.lastName}
                    </p>
                    <p className="text-sm text-gray-500">
                      {t("common.patientId")}: {patient.patientId}
                    </p>
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(patient.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              {t("dashboard.dataClerk.empty.noRegistrations")}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Cashier Dashboard
  if (user?.role === "cashier") {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          {t("dashboard.cashier.title")}
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StatCard
            title={t("dashboard.cashier.stats.pendingPayments")}
            value={stats?.pendingPayments || 0}
            icon={FiUsers}
            color="orange"
          />
          <StatCard
            title={t("dashboard.cashier.stats.paymentsProcessedToday")}
            value={stats?.todayPaymentsCount || 0}
            icon={FiActivity}
            color="emerald"
          />
          <StatCard
            title={t("dashboard.cashier.stats.todayRevenue")}
            value={stats?.todayTotalRevenue?.toFixed(2) || "0.00"}
            icon={FiTrendingUp}
            color="blue"
          />
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            {t("dashboard.cashier.recentPayments")}
          </h3>
          {stats?.recentPayments?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-gray-500 text-sm border-b">
                    <th className="pb-3 font-medium">{t("common.paymentNumber")}</th>
                    <th className="pb-3 font-medium">{t("common.patient")}</th>
                    <th className="pb-3 font-medium">{t("common.amount")}</th>
                    <th className="pb-3 font-medium">{t("common.method")}</th>
                    <th className="pb-3 font-medium">{t("common.date")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {stats.recentPayments.map((payment) => (
                    <tr key={payment.id} className="text-sm">
                      <td className="py-3 font-medium text-gray-800">
                        {payment.paymentNumber}
                      </td>
                      <td className="py-3 text-gray-600">
                        {payment.patient?.firstName} {payment.patient?.lastName}
                      </td>
                      <td className="py-3 font-bold text-emerald-700">
                        {parseFloat(payment.amount).toFixed(2)} {t("common.currency.etb")}
                      </td>
                      <td className="py-3 capitalize text-gray-600">
                        {payment.paymentMethod?.replace("_", " ")}
                      </td>
                      <td className="py-3 text-gray-500">
                        {new Date(payment.paidAt).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">{t("dashboard.cashier.empty.noPayments")}</p>
          )}
        </div>
      </div>
    );
  }

  return <div>{t("dashboard.fallback.title")}</div>;
};

const StatCard = ({ title, value, icon: Icon, color }) => {
  const colors = {
    emerald: "from-emerald-600 to-teal-600",
    blue: "from-blue-600 to-cyan-600",
    purple: "from-purple-600 to-pink-600",
    orange: "from-orange-600 to-red-600",
  };

  return (
    <div
      className={`bg-gradient-to-br ${colors[color]} rounded-xl shadow-sm p-6 text-white`}
    >
      <div className="flex items-center justify-between mb-4">
        <Icon className="w-8 h-8 opacity-80" />
      </div>
      <p className="text-3xl font-bold mb-1">{value}</p>
      <p className="text-sm opacity-90">{title}</p>
    </div>
  );
};

const StatRow = ({ label, value, color = "gray" }) => {
  const colors = {
    gray: "text-gray-800",
    orange: "text-orange-600",
    red: "text-red-600",
  };

  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100">
      <span className="text-gray-600">{label}</span>
      <span className={`font-semibold ${colors[color]}`}>{value}</span>
    </div>
  );
};

export default DashboardPage;
