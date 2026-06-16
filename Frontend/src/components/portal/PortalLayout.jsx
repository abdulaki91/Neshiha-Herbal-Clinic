import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { getSocket, subscribeToQueue } from "../../lib/socket";
import useAuthStore from "../../store/authStore";
import toast from "react-hot-toast";

const PortalLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuthStore();

  useEffect(() => {
    const socket = getSocket();

    if (socket) {
      // Subscribe to role-specific events
      if (user?.role === "doctor") {
        subscribeToQueue();

        socket.on("queue:updated", (visit) => {
          toast.success("New patient in queue", {
            icon: "🔔",
          });
        });
      }

      socket.on("patient:registered", (patient) => {
        if (["super_admin", "data_clerk", "doctor"].includes(user?.role)) {
          toast.success(
            `New patient registered: ${patient.firstName} ${patient.lastName}`,
            {
              icon: "👤",
            },
          );
        }
      });

      socket.on("visit:created", (visit) => {
        if (["super_admin", "doctor"].includes(user?.role)) {
          toast.success("New visit created", {
            icon: "📋",
          });
        }
      });

      socket.on("visit:status-changed", (visit) => {
        toast.info(`Visit status: ${visit.status}`, {
          icon: "🔄",
        });
      });

      socket.on("notification:new", (notification) => {
        toast(notification.message, {
          icon: notification.priority === "urgent" ? "🚨" : "📬",
        });
      });
    }

    return () => {
      if (socket) {
        socket.off("queue:updated");
        socket.off("patient:registered");
        socket.off("visit:created");
        socket.off("visit:status-changed");
        socket.off("notification:new");
      }
    };
  }, [user]);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col lg:ml-64">
        <Topbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default PortalLayout;
