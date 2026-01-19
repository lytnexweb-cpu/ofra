import { Link } from 'react-router-dom'
import { format, differenceInDays, parseISO } from 'date-fns'

interface Deadline {
  id: number
  title: string
  dueDate: string | null
  transactionId: number
  clientName: string
  priority: 'low' | 'medium' | 'high'
  isBlocking: boolean
}

interface UpcomingDeadlinesProps {
  deadlines: Deadline[]
}

function getPriorityColor(priority: string) {
  switch (priority) {
    case 'high':
      return 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400'
    case 'medium':
      return 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-400'
    case 'low':
      return 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400'
    default:
      return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
  }
}

function getDaysUntilDue(dueDate: string): { text: string; urgent: boolean } {
  const days = differenceInDays(parseISO(dueDate), new Date())

  if (days < 0) {
    return { text: 'Overdue', urgent: true }
  }
  if (days === 0) {
    return { text: 'Due today', urgent: true }
  }
  if (days === 1) {
    return { text: 'Tomorrow', urgent: true }
  }
  if (days <= 3) {
    return { text: `${days} days`, urgent: true }
  }
  return { text: `${days} days`, urgent: false }
}

export default function UpcomingDeadlines({ deadlines = [] }: UpcomingDeadlinesProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Upcoming Deadlines</h3>
        {deadlines.length > 0 && (
          <span className="px-2.5 py-0.5 text-xs font-medium bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400 rounded-full">
            {deadlines.length}
          </span>
        )}
      </div>

      {deadlines.length === 0 ? (
        <div className="py-8 text-center text-gray-400 dark:text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          <p>No upcoming deadlines</p>
        </div>
      ) : (
        <div className="space-y-3">
          {deadlines.map((deadline) => {
            const dueInfo = deadline.dueDate
              ? getDaysUntilDue(deadline.dueDate)
              : { text: 'No date', urgent: false }

            return (
              <Link
                key={deadline.id}
                to={`/transactions/${deadline.transactionId}`}
                className="block p-3 rounded-lg border border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {deadline.title}
                      </p>
                      {deadline.isBlocking && (
                        <span className="flex-shrink-0 px-1.5 py-0.5 text-xs font-medium bg-red-600 text-white rounded">
                          Blocking
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{deadline.clientName}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span
                      className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${
                        dueInfo.urgent ? 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      {dueInfo.text}
                    </span>
                    {deadline.dueDate && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {format(parseISO(deadline.dueDate), 'MMM d')}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-2">
                  <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${getPriorityColor(deadline.priority)}`}>
                    {deadline.priority}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
