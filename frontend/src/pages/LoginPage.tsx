import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { authApi } from '../api/auth.api'
import { Eye, EyeOff } from 'lucide-react'
import { OfraLogo, OfraLogoFull } from '../components/OfraLogo'

export default function LoginPage() {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [validationError, setValidationError] = useState('')
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      if (data.success) {
        queryClient.clear()
        const user = data.data?.user
        const destination = user?.role === 'superadmin' ? '/admin' : '/'
        setTimeout(() => {
          navigate(destination)
        }, 100)
      } else {
        if (data.error?.code === 'E_EMAIL_NOT_VERIFIED') {
          setError(t('auth.emailNotVerified', 'Veuillez vérifier votre adresse courriel avant de vous connecter. Consultez votre boîte de réception.'))
        } else if (data.error?.code === 'E_INVALID_CREDENTIALS') {
          setError(t('auth.invalidCredentials', 'Courriel ou mot de passe invalide.'))
        } else if (data.error?.code === 'E_VALIDATION_FAILED') {
          setError(t('auth.fillAllFields'))
        } else if (data.error?.code === 'E_RATE_LIMIT') {
          const retryAfter = data.error?.retryAfter || 300
          const minutes = Math.ceil(retryAfter / 60)
          setError(t('auth.rateLimitError', { minutes }))
        } else {
          setError(data.error?.message || t('auth.loginFailed', 'Échec de connexion.'))
        }
      }
    },
    onError: () => {
      setError(t('auth.networkError'))
    },
  })

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setValidationError('')

    if (!email.trim() || !password.trim()) {
      setValidationError(t('auth.fillAllFields'))
      return
    }

    if (!validateEmail(email.trim())) {
      setValidationError(t('auth.enterEmail'))
      return
    }

    loginMutation.mutate({ email: email.trim(), password })
  }

  const isFormValid = email.trim().length > 0 && password.trim().length > 0

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
            <pattern id="geo-login" width="60" height="60" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="60" stroke="#D97706" strokeWidth="1" />
              <line x1="0" y1="0" x2="60" y2="0" stroke="#D97706" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#geo-login)" />
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

      {/* Right Panel — Login form */}
      <div className="flex items-center justify-center bg-white dark:bg-stone-900 py-12 px-6 sm:px-12 lg:px-16 transition-colors">
        <div className="w-full max-w-sm">
          {/* Logo — small, no tagline */}
          <OfraLogoFull className="mb-10" showTagline={false} iconSize={32} />

          <h2 className="text-2xl font-semibold text-stone-900 dark:text-white mb-1">
            {t('auth.login')}
          </h2>
          <p className="text-sm text-stone-500 dark:text-stone-400 mb-8">
            {t('auth.noAccountYet')}{' '}
            <Link to="/register" className="text-primary hover:underline font-medium">
              {t('auth.createAccountLink')}
            </Link>
          </p>

          {/* Error Message */}
          {(error || validationError) && (
            <div className="mb-6 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3">
              <p className="text-sm text-red-700 dark:text-red-300">
                {validationError || error}
              </p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
                {t('auth.email')}
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-md border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors text-sm"
                placeholder="vous@exemple.com"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300">
                  {t('auth.password')}
                </label>
                <Link to="/forgot-password" className="text-xs text-stone-500 hover:text-primary transition-colors">
                  {t('auth.forgotPasswordLink')}
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 pr-10 rounded-md border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors text-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loginMutation.isPending || !isFormValid}
              className="w-full py-2.5 px-4 rounded-md text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-primary hover:bg-primary/90"
            >
              {loginMutation.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  {t('auth.loggingIn')}
                </span>
              ) : (
                t('auth.login')
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
