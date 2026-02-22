import { useState, useEffect } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { authApi } from '../api/auth.api'
import { useTranslation } from 'react-i18next'
import { Eye, EyeOff } from 'lucide-react'
import { OfraLogo, OfraLogoFull } from '../components/OfraLogo'
import { LanguageToggle } from '../components/ui/LanguageToggle'

export default function RegisterPage() {
  const { t, i18n } = useTranslation()
  const [searchParams] = useSearchParams()

  // Store pending plan from ?plan= query param (survives through email verification)
  useEffect(() => {
    const plan = searchParams.get('plan')
    if (plan) {
      localStorage.setItem('pendingPlan', plan)
    }
  }, [searchParams])

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const registerMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: async (data) => {
      if (data.success) {
        navigate('/verify-email', { state: { email: email.trim() } })
      } else {
        if (data.error?.code === 'E_RATE_LIMIT') {
          const retryAfter = data.error?.retryAfter || 300
          const minutes = Math.ceil(retryAfter / 60)
          setError(t('auth.rateLimitError', { minutes }))
        } else if (data.error?.code === 'E_VALIDATION_FAILED') {
          const details = data.error?.details
          if (details && Array.isArray(details)) {
            setError(details.map((d: { message: string }) => d.message).join(', '))
          } else {
            setError(data.error?.message || t('auth.registrationFailed'))
          }
        } else {
          setError(data.error?.message || t('auth.registrationFailed'))
        }
      }
    },
    onError: () => {
      setError(t('auth.networkError'))
    },
  })

  const isPending = registerMutation.isPending

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setError(t('auth.fillAllFields'))
      return
    }

    if (password !== confirmPassword) {
      setError(t('auth.passwordMismatch'))
      return
    }

    if (password.length < 8) {
      setError(t('auth.passwordTooShort'))
      return
    }

    registerMutation.mutate({
      fullName: fullName.trim(),
      email: email.trim(),
      password,
      phone: phone.trim() || undefined,
      preferredLanguage: (i18n.language?.startsWith('fr') ? 'fr' : 'en') as 'fr' | 'en',
    })
  }

  const isFormValid =
    fullName.trim().length > 0 &&
    email.trim().length > 0 &&
    password.trim().length >= 8 &&
    password === confirmPassword

  const inputClass = "w-full px-3.5 py-2.5 rounded-md border border-stone-300 bg-white text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors text-base sm:text-sm"

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      {/* Left Panel — Hero branding (hidden on mobile) */}
      <div className="hidden lg:flex relative overflow-hidden bg-[#1E3A5F] flex-col items-center justify-center px-12">
        {/* Geometric pattern overlay */}
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.04]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="geo" width="60" height="60" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="60" stroke="#D97706" strokeWidth="1" />
              <line x1="0" y1="0" x2="60" y2="0" stroke="#D97706" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#geo)" />
        </svg>

        {/* Radial glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(217,119,6,0.08)_0%,transparent_70%)]" />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center text-center max-w-sm">
          <OfraLogo size={80} variant="white" className="mb-6 drop-shadow-lg" />
          <h1 className="text-4xl font-extrabold tracking-tight text-white font-outfit mb-3">
            OFRA
          </h1>
          <p className="text-white/85 text-lg font-medium leading-relaxed">
            {t('app.tagline')}
          </p>

          {/* Golden separator */}
          <div className="w-20 h-px bg-[#D97706]/40 my-8" />

          <p className="text-white/60 text-sm leading-relaxed">
            {t('register.heroTagline', 'Le premier gestionnaire transactionnel du Nouveau-Brunswick')}
          </p>
          <p className="text-white/40 text-xs mt-2">
            {t('register.heroOrigin', 'Entreprise 100% néo-brunswickoise')}
          </p>
        </div>
      </div>

      {/* Right Panel — Registration form */}
      <div className="relative flex items-center justify-center bg-white py-8 px-6 sm:px-12 lg:px-16 transition-colors">
        <LanguageToggle className="absolute top-4 right-4 text-stone-400 hover:text-primary" />
        <div className="w-full max-w-sm">
          {/* Logo — small, no tagline */}
          <OfraLogoFull className="mb-8" showTagline={false} iconSize={32} />

          <h2 className="text-2xl font-semibold text-stone-900 mb-1">
            {t('auth.createAccount')}
          </h2>
          <p className="text-sm text-stone-500 mb-6">
            {t('auth.alreadyHaveAccount').split('?')[0]}?{' '}
            <Link to="/login" className="text-primary hover:underline font-medium">
              {t('auth.login')}
            </Link>
          </p>

          {/* Error Message */}
          {error && (
            <div className="mb-5 rounded-md bg-red-50 border border-red-200 px-4 py-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label htmlFor="reg-fullname" className="block text-sm font-medium text-stone-700 mb-1">
                {t('auth.fullName')}
              </label>
              <input
                id="reg-fullname"
                type="text"
                autoComplete="name"
                autoFocus
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={inputClass}
                placeholder="Jean Dupont"
              />
            </div>
            <div>
              <label htmlFor="reg-email" className="block text-sm font-medium text-stone-700 mb-1">
                {t('auth.email')}
              </label>
              <input
                id="reg-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                placeholder="vous@exemple.com"
              />
            </div>
            <div>
              <label htmlFor="reg-phone" className="block text-sm font-medium text-stone-700 mb-1">
                {t('auth.phone', 'Téléphone')}
              </label>
              <input
                id="reg-phone"
                type="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={inputClass}
                placeholder="(506) 555-1234"
              />
            </div>

            <div className="pt-1">
              <label htmlFor="reg-password" className="block text-sm font-medium text-stone-700 mb-1">
                {t('auth.password')}
              </label>
              <div className="relative">
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${inputClass} pr-10`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-stone-400 hover:text-stone-600"
                  tabIndex={-1}
                  aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="reg-confirm-password" className="block text-sm font-medium text-stone-700 mb-1">
                {t('auth.confirmPassword')}
              </label>
              <div className="relative">
                <input
                  id="reg-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`${inputClass} pr-10`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-stone-400 hover:text-stone-600"
                  tabIndex={-1}
                  aria-label={showConfirmPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending || !isFormValid}
              className="w-full py-2.5 px-4 rounded-md text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-primary hover:bg-primary/90"
            >
              {isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  {t('auth.creatingAccount')}
                </span>
              ) : (
                t('auth.register')
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
