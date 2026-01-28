import { useState } from 'react'
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { authApi } from '../api/auth.api'
import Breadcrumb from './Breadcrumb'
import MobileMenu from './common/MobileMenu'
import { BRAND } from '../config/brand'
import UserDropdown from './ui/UserDropdown'
import {
  DashboardIcon,
  ClientsIcon,
  TransactionsIcon,
  SettingsIcon,
  BellIcon,
  MenuIcon,
  CloseIcon,
  HomeIcon,
} from './ui/Icons'

export default function Layout() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      queryClient.clear()
      navigate('/login')
    },
  })

  const navLinks = [
    { to: '/', label: t('nav.dashboard'), icon: DashboardIcon },
    { to: '/clients', label: t('nav.clients'), icon: ClientsIcon },
    { to: '/transactions', label: t('nav.transactions'), icon: TransactionsIcon },
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

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col transition-colors">
      {/* Skip link for accessibility (AR8) */}
      <a href="#main" className="skip-link">
        {t('common.skipToContent')}
      </a>

      {/* Header — z-banner per AR3 */}
      <nav className="bg-card border-b border-border sticky top-0 z-banner shadow-sm" aria-label={t('common.mainNavigation')}>
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left side: Logo + Nav */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center gap-2 group">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                  <HomeIcon className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent hidden sm:block">
                  {BRAND.name}
                </span>
              </Link>

              {/* Breadcrumb (mobile only) */}
              <div className="ml-4 sm:hidden">
                <Breadcrumb />
              </div>

              {/* Desktop Nav Links */}
              <div className="hidden sm:flex sm:items-center sm:ml-8 sm:space-x-1">
                {navLinks.map((link) => {
                  const Icon = link.icon
                  const active = isActive(link.to)
                  return (
                    <Link
                      key={link.to}
                      to={link.to}
                      aria-current={active ? 'page' : undefined}
                      className={`relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        active
                          ? 'text-primary bg-primary/10'
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {link.label}
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* Right side: Actions */}
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                className="relative p-2 rounded-lg text-muted-foreground hover:bg-accent transition-colors"
                aria-label={t('common.notifications')}
              >
                <BellIcon className="w-5 h-5" />
              </button>

              <div className="hidden sm:block">
                <UserDropdown
                  onLogout={() => logoutMutation.mutate()}
                  isLoggingOut={logoutMutation.isPending}
                />
              </div>

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="sm:hidden p-2 rounded-lg text-muted-foreground hover:bg-accent transition-colors"
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
        </div>

        {/* Mobile menu — extracted component */}
        <MobileMenu
          open={mobileMenuOpen}
          navLinks={navLinks}
          isActive={isActive}
          onNavClick={() => setMobileMenuOpen(false)}
          onLogout={handleMobileLogout}
          isLoggingOut={logoutMutation.isPending}
        />
      </nav>

      {/* Main Content */}
      <main id="main" className="flex-1 max-w-screen-xl mx-auto py-6 px-4 sm:px-6 lg:px-8 w-full">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-card border-t border-border mt-auto">
        <div className="max-w-screen-xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between text-sm text-muted-foreground">
            <div className="mb-2 sm:mb-0">
              <span>{BRAND.copyright}</span>
            </div>
            <div>
              <span>{t('common.poweredBy')} </span>
              <a
                href="https://www.lytnexweb.ca"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 hover:underline font-medium"
              >
                Lytnex Web
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
