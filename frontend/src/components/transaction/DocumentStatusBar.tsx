import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { FileCheck, Clock, AlertTriangle, FileText } from 'lucide-react'
import { conditionsApi } from '../../api/conditions.api'

export type DocumentFilter = 'all' | 'validated' | 'pending' | 'missing'

interface DocumentStatusBarProps {
  transactionId: number
  onBadgeClick: (filter: DocumentFilter) => void
}

export default function DocumentStatusBar({ transactionId, onBadgeClick }: DocumentStatusBarProps) {
  const { t } = useTranslation()

  const { data } = useQuery({
    queryKey: ['conditions', 'active', transactionId],
    queryFn: () => conditionsApi.getActive(transactionId),
  })

  const conditions = data?.data?.conditions ?? []

  const completed = conditions.filter((c) => c.status === 'completed').length
  const inProgress = conditions.filter((c) => c.status === 'in_progress').length
  const pending = conditions.filter((c) => c.status === 'pending').length
  const total = conditions.length

  if (total === 0) return null

  const badges: { key: DocumentFilter; count: number; label: string; icon: typeof FileCheck; classes: string; dotColor: string }[] = [
    {
      key: 'validated',
      count: completed,
      label: t('documents.statusBar.validated', 'Validées'),
      icon: FileCheck,
      classes: 'hover:bg-emerald-50',
      dotColor: 'bg-emerald-500',
    },
    {
      key: 'pending',
      count: inProgress,
      label: t('documents.statusBar.pending', 'En attente'),
      icon: Clock,
      classes: 'hover:bg-amber-50',
      dotColor: 'bg-amber-500',
    },
    {
      key: 'missing',
      count: pending,
      label: t('documents.statusBar.missing', 'Manquantes'),
      icon: AlertTriangle,
      classes: 'hover:bg-red-50',
      dotColor: 'bg-red-500',
    },
  ]

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-3">
      <div
        role="button"
        tabIndex={0}
        onClick={() => onBadgeClick('all')}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onBadgeClick('all') } }}
        className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 flex items-center gap-4 hover:border-stone-300 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2 text-stone-600">
          <FileText className="w-4 h-4" />
          <span className="text-sm font-medium">
            {t('documents.statusBar.conditions', 'Conditions')}
          </span>
          <span className="text-xs text-stone-400">({total})</span>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-3">
          {badges.map((badge) => (
            <button
              key={badge.key}
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onBadgeClick(badge.key)
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors ${badge.classes}`}
            >
              <span className={`w-2 h-2 rounded-full ${badge.dotColor}`} />
              <span className="text-xs font-semibold text-stone-700">{badge.count}</span>
              <span className="text-xs text-stone-500 hidden sm:inline">{badge.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
