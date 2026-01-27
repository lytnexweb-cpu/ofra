import { Link } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'

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

const activityTypeLabels: Record<string, string> = {
  transaction_created: 'Transaction created',
  step_entered: 'Step entered',
  step_completed: 'Step completed',
  step_skipped: 'Step skipped',
  condition_created: 'Condition added',
  condition_completed: 'Condition completed',
  condition_deleted: 'Condition removed',
  offer_created: 'Offer created',
  offer_accepted: 'Offer accepted',
  offer_rejected: 'Offer rejected',
  offer_withdrawn: 'Offer withdrawn',
  note_added: 'Note added',
}

function getActivityIcon(activityType: string) {
  if (activityType.startsWith('step_')) {
    return (
      <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      </div>
    )
  }
  if (activityType.startsWith('condition_')) {
    return (
      <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
    )
  }
  if (activityType.startsWith('offer_')) {
    return (
      <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
    )
  }
  if (activityType === 'note_added') {
    return (
      <div className="p-2 rounded-full bg-yellow-100 dark:bg-yellow-900/50 text-yellow-600 dark:text-yellow-400">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </div>
    )
  }
  return (
    <div className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>
  )
}

function getActivityDescription(activity: Activity): string {
  const label = activityTypeLabels[activity.activityType] || activity.activityType
  const meta = activity.metadata || {}

  if (activity.activityType === 'step_entered' && meta.stepName) {
    return `Entered step: ${meta.stepName}`
  }
  if (activity.activityType === 'step_completed' && meta.stepName) {
    return `Completed step: ${meta.stepName}`
  }
  if (activity.activityType === 'condition_completed' && meta.conditionTitle) {
    return `Condition completed: ${meta.conditionTitle}`
  }

  return label
}

export default function RecentActivity({ activities = [] }: RecentActivityProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h3>

      {activities.length === 0 ? (
        <div className="py-8 text-center text-gray-400 dark:text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>No recent activity</p>
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => (
            <Link
              key={`${activity.activityType}-${activity.id}`}
              to={`/transactions/${activity.transactionId}`}
              className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              {getActivityIcon(activity.activityType)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {activity.clientName}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {getActivityDescription(activity)}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
