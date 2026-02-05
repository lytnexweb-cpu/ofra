import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { UserPlus, FileText, RefreshCw } from 'lucide-react'
import { adminApi, type ActivityItem } from '../../api/admin.api'
import { Button } from '../../components/ui/Button'
import { formatRelativeDate } from '../../lib/date'

function ActivityIcon({ type }: { type: ActivityItem['type'] }) {
  const config = {
    user_registered: {
      icon: UserPlus,
      bg: 'bg-primary/10',
      color: 'text-primary',
    },
    transaction_created: {
      icon: FileText,
      bg: 'bg-success/10',
      color: 'text-success',
    },
  }

  const { icon: Icon, bg, color } = config[type] || config.user_registered

  return (
    <div className={`p-2 rounded-full ${bg}`}>
      <Icon className={`w-4 h-4 ${color}`} />
    </div>
  )
}

function ActivityCard({ activity }: { activity: ActivityItem }) {
  const { t } = useTranslation()

  const getMessage = () => {
    switch (activity.type) {
      case 'user_registered':
        return t('admin.activityUserRegistered', {
          email: activity.data.email,
          name: activity.data.fullName || t('admin.anonymous'),
        })
      case 'transaction_created':
        return t('admin.activityTransactionCreated', {
          type: activity.data.type,
          client: activity.data.clientName || t('admin.unknownClient'),
          owner: activity.data.ownerEmail,
        })
      default:
        return t('admin.activityUnknown')
    }
  }

  return (
    <div className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
      <ActivityIcon type={activity.type} />
      <div className="flex-1 min-w-0">
        <p className="text-sm">{getMessage()}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {formatRelativeDate(activity.timestamp)}
        </p>
      </div>
    </div>
  )
}

export default function AdminActivityPage() {
  const { t } = useTranslation()

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin', 'activity'],
    queryFn: () => adminApi.getActivity(50),
  })

  const activities = data?.data?.activities || []

  return (
    <div className="space-y-6" data-testid="admin-activity">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('admin.activity')}</h1>
          <p className="text-muted-foreground">{t('admin.activitySubtitle')}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw
            className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`}
          />
          {t('common.refresh')}
        </Button>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="animate-pulse flex gap-4 p-4 rounded-lg border"
              >
                <div className="w-10 h-10 bg-muted rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 bg-muted rounded" />
                  <div className="h-3 w-1/4 bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">{t('admin.noActivity')}</p>
          </div>
        ) : (
          activities.map((activity, index) => (
            <ActivityCard key={`${activity.type}-${index}`} activity={activity} />
          ))
        )}
      </div>
    </div>
  )
}
