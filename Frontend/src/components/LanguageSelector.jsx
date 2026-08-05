import { useEffect, useRef, useState } from "react";
import { FiChevronDown, FiCheck, FiGlobe } from "react-icons/fi";
import { useLanguage } from "../i18n/hooks/useLanguage";

const FLAGS = {
  en: "🇺🇸",
  ar: "🇸🇦",
  om: "🇪🇹",
  am: "🇪🇹",
};

export default function LanguageSelector({ variant = "desktop" }) {
  const { languages, currentLanguageInfo, changeLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const isMobile = variant === "mobile";

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (code) => {
    changeLanguage(code);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative ${isMobile ? "w-full" : ""}`}>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50/70 font-medium text-emerald-700 transition-colors duration-200 hover:bg-emerald-100 ${
          isMobile ? "w-full justify-between px-4 py-3" : "px-3 py-2 text-sm"
        }`}
      >
        <span className="flex items-center gap-2">
          <FiGlobe className="w-4 h-4 flex-shrink-0" />
          <span className="text-base leading-none">{FLAGS[currentLanguageInfo.code]}</span>
          <span>{currentLanguageInfo.nativeName}</span>
        </span>
        <FiChevronDown
          className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      <div
        role="listbox"
        className={`absolute z-50 mt-2 w-56 origin-top-right rounded-xl border border-gray-100 bg-white py-1.5 shadow-xl transition-all duration-150 ${
          isMobile ? "left-0 right-0" : "right-0"
        } ${
          isOpen
            ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
            : "pointer-events-none -translate-y-1 scale-95 opacity-0"
        }`}
      >
        {languages.map((lang) => {
          const isActive = lang.code === currentLanguageInfo.code;
          return (
            <button
              key={lang.code}
              type="button"
              role="option"
              aria-selected={isActive}
              onClick={() => handleSelect(lang.code)}
              className={`flex w-full items-center justify-between px-4 py-2.5 text-sm transition-colors duration-150 ${
                isActive
                  ? "bg-emerald-50 font-semibold text-emerald-700"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <span className="flex items-center gap-2.5">
                <span className="text-base leading-none">{FLAGS[lang.code]}</span>
                <span>{lang.nativeName}</span>
              </span>
              {isActive && <FiCheck className="w-4 h-4 text-emerald-600" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
