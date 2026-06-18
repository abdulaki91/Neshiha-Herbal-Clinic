import { NavLink } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  FiHome,
  FiUsers,
  FiCalendar,
  FiFileText,
  FiSettings,
  FiLogOut,
  FiDollarSign,
  FiActivity,
  FiPackage,
  FiExternalLink,
} from "react-icons/fi";
import useAuthStore from "../../store/authStore";
import { getSocket } from "../../lib/socket";
import axiosInstance from "../../lib/axios";

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuthStore();
  const [counts, setCounts] = useState({});

  // Fetch initial counts and listen for updates
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        if (user?.role === "doctor") {
          const res = await axiosInstance.get("/visits/queue");
          const queue = res.data?.data || res.data || [];
          setCounts((c) => ({ ...c, "/portal/queue": queue.length }));
        }
        if (user?.role === "cashier") {
          const res = await axiosInstance.get("/payments/pending", { params: { pageSize: 1 } });
          const total = res.data?.pagination?.totalItems || res.data?.data?.visits?.length || 0;
          setCounts((c) => ({ ...c, "/portal/cashier": total }));
        }
      } catch {
        // silent
      }
    };

    fetchCounts();

    const socket = getSocket();
    if (!socket) return;

    const handleQueueUpdated = (visit) => {
      setCounts((c) => ({ ...c, "/portal/queue": (c["/portal/queue"] || 0) + 1 }));
    };

    const handleStatusChanged = (visit) => {
      if (user?.role === "cashier") {
        if (visit.status === "pending_payment") {
          setCounts((c) => ({ ...c, "/portal/cashier": (c["/portal/cashier"] || 0) + 1 }));
        } else if (visit.status === "completed" || visit.status === "cancelled") {
          setCounts((c) => ({ ...c, "/portal/cashier": Math.max(0, (c["/portal/cashier"] || 1) - 1) }));
        }
      }
    };

    socket.on("queue:updated", handleQueueUpdated);
    socket.on("visit:status-changed", handleStatusChanged);
    socket.on("payment:completed", () => {
      setCounts((c) => ({ ...c, "/portal/cashier": Math.max(0, (c["/portal/cashier"] || 1) - 1) }));
    });

    return () => {
      socket.off("queue:updated", handleQueueUpdated);
      socket.off("visit:status-changed", handleStatusChanged);
      socket.off("payment:completed");
    };
  }, [user?.role]);

  const navigation = {
    super_admin: [
      { name: "Dashboard", to: "/portal", icon: FiHome, end: true },
      { name: "Staff", to: "/portal/staff", icon: FiUsers },
      { name: "Patients", to: "/portal/patients", icon: FiUsers },
      { name: "Visits", to: "/portal/visits", icon: FiCalendar },
      { name: "Medicines", to: "/portal/medicines", icon: FiPackage },
      { name: "Cashier", to: "/portal/cashier", icon: FiDollarSign },
      { name: "Laboratory", to: "/portal/laboratory", icon: FiActivity },
      { name: "Reports", to: "/portal/reports", icon: FiFileText },
      { name: "Settings", to: "/portal/settings", icon: FiSettings },
    ],
    staff_manager: [
      { name: "Dashboard", to: "/portal", icon: FiHome, end: true },
      { name: "Staff", to: "/portal/staff", icon: FiUsers },
    ],
    data_clerk: [
      { name: "Dashboard", to: "/portal", icon: FiHome, end: true },
      { name: "Patients", to: "/portal/patients", icon: FiUsers },
      { name: "Visits", to: "/portal/visits", icon: FiCalendar },
      { name: "Medicines", to: "/portal/medicines", icon: FiPackage },
    ],
    doctor: [
      { name: "Dashboard", to: "/portal", icon: FiHome, end: true },
      { name: "Queue", to: "/portal/queue", icon: FiCalendar, showBadge: true },
      { name: "Patients", to: "/portal/patients", icon: FiExternalLink },
      { name: "Visits", to: "/portal/visits", icon: FiCalendar },
      { name: "Medicines", to: "/portal/medicines", icon: FiPackage },
    ],
    cashier: [
      { name: "Dashboard", to: "/portal", icon: FiHome, end: true },
      { name: "Cashier", to: "/portal/cashier", icon: FiDollarSign, showBadge: true },
      { name: "Reports", to: "/portal/reports", icon: FiFileText },
      { name: "Patients", to: "/portal/patients", icon: FiUsers },
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
        className={`fixed left-0 top-0 h-full bg-white shadow-xl z-30 w-64 transform transition-transform duration-300 lg:translate-x-0 flex flex-col ${
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
              <h1 className="font-bold text-gray-800">Neshiha Clinic</h1>
              <p className="text-xs text-gray-500">{user?.role?.replace("_", " ")}</p>
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
                    `flex items-center space-x-3 px-4 py-2.5 rounded-lg transition relative ${
                      isActive
                        ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    }`
                  }
                  onClick={closeIfMobile}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium text-sm">{link.name}</span>
                  {badge > 0 && (
                    <span className="ml-auto min-w-[22px] h-5 flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full px-1.5">
                      {badge > 99 ? "99+" : badge}
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
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
