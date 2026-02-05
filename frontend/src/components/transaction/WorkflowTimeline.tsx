import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, SkipForward, Clock, ChevronDown, ChevronRight, Lock } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../ui/Sheet'
import { Button } from '../ui/Button'
import type { Transaction, TransactionStep } from '../../api/transactions.api'
import TimelineTab from './TimelineTab'

interface WorkflowTimelineProps {
  transaction: Transaction
  onConditionClick?: (conditionId: number) => void
}

export default function WorkflowTimeline({ transaction, onConditionClick }: WorkflowTimelineProps) {
  const { t } = useTranslation()
  const [expandedStepId, setExpandedStepId] = useState<number | null>(
    transaction.currentStepId
  )
  const [historyOpen, setHistoryOpen] = useState(false)

  const steps = [...(transaction.transactionSteps ?? [])].sort(
    (a, b) => a.stepOrder - b.stepOrder
  )
  const currentStepId = transaction.currentStepId

  const getStepStatus = (step: TransactionStep) => {
    if (step.status === 'completed') return 'completed'
    if (step.status === 'skipped') return 'skipped'
    if (step.id === currentStepId) return 'active'
    return 'pending'
  }

  const getStepConditions = (stepId: number) => {
    return (transaction.conditions ?? []).filter(
      (c) => c.transactionStepId === stepId
    )
  }

  const toggleStep = (stepId: number) => {
    setExpandedStepId(expandedStepId === stepId ? null : stepId)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-success text-white'
      case 'active':
        return 'bg-primary text-primary-foreground'
      case 'skipped':
        return 'bg-muted text-muted-foreground'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  const getConditionStatusIcon = (status: string) => {
    if (status === 'completed') {
      return <Check className="w-3 h-3 text-success" />
    }
    return <div className="w-3 h-3 rounded-full border-2 border-muted-foreground" />
  }

  return (
    <div className="space-y-2" data-testid="workflow-timeline">
      {steps.map((step, index) => {
        const status = getStepStatus(step)
        const isExpanded = expandedStepId === step.id
        const conditions = getStepConditions(step.id)
        const isPast = status === 'completed' || status === 'skipped'
        const isActive = status === 'active'
        const slug = step.workflowStep?.slug ?? ''
        const label = slug
          ? t(`workflow.steps.${slug}`, {
              defaultValue: step.workflowStep?.name ?? `Step ${step.stepOrder}`,
            })
          : step.workflowStep?.name ?? `Step ${step.stepOrder}`

        return (
          <div key={step.id} className="relative" data-testid={`timeline-step-${step.stepOrder}`}>
            {/* Connector line */}
            {index < steps.length - 1 && (
              <div
                className={`absolute left-[15px] top-8 w-0.5 h-[calc(100%-8px)] ${
                  isPast ? 'bg-success' : 'bg-border'
                }`}
                aria-hidden="true"
              />
            )}

            {/* Step row */}
            <button
              type="button"
              onClick={() => toggleStep(step.id)}
              className={`flex items-center gap-3 w-full text-left p-2 rounded-lg transition-colors ${
                isExpanded ? 'bg-muted/50' : 'hover:bg-muted/30'
              } ${isActive ? 'ring-1 ring-primary/30' : ''}`}
              aria-expanded={isExpanded}
              data-testid={`timeline-step-btn-${step.stepOrder}`}
            >
              {/* Status icon */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${getStatusColor(
                  status
                )} ${isActive ? 'animate-pulse' : ''}`}
              >
                {status === 'completed' ? (
                  <Check className="w-4 h-4" />
                ) : status === 'skipped' ? (
                  <SkipForward className="w-3.5 h-3.5" />
                ) : isActive ? (
                  <Clock className="w-4 h-4" />
                ) : (
                  <span className="text-xs font-bold">{step.stepOrder}</span>
                )}
              </div>

              {/* Label and status */}
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm truncate ${
                    isActive
                      ? 'font-semibold text-primary'
                      : isPast
                      ? 'text-success'
                      : 'text-muted-foreground'
                  }`}
                >
                  {label}
                </p>
                {conditions.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {conditions.filter((c) => c.status === 'completed').length}/
                    {conditions.length} {t('conditions.levels.completed', { defaultValue: 'completed' })}
                  </p>
                )}
              </div>

              {/* Expand indicator */}
              {conditions.length > 0 && (
                <div className="text-muted-foreground">
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </div>
              )}

              {/* Lock icon for past steps */}
              {isPast && conditions.length > 0 && (
                <Lock className="w-3.5 h-3.5 text-muted-foreground" />
              )}
            </button>

            {/* Conditions list (expanded) */}
            {isExpanded && conditions.length > 0 && (
              <div className="ml-11 mt-1 space-y-1 pb-2" data-testid={`timeline-conditions-${step.stepOrder}`}>
                {conditions.map((condition) => (
                  <button
                    key={condition.id}
                    type="button"
                    onClick={() => !isPast && onConditionClick?.(condition.id)}
                    disabled={isPast}
                    className={`flex items-center gap-2 w-full text-left px-2 py-1.5 rounded text-sm transition-colors ${
                      isPast
                        ? 'cursor-default opacity-60'
                        : 'hover:bg-muted/50 cursor-pointer'
                    }`}
                    data-testid={`timeline-condition-${condition.id}`}
                  >
                    {getConditionStatusIcon(condition.status)}
                    <span
                      className={`flex-1 truncate ${
                        condition.status === 'completed'
                          ? 'line-through text-muted-foreground'
                          : ''
                      }`}
                    >
                      {condition.title}
                    </span>
                    {condition.level === 'blocking' && condition.status !== 'completed' && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-destructive/10 text-destructive">
                        {t('conditions.levels.blocking')}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )
      })}

      {/* View full history button */}
      <div className="pt-4 border-t border-border mt-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setHistoryOpen(true)}
          className="w-full text-muted-foreground"
          data-testid="view-history-btn"
        >
          <Clock className="w-4 h-4 mr-2" />
          {t('tabs.viewFullHistory')}
        </Button>
      </div>

      {/* History drawer */}
      <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{t('tabs.viewFullHistory')}</SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            <TimelineTab transactionId={transaction.id} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
