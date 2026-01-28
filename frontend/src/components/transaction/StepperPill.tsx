import { useTranslation } from 'react-i18next'
import { ChevronRight } from 'lucide-react'
import type { TransactionStep } from '../../api/transactions.api'

interface StepperPillProps {
  steps: TransactionStep[]
  currentStepId: number | null
  onClick?: () => void
}

export default function StepperPill({ steps, currentStepId, onClick }: StepperPillProps) {
  const { t } = useTranslation()

  const sorted = [...steps].sort((a, b) => a.stepOrder - b.stepOrder)
  const total = sorted.length
  const currentStep = sorted.find((s) => s.id === currentStepId)
  const currentOrder = currentStep?.stepOrder ?? 0
  const progress = total > 0 ? (currentOrder / total) * 100 : 0

  const slug = currentStep?.workflowStep?.slug ?? ''
  const stepName = slug
    ? t(`workflow.steps.${slug}`, { defaultValue: currentStep?.workflowStep?.name ?? '' })
    : currentStep?.workflowStep?.name ?? t('workflow.status.completed')

  return (
    <button
      type="button"
      onClick={onClick}
      className="sm:hidden w-full mb-4 rounded-lg border border-border bg-card p-3 text-left"
      data-testid="stepper-pill"
      aria-label={`${t('transaction.step')} ${currentOrder}/${total} — ${stepName}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-foreground">
          {t('transaction.step')} {currentOrder}/{total} — {stepName}
        </span>
        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden="true" />
      </div>

      {/* Progress bar */}
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${progress}%` }}
          role="progressbar"
          aria-label={t('transaction.progress')}
          aria-valuenow={currentOrder}
          aria-valuemin={0}
          aria-valuemax={total}
        />
      </div>
    </button>
  )
}
