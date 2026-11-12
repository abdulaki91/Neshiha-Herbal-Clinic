import { Link } from "react-router-dom";
import { FiArrowRight } from "react-icons/fi";
import PulseRing from "./PulseRing";

// Two small herb sprigs tucked into the hero's bottom-right corner, echoing
// the greenery peeking into the reference's frame.
const Sprigs = () => (
  <svg
    aria-hidden
    viewBox="0 0 160 160"
    className="pointer-events-none absolute -bottom-3 -right-3 w-36 h-36 sm:w-44 sm:h-44 opacity-80 dark:opacity-60"
  >
    <g fill="none" stroke="#7fa585" strokeWidth="1.6" strokeLinecap="round">
      <path d="M150 160C130 120 112 92 82 64" />
      <path d="M160 128C140 112 128 98 118 72" />
    </g>
    {[
      [128, 128, -40], [118, 112, 150], [108, 98, -50], [100, 86, 140], [92, 76, -60], [86, 68, 130],
      [148, 116, -20], [140, 104, 170], [133, 92, -30], [126, 82, 160],
    ].map(([x, y, r], i) => (
      <path
        key={i}
        d="M0 0C3-5 10-6 16 0C10 6 3 5 0 0Z"
        fill={i % 3 === 0 ? "#a8c3a4" : "#7fa585"}
        transform={`translate(${x} ${y}) rotate(${r}) scale(${1 - (i % 5) * 0.08})`}
      />
    ))}
    <circle cx="84" cy="62" r="2.4" fill="#f6dc8f" />
    <circle cx="118" cy="70" r="2" fill="#f5cad9" />
  </svg>
);

/**
 * Hero panel modelled on the wellness-dashboard reference: ring on the
 * left, a 2×2 grid of frosted metric cards on the right, and an insight
 * line with a white pill call-to-action along the bottom.
 */
const DashboardHero = ({ ring, cards, insight }) => (
  <section className="hero-surface relative overflow-hidden rounded-[32px] text-white p-5 sm:p-8 xl:p-10 animate-fade-in-up">
    {/* Soft light blooms for depth */}
    {/* (kept faint in light mode — white haze over a light hero looks blurry) */}
    <div aria-hidden className="pointer-events-none absolute -top-24 left-1/3 w-96 h-96 rounded-full bg-white/[0.04] blur-3xl dark:bg-white/10" />
    <div aria-hidden className="pointer-events-none absolute -bottom-32 -left-20 w-[28rem] h-[28rem] rounded-full bg-accent-400/20 blur-3xl dark:bg-rose-400/10" />
    <Sprigs />

    <div className="relative grid gap-8 xl:gap-10 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] items-center">
      <div className="mx-auto w-full max-w-[420px] px-2 sm:px-6">
        <PulseRing {...ring} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">{cards}</div>
    </div>

    <div className="relative mt-8 grid gap-6 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] xl:items-end">
      <div>
        <p className="text-sm font-medium text-white/90 dark:text-white/80">{insight.eyebrow}</p>
        <p className="mt-2 text-2xl sm:text-3xl xl:text-[2.35rem] font-normal leading-[1.15] tracking-tight [text-wrap:balance]">
          {insight.headline}
        </p>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <p className="text-sm sm:text-[15px] leading-relaxed text-white/95 dark:text-white/85 max-w-md">{insight.detail}</p>
        {insight.cta && (
          <Link
            to={insight.cta.to}
            className="group shrink-0 self-start sm:self-auto inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-brand-950 shadow-[0_14px_30px_-12px_rgb(40_30_90/0.6)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_36px_-12px_rgb(40_30_90/0.7)]"
          >
            {insight.cta.label}
            <FiArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        )}
      </div>
    </div>
  </section>
);

export default DashboardHero;
