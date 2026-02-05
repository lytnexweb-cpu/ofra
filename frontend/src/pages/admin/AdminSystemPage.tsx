import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Database,
  Server,
  Clock,
  HardDrive,
  RefreshCw,
} from 'lucide-react'
import { adminApi } from '../../api/admin.api'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'operational':
    case 'healthy':
      return <CheckCircle className="w-5 h-5 text-success" />
    case 'degraded':
      return <AlertTriangle className="w-5 h-5 text-warning" />
    case 'outage':
    case 'error':
      return <XCircle className="w-5 h-5 text-destructive" />
    default:
      return <AlertTriangle className="w-5 h-5 text-muted-foreground" />
  }
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

export default function AdminSystemPage() {
  const { t } = useTranslation()

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin', 'system'],
    queryFn: () => adminApi.getSystemHealth(),
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  const system = data?.data

  return (
    <div className="space-y-6" data-testid="admin-system">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('admin.system')}</h1>
          <p className="text-muted-foreground">{t('admin.systemSubtitle')}</p>
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

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 w-24 bg-muted rounded" />
                  <div className="h-8 w-32 bg-muted rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {/* Overall Status */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <StatusIcon status={system?.status || 'unknown'} />
                <div>
                  <p className="text-lg font-semibold capitalize">
                    {system?.status || t('admin.unknown')}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t('admin.lastCheck')}: {system?.timestamp ? new Date(system.timestamp).toLocaleTimeString() : '—'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Health Checks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  {t('admin.database')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <StatusIcon status={system?.checks.database || 'unknown'} />
                  <span className="capitalize">
                    {system?.checks.database || t('admin.unknown')}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Server className="w-4 h-4" />
                  {t('admin.runtime')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  Node {system?.runtime.nodeVersion} ({system?.runtime.platform})
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {t('admin.uptime')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {system?.runtime.uptimeSeconds
                    ? formatUptime(system.runtime.uptimeSeconds)
                    : '—'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <HardDrive className="w-4 h-4" />
                  {t('admin.memory')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {system?.runtime.memoryUsedMB || 0} MB
                </p>
                <p className="text-sm text-muted-foreground">
                  {t('admin.of')} {system?.runtime.memoryTotalMB || 0} MB
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('admin.databaseStats')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <p className="text-3xl font-bold">
                    {system?.stats.totalUsers || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t('admin.totalUsers')}
                  </p>
                </div>
                <div>
                  <p className="text-3xl font-bold">
                    {system?.stats.totalTransactions || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t('admin.totalTransactions')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
