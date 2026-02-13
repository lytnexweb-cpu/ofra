import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Shield, X, Check, FileText, Eye, Download, CloudUpload } from 'lucide-react'
import { documentsApi, type TransactionDocument } from '../../api/documents.api'
import { toast } from '../../hooks/use-toast'

interface DocumentProofModalProps {
  isOpen: boolean
  onClose: () => void
  document: TransactionDocument | null
  transactionId: number
  /** Current step order for "Étape N" display */
  stepOrder?: number
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

export default function DocumentProofModal({
  isOpen,
  onClose,
  document: doc,
  transactionId,
  stepOrder,
}: DocumentProofModalProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [comment, setComment] = useState('')

  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['documents', transactionId] })
    queryClient.invalidateQueries({ queryKey: ['transaction', transactionId] })
    queryClient.invalidateQueries({ queryKey: ['advance-check', transactionId] })
  }, [queryClient, transactionId])

  const validateMutation = useMutation({
    mutationFn: (id: number) => documentsApi.validate(id),
    onSuccess: () => {
      toast({ title: t('documents.validated', 'Document validé'), variant: 'success' })
      invalidateAll()
      resetAndClose()
    },
    onError: () => {
      toast({ title: t('common.error'), variant: 'destructive' })
    },
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => documentsApi.reject(id, reason),
    onSuccess: () => {
      toast({ title: t('documents.rejected', 'Document rejeté'), variant: 'success' })
      invalidateAll()
      resetAndClose()
    },
    onError: () => {
      toast({ title: t('common.error'), variant: 'destructive' })
    },
  })

  const isLoading = validateMutation.isPending || rejectMutation.isPending

  const resetAndClose = useCallback(() => {
    setComment('')
    onClose()
  }, [onClose])

  const handleClose = useCallback(() => {
    if (isLoading) return
    resetAndClose()
  }, [isLoading, resetAndClose])

  if (!isOpen || !doc) return null

  const conditionTitle = doc.condition?.title ?? doc.name
  const conditionLevel = doc.condition?.level ?? (doc.condition?.isBlocking ? 'blocking' : 'required')
  const isUploaded = doc.status === 'uploaded'
  const isValidated = doc.status === 'validated'
  const isRejected = doc.status === 'rejected'

  const levelBadge =
    conditionLevel === 'blocking'
      ? { classes: 'bg-red-100 text-red-700', label: t('resolveCondition.level.blocking', 'Bloquante') }
      : conditionLevel === 'required'
        ? { classes: 'bg-amber-100 text-amber-700', label: t('resolveCondition.level.required', 'Requise') }
        : { classes: 'bg-stone-200 text-stone-600', label: t('resolveCondition.level.recommended', 'Recommandée') }

  // Lifecycle steps
  const steps = [
    {
      done: true,
      active: false,
      label: t('documents.proofModal.stepMissing', 'Manquant'),
      desc: t('documents.proofModal.stepMissingDesc', 'Condition créée — preuve requise'),
    },
    {
      done: isValidated || isRejected,
      active: isUploaded,
      label: t('documents.proofModal.stepUploaded', 'Uploadé — en attente de validation'),
      desc: doc.uploader
        ? `Ajouté par ${doc.uploader.firstName} — ${formatShortDate(doc.createdAt)}`
        : formatShortDate(doc.createdAt),
    },
    {
      done: isValidated || isRejected,
      active: false,
      future: isUploaded,
      label: t('documents.proofModal.stepValidated', 'Validé / Refusé'),
      desc: isValidated || isRejected
        ? `${isValidated ? 'Validé' : 'Refusé'} — ${doc.validatedAt ? formatShortDate(doc.validatedAt) : ''}`
        : t('documents.proofModal.stepPending', 'En attente de validation'),
    },
  ]

  const mimeShort = doc.mimeType?.split('/').pop()?.toUpperCase() ?? ''

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
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-stone-900">
                  {t('documents.proofModal.title', 'Preuve')} — {conditionTitle}
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  {levelBadge.label} — {t('documents.proofModal.subtitleStep', 'Étape {{step}}', { step: stepOrder ?? '?' })}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 -mt-1 -mr-1"
              disabled={isLoading}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto min-h-0 px-5 sm:px-6 py-4 space-y-4">
          {/* Condition info */}
          <div className="rounded-lg bg-stone-50 border border-stone-200 p-3">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${levelBadge.classes}`}>
                {levelBadge.label}
              </span>
              {doc.condition?.sourceType && (
                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                  doc.condition.sourceType === 'industry' ? 'bg-sky-100 text-sky-700'
                  : doc.condition.sourceType === 'legal' || doc.condition.sourceType === 'government' ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-stone-100 text-stone-600'
                }`}>
                  {doc.condition.sourceType === 'legal' ? 'Légal' : doc.condition.sourceType === 'government' ? 'Gouvernement' : doc.condition.sourceType === 'industry' ? 'Industry' : 'Best practice'}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-stone-900">{conditionTitle}</span>
              <span className="text-xs font-semibold text-red-600">
                {t('documents.proofModal.proofRequiredYes', 'Preuve requise : OUI')}
              </span>
            </div>
          </div>

          {/* Lifecycle */}
          <div>
            <h3 className="text-xs font-semibold text-stone-600 mb-2 uppercase tracking-wide">
              {t('documents.proofModal.lifecycle', 'Cycle de vie du document')}
            </h3>
            <div className="space-y-0">
              {steps.map((step, i) => {
                const isLast = i === steps.length - 1
                return (
                  <div key={i} className={`flex gap-3 ${step.future ? 'opacity-40' : ''}`}>
                    <div className="flex flex-col items-center">
                      {step.active ? (
                        <div className="w-6 h-6 rounded-full bg-[#1e3a5f] flex items-center justify-center shrink-0 ring-2 ring-[#1e3a5f]/20">
                          <CloudUpload className="w-3 h-3 text-white" />
                        </div>
                      ) : step.done ? (
                        <div className="w-6 h-6 rounded-full bg-stone-300 flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full border-2 border-stone-300 flex items-center justify-center shrink-0">
                          <span className="text-[8px] font-bold text-stone-400">?</span>
                        </div>
                      )}
                      {!isLast && <div className="w-0.5 flex-1 bg-stone-200 min-h-[16px]" />}
                    </div>
                    <div className="pb-3">
                      <span className={`text-xs font-medium ${
                        step.active ? 'font-semibold text-[#1e3a5f]'
                        : step.done && !step.active ? 'text-stone-500 line-through'
                        : 'text-stone-500'
                      }`}>
                        {step.label}
                      </span>
                      <p className="text-[10px] text-stone-400">{step.desc}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Current document */}
          {doc.fileUrl && (
            <div className="rounded-lg border border-[#1e3a5f]/20 bg-[#1e3a5f]/5 p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#1e3a5f]/10 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4 text-[#1e3a5f]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-stone-900 truncate">{doc.name}</p>
                <p className="text-[10px] text-stone-400">
                  {formatSize(doc.fileSize)} {mimeShort && `· ${mimeShort}`}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <a
                  href={doc.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg hover:bg-white/50 text-[#1e3a5f]"
                >
                  <Eye className="w-4 h-4" />
                </a>
                <a
                  href={doc.fileUrl}
                  download
                  className="p-1.5 rounded-lg hover:bg-white/50 text-[#1e3a5f]"
                >
                  <Download className="w-4 h-4" />
                </a>
              </div>
            </div>
          )}

          {/* Validation comment */}
          {isUploaded && (
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">
                {t('documents.proofModal.commentLabel', 'Commentaire de validation (optionnel)')}
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={2}
                placeholder={t('documents.proofModal.commentPlaceholder', 'Ex : Résultats conformes, document accepté...')}
                className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 resize-none"
                disabled={isLoading}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-4 bg-stone-50 border-t border-stone-100 flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2 sm:justify-end">
          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-100 text-sm font-medium text-center"
          >
            {t('documents.proofModal.close', 'Fermer')}
          </button>

          {isUploaded && (
            <>
              <button
                type="button"
                onClick={() => rejectMutation.mutate({ id: doc.id, reason: comment.trim() || 'Refusé' })}
                disabled={isLoading}
                className="px-4 py-2.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-sm font-medium flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" />
                {t('documents.proofModal.refuse', 'Refuser')}
              </button>
              <button
                type="button"
                onClick={() => validateMutation.mutate(doc.id)}
                disabled={isLoading}
                className="px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold shadow-sm flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full inline-block" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                {t('documents.proofModal.validateBtn', 'Valider')}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
