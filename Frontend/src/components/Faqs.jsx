import { useState } from "react";
import { useTranslation } from "react-i18next";
import { usePublicFaqs } from "../hooks/usePublicContent";

export default function Faqs() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language;
  const { data: faqs = [], isLoading } = usePublicFaqs();
  const [openId, setOpenId] = useState(null);

  if (!isLoading && faqs.length === 0) return null;

  return (
    <section id="faq" className="py-20 bg-gradient-to-br from-slate-50 to-emerald-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">
            {t("faqs.title", "Frequently Asked Questions")}
          </h2>
          <p className="text-lg text-gray-600">
            {t("faqs.subtitle", "Answers to common questions")}
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-xl bg-white/60 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {faqs.map((faq) => {
              const isOpen = openId === faq.id;
              return (
                <div
                  key={faq.id}
                  className="bg-white rounded-xl shadow-sm border border-emerald-100 overflow-hidden"
                >
                  <button
                    onClick={() => setOpenId(isOpen ? null : faq.id)}
                    className="w-full flex items-center justify-between px-6 py-4 text-left"
                  >
                    <span className="font-semibold text-gray-800">
                      {faq.question?.[locale] || faq.question?.en}
                    </span>
                    <span
                      className={`text-emerald-600 text-xl transition-transform duration-200 flex-shrink-0 ml-4 ${
                        isOpen ? "rotate-45" : ""
                      }`}
                    >
                      +
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-4 text-gray-600 leading-relaxed">
                      {faq.answer?.[locale] || faq.answer?.en}
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
