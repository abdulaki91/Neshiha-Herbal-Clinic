import { useState } from "react";
import { useTranslation } from "react-i18next";
import { usePublicSuccessStories } from "../hooks/usePublicContent";

const backendBase = (import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1").replace(
  "/api/v1",
  "",
);

export default function SuccessStories() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language;
  const { data: stories = [], isLoading } = usePublicSuccessStories();
  const [selected, setSelected] = useState(null);

  if (!isLoading && stories.length === 0) return null;

  return (
    <section id="success-stories" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">
            {t("successStories.title", "Success Stories")}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {t("successStories.subtitle", "Real outcomes from real patients")}
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl bg-gray-100 h-72 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {stories.map((story) => (
              <button
                key={story.id}
                onClick={() => setSelected(story)}
                className="text-left bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-emerald-100 overflow-hidden"
              >
                {story.images?.[0] && (
                  <div className="aspect-video bg-gray-100 overflow-hidden">
                    <img
                      src={`${backendBase}/${story.images[0]}`}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-6">
                  {story.category && (
                    <span className="inline-block mb-2 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold">
                      {story.category}
                    </span>
                  )}
                  <h3 className="font-bold text-lg text-gray-800 mb-2">
                    {story.title?.[locale] || story.title?.en}
                  </h3>
                  <p className="text-gray-600 text-sm line-clamp-3">
                    {story.description?.[locale] || story.description?.en}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {selected.images?.[0] && (
              <img
                src={`${backendBase}/${selected.images[0]}`}
                alt=""
                className="w-full aspect-video object-cover rounded-t-2xl"
              />
            )}
            <div className="p-8 space-y-4">
              <h3 className="text-2xl font-bold text-gray-800">
                {selected.title?.[locale] || selected.title?.en}
              </h3>
              <p className="text-gray-700 leading-relaxed">
                {selected.description?.[locale] || selected.description?.en}
              </p>
              {(selected.outcomes?.[locale] || selected.outcomes?.en) && (
                <div>
                  <h4 className="font-semibold text-gray-800 mb-1">
                    {t("successStories.outcomes", "Outcomes")}
                  </h4>
                  <p className="text-gray-600">
                    {selected.outcomes?.[locale] || selected.outcomes?.en}
                  </p>
                </div>
              )}
              <button
                onClick={() => setSelected(null)}
                className="mt-4 px-5 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
              >
                {t("common.close", "Close")}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
