import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import {
  FiPlus,
  FiCalendar,
  FiClock,
  FiUserCheck,
  FiX,
  FiSearch,
} from "react-icons/fi";
import toast from "react-hot-toast";
import VisitForm from "../../components/visits/VisitForm";
import { getSocket } from "../../lib/socket";
import {
  useAppointments,
  useCheckInAppointment,
  useUpdateVisitStatus,
} from "../../hooks/useVisits";

const todayStr = () => new Date().toISOString().split("T")[0];

const formatTime = (time) => {
  if (!time) return "";
  const [h, m] = time.split(":");
  const hour = parseInt(h, 10);
  const period = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${m} ${period}`;
};

const formatDateHeading = (dateStr, t) => {
  if (dateStr === todayStr()) return t("appointments.dateGroup.today");
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (dateStr === tomorrow.toISOString().split("T")[0]) {
    return t("appointments.dateGroup.tomorrow");
  }
  return new Date(dateStr).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
};

const AppointmentsPage = () => {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);

  // Real-time: another front-desk session scheduling, checking in, or
  // cancelling an appointment should reflect here immediately
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const invalidate = () => qc.invalidateQueries({ queryKey: ["appointments"] });
    socket.on("visit:created", invalidate);
    socket.on("visit:status-changed", invalidate);
    return () => {
      socket.off("visit:created", invalidate);
      socket.off("visit:status-changed", invalidate);
    };
  }, [qc]);

  const { data, isLoading, isError } = useAppointments({ search, pageSize: 100 });

  const checkIn = useCheckInAppointment();
  const updateStatus = useUpdateVisitStatus();

  const grouped = useMemo(() => {
    const byDate = {};
    for (const appt of data?.appointments || []) {
      byDate[appt.visitDate] = byDate[appt.visitDate] || [];
      byDate[appt.visitDate].push(appt);
    }
    return Object.entries(byDate).sort(([a], [b]) => a.localeCompare(b));
  }, [data]);

  const handleCheckIn = async (appt) => {
    try {
      await checkIn.mutateAsync(appt.id);
      toast.success(
        t("appointments.toast.checkInSuccess", {
          name: `${appt.patient?.firstName} ${appt.patient?.lastName}`,
        }),
      );
    } catch (error) {
      toast.error(
        error.response?.data?.message || t("appointments.toast.checkInError"),
      );
    }
  };

  const handleCancel = async (appt) => {
    if (!window.confirm(t("appointments.cancelConfirm"))) return;
    try {
      await updateStatus.mutateAsync({ id: appt.id, status: "cancelled" });
      toast.success(t("appointments.toast.cancelSuccess"));
    } catch (error) {
      toast.error(
        error.response?.data?.message || t("appointments.toast.cancelError"),
      );
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            {t("appointments.title")}
          </h1>
          <p className="text-gray-500 mt-1">{t("appointments.subtitle")}</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 hover:-translate-y-0.5 shadow-lg shadow-emerald-600/20"
        >
          <FiPlus />
          <span>{t("appointments.newButton")}</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm shadow-slate-200/60 p-4 mb-6">
        <div className="relative">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder={t("appointments.searchPlaceholder")}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyUp={(e) => e.key === "Enter" && setSearch(searchInput.trim())}
            onBlur={() => setSearch(searchInput.trim())}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      ) : isError ? (
        <div className="py-12 text-center text-red-500 bg-white rounded-2xl shadow-sm shadow-slate-200/60">
          {t("appointments.loadError")}
        </div>
      ) : grouped.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl shadow-sm shadow-slate-200/60 border border-dashed border-gray-200">
          <FiCalendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">{t("appointments.empty")}</p>
          <p className="text-gray-400 text-sm mt-1">
            {t("appointments.emptyHint")}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map(([date, items]) => (
            <div key={date}>
              <h2 className="flex items-center gap-2 text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">
                <FiCalendar className="w-4 h-4" />
                {formatDateHeading(date, t)}
                <span className="font-normal normal-case text-gray-400">
                  · {items.length}{" "}
                  {items.length === 1
                    ? t("appointments.dateGroup.appointment")
                    : t("appointments.dateGroup.appointments")}
                </span>
              </h2>

              <div className="grid grid-cols-1 gap-3">
                {items.map((appt) => {
                  const isToday = date === todayStr();
                  return (
                    <div
                      key={appt.id}
                      className="bg-white rounded-2xl shadow-sm shadow-slate-200/60 hover:shadow-lg transition-all duration-200 p-5 flex items-center justify-between gap-4 flex-wrap"
                    >
                      <div className="flex items-center space-x-4 min-w-0">
                        <div className="w-12 h-12 rounded-full bg-purple-100 flex flex-col items-center justify-center flex-shrink-0">
                          <FiClock className="w-4 h-4 text-purple-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-purple-600">
                            {formatTime(appt.scheduledTime)}
                          </p>
                          <h3 className="font-semibold text-gray-800 truncate">
                            {appt.patient?.firstName} {appt.patient?.lastName}
                          </h3>
                          <p className="text-xs text-gray-500">
                            {appt.patient?.age} {t("common.ageUnit.years")} ·{" "}
                            {appt.patient?.gender} · {appt.patient?.phone}
                          </p>
                          {appt.chiefComplaint && (
                            <p className="text-xs text-gray-500 mt-1 truncate max-w-md">
                              {appt.chiefComplaint}
                            </p>
                          )}
                          {appt.doctor && (
                            <p className="text-xs text-gray-400 mt-0.5">
                              {t("common.doctorPrefix")} {appt.doctor.firstName}{" "}
                              {appt.doctor.lastName}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleCheckIn(appt)}
                          disabled={!isToday || checkIn.isPending}
                          title={
                            isToday
                              ? t("appointments.checkIn")
                              : t("appointments.checkInDisabledHint")
                          }
                          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                        >
                          <FiUserCheck className="w-4 h-4" />
                          {t("appointments.checkIn")}
                        </button>
                        <button
                          onClick={() => handleCancel(appt)}
                          disabled={updateStatus.isPending}
                          title={t("appointments.cancel")}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition disabled:opacity-40"
                        >
                          <FiX className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <VisitForm
          initialMode="appointment"
          onClose={() => setShowForm(false)}
          onSuccess={() => setShowForm(false)}
        />
      )}
    </div>
  );
};

export default AppointmentsPage;
