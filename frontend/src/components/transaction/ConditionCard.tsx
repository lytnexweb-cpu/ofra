import { useTranslation } from 'react-i18next'
import { Check, ShieldAlert, AlertCircle, Lightbulb, CheckCircle2, Ban, SkipForward, FileWarning, Pencil, Lock } from 'lucide-react'
import { Badge } from '../ui/Badge'
import { CountdownBadge } from '.'
import EvidenceBadge from './EvidenceBadge'
import type { Condition, ConditionLevel, ResolutionType } from '../../api/conditions.api'

interface ConditionCardProps {
  condition: Condition
  interactive?: boolean
  isToggling?: boolean
  onToggle?: (condition: Condition) => void
  onEdit?: (condition: Condition) => void
  showResolution?: boolean
}

const LEVEL_CONFIG: Record<ConditionLevel, { icon: React.ElementType; variant: 'destructive' | 'warning' | 'success'; labelKey: string }> = {
  blocking: { icon: ShieldAlert, variant: 'destructive', labelKey: 'conditions.levels.blocking' },
  required: { icon: AlertCircle, variant: 'warning', labelKey: 'conditions.levels.required' },
  recommended: { icon: Lightbulb, variant: 'success', labelKey: 'conditions.levels.recommended' },
}

const RESOLUTION_CONFIG: Record<ResolutionType, { icon: React.ElementType; colorClass: string; labelKey: string }> = {
  completed: { icon: CheckCircle2, colorClass: 'text-success', labelKey: 'resolution.completed' },
  waived: { icon: Ban, colorClass: 'text-warning', labelKey: 'resolution.waived' },
  not_applicable: { icon: SkipForward, colorClass: 'text-muted-foreground', labelKey: 'resolution.notApplicable' },
  skipped_with_risk: { icon: FileWarning, colorClass: 'text-destructive', labelKey: 'resolution.skippedWithRisk' },
}

export default function ConditionCard({
  condition,
  interactive = false,
  isToggling = false,
  onToggle,
  onEdit,
  showResolution = false,
}: ConditionCardProps) {
  const { t, i18n } = useTranslation()

  const isDone = condition.status === 'completed'
  const isArchived = condition.archived === true
  const canEdit = !isArchived && onEdit
  // Use Premium level if available, fallback to legacy isBlocking
  const level: ConditionLevel | null = condition.level ?? (condition.isBlocking ? 'blocking' : null)
  const isBlocking = level === 'blocking' && !isDone

  // D41: Completed blocking/required conditions are locked (can't be unchecked)
  const isLocked = isDone && (level === 'blocking' || level === 'required')

  // Get localized title
  const title = i18n.language === 'fr' && condition.labelFr
    ? condition.labelFr
    : i18n.language === 'en' && condition.labelEn
      ? condition.labelEn
      : condition.title

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
        {interactive && !isLocked ? (
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
        ) : isLocked ? (
          /* D41: Locked state for completed blocking/required conditions */
          <div
            className="mt-0.5 w-5 h-5 rounded-full bg-success flex items-center justify-center shrink-0 relative"
            title={t('conditions.lockedTooltip', 'Verrouillé après validation')}
          >
            <Check className="w-3 h-3 text-white" />
            <Lock className="w-2.5 h-2.5 text-white absolute -bottom-0.5 -right-0.5 bg-muted-foreground rounded-full p-0.5" />
          </div>
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
              {title}
            </span>

            {/* Premium level badge */}
            {level && !isDone && (
              (() => {
                const config = LEVEL_CONFIG[level]
                const Icon = config.icon
                return (
                  <Badge variant={config.variant} className="gap-1 text-[10px] px-1.5 py-0">
                    <Icon className="w-3 h-3" />
                    {t(config.labelKey)}
                  </Badge>
                )
              })()
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

          {/* Due date + countdown OR resolution status */}
          <div className="mt-1.5 flex items-center gap-2">
            {condition.dueDate && !isDone && !condition.resolutionType && (
              <CountdownBadge dueDate={condition.dueDate} />
            )}

            {/* Show resolution status for Premium conditions */}
            {(showResolution || condition.archived) && condition.resolutionType && (
              (() => {
                const config = RESOLUTION_CONFIG[condition.resolutionType]
                const Icon = config.icon
                return (
                  <span className={`flex items-center gap-1 text-xs ${config.colorClass}`}>
                    <Icon className="w-3 h-3" />
                    {t(config.labelKey)}
                    {condition.resolutionNote && (
                      <span className="text-muted-foreground ml-1">
                        — {condition.resolutionNote.slice(0, 50)}{condition.resolutionNote.length > 50 ? '...' : ''}
                      </span>
                    )}
                  </span>
                )
              })()
            )}

            {isDone && condition.completedAt && !condition.resolutionType && (
              <span className="text-xs text-success">
                {t('workflow.status.completed')}
              </span>
            )}

            {/* D41: Show escape badge if condition was validated without proof */}
            {isDone && condition.escapedWithoutProof && (
              <EvidenceBadge
                escapedWithoutProof
                escapeReason={condition.escapeReason}
                compact
              />
            )}
          </div>
        </div>

        {/* D38: Edit button */}
        {canEdit && (
          <button
            type="button"
            onClick={() => onEdit(condition)}
            className="shrink-0 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label={t('common.edit')}
            data-testid={`edit-condition-${condition.id}`}
          >
            <Pencil className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}
