import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react'
import { OfraLogoFull } from '../components/OfraLogo'
import { http } from '../api/http'

type Status = 'loading' | 'success' | 'error' | 'no-token'

export default function VerifyEmailPage() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState<Status>('loading')
  const token = searchParams.get('token')

  useEffect(() => {
    if (!token) {
      setStatus('no-token')
      return
    }

    http.get(`/api/verify-email?token=${token}`)
      .then((res) => {
        setStatus(res.success ? 'success' : 'error')
      })
      .catch(() => {
        setStatus('error')
      })
  }, [token])

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-900 py-12 px-4">
      <div className="w-full max-w-md text-center">
        <OfraLogoFull className="mb-10" showTagline={false} iconSize={32} />

        {status === 'loading' && (
          <div className="space-y-4">
            <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto" />
            <p className="text-stone-600 dark:text-stone-400">
              {t('verify.loading', 'Vérification en cours...')}
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-semibold text-stone-900 dark:text-white">
              {t('verify.successTitle', 'Courriel confirmé!')}
            </h2>
            <p className="text-stone-600 dark:text-stone-400">
              {t('verify.successDesc', 'Votre adresse courriel a été vérifiée avec succès. Vous pouvez maintenant vous connecter.')}
            </p>
            <Link
              to="/login"
              className="inline-block mt-4 px-6 py-2.5 rounded-md text-white text-sm font-medium bg-primary hover:bg-primary/90 transition-colors"
            >
              {t('auth.login')}
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-2xl font-semibold text-stone-900 dark:text-white">
              {t('verify.errorTitle', 'Lien invalide ou expiré')}
            </h2>
            <p className="text-stone-600 dark:text-stone-400">
              {t('verify.errorDesc', 'Ce lien de vérification est invalide ou a expiré. Veuillez demander un nouveau lien.')}
            </p>
            <Link
              to="/register"
              className="inline-block mt-4 px-6 py-2.5 rounded-md text-white text-sm font-medium bg-primary hover:bg-primary/90 transition-colors"
            >
              {t('verify.tryAgain', "S'inscrire à nouveau")}
            </Link>
          </div>
        )}

        {status === 'no-token' && (
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
              <Mail className="h-8 w-8 text-stone-500" />
            </div>
            <h2 className="text-2xl font-semibold text-stone-900 dark:text-white">
              {t('verify.checkEmail', 'Vérifiez votre courriel')}
            </h2>
            <p className="text-stone-600 dark:text-stone-400">
              {t('verify.checkEmailDesc', 'Un courriel de vérification a été envoyé. Cliquez sur le lien dans le courriel pour activer votre compte.')}
            </p>
            <Link
              to="/login"
              className="inline-block mt-4 text-sm text-primary hover:underline"
            >
              {t('auth.backToLogin', 'Retour à la connexion')}
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
