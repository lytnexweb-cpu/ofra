import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { dashboardApi } from '../api/dashboard.api'
import { authApi } from '../api/auth.api'
import { DashboardUrgencies } from '../components/dashboard'
import { PageTransition, DashboardSkeleton } from '../components/ui'

export default function DashboardPage() {
  const { t } = useTranslation()

  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard', 'urgencies'],
    queryFn: () => dashboardApi.getUrgencies(),
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
          <p className="text-stone-600 dark:text-stone-400">{t('dashboard.error')}</p>
        </div>
      </div>
    )
  }

  const d = data.data

  return (
    <PageTransition>
      <DashboardUrgencies
        state={d.state}
        urgencies={d.urgencies}
        hasMore={d.hasMore}
        moreCount={d.moreCount}
        urgencyCount={d.urgencyCount}
        greenCount={d.greenCount}
        nextDeadlineDays={d.nextDeadlineDays}
        totalActiveTransactions={d.totalActiveTransactions}
        userName={userName}
      />
    </PageTransition>
  )
}
