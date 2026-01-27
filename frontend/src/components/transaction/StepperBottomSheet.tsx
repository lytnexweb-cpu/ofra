import { useTranslation } from 'react-i18next'
import { Check, SkipForward } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../ui/Sheet'
import type { TransactionStep } from '../../api/transactions.api'

interface StepperBottomSheetProps {
  isOpen: boolean
  onClose: () => void
  steps: TransactionStep[]
  currentStepId: number | null
}

export default function StepperBottomSheet({
  isOpen,
  onClose,
  steps,
  currentStepId,
}: StepperBottomSheetProps) {
  const { t } = useTranslation()

  const sorted = [...steps].sort((a, b) => a.stepOrder - b.stepOrder)

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{t('transaction.progress')}</SheetTitle>
        </SheetHeader>

        <div className="py-4 space-y-1" role="list" data-testid="stepper-sheet-list">
          {sorted.map((step) => {
            const isDone = step.status === 'completed'
            const isActive = step.id === currentStepId
            const isSkipped = step.status === 'skipped'
            const slug = step.workflowStep?.slug ?? ''
            const label = slug
              ? t(`workflow.steps.${slug}`, { defaultValue: step.workflowStep?.name ?? '' })
              : step.workflowStep?.name ?? `Step ${step.stepOrder}`

            return (
              <div
                key={step.id}
                role="listitem"
                className={[
                  'flex items-center gap-3 rounded-lg px-3 py-2.5',
                  isActive ? 'bg-primary/10 border border-primary/20' : '',
                ].join(' ')}
                data-testid={`sheet-step-${step.stepOrder}`}
              >
                {/* Status icon */}
                <div
                  className={[
                    'w-7 h-7 rounded-full flex items-center justify-center shrink-0',
                    isDone
                      ? 'bg-success text-white'
                      : isActive
                        ? 'bg-primary text-primary-foreground'
                        : isSkipped
                          ? 'bg-muted text-muted-foreground'
                          : 'bg-muted text-muted-foreground',
                  ].join(' ')}
                >
                  {isDone ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : isSkipped ? (
                    <SkipForward className="w-3 h-3" />
                  ) : (
                    <span className="text-xs font-bold">{step.stepOrder}</span>
                  )}
                </div>

                {/* Label + status text */}
                <div className="flex-1 min-w-0">
                  <p
                    className={[
                      'text-sm truncate',
                      isActive
                        ? 'font-semibold text-primary'
                        : isDone
                          ? 'text-success'
                          : 'text-muted-foreground',
                    ].join(' ')}
                  >
                    {label}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isDone
                      ? t('workflow.status.completed')
                      : isActive
                        ? t('workflow.status.active')
                        : isSkipped
                          ? t('workflow.status.skipped')
                          : t('workflow.status.pending')}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </SheetContent>
    </Sheet>
  )
}
