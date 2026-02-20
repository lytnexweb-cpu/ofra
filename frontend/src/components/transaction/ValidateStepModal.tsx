import { useState, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Check,
  Lock,
  ArrowRight,
  Archive,
  Mail,
  Zap,
  ShieldCheck,
} from 'lucide-react'
import { transactionsApi, type Transaction } from '../../api/transactions.api'
import { conditionsApi, type Condition, type AdvanceCheckCondition, type ResolutionType } from '../../api/conditions.api'
import { fintracApi } from '../../api/fintrac.api'
import { partiesApi } from '../../api/parties.api'
import { toast } from '../../hooks/use-toast'
import { formatDate } from '../../lib/date'
import { Button } from '../ui/Button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '../ui/Dialog'
import ConditionValidationModal from './ConditionValidationModal'
import FintracComplianceModal from './FintracComplianceModal'

interface ValidateStepModalProps {
  isOpen: boolean
  onClose: () => void
  transaction: Transaction
}

interface SuccessData {
  previousStepOrder: number
  previousStepName: string
  newStepOrder: number | null
  newStepName: string | null
  conditionsArchived: {
    total: number
    completed: number
    waived: number
    notApplicable: number
    recommended: number
  }
}

// Resolution badge config
const RESOLUTION_CONFIG: Record<string, { bg: string; text: string; icon: string; key: string }> = {
  completed: { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: 'text-emerald-500', key: 'resolutionCompleted' },
  waived: { bg: 'bg-amber-100', text: 'text-amber-700', icon: 'text-amber-500', key: 'resolutionWaived' },
  not_applicable: { bg: 'bg-stone-100', text: 'text-stone-600', icon: 'text-stone-400', key: 'resolutionNotApplicable' },
  skipped_with_risk: { bg: 'bg-red-100', text: 'text-red-700', icon: 'text-red-400', key: 'resolutionSkipped' },
}

export default function ValidateStepModal({ isOpen, onClose, transaction }: ValidateStepModalProps) {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()

  const [phase, setPhase] = useState<'review' | 'success'>('review')
  const [notifyEmail, setNotifyEmail] = useState(true)
  const [note, setNote] = useState('')
  const [successData, setSuccessData] = useState<SuccessData | null>(null)

  // Stacked modal state: resolve a condition or FINTRAC without leaving this modal
  const [resolveCondition, setResolveCondition] = useState<AdvanceCheckCondition | null>(null)
  const [fintracResolve, setFintracResolve] = useState<{
    conditionId: number
    fintracRecordId: number
    partyName: string
  } | null>(null)

  // Reset state when modal closes
  const handleClose = () => {
    setPhase('review')
    setNote('')
    setNotifyEmail(true)
    setSuccessData(null)
    setResolveCondition(null)
    setFintracResolve(null)
    onClose()
  }

  // Single source of truth: advance-check
  const { data: advanceCheckData } = useQuery({
    queryKey: ['advance-check', transaction.id],
    queryFn: async () => {
      const result = await conditionsApi.advanceCheck(transaction.id)
      return result.success ? result.data : null
    },
    enabled: isOpen && !!transaction.currentStepId,
    staleTime: 5000,
  })

  const { data: partiesData } = useQuery({
    queryKey: ['parties', transaction.id],
    queryFn: async () => {
      const result = await partiesApi.list(transaction.id)
      return result.success ? result.data : null
    },
    enabled: isOpen && !!transaction.currentStepId,
  })

  // Computed data
  const currentStepOrder = transaction.currentStep?.stepOrder ?? 0
  const currentStepSlug = transaction.currentStep?.workflowStep?.slug ?? ''
  const currentStepName = currentStepSlug
    ? t(`workflow.steps.${currentStepSlug}`, { defaultValue: transaction.currentStep?.workflowStep?.name ?? '' })
    : transaction.currentStep?.workflowStep?.name ?? ''

  const steps = transaction.transactionSteps ?? []
  const nextStep = steps.find((s) => s.stepOrder === currentStepOrder + 1)
  const nextStepSlug = nextStep?.workflowStep?.slug ?? ''
  const nextStepName = nextStepSlug
    ? t(`workflow.steps.${nextStepSlug}`, { defaultValue: nextStep?.workflowStep?.name ?? '' })
    : nextStep?.workflowStep?.name ?? ''

  const canAdvance = advanceCheckData?.canAdvance ?? false
  const requiresAcceptedOffer = advanceCheckData?.requiresAcceptedOffer ?? false
  const hasAcceptedOffer = advanceCheckData?.hasAcceptedOffer ?? false
  const offerMissing = requiresAcceptedOffer && !hasAcceptedOffer

  // Groups from advance-check (single source of truth — no re-filtering)
  const blocking = advanceCheckData?.blockingConditions ?? []
  const required = advanceCheckData?.requiredPendingConditions ?? []
  const recommended = advanceCheckData?.recommendedPendingConditions ?? []

  // Parties with email
  const emailParties = useMemo(() => {
    const parties = partiesData?.parties ?? []
    return parties.filter((p) => p.email)
  }, [partiesData])

  // Compute archived summary for success state
  const computeArchivedSummary = () => {
    const all = [...blocking, ...required, ...recommended]
    return {
      total: all.length,
      completed: all.filter((c) => c.resolutionType === 'completed' || (c.status === 'completed' && !c.resolutionType)).length,
      waived: all.filter((c) => c.resolutionType === 'waived').length,
      notApplicable: all.filter((c) => c.resolutionType === 'not_applicable').length,
      recommended: recommended.filter((c) => c.status === 'pending').length,
    }
  }

  const invalidateAll = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['transaction', transaction.id] }),
      queryClient.invalidateQueries({ queryKey: ['transactions'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      queryClient.invalidateQueries({ queryKey: ['advance-check', transaction.id] }),
      queryClient.invalidateQueries({ queryKey: ['conditions', 'active', transaction.id] }),
    ])
  }, [queryClient, transaction.id])

  const advanceMutation = useMutation({
    mutationFn: () => transactionsApi.advanceStep(transaction.id, {
      note: note.trim() || undefined,
      notifyEmail,
    }),
    onSuccess: async (response) => {
      if (!response.success && response.error) {
        toast({ title: t('common.error'), description: response.error.message, variant: 'destructive' })
        return
      }
      const newStep = response.data?.newStep
      setSuccessData({
        previousStepOrder: currentStepOrder,
        previousStepName: currentStepName,
        newStepOrder: newStep?.stepOrder ?? null,
        newStepName: newStep?.workflowStep?.name
          ? (newStep.workflowStep.slug
              ? t(`workflow.steps.${newStep.workflowStep.slug}`, { defaultValue: newStep.workflowStep.name })
              : newStep.workflowStep.name)
          : null,
        conditionsArchived: computeArchivedSummary(),
      })
      setPhase('success')
      await invalidateAll()
    },
    onError: () => {
      toast({ title: t('common.error'), variant: 'destructive' })
    },
  })

  // Blocked message — now with FINTRAC awareness
  const blockedMessage = useMemo(() => {
    const fintracCount = blocking.filter((c) => c.sourceType === 'legal' && c.title.startsWith('FINTRAC')).length
    const otherBlocking = blocking.length - fintracCount
    const rCount = required.length
    const parts: string[] = []
    if (fintracCount > 0) parts.push(t('validateStep.blocked.fintracCount', { count: fintracCount }))
    if (otherBlocking > 0) parts.push(t('validateStep.blocked.messageBlocking', { count: otherBlocking }))
    if (rCount > 0) parts.push(t('validateStep.blocked.messageRequired', { count: rCount }))
    return parts.join(' · ')
  }, [blocking, required, t])

  // Get condition display name
  const getConditionName = (c: AdvanceCheckCondition) => {
    const lang = i18n.language?.substring(0, 2) ?? 'fr'
    if (lang === 'en' && c.labelEn) return c.labelEn
    if (c.labelFr) return c.labelFr
    return c.title
  }

  const formatDueDate = (dateStr: string) => formatDate(dateStr, 'd MMM')

  const getResolutionBadge = (resType: string | null | undefined) => {
    const key = resType ?? 'completed'
    const config = RESOLUTION_CONFIG[key] ?? RESOLUTION_CONFIG.completed
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {t(`validateStep.${config.key}`)}
      </span>
    )
  }

  const getCheckColor = (resType: string | null | undefined) => {
    const key = resType ?? 'completed'
    return RESOLUTION_CONFIG[key]?.icon ?? 'text-emerald-500'
  }

  const getArchivedDetail = (data: SuccessData['conditionsArchived']) => {
    const parts: string[] = []
    if (data.completed > 0) parts.push(t('validateStep.success.archivedCompleted', { count: data.completed }))
    if (data.waived > 0) parts.push(t('validateStep.success.archivedWaived', { count: data.waived }))
    if (data.notApplicable > 0) parts.push(t('validateStep.success.archivedNotApplicable', { count: data.notApplicable }))
    if (data.recommended > 0) parts.push(t('validateStep.success.archivedRecommended', { count: data.recommended }))
    return parts.join(', ')
  }

  // Handle sub-modal close → refresh advance-check
  const handleSubModalClose = useCallback(() => {
    setResolveCondition(null)
    setFintracResolve(null)
    invalidateAll()
  }, [invalidateAll])

  // Action for a pending condition: open correct sub-modal
  const handleResolveAction = useCallback(async (c: AdvanceCheckCondition) => {
    const isFintrac = c.sourceType === 'legal' && c.title.startsWith('FINTRAC')
    if (isFintrac) {
      let recordId = c.fintracRecordId

      // Fallback: if advance-check didn't match the fintracRecordId, fetch it
      if (!recordId) {
        try {
          const result = await fintracApi.list(transaction.id)
          const records = result.data?.records ?? []
          const partyName = c.title.replace('FINTRAC — ', '')
          const match = records.find((r) => r.party?.fullName === partyName)
          recordId = match?.id ?? null
        } catch {
          // ignore fetch error, will fall through to regular modal
        }
      }

      if (recordId) {
        setFintracResolve({
          conditionId: c.id,
          fintracRecordId: recordId,
          partyName: c.title.replace('FINTRAC — ', ''),
        })
        return
      }
    }
    setResolveCondition(c)
  }, [transaction.id])

  // ─── Condition group renderer ───
  const renderConditionGroup = (
    level: 'blocking' | 'required' | 'recommended',
    conditions: AdvanceCheckCondition[],
  ) => {
    if (conditions.length === 0) return null

    const isRecommended = level === 'recommended'
    const isBlocking = level === 'blocking'
    const pending = conditions.filter((c) => c.status === 'pending')
    const resolved = conditions.filter((c) => c.status === 'completed')

    let borderColor: string, headerBg: string, dotColor: string
    if (canAdvance) {
      borderColor = 'border-emerald-200'; headerBg = 'bg-emerald-50'; dotColor = 'bg-emerald-500'
    } else if (isRecommended) {
      borderColor = 'border-stone-200'; headerBg = 'bg-stone-50'; dotColor = 'bg-stone-400'
    } else if (isBlocking) {
      borderColor = 'border-red-200'; headerBg = 'bg-red-50'; dotColor = 'bg-red-500'
    } else {
      borderColor = 'border-amber-200'; headerBg = 'bg-amber-50'; dotColor = 'bg-amber-500'
    }

    const levelLabel = t(`validateStep.level${level.charAt(0).toUpperCase() + level.slice(1)}`)

    // Recommended: compact summary
    if (isRecommended) {
      return (
        <div className={`rounded-lg bg-stone-50 border ${borderColor} p-3`}>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${dotColor} shrink-0`} />
            <span className="text-xs font-semibold text-stone-600">{levelLabel}</span>
            <span className="text-xs text-stone-500 ml-auto">
              {pending.length > 0
                ? t('validateStep.pendingCount', { count: pending.length })
                : t('validateStep.resolvedCount', { resolved: resolved.length, total: conditions.length })}
            </span>
          </div>
          <p className="text-xs text-stone-500 italic mt-1.5 ml-4">
            {canAdvance ? t('validateStep.recommendedNoteReady') : t('validateStep.recommendedNote')}
          </p>
        </div>
      )
    }

    return (
      <div className={`rounded-lg border ${borderColor} overflow-hidden`}>
        {/* Group header */}
        <div className={`flex items-center gap-2 px-3 py-2 ${headerBg}`}>
          <span className={`w-2 h-2 rounded-full ${dotColor} shrink-0`} />
          <span className="text-xs font-semibold text-stone-600">{levelLabel}</span>
          <span className="text-xs text-stone-500 ml-auto">
            {t('validateStep.resolvedCount', { resolved: resolved.length, total: conditions.length })}
          </span>
        </div>

        {/* Condition list */}
        <div className="divide-y divide-stone-100">
          {conditions.map((c) => {
            const isResolved = c.status === 'completed'
            const name = getConditionName(c)
            const isFintrac = c.sourceType === 'legal' && c.title.startsWith('FINTRAC')

            if (isResolved) {
              return (
                <div key={c.id} className="flex items-center gap-2.5 px-3 py-2">
                  <Check className={`w-4 h-4 shrink-0 ${getCheckColor(c.resolutionType)}`} />
                  <span className="text-sm text-stone-700 flex-1">{name}</span>
                  {getResolutionBadge(c.resolutionType)}
                </div>
              )
            }

            // Pending condition — actionable
            const isBlockingLevel = c.level === 'blocking'
            const pendingBg = isBlockingLevel ? 'bg-red-50/50' : c.level === 'required' ? 'bg-amber-50/50' : ''
            const pendingTextColor = isBlockingLevel ? 'text-red-800' : 'text-amber-800'
            const pendingDateColor = isBlockingLevel ? 'text-red-500' : 'text-amber-500'

            return (
              <div key={c.id} className={`flex items-center gap-2.5 px-3 py-2 ${pendingBg}`}>
                <AlertCircle className={`w-4 h-4 shrink-0 ${isBlockingLevel ? 'text-red-500' : 'text-amber-500'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    {isFintrac && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700">
                        <ShieldCheck className="w-3 h-3" />
                        FINTRAC
                      </span>
                    )}
                    <span className={`text-xs font-medium ${pendingTextColor}`}>{name}</span>
                  </div>
                  {c.dueDate && (
                    <span className={`text-xs ${pendingDateColor} italic`}>
                      {t('validateStep.dueDate', { date: formatDueDate(c.dueDate) })}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleResolveAction(c)}
                  className={`shrink-0 px-3 py-2 rounded-md text-xs font-semibold transition-colors flex items-center gap-1 ${
                    isFintrac
                      ? 'text-red-700 bg-red-100 hover:bg-red-200'
                      : 'text-primary bg-primary/10 hover:bg-primary/20'
                  }`}
                >
                  {isFintrac ? (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5" />
                      {t('fintrac.completeFintrac')}
                    </>
                  ) : (
                    t('validateStep.resolve')
                  )}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ─── RENDER: Stacked sub-modals ───
  // These render ON TOP of the ValidateStepModal (which stays open underneath)
  const renderSubModals = () => (
    <>
      {resolveCondition && (
        <ConditionValidationModal
          isOpen
          onClose={handleSubModalClose}
          condition={{
            id: resolveCondition.id,
            transactionId: transaction.id,
            transactionStepId: resolveCondition.transactionStepId,
            templateId: null,
            title: resolveCondition.title,
            description: null,
            status: resolveCondition.status as Condition['status'],
            type: 'other',
            priority: resolveCondition.isBlocking ? 'high' : 'medium',
            isBlocking: resolveCondition.isBlocking,
            documentUrl: null,
            documentLabel: null,
            dueDate: resolveCondition.dueDate ?? '',
            completedAt: null,
            createdAt: '',
            updatedAt: '',
            labelFr: resolveCondition.labelFr,
            labelEn: resolveCondition.labelEn,
            level: resolveCondition.level as Condition['level'],
            sourceType: resolveCondition.sourceType as Condition['sourceType'],
          }}
          transactionId={transaction.id}
        />
      )}
      {fintracResolve && (
        <FintracComplianceModal
          isOpen
          onClose={handleSubModalClose}
          transactionId={transaction.id}
          conditionId={fintracResolve.conditionId}
          fintracRecordId={fintracResolve.fintracRecordId}
          partyName={fintracResolve.partyName}
        />
      )}
    </>
  )

  // ─── RENDER: Success State (C) ───
  if (phase === 'success' && successData) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="sm:max-w-md" aria-describedby="validate-step-success-desc">
          <DialogHeader className="items-center text-center">
            <div className="mx-auto w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mb-3">
              <CheckCircle2 className="w-7 h-7 text-emerald-600" />
            </div>
            <DialogTitle className="text-lg">{t('validateStep.success.title')}</DialogTitle>
            <DialogDescription id="validate-step-success-desc" className="text-sm text-stone-500">
              {t('validateStep.success.subtitle', {
                from: successData.previousStepName,
                to: successData.newStepName ?? t('validateStep.success.transactionCompleted'),
              })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <div className="flex items-center gap-3 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="text-xs text-emerald-800">
                {t('validateStep.success.completed', {
                  order: successData.previousStepOrder,
                  name: successData.previousStepName,
                })}
              </span>
            </div>

            <div className="flex items-center gap-3 rounded-lg border border-primary/10 bg-primary/5 px-3 py-2.5">
              <ArrowRight className="w-4 h-4 text-primary shrink-0" />
              <span className="text-xs text-primary">
                {successData.newStepOrder
                  ? t('validateStep.success.started', {
                      order: successData.newStepOrder,
                      name: successData.newStepName,
                    })
                  : t('validateStep.success.transactionCompleted')}
              </span>
            </div>

            {successData.conditionsArchived.total > 0 && (
              <div className="flex items-center gap-3 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2.5">
                <Archive className="w-4 h-4 text-stone-500 shrink-0" />
                <span className="text-xs text-stone-600">
                  {t('validateStep.success.archived', {
                    total: successData.conditionsArchived.total,
                    detail: getArchivedDetail(successData.conditionsArchived),
                  })}
                </span>
              </div>
            )}
          </div>

          <DialogFooter className="justify-center sm:justify-center">
            <Button onClick={handleClose}>
              {t('validateStep.success.returnToTransaction')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  // ─── RENDER: Review State (A: Blocked or B: Ready) ───
  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent
          className="sm:max-w-lg max-h-[92vh] overflow-y-auto"
          aria-describedby="validate-step-review-desc"
        >
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                canAdvance ? 'bg-emerald-100' : 'bg-primary/10'
              }`}>
                <CheckCircle2 className={`w-5 h-5 ${canAdvance ? 'text-emerald-600' : 'text-primary'}`} />
              </div>
              <div>
                <DialogTitle className="text-base">{t('validateStep.title')}</DialogTitle>
                <p className="text-sm text-stone-500 mt-0.5">
                  {canAdvance && nextStep
                    ? t('validateStep.subtitleNext', {
                        order: currentStepOrder,
                        name: currentStepName,
                        nextOrder: currentStepOrder + 1,
                      })
                    : t('validateStep.subtitle', {
                        order: currentStepOrder,
                        name: currentStepName,
                      })}
                </p>
              </div>
            </div>
            <DialogDescription id="validate-step-review-desc" className="sr-only">
              {canAdvance ? t('validateStep.ready.title') : t('validateStep.blocked.title')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-1">
            {/* Alert banner */}
            {canAdvance ? (
              <div className="flex items-start gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-emerald-800">{t('validateStep.ready.title')}</p>
                  <p className="text-xs text-emerald-700 mt-0.5">{t('validateStep.ready.message')}</p>
                </div>
              </div>
            ) : offerMissing ? (
              <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">{t('validateStep.blocked.offerRequiredTitle')}</p>
                  <p className="text-xs text-amber-700 mt-0.5">{t('validateStep.blocked.offerRequiredMessage')}</p>
                  <button
                    type="button"
                    onClick={() => {
                      handleClose()
                      document.getElementById('offers-panel')?.scrollIntoView({ behavior: 'smooth' })
                    }}
                    className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-amber-800 hover:text-amber-900 underline underline-offset-2"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                    {t('validateStep.blocked.viewOffers')}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-800">{t('validateStep.blocked.title')}</p>
                  <p className="text-xs text-red-700 mt-0.5">{blockedMessage}</p>
                </div>
              </div>
            )}

            {/* Conditions summary — single source from advance-check */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                {t('validateStep.conditionsSummary')}
              </h4>

              {renderConditionGroup('blocking', blocking)}
              {renderConditionGroup('required', required)}
              {renderConditionGroup('recommended', recommended)}
            </div>

            {/* Ready state extras */}
            {canAdvance && (
              <>
                {/* Workflow impact */}
                <div className="rounded-lg border border-indigo-200 bg-indigo-50/50 p-3 space-y-2">
                  <h4 className="flex items-center gap-1.5 text-xs font-semibold text-indigo-800">
                    <Zap className="w-3.5 h-3.5" />
                    {t('validateStep.workflowImpact')}
                  </h4>
                  <div className="space-y-1.5">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-stone-700">
                        {t('validateStep.impactCompleted', { order: currentStepOrder, name: currentStepName })}
                      </p>
                    </div>
                    {nextStep && (
                      <div className="flex items-start gap-2">
                        <ArrowRight className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <p className="text-xs text-stone-700">
                          {t('validateStep.impactStarted', { order: currentStepOrder + 1, name: nextStepName })}
                        </p>
                      </div>
                    )}
                    <div className="flex items-start gap-2">
                      <Archive className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-stone-700">
                        {t('validateStep.impactArchived')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Email notification toggle */}
                <div className="rounded-lg border border-stone-200 bg-white p-3">
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-stone-500 shrink-0" />
                    <span className="text-xs font-medium text-stone-700 flex-1">{t('validateStep.notifyEmail')}</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={notifyEmail}
                      onClick={() => setNotifyEmail(!notifyEmail)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                        notifyEmail ? 'bg-primary' : 'bg-stone-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition-transform ${
                          notifyEmail ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                  {notifyEmail && emailParties.length > 0 && (
                    <div className="mt-2 ml-7">
                      <p className="text-xs text-stone-500 mb-1">{t('validateStep.recipients')}</p>
                      <div className="space-y-0.5">
                        {emailParties.map((p) => (
                          <div key={p.id} className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                            <span className="text-xs text-stone-700">{t(`partiesModal.roles.${p.role}`, { defaultValue: p.role })} — {p.email}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Optional note */}
                <div>
                  <label className="text-xs font-medium text-stone-600 mb-1 block">
                    {t('validateStep.noteLabel')}
                  </label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder={t('validateStep.notePlaceholder')}
                    className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white resize-none"
                    rows={2}
                  />
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <DialogFooter className="border-t border-stone-200 bg-stone-50 -mx-6 -mb-6 px-6 py-3 rounded-b-lg flex-col-reverse sm:flex-row">
            <Button variant="outline" onClick={handleClose}>
              {canAdvance ? t('common.cancel') : t('validateStep.close')}
            </Button>
            <Button
              onClick={() => advanceMutation.mutate()}
              disabled={!canAdvance || advanceMutation.isPending}
              className={!canAdvance ? 'bg-stone-300 text-stone-500 hover:bg-stone-300 cursor-not-allowed' : ''}
            >
              {!canAdvance ? (
                <>
                  <Lock className="w-4 h-4 mr-1.5" />
                  {t('validateStep.title')}
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-1.5" />
                  {advanceMutation.isPending ? t('common.loading') : t('validateStep.validateAndAdvance')}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stacked sub-modals (render on top, ValidateStepModal stays open) */}
      {renderSubModals()}
    </>
  )
}
