import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  RefreshCw,
  X,
  Check,
  FileText,
  Eye,
  Download,
  CloudUpload,
  Plus,
} from 'lucide-react'
import { type TransactionDocument } from '../../api/documents.api'

interface DocumentVersionModalProps {
  isOpen: boolean
  onClose: () => void
  /** The current (latest) version of the document */
  document: TransactionDocument | null
  /** All previous versions (older), sorted desc by version */
  previousVersions: TransactionDocument[]
  /** Activity log entries derived from all versions */
  onReplace?: () => void
}

interface ActivityEntry {
  type: 'validated' | 'uploaded' | 'rejected' | 'added'
  user: string
  version: number
  date: string
  comment?: string
}

function formatSize(bytes: number | null): string {
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

function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr)
  const months = ['jan.', 'fév.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()} à ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

/** Build activity log from all versions (current + previous) */
function buildActivityLog(current: TransactionDocument, previous: TransactionDocument[]): ActivityEntry[] {
  const entries: ActivityEntry[] = []
  const allVersions = [current, ...previous]

  for (const doc of allVersions) {
    const user = doc.uploader?.firstName ?? '?'

    // If validated
    if (doc.status === 'validated' && doc.validatedAt) {
      entries.push({ type: 'validated', user, version: doc.version, date: doc.validatedAt })
    }

    // If rejected
    if (doc.status === 'rejected' && doc.validatedAt) {
      entries.push({
        type: 'rejected',
        user,
        version: doc.version,
        date: doc.validatedAt,
        comment: doc.rejectionReason ?? undefined,
      })
    }

    // Upload entry (replacement if version > 1)
    if (doc.version > 1) {
      entries.push({ type: 'uploaded', user, version: doc.version, date: doc.createdAt })
    } else {
      entries.push({ type: 'added', user, version: doc.version, date: doc.createdAt })
    }
  }

  // Sort by date desc
  entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  return entries
}

const STATUS_BADGE: Record<string, { label: string; classes: string }> = {
  validated: { label: 'Valide', classes: 'bg-emerald-100 text-emerald-700' },
  uploaded: { label: 'En attente', classes: 'bg-amber-100 text-amber-700' },
  rejected: { label: 'Refusée', classes: 'bg-red-100 text-red-600' },
}

export default function DocumentVersionModal({
  isOpen,
  onClose,
  document: doc,
  previousVersions,
  onReplace,
}: DocumentVersionModalProps) {
  const { t } = useTranslation()

  const handleClose = useCallback(() => {
    onClose()
  }, [onClose])

  if (!isOpen || !doc) return null

  const activityLog = buildActivityLog(doc, previousVersions)
  const nextVersion = doc.version + 1

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg mx-0 sm:mx-4 max-h-[92vh] sm:max-h-[calc(100%-2rem)] flex flex-col">
        {/* Mobile drag handle */}
        <div className="flex justify-center pt-2 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-stone-300" />
        </div>

        {/* Header */}
        <div className="px-5 sm:px-6 pt-5 sm:pt-6 pb-4 border-b border-stone-100">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                <RefreshCw className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-stone-900">
                  {t('documents.versionModal.title', 'Historique versions')}
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">{doc.name}</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 -mt-1 -mr-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto min-h-0 px-5 sm:px-6 py-4 space-y-4">
          {/* Current version */}
          <div>
            <h3 className="text-xs font-semibold text-stone-600 mb-2 uppercase tracking-wide">
              {t('documents.versionModal.currentVersion', 'Version actuelle')}
            </h3>
            <VersionCard doc={doc} isCurrent t={t} />
          </div>

          {/* Previous versions */}
          {previousVersions.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-stone-600 mb-2 uppercase tracking-wide">
                {t('documents.versionModal.previousVersions', 'Versions précédentes')}
              </h3>
              <div className="space-y-1.5">
                {previousVersions.map((prevDoc) => (
                  <VersionCard key={prevDoc.id} doc={prevDoc} isCurrent={false} t={t} />
                ))}
              </div>
            </div>
          )}

          {/* Activity log */}
          {activityLog.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-stone-600 mb-2 uppercase tracking-wide">
                {t('documents.versionModal.activityLog', "Journal d'activité")}
              </h3>
              <div className="space-y-2">
                {activityLog.map((entry, i) => (
                  <ActivityLogEntry key={i} entry={entry} t={t} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-4 bg-stone-50 border-t border-stone-100 flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2 sm:justify-end">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-100 text-sm font-medium text-center"
          >
            {t('documents.versionModal.close', 'Fermer')}
          </button>
          {onReplace && (
            <button
              type="button"
              onClick={onReplace}
              className="px-5 py-2.5 rounded-lg bg-[#1e3a5f] hover:bg-[#1e3a5f]/90 text-white text-sm font-semibold shadow-sm flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              {t('documents.versionModal.replace', 'Remplacer (uploader v{{version}})', { version: nextVersion })}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── Version Card ─── */

function VersionCard({
  doc,
  isCurrent,
  t,
}: {
  doc: TransactionDocument
  isCurrent: boolean
  t: (key: string, fallback?: string) => string
}) {
  const uploaderName = doc.uploader?.firstName ?? ''
  const meta = [
    doc.fileSize && formatSize(doc.fileSize),
    uploaderName && `Ajouté par ${uploaderName}`,
    formatShortDate(doc.createdAt),
  ]
    .filter(Boolean)
    .join(' · ')

  const statusBadge = STATUS_BADGE[doc.status]
  const versionLabel = isCurrent
    ? `v${doc.version} — ${t('documents.versionModal.active', 'Active')}`
    : `v${doc.version} — ${t('documents.versionModal.replaced', 'Remplacée')}`

  if (isCurrent) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
          <Check className="w-4 h-4 text-emerald-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm font-medium text-stone-900 truncate">{doc.name}</span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-700">
              {versionLabel}
            </span>
            {statusBadge && (
              <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium ${statusBadge.classes}`}>
                {t(`documents.status.${doc.status}`, statusBadge.label)}
              </span>
            )}
          </div>
          <p className="text-[10px] text-stone-400 mt-0.5">{meta}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {doc.fileUrl && (
            <>
              <a
                href={doc.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400"
              >
                <Eye className="w-4 h-4" />
              </a>
              <a
                href={doc.fileUrl}
                download
                className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400"
              >
                <Download className="w-4 h-4" />
              </a>
            </>
          )}
        </div>
      </div>
    )
  }

  // Previous version — stone, opacity-70
  return (
    <div className="rounded-lg border border-stone-200 bg-stone-50 p-3 flex items-center gap-3 opacity-70">
      <div className="w-9 h-9 rounded-lg bg-stone-100 flex items-center justify-center shrink-0">
        <FileText className="w-4 h-4 text-stone-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-sm font-medium text-stone-600 truncate">{doc.name}</span>
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-stone-200 text-stone-500">
            {versionLabel}
          </span>
          {statusBadge && (
            <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium ${statusBadge.classes}`}>
              {t(`documents.status.${doc.status}`, statusBadge.label)}
            </span>
          )}
        </div>
        <p className="text-[10px] text-stone-400 mt-0.5">{meta}</p>
      </div>
      {doc.fileUrl && (
        <a
          href={doc.fileUrl}
          download
          className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 shrink-0"
        >
          <Download className="w-4 h-4" />
        </a>
      )}
    </div>
  )
}

/* ─── Activity Log Entry ─── */

function ActivityLogEntry({
  entry,
  t,
}: {
  entry: ActivityEntry
  t: (key: string, fallback?: string) => string
}) {
  const iconMap = {
    validated: { bg: 'bg-emerald-100', icon: Check, color: 'text-emerald-600' },
    uploaded: { bg: 'bg-[#1e3a5f]/10', icon: CloudUpload, color: 'text-[#1e3a5f]' },
    rejected: { bg: 'bg-red-100', icon: X, color: 'text-red-500' },
    added: { bg: 'bg-stone-100', icon: Plus, color: 'text-stone-400' },
  }

  const config = iconMap[entry.type]
  const Icon = config.icon

  const actionMap: Record<string, string> = {
    validated: t('documents.versionModal.logValidated', 'a validé la v{{v}}', { v: String(entry.version) } as any),
    uploaded: t('documents.versionModal.logUploaded', 'a uploadé la v{{v}} (remplacement)', { v: String(entry.version) } as any),
    rejected: t('documents.versionModal.logRejected', 'a refusé la v{{v}}', { v: String(entry.version) } as any),
    added: t('documents.versionModal.logAdded', 'a ajouté la v{{v}}', { v: String(entry.version) } as any),
  }

  return (
    <div className="flex items-start gap-2.5 px-2">
      <div className={`w-5 h-5 rounded-full ${config.bg} flex items-center justify-center shrink-0 mt-0.5`}>
        <Icon className={`w-2.5 h-2.5 ${config.color}`} />
      </div>
      <div>
        <p className="text-xs text-stone-700">
          <strong>{entry.user}</strong> {actionMap[entry.type]}
        </p>
        <p className="text-[10px] text-stone-400">
          {formatDateTime(entry.date)}
          {entry.comment && ` · « ${entry.comment} »`}
        </p>
      </div>
    </div>
  )
}
