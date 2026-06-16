import { FiBell, FiMenu } from "react-icons/fi";
import useAuthStore from "../../store/authStore";

const Topbar = ({ onMenuClick }) => {
  const { user } = useAuthStore();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition"
          >
            <FiMenu className="w-6 h-6" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              Welcome, {user?.firstName}!
            </h2>
            <p className="text-sm text-gray-500">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button className="relative p-2 rounded-lg hover:bg-gray-100 transition">
            <FiBell className="w-6 h-6 text-gray-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
