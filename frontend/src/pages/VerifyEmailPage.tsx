import { useEffect, useState, useCallback } from 'react'
import { useSearchParams, useLocation, Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CheckCircle, XCircle, Loader2, Mail, RefreshCw } from 'lucide-react'
import { OfraLogoFull } from '../components/OfraLogo'
import { http } from '../api/http'
import { authApi } from '../api/auth.api'

type Status = 'loading' | 'success' | 'error' | 'no-token'

export default function VerifyEmailPage() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const [status, setStatus] = useState<Status>('loading')
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const navigate = useNavigate()
  const token = searchParams.get('token')
  const emailFromState = (location.state as { email?: string })?.email ?? ''

  useEffect(() => {
    if (!token) {
      setStatus('no-token')
      return
    }

    http.get(`/api/verify-email?token=${token}`)
      .then((res) => {
        if (res.success) {
          setStatus('success')
          // Auto-logged in by backend — redirect to app after a brief success message
          setTimeout(() => {
            navigate('/', { replace: true })
          }, 2000)
        } else {
          setStatus('error')
        }
      })
      .catch(() => {
        setStatus('error')
      })
  }, [token, navigate])

  const handleResend = useCallback(async () => {
    if (!emailFromState || resendStatus === 'sending') return
    setResendStatus('sending')
    try {
      await authApi.resendVerification(emailFromState)
      setResendStatus('sent')
    } catch {
      setResendStatus('error')
    }
  }, [emailFromState, resendStatus])

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 py-12 px-4">
      <div className="w-full max-w-md text-center">
        <OfraLogoFull className="mb-10" showTagline={false} iconSize={32} />

        {status === 'loading' && (
          <div className="space-y-4">
            <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto" />
            <p className="text-stone-600">
              {t('verify.loading', 'Vérification en cours...')}
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-semibold text-stone-900">
              {t('verify.successTitle', 'Courriel confirmé!')}
            </h2>
            <p className="text-stone-600">
              {t('verify.successRedirect', 'Votre adresse courriel a été vérifiée. Redirection en cours...')}
            </p>
            <Loader2 className="h-5 w-5 text-primary animate-spin mx-auto" />
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-semibold text-stone-900">
              {t('verify.errorTitle', 'Lien invalide ou expiré')}
            </h2>
            <p className="text-stone-600">
              {t('verify.errorDesc', 'Ce lien de vérification est invalide ou a expiré. Veuillez demander un nouveau lien.')}
            </p>
            {emailFromState && (
              <div className="pt-2">
                <ResendButton
                  resendStatus={resendStatus}
                  onResend={handleResend}
                  t={t}
                />
              </div>
            )}
            <div className="pt-4">
              <Link
                to="/register"
                className="inline-block px-6 py-2.5 rounded-md text-white text-sm font-medium bg-primary hover:bg-primary/90 transition-colors"
              >
                {t('verify.tryAgain', "S'inscrire à nouveau")}
              </Link>
            </div>
          </div>
        )}

        {status === 'no-token' && (
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center">
              <Mail className="h-8 w-8 text-stone-500" />
            </div>
            <h2 className="text-2xl font-semibold text-stone-900">
              {t('verify.checkEmail', 'Vérifiez votre courriel')}
            </h2>
            <p className="text-stone-600">
              {t('verify.checkEmailDesc', 'Un courriel de vérification a été envoyé. Cliquez sur le lien dans le courriel pour activer votre compte.')}
            </p>
            {emailFromState && (
              <div className="pt-2">
                <ResendButton
                  resendStatus={resendStatus}
                  onResend={handleResend}
                  t={t}
                />
              </div>
            )}
            <div className="pt-4">
              <Link
                to="/login"
                className="text-sm text-primary hover:underline"
              >
                {t('auth.backToLogin', 'Retour à la connexion')}
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ResendButton({
  resendStatus,
  onResend,
  t,
}: {
  resendStatus: 'idle' | 'sending' | 'sent' | 'error'
  onResend: () => void
  t: (key: string, fallback?: string) => string
}) {
  if (resendStatus === 'sent') {
    return (
      <p className="text-sm text-green-600 flex items-center justify-center gap-1.5">
        <CheckCircle className="h-4 w-4" />
        {t('verify.resendSuccess', 'Courriel renvoyé ! Vérifiez votre boîte de réception.')}
      </p>
    )
  }

  return (
    <button
      onClick={onResend}
      disabled={resendStatus === 'sending'}
      className="inline-flex items-center gap-2 text-sm text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <RefreshCw className={`h-4 w-4 ${resendStatus === 'sending' ? 'animate-spin' : ''}`} />
      {resendStatus === 'sending'
        ? t('verify.resending', 'Envoi en cours...')
        : t('verify.resendLink', "Renvoyer le courriel de vérification")}
    </button>
  )
}
