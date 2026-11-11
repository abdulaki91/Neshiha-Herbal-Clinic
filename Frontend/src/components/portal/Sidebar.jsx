import { NavLink } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  FiHome, FiUsers, FiCalendar, FiFileText, FiSettings,
  FiLogOut, FiDollarSign, FiPackage, FiExternalLink, FiClock,
  FiImage, FiInbox,
} from "react-icons/fi";
import { useTranslation } from "react-i18next";
import useAuthStore from "../../store/authStore";
import { useQueue } from "../../hooks/useVisits";
import { usePendingPayments } from "../../hooks/usePayments";
import { usePendingBookingCount } from "../../hooks/useBookingRequests";
import { useSocketEvent } from "../../hooks/useSocketEvent";
import { THEME_STORAGE_KEY } from "../../store/themeStore";
import BrandMark from "./BrandMark";

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
  const { data: pendingBookings = 0 } = usePendingBookingCount({
    enabled: ["doctor", "data_clerk"].includes(role),
  });

  const counts = {
    "/portal/queue": role === "doctor" ? queue.length : 0,
    "/portal/cashier": role === "cashier" ? pendingPayments.length : 0,
    "/portal/booking-requests": ["doctor", "data_clerk"].includes(role) ? pendingBookings : 0,
  };

  // Real-time: invalidate on socket events
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["queue"] });
    qc.invalidateQueries({ queryKey: ["payments"] });
  };
  const invalidateBookings = () => qc.invalidateQueries({ queryKey: ["booking-requests"] });

  useSocketEvent("queue:updated", invalidate);
  useSocketEvent("visit:status-changed", invalidate);
  useSocketEvent("payment:completed", invalidate);
  useSocketEvent("booking-request:created", invalidateBookings);

  const navigation = {
    // Super admin is an administrative role only — staff accounts, the
    // public website's content, and system settings. Clinical/patient
    // operations (patients, visits, appointments, medicines, cashier,
    // laboratory, reports) belong to the operational staff roles below.
    super_admin: [
      { name: t("sidebar.dashboard"), to: "/portal", icon: FiHome, end: true },
      { name: t("sidebar.staff"), to: "/portal/staff", icon: FiUsers },
      { name: t("sidebar.content"), to: "/portal/content", icon: FiImage },
      { name: t("sidebar.settings"), to: "/portal/settings", icon: FiSettings },
    ],
    staff_manager: [
      { name: t("sidebar.dashboard"), to: "/portal", icon: FiHome, end: true },
      { name: t("sidebar.staff"), to: "/portal/staff", icon: FiUsers },
    ],
    data_clerk: [
      { name: t("sidebar.dashboard"), to: "/portal", icon: FiHome, end: true },
      { name: t("sidebar.bookingRequests"), to: "/portal/booking-requests", icon: FiInbox, showBadge: true },
      { name: t("sidebar.patients"), to: "/portal/patients", icon: FiUsers },
      { name: t("sidebar.visits"), to: "/portal/visits", icon: FiCalendar },
      { name: t("sidebar.appointments"), to: "/portal/appointments", icon: FiClock },
      { name: t("sidebar.medicines"), to: "/portal/medicines", icon: FiPackage },
    ],
    doctor: [
      { name: t("sidebar.dashboard"), to: "/portal", icon: FiHome, end: true },
      { name: t("sidebar.queue"), to: "/portal/queue", icon: FiCalendar, showBadge: true },
      { name: t("sidebar.bookingRequests"), to: "/portal/booking-requests", icon: FiInbox, showBadge: true },
      { name: t("sidebar.patients"), to: "/portal/patients", icon: FiExternalLink },
      { name: t("sidebar.visits"), to: "/portal/visits", icon: FiCalendar },
      { name: t("sidebar.appointments"), to: "/portal/appointments", icon: FiClock },
      { name: t("sidebar.medicines"), to: "/portal/medicines", icon: FiPackage },
      // Revenue/financial reports are doctor-only — see reportRoutes.js
      { name: t("sidebar.reports"), to: "/portal/reports", icon: FiFileText },
    ],
    cashier: [
      { name: t("sidebar.dashboard"), to: "/portal", icon: FiHome, end: true },
      { name: t("sidebar.cashier"), to: "/portal/cashier", icon: FiDollarSign, showBadge: true },
      { name: t("sidebar.patients"), to: "/portal/patients", icon: FiUsers },
    ],
  };

  const links = navigation[user?.role] || [];

  const handleLogout = () => {
    logout();
    // Wipe session data, but keep the user's light/dark choice.
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    localStorage.clear();
    if (savedTheme) localStorage.setItem(THEME_STORAGE_KEY, savedTheme);
    window.location.href = "/signin";
  };

  const closeIfMobile = () => {
    if (window.innerWidth < 1024) onClose();
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-brand-950/30 backdrop-blur-sm z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Floating glass rail — inset from the viewport edges like the
          reference's rounded app shell. */}
      <aside
        className={`glass-panel fixed left-3 top-3 bottom-3 z-30 w-64 rounded-[28px] flex flex-col transform transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-[calc(100%+1.5rem)]"
        }`}
      >
        <div className="px-5 pt-6 pb-5 flex items-center gap-3 shrink-0">
          <BrandMark />
          <div className="min-w-0">
            <h1 className="font-semibold text-gray-900 dark:text-white tracking-tight truncate">
              {t("sidebar.brandName")}
            </h1>
            <p className="text-xs text-gray-500 dark:text-white/50 truncate">
              {t(`roles.${user?.role}`)}
            </p>
          </div>
        </div>

        <div className="mx-5 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent dark:via-white/10 shrink-0" />

        <div className="flex-1 overflow-y-auto">
          <nav className="px-3 py-4 space-y-1">
            {links.map((link) => {
              const Icon = link.icon;
              const badge = link.showBadge ? counts[link.to] : 0;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) =>
                    `group flex items-center gap-3 px-2.5 py-2 rounded-2xl transition-all duration-200 ${
                      isActive
                        ? "bg-white/90 text-gray-900 shadow-[0_12px_28px_-12px_rgb(200_120_165/0.6)] dark:bg-white/10 dark:text-white dark:shadow-[0_12px_28px_-12px_rgb(0_0_0/0.8)] dark:ring-1 dark:ring-white/10"
                        : "text-gray-600 hover:bg-white/50 hover:text-gray-900 dark:text-white/60 dark:hover:bg-white/5 dark:hover:text-white"
                    }`
                  }
                  onClick={closeIfMobile}
                >
                  {({ isActive }) => (
                    <>
                      <span
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-200 ${
                          isActive
                            ? "bg-gradient-to-br from-brand-500 to-accent-400 text-white shadow-md shadow-brand-500/30"
                            : "bg-white/40 text-gray-500 group-hover:text-brand-600 dark:bg-white/5 dark:text-white/50 dark:group-hover:text-white"
                        }`}
                      >
                        <Icon className="w-[18px] h-[18px]" />
                      </span>
                      <span className="font-medium text-sm truncate">{link.name}</span>
                      {badge > 0 && (
                        <span className="ml-auto min-w-[22px] h-5 flex items-center justify-center bg-rose-500 text-white text-[11px] font-bold rounded-full px-1.5 shadow-sm shadow-rose-500/40">
                          {badge > 99 ? t("sidebar.badgeOverflow") : badge}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div className="p-3 shrink-0">
          <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-white/45 ring-1 ring-white/70 dark:bg-white/5 dark:ring-white/10">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-300 to-accent-300 flex items-center justify-center shrink-0 ring-2 ring-white/70 dark:from-brand-600 dark:to-accent-600 dark:ring-white/10">
              <span className="text-brand-900 dark:text-white font-semibold text-sm">
                {user?.firstName?.[0]}
                {user?.lastName?.[0]}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-500 dark:text-white/50 truncate">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              title={t("sidebar.logout")}
              aria-label={t("sidebar.logout")}
              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-gray-500 bg-white/60 hover:text-rose-600 hover:bg-white transition dark:bg-white/5 dark:text-white/60 dark:hover:bg-rose-500/15 dark:hover:text-rose-300"
            >
              <FiLogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
