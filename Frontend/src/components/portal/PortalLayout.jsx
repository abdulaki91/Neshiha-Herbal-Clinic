import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { subscribeToQueue } from "../../lib/socket";
import useAuthStore from "../../store/authStore";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { useSocketEvent, useSocketOnConnect } from "../../hooks/useSocketEvent";

const PortalLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuthStore();
  const { t } = useTranslation();

  // Room membership (like "queue:updates") doesn't survive a reconnect —
  // it's per-connection server state, not per-user — so re-subscribing on
  // every connect (not just the first) is what keeps queue events durable
  // across a drop/reconnect (sleep, wifi switch, tab backgrounding).
  useSocketOnConnect(() => {
    if (user?.role === "doctor") subscribeToQueue();
  });

  useSocketEvent("queue:updated", () => {
    if (user?.role === "doctor") toast.success(t("toast.newPatientInQueue"), { icon: "🔔" });
  });

  useSocketEvent("patient:registered", (patient) => {
    if (["data_clerk", "doctor"].includes(user?.role)) {
      toast.success(
        t("toast.patientRegistered", { firstName: patient.firstName, lastName: patient.lastName }),
        { icon: "👤" },
      );
    }
  });

  useSocketEvent("visit:created", () => {
    if (user?.role === "doctor") toast.success(t("toast.newVisitCreated"), { icon: "📋" });
  });

  useSocketEvent("visit:status-changed", (visit) => {
    toast(t("toast.visitStatus", { status: visit.status }), { icon: "🔄" });
  });

  useSocketEvent("notification:new", (notification) => {
    toast(notification.message, {
      icon: notification.priority === "urgent" ? "🚨" : "📬",
    });
  });

  useSocketEvent("prescription:created", () => {
    if (["doctor", "cashier"].includes(user?.role)) {
      toast.success(t("toast.prescriptionAdded"), { icon: "💊" });
    }
  });

  useSocketEvent("medicine:dispensed", () => {
    if (["doctor", "cashier"].includes(user?.role)) {
      toast.success(t("toast.medicineDispensed"), { icon: "✅" });
    }
  });

  useSocketEvent("payment:completed", (payment) => {
    if (["doctor", "cashier"].includes(user?.role)) {
      toast.success(
        t("toast.paymentReceived", { amount: payment.amount?.toLocaleString?.() || payment.amount }),
        { icon: "💰" },
      );
    }
  });

  useSocketEvent("staff:created", () => {
    if (["super_admin", "staff_manager"].includes(user?.role)) {
      toast.success(t("toast.staffCreated"), { icon: "🧑‍⚕️" });
    }
  });

  useSocketEvent("booking-request:created", (booking) => {
    if (["data_clerk", "doctor"].includes(user?.role)) {
      toast.success(t("toast.newBookingRequest", { name: booking.fullName }), { icon: "📅" });
    }
  });

  return (
    // `portal-theme` scopes the light/dark theme (styles/theme.css) to the
    // portal; `app-backdrop` is the lavender → rose gradient behind it.
    <div className="portal-theme app-backdrop flex h-screen">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* 16.75rem = sidebar width (16rem) + its 0.75rem inset */}
      <div className="flex-1 min-w-0 flex flex-col lg:ml-[16.75rem]">
        <Topbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default PortalLayout;
