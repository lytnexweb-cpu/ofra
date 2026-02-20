import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import {
  FileText,
  Plus,
  Download,
  Eye,
  Search,
  DollarSign,
  User,
  FolderOpen,
  Clock,
  AlertTriangle,
  Check,
} from 'lucide-react'
import {
  documentsApi,
  type TransactionDocument,
  type DocumentCategory,
} from '../../api/documents.api'

import type { DocumentFilter } from './DocumentStatusBar'

interface DocumentsSectionProps {
  transactionId: number
  transactionLabel?: string
  onUpload?: () => void
  onViewProof?: (doc: TransactionDocument) => void
  onViewVersions?: (doc: TransactionDocument) => void
  /** Pre-filter documents by status when opened from StatusBar */
  initialFilter?: DocumentFilter
  /** Compact mode (no outer bg/padding wrapper) for use inside drawer */
  compact?: boolean
}

const CATEGORIES: { key: DocumentCategory; icon: typeof FileText; color: string }[] = [
  { key: 'offer', icon: FileText, color: 'blue' },
  { key: 'inspection', icon: Search, color: 'amber' },
  { key: 'financing', icon: DollarSign, color: 'emerald' },
  { key: 'identity', icon: User, color: 'violet' },
  { key: 'legal', icon: FileText, color: 'indigo' },
  { key: 'other', icon: FolderOpen, color: 'stone' },
]

const STATUS_BADGE: Record<string, { label: string; classes: string }> = {
  validated: { label: 'Valide', classes: 'bg-emerald-100 text-emerald-700' },
  uploaded: { label: 'En attente', classes: 'bg-amber-100 text-amber-700' },
  missing: { label: 'Manquant', classes: 'bg-red-100 text-red-700' },
  rejected: { label: 'Refusé', classes: 'bg-red-100 text-red-600' },
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr)
  const months = ['jan.', 'fév.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
}

export default function DocumentsSection({
  transactionId,
  transactionLabel,
  onUpload,
  onViewProof,
  onViewVersions,
  initialFilter = 'all',
  compact = false,
}: DocumentsSectionProps) {
  const { t } = useTranslation()

  const { data, isLoading } = useQuery({
    queryKey: ['documents', transactionId],
    queryFn: () => documentsApi.list(transactionId),
  })

  const documents = data?.data?.documents ?? []

  // Counters
  const counts = useMemo(() => {
    const total = documents.length
    const validated = documents.filter((d) => d.status === 'validated').length
    const pending = documents.filter((d) => d.status === 'uploaded').length
    const missing = documents.filter((d) => d.status === 'missing').length
    return { total, validated, pending, missing }
  }, [documents])

  // Filter documents based on initialFilter
  const filtered = useMemo(() => {
    if (initialFilter === 'all') return documents
    const statusMap: Record<string, string[]> = {
      validated: ['validated'],
      pending: ['uploaded'],
      missing: ['missing'],
    }
    const statuses = statusMap[initialFilter] ?? []
    return documents.filter((d) => statuses.includes(d.status))
  }, [documents, initialFilter])

  // Group by category — show all categories even if empty
  const grouped = useMemo(() => {
    return CATEGORIES.map((cat) => ({
      ...cat,
      docs: filtered.filter((d) => d.category === cat.key),
    }))
  }, [filtered])

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-lg bg-stone-100 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={compact ? '' : 'bg-stone-50 min-h-[80vh]'}>
      <div className={compact ? 'py-4' : 'max-w-4xl mx-auto p-4 sm:p-6 lg:p-8'}>
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-stone-400" />
              {t('documents.title', 'Documents')}
            </h2>
            {transactionLabel && (
              <p className="text-xs text-stone-500 mt-0.5">{transactionLabel}</p>
            )}
          </div>
          <button
            onClick={onUpload}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-[#1e3a5f] hover:bg-[#1e3a5f]/90 rounded-lg shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            {t('documents.add', 'Ajouter un document')}
          </button>
        </div>

        {/* Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
          <CounterCard value={counts.total} label={t('documents.counters.total', 'Total')} />
          <CounterCard
            value={counts.validated}
            label={t('documents.counters.validated', 'Valides')}
            color="emerald"
          />
          <CounterCard
            value={counts.pending}
            label={t('documents.counters.pending', 'En attente')}
            color="amber"
          />
          <CounterCard
            value={counts.missing}
            label={t('documents.counters.missing', 'Manquants')}
            color="red"
            bold
          />
        </div>

        {/* Categories */}
        {grouped.map((group) => (
          <CategoryGroup
            key={group.key}
            category={group.key}
            icon={group.icon}
            color={group.color}
            docs={group.docs}
            t={t}
            onUpload={onUpload}
            onViewProof={onViewProof}
            onViewVersions={onViewVersions}
          />
        ))}
      </div>
    </div>
  )
}

/* ─── Counter Card ─── */

function CounterCard({
  value,
  label,
  color,
  bold,
}: {
  value: number
  label: string
  color?: 'emerald' | 'amber' | 'red'
  bold?: boolean
}) {
  const colorMap = {
    emerald: { bg: 'bg-emerald-50 border-emerald-200', value: 'text-emerald-700', label: 'text-emerald-600' },
    amber: { bg: 'bg-amber-50 border-amber-200', value: 'text-amber-700', label: 'text-amber-600' },
    red: { bg: 'bg-red-50 border-red-200', value: 'text-red-700', label: 'text-red-600' },
  }
  const c = color ? colorMap[color] : { bg: 'bg-white border-stone-200', value: 'text-stone-900', label: 'text-stone-500' }

  return (
    <div className={`rounded-lg border p-3 text-center ${c.bg}`}>
      <p className={`text-lg font-bold ${c.value}`}>{value}</p>
      <p className={`text-[11px] uppercase tracking-wide ${bold ? 'font-semibold' : ''} ${c.label}`}>{label}</p>
    </div>
  )
}

/* ─── Category Group ─── */

function CategoryGroup({
  category,
  icon: Icon,
  color,
  docs,
  t,
  onUpload,
  onViewProof,
  onViewVersions,
}: {
  category: DocumentCategory
  icon: typeof FileText
  color: string
  docs: TransactionDocument[]
  t: (key: string, fallback?: string) => string
  onUpload?: () => void
  onViewProof?: (doc: TransactionDocument) => void
  onViewVersions?: (doc: TransactionDocument) => void
}) {
  const iconColorMap: Record<string, string> = {
    blue: 'text-blue-500',
    amber: 'text-amber-500',
    emerald: 'text-emerald-500',
    violet: 'text-violet-500',
    indigo: 'text-indigo-500',
    stone: 'text-stone-400',
  }

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${iconColorMap[color] ?? 'text-stone-400'}`} />
        <span className="text-xs font-semibold text-stone-700 uppercase tracking-wide">
          {t(`documents.categories.${category}`, category)}
        </span>
        <span className="text-xs text-stone-400">({docs.length})</span>
      </div>

      {docs.length === 0 ? (
        <p className="text-xs text-stone-400 italic ml-6">
          {t('documents.emptyCategory', 'Aucun document dans cette catégorie.')}
        </p>
      ) : (
        <div className="space-y-1.5">
          {docs.map((doc) => (
            <DocumentCard
              key={doc.id}
              doc={doc}
              categoryColor={color}
              t={t}
              onUpload={onUpload}
              onViewProof={onViewProof}
              onViewVersions={onViewVersions}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── Document Card ─── */

function DocumentCard({
  doc,
  categoryColor,
  t,
  onUpload,
  onViewProof,
  onViewVersions,
}: {
  doc: TransactionDocument
  categoryColor: string
  t: (key: string, fallback?: string) => string
  onUpload?: () => void
  onViewProof?: (doc: TransactionDocument) => void
  onViewVersions?: (doc: TransactionDocument) => void
}) {
  const isMissing = doc.status === 'missing'
  const isUploaded = doc.status === 'uploaded'
  const isValidated = doc.status === 'validated'

  const iconBgMap: Record<string, string> = {
    blue: 'bg-blue-50',
    amber: 'bg-amber-50',
    emerald: 'bg-emerald-50',
    violet: 'bg-violet-50',
    indigo: 'bg-indigo-50',
    stone: 'bg-stone-100',
  }
  const iconColorMap: Record<string, string> = {
    blue: 'text-blue-500',
    amber: 'text-amber-500',
    emerald: 'text-emerald-500',
    violet: 'text-violet-500',
    indigo: 'text-indigo-500',
    stone: 'text-stone-400',
  }

  // Missing → dashed red border
  if (isMissing) {
    return (
      <div className="rounded-lg border border-dashed border-red-200 bg-red-50/30 p-3 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
          <AlertTriangle className="w-4 h-4 text-red-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm font-medium text-red-800">{doc.name}</span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-700">
              {t('documents.status.missing', 'Manquant')}
            </span>
            {doc.condition?.isBlocking && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-600">
                {t('documents.blocking', 'Bloquante')}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 mt-0.5 flex-wrap">
            <span className="text-[10px] text-red-600 font-medium">
              {t('documents.proofRequired', 'Preuve requise : OUI')}
            </span>
            {doc.condition?.dueDate && (
              <span className="text-[10px] text-stone-400">· {t('documents.deadline', 'Échéance')} {formatShortDate(doc.condition.dueDate)}</span>
            )}
            {doc.condition && (
              <span className="text-[10px] text-stone-400">· → {doc.condition.title}</span>
            )}
          </div>
        </div>
        <button
          onClick={onUpload}
          className="px-2.5 py-1.5 text-xs font-medium text-white bg-[#1e3a5f] hover:bg-[#1e3a5f]/90 rounded-lg shrink-0"
        >
          {t('documents.upload', 'Uploader')}
        </button>
      </div>
    )
  }

  // Uploaded → amber border
  const borderClass = isUploaded
    ? 'border-amber-200 bg-amber-50/30'
    : isValidated
      ? 'border-stone-200 bg-white'
      : 'border-stone-200 bg-white'

  // Validated with special emerald border for financing-type validated docs
  const validatedBorder = isValidated && categoryColor === 'emerald' ? 'border-emerald-200 bg-white' : borderClass

  const statusBadge = STATUS_BADGE[doc.status]
  const uploaderName = doc.uploader ? `${doc.uploader.firstName}` : ''
  const meta = [
    uploaderName && `Ajouté par ${uploaderName}`,
    formatShortDate(doc.createdAt),
    doc.fileSize && formatFileSize(doc.fileSize),
  ]
    .filter(Boolean)
    .join(' · ')

  // Icon for status
  const getStatusIcon = () => {
    if (isUploaded) return <Clock className={`w-4 h-4 text-amber-500`} />
    if (isValidated) return <Check className={`w-4 h-4 text-emerald-500`} />
    return <FileText className={`w-4 h-4 ${iconColorMap[categoryColor] ?? 'text-stone-400'}`} />
  }

  const getIconBg = () => {
    if (isUploaded) return 'bg-amber-50'
    if (isValidated) return 'bg-emerald-50'
    return iconBgMap[categoryColor] ?? 'bg-stone-100'
  }

  return (
    <div
      className={`rounded-lg border p-3 flex items-center gap-3 transition-all hover:border-stone-300 ${validatedBorder}`}
    >
      <div className={`w-9 h-9 rounded-lg ${getIconBg()} flex items-center justify-center shrink-0`}>
        {getStatusIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-sm font-medium text-stone-800 truncate">{doc.name}</span>
          {statusBadge && (
            <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium ${statusBadge.classes}`}>
              {t(`documents.status.${doc.status}`, statusBadge.label)}
            </span>
          )}
          {doc.conditionId && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-100 text-indigo-700">
              {t('documents.proofAttached', 'Preuve jointe')}
            </span>
          )}
          {doc.version > 1 && (
            <button
              onClick={() => onViewVersions?.(doc)}
              className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-stone-100 text-stone-500 hover:bg-stone-200 transition-colors"
            >
              v{doc.version}
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <p className="text-[10px] text-stone-400">{meta}</p>
          {doc.condition && (
            <span className="text-[10px] text-[#1e3a5f] font-medium">→ {doc.condition.title}</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {doc.conditionId && onViewProof && (
          <button
            onClick={() => onViewProof(doc)}
            className="p-2.5 rounded-lg hover:bg-stone-100 text-stone-400"
            title={t('documents.viewProof', 'Voir la preuve')}
          >
            <Eye className="w-4 h-4" />
          </button>
        )}
        {doc.fileUrl && (
          <a
            href={doc.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 rounded-lg hover:bg-stone-100 text-stone-400"
            title={t('documents.download', 'Télécharger')}
          >
            <Download className="w-4 h-4" />
          </a>
        )}
      </div>
    </div>
  )
}
