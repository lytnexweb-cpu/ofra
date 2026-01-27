import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronDown, ChevronRight } from 'lucide-react'
import type { Transaction } from '../../api/transactions.api'
import { conditionsApi, type Condition } from '../../api/conditions.api'
import { toast } from '../../hooks/use-toast'
import ConditionCard from './ConditionCard'

interface ConditionsTabProps {
  transaction: Transaction
}

interface StepGroup {
  stepId: number | null
  stepName: string
  stepOrder: number
  isCurrent: boolean
  isPast: boolean
  conditions: Condition[]
}

export default function ConditionsTab({ transaction }: ConditionsTabProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [showPastSteps, setShowPastSteps] = useState(false)
  const [togglingId, setTogglingId] = useState<number | null>(null)

  const conditions = (transaction.conditions ?? []) as Condition[]
  const steps = transaction.transactionSteps ?? []
  const currentStepId = transaction.currentStepId
  const transactionKey = ['transaction', transaction.id]

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
    },
  })

  const handleToggle = (condition: Condition) => {
    if (togglingId) return
    toggleMutation.mutate(condition)
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
      <div className="py-8 text-center text-sm text-muted-foreground" data-testid="conditions-empty">
        {t('common.noResults')}
      </div>
    )
  }

  return (
    <div className="py-4 space-y-6" data-testid="conditions-tab">
      {currentGroups.map((group) => (
        <StepSection key={group.stepId} group={group} togglingId={togglingId} onToggle={handleToggle} />
      ))}
      {futureGroups.map((group) => (
        <StepSection key={group.stepId} group={group} togglingId={togglingId} onToggle={handleToggle} />
      ))}
      {unassignedGroups.map((group) => (
        <StepSection key="unassigned" group={group} togglingId={togglingId} onToggle={handleToggle} />
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
              <StepSection key={group.stepId} group={group} togglingId={togglingId} onToggle={handleToggle} />
            ))}
        </div>
      )}
    </div>
  )
}

function StepSection({
  group,
  togglingId,
  onToggle,
}: {
  group: StepGroup
  togglingId: number | null
  onToggle: (c: Condition) => void
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
          />
        ))}
      </div>
    </div>
  )
}
