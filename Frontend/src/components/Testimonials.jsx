import { t } from "i18next";
import React, { useState } from "react";

const testimonials = [
  {
    name: "Emma S.",
    role: "Wellness Enthusiast",
    text: "Nesiha Herbal Clinic transformed my health completely. The personalized approach and natural remedies made such a difference in my energy levels and overall well-being. I feel like a new person!",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuD0Y94D31VsPg2A71_5WcUyOZ-kroXMKmMXwpVrpjFNypclskhPxui_ZEsIC2DEZpZvImxvJXITSH684Sc81iw5Xf_YYycatLv-WDPbrEwMthHT6j01aGZEZe7OnV7B2FRnU_Uugxh7srAFHtJtD3Bcf_-tQnij5nYPdos4Li5Y20pZyxf8c-kgdwJTWIXUEzxdj6qo2ERPTNXKNGvqVDysoBxhiMoHfo8-F1bVLMDbahQa3kBzoZDaSV2WYs3HZHLivRIqDIsPKo",
    rating: 5,
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    hasVideo: true,
  },
  {
    name: "Liam L.",
    role: "Health Coach",
    text: "I was thoroughly impressed by the knowledge and care at Nesiha. The comprehensive wellness program helped me achieve my health goals naturally. The herbal treatments are incredibly effective!",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuA1wZsT7S5UZg8rTlFjTc2KVDgPuG8I8dqRnb12k97fNEx9K8jjVZsVIEGkSa80zpBy_5UnWOA7rU6gvqVKiBV3Y3Uz46uUMagrbOu3Dm4y8gpRud5Tnf_lixLF6vK_WekYR3a8CTLOl-bLpQVdvDUr0nqWd9UOL6HRX1bNYi3bOj1F_WSxJZXWfcRkXiSjxSrqR6QP0K5edHXIPZKomMzYlHoB89HRTabDzJY4087gqid7BMQeDGmB5fb_f1sGwUPsDoJTxlM5b_Q",
    rating: 5,
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    hasVideo: true,
  },
  {
    name: "Chloe R.",
    role: "Yoga Instructor",
    text: "The natural treatments at Nesiha are gentle yet incredibly effective. I've tried many approaches, but nothing compares to the holistic care I received here. Highly recommend!",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBi8Bb8c_om5YZur3EWWOc1D0tIbKbMtFOxNP_p0JzpBsFESnTPfZsOUv_25zzpTiI3HmDel6ZkATeiUeyt1KIpUpAtyhZNleClu3PfMHo5AMpdlQJiTPsH4i71FaNTAhHrds_shpt4UQlc9l4SkGUAJpPR5KDjy8GHjwhv1n9O2s4nDSt6H-QcKouf-tDKlF1qjgBeIATEhfIXxI1mETvTtqzzgDUvDv9aWuZFKAJQjk4bFrfPTuL6gQR0WelhbMRHf4mCtIIa3Zk",
    rating: 5,
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    hasVideo: true,
  },
  {
    name: "Marcus T.",
    role: "Business Executive",
    text: "After struggling with stress and sleep issues, Nesiha's herbal solutions provided the relief I needed. The team's expertise and personalized care exceeded my expectations.",
    img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",
    rating: 5,
    hasVideo: false,
  },
  {
    name: "Sarah K.",
    role: "Fitness Trainer",
    text: "The detox program at Nesiha was life-changing. I feel more energetic and balanced than ever before. The natural approach really works wonders for long-term health.",
    img: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face",
    rating: 5,
    hasVideo: false,
  },
];

export default function Testimonials() {
  const [selectedTestimonial, setSelectedTestimonial] = useState(null);

  const renderStars = (rating) =>
    Array.from({ length: 5 }, (_, i) => (
      <span
        key={i}
        className={`text-lg ${
          i < rating ? "text-yellow-400" : "text-gray-300"
        }`}
      >
        ★
      </span>
    ));

  return (
    <section
      id="testimonials"
      className="py-20 bg-gradient-to-br from-emerald-50 to-teal-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/*   */}
        <div className="text-center mb-16">
          <h2>{t("testimonials.title")}</h2>
          <p>{t("testimonials.subtitle")}</p>
        </div>

        {/* Featured Video */}
        <div className="mb-16">
          <h3 className="text-2xl font-bold text-gray-800 mb-8 text-center">
            {t("testimonials.featured")}
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {testimonials
              .filter((t) => t.hasVideo)
              .map((testimonial, i) => (
                <div key={i} className="group">
                  <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2">
                    <div className="relative aspect-video bg-gray-200 overflow-hidden">
                      <img
                        src={testimonial.img}
                        alt={testimonial.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <button
                          onClick={() => setSelectedTestimonial(testimonial)}
                          className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors duration-300 group-hover:scale-110"
                        >
                          <svg
                            className="w-8 h-8 text-emerald-600 ml-1"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-bold text-lg text-gray-800">
                          {testimonial.name}
                        </h4>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {testimonial.role}
                      </p>
                      <p className="text-gray-700 leading-relaxed">
                        {testimonial.text}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Written Testimonials */}
        <div className="mb-16">
          <h3 className="text-2xl font-bold text-gray-800 mb-8 text-center">
            More Client Stories
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-emerald-100"
              >
                <div className="flex items-center mb-6">
                  <img
                    src={testimonial.img}
                    alt={testimonial.name}
                    className="w-16 h-16 rounded-full object-cover border-4 border-emerald-100"
                  />
                  <div className="ml-4">
                    <h4 className="font-bold text-lg text-gray-800">
                      {testimonial.name}
                    </h4>
                    <p className="text-sm text-emerald-600">
                      {testimonial.role}
                    </p>
                    <div className="flex mt-1">
                      {renderStars(testimonial.rating)}
                    </div>
                  </div>
                </div>
                <blockquote className="text-gray-700 leading-relaxed italic">
                  "{testimonial.text}"
                </blockquote>
                {testimonial.hasVideo && (
                  <div className="mt-4 flex items-center text-emerald-600 text-sm">
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Video testimonial available
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Video Modal */}
      {selectedTestimonial && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="relative w-full max-w-4xl">
            <button
              onClick={() => setSelectedTestimonial(null)}
              className="absolute -top-12 right-0 text-white text-4xl hover:text-gray-300 transition-colors"
            >
              ×
            </button>
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              <iframe
                src={selectedTestimonial.videoUrl}
                title={`${selectedTestimonial.name} Testimonial`}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
