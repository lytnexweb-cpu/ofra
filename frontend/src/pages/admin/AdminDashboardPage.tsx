import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import {
  Users,
  FileText,
  UserPlus,
  Activity,
  TrendingUp,
  Server,
  ChevronRight,
} from 'lucide-react'
import { adminApi } from '../../api/admin.api'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'

function KPICard({
  title,
  value,
  icon: Icon,
  trend,
  color = 'primary',
}: {
  title: string
  value: number | string
  icon: React.ElementType
  trend?: string
  color?: 'primary' | 'success' | 'warning'
}) {
  const colorClasses = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
            {trend && (
              <p className="text-xs text-muted-foreground mt-1">{trend}</p>
            )}
          </div>
          <div className={`p-3 rounded-full ${colorClasses[color]}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function QuickLink({
  to,
  icon: Icon,
  label,
  description,
}: {
  to: string
  icon: React.ElementType
  label: string
  description: string
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors group"
    >
      <div className="p-2 rounded-lg bg-primary/10 text-primary">
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1">
        <p className="font-medium group-hover:text-primary transition-colors">
          {label}
        </p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
    </Link>
  )
}

export default function AdminDashboardPage() {
  const { t } = useTranslation()

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'overview'],
    queryFn: () => adminApi.getOverview(),
  })

  const overview = data?.data

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-destructive font-medium">{t('common.error')}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {t('admin.loadError')}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6" data-testid="admin-dashboard">
      <div>
        <h1 className="text-2xl font-bold">{t('admin.dashboard')}</h1>
        <p className="text-muted-foreground">{t('admin.dashboardSubtitle')}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <div className="animate-pulse">
                    <div className="h-4 w-24 bg-muted rounded mb-2" />
                    <div className="h-8 w-16 bg-muted rounded" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
        ) : (
          <>
            <KPICard
              title={t('admin.totalUsers')}
              value={overview?.kpis.totalUsers || 0}
              icon={Users}
              color="primary"
            />
            <KPICard
              title={t('admin.totalTransactions')}
              value={overview?.kpis.totalTransactions || 0}
              icon={FileText}
              color="success"
            />
            <KPICard
              title={t('admin.newUsersMonth')}
              value={overview?.kpis.newUsersThisMonth || 0}
              icon={UserPlus}
              trend={t('admin.last30Days')}
              color="primary"
            />
            <KPICard
              title={t('admin.activeUsers')}
              value={overview?.kpis.activeUsersThisWeek || 0}
              icon={Activity}
              trend={t('admin.last7Days')}
              color="warning"
            />
          </>
        )}
      </div>

      {/* Users by Role */}
      {overview?.usersByRole && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('admin.usersByRole')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-6">
              {overview.usersByRole.map((item) => (
                <div key={item.role} className="text-center">
                  <p className="text-2xl font-bold">{item.count}</p>
                  <p className="text-sm text-muted-foreground capitalize">
                    {item.role}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Links */}
      <div>
        <h2 className="text-lg font-semibold mb-4">{t('admin.quickLinks')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <QuickLink
            to="/admin/subscribers"
            icon={Users}
            label={t('admin.subscribers')}
            description={t('admin.subscribersDesc')}
          />
          <QuickLink
            to="/admin/activity"
            icon={TrendingUp}
            label={t('admin.activity')}
            description={t('admin.activityDesc')}
          />
          <QuickLink
            to="/admin/system"
            icon={Server}
            label={t('admin.system')}
            description={t('admin.systemDesc')}
          />
        </div>
      </div>
    </div>
  )
}
