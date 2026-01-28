import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { differenceInDays, parseISO } from '../../lib/date'
import { AlertTriangle, CheckCircle, Clock, ArrowRight, SkipForward, X } from 'lucide-react'
import { transactionsApi, type Transaction } from '../../api/transactions.api'
import type { Condition } from '../../api/conditions.api'
import { toast } from '../../hooks/use-toast'
import { Button } from '../ui/Button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/Dialog'
import ConfirmDialog from '../ConfirmDialog'

const BLOCKING_MODAL_KEY = 'ofra-blockingModalDismissed'

interface ActionZoneProps {
  transaction: Transaction
}

export default function ActionZone({ transaction }: ActionZoneProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [skipDialogOpen, setSkipDialogOpen] = useState(false)
  const [blockingModalOpen, setBlockingModalOpen] = useState(false)
  const [blockingBannerCount, setBlockingBannerCount] = useState<number | null>(null)
  const [dontShowAgain, setDontShowAgain] = useState(false)

  const transactionKey = ['transaction', transaction.id]
  const currentStepName = transaction.currentStep?.workflowStep?.name ?? ''
  const currentStepSlug = transaction.currentStep?.workflowStep?.slug ?? ''
  const stepLabel = currentStepSlug
    ? t(`workflow.steps.${currentStepSlug}`, { defaultValue: currentStepName })
    : currentStepName

  // Compute blocking conditions for current step
  const { blockingCount, nearestDays } = useMemo(() => {
    const conditions = (transaction.conditions ?? []) as Condition[]
    const currentStepId = transaction.currentStep?.id
    const blocking = conditions.filter(
      (c) => c.isBlocking && c.status === 'pending' && c.transactionStepId === currentStepId
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

    return { blockingCount: blocking.length, nearestDays: nearest === Infinity ? null : nearest }
  }, [transaction])

  const isCompleted = !transaction.currentStepId

  const invalidateAll = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: transactionKey }),
      queryClient.invalidateQueries({ queryKey: ['transactions'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
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

  const advanceMutation = useMutation({
    mutationFn: () => transactionsApi.advanceStep(transaction.id),
    onSuccess: async (response) => {
      if (!response.success && response.error) {
        if (response.error.code === 'E_BLOCKING_CONDITIONS') {
          const blocking = (response.error as any).blockingConditions ?? []
          handleBlockingError(blocking.length || blockingCount)
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
      setSkipDialogOpen(false)
      setBlockingBannerCount(null)
      await invalidateAll()
    },
    onError: () => {
      toast({ title: t('common.error'), variant: 'destructive' })
    },
  })

  if (isCompleted) return null

  return (
    <>
      <div className="mb-4 rounded-lg border border-border bg-card p-4" data-testid="action-zone">
        {/* Blocking banner (FR9) — shown after first modal dismissed */}
        {blockingBannerCount !== null && blockingBannerCount > 0 && !blockingModalOpen && (
          <div
            className="mb-3 flex items-center gap-2 rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 z-30 relative"
            role="alert"
            data-testid="blocking-banner"
          >
            <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
            <p className="flex-1 text-sm text-destructive font-medium">
              {t('blocking.bannerMessage', { count: blockingBannerCount })}
            </p>
            <button
              onClick={() => setBlockingBannerCount(null)}
              className="p-0.5 text-destructive/60 hover:text-destructive"
              aria-label={t('common.close')}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Left: status summary */}
          <div className="flex items-center gap-3 flex-wrap">
            {blockingCount > 0 ? (
              <span className="inline-flex items-center gap-1.5 text-sm text-destructive font-medium">
                <AlertTriangle className="w-4 h-4" />
                {t('actionZone.blockingCount', { count: blockingCount })}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-sm text-success font-medium">
                <CheckCircle className="w-4 h-4" />
                {t('actionZone.readyToAdvance')}
              </span>
            )}

            {nearestDays !== null && (
              <span
                className={[
                  'inline-flex items-center gap-1 text-sm',
                  nearestDays < 0 ? 'text-destructive' : nearestDays <= 7 ? 'text-warning' : 'text-muted-foreground',
                ].join(' ')}
              >
                <Clock className="w-3.5 h-3.5" />
                {t('actionZone.deadline')}: {nearestDays}j
              </span>
            )}
          </div>

          {/* Right: action buttons */}
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSkipDialogOpen(true)}
              disabled={skipMutation.isPending}
              className="flex-1 sm:flex-none gap-1.5"
              data-testid="skip-step-btn"
            >
              <SkipForward className="w-3.5 h-3.5" />
              {t('workflow.actions.skip')}
            </Button>
            <Button
              size="sm"
              onClick={() => advanceMutation.mutate()}
              disabled={advanceMutation.isPending}
              className="flex-1 sm:flex-none gap-1.5"
              data-testid="advance-step-btn"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              {advanceMutation.isPending ? t('common.loading') : t('workflow.actions.advance')}
            </Button>
          </div>
        </div>
      </div>

      {/* Skip confirmation dialog */}
      <ConfirmDialog
        isOpen={skipDialogOpen}
        onClose={() => setSkipDialogOpen(false)}
        onConfirm={() => skipMutation.mutate()}
        title={t('workflow.actions.skip')}
        message={t('workflow.actions.skipConfirm', { step: stepLabel })}
        confirmLabel={t('workflow.actions.skip')}
        cancelLabel={t('common.cancel')}
        variant="warning"
        isLoading={skipMutation.isPending}
      />

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
    </>
  )
}
