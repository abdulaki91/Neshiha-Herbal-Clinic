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
  FiSearch,
  FiExternalLink,
} from "react-icons/fi";
import useAuthStore from "../../store/authStore";
import { useEffect, useState, useMemo } from "react";

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuthStore();
  const [recentPatients, setRecentPatients] = useState([]);
  const [patientFilter, setPatientFilter] = useState("");

  useEffect(() => {
    const loadPatients = () => {
      const saved = localStorage.getItem("recentPatients");
      if (saved) {
        try {
          setRecentPatients(JSON.parse(saved));
        } catch {
          setRecentPatients([]);
        }
      }
    };

    loadPatients();

    const handleStorageChange = () => loadPatients();
    window.addEventListener("recentPatientsUpdated", handleStorageChange);
    return () =>
      window.removeEventListener("recentPatientsUpdated", handleStorageChange);
  }, []);

  const filteredPatients = useMemo(() => {
    if (!patientFilter.trim()) return recentPatients;
    const q = patientFilter.toLowerCase();
    return recentPatients.filter(
      (p) =>
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(q) ||
        (p.patientId || "").toLowerCase().includes(q),
    );
  }, [recentPatients, patientFilter]);

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
  const showPatients =
    user?.role === "data_clerk" ||
    user?.role === "super_admin";

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
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full bg-white shadow-xl z-30 w-64 transform transition-transform duration-300 lg:translate-x-0 flex flex-col ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-gray-200 flex-shrink-0">
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

        {/* Scrollable middle section */}
        <div className="flex-1 overflow-y-auto">
          {/* Navigation */}
          <nav className="p-4 space-y-1">
            {links.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-4 py-2.5 rounded-lg transition ${
                      isActive
                        ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    }`
                  }
                  onClick={closeIfMobile}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium text-sm">{link.name}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Previous Patients Section */}
          {showPatients && (
            <div className="px-4 py-4 border-t border-gray-100">
              <div className="flex items-center justify-between px-1 mb-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center">
                  <FiClock className="mr-2" />
                  Previous Patients
                </p>
                <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                  {recentPatients.length}
                </span>
              </div>

              {/* Search filter */}
              {recentPatients.length > 0 && (
                <div className="relative mb-2">
                  <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Filter patients..."
                    value={patientFilter}
                    onChange={(e) => setPatientFilter(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none bg-gray-50"
                  />
                </div>
              )}

              {/* Patient list with scroll */}
              {filteredPatients.length > 0 ? (
                <div className="max-h-48 overflow-y-auto space-y-0.5">
                  {filteredPatients.map((patient) => (
                    <NavLink
                      key={patient.id}
                      to={`/portal/patients/${patient.id}`}
                      className="flex items-center px-2 py-1.5 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition"
                      onClick={closeIfMobile}
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-2.5 flex-shrink-0" />
                      <span className="truncate">
                        {patient.firstName} {patient.lastName}
                      </span>
                      {patient.patientId && (
                        <span className="ml-auto text-xs text-gray-400 flex-shrink-0 pl-1">
                          #{patient.patientId}
                        </span>
                      )}
                    </NavLink>
                  ))}
                </div>
              ) : recentPatients.length > 0 && patientFilter ? (
                <p className="text-xs text-gray-400 text-center py-2">
                  No patients match "{patientFilter}"
                </p>
              ) : recentPatients.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-2">
                  No previous patients yet
                </p>
              ) : null}

              {/* View All link */}
              <NavLink
                to="/portal/patients"
                className="flex items-center justify-center space-x-1 mt-2 px-3 py-1.5 text-xs text-emerald-600 hover:bg-emerald-50 rounded-lg transition font-medium"
                onClick={closeIfMobile}
              >
                <FiExternalLink className="w-3 h-3" />
                <span>View All Patients</span>
              </NavLink>
            </div>
          )}
        </div>

        {/* User Info & Logout */}
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
