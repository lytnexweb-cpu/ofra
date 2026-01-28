import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

interface BreadcrumbItem {
  label: string
  path: string
}

export default function Breadcrumb() {
  const location = useLocation()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const getBreadcrumbs = (): BreadcrumbItem[] => {
    const path = location.pathname
    const breadcrumbs: BreadcrumbItem[] = []

    if (path !== '/') {
      breadcrumbs.push({ label: t('nav.dashboard'), path: '/' })
    }

    const segments = path.split('/').filter((s) => s)

    const labelMap: Record<string, string> = {
      clients: t('nav.clients'),
      transactions: t('nav.transactions'),
      settings: t('nav.settings'),
    }

    segments.forEach((segment, index) => {
      if (!isNaN(Number(segment))) {
        breadcrumbs.push({ label: `#${segment}`, path: `/${segments.slice(0, index + 1).join('/')}` })
      } else {
        const label = labelMap[segment] || segment
        breadcrumbs.push({ label, path: `/${segments.slice(0, index + 1).join('/')}` })
      }
    })

    return breadcrumbs
  }

  const breadcrumbs = getBreadcrumbs()

  if (location.pathname === '/') {
    return null
  }

  return (
    <nav className="sm:hidden flex items-center space-x-2 text-sm" aria-label={t('common.breadcrumb')}>
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-muted-foreground hover:text-foreground"
        aria-label={t('common.goBack')}
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>

      {/* Breadcrumb trail */}
      <div className="flex items-center space-x-1 overflow-x-auto">
        {breadcrumbs.map((crumb, index) => (
          <div key={crumb.path} className="flex items-center space-x-1">
            {index > 0 && <span className="text-muted-foreground/50">/</span>}
            {index === breadcrumbs.length - 1 ? (
              <span
                className="text-foreground font-medium truncate max-w-[120px]"
                aria-current="page"
              >
                {crumb.label}
              </span>
            ) : (
              <Link
                to={crumb.path}
                className="text-primary hover:text-primary/80 truncate max-w-[100px]"
              >
                {crumb.label}
              </Link>
            )}
          </div>
        ))}
      </div>
    </nav>
  )
}
