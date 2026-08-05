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
      socket.on("visit:created", invalidate);
      socket.on("visit:status-changed", invalidate);
      socket.on("queue:updated", invalidate);
      socket.on("patient:registered", invalidate);
      socket.on("payment:completed", invalidate);
      socket.on("prescription:created", invalidate);
    };

    const detach = () => {
      socket.off("visit:created", invalidate);
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
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            {t("dashboard.title")}
          </h1>
          <p className="text-gray-500 mt-1">
            {new Date().toLocaleDateString(undefined, {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title={t("dashboard.stats.totalPatients")}
            value={stats?.summary?.totalPatients || 0}
            icon={FiUsers}
            color="emerald"
            delay={0}
          />
          <StatCard
            title={t("dashboard.stats.todayPatients")}
            value={stats?.summary?.todayPatients || 0}
            icon={FiCalendar}
            color="blue"
            delay={60}
          />
          <StatCard
            title={t("dashboard.stats.todayVisits")}
            value={stats?.summary?.todayVisits || 0}
            icon={FiActivity}
            color="purple"
            delay={120}
          />
          <StatCard
            title={t("dashboard.stats.waitingNow")}
            value={stats?.summary?.waitingPatients || 0}
            icon={FiTrendingUp}
            color="orange"
            delay={180}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-sm shadow-slate-200/60 p-6">
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

          <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl shadow-lg shadow-emerald-600/20 p-6 text-white">
            <div
              aria-hidden
              className="absolute -right-10 -bottom-10 w-40 h-40 rounded-full bg-white/10"
            />
            <h3 className="relative text-lg font-semibold mb-4">{t("dashboard.systemStatus.title")}</h3>
            <div className="relative space-y-4">
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
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-6">
          {t("dashboard.doctor.title")}
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title={t("dashboard.doctor.stats.inQueue")}
            value={stats?.todayQueue || 0}
            icon={FiUsers}
            color="emerald"
            delay={0}
          />
          <StatCard
            title={t("dashboard.doctor.stats.completedToday")}
            value={stats?.todayCompleted || 0}
            icon={FiActivity}
            color="blue"
            delay={60}
          />
          <StatCard
            title={t("dashboard.doctor.stats.prescriptions")}
            value={stats?.todayPrescriptions || 0}
            icon={FiCalendar}
            color="purple"
            delay={120}
          />
          <StatCard
            title={t("dashboard.doctor.stats.dispensed")}
            value={stats?.todayDispensed || 0}
            icon={FiTrendingUp}
            color="orange"
            delay={180}
          />
        </div>

        <div className="bg-white rounded-2xl shadow-sm shadow-slate-200/60 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            {t("dashboard.doctor.waitingPatients")}
          </h3>
          {stats?.waitingPatients?.length > 0 ? (
            <div className="space-y-3">
              {stats.waitingPatients.map((visit, idx) => (
                <div
                  key={visit.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-emerald-50/60 transition-colors duration-200"
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
                    className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
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
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-6">
          {t("dashboard.dataClerk.title")}
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StatCard
            title={t("dashboard.dataClerk.stats.registeredToday")}
            value={stats?.todayRegistrations || 0}
            icon={FiUsers}
            color="emerald"
            delay={0}
          />
          <StatCard
            title={t("dashboard.dataClerk.stats.todayVisits")}
            value={stats?.todayVisits || 0}
            icon={FiCalendar}
            color="blue"
            delay={60}
          />
          <StatCard
            title={t("dashboard.dataClerk.stats.waitingPatients")}
            value={stats?.waitingPatients || 0}
            icon={FiActivity}
            color="orange"
            delay={120}
          />
        </div>

        <div className="bg-white rounded-2xl shadow-sm shadow-slate-200/60 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            {t("dashboard.dataClerk.recentRegistrations")}
          </h3>
          {stats?.recentPatients?.length > 0 ? (
            <div className="space-y-3">
              {stats.recentPatients.map((patient) => (
                <div
                  key={patient.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-emerald-50/60 transition-colors duration-200"
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
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-6">
          {t("dashboard.cashier.title")}
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StatCard
            title={t("dashboard.cashier.stats.pendingPayments")}
            value={stats?.pendingPayments || 0}
            icon={FiUsers}
            color="orange"
            delay={0}
          />
          <StatCard
            title={t("dashboard.cashier.stats.paymentsProcessedToday")}
            value={stats?.todayPaymentsCount || 0}
            icon={FiActivity}
            color="emerald"
            delay={60}
          />
          <StatCard
            title={t("dashboard.cashier.stats.todayRevenue")}
            value={stats?.todayTotalRevenue?.toFixed(2) || "0.00"}
            icon={FiTrendingUp}
            color="blue"
            delay={120}
          />
        </div>

        <div className="bg-white rounded-2xl shadow-sm shadow-slate-200/60 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            {t("dashboard.cashier.recentPayments")}
          </h3>
          {stats?.recentPayments?.length > 0 ? (
            <div className="overflow-x-auto -mx-6 px-6">
              <table className="w-full text-left border-separate border-spacing-0">
                <thead>
                  <tr className="text-gray-500 text-xs uppercase tracking-wide">
                    <th className="pb-3 font-semibold">{t("common.paymentNumber")}</th>
                    <th className="pb-3 font-semibold">{t("common.patient")}</th>
                    <th className="pb-3 font-semibold">{t("common.amount")}</th>
                    <th className="pb-3 font-semibold">{t("common.method")}</th>
                    <th className="pb-3 font-semibold">{t("common.date")}</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentPayments.map((payment) => (
                    <tr
                      key={payment.id}
                      className="text-sm hover:bg-emerald-50/50 transition-colors duration-150"
                    >
                      <td className="py-3 font-medium text-gray-800 border-t border-gray-100">
                        {payment.paymentNumber}
                      </td>
                      <td className="py-3 text-gray-600 border-t border-gray-100">
                        {payment.patient?.firstName} {payment.patient?.lastName}
                      </td>
                      <td className="py-3 font-bold text-emerald-700 border-t border-gray-100">
                        {parseFloat(payment.amount).toFixed(2)} {t("common.currency.etb")}
                      </td>
                      <td className="py-3 capitalize text-gray-600 border-t border-gray-100">
                        {payment.paymentMethod?.replace("_", " ")}
                      </td>
                      <td className="py-3 text-gray-500 border-t border-gray-100">
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

const STAT_CARD_COLORS = {
  emerald: "from-emerald-600 to-teal-600 shadow-emerald-600/25",
  blue: "from-blue-600 to-cyan-600 shadow-blue-600/25",
  purple: "from-purple-600 to-pink-600 shadow-purple-600/25",
  orange: "from-orange-600 to-red-600 shadow-orange-600/25",
};

const StatCard = ({ title, value, icon, color, delay = 0 }) => {
  const Icon = icon;
  return (
    <div
      className={`group relative overflow-hidden bg-gradient-to-br ${STAT_CARD_COLORS[color]} rounded-2xl shadow-lg p-6 text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl animate-fade-in-up`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Decorative glow, purely aesthetic */}
      <div
        aria-hidden
        className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/10 transition-transform duration-300 group-hover:scale-125"
      />
      <div className="relative flex items-center justify-between mb-5">
        <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
          <Icon className="w-5.5 h-5.5" />
        </div>
      </div>
      <p className="relative text-3xl font-extrabold tracking-tight mb-1">
        {value}
      </p>
      <p className="relative text-sm text-white/85">{title}</p>
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
    <div className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
      <span className="text-gray-600 text-sm">{label}</span>
      <span className={`font-bold ${colors[color]}`}>{value}</span>
    </div>
  );
};

export default DashboardPage;
