import { useState, useEffect, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Check,
  Clock,
  ChevronDown,
  Lock,
  SkipForward,
  Plus,
  FileText,
  ExternalLink,
  Shield,
  AlertTriangle,
  Lightbulb,
  Info,
} from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../ui/Sheet'
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
      Icon: Shield,
      label: t('conditions.levels.blocking'),
      iconColor: 'text-red-500',
      textColor: 'text-red-600',
    },
    required: {
      Icon: AlertTriangle,
      label: t('conditions.levels.required'),
      iconColor: 'text-amber-500',
      textColor: 'text-amber-600',
    },
    recommended: {
      Icon: Lightbulb,
      label: t('conditions.levels.recommended'),
      iconColor: 'text-emerald-500',
      textColor: 'text-stone-500',
    },
  }
  const { Icon, label, iconColor, textColor } = config[level]

  return (
    <div className="flex items-center gap-1.5 mb-1.5">
      <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
      <span className={`text-[11px] tracking-[0.5px] uppercase font-semibold ${textColor}`}>
        {label} ({count})
      </span>
    </div>
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
      <h4 className="text-[11px] tracking-[0.5px] uppercase font-semibold text-stone-500 mb-2">
        {t('tabs.documents')} ({docs.length})
      </h4>
      <div className="space-y-1.5">
        {docs.map((doc, i) => (
          <a
            key={i}
            href={doc.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-stone-700 hover:text-primary transition-colors"
          >
            <FileText className="w-4 h-4 text-primary shrink-0" />
            <span className="truncate">{doc.label}</span>
            <ExternalLink className="w-3 h-3 text-stone-400 shrink-0" />
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
      if (step.id === currentStepId || step.status === 'active') return 'active' as const
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
      queryClient.invalidateQueries({ queryKey: ['advance-check', transaction.id] })
      queryClient.invalidateQueries({ queryKey: ['conditions', 'active', transaction.id] })
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

      // All conditions being completed show the validation modal
      if (isCompleting) {
        setValidatingCondition(condition)
        return
      }

      // Uncompleting recommended conditions uses direct toggle
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
      <p className="text-center text-sm text-stone-400 py-8">
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
            {/* === PAST STEP === */}
            {isPast && (
              <div className="relative flex gap-3 sm:gap-4">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shrink-0 ${
                      status === 'skipped'
                        ? 'bg-stone-300'
                        : 'bg-emerald-500'
                    }`}
                  >
                    {status === 'skipped' ? (
                      <SkipForward className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                    ) : (
                      <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                    )}
                  </div>
                  {!isLast && (
                    <div className={`w-0.5 flex-1 min-h-[20px] ${status === 'skipped' ? 'bg-stone-200' : 'bg-emerald-300'}`} />
                  )}
                </div>
                <div className="flex-1 pb-4 sm:pb-5">
                  <button
                    type="button"
                    onClick={() =>
                      conditions.length > 0
                        ? setExpandedPastStepId(
                            isPastExpanded ? null : step.id
                          )
                        : undefined
                    }
                    className={`w-full flex items-center justify-between text-left ${
                      conditions.length > 0 ? 'cursor-pointer' : 'cursor-default'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`text-sm font-semibold ${
                          status === 'skipped'
                            ? 'text-stone-400'
                            : 'text-stone-900'
                        }`}
                      >
                        {step.stepOrder}. {label}
                      </span>
                      {step.completedAt && (
                        <span className="text-xs text-stone-400 hidden sm:inline">
                          {formatDate(step.completedAt, 'd MMM')}
                        </span>
                      )}
                      <Lock className="w-3 h-3 text-stone-400" />
                    </div>
                    {conditions.length > 0 && (
                      <ChevronDown className="w-4 h-4 text-stone-400 shrink-0" />
                    )}
                  </button>
                  {conditions.length > 0 && (
                    <div className="mt-1 text-xs text-stone-400">
                      {conditions.length} conditions
                    </div>
                  )}

                  {/* Expanded past step — read-only conditions */}
                  {isPastExpanded && conditions.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center gap-2 mb-2">
                        <Lock className="w-3.5 h-3.5 text-stone-400" />
                        <span className="text-xs text-stone-400 font-medium">
                          {t('timeline.readOnly')}
                        </span>
                      </div>
                      {conditions.map((condition) => (
                        <ConditionCard
                          key={condition.id}
                          condition={condition}
                          interactive={false}
                          showResolution
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* === CURRENT STEP === */}
            {isActive && grouped && (
              <div className="relative flex gap-3 sm:gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary flex items-center justify-center shrink-0 ring-4 ring-primary/20">
                    <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white animate-pulse" />
                  </div>
                  {!isLast && (
                    <div className="w-0.5 flex-1 bg-stone-200 min-h-[20px]" />
                  )}
                </div>
                <div className="flex-1 pb-4 sm:pb-6">
                  <div className="mb-3">
                    <span className="text-sm font-bold text-primary">
                      {step.stepOrder}. {label}
                    </span>
                    {daysSince !== null && daysSince > 0 && (
                      <span className="text-xs text-stone-400 ml-2">
                        {t('timeline.sinceDays', { count: daysSince })}
                      </span>
                    )}
                  </div>

                  {/* Conditions grouped by level: blocking → required → recommended */}
                  <div className="space-y-3">
                    {grouped.blocking.length > 0 && (
                      <div>
                        <LevelHeader
                          level="blocking"
                          count={grouped.blocking.length}
                        />
                        <div className="space-y-1.5 ml-5">
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
                        <div className="space-y-1.5 ml-5">
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
                        <div className="space-y-1.5 ml-5">
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
                          {/* Auto-archive hint */}
                          <p className="text-[10px] text-stone-400 italic ml-1 flex items-center gap-1">
                            <Info className="w-3 h-3 shrink-0" />
                            {t('timeline.autoArchiveHint')}
                          </p>
                        </div>
                      </div>
                    )}

                    {grouped.blocking.length === 0 &&
                      grouped.required.length === 0 &&
                      grouped.recommended.length === 0 && (
                        <p className="text-sm text-stone-400 py-2">
                          {t('timeline.noConditions')}
                        </p>
                      )}
                  </div>

                  {/* Inline actions */}
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => setIsCreateModalOpen(true)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-primary hover:bg-primary/5 rounded-lg border border-stone-200"
                      data-testid="timeline-add-condition"
                    >
                      <Plus className="w-3 h-3" />
                      {t('timeline.addCondition')}
                    </button>
                  </div>

                  {/* Action Zone */}
                  <ActionZone transaction={transaction} />

                  {/* Notes */}
                  <NotesSection transactionId={transaction.id} />

                  {/* Documents from conditions */}
                  <InlineDocuments
                    conditions={[
                      ...conditions,
                      ...allConditions.filter(
                        (c) => c.transactionStepId === null
                      ),
                    ]}
                  />
                </div>
              </div>
            )}

            {/* === FUTURE STEP === */}
            {isFuture && (
              <div className="relative flex gap-3 sm:gap-4 opacity-50">
                <div className="flex flex-col items-center">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-stone-300 flex items-center justify-center shrink-0">
                    <span className="text-xs font-semibold text-stone-400">
                      {step.stepOrder}
                    </span>
                  </div>
                  {!isLast && (
                    <div className="w-0.5 flex-1 bg-stone-200 min-h-[16px]" />
                  )}
                </div>
                <div className="flex-1 pb-3 sm:pb-4 pt-1">
                  <span className="text-sm font-semibold text-stone-500">
                    {step.stepOrder}. {label}
                  </span>
                </div>
              </div>
            )}
          </div>
        )
      })}

      {/* Completed transaction state */}
      {!currentStepId && steps.length > 0 && (
        <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center">
          <div className="text-3xl mb-2">{'\u2705'}</div>
          <p className="text-emerald-700 font-semibold text-lg">
            {t('timeline.transactionCompleted')}
          </p>
        </div>
      )}

      {/* View full history */}
      <div className="mt-4 text-center">
        <button
          onClick={() => setHistoryOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm text-stone-500 hover:text-primary hover:bg-stone-100 rounded-lg transition-colors"
          data-testid="view-history-btn"
        >
          <Clock className="w-4 h-4" />
          {t('tabs.viewFullHistory')}
        </button>
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
        existingConditions={allConditions}
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
            queryClient.invalidateQueries({ queryKey: ['advance-check', transaction.id] })
            queryClient.invalidateQueries({ queryKey: ['conditions', 'active', transaction.id] })
          }}
        />
      )}
    </div>
  )
}
