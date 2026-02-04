import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { authApi } from '../api/auth.api'
import { useTranslation } from 'react-i18next'
import { Eye, EyeOff } from 'lucide-react'
import { OfraLogoFull } from '../components/OfraLogo'

export default function RegisterPage() {
  const { t } = useTranslation()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const registerMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: async (data) => {
      if (data.success) {
        setIsLoggingIn(true)
        try {
          const loginResult = await authApi.login({ email: email.trim(), password })
          if (loginResult.success) {
            queryClient.clear()
            setTimeout(() => navigate('/'), 100)
          } else {
            navigate('/login', { state: { registered: true } })
          }
        } catch {
          navigate('/login', { state: { registered: true } })
        }
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

  const isPending = registerMutation.isPending || isLoggingIn

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
    })
  }

  const isFormValid =
    fullName.trim().length > 0 &&
    email.trim().length > 0 &&
    password.trim().length >= 8 &&
    password === confirmPassword

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-900 py-12 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white dark:bg-stone-800 rounded-2xl shadow-xl p-10">
          {/* Logo + Tagline */}
          <OfraLogoFull className="mb-8" />

          {/* Error Message */}
          {error && (
            <div className="mb-6 rounded-lg bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-stone-200 dark:border-stone-600 bg-white dark:bg-stone-700 text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-shadow"
                placeholder={t('auth.fullName')}
              />
            </div>
            <div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-stone-200 dark:border-stone-600 bg-white dark:bg-stone-700 text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-shadow"
                placeholder={t('auth.email')}
              />
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 pr-12 rounded-lg border border-stone-200 dark:border-stone-600 bg-white dark:bg-stone-700 text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-shadow"
                placeholder={t('auth.password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-4 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 pr-12 rounded-lg border border-stone-200 dark:border-stone-600 bg-white dark:bg-stone-700 text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-shadow"
                placeholder={t('auth.confirmPassword')}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-4 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            <button
              type="submit"
              disabled={isPending || !isFormValid}
              className="w-full py-3 px-4 rounded-lg text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:translate-y-[-1px] hover:shadow-lg active:translate-y-0 bg-primary hover:bg-primary/90"
            >
              {isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  {isLoggingIn ? t('auth.loggingIn') : t('auth.creatingAccount')}
                </span>
              ) : (
                t('auth.register')
              )}
            </button>
          </form>

          {/* Link */}
          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="text-sm text-primary hover:underline"
            >
              {t('auth.alreadyHaveAccount')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
