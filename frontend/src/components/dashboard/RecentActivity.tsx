import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { formatDistanceToNow } from '../../lib/date'

interface Activity {
  id: number
  transactionId: number
  activityType: string
  metadata: Record<string, any>
  clientName: string
  userName: string | null
  createdAt: string
}

interface RecentActivityProps {
  activities: Activity[]
}

function getActivityIcon(activityType: string) {
  if (activityType.startsWith('step_')) {
    return (
      <div className="p-2 rounded-full bg-blue-100 text-blue-600">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      </div>
    )
  }
  if (activityType.startsWith('condition_')) {
    return (
      <div className="p-2 rounded-full bg-green-100 text-green-600">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
    )
  }
  if (activityType.startsWith('offer_')) {
    return (
      <div className="p-2 rounded-full bg-purple-100 text-purple-600">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
    )
  }
  if (activityType === 'note_added') {
    return (
      <div className="p-2 rounded-full bg-yellow-100 text-yellow-600">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </div>
    )
  }
  return (
    <div className="p-2 rounded-full bg-stone-100 text-stone-600">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>
  )
}

export default function RecentActivity({ activities = [] }: RecentActivityProps) {
  const { t } = useTranslation()

  const getActivityDescription = (activity: Activity): string => {
    const meta = activity.metadata || {}

    if (activity.activityType === 'step_entered' && meta.stepName) {
      return t('dashboard.charts.activity.enteredStep', { step: meta.stepName })
    }
    if (activity.activityType === 'step_completed' && meta.stepName) {
      return t('dashboard.charts.activity.completedStep', { step: meta.stepName })
    }
    if (activity.activityType === 'condition_completed' && meta.conditionTitle) {
      return t('dashboard.charts.activity.conditionCompleted', { condition: meta.conditionTitle })
    }

    // Use translated activity type label
    const translationKey = `dashboard.charts.activity.${activity.activityType}`
    return t(translationKey, activity.activityType)
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-stone-100 p-6">
      <h3 className="text-lg font-semibold text-stone-900 mb-4">{t('dashboard.charts.recentActivity')}</h3>

      {activities.length === 0 ? (
        <div className="py-8 text-center text-stone-400">
          <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>{t('dashboard.charts.noRecentActivity')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => (
            <Link
              key={`${activity.activityType}-${activity.id}`}
              to={`/transactions/${activity.transactionId}`}
              className="flex items-start gap-3 p-3 rounded-lg hover:bg-stone-50 transition-colors"
            >
              {getActivityIcon(activity.activityType)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-stone-900 truncate">
                  {activity.clientName}
                </p>
                <p className="text-sm text-stone-500 truncate">
                  {getActivityDescription(activity)}
                </p>
                <p className="text-xs text-stone-400 mt-1">
                  {formatDistanceToNow(activity.createdAt)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
