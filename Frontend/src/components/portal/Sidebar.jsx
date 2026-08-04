import { NavLink } from "react-router-dom";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  FiHome, FiUsers, FiCalendar, FiFileText, FiSettings,
  FiLogOut, FiDollarSign, FiActivity, FiPackage, FiExternalLink, FiClock,
} from "react-icons/fi";
import { useTranslation } from "react-i18next";
import useAuthStore from "../../store/authStore";
import { getSocket } from "../../lib/socket";
import { useQueue } from "../../hooks/useVisits";
import { usePendingPayments } from "../../hooks/usePayments";

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuthStore();
  const { t } = useTranslation();
  const qc = useQueryClient();
  const role = user?.role;

  // Use hooks for counts — they auto-fetch and stay fresh
  const { data: queue = [] } = useQueue({ enabled: role === "doctor" });
  const { data: pendingPayments = [] } = usePendingPayments(
    role === "cashier" ? "" : "",
    { enabled: role === "cashier" },
  );

  const counts = {
    "/portal/queue": role === "doctor" ? queue.length : 0,
    "/portal/cashier": role === "cashier" ? pendingPayments.length : 0,
  };

  // Real-time: invalidate on socket events
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const invalidate = () => {
      qc.invalidateQueries({ queryKey: ["queue"] });
      qc.invalidateQueries({ queryKey: ["payments"] });
    };
    const attach = () => {
      socket.on("queue:updated", invalidate);
      socket.on("visit:status-changed", invalidate);
      socket.on("payment:completed", invalidate);
    };
    const detach = () => {
      socket.off("queue:updated", invalidate);
      socket.off("visit:status-changed", invalidate);
      socket.off("payment:completed", invalidate);
    };
    if (socket.connected) attach();
    socket.on("connect", attach);
    return () => { detach(); socket.off("connect", attach); };
  }, [qc]);

  const navigation = {
    super_admin: [
      { name: t("sidebar.dashboard"), to: "/portal", icon: FiHome, end: true },
      { name: t("sidebar.staff"), to: "/portal/staff", icon: FiUsers },
      { name: t("sidebar.patients"), to: "/portal/patients", icon: FiUsers },
      { name: t("sidebar.visits"), to: "/portal/visits", icon: FiCalendar },
      { name: t("sidebar.appointments"), to: "/portal/appointments", icon: FiClock },
      { name: t("sidebar.medicines"), to: "/portal/medicines", icon: FiPackage },
      { name: t("sidebar.cashier"), to: "/portal/cashier", icon: FiDollarSign },
      { name: t("sidebar.laboratory"), to: "/portal/laboratory", icon: FiActivity },
      { name: t("sidebar.reports"), to: "/portal/reports", icon: FiFileText },
      { name: t("sidebar.settings"), to: "/portal/settings", icon: FiSettings },
    ],
    staff_manager: [
      { name: t("sidebar.dashboard"), to: "/portal", icon: FiHome, end: true },
      { name: t("sidebar.staff"), to: "/portal/staff", icon: FiUsers },
    ],
    data_clerk: [
      { name: t("sidebar.dashboard"), to: "/portal", icon: FiHome, end: true },
      { name: t("sidebar.patients"), to: "/portal/patients", icon: FiUsers },
      { name: t("sidebar.visits"), to: "/portal/visits", icon: FiCalendar },
      { name: t("sidebar.appointments"), to: "/portal/appointments", icon: FiClock },
      { name: t("sidebar.medicines"), to: "/portal/medicines", icon: FiPackage },
    ],
    doctor: [
      { name: t("sidebar.dashboard"), to: "/portal", icon: FiHome, end: true },
      { name: t("sidebar.queue"), to: "/portal/queue", icon: FiCalendar, showBadge: true },
      { name: t("sidebar.patients"), to: "/portal/patients", icon: FiExternalLink },
      { name: t("sidebar.visits"), to: "/portal/visits", icon: FiCalendar },
      { name: t("sidebar.appointments"), to: "/portal/appointments", icon: FiClock },
      { name: t("sidebar.medicines"), to: "/portal/medicines", icon: FiPackage },
    ],
    cashier: [
      { name: t("sidebar.dashboard"), to: "/portal", icon: FiHome, end: true },
      { name: t("sidebar.cashier"), to: "/portal/cashier", icon: FiDollarSign, showBadge: true },
      { name: t("sidebar.reports"), to: "/portal/reports", icon: FiFileText },
      { name: t("sidebar.patients"), to: "/portal/patients", icon: FiUsers },
    ],
  };

  const links = navigation[user?.role] || [];

  const handleLogout = () => {
    logout();
    localStorage.clear();
    window.location.href = "/signin";
  };

  const closeIfMobile = () => {
    if (window.innerWidth < 1024) onClose();
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-full bg-white shadow-xl border-r border-gray-100 z-30 w-64 transform transition-transform duration-300 lg:translate-x-0 flex flex-col ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="font-bold text-gray-800">{t("sidebar.brandName")}</h1>
              <p className="text-xs text-gray-500">{t(`roles.${user?.role}`)}</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <nav className="p-4 space-y-1">
            {links.map((link) => {
              const Icon = link.icon;
              const badge = link.showBadge ? counts[link.to] : 0;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-all duration-200 relative ${
                      isActive
                        ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/20"
                        : "text-gray-700 hover:bg-emerald-50 hover:text-emerald-700"
                    }`
                  }
                  onClick={closeIfMobile}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium text-sm">{link.name}</span>
                  {badge > 0 && (
                    <span className="ml-auto min-w-[22px] h-5 flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full px-1.5">
                      {badge > 99 ? t("sidebar.badgeOverflow") : badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-gray-200 flex-shrink-0">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
              <span className="text-emerald-600 font-bold">
                {user?.firstName?.[0]}
                {user?.lastName?.[0]}
              </span>
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="font-medium text-gray-800 text-sm truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 w-full px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition font-medium"
          >
            <FiLogOut />
            <span>{t("sidebar.logout")}</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
