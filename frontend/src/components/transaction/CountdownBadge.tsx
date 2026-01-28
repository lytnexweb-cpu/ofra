import { useTranslation } from 'react-i18next'
import { differenceInDays, parseISO } from '../../lib/date'
import { Badge } from '../ui/Badge'
import { Clock } from 'lucide-react'

interface CountdownBadgeProps {
  dueDate: string
  completedAt?: string | null
}

export default function CountdownBadge({ dueDate, completedAt }: CountdownBadgeProps) {
  const { t } = useTranslation()

  if (completedAt) return null

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = parseISO(dueDate)
  due.setHours(0, 0, 0, 0)
  const days = differenceInDays(due, today)

  if (days > 7) return null

  const isOverdue = days < 0
  const isToday = days === 0
  const isTomorrow = days === 1

  let label: string
  let variant: 'destructive' | 'warning'

  if (isOverdue) {
    label = t('countdown.overdue', { count: Math.abs(days) })
    variant = 'destructive'
  } else if (isToday) {
    label = t('countdown.today')
    variant = 'destructive'
  } else if (isTomorrow) {
    label = t('countdown.tomorrow')
    variant = 'warning'
  } else {
    label = t('countdown.daysLeft', { count: days })
    variant = 'warning'
  }

  return (
    <Badge
      variant={variant}
      className="gap-1 text-xs"
      data-testid="countdown-badge"
      aria-label={label}
    >
      <Clock className="w-3 h-3" />
      {label}
    </Badge>
  )
}
