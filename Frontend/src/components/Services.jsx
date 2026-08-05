// src/components/Services.jsx
import { useTranslation } from "react-i18next";
import { usePublicServices } from "../hooks/usePublicContent";

// Cosmetic styling per card, cycled by index — kept out of the CMS so the
// admin form stays about content, not design tokens.
const STYLES = [
  { gradient: "from-emerald-400 to-green-500", bgColor: "bg-emerald-50", borderColor: "border-emerald-200" },
  { gradient: "from-cyan-400 to-blue-500", bgColor: "bg-cyan-50", borderColor: "border-cyan-200" },
  { gradient: "from-indigo-400 to-purple-500", bgColor: "bg-indigo-50", borderColor: "border-indigo-200" },
  { gradient: "from-pink-400 to-rose-500", bgColor: "bg-pink-50", borderColor: "border-pink-200" },
  { gradient: "from-orange-400 to-amber-500", bgColor: "bg-orange-50", borderColor: "border-orange-200" },
  { gradient: "from-lime-400 to-emerald-500", bgColor: "bg-lime-50", borderColor: "border-lime-200" },
];

export default function Services() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language;
  const { data: services = [], isLoading } = usePublicServices();

  if (!isLoading && services.length === 0) return null;

  return (
    <section
      id="services"
      className="py-24 bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50 relative overflow-hidden"
    >
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-emerald-200/30 to-teal-200/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-200/30 to-indigo-200/30 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-purple-200/20 to-pink-200/20 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-20">
          <div className="inline-flex items-center px-6 py-3 bg-white/80 backdrop-blur-sm rounded-full border border-emerald-200/50 shadow-lg mb-8">
            <span className="text-emerald-600 font-semibold text-sm uppercase tracking-wider">
              {t("services.title")}
            </span>
          </div>
          <h2 className="text-5xl lg:text-6xl font-bold bg-gradient-to-r from-gray-800 via-emerald-700 to-teal-600 bg-clip-text text-transparent mb-8">
            {t("services.subtitle")}
          </h2>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
            {t("services.desc")}
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-3xl bg-white/60 h-80 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
            {services.map((service, i) => {
              const style = STYLES[i % STYLES.length];
              const features = service.features?.[locale] || service.features?.en || [];
              return (
                <div
                  key={service.id}
                  className={`group relative ${style.bgColor} rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-700 hover:-translate-y-3 border ${style.borderColor} hover:border-opacity-60 overflow-hidden`}
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${style.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-700`}
                  />
                  <div
                    className={`relative w-20 h-20 bg-gradient-to-br ${style.gradient} rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500 shadow-lg`}
                  >
                    <span className="text-4xl drop-shadow-lg">{service.icon}</span>
                  </div>

                  <h3 className="relative text-2xl font-bold text-gray-800 mb-4 group-hover:text-gray-900 transition-colors duration-300">
                    {service.title?.[locale] || service.title?.en}
                  </h3>

                  <p className="relative text-gray-600 mb-8 leading-relaxed">
                    {service.description?.[locale] || service.description?.en}
                  </p>

                  {features.length > 0 && (
                    <div className="relative space-y-4">
                      <h4 className="font-semibold text-gray-700 text-sm uppercase tracking-wider">
                        {t("services.whatsIncluded", { defaultValue: "What's Included:" })}
                      </h4>
                      <ul className="space-y-3">
                        {features.map((feature, j) => (
                          <li
                            key={j}
                            className="flex items-center text-sm text-gray-600 group-hover:text-gray-700 transition-colors duration-300"
                          >
                            <div
                              className={`w-2 h-2 bg-gradient-to-r ${style.gradient} rounded-full mr-4 flex-shrink-0 group-hover:scale-125 transition-transform duration-300`}
                            />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
