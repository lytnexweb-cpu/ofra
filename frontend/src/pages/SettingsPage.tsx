import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { authApi } from '../api/auth.api'
import { profileApi, type UpdateProfileInfoRequest } from '../api/profile.api'
import { useTheme } from '../contexts/ThemeContext'
import { Button } from '../components/ui/Button'
import {
  Sun,
  Moon,
  Monitor,
  Globe,
  Calendar,
  Clock,
  Check,
  AlertCircle,
} from 'lucide-react'

type ThemeMode = 'light' | 'dark' | 'system'

export default function SettingsPage() {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  const { theme, setTheme } = useTheme()

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

  // Update profile mutation for regional settings
  const updateProfileMutation = useMutation({
    mutationFn: profileApi.updateProfileInfo,
    onSuccess: (response) => {
      if (response.success && response.data) {
        setSuccessMessage(t('settings.updateSuccess'))
        setErrorMessage('')
        queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
        setTimeout(() => setSuccessMessage(''), 3000)
      }
    },
    onError: () => {
      setErrorMessage(t('settings.updateError'))
      setSuccessMessage('')
    },
  })

  const handleRegionalSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const data: UpdateProfileInfoRequest = {
      dateFormat,
      timezone,
    }
    updateProfileMutation.mutate(data)
  }

  const themeOptions = [
    { value: 'light', label: t('settings.appearance.theme.light'), icon: Sun },
    { value: 'dark', label: t('settings.appearance.theme.dark'), icon: Moon },
    { value: 'system', label: t('settings.appearance.theme.system'), icon: Monitor },
  ]

  return (
    <div data-testid="settings-page">
      {/* Header */}
      <div className="mb-8">
        <h1
          className="text-2xl font-bold text-stone-900 dark:text-stone-100"
          style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
        >
          {t('settings.title')}
        </h1>
        <p className="mt-1 text-stone-500 dark:text-stone-400">{t('settings.subtitle')}</p>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="mb-6 flex items-center gap-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border-l-4 border-emerald-500 p-4">
          <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <p className="text-sm text-emerald-700 dark:text-emerald-300">{successMessage}</p>
        </div>
      )}
      {errorMessage && (
        <div className="mb-6 flex items-center gap-3 rounded-lg bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
          <p className="text-sm text-red-700 dark:text-red-300">{errorMessage}</p>
        </div>
      )}

      <div className="max-w-2xl space-y-6">
        {/* Appearance Section */}
        <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100 mb-2 flex items-center gap-2">
            <Sun className="w-5 h-5 text-stone-400" />
            {t('settings.appearance.title')}
          </h2>
          <p className="text-sm text-stone-500 dark:text-stone-400 mb-6">{t('settings.appearance.darkModeDescription')}</p>

          <div className="grid grid-cols-3 gap-3">
            {themeOptions.map((option) => {
              const Icon = option.icon
              const isActive = theme === option.value
              return (
                <button
                  key={option.value}
                  onClick={() => setTheme(option.value as ThemeMode)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    isActive
                      ? 'border-primary bg-primary/5'
                      : 'border-stone-200 dark:border-stone-600 hover:border-stone-300 dark:hover:border-stone-500'
                  }`}
                >
                  <Icon className={`w-6 h-6 ${isActive ? 'text-primary' : 'text-stone-400'}`} />
                  <span className={`text-sm font-medium ${isActive ? 'text-primary' : 'text-stone-600 dark:text-stone-400'}`}>
                    {option.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Language Section */}
        <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100 mb-2 flex items-center gap-2">
            <Globe className="w-5 h-5 text-stone-400" />
            {t('settings.language.title')}
          </h2>
          <p className="text-sm text-stone-500 dark:text-stone-400 mb-6">{t('settings.language.description')}</p>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleLanguageChange('fr')}
              className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${
                language === 'fr'
                  ? 'border-primary bg-primary/5'
                  : 'border-stone-200 dark:border-stone-600 hover:border-stone-300 dark:hover:border-stone-500'
              }`}
            >
              <span className="text-xl">🇫🇷</span>
              <span className={`font-medium ${language === 'fr' ? 'text-primary' : 'text-stone-600 dark:text-stone-400'}`}>
                {t('settings.language.french')}
              </span>
            </button>
            <button
              onClick={() => handleLanguageChange('en')}
              className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${
                language === 'en'
                  ? 'border-primary bg-primary/5'
                  : 'border-stone-200 dark:border-stone-600 hover:border-stone-300 dark:hover:border-stone-500'
              }`}
            >
              <span className="text-xl">🇬🇧</span>
              <span className={`font-medium ${language === 'en' ? 'text-primary' : 'text-stone-600 dark:text-stone-400'}`}>
                {t('settings.language.english')}
              </span>
            </button>
          </div>
        </div>

        {/* Regional Settings Section */}
        <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100 mb-6 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-stone-400" />
            {t('settings.regional.title')}
          </h2>

          <form onSubmit={handleRegionalSubmit} className="space-y-5">
            {/* Date Format */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                <Calendar className="w-4 h-4 text-stone-400" />
                {t('settings.regional.dateFormat')}
              </label>
              <select
                value={dateFormat}
                onChange={(e) => setDateFormat(e.target.value as 'DD/MM/YYYY' | 'MM/DD/YYYY')}
                className="w-full px-4 py-3 rounded-lg border border-stone-200 dark:border-stone-600 bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-shadow"
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY (25/12/2026)</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY (12/25/2026)</option>
              </select>
            </div>

            {/* Timezone */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                <Clock className="w-4 h-4 text-stone-400" />
                {t('settings.regional.timezone')}
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-stone-200 dark:border-stone-600 bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-shadow"
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

            <Button
              type="submit"
              disabled={updateProfileMutation.isPending}
              className="w-full bg-primary hover:bg-primary/90"
            >
              {updateProfileMutation.isPending ? t('settings.updating') : t('settings.update')}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
