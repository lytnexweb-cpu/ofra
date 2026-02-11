import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { differenceInDays, parseISO } from '../../lib/date'
import { AlertTriangle, CheckCircle2, Clock, SkipForward, X, AlertCircle, Lightbulb, MoreVertical, Info } from 'lucide-react'
import { transactionsApi, type Transaction } from '../../api/transactions.api'
import { conditionsApi, type Condition } from '../../api/conditions.api'
import { toast } from '../../hooks/use-toast'
import { Button } from '../ui/Button'
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '../ui/Tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/DropdownMenu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '../ui/Dialog'
import ResolutionRequiredModal from './ResolutionRequiredModal'

const BLOCKING_MODAL_KEY = 'ofra-blockingModalDismissed'

interface ActionZoneProps {
  transaction: Transaction
}

export default function ActionZone({ transaction }: ActionZoneProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [skipDialogOpen, setSkipDialogOpen] = useState(false)
  const [skipConfirmInput, setSkipConfirmInput] = useState('')
  const [skipTermsAccepted, setSkipTermsAccepted] = useState(false)
  const [skipReason, setSkipReason] = useState('')
  const [blockingModalOpen, setBlockingModalOpen] = useState(false)
  const [resolutionModalOpen, setResolutionModalOpen] = useState(false)
  const [blockingBannerCount, setBlockingBannerCount] = useState<number | null>(null)
  const [dontShowAgain, setDontShowAgain] = useState(false)

  // Confirmation phrase from translations
  const confirmPhrase = t('workflow.skipConfirmModal.confirmPhrase')

  // Reset skip confirmation state when dialog closes
  const handleSkipDialogClose = () => {
    setSkipDialogOpen(false)
    setSkipConfirmInput('')
    setSkipTermsAccepted(false)
    setSkipReason('')
  }

  const transactionKey = ['transaction', transaction.id]
  const currentStepName = transaction.currentStep?.workflowStep?.name ?? ''
  const currentStepSlug = transaction.currentStep?.workflowStep?.slug ?? ''
  const stepLabel = currentStepSlug
    ? t(`workflow.steps.${currentStepSlug}`, { defaultValue: currentStepName })
    : currentStepName

  // Premium: Query advance-check to know what's needed to advance
  const { data: advanceCheckData } = useQuery({
    queryKey: ['advance-check', transaction.id],
    queryFn: async () => {
      const result = await conditionsApi.advanceCheck(transaction.id)
      return result.success ? result.data : null
    },
    enabled: !!transaction.currentStepId,
    staleTime: 10000, // 10 seconds
  })

  // Compute blocking conditions for current step (fallback to legacy if no Premium data)
  const { blockingCount, requiredCount, recommendedCount, nearestDays } = useMemo(() => {
    // Use Premium advance-check data if available
    if (advanceCheckData) {
      const blocking = advanceCheckData.blockingConditions?.length ?? 0
      const required = advanceCheckData.requiredPendingConditions?.length ?? 0
      const recommended = advanceCheckData.recommendedPendingConditions?.length ?? 0
      return { blockingCount: blocking, requiredCount: required, recommendedCount: recommended, nearestDays: null }
    }

    // Fallback to legacy computation
    const conditions = (transaction.conditions ?? []) as Condition[]
    const currentStepId = transaction.currentStep?.id
    const blocking = conditions.filter(
      (c) => (c.level === 'blocking' || c.isBlocking) && c.status === 'pending' && c.transactionStepId === currentStepId
    )
    const required = conditions.filter(
      (c) => c.level === 'required' && c.status === 'pending' && c.transactionStepId === currentStepId
    )
    const recommended = conditions.filter(
      (c) => c.level === 'recommended' && c.status === 'pending' && c.transactionStepId === currentStepId
    )

    let nearest = Infinity
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    for (const c of blocking) {
      if (!c.dueDate) continue
      const due = parseISO(c.dueDate)
      due.setHours(0, 0, 0, 0)
      const days = differenceInDays(due, today)
      if (days < nearest) nearest = days
    }

    return { blockingCount: blocking.length, requiredCount: required.length, recommendedCount: recommended.length, nearestDays: nearest === Infinity ? null : nearest }
  }, [transaction, advanceCheckData])

  // Determine if strict validation is needed (blocking or required conditions)
  const needsStrictValidation = blockingCount > 0 || requiredCount > 0

  // Check if skip confirmation is valid
  const isSkipConfirmValid = useMemo(() => {
    // Reason is always required
    const hasReason = skipReason.trim().length >= 10

    // Simple mode: just need reason
    if (!needsStrictValidation) return hasReason

    // Strict mode: phrase match + terms accepted + reason
    const inputNormalized = skipConfirmInput.trim().toLowerCase()
    const phraseNormalized = confirmPhrase.toLowerCase()
    return inputNormalized === phraseNormalized && skipTermsAccepted && hasReason
  }, [skipConfirmInput, confirmPhrase, skipTermsAccepted, needsStrictValidation, skipReason])

  // Generate appropriate warning message based on condition types
  const getSkipWarningMessage = () => {
    if (blockingCount > 0 && requiredCount > 0) {
      return t('workflow.skipConfirmModal.warningMixed', {
        step: stepLabel,
        blockingCount,
        requiredCount,
      })
    }
    if (blockingCount > 0) {
      return t('workflow.skipConfirmModal.warningBlocking', {
        step: stepLabel,
        count: blockingCount,
      })
    }
    if (requiredCount > 0) {
      return t('workflow.skipConfirmModal.warningRequired', {
        step: stepLabel,
        count: requiredCount,
      })
    }
    return t('workflow.skipConfirmModal.warningRecommended', { step: stepLabel })
  }

  const isCompleted = !transaction.currentStepId

  const invalidateAll = async () => {
    // Use refetchQueries for the main transaction to ensure immediate data refresh
    // This fixes the timeline not updating visually after step advancement
    await Promise.all([
      queryClient.refetchQueries({ queryKey: transactionKey }),
      queryClient.invalidateQueries({ queryKey: ['transactions'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      queryClient.invalidateQueries({ queryKey: ['advance-check', transaction.id] }),
      queryClient.invalidateQueries({ queryKey: ['conditions', 'active', transaction.id] }),
    ])
  }

  const handleBlockingError = (count: number) => {
    const dismissed = localStorage.getItem(BLOCKING_MODAL_KEY) === 'true'
    if (dismissed) {
      // Show inline banner
      setBlockingBannerCount(count)
    } else {
      // Show pedagogical modal
      setBlockingModalOpen(true)
      setBlockingBannerCount(count)
    }
  }

  const handleDismissModal = () => {
    if (dontShowAgain) {
      localStorage.setItem(BLOCKING_MODAL_KEY, 'true')
    }
    setBlockingModalOpen(false)
  }

  // Handle advance button click - check for required conditions first
  const handleAdvanceClick = () => {
    // If there are blocking conditions, the mutation will handle it
    if (blockingCount > 0) {
      advanceMutation.mutate()
      return
    }

    // If there are required conditions needing resolution, show the modal
    if (advanceCheckData && !advanceCheckData.canAdvance && (advanceCheckData.requiredPendingConditions?.length ?? 0) > 0) {
      setResolutionModalOpen(true)
      return
    }

    // Otherwise, just advance
    advanceMutation.mutate()
  }

  // Called after conditions are resolved in the modal
  const handleResolutionComplete = () => {
    setResolutionModalOpen(false)
    // Invalidate advance-check and retry advance
    queryClient.invalidateQueries({ queryKey: ['advance-check', transaction.id] })
    advanceMutation.mutate()
  }

  const advanceMutation = useMutation({
    mutationFn: () => transactionsApi.advanceStep(transaction.id),
    onSuccess: async (response) => {
      if (!response.success && response.error) {
        if (response.error.code === 'E_BLOCKING_CONDITIONS') {
          const blocking = (response.error as any).blockingConditions ?? []
          handleBlockingError(blocking.length || blockingCount)
          return
        }
        if (response.error.code === 'E_REQUIRED_RESOLUTIONS_NEEDED') {
          // Show resolution modal for required conditions
          setResolutionModalOpen(true)
          return
        }
        toast({ title: t('common.error'), description: response.error.message, variant: 'destructive' })
        return
      }
      setBlockingBannerCount(null)
      const newStep = response.data?.newStep
      if (newStep) {
        const newSlug = newStep.workflowStep?.slug ?? ''
        const newName = newSlug
          ? t(`workflow.steps.${newSlug}`, { defaultValue: newStep.workflowStep?.name ?? '' })
          : newStep.workflowStep?.name ?? ''
        toast({
          title: t('common.success'),
          description: t('workflow.actions.advancedTo', { step: newName }),
          variant: 'success',
        })
      } else {
        // Last step completed — transaction finished
        toast({
          title: t('blocking.completionTitle'),
          description: t('blocking.completionMessage'),
          variant: 'success',
        })
      }
      await invalidateAll()
    },
    onError: (error: any) => {
      const errorData = error?.response?.data?.error
      if (errorData?.code === 'E_BLOCKING_CONDITIONS') {
        const blocking = errorData.blockingConditions ?? []
        handleBlockingError(blocking.length || blockingCount)
        return
      }
      if (errorData?.code === 'E_REQUIRED_RESOLUTIONS_NEEDED') {
        // Show resolution modal for required conditions
        setResolutionModalOpen(true)
        return
      }
      toast({ title: t('common.error'), variant: 'destructive' })
    },
  })

  const skipMutation = useMutation({
    mutationFn: () => transactionsApi.skipStep(transaction.id),
    onSuccess: async (response) => {
      if (!response.success && response.error) {
        toast({ title: t('common.error'), description: response.error.message, variant: 'destructive' })
        return
      }
      toast({ title: t('common.success'), description: t('workflow.actions.stepSkipped'), variant: 'success' })
      handleSkipDialogClose()
      setBlockingBannerCount(null)
      await invalidateAll()
    },
    onError: () => {
      toast({ title: t('common.error'), variant: 'destructive' })
    },
  })

  if (isCompleted) return null

  const canValidate = blockingCount === 0 && requiredCount === 0

  return (
    <>
      <TooltipProvider>
      <div className="mt-4 p-3 sm:p-4 rounded-xl bg-white border border-stone-200 shadow-sm" data-testid="action-zone">
        {/* Blocking banner (FR9) — shown after first modal dismissed */}
        {blockingBannerCount !== null && blockingBannerCount > 0 && !blockingModalOpen && (
          <div
            className="mb-3 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 relative"
            role="alert"
            data-testid="blocking-banner"
          >
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <p className="flex-1 text-sm text-red-700 font-medium">
              {t('blocking.bannerMessage', { count: blockingBannerCount })}
            </p>
            <button
              onClick={() => setBlockingBannerCount(null)}
              className="p-0.5 text-red-400 hover:text-red-600"
              aria-label={t('common.close')}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Summary badges row */}
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          {canValidate && recommendedCount === 0 ? (
            <span className="inline-flex items-center gap-1.5 text-sm text-emerald-600 font-medium">
              <CheckCircle2 className="w-4 h-4" />
              {t('actionZone.readyToAdvance')}
            </span>
          ) : (
            <>
              {blockingCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-medium">
                  {blockingCount} {t('actionZone.blocking')}
                </span>
              )}
              {requiredCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
                  {requiredCount} {t('actionZone.required')}
                </span>
              )}
              {nearestDays !== null && (
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                  nearestDays < 0 ? 'bg-red-50 text-red-600' : 'bg-stone-100 text-stone-500'
                }`}>
                  {nearestDays}j
                </span>
              )}
            </>
          )}
        </div>

        {/* CTA row: Valider l'étape + ... menu */}
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex-1">
                <button
                  onClick={handleAdvanceClick}
                  disabled={!canValidate || advanceMutation.isPending}
                  className={`w-full px-4 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                    canValidate
                      ? 'bg-primary text-white hover:bg-primary/90'
                      : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                  }`}
                  data-testid="advance-step-btn"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {advanceMutation.isPending ? t('common.loading') : t('actionZone.validateStep')}
                </button>
              </div>
            </TooltipTrigger>
            {!canValidate && (
              <TooltipContent>
                <p className="text-xs">{t('actionZone.validateStepTooltip', { blocking: blockingCount, required: requiredCount })}</p>
              </TooltipContent>
            )}
          </Tooltip>

          {/* Advanced menu (...) */}
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <button className="p-2 rounded-lg border border-stone-200 text-stone-400 hover:bg-stone-50 hover:text-stone-600">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">{t('actionZone.advancedActionsTooltip')}</p>
              </TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => setSkipDialogOpen(true)}
                disabled={skipMutation.isPending}
                className="gap-2"
              >
                <SkipForward className="w-3.5 h-3.5" />
                {t('workflow.actions.skip')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Hint text */}
        {!canValidate && (
          <p className="text-[11px] text-stone-400 mt-2 flex items-center gap-1">
            <Info className="w-3 h-3 shrink-0" />
            {t('actionZone.hint')}
          </p>
        )}
      </div>
      </TooltipProvider>

      {/* Skip confirmation dialog - strict or simple based on condition types */}
      <Dialog open={skipDialogOpen} onOpenChange={(open) => !open && handleSkipDialogClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className={`flex items-center gap-2 ${needsStrictValidation ? 'text-amber-600' : 'text-foreground'}`}>
              {needsStrictValidation && <AlertTriangle className="w-5 h-5" />}
              {t('workflow.skipConfirmModal.title')}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground pt-2">
              {getSkipWarningMessage()}
              {!needsStrictValidation && recommendedCount > 0 && (
                <span className="block mt-1 text-xs text-stone-500">
                  {t('workflow.skipConfirmModal.warningRecommendedHint', { count: recommendedCount })}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          {/* Reason field - always required */}
          <div className="space-y-2 py-2">
            <label className="text-sm font-medium">
              {t('workflow.skipConfirmModal.reasonLabel')} <span className="text-red-500">*</span>
            </label>
            <textarea
              value={skipReason}
              onChange={(e) => setSkipReason(e.target.value)}
              placeholder={t('workflow.skipConfirmModal.reasonPlaceholder')}
              className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background resize-none"
              rows={3}
            />
            {skipReason.trim().length > 0 && skipReason.trim().length < 10 && (
              <p className="text-xs text-amber-600">
                {t('workflow.skipConfirmModal.reasonMinLength', { count: 10 - skipReason.trim().length })}
              </p>
            )}
          </div>

          {/* Strict mode: Type-to-confirm + Terms checkbox */}
          {needsStrictValidation && (
            <div className="space-y-4">
              {/* Type-to-confirm instruction */}
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {t('workflow.skipConfirmModal.typePhrase')}
                </p>
                <p className="text-sm font-medium text-foreground bg-stone-100 dark:bg-stone-700 px-3 py-2 rounded-md border border-stone-200 dark:border-stone-600 select-all">
                  {confirmPhrase}
                </p>
                <input
                  type="text"
                  value={skipConfirmInput}
                  onChange={(e) => setSkipConfirmInput(e.target.value)}
                  placeholder={t('workflow.skipConfirmModal.inputPlaceholder')}
                  className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background"
                  autoComplete="off"
                  spellCheck="false"
                />
              </div>

              {/* Terms acceptance checkbox */}
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={skipTermsAccepted}
                  onChange={(e) => setSkipTermsAccepted(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-input accent-primary cursor-pointer"
                />
                <span className="text-sm text-muted-foreground">
                  {t('workflow.skipConfirmModal.termsLabel')}{' '}
                  <Link
                    to="/terms"
                    target="_blank"
                    className="text-primary hover:underline"
                  >
                    {t('workflow.skipConfirmModal.termsLink')}
                  </Link>
                  .
                </span>
              </label>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={handleSkipDialogClose}
              disabled={skipMutation.isPending}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant={needsStrictValidation ? 'warning' : 'default'}
              onClick={() => skipMutation.mutate()}
              disabled={!isSkipConfirmValid || skipMutation.isPending}
            >
              {skipMutation.isPending
                ? t('common.loading')
                : needsStrictValidation
                  ? t('workflow.skipConfirmModal.confirm')
                  : t('workflow.skipConfirmModal.confirmSimple')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Blocking modal — first-time pedagogical (FR7, FR8) z-index dialog(40) */}
      <Dialog open={blockingModalOpen} onOpenChange={(open) => !open && handleDismissModal()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('blocking.modalTitle')}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {t('blocking.modalMessage', { count: blockingBannerCount ?? blockingCount })}
          </p>
          <label className="flex items-center gap-2 mt-2">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="h-4 w-4 rounded border-input"
              data-testid="dont-show-again"
            />
            <span className="text-sm text-muted-foreground">
              {t('blocking.dontShowAgain')}
            </span>
          </label>
          <DialogFooter>
            <Button onClick={handleDismissModal} data-testid="blocking-modal-close">
              {t('common.close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Premium: Resolution Required Modal for Required conditions */}
      <ResolutionRequiredModal
        isOpen={resolutionModalOpen}
        onClose={() => setResolutionModalOpen(false)}
        onResolved={handleResolutionComplete}
        transactionId={transaction.id}
        conditions={[
          ...(advanceCheckData?.blockingConditions ?? []),
          ...(advanceCheckData?.requiredPendingConditions ?? []),
        ]}
      />
    </>
  )
}
