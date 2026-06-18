import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "./i18n/locales/en/translation.json";
import om from "./i18n/locales/om/translation.json";
import am from "./i18n/locales/am/translation.json";
import ar from "./i18n/locales/ar/translation.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { en: { translation: en }, om: { translation: om }, am: { translation: am }, ar: { translation: ar } },
    fallbackLng: "en",
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
    },
  });

export default i18n;
