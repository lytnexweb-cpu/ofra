import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { dashboardApi } from '../api/dashboard.api'
import { authApi } from '../api/auth.api'
import {
  KPICard,
  PipelineChart,
  RevenueChart,
  RecentActivity,
  UpcomingDeadlines,
} from '../components/dashboard'
import { PageTransition, DashboardSkeleton } from '../components/ui'

export default function DashboardPage() {
  const { t } = useTranslation()

  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: () => dashboardApi.getSummary(),
  })

  const { data: userData } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: authApi.me,
  })

  const userName = userData?.data?.user?.fullName?.split(' ')[0] || ''

  if (isLoading) {
    return <DashboardSkeleton />
  }

  if (error || !data?.data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-gray-600 dark:text-gray-400">{t('dashboard.error')}</p>
        </div>
      </div>
    )
  }

  // Safe defaults for all properties
  const summary = {
    totalTransactions: data.data.totalTransactions ?? 0,
    activeTransactions: data.data.activeTransactions ?? 0,
    completedTransactions: data.data.completedTransactions ?? 0,
    overdueConditions: data.data.overdueConditions ?? 0,
    dueSoonConditions: data.data.dueSoonConditions ?? 0,
    conversionRate: data.data.conversionRate ?? 0,
    pipeline: data.data.pipeline ?? [],
    revenue: data.data.revenue ?? [],
    totalRevenue: data.data.totalRevenue ?? 0,
    monthRevenue: data.data.monthRevenue ?? 0,
    recentActivity: data.data.recentActivity ?? [],
    upcomingDeadlines: data.data.upcomingDeadlines ?? [],
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Hero Banner with greeting + key stats */}
        <div
          className="rounded-2xl p-6 text-white relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #1E3A5F 0%, #172E4D 100%)' }}
        >
          {/* Decorative elements */}
          <div
            className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10"
            style={{ background: '#D97706', transform: 'translate(30%, -50%)' }}
          />
          <div
            className="absolute bottom-0 left-0 w-32 h-32 rounded-full opacity-5"
            style={{ background: '#D97706', transform: 'translate(-30%, 50%)' }}
          />

          {/* Content */}
          <div className="relative z-10">
            {/* Greeting */}
            <div className="mb-6">
              <h1
                className="text-2xl sm:text-3xl font-bold text-white"
                style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
              >
                {userName ? t('dashboard.greeting', { name: userName }) : t('nav.dashboard')}
              </h1>
              <p className="text-white/70 mt-1">
                {t('dashboard.subtitle')}
              </p>
            </div>

            {/* Hero Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <p className="text-white/70 text-xs sm:text-sm">{t('dashboard.transactions')}</p>
                <p className="text-2xl sm:text-3xl font-bold mt-1">{summary.totalTransactions}</p>
                <p className="text-xs text-white/50 mt-1">{summary.activeTransactions} {t('dashboard.active')}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <p className="text-white/70 text-xs sm:text-sm">{t('dashboard.thisWeek')}</p>
                <p className="text-2xl sm:text-3xl font-bold mt-1">{summary.dueSoonConditions}</p>
                <p className="text-xs text-white/50 mt-1">{t('dashboard.dueSoon')}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <p className="text-white/70 text-xs sm:text-sm">{t('dashboard.monthRevenue')}</p>
                <p className="text-xl sm:text-2xl font-bold mt-1">
                  {(summary.monthRevenue ?? 0).toLocaleString(undefined, { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })}
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <p className="text-white/70 text-xs sm:text-sm">{t('dashboard.totalRevenue')}</p>
                <p className="text-xl sm:text-2xl font-bold mt-1" style={{ color: '#FBBF24' }}>
                  {(summary.totalRevenue ?? 0).toLocaleString(undefined, { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* KPIs - Now focused on actionable metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title={t('dashboard.kpi.active')}
            value={summary.activeTransactions}
            color="primary"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
          />
          <KPICard
            title={t('dashboard.kpi.completed')}
            value={summary.completedTransactions}
            color="green"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <KPICard
            title={t('dashboard.kpi.conversion')}
            value={summary.conversionRate}
            suffix="%"
            color="accent"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            }
          />
          <KPICard
            title={t('dashboard.kpi.overdue')}
            value={summary.overdueConditions}
            color={summary.overdueConditions > 0 ? 'red' : 'green'}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PipelineChart data={summary.pipeline} />
          <RevenueChart
            data={summary.revenue}
            totalRevenue={summary.totalRevenue}
            monthRevenue={summary.monthRevenue}
          />
        </div>

        {/* Activity and Deadlines Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentActivity activities={summary.recentActivity} />
          <UpcomingDeadlines deadlines={summary.upcomingDeadlines} />
        </div>
      </div>
    </PageTransition>
  )
}
