import { useTranslation } from "react-i18next";
import { usePublicPartners } from "../hooks/usePublicContent";

const backendBase = (import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1").replace(
  "/api/v1",
  "",
);

export default function Partners() {
  const { t } = useTranslation();
  const { data: partners = [], isLoading } = usePublicPartners();

  if (!isLoading && partners.length === 0) return null;

  return (
    <section id="partners" className="py-14 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-sm font-semibold text-gray-500 uppercase tracking-wider mb-8">
          {t("partners.title", "Trusted By")}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8 lg:gap-12">
          {partners.map((partner) => {
            const logo = partner.logo && (
              <img
                src={`${backendBase}/${partner.logo}`}
                alt={partner.name}
                className="h-10 lg:h-12 w-auto object-contain grayscale hover:grayscale-0 transition-all duration-300 opacity-70 hover:opacity-100"
              />
            );
            return partner.websiteUrl ? (
              <a
                key={partner.id}
                href={partner.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                {logo || <span className="text-gray-600 font-medium">{partner.name}</span>}
              </a>
            ) : (
              <div key={partner.id}>
                {logo || <span className="text-gray-600 font-medium">{partner.name}</span>}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
