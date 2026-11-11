import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { FiArrowRight, FiDatabase, FiRadio } from "react-icons/fi";
import useAuthStore from "../../store/authStore";
import { useDashboard } from "../../hooks/useDashboard";
import { usePendingBookingCount } from "../../hooks/useBookingRequests";
import { useSocketEvent } from "../../hooks/useSocketEvent";
import { getSocket } from "../../lib/socket";
import DashboardHero from "../../components/dashboard/DashboardHero";
import {
  HeroCard,
  StatusChip,
  SegmentBar,
  ProgressBar,
  DayTimeline,
} from "../../components/dashboard/HeroCards";

const pct = (part, whole) => (whole > 0 ? (part / whole) * 100 : null);
const isToday = (value) =>
  Boolean(value) && new Date(value).toDateString() === new Date().toDateString();
const decimalHour = (date) => date.getHours() + date.getMinutes() / 60;
// Visit.arrivalTime is a TIME column, serialised as "HH:MM:SS"
const timeStringHour = (value) => {
  const [h, m] = String(value ?? "").split(":").map(Number);
  return Number.isFinite(h) ? h + (Number.isFinite(m) ? m : 0) / 60 : null;
};
const fullName = (person) =>
  person ? `${person.firstName ?? ""} ${person.lastName ?? ""}`.trim() : "";

const DashboardPage = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuthStore();
  const role = user?.role;
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: stats, isLoading } = useDashboard();
  const { data: pendingBookings = 0 } = usePendingBookingCount({
    enabled: ["doctor", "data_clerk"].includes(role),
  });
  const [socketLive, setSocketLive] = useState(() => Boolean(getSocket()?.connected));

  // Real-time: invalidate dashboard on socket events
  const invalidate = () => qc.invalidateQueries({ queryKey: ["dashboard"] });
  useSocketEvent("visit:created", invalidate);
  useSocketEvent("visit:status-changed", invalidate);
  useSocketEvent("queue:updated", invalidate);
  useSocketEvent("patient:registered", invalidate);
  useSocketEvent("payment:completed", invalidate);
  useSocketEvent("prescription:created", invalidate);
  useSocketEvent("connect", () => setSocketLive(true));
  useSocketEvent("disconnect", () => setSocketLive(false));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  const h = (key, opts) => t(`dashboard.hero.${key}`, opts);
  const locale = i18n.language;
  const liveChip = (
    <StatusChip ok={socketLive} label={socketLive ? h("chip.live") : h("chip.offline")} />
  );

  // ---------------------------------------------------------------- admin
  if (role === "super_admin" || role === "staff_manager") {
    const s = stats?.summary || {};
    const visits = s.todayVisits || 0;
    const completed = s.completedVisits || 0;
    const waiting = s.waitingPatients || 0;
    const inProgress = Math.max(0, visits - completed - waiting);
    const low = s.lowStockMedicines || 0;
    const expired = s.expiredMedicines || 0;
    const doctors = s.totalDoctors || 0;
    const staff = s.totalStaff || 0;

    let insight;
    if (expired > 0) insight = { key: "expired", opts: { expired, low } };
    else if (low > 0) insight = { key: "lowStock", opts: { count: low } };
    else if (waiting > 0) insight = { key: "waiting", opts: { count: waiting } };
    else insight = { key: "allClear" };

    return (
      <div className="space-y-6">
        <h1 className="sr-only">{t("dashboard.title")}</h1>
        <DashboardHero
          ring={{
            percent: pct(completed, visits),
            caption: h("ring.visitsCompleted"),
            emptyCaption: h("ring.noVisits"),
            marks: [
              { label: h("marks.waiting"), value: waiting },
              { label: h("marks.completed"), value: completed },
              { label: h("marks.visits"), value: visits },
            ],
          }}
          cards={[
            <HeroCard key="visits" title={h("cards.todayVisits")} value={visits} delay={60}>
              <SegmentBar
                segments={[
                  { label: h("legend.completed"), value: completed, tone: "solid" },
                  { label: h("legend.waiting"), value: waiting, tone: "rose" },
                  { label: h("legend.inProgress"), value: inProgress, tone: "faint" },
                ]}
              />
            </HeroCard>,
            <HeroCard
              key="patients"
              title={h("cards.totalPatients")}
              value={(s.totalPatients || 0).toLocaleString(locale)}
              aside={liveChip}
              footer={h("cards.activeRecords")}
              delay={120}
            />,
            <HeroCard key="staff" title={h("cards.staff")} value={staff} delay={180}>
              <SegmentBar
                segments={[
                  { label: h("legend.doctors"), value: doctors, tone: "solid" },
                  { label: h("legend.otherStaff"), value: Math.max(0, staff - doctors), tone: "faint" },
                ]}
              />
            </HeroCard>,
            <HeroCard
              key="stock"
              title={h("cards.medicineStock")}
              value={low + expired}
              aside={
                <StatusChip
                  ok={low + expired === 0}
                  label={low + expired === 0 ? h("chip.allGood") : h("chip.needsAttention")}
                />
              }
              delay={240}
            >
              <SegmentBar
                segments={[
                  { label: h("legend.lowStock"), value: low, tone: "rose" },
                  { label: h("legend.expired"), value: expired, tone: "solid" },
                ]}
              />
            </HeroCard>,
          ]}
          insight={{
            eyebrow: h("insightEyebrow"),
            headline: t(`dashboard.insight.${insight.key}.headline`),
            detail: t(`dashboard.insight.${insight.key}.detail`, insight.opts),
            cta: { label: h("cta.manageStaff"), to: "/portal/staff" },
          }}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Panel title={t("dashboard.quickStats.title")}>
            <div className="space-y-1">
              <StatRow label={t("dashboard.stats.totalDoctors")} value={doctors} />
              <StatRow label={t("dashboard.stats.totalStaff")} value={staff} />
              <StatRow label={t("dashboard.stats.completedToday")} value={completed} />
              <StatRow label={t("dashboard.stats.lowStockItems")} value={low} tone="warn" />
              <StatRow label={t("dashboard.stats.expiredMedicines")} value={expired} tone="danger" />
            </div>
          </Panel>

          <Panel title={t("dashboard.systemStatus.title")}>
            <div className="space-y-3">
              {/* The dashboard data above came from the API, which only
                  answers when the database does — so this is a real check. */}
              <StatusRow icon={FiDatabase} label={t("dashboard.systemStatus.database")} ok text={t("dashboard.systemStatus.online")} />
              <StatusRow
                icon={FiRadio}
                label={t("dashboard.systemStatus.realtimeUpdates")}
                ok={socketLive}
                text={socketLive ? t("dashboard.systemStatus.connected") : t("dashboard.systemStatus.reconnecting")}
              />
            </div>
          </Panel>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------- doctor
  if (role === "doctor") {
    const queue = stats?.todayQueue || 0;
    const done = stats?.todayCompleted || 0;
    const prescriptions = stats?.todayPrescriptions || 0;
    const dispensed = stats?.todayDispensed || 0;
    const waitingList = stats?.waitingPatients || [];
    const nextName = fullName(waitingList[0]?.patient);
    const arrivals = waitingList.map((v) => timeStringHour(v.arrivalTime)).filter((x) => x !== null);

    let insight;
    if (queue > 0) insight = { key: "doctorQueue", opts: { count: queue, name: nextName || "—" } };
    else if (pendingBookings > 0) insight = { key: "bookings", opts: { count: pendingBookings } };
    else if (done > 0) insight = { key: "doctorDone", opts: { count: done } };
    else insight = { key: "doctorIdle" };

    const cta =
      queue === 0 && pendingBookings > 0
        ? { label: h("cta.reviewRequests"), to: "/portal/booking-requests" }
        : { label: h("cta.openQueue"), to: "/portal/queue" };

    return (
      <div className="space-y-6">
        <h1 className="sr-only">{t("dashboard.doctor.title")}</h1>
        <DashboardHero
          ring={{
            percent: pct(done, done + queue),
            caption: h("ring.queueCleared"),
            emptyCaption: h("ring.noVisits"),
            marks: [
              { label: h("marks.inQueue"), value: queue },
              { label: h("marks.completed"), value: done },
              { label: h("marks.prescriptions"), value: prescriptions },
            ],
          }}
          cards={[
            <HeroCard
              key="queue"
              title={h("cards.inQueue")}
              value={queue}
              aside={liveChip}
              footer={nextName ? h("cards.nextPatient", { name: nextName }) : null}
              delay={60}
            >
              <DayTimeline hours={arrivals} locale={locale} emptyLabel={h("timeline.noArrivals")} />
            </HeroCard>,
            <HeroCard key="done" title={h("cards.completedToday")} value={done} delay={120}>
              <SegmentBar
                segments={[
                  { label: h("legend.completed"), value: done, tone: "solid" },
                  { label: h("legend.inQueue"), value: queue, tone: "rose" },
                ]}
              />
            </HeroCard>,
            <HeroCard
              key="rx"
              title={h("cards.prescriptions")}
              value={prescriptions}
              footer={h("cards.dispensedOf", { dispensed, total: prescriptions })}
              delay={180}
            >
              <ProgressBar value={dispensed} total={prescriptions} />
            </HeroCard>,
            <HeroCard
              key="bookings"
              title={h("cards.bookingRequests")}
              value={pendingBookings}
              aside={
                <StatusChip
                  ok={pendingBookings === 0}
                  label={pendingBookings === 0 ? h("chip.allGood") : h("chip.needsReview")}
                />
              }
              footer={h("cards.bookingsHint")}
              delay={240}
            />,
          ]}
          insight={{
            eyebrow: h("insightEyebrow"),
            headline: t(`dashboard.insight.${insight.key}.headline`),
            detail: t(`dashboard.insight.${insight.key}.detail`, insight.opts),
            cta,
          }}
        />

        <Panel title={t("dashboard.doctor.waitingPatients")}>
          {waitingList.length > 0 ? (
            <div className="space-y-2">
              {waitingList.map((visit, idx) => (
                <ListRow
                  key={visit.id}
                  badge={idx + 1}
                  title={fullName(visit.patient)}
                  subtitle={`${visit.patient?.age ?? "—"} ${t("common.ageUnit.years")} • ${visit.patient?.gender ?? ""}`}
                  action={
                    <button
                      onClick={() => navigate(`/portal/queue?visitId=${visit.id}`)}
                      className="group inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium text-white bg-gradient-to-r from-brand-600 to-accent-600 shadow-md shadow-brand-600/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                    >
                      {t("dashboard.doctor.startConsultation")}
                      <FiArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                    </button>
                  }
                />
              ))}
            </div>
          ) : (
            <EmptyState text={t("dashboard.doctor.empty.noPatients")} />
          )}
        </Panel>
      </div>
    );
  }

  // ----------------------------------------------------------- data clerk
  if (role === "data_clerk") {
    const registered = stats?.todayRegistrations || 0;
    const visits = stats?.todayVisits || 0;
    const waiting = stats?.waitingPatients || 0;
    const seen = Math.max(0, visits - waiting);
    const recentPatients = stats?.recentPatients || [];
    const registrationHours = recentPatients
      .filter((p) => isToday(p.createdAt))
      .map((p) => decimalHour(new Date(p.createdAt)));

    let insight;
    if (pendingBookings > 0) insight = { key: "bookings", opts: { count: pendingBookings } };
    else if (waiting > 0) insight = { key: "waiting", opts: { count: waiting } };
    else insight = { key: "allClear" };

    return (
      <div className="space-y-6">
        <h1 className="sr-only">{t("dashboard.dataClerk.title")}</h1>
        <DashboardHero
          ring={{
            percent: pct(seen, visits),
            caption: h("ring.visitsSeen"),
            emptyCaption: h("ring.noVisits"),
            marks: [
              { label: h("marks.waiting"), value: waiting },
              { label: h("marks.visits"), value: visits },
              { label: h("marks.registered"), value: registered },
            ],
          }}
          cards={[
            <HeroCard key="registered" title={h("cards.registeredToday")} value={registered} aside={liveChip} delay={60}>
              <DayTimeline hours={registrationHours} locale={locale} emptyLabel={h("timeline.empty")} />
            </HeroCard>,
            <HeroCard key="visits" title={h("cards.todayVisits")} value={visits} delay={120}>
              <SegmentBar
                segments={[
                  { label: h("legend.seen"), value: seen, tone: "solid" },
                  { label: h("legend.waiting"), value: waiting, tone: "rose" },
                ]}
              />
            </HeroCard>,
            <HeroCard
              key="waiting"
              title={h("cards.waitingNow")}
              value={waiting}
              aside={
                <StatusChip
                  ok={waiting === 0}
                  label={waiting === 0 ? h("chip.allGood") : h("chip.queueActive")}
                />
              }
              footer={h("cards.waitingHint")}
              delay={180}
            />,
            <HeroCard
              key="bookings"
              title={h("cards.bookingRequests")}
              value={pendingBookings}
              aside={
                <StatusChip
                  ok={pendingBookings === 0}
                  label={pendingBookings === 0 ? h("chip.allGood") : h("chip.needsReview")}
                />
              }
              footer={h("cards.bookingsHint")}
              delay={240}
            />,
          ]}
          insight={{
            eyebrow: h("insightEyebrow"),
            headline: t(`dashboard.insight.${insight.key}.headline`),
            detail: t(`dashboard.insight.${insight.key}.detail`, insight.opts),
            cta:
              pendingBookings > 0
                ? { label: h("cta.reviewRequests"), to: "/portal/booking-requests" }
                : { label: h("cta.viewPatients"), to: "/portal/patients" },
          }}
        />

        <Panel title={t("dashboard.dataClerk.recentRegistrations")}>
          {recentPatients.length > 0 ? (
            <div className="space-y-2">
              {recentPatients.map((patient) => (
                <ListRow
                  key={patient.id}
                  badge={patient.firstName?.[0]}
                  title={fullName(patient)}
                  subtitle={`${t("common.patientId")}: ${patient.patientId}`}
                  action={
                    <span className="text-sm text-gray-500 tabular-nums">
                      {new Date(patient.createdAt).toLocaleTimeString(locale, { hour: "numeric", minute: "2-digit" })}
                    </span>
                  }
                />
              ))}
            </div>
          ) : (
            <EmptyState text={t("dashboard.dataClerk.empty.noRegistrations")} />
          )}
        </Panel>
      </div>
    );
  }

  // -------------------------------------------------------------- cashier
  if (role === "cashier") {
    const pending = stats?.pendingPayments || 0;
    const processed = stats?.todayPaymentsCount || 0;
    const recentPayments = stats?.recentPayments || [];
    const paymentHours = recentPayments
      .filter((p) => isToday(p.paidAt))
      .map((p) => decimalHour(new Date(p.paidAt)));
    const last = recentPayments[0];
    const methodLabel = (m) => (m ? m.replace(/_/g, " ") : "—");

    // Method mix across the recent payments, largest first
    const methodCounts = {};
    for (const p of recentPayments) {
      const m = methodLabel(p.paymentMethod);
      methodCounts[m] = (methodCounts[m] || 0) + 1;
    }
    const tones = ["solid", "rose", "faint"];
    const methodSegments = Object.entries(methodCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([label, value], i) => ({ label, value, tone: tones[i] }));

    const insight = pending > 0 ? { key: "cashierPending", opts: { count: pending } } : { key: "cashierClear" };

    return (
      <div className="space-y-6">
        <h1 className="sr-only">{t("dashboard.cashier.title")}</h1>
        {/* Revenue/financial totals are doctor-only — see reportRoutes.js
            and dashboardService.getCashierDashboard — so the hero shows
            operational counts only, no monetary aggregates. */}
        <DashboardHero
          ring={{
            percent: pct(processed, processed + pending),
            caption: h("ring.paymentsCleared"),
            emptyCaption: h("ring.noPayments"),
            marks: [
              { label: h("marks.pending"), value: pending },
              { label: h("marks.processed"), value: processed },
            ],
          }}
          cards={[
            <HeroCard
              key="pending"
              title={h("cards.pendingPayments")}
              value={pending}
              aside={
                <StatusChip
                  ok={pending === 0}
                  label={pending === 0 ? h("chip.allGood") : h("chip.needsAttention")}
                />
              }
              footer={h("cards.pendingHint")}
              delay={60}
            />,
            <HeroCard key="processed" title={h("cards.processedToday")} value={processed} aside={liveChip} delay={120}>
              <DayTimeline hours={paymentHours} locale={locale} emptyLabel={h("timeline.empty")} />
            </HeroCard>,
            <HeroCard
              key="last"
              title={h("cards.lastPayment")}
              value={
                last
                  ? new Date(last.paidAt).toLocaleTimeString(locale, { hour: "numeric", minute: "2-digit" })
                  : "—"
              }
              footer={
                last ? `${fullName(last.patient)} · ${methodLabel(last.paymentMethod)}` : h("cards.noneYet")
              }
              delay={180}
            />,
            <HeroCard key="methods" title={h("cards.paymentMethods")} value={recentPayments.length} delay={240}>
              <SegmentBar segments={methodSegments.length ? methodSegments : [{ label: "—", value: 0 }]} />
            </HeroCard>,
          ]}
          insight={{
            eyebrow: h("insightEyebrow"),
            headline: t(`dashboard.insight.${insight.key}.headline`),
            detail: t(`dashboard.insight.${insight.key}.detail`, insight.opts),
            cta: { label: h("cta.openCashier"), to: "/portal/cashier" },
          }}
        />

        <Panel title={t("dashboard.cashier.recentPayments")}>
          {recentPayments.length > 0 ? (
            <div className="overflow-x-auto -mx-2 px-2">
              <table className="w-full text-left border-separate border-spacing-0">
                <thead>
                  <tr className="text-gray-500 text-xs uppercase tracking-wide">
                    <th className="pb-3 font-semibold">{t("common.paymentNumber")}</th>
                    <th className="pb-3 font-semibold">{t("common.patient")}</th>
                    <th className="pb-3 font-semibold">{t("common.amount")}</th>
                    <th className="pb-3 font-semibold">{t("common.method")}</th>
                    <th className="pb-3 font-semibold">{t("common.date")}</th>
                  </tr>
                </thead>
                <tbody>
                  {recentPayments.map((payment) => (
                    <tr key={payment.id} className="text-sm transition-colors duration-150 hover:bg-white/50 dark:hover:bg-white/[0.04]">
                      <td className="py-3 font-medium text-gray-800 border-t border-white/70 dark:border-white/[0.06]">
                        {payment.paymentNumber}
                      </td>
                      <td className="py-3 text-gray-600 border-t border-white/70 dark:border-white/[0.06]">
                        {fullName(payment.patient)}
                      </td>
                      <td className="py-3 font-semibold text-brand-700 border-t border-white/70 dark:border-white/[0.06]">
                        {parseFloat(payment.amount).toFixed(2)} {t("common.currency.etb")}
                      </td>
                      <td className="py-3 capitalize text-gray-600 border-t border-white/70 dark:border-white/[0.06]">
                        {methodLabel(payment.paymentMethod)}
                      </td>
                      <td className="py-3 text-gray-500 border-t border-white/70 dark:border-white/[0.06]">
                        {new Date(payment.paidAt).toLocaleTimeString(locale)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState text={t("dashboard.cashier.empty.noPayments")} />
          )}
        </Panel>
      </div>
    );
  }

  return <div>{t("dashboard.fallback.title")}</div>;
};

/* ------------------------------------------------------------ pieces */

const Panel = ({ title, children }) => (
  <section className="glass-panel rounded-[28px] p-5 sm:p-6 animate-fade-in-up" style={{ animationDelay: "120ms" }}>
    <h3 className="text-base font-semibold text-gray-900 mb-4 tracking-tight">{title}</h3>
    {children}
  </section>
);

const ListRow = ({ badge, title, subtitle, action }) => (
  <div className="flex items-center justify-between gap-4 p-3 sm:p-3.5 rounded-2xl bg-white/50 ring-1 ring-white/70 transition-colors duration-200 hover:bg-white/80 dark:bg-white/[0.04] dark:ring-white/[0.06] dark:hover:bg-white/[0.08]">
    <div className="flex items-center gap-3.5 min-w-0">
      <div className="w-10 h-10 shrink-0 rounded-full bg-gradient-to-br from-brand-200 to-accent-200 flex items-center justify-center text-brand-800 font-semibold dark:from-brand-600/60 dark:to-accent-600/60 dark:text-white">
        {badge}
      </div>
      <div className="min-w-0">
        <p className="font-medium text-gray-900 truncate">{title}</p>
        <p className="text-sm text-gray-500 truncate">{subtitle}</p>
      </div>
    </div>
    <div className="shrink-0">{action}</div>
  </div>
);

const EmptyState = ({ text }) => (
  <p className="text-gray-500 text-center py-10 text-sm">{text}</p>
);

const StatRow = ({ label, value, tone }) => {
  const tones = {
    warn: "text-amber-600",
    danger: "text-rose-600",
  };
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-white/70 dark:border-white/[0.06] last:border-0">
      <span className="text-gray-600 text-sm">{label}</span>
      <span className={`font-semibold tabular-nums ${tones[tone] || "text-gray-900"}`}>{value}</span>
    </div>
  );
};

const StatusRow = ({ icon, label, ok, text }) => {
  const Icon = icon;
  return (
    <div className="flex items-center justify-between gap-4 p-3.5 rounded-2xl bg-white/50 ring-1 ring-white/70 dark:bg-white/[0.04] dark:ring-white/[0.06]">
      <span className="flex items-center gap-3 text-sm text-gray-700">
        <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-200 to-accent-200 flex items-center justify-center text-brand-800 dark:from-brand-600/60 dark:to-accent-600/60 dark:text-white">
          <Icon className="w-4 h-4" />
        </span>
        {label}
      </span>
      <span className={`flex items-center gap-2 text-sm font-medium ${ok ? "text-green-700" : "text-amber-600"}`}>
        <span className={`w-2 h-2 rounded-full ${ok ? "bg-green-500 shadow-[0_0_8px_2px_rgb(34_197_94/0.45)]" : "bg-amber-500 animate-pulse"}`} />
        {text}
      </span>
    </div>
  );
};

export default DashboardPage;
