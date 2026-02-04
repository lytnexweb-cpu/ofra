import { useTranslation } from 'react-i18next'
import { Paperclip, AlertTriangle, FileText, Link as LinkIcon, StickyNote } from 'lucide-react'
import { Badge } from '../ui/Badge'
import type { ConditionEvidence } from '../../api/conditions.api'

interface EvidenceBadgeProps {
  /** Number of evidence items attached */
  evidenceCount?: number
  /** Whether condition was validated without proof */
  escapedWithoutProof?: boolean
  /** Escape reason if validated without proof */
  escapeReason?: string | null
  /** Single evidence item to display */
  evidence?: ConditionEvidence
  /** Compact mode for inline display */
  compact?: boolean
  /** Click handler for viewing evidence */
  onClick?: () => void
}

const EVIDENCE_TYPE_ICONS = {
  file: FileText,
  link: LinkIcon,
  note: StickyNote,
}

export default function EvidenceBadge({
  evidenceCount = 0,
  escapedWithoutProof = false,
  escapeReason,
  evidence,
  compact = false,
  onClick,
}: EvidenceBadgeProps) {
  const { t } = useTranslation()

  // Single evidence item display
  if (evidence) {
    const Icon = EVIDENCE_TYPE_ICONS[evidence.type] || FileText
    return (
      <button
        type="button"
        onClick={onClick}
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <Icon className="w-3 h-3" />
        <span className="truncate max-w-[120px]">
          {evidence.title || evidence.note?.slice(0, 30) || t(`validation.evidence.type.${evidence.type}`)}
        </span>
      </button>
    )
  }

  // Escaped without proof
  if (escapedWithoutProof) {
    return (
      <div className="flex flex-col gap-1">
        <Badge variant="warning" className="gap-1 text-[10px] px-1.5 py-0">
          <AlertTriangle className="w-3 h-3" />
          {t('validation.evidence.escapedBadge')}
        </Badge>
        {!compact && escapeReason && (
          <span className="text-[10px] text-muted-foreground italic line-clamp-1">
            {t('validation.evidence.escapedReason')}: {escapeReason}
          </span>
        )}
      </div>
    )
  }

  // Evidence count badge
  if (evidenceCount > 0) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="inline-flex items-center gap-1 text-xs text-success hover:underline"
      >
        <Paperclip className="w-3 h-3" />
        {t('validation.evidence.attached', { count: evidenceCount })}
      </button>
    )
  }

  // No evidence (only shown when compact is false)
  if (!compact) {
    return (
      <span className="text-[10px] text-muted-foreground">
        {t('validation.evidence.noEvidence')}
      </span>
    )
  }

  return null
}
