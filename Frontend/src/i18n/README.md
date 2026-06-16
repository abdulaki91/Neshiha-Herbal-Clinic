# Internationalization (i18n) Setup

This folder contains the internationalization configuration for the Neshiha Herbal Clinic website, supporting English, Arabic, and Afan Oromo languages.

## Structure

```
src/i18n/
├── index.js              # Main i18n configuration
├── config.js             # Language configuration and utilities
├── hooks/
│   └── useLanguage.js    # Custom hook for language management
├── components/
│   └── LanguageSelector.jsx # Language switcher component
├── locales/
│   ├── en/               # English translations
│   │   └── translation.json
│   ├── ar/               # Arabic translations
│   │   └── translation.json
│   └── om/               # Afan Oromo translations
│       └── translation.json
└── README.md             # This file
```

## Supported Languages

- **English (en)**: Default language, left-to-right (LTR)
- **Arabic (ar)**: Right-to-left (RTL) layout support
- **Afan Oromo (om)**: Left-to-right (LTR) layout

## Usage

### 1. Initialize i18n in your app

In your main `App.jsx` or `main.jsx`, import the i18n configuration:

```jsx
import './i18n';
```

### 2. Use the useLanguage hook in components

```jsx
import { useLanguage } from '../i18n/hooks/useLanguage';

const MyComponent = () => {
  const { t, currentLanguage, changeLanguage, isRTL } = useLanguage();

  return (
    <div>
      <h1>{t('hero.title')}</h1>
      <p>{t('hero.subtitle')}</p>
      <button onClick={() => changeLanguage('ar')}>
        Switch to Arabic
      </button>
    </div>
  );
};
```

### 3. Add the LanguageSelector component

```jsx
import LanguageSelector from '../i18n/components/LanguageSelector';

const Header = () => {
  return (
    <header>
      <h1>Neshiha Herbal Clinic</h1>
      <LanguageSelector className="ml-4" />
    </header>
  );
};
```

### 4. Handle RTL layouts

The hook automatically handles RTL layout changes for Arabic. You can also manually check:

```jsx
const { isRTL } = useLanguage();

return (
  <div className={isRTL ? 'text-right' : 'text-left'}>
    {/* Your content */}
  </div>
);
```

## Translation Keys

The translation files are organized into logical sections:

- `common`: General UI elements (buttons, labels, etc.)
- `navigation`: Menu items and navigation
- `header`: Header-specific content
- `hero`: Hero section content
- `services`: Services section content
- `about`: About section content
- `testimonials`: Testimonials section content
- `contact`: Contact form and information
- `footer`: Footer content
- `blog`: Blog-related content

## Adding New Translations

1. Add new keys to all language files in `src/i18n/locales/[lang]/translation.json`
2. Use the `t()` function in your components: `{t('new.key')}`
3. For dynamic content, use interpolation: `{t('welcome', { name: userName })}`

## Language Detection

The system automatically detects the user's preferred language from:
1. localStorage (user's previous choice)
2. Browser language settings
3. Falls back to English

## RTL Support

Arabic language automatically switches to RTL layout. The system:
- Changes `document.documentElement.dir` to 'rtl'
- Updates `document.documentElement.lang`
- Stores the preference in localStorage

## Best Practices

1. Always use the `t()` function for user-facing text
2. Keep translation keys descriptive and organized
3. Test RTL layouts thoroughly for Arabic content
4. Consider text length differences between languages
5. Use interpolation for dynamic content instead of concatenation
