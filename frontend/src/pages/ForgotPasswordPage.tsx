import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { authApi } from '../api/auth.api'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, CheckCircle } from 'lucide-react'
import { OfraLogoFull } from '../components/OfraLogo'

export default function ForgotPasswordPage() {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const forgotPasswordMutation = useMutation({
    mutationFn: authApi.forgotPassword,
    onSuccess: (data) => {
      if (data.success) {
        setSubmitted(true)
      } else {
        if (data.error?.code === 'E_RATE_LIMIT') {
          const retryAfter = data.error?.retryAfter || 300
          const minutes = Math.ceil(retryAfter / 60)
          setError(t('auth.rateLimitError', { minutes }))
        } else {
          setError(data.error?.message || t('auth.forgotPasswordFailed'))
        }
      }
    },
    onError: () => {
      setError(t('auth.networkError'))
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email.trim()) {
      setError(t('auth.enterEmail'))
      return
    }

    forgotPasswordMutation.mutate({ email: email.trim() })
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-900 py-12 px-4 sm:px-6 lg:px-8 transition-colors">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-stone-800 rounded-2xl shadow-xl p-10 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-stone-900 dark:text-white mb-3">
              {t('auth.checkYourEmail')}
            </h2>
            <p className="text-stone-500 dark:text-stone-400 mb-6">
              {t('auth.resetEmailSent')}
            </p>
            <Link
              to="/login"
              className="inline-flex items-center text-primary hover:underline font-medium"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('auth.backToLogin')}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-900 py-12 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white dark:bg-stone-800 rounded-2xl shadow-xl p-10">
          {/* Logo + Tagline */}
          <OfraLogoFull className="mb-8" />

          <h2 className="text-xl font-semibold text-stone-900 dark:text-white text-center mb-2">
            {t('auth.forgotPasswordTitle')}
          </h2>
          <p className="text-sm text-stone-500 dark:text-stone-400 text-center mb-6">
            {t('auth.forgotPasswordDescription')}
          </p>

          {/* Error Message */}
          {error && (
            <div className="mb-6 rounded-lg bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
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

            <button
              type="submit"
              disabled={forgotPasswordMutation.isPending || !email.trim()}
              className="w-full py-3 px-4 rounded-lg text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:translate-y-[-1px] hover:shadow-lg active:translate-y-0 bg-primary hover:bg-primary/90"
            >
              {forgotPasswordMutation.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  {t('auth.sending')}
                </span>
              ) : (
                t('auth.sendResetLink')
              )}
            </button>
          </form>

          {/* Link */}
          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="inline-flex items-center text-sm text-primary hover:underline"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              {t('auth.backToLogin')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
