import { FiBell, FiMenu } from "react-icons/fi";
import { useEffect, useState } from "react";
import useAuthStore from "../../store/authStore";
import { getSocket } from "../../lib/socket";

const Topbar = ({ onMenuClick }) => {
  const { user } = useAuthStore();
  const [notifCount, setNotifCount] = useState(0);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNew = () => setNotifCount((c) => c + 1);
    const handleClear = () => setNotifCount(0);

    socket.on("notification:new", handleNew);
    socket.on("visit:status-changed", handleNew);
    socket.on("patient:registered", handleNew);

    return () => {
      socket.off("notification:new", handleNew);
      socket.off("visit:status-changed", handleNew);
      socket.off("patient:registered", handleNew);
    };
  }, []);

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
          <button
            onClick={() => setNotifCount(0)}
            className="relative p-2 rounded-lg hover:bg-gray-100 transition"
          >
            <FiBell className="w-6 h-6 text-gray-600" />
            {notifCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[20px] h-5 flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full px-1">
                {notifCount > 99 ? "99+" : notifCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
