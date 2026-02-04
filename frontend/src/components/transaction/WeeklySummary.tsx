import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { differenceInDays, parseISO } from '../../lib/date'
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import type { Transaction } from '../../api/transactions.api'
import type { Condition } from '../../api/conditions.api'

interface WeeklySummaryProps {
  transactions: Transaction[]
}

export default function WeeklySummary({ transactions }: WeeklySummaryProps) {
  const { t } = useTranslation()

  const { overdueCount, thisWeekCount } = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    let overdue = 0
    let thisWeek = 0

    for (const tx of transactions) {
      const conditions = (tx.conditions ?? []) as Condition[]
      for (const c of conditions) {
        if (!c.isBlocking || c.status !== 'pending' || !c.dueDate) continue
        const due = parseISO(c.dueDate)
        due.setHours(0, 0, 0, 0)
        const days = differenceInDays(due, today)
        if (days < 0) overdue++
        else if (days <= 7) thisWeek++
      }
    }

    return { overdueCount: overdue, thisWeekCount: thisWeek }
  }, [transactions])

  const hasUrgency = overdueCount > 0 || thisWeekCount > 0

  return (
    <div
      className="mb-4 rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-sm"
      data-testid="weekly-summary"
    >
      {hasUrgency ? (
        <div className="flex items-center gap-4 text-sm">
          {overdueCount > 0 && (
            <span className="flex items-center gap-1.5 text-red-600 font-medium">
              <AlertTriangle className="w-4 h-4" />
              {t('summary.overdue', { count: overdueCount })}
            </span>
          )}
          {overdueCount > 0 && thisWeekCount > 0 && (
            <span className="text-stone-300">·</span>
          )}
          {thisWeekCount > 0 && (
            <span className="flex items-center gap-1.5 font-medium" style={{ color: '#D97706' }}>
              <Clock className="w-4 h-4" />
              {t('summary.thisWeek', { count: thisWeekCount })}
            </span>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium">
          <CheckCircle className="w-4 h-4" />
          {t('summary.allClear')}
        </div>
      )}
    </div>
  )
}
