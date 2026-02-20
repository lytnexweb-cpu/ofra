import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Zap, Users, Settings, LogOut } from 'lucide-react'
import { authApi } from '../api/auth.api'
import { adminApi } from '../api/admin.api'

const SITE_MODE_DOT: Record<string, string> = {
  live: 'bg-emerald-500',
  coming_soon: 'bg-amber-500',
  maintenance: 'bg-red-500',
}

const SITE_MODE_LABELS: Record<string, string> = {
  live: 'Live',
  coming_soon: 'Construction',
  maintenance: 'Maintenance',
}

const NAV_ITEMS = [
  { to: '/admin', Icon: Zap, labelKey: 'admin.pulse.title', fallback: 'Pulse', exact: true },
  { to: '/admin/gens', Icon: Users, labelKey: 'admin.gens.title', fallback: 'Gens' },
  { to: '/admin/config', Icon: Settings, labelKey: 'admin.config.title', fallback: 'Config' },
]

export default function AdminLayout() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()

  const { data: userData } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: authApi.me,
  })

  const { data: settingsData } = useQuery({
    queryKey: ['admin', 'site-settings'],
    queryFn: () => adminApi.getSiteSettings(),
    staleTime: 60_000,
  })

  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      queryClient.clear()
      navigate('/login')
    },
  })

  const isActive = (path: string, exact?: boolean) => {
    if (exact) return location.pathname === path
    return location.pathname.startsWith(path)
  }

  const user = userData?.data?.user
  const initials =
    user?.fullName
      ?.split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '?'

  const siteMode = settingsData?.data?.site_mode || 'live'

  return (
    <div className="flex min-h-screen" style={{ background: '#F8FAFC' }}>
      {/* Sidebar — navy #1E3A5F, 240px */}
      <aside
        className="hidden md:flex w-60 fixed inset-y-0 left-0 z-50 flex-col"
        style={{ background: '#1E3A5F', color: '#F8FAFC', padding: '24px 16px', gap: '4px' }}
      >
        {/* Logo */}
        <div style={{ padding: '8px 12px 6px', fontSize: '22px', fontWeight: 700, letterSpacing: '2px' }}>
          <span style={{ color: '#F59E0B' }}>O</span>FRA
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: '11px',
            fontWeight: 500,
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.5)',
            padding: '0 12px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.12)',
            marginBottom: '16px',
          }}
        >
          Admin
        </div>

        {/* Site mode badge */}
        <div style={{ padding: '0 12px 12px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(255,255,255,0.05)',
              padding: '4px 12px',
              borderRadius: '999px',
              fontSize: '11px',
              fontWeight: 600,
            }}
          >
            <span className={`w-2 h-2 rounded-full ${SITE_MODE_DOT[siteMode] || 'bg-stone-500'}`} />
            <span style={{ color: 'rgba(255,255,255,0.8)' }}>
              {SITE_MODE_LABELS[siteMode] || siteMode}
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.to, item.exact)
            return (
              <Link
                key={item.to}
                to={item.to}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 500,
                  textDecoration: 'none',
                  color: active ? '#fff' : 'rgba(255,255,255,0.7)',
                  background: active ? 'rgba(255,255,255,0.15)' : 'transparent',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
                    e.currentTarget.style.color = '#fff'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = 'rgba(255,255,255,0.7)'
                  }
                }}
              >
                <item.Icon size={18} style={{ flexShrink: 0 }} />
                {t(item.labelKey, item.fallback)}
              </Link>
            )
          })}
        </nav>

        {/* Footer — avatar ambre + user info */}
        <div
          style={{
            marginTop: 'auto',
            padding: '16px 12px',
            borderTop: '1px solid rgba(255,255,255,0.12)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: '#F59E0B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '13px',
              fontWeight: 700,
              color: '#1E3A5F',
              flexShrink: 0,
            }}
          >
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.fullName || user?.email}
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', textTransform: 'capitalize' }}>
              {user?.role}
            </div>
          </div>
          <button
            onClick={() => logoutMutation.mutate()}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(255,255,255,0.5)',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title={t('nav.logout', 'Deconnexion')}
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* Main content — 240px offset, max-width 1200px */}
      <main
        className="flex-1 md:ml-60 px-4 py-6 md:px-10 md:py-8 max-w-[1200px]"
      >
        <Outlet />
      </main>

      {/* Mobile bottom nav */}
      <div
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#E2E8F0] py-1.5 safe-area-bottom"
      >
        <div className="flex justify-around items-center">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.to, item.exact)
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center gap-0.5 py-2 px-3 text-xs font-semibold no-underline rounded-lg ${active ? 'text-[#1E3A5F]' : 'text-[#64748B]'}`}
              >
                <item.Icon size={20} />
                {t(item.labelKey, item.fallback)}
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
