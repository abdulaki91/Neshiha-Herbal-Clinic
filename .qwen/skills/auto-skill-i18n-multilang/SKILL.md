---
name: i18n-multilang
description: Set up i18next multi-language support with language switcher UI — configure all locale files, create i18n.js, add a globe dropdown to the header
source: auto-skill
extracted_at: '2026-06-18T14:30:00.000Z'
---

# i18n Multi-Language Setup

Add multi-language support to any React app with i18next, react-i18next, and a language switcher in the header.

## 1. Dependencies

```bash
npm install i18next react-i18next i18next-browser-languagedetector
```

## 2. Directory structure

```
src/
├── i18n.js                          # config — imports locale files, initializes i18next
└── i18n/
    └── locales/
        ├── en/translation.json      # English
        ├── om/translation.json      # Oromo
        ├── am/translation.json      # Amharic
        └── ar/translation.json      # Arabic
```

Each `translation.json` has the same key structure (sections like `common`, `navigation`, `header`, etc.) but translated values.

## 3. i18n.js config

```js
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
    resources: {
      en: { translation: en },
      om: { translation: om },
      am: { translation: am },
      ar: { translation: ar },
    },
    fallbackLng: "en",
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
    },
  });

export default i18n;
```

**Key points:**
- `LanguageDetector` auto-detects from localStorage first, then browser navigator
- Detected preference is cached in localStorage via `caches: ["localStorage"]`
- Import paths are relative to `i18n.js` location — if it's at `src/i18n.js` and locales at `src/i18n/locales/`, the import is `./i18n/locales/en/translation.json`
- Import in `main.jsx`: `import "./i18n";` (before App)

## 4. Language switcher in header

Define languages array and add a globe dropdown next to the notification bell:

```jsx
import { FiGlobe } from "react-icons/fi";
import { useTranslation } from "react-i18next";

const LANGUAGES = [
  { code: "en", label: "English", native: "English" },
  { code: "om", label: "Oromo", native: "Afaan Oromoo" },
  { code: "am", label: "Amharic", native: "አማርኛ" },
  { code: "ar", label: "Arabic", native: "العربية" },
];

const Topbar = () => {
  const { i18n } = useTranslation();
  const [showLang, setShowLang] = useState(false);
  const langRef = useRef(null);

  // Outside-click handler
  useEffect(() => {
    const handler = (e) => {
      if (langRef.current && !langRef.current.contains(e.target))
        setShowLang(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={langRef} className="relative">
      <button
        onClick={() => setShowLang(!showLang)}
        className="flex items-center space-x-1 p-2 rounded-lg hover:bg-gray-100"
      >
        <FiGlobe className="w-5 h-5" />
        <span className="hidden sm:inline">{i18n.language?.toUpperCase()}</span>
      </button>
      {showLang && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-2xl border z-50 py-1">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => { i18n.changeLanguage(lang.code); setShowLang(false); }}
              className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 ${
                i18n.language === lang.code
                  ? "text-emerald-600 font-semibold"
                  : "text-gray-700"
              }`}
            >
              <span>{lang.native}</span>
              <span className="text-xs text-gray-400 ml-auto">{lang.code.toUpperCase()}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
```

## 5. Usage in pages

```jsx
import { useTranslation } from "react-i18next";
const { t } = useTranslation();
<span>{t("common.submit")}</span>
```

## 6. Build verification

Run `npx vite build` after setup. Common failure: import paths in `i18n.js` don't resolve because the file is at `src/i18n.js` but imported paths start with `./locales/` instead of `./i18n/locales/`. Check the error output for "Could not resolve".