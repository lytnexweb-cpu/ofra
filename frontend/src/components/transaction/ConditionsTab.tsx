import { useState, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronDown, ChevronRight, Plus } from 'lucide-react'
import type { Transaction } from '../../api/transactions.api'
import { conditionsApi, type Condition } from '../../api/conditions.api'
import { toast } from '../../hooks/use-toast'
import { Button } from '../ui/Button'
import ConditionCard from './ConditionCard'
import CreateConditionModal from '../CreateConditionModal'
import EditConditionModal from './EditConditionModal'
import ConditionValidationModal from './ConditionValidationModal'

interface ConditionsTabProps {
  transaction: Transaction
  /** D32: Filter conditions to show only those from a specific step */
  filterStepId?: number | null
}

interface StepGroup {
  stepId: number | null
  stepName: string
  stepOrder: number
  isCurrent: boolean
  isPast: boolean
  conditions: Condition[]
}

export default function ConditionsTab({ transaction, filterStepId }: ConditionsTabProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [showPastSteps, setShowPastSteps] = useState(false)
  const [togglingId, setTogglingId] = useState<number | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingCondition, setEditingCondition] = useState<Condition | null>(null)
  // D41: Validation modal for blocking/required conditions
  const [validatingCondition, setValidatingCondition] = useState<Condition | null>(null)

  // Compute step name for validation modal subtitle
  const validatingStepName = useMemo(() => {
    if (!validatingCondition) return undefined
    const step = steps.find((s) => s.id === validatingCondition.transactionStepId)
    if (!step) return undefined
    const slug = step.workflowStep?.slug ?? ''
    const name = slug
      ? t(`workflow.steps.${slug}`, { defaultValue: step.workflowStep?.name ?? '' })
      : step.workflowStep?.name ?? `Step ${step.stepOrder}`
    return `${t('resolveCondition.stepPrefix', 'Étape')} ${step.stepOrder} — ${name}`
  }, [validatingCondition, steps, t])

  // D32: Filter conditions by step if filterStepId is provided
  const allConditions = (transaction.conditions ?? []) as Condition[]
  const conditions = filterStepId != null
    ? allConditions.filter((c) => c.transactionStepId === filterStepId)
    : allConditions
  const steps = transaction.transactionSteps ?? []
  const currentStepId = transaction.currentStepId
  const transactionKey = ['transaction', transaction.id]

  // D32: Get selected step name for display
  const selectedStep = filterStepId != null
    ? steps.find((s) => s.id === filterStepId)
    : null
  const selectedStepName = selectedStep
    ? (selectedStep.workflowStep?.slug
        ? t(`workflow.steps.${selectedStep.workflowStep.slug}`, { defaultValue: selectedStep.workflowStep?.name ?? '' })
        : selectedStep.workflowStep?.name ?? `Step ${selectedStep.stepOrder}`)
    : null

  // Optimistic toggle mutation
  const toggleMutation = useMutation({
    mutationFn: async (condition: Condition) => {
      const newStatus = condition.status === 'completed' ? 'pending' : 'completed'
      return conditionsApi.update(condition.id, { status: newStatus })
    },
    onMutate: async (condition: Condition) => {
      setTogglingId(condition.id)
      await queryClient.cancelQueries({ queryKey: transactionKey })

      const previous = queryClient.getQueryData(transactionKey)

      // Optimistic update
      queryClient.setQueryData(transactionKey, (old: any) => {
        if (!old?.data?.transaction?.conditions) return old
        return {
          ...old,
          data: {
            ...old.data,
            transaction: {
              ...old.data.transaction,
              conditions: old.data.transaction.conditions.map((c: Condition) =>
                c.id === condition.id
                  ? {
                      ...c,
                      status: c.status === 'completed' ? 'pending' : 'completed',
                      completedAt: c.status === 'completed' ? null : new Date().toISOString(),
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
      if (context?.previous) {
        queryClient.setQueryData(transactionKey, context.previous)
      }
      toast({ title: t('common.error'), variant: 'destructive' })
    },
    onSettled: () => {
      setTogglingId(null)
      queryClient.invalidateQueries({ queryKey: transactionKey })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['advance-check', transaction.id] })
    },
  })

  // D41: Graduated friction - check condition level before toggling
  const handleToggle = useCallback((condition: Condition) => {
    if (togglingId) return

    const level = condition.level || (condition.isBlocking ? 'blocking' : 'recommended')
    const isCompleting = condition.status !== 'completed'
    const isUncompleting = condition.status === 'completed'

    // D41: Prevent unchecking blocking/required conditions (audit trail protection)
    if (isUncompleting && (level === 'blocking' || level === 'required')) {
      return
    }

    // All conditions being completed show the validation modal
    if (isCompleting) {
      setValidatingCondition(condition)
      return
    }

    // Uncompleting recommended conditions uses direct toggle
    toggleMutation.mutate(condition)
  }, [togglingId, toggleMutation])

  // D38: Handle edit condition
  const handleEdit = (condition: Condition) => {
    setEditingCondition(condition)
  }

  const groups = useMemo(() => {
    const sorted = [...steps].sort((a, b) => a.stepOrder - b.stepOrder)

    const currentStep = sorted.find((s) => s.id === currentStepId)
    const currentOrder = currentStep?.stepOrder ?? 0

    const groupMap = new Map<number | null, Condition[]>()
    for (const c of conditions) {
      const key = c.transactionStepId
      if (!groupMap.has(key)) groupMap.set(key, [])
      groupMap.get(key)!.push(c)
    }

    const result: StepGroup[] = []

    for (const step of sorted) {
      const stepConditions = groupMap.get(step.id)
      if (!stepConditions || stepConditions.length === 0) continue

      const slug = step.workflowStep?.slug ?? ''
      const name = slug
        ? t(`workflow.steps.${slug}`, { defaultValue: step.workflowStep?.name ?? '' })
        : step.workflowStep?.name ?? `Step ${step.stepOrder}`

      result.push({
        stepId: step.id,
        stepName: name,
        stepOrder: step.stepOrder,
        isCurrent: step.id === currentStepId,
        isPast: step.stepOrder < currentOrder,
        conditions: stepConditions.sort((a, b) => {
          if (a.isBlocking !== b.isBlocking) return a.isBlocking ? -1 : 1
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        }),
      })
    }

    const unassigned = groupMap.get(null)
    if (unassigned && unassigned.length > 0) {
      result.push({
        stepId: null,
        stepName: t('common.all'),
        stepOrder: 999,
        isCurrent: false,
        isPast: false,
        conditions: unassigned,
      })
    }

    return result
  }, [conditions, steps, currentStepId, t])

  const currentGroups = groups.filter((g) => g.isCurrent)
  const futureGroups = groups.filter((g) => !g.isCurrent && !g.isPast && g.stepId !== null)
  const pastGroups = groups.filter((g) => g.isPast)
  const unassignedGroups = groups.filter((g) => g.stepId === null)

  if (conditions.length === 0) {
    return (
      <div className="py-8 text-center" data-testid="conditions-empty">
        <div className="max-w-sm mx-auto">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Plus className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground mb-2">
            {t('conditions.emptyState.title', 'Aucune condition requise à cette étape')}
          </p>
          <p className="text-xs text-muted-foreground/70 mb-4">
            {t('conditions.emptyState.description', 'Vous pouvez ajouter des conditions personnalisées si nécessaire.')}
          </p>
          <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            {t('conditions.form.custom', 'Ajouter une condition')}
          </Button>
        </div>
        <CreateConditionModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          transactionId={transaction.id}
          currentStepOrder={transaction.currentStep?.stepOrder}
          existingConditions={allConditions}
        />
      </div>
    )
  }

  return (
    <div className="py-4 space-y-6" data-testid="conditions-tab">
      {/* D32: Step filter indicator + Header with Add button */}
      <div className="flex items-center justify-between gap-4">
        {selectedStepName ? (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">{t('conditions.filteringBy', 'Filtré par')}:</span>
            <span className="font-semibold text-primary">{selectedStepName}</span>
            <span className="text-muted-foreground">({conditions.length})</span>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            {t('conditions.allSteps', 'Toutes les étapes')} ({conditions.length})
          </div>
        )}
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          size="sm"
          className="gap-2"
          data-testid="add-condition-btn"
        >
          <Plus className="w-4 h-4" />
          {t('common.add')}
        </Button>
      </div>
      {currentGroups.map((group) => (
        <StepSection key={group.stepId} group={group} togglingId={togglingId} onToggle={handleToggle} onEdit={handleEdit} />
      ))}
      {futureGroups.map((group) => (
        <StepSection key={group.stepId} group={group} togglingId={togglingId} onToggle={handleToggle} onEdit={handleEdit} />
      ))}
      {unassignedGroups.map((group) => (
        <StepSection key="unassigned" group={group} togglingId={togglingId} onToggle={handleToggle} onEdit={handleEdit} />
      ))}

      {pastGroups.length > 0 && (
        <div>
          <button
            onClick={() => setShowPastSteps(!showPastSteps)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-3"
            data-testid="toggle-past-steps"
          >
            {showPastSteps ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            {t('workflow.status.completed')} ({pastGroups.reduce((n, g) => n + g.conditions.length, 0)})
          </button>
          {showPastSteps &&
            pastGroups.map((group) => (
              <StepSection key={group.stepId} group={group} togglingId={togglingId} onToggle={handleToggle} onEdit={handleEdit} />
            ))}
        </div>
      )}

      {/* Create Condition Modal */}
      <CreateConditionModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        transactionId={transaction.id}
        currentStepOrder={transaction.currentStep?.stepOrder}
        existingConditions={allConditions}
      />

      {/* D38: Edit Condition Modal */}
      <EditConditionModal
        condition={editingCondition}
        transactionId={transaction.id}
        isOpen={!!editingCondition}
        onClose={() => setEditingCondition(null)}
      />

      {/* D41: Validation Modal for blocking/required conditions */}
      {validatingCondition && (
        <ConditionValidationModal
          condition={validatingCondition}
          transactionId={transaction.id}
          isOpen={!!validatingCondition}
          onClose={() => setValidatingCondition(null)}
          stepName={validatingStepName}
          onSuccess={() => {
            // Invalidate queries after successful validation
            queryClient.invalidateQueries({ queryKey: transactionKey })
            queryClient.invalidateQueries({ queryKey: ['transactions'] })
            queryClient.invalidateQueries({ queryKey: ['dashboard'] })
            queryClient.invalidateQueries({ queryKey: ['advance-check', transaction.id] })
          }}
        />
      )}
    </div>
  )
}

function StepSection({
  group,
  togglingId,
  onToggle,
  onEdit,
}: {
  group: StepGroup
  togglingId: number | null
  onToggle: (c: Condition) => void
  onEdit: (c: Condition) => void
}) {
  return (
    <div data-testid={`step-group-${group.stepOrder}`}>
      <h3
        className={[
          'text-sm font-medium mb-2',
          group.isCurrent ? 'text-primary' : 'text-muted-foreground',
        ].join(' ')}
      >
        {group.stepName}
        {group.isCurrent && <span className="ml-2 text-xs text-primary/70">(current)</span>}
      </h3>
      <div className="space-y-2">
        {group.conditions.map((condition) => (
          <ConditionCard
            key={condition.id}
            condition={condition}
            interactive
            isToggling={togglingId === condition.id}
            onToggle={onToggle}
            onEdit={onEdit}
          />
        ))}
      </div>
    </div>
  )
}
