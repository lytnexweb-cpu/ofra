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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col transition-colors">
      {/* Header */}
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left side: Logo + Nav */}
            <div className="flex items-center">
              {/* Logo/Brand */}
              <Link to="/" className="flex items-center gap-2 group">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                  <HomeIcon className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent hidden sm:block">
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
                          ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30'
                          : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
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
                className="relative p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
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
                className="sm:hidden p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
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
              <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
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
                            ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30'
                            : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        {link.label}
                      </Link>
                    )
                  })}
                </div>

                {/* Mobile user section */}
                <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false)
                      logoutMutation.mutate()
                    }}
                    disabled={logoutMutation.isPending}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50"
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
      <main className="flex-1 max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 w-full">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-auto">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <div className="mb-2 sm:mb-0">
              <span>{BRAND.copyright}</span>
            </div>
            <div>
              <span>Powered by </span>
              <a
                href="https://www.lytnexweb.ca"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline font-medium"
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
