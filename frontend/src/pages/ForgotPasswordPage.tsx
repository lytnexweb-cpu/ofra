import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { authApi } from '../api/auth.api'
import { BRAND } from '../config/brand'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, CheckCircle } from 'lucide-react'

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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 transition-colors">
        <div className="max-w-md w-full space-y-8 text-center">
          <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('auth.checkYourEmail')}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {t('auth.resetEmailSent')}
          </p>
          <Link
            to="/login"
            className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-500"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('auth.backToLogin')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            {BRAND.name}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            {t('auth.forgotPasswordTitle')}
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 p-4">
              <p className="text-sm font-medium text-red-800 dark:text-red-300">{error}</p>
            </div>
          )}
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {t('auth.forgotPasswordDescription')}
            </p>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              placeholder={t('auth.email')}
            />
          </div>
          <div>
            <button
              type="submit"
              disabled={forgotPasswordMutation.isPending || !email.trim()}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            >
              {forgotPasswordMutation.isPending ? t('auth.sending') : t('auth.sendResetLink')}
            </button>
          </div>
          <div className="text-center">
            <Link
              to="/login"
              className="inline-flex items-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-500"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              {t('auth.backToLogin')}
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
