import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import enTranslations from "./locales/en/translation.json";
import arTranslations from "./locales/ar/translation.json";
import omTranslations from "./locales/om/translation.json";
import amTranslations from "./locales/am/translation.json";

const resources = {
  en: { translation: enTranslations },
  ar: { translation: arTranslations },
  om: { translation: omTranslations },
  am: { translation: amTranslations },
};

i18n
  .use(LanguageDetector) // ← Add this
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator", "htmlTag"],
      caches: ["localStorage"],
    },
  });

export default i18n;
