import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { authApi } from '../api/auth.api'
import { Eye, EyeOff, Shield } from 'lucide-react'
import { OfraLogoFull } from '../components/OfraLogo'

export default function AdminLoginPage() {
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
        if (user?.role === 'superadmin' || user?.role === 'admin') {
          setTimeout(() => navigate('/admin'), 100)
        } else {
          setError(t('auth.adminOnly', 'Accès réservé aux administrateurs.'))
        }
      } else {
        if (data.error?.code === 'E_INVALID_CREDENTIALS') {
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
    <div className="min-h-screen flex items-center justify-center bg-stone-100 py-12 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-10">
          <OfraLogoFull className="mb-4" />

          {/* Admin badge */}
          <div className="flex items-center justify-center gap-2 mb-8 text-sm text-stone-500">
            <Shield className="h-4 w-4" />
            <span>{t('auth.adminPanel', 'Administration')}</span>
          </div>

          {/* Error Message */}
          {(error || validationError) && (
            <div className="mb-6 rounded-lg bg-red-50 border-l-4 border-red-500 p-4">
              <p className="text-sm text-red-700">
                {validationError || error}
              </p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="admin-email" className="sr-only">{t('auth.email')}</label>
              <input
                id="admin-email"
                type="email"
                autoComplete="email"
                autoFocus
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-stone-200 bg-white text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-shadow"
                placeholder={t('auth.email')}
              />
            </div>
            <div className="relative">
              <label htmlFor="admin-password" className="sr-only">{t('auth.password')}</label>
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 pr-12 rounded-lg border border-stone-200 bg-white text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-shadow"
                placeholder={t('auth.password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-4 text-stone-400 hover:text-stone-600"
                tabIndex={-1}
                aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            <button
              type="submit"
              disabled={loginMutation.isPending || !isFormValid}
              className="w-full py-3 px-4 rounded-lg text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:translate-y-[-1px] hover:shadow-lg active:translate-y-0 bg-primary hover:bg-primary/90"
            >
              {loginMutation.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
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
