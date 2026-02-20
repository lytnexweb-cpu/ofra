import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { LogoutIcon } from '../ui/Icons'
import type { ComponentType, SVGProps } from 'react'

interface NavLink {
  to: string
  label: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
}

interface MobileMenuProps {
  open: boolean
  navLinks: NavLink[]
  isActive: (path: string) => boolean
  onNavClick: () => void
  onLogout: () => void
  isLoggingOut: boolean
}

export default function MobileMenu({
  open,
  navLinks,
  isActive,
  onNavClick,
  onLogout,
  isLoggingOut,
}: MobileMenuProps) {
  const { t } = useTranslation()

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className="lg:hidden overflow-hidden overflow-y-auto max-h-[calc(100vh-4rem)]"
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
                    onClick={onNavClick}
                    aria-current={active ? 'page' : undefined}
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
                onClick={onLogout}
                disabled={isLoggingOut}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-destructive bg-destructive/10 hover:bg-destructive/20 transition-colors disabled:opacity-50"
              >
                <LogoutIcon className="w-5 h-5" />
                {isLoggingOut ? t('auth.loggingOut') : t('auth.logout')}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
