import { useTranslation } from 'react-i18next'
import { Check, SkipForward } from 'lucide-react'
import type { TransactionStep } from '../../api/transactions.api'

interface StepProgressBarProps {
  steps: TransactionStep[]
  currentStepId: number | null
  selectedStepId?: number | null
  onStepClick?: (stepId: number | null) => void
}

export default function StepProgressBar({ steps, currentStepId, selectedStepId, onStepClick }: StepProgressBarProps) {
  const { t } = useTranslation()

  const sorted = [...steps].sort((a, b) => a.stepOrder - b.stepOrder)
  const isClickable = !!onStepClick

  const handleStepClick = (stepId: number) => {
    if (!onStepClick) return
    // Toggle: if already selected, deselect (show all)
    onStepClick(selectedStepId === stepId ? null : stepId)
  }

  return (
    <div
      className="hidden sm:block mb-6"
      data-testid="step-progress-bar"
      role="list"
      aria-label={t('transaction.progress')}
    >
      <div className="flex items-start w-full">
        {sorted.map((step, index) => {
          const isDone = step.status === 'completed'
          const isActive = step.id === currentStepId
          const isSkipped = step.status === 'skipped'
          const isSelected = selectedStepId === step.id
          const slug = step.workflowStep?.slug ?? ''
          const label = slug
            ? t(`workflow.steps.${slug}`, { defaultValue: step.workflowStep?.name ?? `Step ${step.stepOrder}` })
            : step.workflowStep?.name ?? `Step ${step.stepOrder}`

          return (
            <div key={step.id} className="flex items-start flex-1 min-w-0" role="listitem">
              <div className="flex flex-col items-center flex-1 min-w-0">
                {/* Circle - clickable when onStepClick provided */}
                <button
                  type="button"
                  onClick={() => handleStepClick(step.id)}
                  disabled={!isClickable}
                  className={[
                    'w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all',
                    isClickable ? 'cursor-pointer hover:scale-110' : 'cursor-default',
                    isSelected
                      ? 'ring-2 ring-offset-2 ring-primary'
                      : '',
                    isDone
                      ? 'bg-success text-white'
                      : isActive
                        ? 'bg-primary text-primary-foreground ring-2 ring-primary/30 animate-pulse'
                        : isSkipped
                          ? 'bg-muted text-muted-foreground'
                          : 'bg-muted text-muted-foreground',
                  ].join(' ')}
                  aria-pressed={isSelected}
                  aria-label={`${label} - ${isDone ? t('workflow.status.completed') : isActive ? t('workflow.status.active') : t('workflow.status.pending')}`}
                  data-testid={`step-${step.id}`}
                >
                  {isDone ? (
                    <Check className="w-4 h-4" aria-hidden="true" />
                  ) : isSkipped ? (
                    <SkipForward className="w-3.5 h-3.5" aria-hidden="true" />
                  ) : (
                    <span className="text-xs font-bold">{step.stepOrder}</span>
                  )}
                </button>

                {/* Label */}
                <span
                  className={[
                    'mt-1.5 text-[10px] leading-tight font-medium text-center max-w-full px-1 truncate',
                    isSelected
                      ? 'text-primary font-bold underline'
                      : isDone
                        ? 'text-success'
                        : isActive
                          ? 'text-primary font-semibold'
                          : 'text-muted-foreground',
                  ].join(' ')}
                  title={label}
                >
                  {label}
                  {isSkipped && ` (${t('workflow.status.skipped').toLowerCase()})`}
                </span>
              </div>

              {/* Connector */}
              {index < sorted.length - 1 && (
                <div
                  className={[
                    'h-0.5 flex-1 mt-4 mx-1',
                    isDone ? 'bg-success' : 'bg-border',
                  ].join(' ')}
                  aria-hidden="true"
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
