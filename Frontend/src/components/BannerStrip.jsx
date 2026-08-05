import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiX } from "react-icons/fi";
import { usePublicBanners } from "../hooks/usePublicContent";

// Fixed, single-line height so the header/hero offset that accounts for
// this strip (see Header.jsx / Hero.jsx) stays correct regardless of copy
// length — h-9/h-10 below must match BANNER_HEIGHT_CLASS there.
export default function BannerStrip() {
  const { i18n } = useTranslation();
  const locale = i18n.language;
  const { data: banners = [] } = usePublicBanners();
  const [dismissed, setDismissed] = useState([]);
  const [index, setIndex] = useState(0);

  const visible = banners.filter((b) => !dismissed.includes(b.id));

  useEffect(() => {
    if (visible.length < 2) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % visible.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [visible.length]);

  if (visible.length === 0) return null;

  const banner = visible[index % visible.length];

  return (
    <div className="h-9 lg:h-10 bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-center gap-4 text-xs lg:text-sm relative">
        <div className="flex items-center gap-2 truncate">
          <span className="font-semibold truncate">
            {banner.title?.[locale] || banner.title?.en}
          </span>
          {(banner.subtitle?.[locale] || banner.subtitle?.en) && (
            <span className="text-emerald-100 truncate hidden sm:inline">
              {banner.subtitle?.[locale] || banner.subtitle?.en}
            </span>
          )}
          {banner.ctaLink && (banner.ctaText?.[locale] || banner.ctaText?.en) && (
            <a
              href={banner.ctaLink}
              className="underline font-medium hover:text-emerald-100 transition flex-shrink-0"
            >
              {banner.ctaText?.[locale] || banner.ctaText?.en}
            </a>
          )}
        </div>
        <button
          onClick={() => setDismissed((prev) => [...prev, banner.id])}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-white/20 rounded-full transition flex-shrink-0"
          aria-label="Dismiss"
        >
          <FiX className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
        </button>
      </div>
    </div>
  );
}
