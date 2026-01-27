import { useTranslation } from 'react-i18next'
import { Check, ShieldAlert } from 'lucide-react'
import { Badge } from '../ui/Badge'
import { CountdownBadge } from '.'
import type { Condition } from '../../api/conditions.api'

interface ConditionCardProps {
  condition: Condition
  interactive?: boolean
  isToggling?: boolean
  onToggle?: (condition: Condition) => void
}

export default function ConditionCard({
  condition,
  interactive = false,
  isToggling = false,
  onToggle,
}: ConditionCardProps) {
  const { t } = useTranslation()

  const isDone = condition.status === 'completed'
  const isBlocking = condition.isBlocking && !isDone

  const handleToggle = () => {
    if (!interactive || isToggling || !onToggle) return
    onToggle(condition)
  }

  return (
    <div
      className={[
        'rounded-lg border p-3 transition-colors',
        isBlocking ? 'border-l-4 border-l-destructive border-destructive/20' : 'border-border',
        isDone ? 'opacity-60' : '',
      ].join(' ')}
      data-testid={`condition-card-${condition.id}`}
      data-condition-id={condition.id}
    >
      <div className="flex items-start gap-3">
        {/* Status indicator — interactive checkbox or static icon */}
        {interactive ? (
          <button
            type="button"
            onClick={handleToggle}
            disabled={isToggling}
            className={[
              '-m-3 p-3 shrink-0 flex items-center justify-center rounded-lg',
              isToggling ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
            ].join(' ')}
            aria-label={isDone ? t('workflow.status.completed') : t('workflow.status.pending')}
            data-testid={`toggle-condition-${condition.id}`}
          >
            <span
              className={[
                'w-5 h-5 rounded-full flex items-center justify-center transition-colors',
                isDone
                  ? 'bg-success text-white'
                  : 'border-2 border-muted-foreground/30 hover:border-primary',
              ].join(' ')}
            >
              {isDone && <Check className="w-3 h-3" />}
            </span>
          </button>
        ) : isDone ? (
          <div className="mt-0.5 w-5 h-5 rounded-full bg-success flex items-center justify-center shrink-0">
            <Check className="w-3 h-3 text-white" />
          </div>
        ) : (
          <div className="mt-0.5 w-5 h-5 rounded-full border-2 border-muted-foreground/30 shrink-0" />
        )}

        <div className="flex-1 min-w-0">
          {/* Title + badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={[
                'text-sm font-medium',
                isDone ? 'line-through text-muted-foreground' : 'text-foreground',
              ].join(' ')}
            >
              {condition.title}
            </span>

            {isBlocking && (
              <Badge variant="destructive" className="gap-1 text-[10px] px-1.5 py-0">
                <ShieldAlert className="w-3 h-3" />
                {t('conditions.blocking')}
              </Badge>
            )}

            {condition.type && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                {t(`conditions.types.${condition.type}`, { defaultValue: condition.type })}
              </Badge>
            )}
          </div>

          {/* Description */}
          {condition.description && (
            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
              {condition.description}
            </p>
          )}

          {/* Due date + countdown */}
          <div className="mt-1.5 flex items-center gap-2">
            {condition.dueDate && !isDone && (
              <CountdownBadge dueDate={condition.dueDate} />
            )}
            {isDone && condition.completedAt && (
              <span className="text-xs text-success">
                {t('workflow.status.completed')}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
