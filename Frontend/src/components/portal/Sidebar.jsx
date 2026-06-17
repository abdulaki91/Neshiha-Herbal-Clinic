import { NavLink } from "react-router-dom";
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
  FiClock,
} from "react-icons/fi";
import useAuthStore from "../../store/authStore";
import { useEffect, useState } from "react";

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuthStore();
  const [recentPatients, setRecentPatients] = useState([]);

  useEffect(() => {
    // Load recent patients from localStorage
    const saved = localStorage.getItem("recentPatients");
    if (saved) {
      try {
        setRecentPatients(JSON.parse(saved).slice(0, 5));
      } catch (e) {
        setRecentPatients([]);
      }
    }

    // Listen for updates to recent patients
    const handleStorageChange = () => {
      const updated = localStorage.getItem("recentPatients");
      if (updated) {
        setRecentPatients(JSON.parse(updated).slice(0, 5));
      }
    };

    window.addEventListener("recentPatientsUpdated", handleStorageChange);
    return () =>
      window.removeEventListener("recentPatientsUpdated", handleStorageChange);
  }, []);

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
      { name: "Queue", to: "/portal/queue", icon: FiCalendar },
      { name: "Patients", to: "/portal/patients", icon: FiUsers },
      { name: "Visits", to: "/portal/visits", icon: FiCalendar },
      { name: "Medicines", to: "/portal/medicines", icon: FiPackage },
    ],
    cashier: [
      { name: "Dashboard", to: "/portal", icon: FiHome, end: true },
      { name: "Cashier", to: "/portal/cashier", icon: FiDollarSign },
      { name: "Patients", to: "/portal/patients", icon: FiUsers },
    ],
  };

  const links = navigation[user?.role] || [];

  const handleLogout = () => {
    logout();
    localStorage.clear();
    window.location.href = "/signin";
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full bg-white shadow-xl z-30 w-64 transform transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-lg flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div>
              <h1 className="font-bold text-gray-800">Neshiha Clinic</h1>
              <p className="text-xs text-gray-500">
                {user?.role?.replace("_", " ")}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto">
          <nav className="p-4 space-y-2">
            {links.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                      isActive
                        ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    }`
                  }
                  onClick={() => {
                    if (window.innerWidth < 1024) onClose();
                  }}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{link.name}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Recent Patients Section */}
          {(user?.role === "doctor" ||
            user?.role === "data_clerk" ||
            user?.role === "super_admin") &&
            recentPatients.length > 0 && (
              <div className="px-4 py-6 border-t border-gray-100">
                <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center">
                  <FiClock className="mr-2" />
                  Recent Patients
                </p>
                <div className="space-y-1">
                  {recentPatients.map((patient) => (
                    <NavLink
                      key={patient.id}
                      to={`/portal/patients/${patient.id}`}
                      className="flex items-center px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition"
                      onClick={() => {
                        if (window.innerWidth < 1024) onClose();
                      }}
                    >
                      <div className="w-2 h-2 rounded-full bg-emerald-400 mr-3" />
                      <span className="truncate">
                        {patient.firstName} {patient.lastName}
                      </span>
                    </NavLink>
                  ))}
                </div>
              </div>
            )}
        </div>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-gray-200">
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
