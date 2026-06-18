import { FiBell, FiMenu, FiX, FiCheck, FiGlobe } from "react-icons/fi";
import { useEffect, useState, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import useAuthStore from "../../store/authStore";
import { getSocket } from "../../lib/socket";
import axiosInstance from "../../lib/axios";
import { useNotifications } from "../../hooks/useDashboard";

const Topbar = ({ onMenuClick }) => {
  const { user } = useAuthStore();
  const { t, i18n } = useTranslation();
  const qc = useQueryClient();
  const { data: notifications = [] } = useNotifications();
  const [unreadCount, setUnreadCount] = useState(0);
  const [localNotifs, setLocalNotifs] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const langRef = useRef(null);

  const LANGUAGES = [
    { code: "en", label: t("topbar.lang.english"), native: t("topbar.lang.nativeEnglish") },
    { code: "om", label: t("topbar.lang.oromo"), native: t("topbar.lang.nativeOromo") },
    { code: "am", label: t("topbar.lang.amharic"), native: t("topbar.lang.nativeAmharic") },
    { code: "ar", label: t("topbar.lang.arabic"), native: t("topbar.lang.nativeArabic") },
  ];

  // Merge API notifications with local real-time ones
  const allNotifications = useCallback(() => {
    const apiIds = new Set(notifications.map((n) => n.id));
    const merged = [...notifications];
    for (const n of localNotifs) {
      if (!apiIds.has(n.id)) merged.unshift(n);
    }
    return merged;
  }, [notifications, localNotifs]);

  // Update unread count
  useEffect(() => {
    setUnreadCount(allNotifications().filter((n) => !n.isRead).length);
  }, [notifications, localNotifs]);

  // Real-time: invalidate + add local notification on socket
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const addLocal = (title, message, type = "info") => {
      setLocalNotifs((prev) =>
        [{ id: Date.now().toString(), title, message, type, isRead: false, createdAt: new Date().toISOString() }, ...prev].slice(0, 50),
      );
    };

    const handleNotification = (data) =>
      addLocal(data.title || data.message, data.message || "", data.type);

    const attach = () => {
      socket.on("notification:new", handleNotification);
      socket.on("visit:status-changed", (v) =>
        addLocal(t("topbar.notification.visitUpdated"), t("topbar.notification.visitStatus", { status: v.status?.replace("_", " ") }), "info"),
      );
      socket.on("patient:registered", (p) =>
        addLocal(t("topbar.notification.newPatient"), t("topbar.notification.patientRegistered", { firstName: p.firstName, lastName: p.lastName }), "success"),
      );
      socket.on("payment:completed", (p) =>
        addLocal(t("topbar.notification.paymentReceived"), t("topbar.notification.paymentAmount", { amount: parseFloat(p.amount || 0).toFixed(2) }), "success"),
      );
      socket.on("prescription:created", () =>
        addLocal(t("topbar.notification.prescriptionAdded"), t("topbar.notification.newPrescription"), "info"),
      );
    };

    const detach = () => {
      socket.off("notification:new", handleNotification);
      socket.off("visit:status-changed");
      socket.off("patient:registered");
      socket.off("payment:completed");
      socket.off("prescription:created");
    };

    if (socket.connected) attach();
    socket.on("connect", attach);

    // Also invalidate the API query periodically
    const invalidate = () => qc.invalidateQueries({ queryKey: ["notifications"] });
    socket.on("notification:new", invalidate);

    return () => {
      detach();
      socket.off("connect", attach);
      socket.off("notification:new", invalidate);
    };
  }, [qc]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowDropdown(false);
      if (langRef.current && !langRef.current.contains(e.target)) setShowLangDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await axiosInstance.delete("/notifications");
    } catch {
      // silent
    }
    setLocalNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })));
    qc.invalidateQueries({ queryKey: ["notifications"] });
  };

  const getTypeColor = (type) => {
    switch (type) {
      case "urgent":
      case "error":
        return "bg-red-100 text-red-700";
      case "success":
        return "bg-emerald-100 text-emerald-700";
      case "warning":
        return "bg-yellow-100 text-yellow-700";
      default:
        return "bg-blue-100 text-blue-700";
    }
  };

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return t("topbar.time.justNow");
    if (diff < 3600000) return t("topbar.time.minutesAgo", { m: Math.floor(diff / 60000) });
    if (diff < 86400000) return t("topbar.time.hoursAgo", { h: Math.floor(diff / 3600000) });
    return d.toLocaleDateString();
  };

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
              {t("topbar.greeting", { firstName: user?.firstName })}
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

        <div className="flex items-center space-x-2">
          {/* Language Switcher */}
          <div ref={langRef} className="relative">
            <button
              onClick={() => { setShowLangDropdown(!showLangDropdown); setShowDropdown(false); }}
              className="flex items-center space-x-1 p-2 rounded-lg hover:bg-gray-100 transition text-sm font-medium text-gray-600"
            >
              <FiGlobe className="w-5 h-5" />
              <span className="hidden sm:inline">{i18n.language?.toUpperCase()}</span>
            </button>
            {showLangDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 py-1">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => { i18n.changeLanguage(lang.code); setShowLangDropdown(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition flex items-center justify-between ${
                      i18n.language === lang.code ? "text-emerald-600 font-semibold" : "text-gray-700"
                    }`}
                  >
                    <span>{lang.native}</span>
                    <span className="text-xs text-gray-400">{lang.code.toUpperCase()}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Bell with dropdown */}
          <div ref={dropdownRef} className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="relative p-2 rounded-lg hover:bg-gray-100 transition"
            >
              <FiBell className="w-6 h-6 text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[20px] h-5 flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full px-1">
                  {unreadCount > 99 ? t("topbar.badgeOverflow") : unreadCount}
                </span>
              )}
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-96 flex flex-col">
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-800 text-sm">{t("topbar.notifications")}</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
                    >
                      <FiCheck className="w-3 h-3" />
                      {t("topbar.markAllRead")}
                    </button>
                  )}
                </div>

                <div className="overflow-y-auto flex-1">
                  {(() => {
                    const list = allNotifications();
                    return list.length === 0 ? (
                    <div className="p-6 text-center text-sm text-gray-400">
                      {t("topbar.noNotifications")}
                    </div>
                  ) : (
                    list.slice(0, 20).map((n) => (
                      <div
                        key={n.id}
                        className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition cursor-pointer ${
                          !n.isRead ? "bg-blue-50/50" : ""
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${getTypeColor(n.type)}`}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">
                              {n.title}
                            </p>
                            {n.message && (
                              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                                {n.message}
                              </p>
                            )}
                            <p className="text-xs text-gray-400 mt-1">
                              {formatTime(n.createdAt)}
                            </p>
                          </div>
                          {!n.isRead && (
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />
                          )}
                        </div>
                      </div>
                    ))
                  )})()}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
