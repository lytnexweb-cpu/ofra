import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Card } from '../ui/Card'
import { Skeleton } from '../ui/Skeleton'
import { AlertTriangle, ChevronRight, MapPin, Home, ShoppingBag } from 'lucide-react'
import CountdownBadge from './CountdownBadge'
import type { Transaction } from '../../api/transactions.api'
import type { Condition } from '../../api/conditions.api'

interface TransactionCardProps {
  transaction: Transaction
}

function getBlockingPendingConditions(conditions: Condition[]): Condition[] {
  return conditions.filter((c) => c.isBlocking && c.status === 'pending')
}

function getNearestDeadline(conditions: Condition[]): string | null {
  const blocking = getBlockingPendingConditions(conditions)
  if (blocking.length === 0) return null

  const withDueDate = blocking.filter((c) => c.dueDate)
  if (withDueDate.length === 0) return null

  withDueDate.sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  )
  return withDueDate[0].dueDate
}

// Calculate transaction progress based on step order
function getTransactionProgress(transaction: Transaction): number {
  const steps = transaction.transactionSteps ?? []
  if (steps.length === 0) return 0

  const currentStep = steps.find(s => s.id === transaction.currentStepId)
  if (!currentStep) return 100 // Completed

  const totalSteps = steps.length
  const currentOrder = currentStep.stepOrder

  return Math.round((currentOrder / totalSteps) * 100)
}

export default function TransactionCard({ transaction }: TransactionCardProps) {
  const { t, i18n } = useTranslation()

  const clientName = transaction.client
    ? `${transaction.client.firstName} ${transaction.client.lastName}`
    : t('common.noResults')

  const stepName =
    transaction.currentStep?.workflowStep?.name ?? t('workflow.status.completed')

  const stepSlug = transaction.currentStep?.workflowStep?.slug

  const conditions = (transaction.conditions ?? []) as Condition[]
  const blockingCount = getBlockingPendingConditions(conditions).length
  const nearestDeadline = getNearestDeadline(conditions)
  const progress = getTransactionProgress(transaction)

  const propertyAddress = transaction.property?.address
  const isPurchase = transaction.type === 'purchase'

  // Determine card accent color based on urgency
  const hasUrgent = blockingCount > 0

  return (
    <Link
      to={`/transactions/${transaction.id}`}
      className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xl"
      data-testid={`transaction-card-${transaction.id}`}
    >
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer group">
        {/* Accent bar at top */}
        <div
          className={`h-1 w-full ${hasUrgent ? 'bg-destructive' : 'bg-primary'}`}
        />

        <div className="p-4">
          {/* Header: Client name + Type badge */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3
                className="font-semibold text-base truncate group-hover:text-primary transition-colors text-primary"
              >
                {clientName}
              </h3>
              {propertyAddress && (
                <div className="flex items-center gap-1.5 mt-1 text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span className="text-sm truncate">{propertyAddress}</span>
                </div>
              )}
            </div>
            <div
              className={`shrink-0 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                isPurchase
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                  : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
              }`}
            >
              {isPurchase ? <ShoppingBag className="w-3 h-3" /> : <Home className="w-3 h-3" />}
              {isPurchase ? t('transaction.purchase') : t('transaction.sale')}
            </div>
          </div>

          {/* Price + Step with progress */}
          <div className="mt-4 flex items-end justify-between gap-4">
            <div>
              {transaction.salePrice != null && (
                <p className="text-lg font-bold text-primary">
                  {transaction.salePrice.toLocaleString(i18n.language === 'fr' ? 'fr-CA' : 'en-CA', {
                    style: 'currency',
                    currency: 'CAD',
                    maximumFractionDigits: 0,
                  })}
                </p>
              )}
            </div>
            <div className="text-right min-w-0">
              <p className="text-xs text-muted-foreground truncate">
                {stepSlug ? t(`workflow.steps.${stepSlug}`, stepName) : stepName}
              </p>
              {/* Mini progress bar */}
              <div className="mt-1 flex items-center gap-2">
                <div className="w-16 h-1.5 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${progress}%`,
                      backgroundColor: progress === 100 ? '#10B981' : '#D97706'
                    }}
                  />
                </div>
                <span className="text-xs text-muted-foreground font-medium">{progress}%</span>
              </div>
            </div>
          </div>

          {/* Footer: Urgency indicators + Chevron */}
          <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {blockingCount > 0 && (
                <div
                  className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                  data-testid="blocking-badge"
                >
                  <AlertTriangle className="w-3 h-3" />
                  {blockingCount} {t('conditions.blocking').toLowerCase()}
                </div>
              )}
              {nearestDeadline && <CountdownBadge dueDate={nearestDeadline} />}
              {!blockingCount && !nearestDeadline && (
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  ✓ {t('actionZone.readyToAdvance')}
                </span>
              )}
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>
      </Card>
    </Link>
  )
}

export function TransactionCardSkeleton() {
  return (
    <Card className="overflow-hidden" data-testid="transaction-card-skeleton">
      {/* Accent bar */}
      <Skeleton className="h-1 w-full rounded-none" />

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-4 w-48 mt-2" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>

        {/* Price + Progress */}
        <div className="mt-4 flex items-end justify-between">
          <Skeleton className="h-6 w-28" />
          <div className="text-right">
            <Skeleton className="h-3 w-24 mb-1" />
            <Skeleton className="h-1.5 w-20" />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
          <Skeleton className="h-6 w-32 rounded-full" />
          <Skeleton className="h-5 w-5 rounded" />
        </div>
      </div>
    </Card>
  )
}
