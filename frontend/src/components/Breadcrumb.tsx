import { Link, useLocation, useNavigate } from 'react-router-dom'

interface BreadcrumbItem {
  label: string
  path: string
}

export default function Breadcrumb() {
  const location = useLocation()
  const navigate = useNavigate()

  // Generate breadcrumb items based on current path
  const getBreadcrumbs = (): BreadcrumbItem[] => {
    const path = location.pathname
    const breadcrumbs: BreadcrumbItem[] = []

    // Always add home
    if (path !== '/') {
      breadcrumbs.push({ label: 'Home', path: '/' })
    }

    // Parse path segments
    const segments = path.split('/').filter((s) => s)

    // Map segments to readable labels
    const labelMap: Record<string, string> = {
      clients: 'Clients',
      transactions: 'Transactions',
      settings: 'Settings',
    }

    segments.forEach((segment, index) => {
      // Skip if it's a numeric ID
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

  // Don't show breadcrumb on home page
  if (location.pathname === '/') {
    return null
  }

  return (
    <nav className="sm:hidden flex items-center space-x-2 text-sm">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-gray-600 hover:text-gray-900"
        aria-label="Go back"
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
            {index > 0 && <span className="text-gray-400">/</span>}
            {index === breadcrumbs.length - 1 ? (
              <span className="text-gray-900 font-medium truncate max-w-[120px]">
                {crumb.label}
              </span>
            ) : (
              <Link
                to={crumb.path}
                className="text-blue-600 hover:text-blue-800 truncate max-w-[100px]"
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
