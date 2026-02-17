import { useTranslation } from 'react-i18next'

export function LanguageToggle({ className }: { className?: string }) {
  const { i18n } = useTranslation()

  const toggle = () => {
    const newLang = i18n.language === 'fr' ? 'en' : 'fr'
    i18n.changeLanguage(newLang)
    localStorage.setItem('i18nextLng', newLang)
  }

  return (
    <button
      onClick={toggle}
      className={`text-sm font-medium transition-colors cursor-pointer ${className ?? ''}`}
      aria-label={i18n.language === 'fr' ? 'Switch to English' : 'Passer en français'}
    >
      {i18n.language === 'fr' ? 'EN' : 'FR'}
    </button>
  )
}
