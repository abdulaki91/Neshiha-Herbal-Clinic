// Leaf mark used in the portal sidebar and on the sign-in page — a compact
// stand-in for the full clinic logo, which has too much padding and text to
// read at icon size.
const BrandMark = ({ className = "w-11 h-11" }) => (
  <div
    className={`${className} shrink-0 rounded-2xl bg-gradient-to-br from-brand-500 to-accent-400 flex items-center justify-center shadow-[0_10px_24px_-10px_rgb(120_90_170/0.7)] ring-1 ring-white/40`}
  >
    <svg
      viewBox="0 0 24 24"
      className="w-[58%] h-[58%] text-white"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M5 19c0-8.5 5.5-14 14-14 0 8.5-5.5 14-14 14Z" fill="currentColor" fillOpacity={0.22} />
      <path d="M5 19 14.5 9.5" />
      <path d="M9.5 14.5h3.5M9.5 14.5V11" />
    </svg>
  </div>
);

export default BrandMark;
