import { NavLink } from "react-router-dom";
import {
  FiHome,
  FiUsers,
  FiCalendar,
  FiFileText,
  FiSettings,
  FiLogOut,
} from "react-icons/fi";
import useAuthStore from "../../store/authStore";

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuthStore();

  const navigation = {
    super_admin: [
      { name: "Dashboard", to: "/portal", icon: FiHome, end: true },
      { name: "Staff", to: "/portal/staff", icon: FiUsers },
      { name: "Patients", to: "/portal/patients", icon: FiUsers },
      { name: "Visits", to: "/portal/visits", icon: FiCalendar },
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
    ],
    doctor: [
      { name: "Dashboard", to: "/portal", icon: FiHome, end: true },
      { name: "Queue", to: "/portal/queue", icon: FiCalendar },
      { name: "Patients", to: "/portal/patients", icon: FiUsers },
      { name: "Visits", to: "/portal/visits", icon: FiCalendar },
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

        {/* User Info & Logout */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
              <span className="text-emerald-600 font-bold">
                {user?.firstName?.[0]}
                {user?.lastName?.[0]}
              </span>
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-800 text-sm">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 w-full px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
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
