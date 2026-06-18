import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { getSocket, subscribeToQueue } from "../../lib/socket";
import useAuthStore from "../../store/authStore";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";

const PortalLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuthStore();
  const { t } = useTranslation();

  useEffect(() => {
    const socket = getSocket();

    if (socket) {
      // Subscribe to role-specific events
      if (user?.role === "doctor") {
        subscribeToQueue();

        socket.on("queue:updated", (visit) => {
          toast.success(t("toast.newPatientInQueue"), {
            icon: "🔔",
          });
        });
      }

      socket.on("patient:registered", (patient) => {
        if (["super_admin", "data_clerk", "doctor"].includes(user?.role)) {
          toast.success(
            t("toast.patientRegistered", { firstName: patient.firstName, lastName: patient.lastName }),
            {
              icon: "👤",
            },
          );
        }
      });

      socket.on("visit:created", (visit) => {
        if (["super_admin", "doctor"].includes(user?.role)) {
          toast.success(t("toast.newVisitCreated"), {
            icon: "📋",
          });
        }
      });

      socket.on("visit:status-changed", (visit) => {
        toast.info(t("toast.visitStatus", { status: visit.status }), {
          icon: "🔄",
        });
      });

      socket.on("notification:new", (notification) => {
        toast(notification.message, {
          icon: notification.priority === "urgent" ? "🚨" : "📬",
        });
      });

      socket.on("prescription:created", (prescription) => {
        if (["super_admin", "doctor", "cashier"].includes(user?.role)) {
          toast.success(t("toast.prescriptionAdded"), {
            icon: "💊",
          });
        }
      });

      socket.on("medicine:dispensed", (result) => {
        if (["super_admin", "doctor", "cashier"].includes(user?.role)) {
          toast.success(t("toast.medicineDispensed"), {
            icon: "✅",
          });
        }
      });

      socket.on("payment:completed", (payment) => {
        if (["super_admin", "doctor", "cashier"].includes(user?.role)) {
          toast.success(
            t("toast.paymentReceived", { amount: payment.amount?.toLocaleString?.() || payment.amount }),
            {
              icon: "💰",
            },
          );
        }
      });
    }

    return () => {
      if (socket) {
        socket.off("queue:updated");
        socket.off("patient:registered");
        socket.off("visit:created");
        socket.off("visit:status-changed");
        socket.off("notification:new");
        socket.off("prescription:created");
        socket.off("medicine:dispensed");
        socket.off("payment:completed");
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
