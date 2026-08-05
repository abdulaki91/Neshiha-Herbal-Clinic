import { useTranslation } from "react-i18next";
import { usePublicSiteInfo } from "../hooks/usePublicContent";

const SOCIAL_ICONS = { facebookUrl: "📘", instagramUrl: "📷", tiktokUrl: "🎵", twitterUrl: "✖️" };

/** Footer */
export default function Footer() {
  const { t } = useTranslation();
  const { data: info = {} } = usePublicSiteInfo();
  const socialLinks = Object.entries(SOCIAL_ICONS).filter(([key]) => info[key]);

  return (
    <footer className="bg-white border-t border-[#f0f4f0] mt-10 py-8 text-center text-[#638863]">
      {socialLinks.length > 0 && (
        <div className="flex justify-center gap-3 mb-4">
          {socialLinks.map(([key, emoji]) => (
            <a
              key={key}
              href={info[key]}
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 bg-emerald-50 hover:bg-emerald-100 rounded-full flex items-center justify-center transition-colors"
            >
              {emoji}
            </a>
          ))}
        </div>
      )}
      <div className="flex flex-wrap justify-center gap-6 mb-4">
        <a href="#">{t("footer.privacy")}</a>
        <a href="#">{t("footer.terms")}</a>
        <a href="#">{t("footer.quickLinks")}</a>
      </div>
      <p>{t("footer.copyright")}</p>
    </footer>
  );
}
