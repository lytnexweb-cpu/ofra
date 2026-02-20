import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { authApi } from '../api/auth.api'
import { profileApi } from '../api/profile.api'
import {
  Globe,
  Calendar,
  Clock,
  Check,
  AlertCircle,
} from 'lucide-react'

export default function SettingsPage() {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()

  // Get current user data
  const { data: userData } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: authApi.me,
  })

  const user = userData?.data?.user

  // Language state
  const [language, setLanguage] = useState(i18n.language?.substring(0, 2) || 'fr')

  // Regional preferences
  const [dateFormat, setDateFormat] = useState<'DD/MM/YYYY' | 'MM/DD/YYYY'>('DD/MM/YYYY')
  const [timezone, setTimezone] = useState('America/Moncton')

  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  // Update state when user data loads
  useEffect(() => {
    if (user) {
      setDateFormat((user.dateFormat as 'DD/MM/YYYY' | 'MM/DD/YYYY') || 'DD/MM/YYYY')
      setTimezone(user.timezone || 'America/Moncton')
    }
  }, [user])

  // Update language with backend persistence (Murat's risk mitigation: optimistic UI with rollback)
  const handleLanguageChange = async (lang: string) => {
    const previousLanguage = language

    // Optimistic update for instant UX
    setLanguage(lang)
    i18n.changeLanguage(lang)
    localStorage.setItem('i18nextLng', lang)

    try {
      // Persist to backend
      const response = await profileApi.updateProfileInfo({ language: lang as 'fr' | 'en' })
      if (response.success) {
        setSuccessMessage(t('settings.updateSuccess'))
        setTimeout(() => setSuccessMessage(''), 3000)
        queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
      } else {
        throw new Error('API returned failure')
      }
    } catch {
      // Rollback on failure (Murat's recommendation)
      setLanguage(previousLanguage)
      i18n.changeLanguage(previousLanguage)
      localStorage.setItem('i18nextLng', previousLanguage)
      setErrorMessage(t('settings.updateError'))
      setTimeout(() => setErrorMessage(''), 5000)
    }
  }

  // Auto-save regional preference (same pattern as language)
  const handleRegionalChange = async (field: 'dateFormat' | 'timezone', value: string) => {
    const previous = field === 'dateFormat' ? dateFormat : timezone
    if (field === 'dateFormat') setDateFormat(value as 'DD/MM/YYYY' | 'MM/DD/YYYY')
    else setTimezone(value)

    try {
      const response = await profileApi.updateProfileInfo({ [field]: value })
      if (response.success) {
        setSuccessMessage(t('settings.updateSuccess'))
        setTimeout(() => setSuccessMessage(''), 3000)
        queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
      } else {
        throw new Error('API returned failure')
      }
    } catch {
      if (field === 'dateFormat') setDateFormat(previous as 'DD/MM/YYYY' | 'MM/DD/YYYY')
      else setTimezone(previous)
      setErrorMessage(t('settings.updateError'))
      setTimeout(() => setErrorMessage(''), 5000)
    }
  }

  return (
    <div data-testid="settings-page">
      {/* Header */}
      <div className="mb-8">
        <h1
          className="text-2xl font-bold text-stone-900"
          style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
        >
          {t('settings.title')}
        </h1>
        <p className="mt-1 text-stone-500">{t('settings.subtitle')}</p>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="mb-6 flex items-center gap-3 rounded-lg bg-emerald-50 border-l-4 border-emerald-500 p-4">
          <Check className="w-5 h-5 text-emerald-600" />
          <p className="text-sm text-emerald-700">{successMessage}</p>
        </div>
      )}
      {errorMessage && (
        <div className="mb-6 flex items-center gap-3 rounded-lg bg-red-50 border-l-4 border-red-500 p-4">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-sm text-red-700">{errorMessage}</p>
        </div>
      )}

      {/* Profile completion checklist */}
      {user && (() => {
        const checks = [
          { key: 'fullName', done: !!user.fullName, label: t('settings.checklist.fullName', 'Nom complet'), link: '/account' },
          { key: 'phone', done: !!user.phone, label: t('settings.checklist.phone', 'Téléphone'), link: '/account' },
          { key: 'agency', done: !!user.agency, label: t('settings.checklist.agency', 'Agence'), link: '/account' },
          { key: 'licenseNumber', done: !!user.licenseNumber, label: t('settings.checklist.license', 'No. de permis'), link: '/account' },
          { key: 'profilePhoto', done: !!user.profilePhoto, label: t('settings.checklist.photo', 'Photo de profil'), link: '/account' },
          { key: 'onboarding', done: !!user.onboardingCompleted && !user.onboardingSkipped, label: t('settings.checklist.onboarding', 'Profil de pratique'), link: null },
        ]
        const doneCount = checks.filter((c) => c.done).length
        const total = checks.length
        const pct = Math.round((doneCount / total) * 100)
        if (pct >= 100) return null
        return (
          <div className="max-w-2xl mb-6 bg-white rounded-xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-stone-900">
                {t('settings.checklist.title', 'Complétion du profil')}
              </h3>
              <span className="text-xs font-medium text-stone-500">{pct}%</span>
            </div>
            <div className="w-full h-2 bg-stone-100 rounded-full mb-3 overflow-hidden">
              <div
                className="h-full bg-[#1e3a5f] rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {checks.map((c) => {
                const content = (
                  <>
                    {c.done ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-stone-300 shrink-0" />
                    )}
                    <span className={c.done ? 'text-stone-400 line-through' : 'text-stone-700'}>{c.label}</span>
                  </>
                )
                if (!c.done && c.link) {
                  return (
                    <Link key={c.key} to={c.link} className="flex items-center gap-2 text-xs hover:text-[#1e3a5f] transition-colors">
                      {content}
                    </Link>
                  )
                }
                return (
                  <div key={c.key} className="flex items-center gap-2 text-xs">
                    {content}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })()}

      <div className="max-w-2xl space-y-6">
        {/* Language Section */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-stone-900 mb-2 flex items-center gap-2">
            <Globe className="w-5 h-5 text-stone-400" />
            {t('settings.language.title')}
          </h2>
          <p className="text-sm text-stone-500 mb-6">{t('settings.language.description')}</p>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleLanguageChange('fr')}
              className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${
                language === 'fr'
                  ? 'border-primary bg-primary/5'
                  : 'border-stone-200 hover:border-stone-300'
              }`}
            >
              <span className="text-xl">🇫🇷</span>
              <span className={`font-medium ${language === 'fr' ? 'text-primary' : 'text-stone-600'}`}>
                {t('settings.language.french')}
              </span>
            </button>
            <button
              onClick={() => handleLanguageChange('en')}
              className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${
                language === 'en'
                  ? 'border-primary bg-primary/5'
                  : 'border-stone-200 hover:border-stone-300'
              }`}
            >
              <span className="text-xl">🇬🇧</span>
              <span className={`font-medium ${language === 'en' ? 'text-primary' : 'text-stone-600'}`}>
                {t('settings.language.english')}
              </span>
            </button>
          </div>
        </div>

        {/* Regional Settings Section */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-stone-900 mb-6 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-stone-400" />
            {t('settings.regional.title')}
          </h2>

          <div className="space-y-5">
            {/* Date Format */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-stone-700 mb-2">
                <Calendar className="w-4 h-4 text-stone-400" />
                {t('settings.regional.dateFormat')}
              </label>
              <select
                value={dateFormat}
                onChange={(e) => handleRegionalChange('dateFormat', e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-stone-200 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-shadow"
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY (25/12/2026)</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY (12/25/2026)</option>
              </select>
            </div>

            {/* Timezone */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-stone-700 mb-2">
                <Clock className="w-4 h-4 text-stone-400" />
                {t('settings.regional.timezone')}
              </label>
              <select
                value={timezone}
                onChange={(e) => handleRegionalChange('timezone', e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-stone-200 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-shadow"
              >
                <option value="America/Moncton">America/Moncton (AST/ADT)</option>
                <option value="America/Halifax">America/Halifax (AST/ADT)</option>
                <option value="America/Toronto">America/Toronto (EST/EDT)</option>
                <option value="America/Montreal">America/Montreal (EST/EDT)</option>
                <option value="America/Winnipeg">America/Winnipeg (CST/CDT)</option>
                <option value="America/Edmonton">America/Edmonton (MST/MDT)</option>
                <option value="America/Vancouver">America/Vancouver (PST/PDT)</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
