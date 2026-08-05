import { useTranslation } from "react-i18next";
import { usePublicTestimonials } from "../hooks/usePublicContent";

const backendBase = (import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1").replace(
  "/api/v1",
  "",
);

export default function Testimonials() {
  const { t, i18n } = useTranslation();
  const { data: testimonials = [], isLoading } = usePublicTestimonials();
  const locale = i18n.language;

  const renderStars = (rating) =>
    Array.from({ length: 5 }, (_, i) => (
      <span
        key={i}
        className={`text-lg ${i < rating ? "text-yellow-400" : "text-gray-300"}`}
      >
        ★
      </span>
    ));

  // No testimonials published yet — don't show an empty section.
  if (!isLoading && testimonials.length === 0) return null;

  return (
    <section
      id="testimonials"
      className="py-20 bg-gradient-to-br from-emerald-50 to-teal-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2>{t("testimonials.title")}</h2>
          <p>{t("testimonials.subtitle")}</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-8 shadow-lg animate-pulse h-56" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial) => (
              <div
                key={testimonial.id}
                className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-emerald-100"
              >
                <div className="flex items-center mb-6">
                  {testimonial.clientPhoto ? (
                    <img
                      src={`${backendBase}/${testimonial.clientPhoto}`}
                      alt={testimonial.clientName}
                      className="w-16 h-16 rounded-full object-cover border-4 border-emerald-100"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-emerald-100 border-4 border-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xl">
                      {testimonial.clientName?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <div className="ml-4">
                    <h4 className="font-bold text-lg text-gray-800">
                      {testimonial.clientName}
                    </h4>
                    <p className="text-sm text-emerald-600">
                      {testimonial.role?.[locale] || testimonial.role?.en}
                      {testimonial.company && ` · ${testimonial.company}`}
                    </p>
                    <div className="flex mt-1">{renderStars(testimonial.rating)}</div>
                  </div>
                </div>
                <blockquote className="text-gray-700 leading-relaxed italic">
                  "{testimonial.text?.[locale] || testimonial.text?.en}"
                </blockquote>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
