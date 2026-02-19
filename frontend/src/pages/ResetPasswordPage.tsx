import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Eye, EyeOff, ArrowLeft, CheckCircle } from 'lucide-react'
import { OfraLogoFull } from '../components/OfraLogo'
import { authApi } from '../api/auth.api'

export default function ResetPasswordPage() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const resetMutation = useMutation({
    mutationFn: authApi.resetPassword,
    onSuccess: (data) => {
      if (data.success) {
        setSuccess(true)
      } else {
        if (data.error?.code === 'E_INVALID_TOKEN') {
          setError(t('auth.resetTokenExpired'))
        } else if (data.error?.code === 'E_VALIDATION_FAILED') {
          setError(t('auth.passwordTooShort'))
        } else {
          setError(data.error?.message || t('auth.resetPasswordFailed'))
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

    if (!password.trim()) {
      setError(t('auth.fillAllFields'))
      return
    }

    if (password.length < 8) {
      setError(t('auth.passwordTooShort'))
      return
    }

    if (password !== confirmPassword) {
      setError(t('auth.passwordMismatch'))
      return
    }

    resetMutation.mutate({ token, password })
  }

  // No token in URL
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 py-12 px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-10 text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
              <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-stone-900 mb-3">
              {t('auth.resetLinkInvalid')}
            </h2>
            <p className="text-stone-500 mb-6">
              {t('auth.resetLinkInvalidDesc')}
            </p>
            <Link
              to="/forgot-password"
              className="inline-flex items-center text-primary hover:underline font-medium"
            >
              {t('auth.requestNewLink')}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 py-12 px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-10 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-stone-900 mb-3">
              {t('auth.passwordResetSuccess')}
            </h2>
            <p className="text-stone-500 mb-6">
              {t('auth.passwordResetSuccessDesc')}
            </p>
            <Link
              to="/login"
              className="inline-block px-6 py-2.5 rounded-md text-white text-sm font-medium bg-primary hover:bg-primary/90 transition-colors"
            >
              {t('auth.login')}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Reset form
  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 py-12 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-10">
          <OfraLogoFull className="mb-8" />

          <h2 className="text-xl font-semibold text-stone-900 text-center mb-2">
            {t('auth.resetPasswordTitle')}
          </h2>
          <p className="text-sm text-stone-500 text-center mb-6">
            {t('auth.resetPasswordDescription')}
          </p>

          {error && (
            <div className="mb-6 rounded-lg bg-red-50 border-l-4 border-red-500 p-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="new-password" className="block text-sm font-medium text-stone-700 mb-1.5">
                {t('auth.newPassword')}
              </label>
              <div className="relative">
                <input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  autoFocus
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-10 rounded-lg border border-stone-200 bg-white text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-shadow text-sm"
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
              <label htmlFor="confirm-password" className="block text-sm font-medium text-stone-700 mb-1.5">
                {t('auth.confirmPassword')}
              </label>
              <input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-stone-200 bg-white text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-shadow text-sm"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={resetMutation.isPending || !password.trim() || !confirmPassword.trim()}
              className="w-full py-3 px-4 rounded-lg text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:translate-y-[-1px] hover:shadow-lg active:translate-y-0 bg-primary hover:bg-primary/90"
            >
              {resetMutation.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  {t('auth.resetting')}
                </span>
              ) : (
                t('auth.resetPassword')
              )}
            </button>
          </form>

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
