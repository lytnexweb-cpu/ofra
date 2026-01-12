import type { TransactionWithTimeline } from '../api/clients.api'

interface TransactionTimelineProps {
  transaction: TransactionWithTimeline
}

const statusLabels: Record<string, string> = {
  consultation: 'Consultation',
  offer: 'Offer Submitted',
  accepted: 'Offer Accepted',
  conditions: 'Conditional Period',
  notary: 'Firm',
  closing: 'Closing',
  completed: 'Completed',
  canceled: 'Canceled',
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

  // Build complete history including initial status if missing
  const buildCompleteHistory = () => {
    const histories = [...transaction.statusHistories]

    // Check if we have any history at all
    if (histories.length === 0) {
      // No history yet - synthesize initial entry based on current status
      return [{
        id: -1, // synthetic ID
        transactionId: transaction.id,
        changedByUserId: 0,
        fromStatus: null,
        toStatus: transaction.status,
        note: null,
        createdAt: transaction.createdAt,
      }]
    }

    // Check if the earliest history entry has a fromStatus
    const earliestHistory = histories[histories.length - 1]
    if (earliestHistory.fromStatus) {
      // There was an initial status before the first change - add it
      histories.push({
        id: -1, // synthetic ID
        transactionId: transaction.id,
        changedByUserId: 0,
        fromStatus: null,
        toStatus: earliestHistory.fromStatus,
        note: null,
        createdAt: transaction.createdAt,
      })
    }

    return histories
  }

  const completeHistory = buildCompleteHistory()

  return (
    <div className="space-y-6">
      {/* Current Status Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-blue-600 font-medium">Current Status</p>
            <p className="text-lg font-semibold text-blue-900">
              {statusLabels[transaction.status] || transaction.status}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-blue-600">Type</p>
            <p className="text-lg font-semibold text-blue-900">
              {transaction.type === 'purchase' ? 'Purchase' : 'Sale'}
            </p>
          </div>
        </div>
        {(transaction.salePrice || transaction.offerPrice || transaction.offerExpiryAt) && (
          <div className="mt-2 pt-2 border-t border-blue-200 space-y-2">
            {transaction.salePrice && (
              <div>
                <p className="text-sm text-blue-600">Price</p>
                <p className="text-xl font-bold text-blue-900">
                  {transaction.salePrice.toLocaleString('en-US', {
                    style: 'currency',
                    currency: 'USD',
                  })}
                </p>
              </div>
            )}
            {transaction.offerPrice && (
              <div>
                <p className="text-sm text-blue-600">Offer</p>
                <p className="text-lg font-semibold text-blue-900">
                  {transaction.offerPrice.toLocaleString('en-US', {
                    style: 'currency',
                    currency: 'USD',
                  })}
                </p>
              </div>
            )}
            {transaction.offerExpiryAt && (
              <div>
                <p className="text-sm text-blue-600">Expiration</p>
                <p className="text-sm font-medium text-blue-900">
                  {formatDateTime(transaction.offerExpiryAt)}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>

        <div className="space-y-6">
          {completeHistory.length > 0 ? (
            completeHistory.map((history, index) => {
              const isLast = index === completeHistory.length - 1

              return (
                <div key={history.id} className="relative pl-10">
                  {/* Timeline dot */}
                  <div
                    className={`absolute left-2 w-4 h-4 rounded-full border-2 ${
                      isLast
                        ? 'bg-blue-500 border-blue-500'
                        : 'bg-white border-gray-300'
                    }`}
                  ></div>

                  {/* Status change card */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {statusLabels[history.toStatus] || history.toStatus}
                        </p>
                        {history.fromStatus && (
                          <p className="text-xs text-gray-500">
                            Depuis:{' '}
                            {statusLabels[history.fromStatus] ||
                              history.fromStatus}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">
                        {formatDateTime(history.createdAt)}
                      </span>
                    </div>

                    {history.note && (
                      <p className="text-sm text-gray-600 mb-3 italic">
                        "{history.note}"
                      </p>
                    )}

                    {/* Conditions - Story View */}
                    {(() => {
                      // Calculate time period for this history item
                      const start = history.createdAt
                      const end = completeHistory[index + 1]?.createdAt || new Date().toISOString()

                      // A) Conditions de cette étape (stage match)
                      const stageConditions = transaction.conditions
                        .filter((c) => c.stage === history.toStatus)
                        .sort((a, b) => {
                          // Sort: pending first, then by dueDate ASC
                          if (a.status !== b.status) {
                            return a.status === 'pending' ? -1 : 1
                          }
                          if (!a.dueDate) return 1
                          if (!b.dueDate) return -1
                          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
                        })

                      // B) Conditions complétées pendant cette étape (time period match)
                      const completedDuringConditions = transaction.conditions
                        .filter((c) => {
                          if (!c.completedAt) return false
                          const completedDate = new Date(c.completedAt).toISOString()
                          return completedDate >= start && completedDate < end
                        })
                        .sort((a, b) => {
                          // Sort by completedAt ASC
                          if (!a.completedAt || !b.completedAt) return 0
                          return new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime()
                        })

                      const hasStageConditions = stageConditions.length > 0
                      const hasCompletedDuring = completedDuringConditions.length > 0

                      const renderConditionItem = (condition: typeof transaction.conditions[0]) => (
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
                                  ? 'Haute'
                                  : condition.priority === 'medium'
                                    ? 'Moyenne'
                                    : 'Basse'}
                              </span>
                            </div>
                            {condition.dueDate && (
                              <p className="text-xs text-gray-500 mt-1">
                                Échéance: {formatDate(condition.dueDate)}
                                {condition.completedAt && (
                                  <span className="ml-2 text-green-600">
                                    • Complété:{' '}
                                    {formatDate(condition.completedAt)}
                                  </span>
                                )}
                              </p>
                            )}
                          </div>
                        </div>
                      )

                      return (hasStageConditions || hasCompletedDuring) ? (
                        <div className="mt-3 pt-3 border-t border-gray-100 space-y-3">
                          {/* Section A: Conditions for this step */}
                          {hasStageConditions && (
                            <div>
                              <p className="text-xs font-medium text-gray-700 mb-2">
                                Conditions for this step:
                              </p>
                              <div className="space-y-2">
                                {stageConditions.map(renderConditionItem)}
                              </div>
                            </div>
                          )}

                          {/* Message if no stage conditions */}
                          {!hasStageConditions && (
                            <div>
                              <p className="text-xs font-medium text-gray-700 mb-2">
                                Conditions for this step:
                              </p>
                              <p className="text-xs text-gray-500 italic">
                                No conditions for this step
                              </p>
                            </div>
                          )}

                          {/* Section B: Conditions completed during this step */}
                          {hasCompletedDuring && (
                            <div>
                              <p className="text-xs font-medium text-green-700 mb-2">
                                Conditions completed during this step:
                              </p>
                              <div className="space-y-2">
                                {completedDuringConditions.map(renderConditionItem)}
                              </div>
                            </div>
                          )}

                          {/* Message if no completed conditions during this period */}
                          {!hasCompletedDuring && (
                            <div>
                              <p className="text-xs font-medium text-gray-700 mb-2">
                                Conditions completed during this step:
                              </p>
                              <p className="text-xs text-gray-500 italic">
                                No conditions completed during this step
                              </p>
                            </div>
                          )}
                        </div>
                      ) : null
                    })()}
                  </div>
                </div>
              )
            })
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">Aucun historique de statut disponible</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
