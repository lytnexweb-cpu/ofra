import { useState } from 'react'
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { authApi } from '../api/auth.api'
import Breadcrumb from './Breadcrumb'
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
    { to: '/', label: 'Dashboard', icon: DashboardIcon },
    { to: '/clients', label: 'Clients', icon: ClientsIcon },
    { to: '/transactions', label: 'Transactions', icon: TransactionsIcon },
    { to: '/settings', label: 'Settings', icon: SettingsIcon },
  ]

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  const handleNavClick = () => {
    setMobileMenuOpen(false)
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col transition-colors">
      {/* Skip link for accessibility (AR8) */}
      <a href="#main" className="skip-link">
        Skip to main content
      </a>

      {/* Header */}
      <nav className="bg-card border-b border-border sticky top-0 z-dialog shadow-sm">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left side: Logo + Nav */}
            <div className="flex items-center">
              {/* Logo/Brand */}
              <Link to="/" className="flex items-center gap-2 group">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                  <HomeIcon className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent hidden sm:block">
                  {BRAND.name}
                </span>
              </Link>

              {/* Breadcrumb (mobile/tablet only) */}
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
              {/* Notifications (placeholder for future) */}
              <button
                className="relative p-2 rounded-lg text-muted-foreground hover:bg-accent transition-colors"
                title="Notifications (coming soon)"
              >
                <BellIcon className="w-5 h-5" />
                {/* Badge - uncomment when notifications are implemented */}
                {/* <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span> */}
              </button>

              {/* User Dropdown (desktop) */}
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
                <span className="sr-only">Open main menu</span>
                {mobileMenuOpen ? (
                  <CloseIcon className="w-6 h-6" />
                ) : (
                  <MenuIcon className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="sm:hidden overflow-hidden"
            >
              <div className="bg-card border-t border-border">
                <div className="px-2 py-3 space-y-1">
                  {navLinks.map((link) => {
                    const Icon = link.icon
                    const active = isActive(link.to)
                    return (
                      <Link
                        key={link.to}
                        to={link.to}
                        onClick={handleNavClick}
                        className={`flex items-center gap-3 px-3 py-3 rounded-lg text-base font-medium transition-colors ${
                          active
                            ? 'text-primary bg-primary/10'
                            : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        {link.label}
                      </Link>
                    )
                  })}
                </div>

                {/* Mobile user section */}
                <div className="px-4 py-4 border-t border-border">
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false)
                      logoutMutation.mutate()
                    }}
                    disabled={logoutMutation.isPending}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-destructive bg-destructive/10 hover:bg-destructive/20 transition-colors disabled:opacity-50"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    {logoutMutation.isPending ? 'Logging out...' : 'Logout'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
              <span>Powered by </span>
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
