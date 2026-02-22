import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Info } from 'lucide-react'
import type { User } from '../../api/auth.api'

export interface Step1Data {
  language: 'fr' | 'en'
  fullName: string
  phone: string
  agency: string
  licenseNumber: string
}

interface Step1ProfileProps {
  user: User | null
  data: Step1Data
  onChange: (data: Step1Data) => void
}

export default function Step1Profile({ user, data, onChange }: Step1ProfileProps) {
  const { t, i18n } = useTranslation()
  const [showInfo, setShowInfo] = useState(false)
  const [isChangingLang, setIsChangingLang] = useState(false)

  // Pre-fill from user on mount
  useEffect(() => {
    if (user && !data.fullName && !data.agency) {
      onChange({
        ...data,
        language: (i18n.language?.startsWith('fr') ? 'fr' : 'en') as 'fr' | 'en',
        fullName: user.fullName || '',
        phone: user.phone || '',
        agency: user.agency || '',
        licenseNumber: user.licenseNumber || '',
      })
    }
  }, [user])

  const selectLanguage = async (lang: 'fr' | 'en') => {
    if (lang === data.language || isChangingLang) return
    setIsChangingLang(true)
    try {
      localStorage.setItem('i18nextLng', lang)
      await i18n.changeLanguage(lang)
      onChange({ ...data, language: lang })
    } catch {
      localStorage.setItem('i18nextLng', data.language)
    } finally {
      setIsChangingLang(false)
    }
  }

  const update = (field: keyof Step1Data, value: string) => {
    onChange({ ...data, [field]: value })
  }

  const inputClass = "w-full px-3.5 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold mb-2">{t('onboarding.step1.title')}</h1>
        <p className="text-muted-foreground">{t('onboarding.step1.subtitle')}</p>
      </div>

      {/* Language selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-foreground mb-2">
          {t('onboarding.step1.languageLabel')}
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => selectLanguage('fr')}
            disabled={isChangingLang}
            className={[
              'p-3 rounded-xl border-2 text-center transition-all',
              data.language === 'fr'
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50',
            ].join(' ')}
          >
            <span className="text-2xl block mb-1">🇫🇷</span>
            <span className="font-medium text-sm">Français</span>
          </button>
          <button
            type="button"
            onClick={() => selectLanguage('en')}
            disabled={isChangingLang}
            className={[
              'p-3 rounded-xl border-2 text-center transition-all',
              data.language === 'en'
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50',
            ].join(' ')}
          >
            <span className="text-2xl block mb-1">🇬🇧</span>
            <span className="font-medium text-sm">English</span>
          </button>
        </div>
      </div>

      {/* Profile form */}
      <div className="space-y-4">
        <div>
          <label htmlFor="ob-fullname" className="block text-sm font-medium text-foreground mb-1">
            {t('onboarding.step1.fullName')}
          </label>
          <input
            id="ob-fullname"
            type="text"
            autoComplete="name"
            value={data.fullName}
            onChange={(e) => update('fullName', e.target.value)}
            className={inputClass}
            placeholder="Jean Dupont"
          />
        </div>

        <div>
          <label htmlFor="ob-phone" className="block text-sm font-medium text-foreground mb-1">
            {t('onboarding.step1.phone')}
          </label>
          <input
            id="ob-phone"
            type="tel"
            autoComplete="tel"
            value={data.phone}
            onChange={(e) => update('phone', e.target.value)}
            className={inputClass}
            placeholder="(506) 555-1234"
          />
        </div>

        <div>
          <label htmlFor="ob-agency" className="block text-sm font-medium text-foreground mb-1">
            {t('onboarding.step1.agency')} <span className="text-destructive">*</span>
          </label>
          <input
            id="ob-agency"
            type="text"
            autoComplete="organization"
            value={data.agency}
            onChange={(e) => update('agency', e.target.value)}
            className={inputClass}
            placeholder={t('onboarding.step1.agencyPlaceholder')}
          />
        </div>

        <div>
          <label htmlFor="ob-license" className="block text-sm font-medium text-foreground mb-1">
            {t('onboarding.step1.licenseNumber')} <span className="text-destructive">*</span>
          </label>
          <input
            id="ob-license"
            type="text"
            value={data.licenseNumber}
            onChange={(e) => update('licenseNumber', e.target.value)}
            className={inputClass}
            placeholder={t('onboarding.step1.licenseNumberPlaceholder')}
          />
        </div>
      </div>

      {/* Info box */}
      <button
        type="button"
        onClick={() => setShowInfo(!showInfo)}
        className="mt-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <Info className="w-4 h-4" />
        {t('onboarding.step1.whyInfo')}
      </button>
      {showInfo && (
        <div className="mt-2 p-3 bg-muted rounded-lg text-sm text-muted-foreground animate-in fade-in duration-200">
          {t('onboarding.step1.whyInfoText')}
        </div>
      )}
    </div>
  )
}
