import { differenceInDays, parseISO } from 'date-fns'
import { Badge } from '../ui/Badge'
import { Clock } from 'lucide-react'

interface CountdownBadgeProps {
  dueDate: string
}

export default function CountdownBadge({ dueDate }: CountdownBadgeProps) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = parseISO(dueDate)
  due.setHours(0, 0, 0, 0)
  const days = differenceInDays(due, today)

  if (days > 7) return null

  const isOverdue = days < 0
  const variant = isOverdue ? 'destructive' : 'warning'
  const label = isOverdue ? `${days}j` : `${days}j`

  return (
    <Badge
      variant={variant}
      className="gap-1 text-xs"
      data-testid="countdown-badge"
    >
      <Clock className="w-3 h-3" />
      {label}
    </Badge>
  )
}
