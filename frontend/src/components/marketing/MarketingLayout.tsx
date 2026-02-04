import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { OfraLogo, OfraLogoFull } from '../OfraLogo'
import { Button } from '../ui/Button'
import { Menu, X, ArrowLeft } from 'lucide-react'

interface MarketingLayoutProps {
  children: React.ReactNode
  showBackButton?: boolean
}

export function MarketingLayout({ children, showBackButton = false }: MarketingLayoutProps) {
  const { t } = useTranslation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()

  const navLinks = [
    { to: '/pricing', label: t('landing.nav.pricing') },
    { to: '/login', label: t('landing.nav.login') },
  ]

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-900">
      {/* Skip to content link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[60] focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
      >
        {t('common.skipToContent')}
      </a>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-stone-900/80 backdrop-blur-md border-b border-stone-200 dark:border-stone-700" aria-label={t('common.mainNavigation')}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/welcome" className="flex items-center gap-2">
              <span className="hidden sm:block">
                <OfraLogoFull showTagline={false} />
              </span>
              <span className="sm:hidden flex items-center gap-2">
                <OfraLogo size={32} />
                <span className="text-xl font-bold text-primary dark:text-white font-outfit">OFRA</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-4">
              {showBackButton && (
                <Link
                  to="/welcome"
                  className="text-sm font-medium text-stone-600 dark:text-stone-300 hover:text-primary dark:hover:text-white transition-colors flex items-center gap-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  {t('common.back')}
                </Link>
              )}
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  aria-current={location.pathname === link.to ? 'page' : undefined}
                  className={`text-sm font-medium transition-colors ${
                    location.pathname === link.to
                      ? 'text-primary dark:text-accent'
                      : 'text-stone-600 dark:text-stone-300 hover:text-primary dark:hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <Link to="/register">
                <Button className="bg-primary hover:bg-primary/90 dark:bg-accent dark:hover:bg-accent/90">
                  {t('landing.nav.getStarted')}
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? t('common.closeMenu') : t('common.openMenu')}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-700">
            <div className="px-4 py-4 space-y-3">
              {showBackButton && (
                <Link
                  to="/welcome"
                  className="flex items-center gap-2 py-2 text-stone-600 dark:text-stone-300"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <ArrowLeft className="w-4 h-4" />
                  {t('common.back')}
                </Link>
              )}
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`block py-2 text-base font-medium ${
                    location.pathname === link.to
                      ? 'text-primary dark:text-accent'
                      : 'text-stone-600 dark:text-stone-300'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <Link to="/register" className="block pt-2" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full bg-primary hover:bg-primary/90 dark:bg-accent dark:hover:bg-accent/90">
                  {t('landing.nav.getStarted')}
                </Button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main id="main-content" tabIndex={-1}>
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-primary dark:bg-stone-950 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="sm:col-span-2 lg:col-span-1">
              <OfraLogoFull className="mb-4" invertColors />
              <p className="text-white/70 text-sm">
                {t('landing.footer.tagline')}
              </p>
            </div>

            {/* Product Links */}
            <div>
              <h4 className="font-semibold text-white mb-4">{t('landing.footer.product')}</h4>
              <ul className="space-y-2 text-sm text-white/70">
                <li>
                  <Link to="/pricing" className="hover:text-white transition-colors">
                    {t('landing.nav.pricing')}
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="hover:text-white transition-colors">
                    {t('landing.footer.signup')}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal Links */}
            <div>
              <h4 className="font-semibold text-white mb-4">{t('landing.footer.legal')}</h4>
              <ul className="space-y-2 text-sm text-white/70">
                <li>
                  <Link to="/privacy" className="hover:text-white transition-colors">
                    {t('landing.footer.privacy')}
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="hover:text-white transition-colors">
                    {t('landing.footer.terms')}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-semibold text-white mb-4">{t('landing.footer.contact')}</h4>
              <ul className="space-y-2 text-sm text-white/70">
                <li>
                  <Link to="/contact" className="hover:text-white transition-colors">
                    {t('landing.footer.contactUs')}
                  </Link>
                </li>
                <li>
                  <a href="mailto:support@ofra.ca" className="hover:text-white transition-colors">
                    support@ofra.ca
                  </a>
                </li>
                <li>Moncton, NB</li>
              </ul>
            </div>
          </div>

          {/* Copyright */}
          <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-white/40">
            <p>© {new Date().getFullYear()} Ofra. {t('landing.footer.rights')}</p>
            <p className="text-xs">v1.0.0</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default MarketingLayout
