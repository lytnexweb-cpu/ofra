import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { Skeleton } from '../ui/Skeleton'
import { AlertTriangle, ChevronRight, User } from 'lucide-react'
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

  const propertyAddress = transaction.property?.address

  return (
    <Link
      to={`/transactions/${transaction.id}`}
      className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg"
      data-testid={`transaction-card-${transaction.id}`}
    >
      <Card className={`p-4 hover:shadow-md transition-shadow cursor-pointer border-l-4 ${blockingCount > 0 ? 'border-l-destructive' : 'border-l-border'}`}>
        {/* Row 1: Step badge + Type */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Badge variant="secondary" className="shrink-0 text-xs">
              {stepSlug
                ? t(`workflow.steps.${stepSlug}`, stepName)
                : stepName}
            </Badge>
            <Badge variant="outline" className="shrink-0 text-xs">
              {transaction.type === 'purchase'
                ? t('transaction.purchase')
                : t('transaction.sale')}
            </Badge>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
        </div>

        {/* Row 2: Client + Property */}
        <div className="mt-2">
          <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
            <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <span className="truncate">{clientName}</span>
          </div>
          {propertyAddress && (
            <p className="mt-0.5 text-xs text-muted-foreground truncate pl-5">
              {propertyAddress}
            </p>
          )}
          {transaction.salePrice != null && (
            <p className="mt-0.5 text-xs text-muted-foreground pl-5">
              {transaction.salePrice.toLocaleString(i18n.language === 'fr' ? 'fr-CA' : 'en-CA', {
                style: 'currency',
                currency: 'CAD',
                maximumFractionDigits: 0,
              })}
            </p>
          )}
        </div>

        {/* Row 3: Blocking count + Countdown */}
        {(blockingCount > 0 || nearestDeadline) && (
          <div className="mt-3 flex items-center gap-2">
            {blockingCount > 0 && (
              <Badge
                variant="destructive"
                className="gap-1 text-xs"
                data-testid="blocking-badge"
              >
                <AlertTriangle className="w-3 h-3" />
                {blockingCount}
              </Badge>
            )}
            {nearestDeadline && <CountdownBadge dueDate={nearestDeadline} />}
          </div>
        )}
      </Card>
    </Link>
  )
}

export function TransactionCardSkeleton() {
  return (
    <Card className="p-4" data-testid="transaction-card-skeleton">
      <div className="flex items-center gap-2">
        <Skeleton className="h-5 w-24 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <div className="mt-2 space-y-1.5">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-32" />
      </div>
    </Card>
  )
}
