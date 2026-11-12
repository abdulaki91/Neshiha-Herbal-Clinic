import { FiBell, FiMenu, FiCheck, FiGlobe, FiMoon, FiSun } from "react-icons/fi";
import { useEffect, useState, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import useAuthStore from "../../store/authStore";
import useThemeStore from "../../store/themeStore";
import axiosInstance from "../../lib/axios";
import { useNotifications } from "../../hooks/useDashboard";
import { useSocketEvent } from "../../hooks/useSocketEvent";

const Topbar = ({ onMenuClick }) => {
  const { user } = useAuthStore();
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
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

  // Real-time: add a local notification (and invalidate the API-backed
  // list) on each relevant socket event. Each useSocketEvent call owns and
  // cleans up only its own listener — unlike the old shared attach/detach
  // pair, unmounting Topbar can never wipe out another component's
  // listener for the same event (see useSocketEvent.js for why).
  const addLocalNotification = useCallback((title, message, type = "info") => {
    setLocalNotifs((prev) =>
      [{ id: Date.now().toString(), title, message, type, isRead: false, createdAt: new Date().toISOString() }, ...prev].slice(0, 50),
    );
  }, []);

  useSocketEvent("notification:new", (data) => {
    addLocalNotification(data.title || data.message, data.message || "", data.type);
    qc.invalidateQueries({ queryKey: ["notifications"] });
  });
  useSocketEvent("visit:status-changed", (v) =>
    addLocalNotification(t("topbar.notification.visitUpdated"), t("topbar.notification.visitStatus", { status: v.status?.replace("_", " ") }), "info"),
  );
  useSocketEvent("patient:registered", (p) =>
    addLocalNotification(t("topbar.notification.newPatient"), t("topbar.notification.patientRegistered", { firstName: p.firstName, lastName: p.lastName }), "success"),
  );
  useSocketEvent("payment:completed", (p) =>
    addLocalNotification(t("topbar.notification.paymentReceived"), t("topbar.notification.paymentAmount", { amount: parseFloat(p.amount || 0).toFixed(2) }), "success"),
  );
  useSocketEvent("prescription:created", () =>
    addLocalNotification(t("topbar.notification.prescriptionAdded"), t("topbar.notification.newPrescription"), "info"),
  );

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

  // Colour of the small status dot beside each notification
  const getTypeColor = (type) => {
    switch (type) {
      case "urgent":
      case "error":
        return "bg-rose-500";
      case "success":
        return "bg-green-500";
      case "warning":
        return "bg-amber-500";
      default:
        return "bg-brand-500";
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

  const isDark = theme === "dark";
  const pillButton =
    "relative w-10 h-10 rounded-full flex items-center justify-center text-gray-600 hover:bg-white/80 hover:text-gray-900 transition dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white";

  return (
    <header className="relative z-20 px-4 sm:px-6 lg:px-8 pt-4">
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-white/60 dark:border-white/10">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onMenuClick}
            className="lg:hidden w-10 h-10 rounded-full glass-panel flex items-center justify-center text-gray-700 dark:text-white/80"
            aria-label="Menu"
          >
            <FiMenu className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h2 className="text-xl sm:text-2xl font-normal tracking-tight text-gray-900 dark:text-white truncate">
              {t("topbar.greeting", { firstName: user?.firstName })}
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-white/50 truncate">
              {new Date().toLocaleDateString(i18n.language || undefined, {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>

        {/* Controls pill — mirrors the bell + avatar capsule in the reference */}
        <div className="glass-panel flex items-center gap-0.5 p-1 rounded-full shrink-0">
          {/* Language Switcher */}
          <div ref={langRef} className="relative">
            <button
              onClick={() => { setShowLangDropdown(!showLangDropdown); setShowDropdown(false); }}
              className={`${pillButton} sm:w-auto sm:px-3 gap-1.5 text-sm font-medium`}
              aria-label="Language"
            >
              <FiGlobe className="w-[18px] h-[18px]" />
              <span className="hidden sm:inline">{i18n.language?.toUpperCase()}</span>
            </button>
            {showLangDropdown && (
              <div className="glass-menu absolute right-0 mt-3 w-52 rounded-2xl z-50 p-1.5 animate-fade-in-up">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => { i18n.changeLanguage(lang.code); setShowLangDropdown(false); }}
                    className={`w-full text-left px-3 py-2.5 text-sm rounded-xl transition flex items-center justify-between ${
                      i18n.language === lang.code
                        ? "bg-brand-50 text-brand-700 font-semibold dark:bg-white/10 dark:text-white"
                        : "text-gray-700 hover:bg-gray-100 dark:text-white/75 dark:hover:bg-white/5"
                    }`}
                  >
                    <span>{lang.native}</span>
                    <span className="text-xs text-gray-400 dark:text-white/40">{lang.code.toUpperCase()}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Light / dark toggle */}
          <button
            onClick={toggleTheme}
            className={pillButton}
            title={isDark ? t("topbar.theme.toLight") : t("topbar.theme.toDark")}
            aria-label={isDark ? t("topbar.theme.toLight") : t("topbar.theme.toDark")}
          >
            {isDark ? <FiSun className="w-[18px] h-[18px]" /> : <FiMoon className="w-[18px] h-[18px]" />}
          </button>

          {/* Bell with dropdown */}
          <div ref={dropdownRef} className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className={pillButton}
              aria-label={t("topbar.notifications")}
            >
              <FiBell className="w-[18px] h-[18px]" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-rose-500 text-white text-[10px] font-bold rounded-full px-1 ring-2 ring-white/80 dark:ring-[#211d38]">
                  {unreadCount > 99 ? t("topbar.badgeOverflow") : unreadCount}
                </span>
              )}
            </button>

            {showDropdown && (
              <div className="glass-menu absolute right-0 mt-3 w-80 max-w-[calc(100vw-2rem)] rounded-2xl z-50 max-h-[26rem] flex flex-col overflow-hidden animate-fade-in-up">
                <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100 dark:border-white/10">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{t("topbar.notifications")}</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-xs text-brand-600 hover:text-brand-700 dark:text-brand-300 dark:hover:text-white font-medium flex items-center gap-1"
                    >
                      <FiCheck className="w-3 h-3" />
                      {t("topbar.markAllRead")}
                    </button>
                  )}
                </div>

                <div className="overflow-y-auto flex-1 p-1.5">
                  {(() => {
                    const list = allNotifications();
                    return list.length === 0 ? (
                    <div className="p-6 text-center text-sm text-gray-400 dark:text-white/40">
                      {t("topbar.noNotifications")}
                    </div>
                  ) : (
                    list.slice(0, 20).map((n) => (
                      <div
                        key={n.id}
                        className={`px-3 py-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition cursor-pointer ${
                          !n.isRead ? "bg-brand-50/70 dark:bg-white/[0.04]" : ""
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${getTypeColor(n.type)}`}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {n.title}
                            </p>
                            {n.message && (
                              <p className="text-xs text-gray-500 dark:text-white/55 mt-0.5 line-clamp-2">
                                {n.message}
                              </p>
                            )}
                            <p className="text-xs text-gray-400 dark:text-white/35 mt-1">
                              {formatTime(n.createdAt)}
                            </p>
                          </div>
                          {!n.isRead && (
                            <span className="w-1.5 h-1.5 bg-brand-500 rounded-full flex-shrink-0 mt-1.5" />
                          )}
                        </div>
                      </div>
                    ))
                  )})()}
                </div>
              </div>
            )}
          </div>

          {/* Avatar */}
          <div
            className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-accent-400 flex items-center justify-center text-white text-sm font-semibold ring-2 ring-white/80 dark:ring-white/10 ml-0.5"
            title={`${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim()}
          >
            {user?.firstName?.[0]}
            {user?.lastName?.[0]}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
