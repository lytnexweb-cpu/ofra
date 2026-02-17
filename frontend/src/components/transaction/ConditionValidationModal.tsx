import { useState, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Lock, AlertTriangle, Info, X, Check, Calendar, Clock, Zap } from 'lucide-react'
import EvidenceUploader, { type SelectedFile } from './EvidenceUploader'
import { conditionsApi, type Condition, type ConditionLevel, type ResolutionType } from '../../api/conditions.api'
import { toast } from '../../hooks/use-toast'
import { formatDate, differenceInDays } from '../../lib/date'
import { useSubscription } from '../../hooks/useSubscription'
import UpgradePrompt from '../ui/UpgradePrompt'

interface ConditionValidationModalProps {
  condition: Condition
  transactionId: number
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  stepName?: string
}

const MIN_ESCAPE_LENGTH = 10

const LEVEL_BADGE: Record<ConditionLevel, { label: string; classes: string }> = {
  blocking: { label: 'blocking', classes: 'bg-red-100 text-red-700' },
  required: { label: 'required', classes: 'bg-amber-100 text-amber-700' },
  recommended: { label: 'recommended', classes: 'bg-stone-200 text-stone-600' },
}

// Fix #12/#15: match maquette icon bg exactly (recommended = bg-stone-100)
const LEVEL_HEADER: Record<ConditionLevel, { icon: React.ElementType; bg: string; iconColor: string }> = {
  blocking: { icon: Lock, bg: 'bg-red-100', iconColor: 'text-red-600' },
  required: { icon: AlertTriangle, bg: 'bg-amber-100', iconColor: 'text-amber-600' },
  recommended: { icon: Info, bg: 'bg-stone-100', iconColor: 'text-stone-500' },
}

const PACK_LABELS: Record<string, string> = {
  universal: 'Universal',
  rural_nb: 'Rural NB',
  condo_nb: 'Condo NB',
  finance_nb: 'Finance NB',
}

const SOURCE_LABELS: Record<string, string> = {
  legal: 'Legal',
  government: 'Government',
  industry: 'Industry',
  best_practice: 'Best practice',
}

export default function ConditionValidationModal({
  condition,
  transactionId,
  isOpen,
  onClose,
  onSuccess,
  stepName,
}: ConditionValidationModalProps) {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  const { meetsMinimum } = useSubscription()
  const canUseEvidence = meetsMinimum('pro')

  const [resolutionType, setResolutionType] = useState<ResolutionType>('completed')
  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null)
  const [note, setNote] = useState('')
  const [escapeReason, setEscapeReason] = useState('')
  const [escapeChecked, setEscapeChecked] = useState(false)

  const level: ConditionLevel = condition.level || (condition.isBlocking ? 'blocking' : 'recommended')
  const isBlocking = level === 'blocking'
  const isRequired = level === 'required'
  const isRecommended = level === 'recommended'

  const title = useMemo(() => {
    if (i18n.language === 'fr' && condition.labelFr) return condition.labelFr
    if (i18n.language === 'en' && condition.labelEn) return condition.labelEn
    return condition.title
  }, [condition, i18n.language])

  const daysUntil = condition.dueDate
    ? differenceInDays(new Date(condition.dueDate), new Date())
    : null

  const noteRequired = isRequired && ['waived', 'not_applicable', 'skipped_with_risk'].includes(resolutionType)
  const showD41Escape = isBlocking && !selectedFile

  const uploadMutation = useMutation({
    mutationFn: (file: File) => conditionsApi.uploadEvidence(condition.id, file),
  })

  const resolveMutation = useMutation({
    mutationFn: async (params: {
      hasEvidence: boolean
      evidenceId?: number
      escapedWithoutProof?: boolean
      escapeReason?: string
    }) => {
      return conditionsApi.resolve(condition.id, {
        resolutionType,
        note: note.trim() || undefined,
        hasEvidence: params.hasEvidence,
        evidenceId: params.evidenceId,
        escapedWithoutProof: params.escapedWithoutProof,
        escapeReason: params.escapeReason,
      })
    },
    onSuccess: (response) => {
      if (!response.success) {
        toast({ title: t('resolveCondition.error'), description: response.error?.message, variant: 'destructive' })
        return
      }
      queryClient.refetchQueries({ queryKey: ['transaction', transactionId] })
      queryClient.invalidateQueries({ queryKey: ['conditions', 'active', transactionId] })
      queryClient.invalidateQueries({ queryKey: ['advance-check', transactionId] })
      toast({ title: t('resolveCondition.success'), variant: 'success' })
      resetAndClose()
      onSuccess?.()
    },
    onError: () => {
      toast({ title: t('resolveCondition.error'), variant: 'destructive' })
    },
  })

  const isLoading = uploadMutation.isPending || resolveMutation.isPending

  const canConfirm = useMemo(() => {
    if (isLoading) return false
    if (isBlocking) {
      if (selectedFile) return true
      return escapeReason.trim().length >= MIN_ESCAPE_LENGTH && escapeChecked
    }
    if (isRequired && noteRequired && !note.trim()) return false
    return true
  }, [isLoading, isBlocking, isRequired, selectedFile, escapeReason, escapeChecked, noteRequired, note])

  const resetAndClose = useCallback(() => {
    setResolutionType('completed')
    setSelectedFile(null)
    setNote('')
    setEscapeReason('')
    setEscapeChecked(false)
    onClose()
  }, [onClose])

  const handleClose = useCallback(() => {
    if (isLoading) return
    resetAndClose()
  }, [isLoading, resetAndClose])

  const handleConfirm = useCallback(async () => {
    if (!canConfirm || isLoading) return

    let evidenceId: number | undefined
    if (selectedFile) {
      try {
        const result = await uploadMutation.mutateAsync(selectedFile.file)
        evidenceId = result.data?.evidence.id
      } catch {
        return
      }
    }

    await resolveMutation.mutateAsync({
      hasEvidence: !!selectedFile,
      evidenceId,
      escapedWithoutProof: isBlocking && !selectedFile ? true : undefined,
      escapeReason: isBlocking && !selectedFile ? escapeReason.trim() : undefined,
    })
  }, [canConfirm, isLoading, selectedFile, isBlocking, escapeReason, uploadMutation, resolveMutation])

  if (!isOpen) return null

  const headerConfig = LEVEL_HEADER[level]
  const HeaderIcon = headerConfig.icon
  const badgeConfig = LEVEL_BADGE[level]
  const escapeRemaining = Math.max(0, MIN_ESCAPE_LENGTH - escapeReason.trim().length)

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg mx-0 sm:mx-4 max-h-[92vh] sm:max-h-[calc(100%-2rem)] flex flex-col">
        {/* Mobile drag handle */}
        <div className="flex justify-center pt-2 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-stone-300" />
        </div>

        {/* Header — Fix #2: text-xs subtitle, Fix #3: border-stone-100 */}
        <div className="px-5 sm:px-6 pt-5 sm:pt-6 pb-4 border-b border-stone-100">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full ${headerConfig.bg} flex items-center justify-center shrink-0`}>
                <HeaderIcon className={`w-5 h-5 ${headerConfig.iconColor}`} />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-stone-900">
                  {t('resolveCondition.title')}
                </h2>
                {stepName && (
                  <p className="text-xs text-stone-500 mt-0.5">{stepName}</p>
                )}
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

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto min-h-0 px-5 sm:px-6 py-4 space-y-4">
          {/* Condition info card */}
          <div className="rounded-lg bg-stone-50 border border-stone-200 p-3 sm:p-4">
            {/* Badges — Fix #1: rounded-full for level badge */}
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${badgeConfig.classes}`}>
                {t(`resolveCondition.level.${badgeConfig.label}`)}
              </span>
              {condition.template?.pack && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-700">
                  {PACK_LABELS[condition.template.pack] ?? condition.template.pack}
                </span>
              )}
              {condition.sourceType && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-sky-100 text-sky-700">
                  {SOURCE_LABELS[condition.sourceType] ?? condition.sourceType}
                </span>
              )}
              {condition.templateId && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-stone-100 text-stone-400">
                  {t('conditions.generated')}
                </span>
              )}
            </div>

            <h3 className="text-sm font-semibold text-stone-900 mb-1">{title}</h3>

            {condition.dueDate && (
              <div className="flex items-center gap-3 text-xs text-stone-500">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {t('resolveCondition.dueDate')}: {formatDate(condition.dueDate, 'd MMM yyyy')}
                </span>
                {daysUntil !== null && (
                  <span className={`flex items-center gap-1 font-medium ${
                    daysUntil < 0 ? 'text-red-500' : isBlocking ? 'text-red-500' : isRequired ? 'text-amber-500' : 'text-stone-500'
                  }`}>
                    <Clock className="w-3.5 h-3.5" />
                    {daysUntil < 0
                      ? t('resolveCondition.overdue', { days: Math.abs(daysUntil) })
                      : t('resolveCondition.daysLeft', { days: daysUntil })}
                  </span>
                )}
              </div>
            )}

            {/* Auto-archive note (recommended only) */}
            {isRecommended && (
              <div className="mt-2 pt-2 border-t border-stone-200">
                <p className="text-xs text-stone-400 italic flex items-center gap-1">
                  <Info className="w-3 h-3 shrink-0" />
                  {t('resolveCondition.autoArchiveNote')}
                </p>
              </div>
            )}
          </div>

          {/* Quick action hint (recommended) — Fix #11: primary colors, Zap icon */}
          {isRecommended && (
            <div className="rounded-lg bg-[#1e3a5f]/5 border border-[#1e3a5f]/10 px-3 py-2 flex items-start gap-2">
              <Zap className="w-4 h-4 text-[#1e3a5f] mt-0.5 shrink-0" />
              <p className="text-xs text-[#1e3a5f]/80">
                {t('resolveCondition.quickActionHint')}
              </p>
            </div>
          )}

          {/* Resolution type — Fix #5: section label matches maquette */}
          <div>
            <h3 className="text-xs font-semibold text-stone-600 mb-2 uppercase tracking-wide">
              {t('resolveCondition.resolutionTypeLabel')}
            </h3>
            <div className="space-y-2">
              <ResolutionCard
                type="completed"
                selected={resolutionType === 'completed'}
                onSelect={() => setResolutionType('completed')}
                label={t('resolveCondition.types.completed')}
                description={t('resolveCondition.types.completedDesc')}
              />
              <ResolutionCard
                type="waived"
                selected={resolutionType === 'waived'}
                onSelect={() => setResolutionType('waived')}
                label={t('resolveCondition.types.waived')}
                description={t('resolveCondition.types.waivedDesc')}
                hint={isRequired ? t('resolveCondition.noteHint.waived') : undefined}
                hintColor="amber"
              />
              <ResolutionCard
                type="not_applicable"
                selected={resolutionType === 'not_applicable'}
                onSelect={() => setResolutionType('not_applicable')}
                label={t('resolveCondition.types.notApplicable')}
                description={t('resolveCondition.types.notApplicableDesc')}
                hint={isRequired ? t('resolveCondition.noteHint.notApplicable') : undefined}
                hintColor="amber"
              />
              <ResolutionCard
                type="skipped_with_risk"
                selected={resolutionType === 'skipped_with_risk'}
                onSelect={() => setResolutionType('skipped_with_risk')}
                label={t('resolveCondition.types.skippedWithRisk')}
                description={t('resolveCondition.types.skippedWithRiskDesc')}
                disabled={isBlocking}
                disabledBadge={isBlocking ? t('resolveCondition.types.notAvailable') : undefined}
                disabledReason={isBlocking ? t('resolveCondition.types.blockingConstraint') : undefined}
                hint={isRequired ? t('resolveCondition.noteHint.skippedWithRisk') : undefined}
                hintColor="red"
                accentColor={isRecommended ? 'amber' : undefined}
              />
            </div>
          </div>

          {/* File upload — Fix #5: label matches maquette */}
          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-2 uppercase tracking-wide">
              {t('resolveCondition.evidenceLabel')}
            </label>
            {canUseEvidence ? (
              <EvidenceUploader
                selectedFile={selectedFile}
                onFileSelect={setSelectedFile}
                isUploading={uploadMutation.isPending}
                accept=".pdf,.jpg,.jpeg,.png"
                compact
              />
            ) : (
              <UpgradePrompt feature="condition_evidence" targetPlan="pro" />
            )}
          </div>

          {/* D41 escape (blocking, no file) — Fix #7/#8/#9/#13 */}
          {showD41Escape && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                <span className="text-xs font-semibold text-amber-800">
                  {t('resolveCondition.d41.title')}
                </span>
              </div>
              <p className="text-xs text-amber-700 mb-2">
                {t('resolveCondition.d41.message')}
              </p>
              <textarea
                value={escapeReason}
                onChange={(e) => setEscapeReason(e.target.value)}
                placeholder={t('resolveCondition.d41.placeholder')}
                className="w-full px-3 py-2 text-sm rounded-lg border border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-300/50 resize-none bg-white"
                rows={2}
                disabled={isLoading}
              />
              <p className="text-xs text-amber-500 mt-1 flex items-center gap-1">
                <Info className="w-3 h-3" />
                {t('resolveCondition.d41.minChars', { count: Math.max(0, escapeRemaining) })}
              </p>
              <label className="flex items-start gap-2 mt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={escapeChecked}
                  onChange={(e) => setEscapeChecked(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-amber-300"
                  disabled={isLoading}
                />
                <span className="text-xs text-amber-800 font-medium">
                  {t('resolveCondition.d41.checkbox')}
                </span>
              </label>
            </div>
          )}

          {/* Note field — Fix #9/#14: text-xs label, hint below textarea */}
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">
              {t('resolveCondition.noteLabel')}{' '}
              {noteRequired ? (
                <span className="text-red-500 font-semibold">({t('resolveCondition.noteRequired')})</span>
              ) : (
                <span className="text-stone-400">({t('resolveCondition.noteOptional')})</span>
              )}
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t('resolveCondition.notePlaceholder')}
              className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
              rows={2}
              disabled={isLoading}
            />
            {noteRequired && (
              <div className="flex items-center gap-1 mt-1 text-xs text-amber-600">
                <AlertTriangle className="w-3 h-3 shrink-0" />
                {t('resolveCondition.noteHintGeneral', 'Note obligatoire pour ce type de résolution')}
              </div>
            )}
          </div>
        </div>

        {/* Footer — Fix #10/#12: bg-stone-50, border-stone-100, responsive layout */}
        <div className="px-5 sm:px-6 py-4 bg-stone-50 border-t border-stone-100 flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2 sm:justify-end">
          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-100 text-sm font-medium text-center"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!canConfirm}
            className={[
              'px-6 py-2.5 rounded-lg text-sm font-semibold shadow-sm flex items-center justify-center gap-2',
              canConfirm
                ? 'bg-[#1e3a5f] hover:bg-[#1e3a5f]/90 text-white'
                : 'bg-stone-300 text-stone-500 cursor-not-allowed',
            ].join(' ')}
          >
            {isLoading ? (
              <>
                <span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full inline-block" />
                {t('resolveCondition.confirming')}
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                {t('resolveCondition.confirm')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Resolution Radio Card ──────────────────────────────── */

interface ResolutionCardProps {
  type: ResolutionType
  selected: boolean
  onSelect: () => void
  label: string
  description: string
  disabled?: boolean
  disabledBadge?: string
  disabledReason?: string
  hint?: string
  hintColor?: 'amber' | 'red'
  accentColor?: 'amber'
}

function ResolutionCard({
  selected,
  onSelect,
  label,
  description,
  disabled,
  disabledBadge,
  disabledReason,
  hint,
  hintColor = 'amber',
  accentColor,
}: ResolutionCardProps) {
  // Fix #3: border-2, Fix #4: selected = full border color + ring shadow, Fix #6: line-through
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onSelect}
      className={[
        'w-full text-left rounded-lg border-2 p-3 transition-all',
        disabled
          ? 'opacity-45 cursor-not-allowed border-stone-200 bg-[#fafaf9] pointer-events-none'
          : selected
            ? 'border-[#1e3a5f] bg-[#1e3a5f]/5 shadow-[0_0_0_2px_rgba(30,58,95,0.15)]'
            : accentColor === 'amber'
              ? 'border-amber-200 bg-white hover:border-[#1e3a5f] cursor-pointer'
              : 'border-stone-200 bg-white hover:border-[#1e3a5f] cursor-pointer',
      ].join(' ')}
      disabled={disabled}
    >
      <div className="flex items-start gap-3">
        {/* Radio indicator — Fix #5: maquette style (filled circle with white dot) */}
        <div className="mt-0.5 shrink-0">
          {selected && !disabled ? (
            <div className="w-4 h-4 rounded-full bg-[#1e3a5f] flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-white" />
            </div>
          ) : (
            <div className={`w-4 h-4 rounded-full border-2 ${disabled ? 'border-stone-200' : 'border-stone-300'}`} />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {/* Fix #6: line-through on disabled label */}
            <span className={`text-sm font-medium ${
              disabled ? 'text-stone-400 line-through'
              : accentColor === 'amber' ? 'text-amber-800'
              : 'text-stone-900'
            }`}>
              {label}
            </span>
            {disabledBadge && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-600">
                {disabledBadge}
              </span>
            )}
          </div>
          <p className={`text-xs mt-0.5 ${disabled ? 'text-stone-400' : 'text-stone-500'}`}>
            {disabled && disabledReason ? disabledReason : description}
          </p>
          {hint && !disabled && (
            <p className={`text-xs mt-0.5 italic ${
              hintColor === 'red' ? 'text-red-500' : 'text-amber-600'
            }`}>
              {hint}
            </p>
          )}
        </div>
      </div>
    </button>
  )
}
