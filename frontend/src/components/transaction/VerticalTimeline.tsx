import { useState, useEffect, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Check,
  Clock,
  ChevronDown,
  ChevronRight,
  Lock,
  SkipForward,
  Plus,
  FileText,
  ExternalLink,
  Sparkles,
} from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../ui/Sheet'
import { Button } from '../ui/Button'
import type { Transaction, TransactionStep } from '../../api/transactions.api'
import { conditionsApi, type Condition } from '../../api/conditions.api'
import { toast } from '../../hooks/use-toast'
import { differenceInDays, formatDate } from '../../lib/date'
import ConditionCard from './ConditionCard'
import CreateConditionModal from '../CreateConditionModal'
import EditConditionModal from './EditConditionModal'
import ConditionValidationModal from './ConditionValidationModal'
import ActionZone from './ActionZone'
import NotesSection from './NotesSection'
import TimelineTab from './TimelineTab'

interface VerticalTimelineProps {
  transaction: Transaction
  highlightConditionId?: string | null
  onOpenSuggestions?: () => void
}

// --- Internal sub-components ---

function LevelHeader({
  level,
  count,
}: {
  level: 'blocking' | 'required' | 'recommended'
  count: number
}) {
  const { t } = useTranslation()
  const config = {
    blocking: {
      emoji: '\uD83D\uDD34',
      label: t('conditions.levels.blocking'),
      color: 'text-red-600 dark:text-red-400',
    },
    required: {
      emoji: '\uD83D\uDFE1',
      label: t('conditions.levels.required'),
      color: 'text-yellow-600 dark:text-yellow-400',
    },
    recommended: {
      emoji: '\uD83D\uDFE2',
      label: t('conditions.levels.recommended'),
      color: 'text-green-600 dark:text-green-400',
    },
  }
  const { emoji, label, color } = config[level]

  return (
    <h4
      className={`text-xs font-bold uppercase tracking-wide mb-2 ${color}`}
    >
      {emoji} {label} ({count})
    </h4>
  )
}

function InlineDocuments({ conditions }: { conditions: Condition[] }) {
  const { t } = useTranslation()
  const docs = conditions
    .filter((c) => c.documentUrl)
    .map((c) => ({
      url: c.documentUrl!,
      label: c.documentLabel || c.title,
    }))

  if (docs.length === 0) return null

  return (
    <div>
      <h4 className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">
        {'\uD83D\uDCCE'} {t('tabs.documents')} ({docs.length})
      </h4>
      <div className="space-y-1.5">
        {docs.map((doc, i) => (
          <a
            key={i}
            href={doc.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors"
          >
            <FileText className="w-4 h-4 text-primary shrink-0" />
            <span className="truncate">{doc.label}</span>
            <ExternalLink className="w-3 h-3 text-muted-foreground shrink-0" />
          </a>
        ))}
      </div>
    </div>
  )
}

// --- Main component ---

export default function VerticalTimeline({
  transaction,
  highlightConditionId,
  onOpenSuggestions,
}: VerticalTimelineProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const [expandedPastStepId, setExpandedPastStepId] = useState<number | null>(
    null
  )
  const [historyOpen, setHistoryOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingCondition, setEditingCondition] = useState<Condition | null>(
    null
  )
  const [validatingCondition, setValidatingCondition] =
    useState<Condition | null>(null)
  const [togglingId, setTogglingId] = useState<number | null>(null)

  const steps = useMemo(
    () =>
      [...(transaction.transactionSteps ?? [])].sort(
        (a, b) => a.stepOrder - b.stepOrder
      ),
    [transaction.transactionSteps]
  )
  const currentStepId = transaction.currentStepId
  const allConditions = (transaction.conditions ?? []) as Condition[]
  const transactionKey = ['transaction', transaction.id]

  const getStepStatus = useCallback(
    (step: TransactionStep) => {
      if (step.status === 'completed') return 'completed' as const
      if (step.status === 'skipped') return 'skipped' as const
      if (step.id === currentStepId) return 'active' as const
      return 'pending' as const
    },
    [currentStepId]
  )

  const getStepConditions = useCallback(
    (stepId: number) => {
      return allConditions.filter((c) => c.transactionStepId === stepId)
    },
    [allConditions]
  )

  const getStepLabel = useCallback(
    (step: TransactionStep) => {
      const slug = step.workflowStep?.slug ?? ''
      return slug
        ? t(`workflow.steps.${slug}`, {
            defaultValue:
              step.workflowStep?.name ?? `Step ${step.stepOrder}`,
          })
        : step.workflowStep?.name ?? `Step ${step.stepOrder}`
    },
    [t]
  )

  // Group conditions by level for the current step
  const groupConditionsByLevel = useCallback((conditions: Condition[]) => {
    const blocking: Condition[] = []
    const required: Condition[] = []
    const recommended: Condition[] = []

    for (const c of conditions) {
      const level = c.level || (c.isBlocking ? 'blocking' : 'recommended')
      if (level === 'blocking') blocking.push(c)
      else if (level === 'required') required.push(c)
      else recommended.push(c)
    }

    const sortFn = (a: Condition, b: Condition) => {
      // Pending first, completed last
      if (a.status === 'completed' && b.status !== 'completed') return 1
      if (a.status !== 'completed' && b.status === 'completed') return -1
      // Then by due date
      if (!a.dueDate) return 1
      if (!b.dueDate) return -1
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    }

    return {
      blocking: blocking.sort(sortFn),
      required: required.sort(sortFn),
      recommended: recommended.sort(sortFn),
    }
  }, [])

  // Optimistic toggle mutation (replicated from ConditionsTab)
  const toggleMutation = useMutation({
    mutationFn: async (condition: Condition) => {
      const newStatus =
        condition.status === 'completed' ? 'pending' : 'completed'
      return conditionsApi.update(condition.id, { status: newStatus })
    },
    onMutate: async (condition: Condition) => {
      setTogglingId(condition.id)
      await queryClient.cancelQueries({ queryKey: transactionKey })
      const previous = queryClient.getQueryData(transactionKey)

      queryClient.setQueryData(transactionKey, (old: any) => {
        if (!old?.data?.transaction?.conditions) return old
        return {
          ...old,
          data: {
            ...old.data,
            transaction: {
              ...old.data.transaction,
              conditions: old.data.transaction.conditions.map(
                (c: Condition) =>
                  c.id === condition.id
                    ? {
                        ...c,
                        status:
                          c.status === 'completed' ? 'pending' : 'completed',
                        completedAt:
                          c.status === 'completed'
                            ? null
                            : new Date().toISOString(),
                      }
                    : c
              ),
            },
          },
        }
      })

      return { previous }
    },
    onError: (_err, _condition, context) => {
      if (context?.previous)
        queryClient.setQueryData(transactionKey, context.previous)
      toast({ title: t('common.error'), variant: 'destructive' })
    },
    onSettled: () => {
      setTogglingId(null)
      queryClient.invalidateQueries({ queryKey: transactionKey })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({
        queryKey: ['advance-check', transaction.id],
      })
    },
  })

  // D41: Graduated friction
  const handleToggle = useCallback(
    (condition: Condition) => {
      if (togglingId) return
      const level =
        condition.level || (condition.isBlocking ? 'blocking' : 'recommended')
      const isCompleting = condition.status !== 'completed'
      const isUncompleting = condition.status === 'completed'

      // D41: Prevent unchecking blocking/required (locked once completed)
      if (isUncompleting && (level === 'blocking' || level === 'required'))
        return

      // D41: Show validation modal for completing blocking/required
      if (isCompleting && (level === 'blocking' || level === 'required')) {
        setValidatingCondition(condition)
        return
      }

      toggleMutation.mutate(condition)
    },
    [togglingId, toggleMutation]
  )

  const handleEdit = useCallback((condition: Condition) => {
    setEditingCondition(condition)
  }, [])

  // Scroll to highlighted condition
  useEffect(() => {
    if (!highlightConditionId) return
    const timer = setTimeout(() => {
      const el = document.querySelector(
        `[data-condition-id="${highlightConditionId}"]`
      )
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        el.classList.add('ring-2', 'ring-primary')
        const cleanup = setTimeout(
          () => el.classList.remove('ring-2', 'ring-primary'),
          3000
        )
        return () => clearTimeout(cleanup)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [highlightConditionId, allConditions])

  if (steps.length === 0) {
    return (
      <p className="text-center text-sm text-muted-foreground py-8">
        {t('common.noResults')}
      </p>
    )
  }

  return (
    <div className="space-y-0" data-testid="vertical-timeline">
      {steps.map((step, index) => {
        const status = getStepStatus(step)
        const isActive = status === 'active'
        const isPast = status === 'completed' || status === 'skipped'
        const isFuture = status === 'pending'
        const conditions = getStepConditions(step.id)
        const isLast = index === steps.length - 1
        const isPastExpanded = expandedPastStepId === step.id
        const label = getStepLabel(step)

        // Compute only for current step
        const daysSince =
          isActive && step.enteredAt
            ? differenceInDays(new Date(), new Date(step.enteredAt))
            : null
        const grouped = isActive
          ? groupConditionsByLevel([
              ...conditions,
              // Include unassigned conditions in the current step
              ...allConditions.filter((c) => c.transactionStepId === null),
            ])
          : null

        return (
          <div
            key={step.id}
            className="relative"
            data-testid={`vt-step-${step.stepOrder}`}
          >
            {/* Connector line */}
            {!isLast && (
              <div
                className={`absolute left-[15px] top-8 w-0.5 ${
                  isPast
                    ? 'bg-success'
                    : isActive
                      ? 'bg-primary/30'
                      : 'bg-border'
                }`}
                style={{ height: 'calc(100% - 8px)' }}
                aria-hidden="true"
              />
            )}

            {/* === PAST STEP === */}
            {isPast && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    conditions.length > 0
                      ? setExpandedPastStepId(
                          isPastExpanded ? null : step.id
                        )
                      : undefined
                  }
                  className={`flex items-center gap-3 w-full text-left py-2 px-1 rounded-lg transition-colors ${
                    conditions.length > 0
                      ? 'hover:bg-muted/30 cursor-pointer'
                      : 'cursor-default'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      status === 'skipped'
                        ? 'bg-muted text-muted-foreground'
                        : 'bg-success text-white'
                    }`}
                  >
                    {status === 'skipped' ? (
                      <SkipForward className="w-3.5 h-3.5" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                  </div>
                  <span
                    className={`text-sm flex-1 ${
                      status === 'skipped'
                        ? 'text-muted-foreground'
                        : 'text-success'
                    }`}
                  >
                    {step.stepOrder}. {label}
                  </span>
                  {step.completedAt && (
                    <span className="text-xs text-muted-foreground">
                      {formatDate(step.completedAt, 'd MMM')}
                    </span>
                  )}
                  {conditions.length > 0 && (
                    <div className="text-muted-foreground">
                      {isPastExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </div>
                  )}
                </button>

                {/* B2: Past step expanded — read-only conditions */}
                {isPastExpanded && conditions.length > 0 && (
                  <div className="ml-[15px] pl-6 border-l-2 border-success/20 pb-2">
                    <div className="flex items-center gap-2 mb-3 mt-1">
                      <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground font-medium">
                        {t('timeline.readOnly')}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {conditions.map((condition) => (
                        <ConditionCard
                          key={condition.id}
                          condition={condition}
                          interactive={false}
                          showResolution
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* === CURRENT STEP === */}
            {isActive && grouped && (
              <>
                {/* Current step header with horizontal rule */}
                <div className="flex items-center gap-3 py-2 px-1">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 animate-pulse">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="flex-1 flex items-center gap-2 min-w-0">
                    <span className="font-bold text-primary whitespace-nowrap text-sm">
                      {step.stepOrder}. {label.toUpperCase()}
                    </span>
                    <div className="flex-1 h-px bg-primary/20" />
                    {daysSince !== null && daysSince > 0 && (
                      <span className="text-xs text-primary/70 whitespace-nowrap">
                        {t('timeline.sinceDays', { count: daysSince })}
                      </span>
                    )}
                  </div>
                </div>

                {/* Current step content */}
                <div className="ml-[15px] pl-6 border-l-2 border-primary/20 pb-4 space-y-4">
                  {/* Conditions grouped by level: blocking → required → recommended */}
                  {grouped.blocking.length > 0 && (
                    <div>
                      <LevelHeader
                        level="blocking"
                        count={grouped.blocking.length}
                      />
                      <div className="space-y-2">
                        {grouped.blocking.map((c) => (
                          <ConditionCard
                            key={c.id}
                            condition={c}
                            interactive
                            isToggling={togglingId === c.id}
                            onToggle={handleToggle}
                            onEdit={handleEdit}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {grouped.required.length > 0 && (
                    <div>
                      <LevelHeader
                        level="required"
                        count={grouped.required.length}
                      />
                      <div className="space-y-2">
                        {grouped.required.map((c) => (
                          <ConditionCard
                            key={c.id}
                            condition={c}
                            interactive
                            isToggling={togglingId === c.id}
                            onToggle={handleToggle}
                            onEdit={handleEdit}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {grouped.recommended.length > 0 && (
                    <div>
                      <LevelHeader
                        level="recommended"
                        count={grouped.recommended.length}
                      />
                      <div className="space-y-2">
                        {grouped.recommended.map((c) => (
                          <ConditionCard
                            key={c.id}
                            condition={c}
                            interactive
                            isToggling={togglingId === c.id}
                            onToggle={handleToggle}
                            onEdit={handleEdit}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {grouped.blocking.length === 0 &&
                    grouped.required.length === 0 &&
                    grouped.recommended.length === 0 && (
                      <p className="text-sm text-muted-foreground py-2">
                        {t('timeline.noConditions')}
                      </p>
                    )}

                  {/* + Add condition + Suggestions */}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsCreateModalOpen(true)}
                      className="gap-1.5 text-muted-foreground hover:text-foreground"
                      data-testid="timeline-add-condition"
                    >
                      <Plus className="w-4 h-4" />
                      {t('timeline.addCondition')}
                    </Button>
                    {onOpenSuggestions && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={onOpenSuggestions}
                        className="gap-1.5 text-primary/70 hover:text-primary"
                        data-testid="timeline-suggestions"
                      >
                        <Sparkles className="w-4 h-4" />
                        {t('suggestions.openPanel')}
                      </Button>
                    )}
                  </div>

                  {/* Documents from conditions */}
                  <InlineDocuments
                    conditions={[
                      ...conditions,
                      ...allConditions.filter(
                        (c) => c.transactionStepId === null
                      ),
                    ]}
                  />

                  {/* Notes */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">
                      {'\uD83D\uDCDD'} {t('tabs.notes')}
                    </h4>
                    <NotesSection transactionId={transaction.id} />
                  </div>

                  {/* Action Zone: advance/skip buttons */}
                  <ActionZone transaction={transaction} />
                </div>
              </>
            )}

            {/* === FUTURE STEP === */}
            {isFuture && (
              <div className="flex items-center gap-3 py-2 px-1 opacity-50">
                <div className="w-8 h-8 rounded-full border-2 border-muted flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-muted-foreground">
                    {step.stepOrder}
                  </span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {step.stepOrder}. {label}
                </span>
              </div>
            )}
          </div>
        )
      })}

      {/* Completed transaction state */}
      {!currentStepId && steps.length > 0 && (
        <div className="mt-4 bg-success/10 border border-success/20 rounded-xl p-6 text-center">
          <div className="text-3xl mb-2">{'\u2705'}</div>
          <p className="text-success font-semibold text-lg">
            {t('timeline.transactionCompleted')}
          </p>
        </div>
      )}

      {/* View full history */}
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
        <SheetContent
          side="right"
          className="w-full sm:max-w-lg overflow-y-auto"
        >
          <SheetHeader>
            <SheetTitle>{t('tabs.viewFullHistory')}</SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            <TimelineTab transactionId={transaction.id} />
          </div>
        </SheetContent>
      </Sheet>

      {/* Create Condition Modal */}
      <CreateConditionModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        transactionId={transaction.id}
        currentStepOrder={transaction.currentStep?.stepOrder}
      />

      {/* Edit Condition Modal */}
      <EditConditionModal
        condition={editingCondition}
        transactionId={transaction.id}
        isOpen={!!editingCondition}
        onClose={() => setEditingCondition(null)}
      />

      {/* D41: Validation Modal for blocking/required */}
      {validatingCondition && (
        <ConditionValidationModal
          condition={validatingCondition}
          transactionId={transaction.id}
          isOpen={!!validatingCondition}
          onClose={() => setValidatingCondition(null)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: transactionKey })
            queryClient.invalidateQueries({ queryKey: ['transactions'] })
            queryClient.invalidateQueries({ queryKey: ['dashboard'] })
            queryClient.invalidateQueries({
              queryKey: ['advance-check', transaction.id],
            })
          }}
        />
      )}
    </div>
  )
}
