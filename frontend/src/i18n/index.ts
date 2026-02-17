import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
// LanguageDetector removed - was overriding user language choices
import en from './locales/en/common.json'
import fr from './locales/fr/common.json'

// Get initial language from localStorage or default to 'fr'
const savedLang = typeof window !== 'undefined' ? localStorage.getItem('i18nextLng') : null
const initialLang = savedLang && ['en', 'fr'].includes(savedLang) ? savedLang : 'fr'

i18n
  .use(initReactI18next)
  // NOTE: LanguageDetector removed - it was overriding user choices
  .init({
    debug: false,
    resources: {
      en: { common: en },
      fr: { common: fr },
    },
    lng: initialLang, // Use our manual detection
    supportedLngs: ['en', 'fr'],
    fallbackLng: 'en',
    ns: ['common'],
    defaultNS: 'common',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
      bindI18n: 'languageChanged loaded',
      bindI18nStore: 'added removed',
    },
  })

export default i18n
