import { useLayoutEffect, useRef, useState } from "react";
import HerbalWreath from "./HerbalWreath";

// All geometry is in the SVG's 400×400 viewBox units.
const C = 200;
const LABEL_R = 192; // thin outer circle carrying the stat labels
const PROGRESS_R = 110; // progress arc between the disc and the wreath
const PROGRESS_LEN = 2 * Math.PI * PROGRESS_R;
const LABEL_FONT = 11.5;
// Label slots, clockwise from 12 o'clock (SVG degrees: 0 = 3 o'clock)
const SLOTS = [
  { deg: -90, x: C, y: C - LABEL_R, rotate: 0 },
  { deg: 0, x: C + LABEL_R, y: C, rotate: 90 },
  { deg: 90, x: C, y: C + LABEL_R, rotate: 0 },
];

const rad = (deg) => (deg * Math.PI) / 180;
const at = (deg, r) => [C + r * Math.cos(rad(deg)), C + r * Math.sin(rad(deg))];
const arcPath = (from, to, r) => {
  const [x1, y1] = at(from, r);
  const [x2, y2] = at(to, r);
  return `M${x1} ${y1}A${r} ${r} 0 ${to - from > 180 ? 1 : 0} 1 ${x2} ${y2}`;
};
// Light-mode values are a touch stronger: the light hero is paler, and
// faint white lines on it look soft rather than delicate.
const OUTER_RING = "[stroke-opacity:0.6] dark:[stroke-opacity:0.45]";
// Half the angle a label of `width` units needs, plus breathing room
const gapFor = (width) => ((width / 2 + 10) / LABEL_R) * (180 / Math.PI);

/**
 * The dashboard's centrepiece: a big percentage in a frosted disc, a
 * progress arc, the herbal wreath, and up to three stat labels set into
 * gaps in a thin outer circle (top, right, bottom).
 *
 * percent: 0–100, or null when there's nothing to measure yet.
 */
const PulseRing = ({ percent, caption, emptyCaption, marks = [] }) => {
  const slots = SLOTS.slice(0, Math.min(marks.length, SLOTS.length));
  const textRefs = useRef([]);
  // Start from a character-count estimate, then measure the real text.
  const [gaps, setGaps] = useState(() =>
    slots.map((_, i) => gapFor(`${marks[i].value}  ${marks[i].label}`.length * 7.4)),
  );

  const markKey = marks.map((m) => `${m.value}|${m.label}`).join("~");
  useLayoutEffect(() => {
    const measured = slots.map((_, i) => {
      const el = textRefs.current[i];
      return el?.getComputedTextLength ? gapFor(el.getComputedTextLength()) : gapFor(80);
    });
    setGaps(measured);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markKey]);

  // Outer circle broken by a gap at each occupied label slot
  const breaks = slots.map((s, i) => ({ deg: s.deg, gap: gaps[i] ?? 0 }));
  const segments = [];
  if (breaks.length === 0) {
    segments.push(null); // full circle
  } else {
    breaks.forEach((b, i) => {
      const next = breaks[i + 1] ?? { deg: breaks[0].deg + 360, gap: breaks[0].gap };
      segments.push(arcPath(b.deg + b.gap, next.deg - next.gap, LABEL_R));
    });
  }

  const hasValue = percent !== null && percent !== undefined;
  const p = hasValue ? Math.max(0, Math.min(100, percent)) / 100 : 0;
  const [kx, ky] = at(-90 + p * 360, PROGRESS_R);

  return (
    <div className="relative aspect-square w-full [container-type:inline-size]">
      <svg viewBox="0 0 400 400" className="absolute inset-0 w-full h-full overflow-visible">
        {segments.map((d, i) =>
          d ? (
            <path key={i} d={d} fill="none" stroke="currentColor" strokeWidth="1" className={OUTER_RING} />
          ) : (
            <circle key={i} cx={C} cy={C} r={LABEL_R} fill="none" stroke="currentColor" strokeWidth="1" className={OUTER_RING} />
          ),
        )}

        {slots.map((s, i) => (
          <text
            key={i}
            ref={(el) => (textRefs.current[i] = el)}
            x={s.x}
            y={s.y}
            transform={s.rotate ? `rotate(${s.rotate} ${s.x} ${s.y})` : undefined}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={LABEL_FONT}
            letterSpacing="1.6"
            fill="currentColor"
            className="uppercase"
          >
            <tspan fontWeight="700">{marks[i].value}</tspan>
            <tspan dx="6" className="[fill-opacity:0.95] dark:[fill-opacity:0.8]">{marks[i].label}</tspan>
          </text>
        ))}

        <HerbalWreath />

        <circle
          cx={C}
          cy={C}
          r={PROGRESS_R}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          className="[stroke-opacity:0.28] dark:[stroke-opacity:0.2]"
        />
        {hasValue && p > 0 && (
          <>
            <circle
              cx={C}
              cy={C}
              r={PROGRESS_R}
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray={PROGRESS_LEN}
              strokeDashoffset={PROGRESS_LEN * (1 - p)}
              transform={`rotate(-90 ${C} ${C})`}
              style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.16, 1, 0.3, 1)" }}
            />
            {/* Glowing knob at the arc's end, like the reference's chart dots */}
            <circle cx={kx} cy={ky} r="9" fill="currentColor" opacity="0.25" />
            <circle cx={kx} cy={ky} r="4.5" fill="currentColor" />
          </>
        )}
      </svg>

      <div className="absolute inset-[26.5%] rounded-full flex flex-col items-center justify-center text-center bg-white/[0.12] border border-white/45 shadow-[inset_0_1px_0_rgb(255_255_255/0.35),0_24px_50px_-24px_rgb(40_30_90/0.6)] backdrop-blur-md dark:bg-white/[0.06] dark:border-white/15">
        <p className="font-extralight tracking-tight leading-none tabular-nums" style={{ fontSize: "15cqw" }}>
          {hasValue ? (
            <>
              {Math.round(percent)}
              <span style={{ fontSize: "0.55em" }}>%</span>
            </>
          ) : (
            "—"
          )}
        </p>
        <p className="mt-[0.6em] px-[10%] font-medium text-white dark:text-white/90 leading-snug" style={{ fontSize: "max(12px, 3.6cqw)" }}>
          {hasValue ? caption : emptyCaption}
        </p>
      </div>
    </div>
  );
};

export default PulseRing;
