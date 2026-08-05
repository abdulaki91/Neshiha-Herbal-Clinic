import { Helmet } from "react-helmet-async";
import { useLanguage } from "../i18n/hooks/useLanguage";
import { usePublicSiteInfo } from "../hooks/usePublicContent";

export default function About() {
  const { t, currentLanguage } = useLanguage();
  const isRTL = currentLanguage === "ar";
  const { data: info = {} } = usePublicSiteInfo();
  const locale = currentLanguage;

  const aboutText = info.aboutText?.[locale] || info.aboutText?.en;
  const mission = info.mission?.[locale] || info.mission?.en;

  return (
    <>
      {/* SEO Metadata */}
      <Helmet>
        <html lang={currentLanguage} dir={isRTL ? "rtl" : "ltr"} />
        <title>{t("about.metaTitle", "About Us - Nesiha Herbal Clinic")}</title>
        <meta
          name="description"
          content={t(
            "about.metaDescription",
            "Learn about Nesiha Herbal Clinic, where traditional herbal wisdom meets modern science. Discover our certified practitioners, natural ingredients, and holistic approach."
          )}
        />
        <meta
          name="keywords"
          content={t(
            "about.metaKeywords",
            "herbal clinic, Nesiha herbal, mana qorichaa aadaa, natural remedies, holistic healing, alternative medicine, Oromia herbal clinic, Ethiopia herbal treatment"
          )}
        />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://nesihaherbalclinic.com/about" />
      </Helmet>

      {/* About Section */}
      <section
        id="about"
        className="py-16 bg-gradient-to-br from-emerald-50 to-teal-50 about-section"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2
              className="text-4xl font-bold text-gray-800 mb-4"
              dir={isRTL ? "rtl" : "ltr"}
              lang={currentLanguage}
            >
              {t("about.title")}
            </h2>
            <p
              className="text-xl text-gray-600 max-w-3xl mx-auto"
              dir={isRTL ? "rtl" : "ltr"}
              lang={currentLanguage}
            >
              {info.tagline?.[locale] || info.tagline?.en || t("about.subtitle")}
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Content */}
            <div className="space-y-6">
              {aboutText ? (
                <p
                  className="text-lg text-gray-700 leading-relaxed"
                  dir={isRTL ? "rtl" : "ltr"}
                  lang={currentLanguage}
                >
                  {aboutText}
                </p>
              ) : (
                <p
                  className="text-lg text-gray-700 leading-relaxed"
                  dir={isRTL ? "rtl" : "ltr"}
                  lang={currentLanguage}
                >
                  {t("about.description")}
                </p>
              )}

              {/* Stats */}
              {(info.yearsExperience || info.patientsServed || info.treatmentsOffered) && (
                <div className="grid grid-cols-3 gap-6 pt-8 stats-grid">
                  {info.yearsExperience != null && (
                    <div className="text-center">
                      <div className="text-3xl font-bold text-emerald-600 mb-2">
                        {info.yearsExperience}+
                      </div>
                      <p className="text-sm text-gray-600">{t("about.experience")}</p>
                    </div>
                  )}
                  {info.patientsServed != null && (
                    <div className="text-center">
                      <div className="text-3xl font-bold text-teal-600 mb-2">
                        {info.patientsServed}+
                      </div>
                      <p className="text-sm text-gray-600">{t("about.patients")}</p>
                    </div>
                  )}
                  {info.treatmentsOffered != null && (
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600 mb-2">
                        {info.treatmentsOffered}+
                      </div>
                      <p className="text-sm text-gray-600">{t("about.treatments")}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Image/Visual */}
            <div className="relative">
              <div className="bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl p-8 text-white text-center">
                <div className="text-6xl mb-4">🌿</div>
                <h3 className="text-xl font-semibold mb-2">
                  {t("about.herbalWisdom", "Traditional Herbal Wisdom")}
                </h3>
                <p className="text-emerald-100">
                  {mission || t("about.herbalWisdomDesc", "Passed down through generations")}
                </p>
              </div>

              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-yellow-400/20 rounded-full blur-xl animate-pulse floating-element"></div>
              <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-purple-400/20 rounded-full blur-xl animate-pulse delay-1000 floating-element"></div>
            </div>
          </div>

          {/* Additional Features */}
          <div className="grid md:grid-cols-3 gap-8 mt-16 feature-grid">
            <div className="text-center p-6 bg-white rounded-xl shadow-lg feature-card">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🏥</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {t("about.certifiedPractitioners", "Certified Practitioners")}
              </h3>
              <p className="text-gray-600">
                {t(
                  "about.certifiedPractitionersDesc",
                  "Our team consists of certified herbal medicine practitioners with extensive training and experience."
                )}
              </p>
            </div>

            <div className="text-center p-6 bg-white rounded-xl shadow-lg feature-card">
              <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🌱</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {t("about.naturalIngredients", "Natural Ingredients")}
              </h3>
              <p className="text-gray-600">
                {t(
                  "about.naturalIngredientsDesc",
                  "We use only the highest quality, ethically sourced natural ingredients in all our treatments."
                )}
              </p>
            </div>

            <div className="text-center p-6 bg-white rounded-xl shadow-lg feature-card">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💚</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {t("about.holisticApproach", "Holistic Approach")}
              </h3>
              <p className="text-gray-600">
                {t(
                  "about.holisticApproachDesc",
                  "We treat the whole person, addressing root causes rather than just symptoms for lasting wellness."
                )}
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
