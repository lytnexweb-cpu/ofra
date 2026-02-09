import { useState, useEffect } from 'react'
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { authApi } from '../api/auth.api'
import MobileMenu from './common/MobileMenu'
import { BRAND } from '../config/brand'
import { OfraLogo } from './OfraLogo'
import {
  DashboardIcon,
  ClientsIcon,
  TransactionsIcon,
  SettingsIcon,
  BellIcon,
  MenuIcon,
  CloseIcon,
} from './ui/Icons'
import { ShieldCheck } from 'lucide-react'
import SoftLimitBanner from './SoftLimitBanner'

// Logout icon
function LogoutIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  )
}

export default function Layout() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const { data: userData } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: authApi.me,
  })

  // Sync language from backend on login (prevents desync across devices)
  useEffect(() => {
    const backendLanguage = userData?.data?.user?.language
    if (backendLanguage && ['fr', 'en'].includes(backendLanguage)) {
      const currentLanguage = i18n.language?.substring(0, 2)
      if (currentLanguage !== backendLanguage) {
        i18n.changeLanguage(backendLanguage)
        localStorage.setItem('i18nextLng', backendLanguage)
      }
    }
  }, [userData?.data?.user?.language, i18n])

  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      queryClient.clear()
      navigate('/login')
    },
  })

  const navLinks = [
    { to: '/', label: t('nav.dashboard'), icon: DashboardIcon },
    { to: '/transactions', label: t('nav.transactions'), icon: TransactionsIcon },
    { to: '/clients', label: t('nav.clients'), icon: ClientsIcon },
    { to: '/settings', label: t('nav.settings'), icon: SettingsIcon },
  ]

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  const handleMobileLogout = () => {
    setMobileMenuOpen(false)
    logoutMutation.mutate()
  }

  const userInitials = userData?.data?.user?.fullName
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?'

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-stone-50 dark:bg-stone-900 text-foreground flex flex-col lg:flex-row transition-colors">
      {/* Skip link for accessibility */}
      <a href="#main" className="skip-link">
        {t('common.skipToContent')}
      </a>

      {/* Desktop Sidebar */}
      <aside
        className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:z-40 border-r border-stone-200 dark:border-stone-700 bg-primary"
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
          <OfraLogo size={36} />
          <span
            className="text-xl font-bold text-white"
            style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
          >
            {BRAND.name}
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1" aria-label={t('common.mainNavigation')}>
          {navLinks.map((link) => {
            const Icon = link.icon
            const active = isActive(link.to)
            return (
              <Link
                key={link.to}
                to={link.to}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-white/15 text-white'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon className="w-5 h-5" />
                {link.label}
              </Link>
            )
          })}
        </nav>

        {/* Admin link - only visible for admin/superadmin */}
        {(userData?.data?.user?.role === 'admin' || userData?.data?.user?.role === 'superadmin') && (
          <div className="px-3 pb-2">
            <Link
              to="/admin"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-colors"
            >
              <ShieldCheck className="w-5 h-5" />
              {t('nav.admin')}
            </Link>
          </div>
        )}

        {/* User section at bottom */}
        <div className="border-t border-white/10 p-4">
          <Link
            to="/account"
            className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold bg-accent text-white"
            >
              {userInitials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {userData?.data?.user?.fullName || t('common.user')}
              </p>
              <p className="text-xs text-white/50 truncate">
                {userData?.data?.user?.email}
              </p>
            </div>
          </Link>
          <button
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
            className="mt-3 w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            <LogoutIcon className="w-5 h-5" />
            {logoutMutation.isPending ? t('auth.loggingOut') : t('nav.logout')}
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700">
        <div className="flex items-center justify-between px-4 h-16">
          <Link to="/" className="flex items-center gap-2">
            <OfraLogo size={32} />
            <span
              className="text-lg font-bold text-primary"
              style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
            >
              {BRAND.name}
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              className="p-2 rounded-lg text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
              aria-label={t('common.notifications')}
            >
              <BellIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
              aria-expanded={mobileMenuOpen}
            >
              <span className="sr-only">{t('common.openMenu')}</span>
              {mobileMenuOpen ? (
                <CloseIcon className="w-6 h-6" />
              ) : (
                <MenuIcon className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <MobileMenu
          open={mobileMenuOpen}
          navLinks={navLinks}
          isActive={isActive}
          onNavClick={() => setMobileMenuOpen(false)}
          onLogout={handleMobileLogout}
          isLoggingOut={logoutMutation.isPending}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 w-full min-w-0 lg:pl-64 flex flex-col h-screen lg:h-auto lg:min-h-screen">
        {/* Desktop top bar */}
        <header className="hidden lg:flex items-center justify-end h-16 px-8 bg-white dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700 shrink-0">
          <button
            className="p-2 rounded-lg text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
            aria-label={t('common.notifications')}
          >
            <BellIcon className="w-5 h-5" />
          </button>
        </header>

        {/* K2: Soft limit banner */}
        <SoftLimitBanner />

        {/* Page Content - scrollable on mobile, normal flow on desktop */}
        <main id="main" className="flex-1 overflow-y-auto lg:overflow-visible p-4 sm:p-6 lg:p-8 pt-20 lg:pt-6 pb-20 lg:pb-8 overflow-x-hidden">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>

        {/* Footer - fixed on mobile, normal flow on desktop */}
        <footer className="fixed bottom-0 left-0 right-0 lg:relative lg:bottom-auto lg:left-auto lg:right-auto shrink-0 border-t border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 z-10">
          <div className="max-w-6xl mx-auto py-3 lg:py-4 px-4 sm:px-6 lg:px-8">
            <p className="text-center text-xs text-stone-400">
              {BRAND.copyright}
            </p>
          </div>
        </footer>
      </div>
    </div>
  )
}
