import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Shield,
  ShieldCheck,
  User,
  MoreVertical,
} from 'lucide-react'
import { adminApi, type AdminUser } from '../../api/admin.api'
import { authApi, type UserRole } from '../../api/auth.api'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '../../components/ui/DropdownMenu'
import { formatRelativeDate } from '../../lib/date'

function RoleBadge({ role }: { role: UserRole }) {
  const config = {
    user: { icon: User, color: 'bg-muted text-muted-foreground' },
    admin: { icon: Shield, color: 'bg-primary/10 text-primary' },
    superadmin: { icon: ShieldCheck, color: 'bg-success/10 text-success' },
  }

  const { icon: Icon, color } = config[role] || config.user

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${color}`}
    >
      <Icon className="w-3 h-3" />
      {role}
    </span>
  )
}

function UserRow({
  user,
  currentUserRole,
  onRoleChange,
}: {
  user: AdminUser
  currentUserRole?: UserRole
  onRoleChange: (userId: number, newRole: UserRole) => void
}) {
  const { t } = useTranslation()
  const isSuperadmin = currentUserRole === 'superadmin'

  return (
    <tr className="border-b border-border hover:bg-muted/30 transition-colors">
      <td className="px-4 py-3">
        <div>
          <p className="font-medium">{user.fullName || t('admin.noName')}</p>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
      </td>
      <td className="px-4 py-3">
        <RoleBadge role={user.role} />
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {user.agency || '—'}
      </td>
      <td className="px-4 py-3 text-sm">
        <div className="flex gap-4">
          <span title={t('admin.transactions')}>
            {user.transactionCount} tx
          </span>
          <span title={t('admin.clients')}>{user.clientCount} cl</span>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {formatRelativeDate(user.createdAt)}
      </td>
      <td className="px-4 py-3">
        {isSuperadmin && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {(['user', 'admin', 'superadmin'] as UserRole[]).map((role) => (
                <DropdownMenuItem
                  key={role}
                  onClick={() => onRoleChange(user.id, role)}
                  disabled={user.role === role}
                >
                  {t('admin.setRole', { role })}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </td>
    </tr>
  )
}

export default function AdminSubscribersPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('')

  const { data: currentUser } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => authApi.me(),
  })

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'subscribers', { page, search, role: roleFilter }],
    queryFn: () =>
      adminApi.getSubscribers({
        page,
        limit: 20,
        search: search || undefined,
        role: roleFilter || undefined,
      }),
  })

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: number; role: UserRole }) =>
      adminApi.updateUserRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'subscribers'] })
    },
  })

  const subscribers = data?.data
  const users = subscribers?.users || []
  const meta = subscribers?.meta

  const handleSearch = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const handleRoleChange = (userId: number, newRole: UserRole) => {
    updateRoleMutation.mutate({ userId, role: newRole })
  }

  return (
    <div className="space-y-6" data-testid="admin-subscribers">
      <div>
        <h1 className="text-2xl font-bold">{t('admin.subscribers')}</h1>
        <p className="text-muted-foreground">{t('admin.subscribersSubtitle')}</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder={t('admin.searchUsers')}
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value as UserRole | '')
            setPage(1)
          }}
          className="px-3 py-2 border rounded-md bg-background text-sm"
        >
          <option value="">{t('admin.allRoles')}</option>
          <option value="user">User</option>
          <option value="admin">Admin</option>
          <option value="superadmin">Superadmin</option>
        </select>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b">
                <th className="px-4 py-3 text-left font-medium">
                  {t('admin.user')}
                </th>
                <th className="px-4 py-3 text-left font-medium">
                  {t('admin.role')}
                </th>
                <th className="px-4 py-3 text-left font-medium">
                  {t('admin.agency')}
                </th>
                <th className="px-4 py-3 text-left font-medium">
                  {t('admin.usage')}
                </th>
                <th className="px-4 py-3 text-left font-medium">
                  {t('admin.joined')}
                </th>
                <th className="px-4 py-3 w-12"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center">
                    <div className="animate-pulse flex justify-center">
                      <div className="h-4 w-32 bg-muted rounded" />
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    {t('admin.noUsers')}
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <UserRow
                    key={user.id}
                    user={user}
                    currentUserRole={currentUser?.data?.user?.role}
                    onRoleChange={handleRoleChange}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta && meta.lastPage > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/30">
            <p className="text-sm text-muted-foreground">
              {t('admin.showingUsers', {
                from: (meta.currentPage - 1) * meta.perPage + 1,
                to: Math.min(meta.currentPage * meta.perPage, meta.total),
                total: meta.total,
              })}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= meta.lastPage}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
