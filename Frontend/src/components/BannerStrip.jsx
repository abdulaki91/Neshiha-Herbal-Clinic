import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiX } from "react-icons/fi";
import { usePublicBanners } from "../hooks/usePublicContent";

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
    <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-center gap-4 text-sm relative">
        <div className="flex items-center gap-2 text-center flex-wrap justify-center">
          <span className="font-semibold">{banner.title?.[locale] || banner.title?.en}</span>
          {(banner.subtitle?.[locale] || banner.subtitle?.en) && (
            <span className="text-emerald-100">
              {banner.subtitle?.[locale] || banner.subtitle?.en}
            </span>
          )}
          {banner.ctaLink && (banner.ctaText?.[locale] || banner.ctaText?.en) && (
            <a
              href={banner.ctaLink}
              className="underline font-medium hover:text-emerald-100 transition"
            >
              {banner.ctaText?.[locale] || banner.ctaText?.en}
            </a>
          )}
        </div>
        <button
          onClick={() => setDismissed((prev) => [...prev, banner.id])}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-white/20 rounded-full transition"
          aria-label="Dismiss"
        >
          <FiX className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
