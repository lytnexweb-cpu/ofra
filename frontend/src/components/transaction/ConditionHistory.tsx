import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { conditionsApi, type ConditionEvent } from '../../api/conditions.api'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '../ui/Sheet'
import {
  Plus,
  Play,
  CheckCircle2,
  Archive,
  FileUp,
  FileX,
  StickyNote,
  ShieldAlert,
  RotateCcw,
  Pencil,
  Loader2,
  Lock,
} from 'lucide-react'
import { formatRelativeDate } from '../../lib/date'

interface ConditionHistoryProps {
  conditionId: number | null
  conditionTitle: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

const EVENT_CONFIG: Record<string, { icon: React.ElementType; color: string; labelKey: string }> = {
  created: { icon: Plus, color: 'text-blue-500 bg-blue-100', labelKey: 'conditionHistory.created' },
  started: { icon: Play, color: 'text-amber-500 bg-amber-100', labelKey: 'conditionHistory.started' },
  resolved: { icon: CheckCircle2, color: 'text-emerald-500 bg-emerald-100', labelKey: 'conditionHistory.resolved' },
  archived: { icon: Archive, color: 'text-stone-500 bg-stone-100', labelKey: 'conditionHistory.archived' },
  evidence_added: { icon: FileUp, color: 'text-violet-500 bg-violet-100', labelKey: 'conditionHistory.evidenceAdded' },
  evidence_removed: { icon: FileX, color: 'text-red-400 bg-red-100', labelKey: 'conditionHistory.evidenceRemoved' },
  note_added: { icon: StickyNote, color: 'text-sky-500 bg-sky-100', labelKey: 'conditionHistory.noteAdded' },
  level_changed_admin: { icon: ShieldAlert, color: 'text-orange-500 bg-orange-100', labelKey: 'conditionHistory.levelChanged' },
  unarchived_admin: { icon: RotateCcw, color: 'text-teal-500 bg-teal-100', labelKey: 'conditionHistory.unarchived' },
  condition_updated: { icon: Pencil, color: 'text-indigo-500 bg-indigo-100', labelKey: 'conditionHistory.updated' },
}

const DEFAULT_EVENT = { icon: Plus, color: 'text-stone-400 bg-stone-100', labelKey: 'conditionHistory.unknown' }

function EventMeta({ event, t }: { event: ConditionEvent; t: (key: string, opts?: Record<string, unknown>) => string }) {
  const meta = event.meta
  if (!meta || Object.keys(meta).length === 0) return null

  // condition_updated — show field changes
  if (event.eventType === 'condition_updated' && meta.changes) {
    const changes = meta.changes as Record<string, { from: unknown; to: unknown }>
    return (
      <div className="mt-1 space-y-0.5">
        {Object.entries(changes).map(([field, { from, to }]) => (
          <p key={field} className="text-[11px] text-stone-400">
            <span className="font-medium text-stone-500">{field}</span>
            {' : '}
            <span className="line-through">{String(from || '—')}</span>
            {' → '}
            <span className="text-stone-600">{String(to || '—')}</span>
          </p>
        ))}
      </div>
    )
  }

  // resolved — show resolution type
  if (event.eventType === 'resolved' && meta.resolutionType) {
    return (
      <p className="mt-0.5 text-[11px] text-stone-400">
        {t(`resolution.${meta.resolutionType}`)}
        {meta.resolutionNote && ` — ${meta.resolutionNote}`}
      </p>
    )
  }

  // evidence — show filename
  if ((event.eventType === 'evidence_added' || event.eventType === 'evidence_removed') && meta.fileName) {
    return (
      <p className="mt-0.5 text-[11px] text-stone-400 truncate">
        {meta.fileName}
      </p>
    )
  }

  // level_changed_admin — show old/new level
  if (event.eventType === 'level_changed_admin' && meta.from && meta.to) {
    return (
      <p className="mt-0.5 text-[11px] text-stone-400">
        {String(meta.from)} → {String(meta.to)}
      </p>
    )
  }

  return null
}

export default function ConditionHistory({ conditionId, conditionTitle, open, onOpenChange }: ConditionHistoryProps) {
  const { t } = useTranslation()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['condition-history', conditionId],
    queryFn: () => conditionsApi.getHistory(conditionId!),
    enabled: open && conditionId !== null,
    staleTime: 30_000,
  })

  const events = data?.data?.events ?? []

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-primary" />
            {t('conditionHistory.title')}
          </SheetTitle>
          <SheetDescription className="truncate">
            {conditionTitle}
          </SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        ) : isError ? (
          <div className="text-center py-8">
            <p className="text-sm text-stone-500">{t('conditionHistory.error')}</p>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-stone-400">{t('conditionHistory.empty')}</p>
          </div>
        ) : (
          <div className="relative pl-6">
            {/* Vertical line */}
            <div className="absolute left-[11px] top-2 bottom-2 w-px bg-stone-200" />

            <div className="space-y-5">
              {events.map((event) => {
                const config = EVENT_CONFIG[event.eventType] || DEFAULT_EVENT
                const Icon = config.icon
                const actor = event.actorId === 'system' ? t('conditionHistory.system') : t('conditionHistory.agent')

                return (
                  <div key={event.id} className="relative">
                    {/* Icon dot */}
                    <div className={`absolute -left-6 w-[22px] h-[22px] rounded-full flex items-center justify-center ${config.color}`}>
                      <Icon className="w-3 h-3" />
                    </div>

                    {/* Content */}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-stone-800">
                        {t(config.labelKey)}
                      </p>
                      <p className="text-xs text-stone-400 mt-0.5">
                        {actor} · {formatRelativeDate(event.createdAt)}
                      </p>
                      <EventMeta event={event} t={t} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
