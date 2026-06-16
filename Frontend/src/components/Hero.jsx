import React from "react";
import { useLanguage } from "../i18n/hooks/useLanguage";

/** Hero Banner */
export default function Hero() {
  const { t, currentLanguage } = useLanguage();
  
  // Check if current language is RTL
  const isRTL = currentLanguage === 'ar';
  
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden mt-16 lg:mt-20 hero-section">
      {/* Background Image with Overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBgEIzxfci338KcYZQhe5LTuAX083Ga9_Rv6x-doKRHtv0g5FZz6sZ_2hff8gS2pTYfK-DyKDm--wC2h89hNrinVVzbyoH2VzdPBeN83TZFfhkI6OeqkcqCuxY0LbAEL8UQqjtD_exTi6z0JyRqjbbU5RVORlU17XvoYY4NYjPJM6K-4dTE3UabMUPjVevnmh5rKJogqLxyq2GupDFGKJH7dmrXH3--qwgjhkzhGR8YuHvicQIAkeFyhYnK8317jaw6057mphOs3Po')"
        }}
      />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/40 to-emerald-900/50"></div>
      
      {/* Content Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-4xl mx-auto">
          {/* Main Heading */}
          <h1 
            className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-white leading-tight mb-6"
            dir={isRTL ? 'rtl' : 'ltr'}
            lang={currentLanguage}
          >
            <span className="block">
              {t('hero.title')}
            </span>
            <span className="block bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              {t('hero.subtitle')}
            </span>
          </h1>
          
          {/* Subtitle */}
          <p 
            className="text-lg sm:text-xl lg:text-2xl text-gray-200 max-w-3xl mx-auto mb-8 leading-relaxed"
            dir={isRTL ? 'rtl' : 'ltr'}
            lang={currentLanguage}
          >
            {t('hero.description', 'At Nesiha Herbal Clinic, we blend traditional remedies with modern practices to provide personalized care that nurtures your body\'s natural healing abilities.')}
          </p>
          
          {/* Trust Indicators */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto trust-indicators">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mb-3">
                <span className="text-2xl">🌿</span>
              </div>
              <p className="text-sm text-gray-300">{t('hero.traditionalRemedies', 'Traditional Remedies')}</p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-teal-500/20 rounded-full flex items-center justify-center mb-3">
                <span className="text-2xl">⚕️</span>
              </div>
              <p className="text-sm text-gray-300">{t('hero.modernPractices', 'Modern Practices')}</p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mb-3">
                <span className="text-2xl">❤️</span>
              </div>
              <p className="text-sm text-gray-300">{t('hero.personalizedCare', 'Personalized Care')}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white/60 rounded-full mt-2 animate-pulse"></div>
        </div>
      </div>
      
      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-emerald-500/10 rounded-full blur-xl animate-pulse floating-elements"></div>
      <div className="absolute top-40 right-20 w-16 h-16 bg-teal-500/10 rounded-full blur-xl animate-pulse delay-1000 floating-elements"></div>
      <div className="absolute bottom-40 left-20 w-12 h-12 bg-blue-500/10 rounded-full blur-xl animate-pulse delay-2000 floating-elements"></div>
    </section>
  );
}
