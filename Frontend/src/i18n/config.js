export const languages = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    rtl: false
  },
  {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    rtl: true
  },
  {
    code: 'om',
    name: 'Afan Oromo',
    nativeName: 'Afaan Oromoo',
    rtl: false
  },
  {
    code: 'am',
    name: 'Amharic',
    nativeName: 'አማርኛ',
    rtl: false
  }
];

export const getLanguageByCode = (code) => {
  return languages.find(lang => lang.code === code) || languages[0];
};

export const isRTL = (languageCode) => {
  const language = getLanguageByCode(languageCode);
  return language ? language.rtl : false;
};
