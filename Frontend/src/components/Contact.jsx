import { useLanguage } from "../i18n/hooks/useLanguage";
import { usePublicSiteInfo } from "../hooks/usePublicContent";

const SOCIAL_ICONS = {
  facebookUrl: { emoji: "📘", labelKey: "facebook" },
  instagramUrl: { emoji: "📷", labelKey: "instagram" },
  tiktokUrl: { emoji: "🎵", labelKey: "tiktok" },
  twitterUrl: { emoji: "✖️", labelKey: "twitter" },
};

/** Contact + Map Section */
export default function Contact() {
  const { t, currentLanguage } = useLanguage();
  const isRTL = currentLanguage === "ar";
  const { data: info = {} } = usePublicSiteInfo();

  const socialLinks = Object.entries(SOCIAL_ICONS).filter(([key]) => info[key]);

  return (
    <section id="contact" className="py-16 bg-gradient-to-br from-emerald-50 to-teal-100 contact-section">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h2
            className="text-4xl font-bold text-gray-800 mb-4"
            dir={isRTL ? 'rtl' : 'ltr'}
            lang={currentLanguage}
          >
            {t('contact.title')}
          </h2>
          <p
            className="text-lg text-gray-600 max-w-2xl mx-auto"
            dir={isRTL ? 'rtl' : 'ltr'}
            lang={currentLanguage}
          >
            {t('contact.subtitle')}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Contact Information Section */}
          <div className="space-y-8">
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-emerald-100 contact-card">
              <h3
                className="text-2xl font-semibold text-gray-800 mb-6 flex items-center"
                dir={isRTL ? 'rtl' : 'ltr'}
                lang={currentLanguage}
              >
                <span className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                </span>
                {t('contact.contactInformation', 'Contact Information')}
              </h3>

              <div className="space-y-6">
                {info.clinicEmail && (
                  <div className="flex items-start space-x-4 contact-info-item">
                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 contact-icon">
                      <span className="text-emerald-600 text-xl">📧</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{t('contact.emailLabel')}</p>
                      <a
                        href={`mailto:${info.clinicEmail}`}
                        className="text-emerald-600 hover:text-emerald-700 transition-colors"
                      >
                        {info.clinicEmail}
                      </a>
                    </div>
                  </div>
                )}

                {info.clinicPhone && (
                  <div className="flex items-start space-x-4 contact-info-item">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 contact-icon">
                      <span className="text-blue-600 text-xl">📞</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{t('contact.phoneLabel')}</p>
                      <a
                        href={`tel:${info.clinicPhone}`}
                        className="text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        {info.clinicPhone}
                      </a>
                    </div>
                  </div>
                )}

                {info.whatsappNumber && (
                  <div className="flex items-start space-x-4 contact-info-item">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 contact-icon">
                      <span className="text-green-600 text-xl">💬</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{t('contact.whatsapp', 'WhatsApp')}</p>
                      <a
                        href={`https://wa.me/${info.whatsappNumber.replace(/[^\d]/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-600 hover:text-green-700 transition-colors"
                      >
                        {info.whatsappNumber}
                      </a>
                    </div>
                  </div>
                )}

                {info.clinicAddress && (
                  <div className="flex items-start space-x-4 contact-info-item">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 contact-icon">
                      <span className="text-purple-600 text-xl">📍</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{t('contact.address')}</p>
                      <p className="text-gray-700">{info.clinicAddress}</p>
                    </div>
                  </div>
                )}
              </div>

              {socialLinks.length > 0 && (
                <div className="flex gap-3 mt-6 pt-6 border-t border-gray-100">
                  {socialLinks.map(([key, { emoji, labelKey }]) => (
                    <a
                      key={key}
                      href={info[key]}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={t(`contact.social.${labelKey}`, labelKey)}
                      className="w-10 h-10 bg-gray-100 hover:bg-emerald-100 rounded-full flex items-center justify-center text-lg transition-colors"
                    >
                      {emoji}
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Business Hours Section */}
            {(info.workingHoursStart || info.workingHoursEnd) && (
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-emerald-100 contact-card">
                <h3
                  className="text-2xl font-semibold text-gray-800 mb-6 flex items-center"
                  dir={isRTL ? 'rtl' : 'ltr'}
                  lang={currentLanguage}
                >
                  <span className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                  </span>
                  {t('contact.businessHours')}
                </h3>

                <div className="space-y-3 business-hours">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100 business-hours-row">
                    <span className="font-medium text-gray-700">{t('contact.mondayFriday', 'Monday - Friday')}</span>
                    <span className="text-emerald-600 font-semibold">
                      {info.workingHoursStart?.slice(0, 5)} - {info.workingHoursEnd?.slice(0, 5)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Map Section */}
          {info.googleMapsEmbedUrl && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-emerald-100 contact-card">
                <h3
                  className="text-2xl font-semibold text-gray-800 mb-4 flex items-center"
                  dir={isRTL ? 'rtl' : 'ltr'}
                  lang={currentLanguage}
                >
                  <span className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                  </span>
                  {t('contact.ourLocation', 'Our Location')}
                </h3>

                <iframe
                  src={info.googleMapsEmbedUrl}
                  title={t('contact.ourLocation', 'Our Location')}
                  className="w-full aspect-video rounded-xl shadow-md border-2 border-emerald-200"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
