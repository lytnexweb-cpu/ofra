import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import { enCA } from 'date-fns/locale/en-CA'
import {
  ArrowRight,
  Check,
  FileText,
  MessageSquare,
  Clock,
  Loader2,
  HandCoins,
} from 'lucide-react'
import { transactionsApi, type ActivityEntry } from '../../api/transactions.api'
import { formatDate } from '../../lib/date'
import { Button } from '../ui/Button'
import { differenceInDays } from 'date-fns'

const ACTIVITY_ICONS: Record<string, typeof ArrowRight> = {
  step_advanced: ArrowRight,
  step_skipped: ArrowRight,
  condition_completed: Check,
  condition_created: FileText,
  offer_created: HandCoins,
  offer_accepted: HandCoins,
  offer_rejected: HandCoins,
  note_added: MessageSquare,
}

interface TimelineTabProps {
  transactionId: number
}

export default function TimelineTab({ transactionId }: TimelineTabProps) {
  const { t } = useTranslation()
  const [page, setPage] = useState(1)
  const [allActivities, setAllActivities] = useState<ActivityEntry[]>([])
  const PAGE_SIZE = 20

  const { data, isLoading } = useQuery({
    queryKey: ['activity', transactionId, page],
    queryFn: () => transactionsApi.getActivity(transactionId, page, PAGE_SIZE),
  })

  // Reset when transaction changes
  useEffect(() => {
    setAllActivities([])
    setPage(1)
  }, [transactionId])

  // Accumulate new page data
  useEffect(() => {
    const pageData = data?.data?.data
    if (!pageData || pageData.length === 0) return
    setAllActivities((prev) => {
      const existingIds = new Set(prev.map((a) => a.id))
      const fresh = pageData.filter((a: ActivityEntry) => !existingIds.has(a.id))
      return [...prev, ...fresh]
    })
  }, [data])

  const activities = allActivities
  const meta = data?.data?.meta
  const hasMore = meta ? meta.currentPage * meta.perPage < meta.total : false

  const formatActivityDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const days = differenceInDays(new Date(), date)
    if (days <= 7) {
      return formatDistanceToNow(date, { addSuffix: true, locale: enCA })
    }
    return formatDate(dateStr, 'PP')
  }

  if (isLoading && activities.length === 0) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    )
  }

  if (activities.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground" data-testid="timeline-empty">
        {t('common.noResults')}
      </div>
    )
  }

  return (
    <div className="py-4" data-testid="timeline-tab">
      <div className="space-y-0">
        {activities.map((activity: ActivityEntry) => {
          const Icon = ACTIVITY_ICONS[activity.activityType] ?? Clock

          return (
            <div
              key={activity.id}
              className="flex gap-3 py-3 border-b border-border last:border-0"
              data-testid={`activity-${activity.id}`}
            >
              <div className="mt-0.5 w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className="w-3.5 h-3.5 text-primary" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground">
                  {activity.activityType.replace(/_/g, ' ')}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  {activity.user && (
                    <span className="text-xs text-muted-foreground">
                      {activity.user.fullName || activity.user.email}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {formatActivityDate(activity.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {hasMore && (
        <div className="mt-4 flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={isLoading}
            data-testid="load-more-activities"
          >
            {isLoading ? t('common.loading') : t('common.view') + ' +'}
          </Button>
        </div>
      )}
    </div>
  )
}
