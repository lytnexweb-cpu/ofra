import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import {
  UserPlus,
  FileText,
  RefreshCw,
  AlertTriangle,
  Clock,
  ExternalLink,
  User,
  Calendar,
} from 'lucide-react'
import {
  adminApi,
  type ActivityItem,
  type AtRiskUser,
  type OverdueCondition,
} from '../../api/admin.api'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
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

function AtRiskUserCard({ user }: { user: AtRiskUser }) {
  const { t } = useTranslation()

  const reasonText =
    user.reason === 'no_login_7d'
      ? t('admin.riskNoLogin', { days: user.daysSinceLastLogin })
      : t('admin.riskNoActivity')

  return (
    <div className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
      <div className="p-2 rounded-full bg-warning/10">
        <User className="w-4 h-4 text-warning" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">
          {user.fullName || user.email}
        </p>
        <p className="text-xs text-muted-foreground">{user.email}</p>
        <p className="text-xs text-warning mt-1">{reasonText}</p>
      </div>
      <div className="text-right text-sm">
        <p className="text-muted-foreground">
          {t('admin.signedUp')} {user.daysSinceCreation}d
        </p>
        <p className="text-muted-foreground">
          {user.transactionCount} {t('admin.txShort')}
        </p>
      </div>
    </div>
  )
}

function OverdueConditionCard({ condition }: { condition: OverdueCondition }) {
  const { t } = useTranslation()

  return (
    <Link
      to={`/transactions/${condition.transactionId}`}
      className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors group"
    >
      <div className="p-2 rounded-full bg-destructive/10">
        <Clock className="w-4 h-4 text-destructive" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate group-hover:text-primary transition-colors">
          {condition.title}
        </p>
        <p className="text-xs text-muted-foreground">
          {condition.clientName || t('admin.unknownClient')} &bull;{' '}
          {condition.ownerEmail}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <Calendar className="w-3 h-3 text-destructive" />
          <span className="text-xs text-destructive">
            {t('admin.overdueByDays', { count: condition.daysOverdue })}
          </span>
        </div>
      </div>
      <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
    </Link>
  )
}

export default function AdminActivityPage() {
  const { t } = useTranslation()

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin', 'activity'],
    queryFn: () => adminApi.getActivity(50),
  })

  const activities = data?.data?.activities || []
  const atRiskUsers = data?.data?.atRiskUsers || []
  const overdueConditions = data?.data?.overdueConditions || []

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

      {/* Alert Cards Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* At-Risk Users */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning" />
              {t('admin.atRiskUsers')}
              {atRiskUsers.length > 0 && (
                <span className="ml-auto text-sm font-normal bg-warning/10 text-warning px-2 py-0.5 rounded-full">
                  {atRiskUsers.length}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="animate-pulse flex gap-4 p-4 rounded-lg border"
                  >
                    <div className="w-10 h-10 bg-muted rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-3/4 bg-muted rounded" />
                      <div className="h-3 w-1/2 bg-muted rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : atRiskUsers.length === 0 ? (
              <div className="text-center py-8">
                <div className="p-3 rounded-full bg-success/10 w-fit mx-auto mb-3">
                  <User className="w-6 h-6 text-success" />
                </div>
                <p className="text-muted-foreground">
                  {t('admin.noAtRiskUsers')}
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {atRiskUsers.map((user) => (
                  <AtRiskUserCard key={user.id} user={user} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Overdue Conditions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-destructive" />
              {t('admin.overdueConditions')}
              {overdueConditions.length > 0 && (
                <span className="ml-auto text-sm font-normal bg-destructive/10 text-destructive px-2 py-0.5 rounded-full">
                  {overdueConditions.length}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="animate-pulse flex gap-4 p-4 rounded-lg border"
                  >
                    <div className="w-10 h-10 bg-muted rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-3/4 bg-muted rounded" />
                      <div className="h-3 w-1/2 bg-muted rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : overdueConditions.length === 0 ? (
              <div className="text-center py-8">
                <div className="p-3 rounded-full bg-success/10 w-fit mx-auto mb-3">
                  <Clock className="w-6 h-6 text-success" />
                </div>
                <p className="text-muted-foreground">
                  {t('admin.noOverdueConditions')}
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {overdueConditions.map((condition) => (
                  <OverdueConditionCard key={condition.id} condition={condition} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Activity Feed */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">
            {t('admin.recentActivity')}
          </CardTitle>
        </CardHeader>
        <CardContent>
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
                <ActivityCard
                  key={`${activity.type}-${index}`}
                  activity={activity}
                />
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
