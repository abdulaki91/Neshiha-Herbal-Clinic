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
    if (!socket) return;

    const handleQueueUpdated = () => {
      toast.success(t("toast.newPatientInQueue"), { icon: "🔔" });
    };

    const handlePatientRegistered = (patient) => {
      if (["data_clerk", "doctor"].includes(user?.role)) {
        toast.success(
          t("toast.patientRegistered", { firstName: patient.firstName, lastName: patient.lastName }),
          { icon: "👤" },
        );
      }
    };

    const handleVisitCreated = () => {
      if (["doctor"].includes(user?.role)) {
        toast.success(t("toast.newVisitCreated"), { icon: "📋" });
      }
    };

    const handleVisitStatusChanged = (visit) => {
      toast.info(t("toast.visitStatus", { status: visit.status }), { icon: "🔄" });
    };

    const handleNotificationNew = (notification) => {
      toast(notification.message, {
        icon: notification.priority === "urgent" ? "🚨" : "📬",
      });
    };

    const handlePrescriptionCreated = () => {
      if (["doctor", "cashier"].includes(user?.role)) {
        toast.success(t("toast.prescriptionAdded"), { icon: "💊" });
      }
    };

    const handleMedicineDispensed = () => {
      if (["doctor", "cashier"].includes(user?.role)) {
        toast.success(t("toast.medicineDispensed"), { icon: "✅" });
      }
    };

    const handlePaymentCompleted = (payment) => {
      if (["doctor", "cashier"].includes(user?.role)) {
        toast.success(
          t("toast.paymentReceived", { amount: payment.amount?.toLocaleString?.() || payment.amount }),
          { icon: "💰" },
        );
      }
    };

    const handleStaffCreated = () => {
      if (["super_admin", "staff_manager"].includes(user?.role)) {
        toast.success(t("toast.staffCreated"), { icon: "🧑‍⚕️" });
      }
    };

    // Room membership (like "queue:updates") doesn't survive a reconnect —
    // it's per-connection server state, not per-user. A plain mount-time
    // subscribeToQueue() call worked once, then silently stopped delivering
    // queue events after any drop/reconnect (sleep, wifi switch, tab
    // backgrounding) for the rest of the session. Re-running this on every
    // "connect" — not just the first — is what makes it durable.
    const attach = () => {
      if (user?.role === "doctor") {
        subscribeToQueue();
        socket.on("queue:updated", handleQueueUpdated);
      }
      socket.on("patient:registered", handlePatientRegistered);
      socket.on("visit:created", handleVisitCreated);
      socket.on("visit:status-changed", handleVisitStatusChanged);
      socket.on("notification:new", handleNotificationNew);
      socket.on("prescription:created", handlePrescriptionCreated);
      socket.on("medicine:dispensed", handleMedicineDispensed);
      socket.on("payment:completed", handlePaymentCompleted);
      socket.on("staff:created", handleStaffCreated);
    };

    const detach = () => {
      socket.off("queue:updated", handleQueueUpdated);
      socket.off("patient:registered", handlePatientRegistered);
      socket.off("visit:created", handleVisitCreated);
      socket.off("visit:status-changed", handleVisitStatusChanged);
      socket.off("notification:new", handleNotificationNew);
      socket.off("prescription:created", handlePrescriptionCreated);
      socket.off("medicine:dispensed", handleMedicineDispensed);
      socket.off("payment:completed", handlePaymentCompleted);
      socket.off("staff:created", handleStaffCreated);
    };

    if (socket.connected) attach();
    socket.on("connect", attach);

    return () => {
      detach();
      socket.off("connect", attach);
    };
  }, [user]);

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-emerald-50/40 to-teal-50/30">
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
