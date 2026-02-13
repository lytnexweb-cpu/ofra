import { useTranslation } from 'react-i18next'
import { Pencil, CheckCircle2, Ban, SkipForward, FileWarning, ShieldCheck } from 'lucide-react'
import EvidenceBadge from './EvidenceBadge'
import type { Condition, ConditionLevel, ResolutionType } from '../../api/conditions.api'
import { differenceInDays } from '../../lib/date'

interface ConditionCardProps {
  condition: Condition
  interactive?: boolean
  isToggling?: boolean
  onToggle?: (condition: Condition) => void
  onEdit?: (condition: Condition) => void
  onFintracClick?: (condition: Condition) => void
  showResolution?: boolean
}

// Level-specific styles matching maquette 01 exactly
const LEVEL_STYLES: Record<ConditionLevel, { bg: string; border: string; borderOverdue: string; checkBorder: string; checkColor: string }> = {
  blocking: {
    bg: 'bg-red-50',
    border: 'border-red-100',
    borderOverdue: 'border-red-200',
    checkBorder: 'border-red-300',
    checkColor: 'accent-red-500',
  },
  required: {
    bg: 'bg-amber-50',
    border: 'border-amber-100',
    borderOverdue: 'border-amber-200',
    checkBorder: 'border-amber-300',
    checkColor: 'accent-amber-500',
  },
  recommended: {
    bg: 'bg-emerald-50/50',
    border: 'border-emerald-100',
    borderOverdue: 'border-emerald-100',
    checkBorder: 'border-emerald-300',
    checkColor: 'accent-emerald-500',
  },
}

const DEFAULT_STYLE = {
  bg: '',
  border: 'border-stone-200',
  borderOverdue: 'border-stone-200',
  checkBorder: 'border-stone-300',
  checkColor: 'accent-stone-500',
}

const RESOLUTION_CONFIG: Record<ResolutionType, { icon: React.ElementType; colorClass: string; labelKey: string }> = {
  completed: { icon: CheckCircle2, colorClass: 'text-emerald-600', labelKey: 'resolution.completed' },
  waived: { icon: Ban, colorClass: 'text-amber-600', labelKey: 'resolution.waived' },
  not_applicable: { icon: SkipForward, colorClass: 'text-stone-500', labelKey: 'resolution.notApplicable' },
  skipped_with_risk: { icon: FileWarning, colorClass: 'text-red-600', labelKey: 'resolution.skippedWithRisk' },
}

// Source type display mapping
const SOURCE_LABELS: Record<string, string> = {
  legal: 'Legal',
  government: 'Government',
  industry: 'Industry',
  best_practice: 'Best practice',
}

// Pack name display mapping (indigo badges)
const PACK_LABELS: Record<string, string> = {
  universal: 'Universal',
  rural_nb: 'Rural NB',
  condo_nb: 'Condo NB',
  finance_nb: 'Finance NB',
  inspection_nb: 'Inspection NB',
  cash_nb: 'Cash NB',
}

export default function ConditionCard({
  condition,
  interactive = false,
  isToggling = false,
  onToggle,
  onEdit,
  onFintracClick,
  showResolution = false,
}: ConditionCardProps) {
  const { t, i18n } = useTranslation()

  const isDone = condition.status === 'completed'
  const isArchived = condition.archived === true
  const canEdit = !isArchived && onEdit
  const level: ConditionLevel | null = condition.level ?? (condition.isBlocking ? 'blocking' : null)
  const isFintrac = condition.title.startsWith('FINTRAC') && condition.sourceType === 'legal'

  // Localized title
  const title = i18n.language === 'fr' && condition.labelFr
    ? condition.labelFr
    : i18n.language === 'en' && condition.labelEn
      ? condition.labelEn
      : condition.title

  // Countdown calculation
  const daysUntil = condition.dueDate && !isDone
    ? differenceInDays(new Date(condition.dueDate), new Date())
    : null
  const isOverdue = daysUntil !== null && daysUntil < 0

  // Level-specific styling
  const style = level ? LEVEL_STYLES[level] : DEFAULT_STYLE
  const borderClass = isOverdue ? style.borderOverdue : style.border

  const handleToggle = () => {
    if (!interactive || isToggling || !onToggle) return
    onToggle(condition)
  }

  return (
    <div
      className={`flex items-center gap-2 p-2.5 rounded-lg ${style.bg} border ${borderClass} transition-colors`}
      data-testid={`condition-card-${condition.id}`}
      data-condition-id={condition.id}
    >
      {/* Checkbox — square, colored by level (maquette 01: simple native checkbox, no lock) */}
      {interactive ? (
        <input
          type="checkbox"
          checked={isDone}
          onChange={handleToggle}
          disabled={isToggling}
          className={`w-4 h-4 rounded ${style.checkBorder} ${style.checkColor} shrink-0 cursor-pointer disabled:opacity-50`}
          data-testid={`toggle-condition-${condition.id}`}
        />
      ) : isDone ? (
        <input
          type="checkbox"
          checked
          readOnly
          className={`w-4 h-4 rounded ${style.checkBorder} ${style.checkColor} shrink-0`}
        />
      ) : (
        <input
          type="checkbox"
          checked={false}
          readOnly
          className={`w-4 h-4 rounded ${style.checkBorder} shrink-0`}
        />
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Title + badges row */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className={
              isDone
                ? 'text-sm text-stone-400 line-through'
                : 'text-sm text-stone-800'
            }
          >
            {title}
          </span>

          {/* "Fait" label for all completed conditions */}
          {isDone && (
            <span className="text-xs text-emerald-600 font-medium">
              {t('conditions.done', 'Fait')}
            </span>
          )}

          {/* Pack name badge (indigo) — e.g. "Universal", "Finance NB" */}
          {condition.template?.pack && (
            <span className="px-1 py-0.5 rounded text-[10px] font-medium bg-indigo-100 text-indigo-700">
              {PACK_LABELS[condition.template.pack] ?? condition.template.pack}
            </span>
          )}

          {/* Source type badge (sky) */}
          {condition.sourceType && (
            <span className="px-1 py-0.5 rounded text-[10px] font-medium bg-sky-100 text-sky-700">
              {SOURCE_LABELS[condition.sourceType] ?? condition.sourceType}
            </span>
          )}

          {/* Template-generated badge (stone) */}
          {condition.templateId && (
            <span className="px-1 py-0.5 rounded text-[10px] font-medium bg-stone-100 text-stone-400">
              {t('conditions.generated', 'Générée')}
            </span>
          )}
        </div>

        {/* Countdown / resolution status */}
        {!isDone && daysUntil !== null && !condition.resolutionType && (
          <p className={`text-xs mt-0.5 ${
            isOverdue
              ? 'text-red-700 font-bold'
              : daysUntil <= 7
                ? 'text-emerald-600 font-medium'
                : 'text-amber-600'
          }`}>
            {isOverdue
              ? `EN RETARD ${daysUntil}j`
              : `dans ${daysUntil}j`}
          </p>
        )}

        {/* Resolution status (for read-only / archived) */}
        {(showResolution || condition.archived) && condition.resolutionType && (
          (() => {
            const config = RESOLUTION_CONFIG[condition.resolutionType]
            const Icon = config.icon
            return (
              <span className={`flex items-center gap-1 text-xs mt-0.5 ${config.colorClass}`}>
                <Icon className="w-3 h-3" />
                {t(config.labelKey)}
                {condition.resolutionNote && (
                  <span className="text-stone-400 ml-1">
                    — {condition.resolutionNote.slice(0, 50)}{condition.resolutionNote.length > 50 ? '...' : ''}
                  </span>
                )}
              </span>
            )
          })()
        )}

        {/* D41: Escape badge */}
        {isDone && condition.escapedWithoutProof && (
          <div className="mt-0.5">
            <EvidenceBadge
              escapedWithoutProof
              escapeReason={condition.escapeReason}
              compact
            />
          </div>
        )}
      </div>

      {/* FINTRAC CTA button — replaces edit for pending FINTRAC conditions */}
      {isFintrac && !isDone && !isArchived && onFintracClick ? (
        <button
          type="button"
          onClick={() => onFintracClick(condition)}
          className="shrink-0 px-2 py-1 rounded-md text-xs font-semibold text-red-700 bg-red-100 hover:bg-red-200 transition-colors flex items-center gap-1"
          data-testid={`fintrac-cta-${condition.id}`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          {t('fintrac.completeFintrac')}
        </button>
      ) : canEdit && (
        <button
          type="button"
          onClick={() => onEdit(condition)}
          className="shrink-0 p-1 rounded-md text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          aria-label={t('common.edit')}
          data-testid={`edit-condition-${condition.id}`}
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  )
}
