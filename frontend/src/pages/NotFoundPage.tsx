import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function NotFoundPage() {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background px-4">
      <h1 className="text-6xl font-bold text-foreground mb-4">404</h1>
      <p className="text-lg text-muted-foreground mb-8">
        {t('errors.pageNotFound', 'This page does not exist.')}
      </p>
      <Link
        to="/"
        className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        {t('common.backToHome', 'Back to home')}
      </Link>
    </div>
  )
}
