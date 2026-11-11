import { FiAlertCircle, FiCheckCircle } from "react-icons/fi";

/** Frosted metric tile that sits on the dashboard hero. */
export const HeroCard = ({ title, value, unit, aside, footer, children, delay = 0 }) => (
  <div
    className="hero-glass rounded-[24px] p-5 flex flex-col min-h-[10rem] sm:min-h-[12.5rem] animate-fade-in-up"
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="flex items-start justify-between gap-3">
      <p className="text-sm font-medium text-white/95 dark:text-white/85">{title}</p>
      {aside}
    </div>
    <p className="mt-3 text-4xl sm:text-[2.6rem] font-light tracking-tight leading-none tabular-nums">
      {value}
      {unit && <span className="ml-1.5 text-lg text-white/85 dark:text-white/70">{unit}</span>}
    </p>
    <div className="mt-auto pt-5">{children}</div>
    {footer && <p className="mt-3 text-xs text-white/90 dark:text-white/70 truncate">{footer}</p>}
  </div>
);

// Note: hero colours use the -300 steps (or white) on purpose — the dark
// theme remaps the 50/100/200 steps to faint tints (styles/theme.css),
// which would wash these out on the hero. Secondary text is a little more
// opaque in light mode (`text-white/90 dark:text-white/70`) because the
// light hero is paler, and faint white on it looks soft.

/** Small status line, like the reference's "✓ Connected". */
export const StatusChip = ({ ok, label }) => (
  <span className="inline-flex items-center gap-1.5 text-xs font-medium whitespace-nowrap text-white dark:text-white/90">
    {ok ? (
      <FiCheckCircle className="w-3.5 h-3.5" />
    ) : (
      <FiAlertCircle className="w-3.5 h-3.5 text-rose-300" />
    )}
    {label}
  </span>
);

const TONES = {
  solid: { bar: "bg-white", dot: "bg-white" },
  rose: { bar: "bg-rose-300", dot: "bg-rose-300" },
  faint: { bar: "bg-white/35", dot: "bg-white/40" },
};

/** Proportional stacked bar with a legend. segments: [{label, value, tone}] */
export const SegmentBar = ({ segments }) => {
  const total = segments.reduce((sum, s) => sum + (s.value || 0), 0);
  return (
    <div>
      <div className="flex h-2.5 w-full gap-1">
        {total === 0 ? (
          <div className="flex-1 rounded-full bg-white/20" />
        ) : (
          segments
            .filter((s) => s.value > 0)
            .map((s) => (
              <div
                key={s.label}
                className={`rounded-full transition-[flex-grow] duration-700 ${TONES[s.tone || "solid"].bar}`}
                style={{ flexGrow: s.value, flexBasis: 0 }}
              />
            ))
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-white/95 dark:text-white/80">
        {segments.map((s) => (
          <span key={s.label} className="inline-flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${TONES[s.tone || "solid"].dot}`} />
            {s.label}
            <span className="font-semibold text-white tabular-nums">{s.value}</span>
          </span>
        ))}
      </div>
    </div>
  );
};

/** Single progress bar (value of total). */
export const ProgressBar = ({ value, total }) => {
  const p = total > 0 ? Math.min(1, value / total) : 0;
  return (
    <div className="h-2.5 w-full rounded-full bg-white/20 overflow-hidden">
      <div
        className="h-full rounded-full bg-gradient-to-r from-white to-rose-300 transition-[width] duration-700"
        style={{ width: `${p * 100}%` }}
      />
    </div>
  );
};

/**
 * Today's events on a time axis, bucketed into half hours — the clinic
 * version of the reference's sleep/heart-rate strips. Taller pill = more
 * events in that half hour; the latest bucket gets a glowing dot.
 * hours: decimal hours of each event (e.g. 13.5 = 1:30 PM).
 */
export const DayTimeline = ({ hours, locale, emptyLabel }) => {
  const startH = Math.min(8, ...hours.map((h) => Math.floor(h)));
  const endH = Math.max(18, ...hours.map((h) => Math.ceil(h)));
  const range = endH - startH;

  const buckets = new Map();
  for (const h of hours) {
    const key = Math.floor(h * 2) / 2;
    buckets.set(key, (buckets.get(key) || 0) + 1);
  }
  const maxCount = Math.max(1, ...buckets.values());
  const latest = hours.length ? Math.max(...buckets.keys()) : null;

  const step = range > 12 ? 4 : range > 8 ? 3 : 2;
  const ticks = [];
  for (let h = startH; h <= endH; h += step) ticks.push(h);
  const hourLabel = (h) => {
    const d = new Date();
    d.setHours(h, 0, 0, 0);
    return d.toLocaleTimeString(locale || undefined, { hour: "numeric" });
  };
  const left = (h) => `${((h - startH) / range) * 100}%`;

  return (
    <div>
      <div className="relative h-10">
        <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-white/40 dark:border-white/30" />
        {hours.length === 0 && (
          <span className="absolute inset-x-0 top-0 text-[11px] text-white/90 dark:text-white/70">{emptyLabel}</span>
        )}
        {[...buckets.entries()].map(([h, count]) => {
          const height = 8 + (count / maxCount) * 24;
          const isLatest = h === latest;
          return (
            <span
              key={h}
              className={`absolute top-1/2 w-[5px] -translate-x-1/2 -translate-y-1/2 rounded-full ${
                isLatest ? "bg-white" : "bg-rose-300"
              }`}
              style={{ left: left(h + 0.25), height }}
            >
              {isLatest && (
                <span className="absolute left-1/2 -top-2 -translate-x-1/2 w-3 h-3 rounded-full bg-white shadow-[0_0_12px_4px_rgb(255_255_255/0.55)]" />
              )}
            </span>
          );
        })}
      </div>
      <div className="relative mt-2 h-4 text-[10px] text-white/90 dark:text-white/70">
        {ticks.map((h, i) => (
          <span
            key={h}
            className={`absolute top-0 whitespace-nowrap ${
              i === 0 ? "" : i === ticks.length - 1 && h === endH ? "-translate-x-full" : "-translate-x-1/2"
            }`}
            style={{ left: left(h) }}
          >
            {hourLabel(h)}
          </span>
        ))}
      </div>
    </div>
  );
};
