import { useState, useMemo } from 'react'
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
  X,
  Zap,
} from 'lucide-react'
import { transactionsApi, type Transaction, type TransactionStep } from '../../api/transactions.api'
import { conditionsApi, type Condition, type ResolutionType } from '../../api/conditions.api'
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

  // Reset state when modal closes
  const handleClose = () => {
    setPhase('review')
    setNote('')
    setNotifyEmail(true)
    setSuccessData(null)
    onClose()
  }

  // Queries
  const { data: advanceCheckData } = useQuery({
    queryKey: ['advance-check', transaction.id],
    queryFn: async () => {
      const result = await conditionsApi.advanceCheck(transaction.id)
      return result.success ? result.data : null
    },
    enabled: isOpen && !!transaction.currentStepId,
    staleTime: 10000,
  })

  const { data: activeConditionsData } = useQuery({
    queryKey: ['conditions', 'active', transaction.id],
    queryFn: async () => {
      const result = await conditionsApi.getActive(transaction.id)
      return result.success ? result.data : null
    },
    enabled: isOpen && !!transaction.currentStepId,
    staleTime: 10000,
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
  const currentStepId = transaction.currentStep?.id
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

  // Group conditions by level for the current step
  const groups = useMemo(() => {
    const conditions = activeConditionsData?.conditions ?? []
    const stepConditions = conditions.filter((c) => c.transactionStepId === currentStepId)

    const blocking = stepConditions.filter((c) => c.level === 'blocking' || c.isBlocking)
    const required = stepConditions.filter((c) => c.level === 'required' && !c.isBlocking)
    const recommended = stepConditions.filter((c) => c.level === 'recommended')

    return { blocking, required, recommended }
  }, [activeConditionsData, currentStepId])

  const blockingResolved = groups.blocking.filter((c) => c.status === 'completed')
  const blockingPending = groups.blocking.filter((c) => c.status === 'pending')
  const requiredResolved = groups.required.filter((c) => c.status === 'completed')
  const requiredPending = groups.required.filter((c) => c.status === 'pending')
  const recommendedPending = groups.recommended.filter((c) => c.status === 'pending')

  // Parties with email
  const emailParties = useMemo(() => {
    const parties = partiesData?.parties ?? []
    return parties.filter((p) => p.email)
  }, [partiesData])

  // Compute archived summary for success state
  const computeArchivedSummary = () => {
    const all = [...groups.blocking, ...groups.required, ...groups.recommended]
    return {
      total: all.length,
      completed: all.filter((c) => c.resolutionType === 'completed' || (c.status === 'completed' && !c.resolutionType)).length,
      waived: all.filter((c) => c.resolutionType === 'waived').length,
      notApplicable: all.filter((c) => c.resolutionType === 'not_applicable').length,
      recommended: recommendedPending.length,
    }
  }

  const transactionKey = ['transaction', transaction.id]

  const invalidateAll = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: transactionKey }),
      queryClient.invalidateQueries({ queryKey: ['transactions'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      queryClient.invalidateQueries({ queryKey: ['advance-check', transaction.id] }),
      queryClient.invalidateQueries({ queryKey: ['conditions', 'active', transaction.id] }),
    ])
  }

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

  // Blocked message
  const blockedMessage = useMemo(() => {
    const bCount = blockingPending.length
    const rCount = requiredPending.length
    if (bCount > 0 && rCount > 0) {
      return t('validateStep.blocked.message', { blocking: bCount, required: rCount })
    }
    if (bCount > 0) {
      return t('validateStep.blocked.messageBlocking', { count: bCount })
    }
    return t('validateStep.blocked.messageRequired', { count: rCount })
  }, [blockingPending, requiredPending, t])

  // Get condition display name
  const getConditionName = (c: Condition) => {
    const lang = i18n.language?.substring(0, 2) ?? 'fr'
    if (lang === 'en' && c.labelEn) return c.labelEn
    if (c.labelFr) return c.labelFr
    return c.title
  }

  // Format due date
  const formatDueDate = (dateStr: string) => {
    return formatDate(dateStr, 'd MMM')
  }

  // Resolution badge
  const getResolutionBadge = (resType: ResolutionType | null | undefined) => {
    const key = resType ?? 'completed'
    const config = RESOLUTION_CONFIG[key] ?? RESOLUTION_CONFIG.completed
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {t(`validateStep.${config.key}`)}
      </span>
    )
  }

  // Resolution check icon color
  const getCheckColor = (resType: ResolutionType | null | undefined) => {
    const key = resType ?? 'completed'
    return RESOLUTION_CONFIG[key]?.icon ?? 'text-emerald-500'
  }

  // Archived detail string
  const getArchivedDetail = (data: SuccessData['conditionsArchived']) => {
    const parts: string[] = []
    if (data.completed > 0) parts.push(t('validateStep.success.archivedCompleted', { count: data.completed }))
    if (data.waived > 0) parts.push(t('validateStep.success.archivedWaived', { count: data.waived }))
    if (data.notApplicable > 0) parts.push(t('validateStep.success.archivedNotApplicable', { count: data.notApplicable }))
    if (data.recommended > 0) parts.push(t('validateStep.success.archivedRecommended', { count: data.recommended }))
    return parts.join(', ')
  }

  // ─── Condition group renderer ───
  const renderConditionGroup = (
    level: 'blocking' | 'required' | 'recommended',
    conditions: Condition[],
    resolved: Condition[],
    pending: Condition[]
  ) => {
    if (conditions.length === 0) return null

    const isRecommended = level === 'recommended'
    const isBlocking = level === 'blocking'

    // Colors per level & state
    let borderColor: string, headerBg: string, dotColor: string
    if (canAdvance) {
      borderColor = 'border-emerald-200'
      headerBg = 'bg-emerald-50'
      dotColor = 'bg-emerald-500'
    } else if (isRecommended) {
      borderColor = 'border-stone-200'
      headerBg = 'bg-stone-50'
      dotColor = 'bg-stone-400'
    } else if (isBlocking) {
      borderColor = 'border-red-200'
      headerBg = 'bg-red-50'
      dotColor = 'bg-red-500'
    } else {
      borderColor = 'border-amber-200'
      headerBg = 'bg-amber-50'
      dotColor = 'bg-amber-500'
    }

    const levelLabel = t(`validateStep.level${level.charAt(0).toUpperCase() + level.slice(1)}`)

    // Recommended in blocked state: compact summary
    if (isRecommended && !canAdvance) {
      return (
        <div className={`rounded-lg bg-stone-50 border ${borderColor} p-3`}>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${dotColor} shrink-0`} />
            <span className="text-xs font-semibold text-stone-600">{levelLabel}</span>
            <span className="text-xs text-stone-500 ml-auto">
              {t('validateStep.pendingCount', { count: pending.length })}
            </span>
          </div>
          <p className="text-xs text-stone-500 italic mt-1.5 ml-4">
            {t('validateStep.recommendedNote')}
          </p>
        </div>
      )
    }

    // Recommended in ready state: compact
    if (isRecommended && canAdvance) {
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
            {t('validateStep.recommendedNoteReady')}
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

            if (isResolved || canAdvance) {
              // Resolved condition or ready state
              return (
                <div key={c.id} className="flex items-center gap-2.5 px-3 py-2">
                  <Check className={`w-4 h-4 shrink-0 ${getCheckColor(c.resolutionType)}`} />
                  <span className="text-sm text-stone-700 flex-1">{name}</span>
                  {canAdvance && getResolutionBadge(c.resolutionType)}
                </div>
              )
            }

            // Pending condition (blocked state)
            const isBlockingLevel = c.level === 'blocking'
            const pendingBg = isBlockingLevel ? 'bg-red-50/50' : c.level === 'required' ? 'bg-amber-50/50' : ''
            const pendingTextColor = isBlockingLevel ? 'text-red-800' : 'text-amber-800'
            const pendingDateColor = isBlockingLevel ? 'text-red-500' : 'text-amber-500'
            return (
              <div key={c.id} className={`flex items-center gap-2.5 px-3 py-2 ${pendingBg}`}>
                <AlertCircle className={`w-4 h-4 shrink-0 ${isBlockingLevel ? 'text-red-500' : 'text-amber-500'}`} />
                <div className="flex-1 min-w-0">
                  <span className={`text-xs font-medium ${pendingTextColor}`}>{name}</span>
                  {c.dueDate && (
                    <span className={`text-xs ${pendingDateColor} italic ml-2`}>
                      {t('validateStep.dueDate', { date: formatDueDate(c.dueDate) })}
                    </span>
                  )}
                </div>
                <button
                  onClick={handleClose}
                  className="text-xs font-medium text-primary hover:text-primary/80 shrink-0"
                >
                  {t('validateStep.resolve')}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

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
            {/* Step completed */}
            <div className="flex items-center gap-3 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="text-xs text-emerald-800">
                {t('validateStep.success.completed', {
                  order: successData.previousStepOrder,
                  name: successData.previousStepName,
                })}
              </span>
            </div>

            {/* Next step started or transaction completed */}
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

            {/* Conditions archived */}
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

          {/* Conditions summary */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              {t('validateStep.conditionsSummary')}
            </h4>

            {renderConditionGroup('blocking', groups.blocking, blockingResolved, blockingPending)}
            {renderConditionGroup('required', groups.required, requiredResolved, requiredPending)}
            {renderConditionGroup('recommended', groups.recommended,
              groups.recommended.filter((c) => c.status === 'completed'),
              recommendedPending
            )}
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
  )
}
