import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '../api/dashboard.api'
import {
  KPICard,
  PipelineChart,
  RevenueChart,
  RecentActivity,
  UpcomingDeadlines,
} from '../components/dashboard'
import { PageTransition, DashboardSkeleton } from '../components/ui'

export default function DashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: () => dashboardApi.getSummary(),
  })

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
          <p className="text-gray-600 dark:text-gray-400">Failed to load dashboard</p>
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
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Welcome back! Here's what's happening with your transactions.</p>
        </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Active Transactions"
          value={summary.activeTransactions}
          color="blue"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        />
        <KPICard
          title="Completed"
          value={summary.completedTransactions}
          color="green"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <KPICard
          title="Conversion Rate"
          value={summary.conversionRate}
          suffix="%"
          color="purple"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          }
        />
        <KPICard
          title="Overdue Conditions"
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

      {/* Quick Stats Footer */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-blue-100 text-sm">Total Transactions</p>
            <p className="text-3xl font-bold">{summary.totalTransactions}</p>
          </div>
          <div>
            <p className="text-blue-100 text-sm">Due Soon (7 days)</p>
            <p className="text-3xl font-bold">{summary.dueSoonConditions}</p>
          </div>
          <div>
            <p className="text-blue-100 text-sm">This Month Revenue</p>
            <p className="text-3xl font-bold">
              ${(summary.monthRevenue ?? 0).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-blue-100 text-sm">Total Revenue</p>
            <p className="text-3xl font-bold">
              ${(summary.totalRevenue ?? 0).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
      </div>
    </PageTransition>
  )
}
