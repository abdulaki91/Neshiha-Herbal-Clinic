import { useTranslation } from "react-i18next";
import { useCallback, useState, useEffect } from "react";
import { languages, isRTL } from "../config";

export const useLanguage = () => {
  const { i18n, t } = useTranslation();

  // Local state to trigger re-render on language change
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);

  const changeLanguage = useCallback(
    (languageCode) => {
      i18n.changeLanguage(languageCode);

      // Update document direction for RTL languages
      const direction = isRTL(languageCode) ? "rtl" : "ltr";
      document.documentElement.dir = direction;
      document.documentElement.lang = languageCode;

      // Store language preference in localStorage
      localStorage.setItem("i18nextLng", languageCode);

      // Update state to trigger re-render
      setCurrentLanguage(languageCode);
    },
    [i18n]
  );

  // Keep currentLanguage in sync if changed outside
  useEffect(() => {
    const handleLanguageChanged = (lng) => {
      setCurrentLanguage(lng);
    };
    i18n.on("languageChanged", handleLanguageChanged);
    return () => i18n.off("languageChanged", handleLanguageChanged);
  }, [i18n]);

  const currentLanguageInfo =
    languages.find((lang) => lang.code === currentLanguage) || languages[0];

  return {
    t,
    currentLanguage,
    currentLanguageInfo,
    changeLanguage,
    languages,
    isRTL: isRTL(currentLanguage),
  };
};
