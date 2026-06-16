import React from "react";
import { useLanguage } from "../i18n/hooks/useLanguage";

/** Contact + Map Section */
export default function Contact() {
  const { t, currentLanguage } = useLanguage();
  const isRTL = currentLanguage === 'ar';
  
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
                <div className="flex items-start space-x-4 contact-info-item">
                  <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 contact-icon">
                    <span className="text-emerald-600 text-xl">📧</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{t('contact.emailLabel')}</p>
                    <p className="text-emerald-600 hover:text-emerald-700 transition-colors">
                      {t('contact.emailAddress', 'info@nesihaherbalclinic.com')}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 contact-info-item">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 contact-icon">
                    <span className="text-blue-600 text-xl">📞</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{t('contact.phoneLabel')}</p>
                    <p className="text-blue-600 hover:text-blue-700 transition-colors">
                      {t('contact.phoneNumber', '+251912166549')}
                    </p>
                    <p className="text-sm text-gray-600">{t('contact.mainOffice', 'Main Office')}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 contact-info-item">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 contact-icon">
                    <span className="text-green-600 text-xl">💬</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{t('contact.whatsapp', 'WhatsApp')}</p>
                    <p className="text-green-600 hover:text-green-700 transition-colors">
                      {t('contact.whatsappNumber', '+251912166549')}
                    </p>
                    <p className="text-sm text-gray-600">{t('contact.quickResponse', 'Quick Response')}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 contact-info-item">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 contact-icon">
                    <span className="text-purple-600 text-xl">📍</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{t('contact.address')}</p>
                    <p className="text-gray-700">
                      {t('contact.streetAddress', 'Bero,AshewaMeda')}<br />
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Business Hours Section */}
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
                  <span className="text-emerald-600 font-semibold">{t('contact.weekdayHours', '9:00 AM - 6:00 PM')}</span>
                </div>
               
                <div className="flex justify-between items-center py-2 business-hours-row">
                  <span className="font-medium text-gray-700">{t('contact.sunday', 'Sunday')}</span>
                  <span className="text-red-500 font-semibold">{t('contact.closed', 'Closed')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Map Section */}
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
              
              <div
                className="w-full aspect-video rounded-xl bg-cover bg-center shadow-md border-2 border-emerald-200 location-map"
                style={{
                  backgroundImage:
                    "url('https://lh3.googleusercontent.com/aida-public/AB6AXuC8gouQOApimN_xyfhDzUAmpmvL0lm0G3r4JEXTA0ybxez0K1pOAvvQxbsPdPRctK8S-IH5MQ3e0A3ubPXjXNTBykiLt-tEqMEOKshC2PXVxX-A4HBMV0jgKq6zc28933YsVWp9jjaI9DNppYwPdcwPJRL1IDJ4ouKbsm8cULPSsyF4UKde56MsA-99Ig9tQVMItInCDf7m5-q1YNsmxD3cidN1dDShPr4n449fW06dKA0E4AvD7f5-vq3U2A18sjTNbEXJzeEK1ok')"
                }}
              />
              
              <div className="mt-4 p-4 bg-emerald-50 rounded-lg">
                <p 
                  className="text-sm text-gray-700 text-center"
                  dir={isRTL ? 'rtl' : 'ltr'}
                  lang={currentLanguage}
                >
                  <span className="font-medium">{t('contact.easyToFind', 'Easy to find!')}</span> {t('contact.locationDescription', 'We\'re located in the heart of Healthville, just off the main Wellness Avenue. Free parking available.')}
                </p>
              </div>
            </div>

           
          </div>
        </div>
      </div>
    </section>
  );
}
