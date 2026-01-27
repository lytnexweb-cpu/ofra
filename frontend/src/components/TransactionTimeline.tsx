import type { TransactionWithTimeline } from '../api/clients.api'
import type { TransactionStep } from '../api/transactions.api'
import type { Condition } from '../api/conditions.api'

interface TransactionTimelineProps {
  transaction: TransactionWithTimeline
}

const conditionTypeLabels: Record<string, string> = {
  financing: 'Financing',
  deposit: 'Deposit',
  inspection: 'Inspection',
  water_test: 'Water Test',
  rpds_review: 'RPDS',
  appraisal: 'Appraisal',
  legal: 'Legal',
  documents: 'Documents',
  repairs: 'Repairs',
  other: 'Other',
}

const priorityColors = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-red-100 text-red-700',
}

const stepStatusColors: Record<string, string> = {
  completed: 'bg-green-500 border-green-500',
  active: 'bg-blue-500 border-blue-500',
  skipped: 'bg-gray-300 border-gray-300',
  pending: 'bg-white border-gray-300',
}

export default function TransactionTimeline({ transaction }: TransactionTimelineProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Sort steps by stepOrder
  const steps = [...(transaction.transactionSteps || [])].sort(
    (a, b) => a.stepOrder - b.stepOrder
  )

  // Get conditions for a specific step
  const getConditionsForStep = (stepId: number): Condition[] => {
    return (transaction.conditions || [])
      .filter((c) => c.transactionStepId === stepId)
      .sort((a, b) => {
        if (a.status !== b.status) {
          return a.status === 'pending' ? -1 : 1
        }
        if (!a.dueDate) return 1
        if (!b.dueDate) return -1
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      })
  }

  // Determine if transaction is completed (no current step)
  const isCompleted = !transaction.currentStepId

  // Calculate progress
  const totalSteps = steps.length
  const completedSteps = steps.filter((s) => s.status === 'completed').length

  return (
    <div className="space-y-6">
      {/* Current Status Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-blue-600 font-medium">Current Step</p>
            <p className="text-lg font-semibold text-blue-900">
              {isCompleted
                ? 'Completed'
                : transaction.currentStep?.workflowStep?.name || 'Unknown'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-blue-600">Progress</p>
            <p className="text-lg font-semibold text-blue-900">
              {completedSteps} / {totalSteps} steps
            </p>
          </div>
        </div>
        <div className="mt-2 pt-2 border-t border-blue-200 flex items-center gap-4">
          <div>
            <p className="text-sm text-blue-600">Type</p>
            <p className="text-sm font-semibold text-blue-900">
              {transaction.type === 'purchase' ? 'Purchase' : 'Sale'}
            </p>
          </div>
          {transaction.salePrice && (
            <div>
              <p className="text-sm text-blue-600">Price</p>
              <p className="text-sm font-bold text-blue-900">
                {transaction.salePrice.toLocaleString('en-US', {
                  style: 'currency',
                  currency: 'USD',
                })}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Step Timeline */}
      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>

        <div className="space-y-6">
          {steps.length > 0 ? (
            steps.map((step: TransactionStep) => {
              const stepConditions = getConditionsForStep(step.id)
              const isActive = step.status === 'active'
              const isStepCompleted = step.status === 'completed'
              const isSkipped = step.status === 'skipped'

              return (
                <div key={step.id} className="relative pl-10">
                  {/* Timeline dot */}
                  <div
                    className={`absolute left-2 w-4 h-4 rounded-full border-2 ${
                      stepStatusColors[step.status] || stepStatusColors.pending
                    }`}
                  ></div>

                  {/* Step card */}
                  <div
                    className={`bg-white border rounded-lg p-4 shadow-sm ${
                      isActive
                        ? 'border-blue-300 ring-1 ring-blue-200'
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-gray-900">
                            {step.workflowStep?.name || `Step ${step.stepOrder}`}
                          </p>
                          {isActive && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Active
                            </span>
                          )}
                          {isStepCompleted && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Completed
                            </span>
                          )}
                          {isSkipped && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              Skipped
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right text-xs text-gray-500">
                        {step.enteredAt && (
                          <div>Entered: {formatDateTime(step.enteredAt)}</div>
                        )}
                        {step.completedAt && (
                          <div>Completed: {formatDateTime(step.completedAt)}</div>
                        )}
                      </div>
                    </div>

                    {/* Step conditions */}
                    {stepConditions.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-xs font-medium text-gray-700 mb-2">
                          Conditions ({stepConditions.filter((c) => c.status === 'completed').length}/{stepConditions.length} complete):
                        </p>
                        <div className="space-y-2">
                          {stepConditions.map((condition: Condition) => (
                            <div
                              key={condition.id}
                              className="flex items-start gap-2 text-sm"
                            >
                              <span className="mt-0.5">
                                {condition.status === 'completed' ? (
                                  <svg
                                    className="w-4 h-4 text-green-500"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                ) : (
                                  <svg
                                    className="w-4 h-4 text-gray-400"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                )}
                              </span>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span
                                    className={
                                      condition.status === 'completed'
                                        ? 'text-gray-500 line-through'
                                        : 'text-gray-900'
                                    }
                                  >
                                    {condition.title}
                                  </span>
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                                    {conditionTypeLabels[condition.type] ||
                                      condition.type}
                                  </span>
                                  <span
                                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                      priorityColors[condition.priority]
                                    }`}
                                  >
                                    {condition.priority === 'high'
                                      ? 'High'
                                      : condition.priority === 'medium'
                                        ? 'Medium'
                                        : 'Low'}
                                  </span>
                                  {condition.isBlocking && condition.status === 'pending' && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-300">
                                      Blocking
                                    </span>
                                  )}
                                </div>
                                {condition.dueDate && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    Due: {formatDate(condition.dueDate)}
                                    {condition.completedAt && (
                                      <span className="ml-2 text-green-600">
                                        Completed:{' '}
                                        {formatDate(condition.completedAt)}
                                      </span>
                                    )}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">No workflow steps available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
