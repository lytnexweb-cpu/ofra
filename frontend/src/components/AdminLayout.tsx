import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { authApi } from '../api/auth.api'
import { OfraLogo } from './OfraLogo'
import {
  LayoutDashboard,
  Users,
  Activity,
  Server,
  LogOut,
  ArrowLeft,
  ShieldCheck,
} from 'lucide-react'

export default function AdminLayout() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()

  const { data: userData } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: authApi.me,
  })

  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      queryClient.clear()
      navigate('/login')
    },
  })

  const navLinks = [
    { to: '/admin', label: t('admin.overview'), icon: LayoutDashboard, exact: true },
    { to: '/admin/subscribers', label: t('admin.subscribers'), icon: Users },
    { to: '/admin/activity', label: t('admin.activity'), icon: Activity },
    { to: '/admin/system', label: t('admin.system'), icon: Server },
  ]

  const isActive = (path: string, exact?: boolean) => {
    if (exact) return location.pathname === path
    return location.pathname.startsWith(path)
  }

  const userInitials =
    userData?.data?.user?.fullName
      ?.split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '?'

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-900 text-foreground flex">
      {/* Sidebar */}
      <aside className="w-64 fixed inset-y-0 left-0 z-40 border-r border-stone-200 dark:border-stone-700 bg-stone-900 flex flex-col">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
          <OfraLogo size={36} />
          <div>
            <span className="text-xl font-bold text-white block">Ofra</span>
            <span className="text-xs text-white/60 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              Admin
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1">
          {navLinks.map((link) => {
            const Icon = link.icon
            const active = isActive(link.to, link.exact)
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-white/10 text-white'
                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                {link.label}
              </Link>
            )
          })}
        </nav>

        {/* Back to App */}
        <div className="border-t border-white/10 p-3">
          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/70 hover:bg-white/5 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            {t('admin.backToApp')}
          </Link>
        </div>

        {/* User */}
        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white font-medium text-sm">
              {userInitials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {userData?.data?.user?.fullName || userData?.data?.user?.email}
              </p>
              <p className="text-xs text-white/60 capitalize">
                {userData?.data?.user?.role}
              </p>
            </div>
          </div>
          <button
            onClick={() => logoutMutation.mutate()}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-white/70 hover:bg-white/5 hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4" />
            {t('nav.logout')}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-64 p-8">
        <Outlet />
      </main>
    </div>
  )
}
