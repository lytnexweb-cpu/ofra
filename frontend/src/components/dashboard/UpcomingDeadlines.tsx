import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { formatDate, differenceInDays, parseISO } from '../../lib/date'

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
      return 'bg-red-100 text-red-700'
    case 'medium':
      return 'bg-yellow-100 text-yellow-700'
    case 'low':
      return 'bg-green-100 text-green-700'
    default:
      return 'bg-stone-100 text-stone-700'
  }
}

export default function UpcomingDeadlines({ deadlines = [] }: UpcomingDeadlinesProps) {
  const { t } = useTranslation()

  const getDaysUntilDue = (dueDate: string): { text: string; urgent: boolean } => {
    const days = differenceInDays(parseISO(dueDate), new Date())

    if (days < 0) {
      return { text: t('dashboard.charts.overdue'), urgent: true }
    }
    if (days === 0) {
      return { text: t('dashboard.charts.dueToday'), urgent: true }
    }
    if (days === 1) {
      return { text: t('dashboard.charts.tomorrow'), urgent: true }
    }
    if (days <= 3) {
      return { text: t('dashboard.charts.days', { count: days }), urgent: true }
    }
    return { text: t('dashboard.charts.days', { count: days }), urgent: false }
  }

  const getPriorityLabel = (priority: 'low' | 'medium' | 'high'): string => {
    return t(`dashboard.charts.priority.${priority}`)
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-stone-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-stone-900">{t('dashboard.charts.upcomingDeadlines')}</h3>
        {deadlines.length > 0 && (
          <span className="px-2.5 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded-full">
            {deadlines.length}
          </span>
        )}
      </div>

      {deadlines.length === 0 ? (
        <div className="py-8 text-center text-stone-400">
          <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          <p>{t('dashboard.charts.noUpcomingDeadlines')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {deadlines.map((deadline) => {
            const dueInfo = deadline.dueDate
              ? getDaysUntilDue(deadline.dueDate)
              : { text: t('dashboard.charts.noDate'), urgent: false }

            return (
              <Link
                key={deadline.id}
                to={`/transactions/${deadline.transactionId}`}
                className="block p-3 rounded-lg border border-stone-100 hover:border-stone-200 hover:bg-stone-50 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-stone-900 truncate">
                        {deadline.title}
                      </p>
                      {deadline.isBlocking && (
                        <span className="flex-shrink-0 px-1.5 py-0.5 text-xs font-medium bg-red-600 text-white rounded">
                          {t('dashboard.charts.blocking')}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-stone-500 truncate">{deadline.clientName}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span
                      className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${
                        dueInfo.urgent ? 'bg-red-100 text-red-700' : 'bg-stone-100 text-stone-600'
                      }`}
                    >
                      {dueInfo.text}
                    </span>
                    {deadline.dueDate && (
                      <p className="text-xs text-stone-400 mt-1">
                        {formatDate(parseISO(deadline.dueDate), 'MMM d')}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-2">
                  <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${getPriorityColor(deadline.priority)}`}>
                    {getPriorityLabel(deadline.priority)}
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
