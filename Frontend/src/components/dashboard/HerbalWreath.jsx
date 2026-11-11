import { useId, useMemo } from "react";
import useThemeStore from "../../store/themeStore";

// Deterministic PRNG so the wreath is laid out identically on every render
// and reload (Math.random would reshuffle it each time).
const mulberry32 = (seed) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const LEAF_PATH = "M0 0C3.5-5.5 12-6.5 19 0C12 6.5 3.5 5.5 0 0Z";
const LEAF_COLORS = ["#7fa585", "#93b598", "#6c9476", "#a8c3a4", "#b9d0b2", "#5f8a6c"];
const FLOWERS = [
  { petal: "#a99de6", center: "#f6dc8f" },
  { petal: "#8f9ce4", center: "#fbe7a8" },
  { petal: "#eaa6c2", center: "#fff1c9" },
  { petal: "#f5cad9", center: "#f3cf7a" },
  { petal: "#faf4f8", center: "#f2c96b" },
  { petal: "#c5b4ef", center: "#fff3d1" },
];
const BUD_COLORS = ["#ffffff", "#e9e1fb", "#f7c9da", "#c9bff2"];

const rad = (deg) => (deg * Math.PI) / 180;

// On the dark hero a wide, soft shadow just adds depth. On the light hero
// the same shadow shows as a grey haze round every leaf and makes the
// wreath look out of focus, so light mode gets a tight, crisp one and
// fully opaque leaves.
const LOOK = {
  dark: { blur: 3, dy: 3, shadow: 0.28, leafMin: 0.78 },
  light: { blur: 1.1, dy: 1.3, shadow: 0.3, leafMin: 0.94 },
};

/**
 * A ring of herb leaves, small flowers and buds drawn as SVG — the
 * clinic's herbal take on the floral wreath in the dashboard reference.
 * Renders a <g>, so it must sit inside an <svg>. Angles are in SVG
 * degrees (0 = 3 o'clock, clockwise); the wreath spans start→end and
 * thins out towards both ends.
 */
const HerbalWreath = ({ cx = 200, cy = 200, radius = 144, start = 42, end = 372, seed = 11 }) => {
  const filterId = `wreath-shadow-${useId().replace(/:/g, "")}`;
  const look = LOOK[useThemeStore((s) => s.theme)] ?? LOOK.light;

  const { vine, leaves, buds, flowers, petals } = useMemo(() => {
    const rand = mulberry32(seed);
    const span = end - start;
    const at = (deg, r) => [cx + r * Math.cos(rad(deg)), cy + r * Math.sin(rad(deg))];
    // 0 at the open ends of the wreath → 1 once 45° in
    const taper = (deg) => Math.min(1, Math.min(deg - start, end - deg) / 45);
    const pick = (list) => list[Math.floor(rand() * list.length)];

    const [vx1, vy1] = at(start + 4, radius);
    const [vx2, vy2] = at(end - 4, radius);
    const vine = `M${vx1} ${vy1}A${radius} ${radius} 0 1 1 ${vx2} ${vy2}`;

    const leaves = [];
    for (let i = 0; i < 230; i++) {
      const deg = start + rand() * span;
      const tp = taper(deg);
      if (rand() > 0.3 + tp) continue;
      const r = radius + (rand() - 0.5) * 38 * (0.45 + tp * 0.55);
      const [x, y] = at(deg, r);
      leaves.push({
        x,
        y,
        rot: deg + 90 + (rand() - 0.5) * 120 + (rand() < 0.5 ? 0 : 180),
        scale: (0.75 + rand() * 0.8) * (0.4 + 0.6 * tp),
        fill: pick(LEAF_COLORS),
        shade: rand(), // 0–1, mapped to an opacity per theme at render
      });
    }

    const buds = [];
    for (let i = 0; i < 110; i++) {
      const deg = start + rand() * span;
      const tp = taper(deg);
      if (rand() > 0.25 + tp) continue;
      const [x, y] = at(deg, radius + (rand() - 0.5) * 40);
      buds.push({ x, y, r: (1.1 + rand() * 1.7) * (0.6 + 0.4 * tp), fill: pick(BUD_COLORS) });
    }

    const flowers = [];
    const flowerCount = 46;
    for (let i = 0; i < flowerCount; i++) {
      const deg = start + ((i + 0.15 + rand() * 0.7) / flowerCount) * span;
      const tp = taper(deg);
      if (tp < 0.2 && rand() > 0.4) continue;
      const [x, y] = at(deg, radius + (rand() - 0.5) * 30);
      flowers.push({
        x,
        y,
        rot: rand() * 72,
        scale: (0.72 + rand() * 0.62) * (0.5 + 0.5 * tp),
        daisy: rand() < 0.28,
        ...pick(FLOWERS),
      });
    }

    // A few loose petals drifting outside the ring
    const petals = [];
    for (let i = 0; i < 16; i++) {
      const deg = start + rand() * span;
      const [x, y] = at(deg, radius + 36 + rand() * 26);
      petals.push({ x, y, rot: rand() * 180, fill: pick(FLOWERS).petal, opacity: 0.45 + rand() * 0.35 });
    }

    return { vine, leaves, buds, flowers, petals };
  }, [cx, cy, radius, start, end, seed]);

  return (
    <g aria-hidden>
      <defs>
        <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy={look.dy} stdDeviation={look.blur} floodColor="#2f2560" floodOpacity={look.shadow} />
        </filter>
      </defs>

      {petals.map((p, i) => (
        <ellipse
          key={`p${i}`}
          rx="1.8"
          ry="3.4"
          fill={p.fill}
          opacity={p.opacity}
          transform={`translate(${p.x} ${p.y}) rotate(${p.rot})`}
        />
      ))}

      <g filter={`url(#${filterId})`}>
        <path d={vine} fill="none" stroke="#6c9476" strokeWidth="1.4" strokeOpacity="0.55" strokeLinecap="round" />

        {leaves.map((l, i) => (
          <path
            key={`l${i}`}
            d={LEAF_PATH}
            fill={l.fill}
            opacity={look.leafMin + l.shade * (1 - look.leafMin)}
            transform={`translate(${l.x} ${l.y}) rotate(${l.rot}) scale(${l.scale})`}
          />
        ))}

        {buds.map((b, i) => (
          <circle key={`b${i}`} cx={b.x} cy={b.y} r={b.r} fill={b.fill} opacity="0.92" />
        ))}

        {flowers.map((f, i) => (
          <g key={`f${i}`} transform={`translate(${f.x} ${f.y}) rotate(${f.rot}) scale(${f.scale})`}>
            {f.daisy
              ? Array.from({ length: 10 }, (_, k) => (
                  <ellipse key={k} cx="0" cy="-6.5" rx="1.9" ry="5.2" fill="#fbf7fa" transform={`rotate(${k * 36})`} />
                ))
              : Array.from({ length: 5 }, (_, k) => (
                  <ellipse key={k} cx="0" cy="-6" rx="4.6" ry="6.6" fill={f.petal} transform={`rotate(${k * 72})`} />
                ))}
            <circle r={f.daisy ? 3.2 : 2.6} fill={f.center} />
          </g>
        ))}
      </g>
    </g>
  );
};

export default HerbalWreath;
