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
  Download,
  X,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  Calendar,
  StickyNote,
  ListTodo,
  Flame,
  Snowflake,
  Zap,
} from 'lucide-react'
import {
  adminApi,
  type AdminUser,
  type AdminNote,
  type AdminTask,
  type EngagementLevel,
} from '../../api/admin.api'
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

function EngagementBadge({ level }: { level: EngagementLevel }) {
  const config = {
    active: {
      icon: Zap,
      color: 'bg-success/10 text-success border-success/20',
      label: 'Active',
    },
    warm: {
      icon: Flame,
      color: 'bg-warning/10 text-warning border-warning/20',
      label: 'Warm',
    },
    inactive: {
      icon: Snowflake,
      color: 'bg-muted text-muted-foreground border-muted',
      label: 'Inactive',
    },
  }

  const { icon: Icon, color, label } = config[level] || config.inactive

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${color}`}
    >
      <Icon className="w-3 h-3" />
      {label}
    </span>
  )
}

function UserRow({
  user,
  currentUserRole,
  onRoleChange,
  onSelect,
  isSelected,
}: {
  user: AdminUser
  currentUserRole?: UserRole
  onRoleChange: (userId: number, newRole: UserRole) => void
  onSelect: (user: AdminUser) => void
  isSelected: boolean
}) {
  const { t } = useTranslation()
  const isSuperadmin = currentUserRole === 'superadmin'

  return (
    <tr
      className={`border-b border-border hover:bg-muted/30 transition-colors cursor-pointer ${
        isSelected ? 'bg-primary/5' : ''
      }`}
      onClick={() => onSelect(user)}
    >
      <td className="px-4 py-3">
        <div>
          <p className="font-medium">{user.fullName || t('admin.noName')}</p>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
      </td>
      <td className="px-4 py-3">
        <RoleBadge role={user.role} />
      </td>
      <td className="px-4 py-3">
        <EngagementBadge level={user.engagement.level} />
      </td>
      <td className="px-4 py-3 text-sm">
        <div className="flex flex-col gap-0.5">
          <span title={t('admin.transactions')}>
            {user.engagement.transactionCount} tx
          </span>
          <span
            className="text-xs text-muted-foreground"
            title={t('admin.completedConditions')}
          >
            {user.engagement.completedConditions} cond
          </span>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {user.engagement.daysSinceLastLogin !== null
          ? t('admin.daysAgo', { count: user.engagement.daysSinceLastLogin })
          : t('admin.never')}
      </td>
      <td className="px-4 py-3 text-sm">
        <div className="flex gap-2 text-muted-foreground">
          {user.noteCount > 0 && (
            <span className="flex items-center gap-1" title={t('admin.notes')}>
              <StickyNote className="w-3 h-3" />
              {user.noteCount}
            </span>
          )}
          {user.pendingTaskCount > 0 && (
            <span className="flex items-center gap-1" title={t('admin.tasks')}>
              <ListTodo className="w-3 h-3" />
              {user.pendingTaskCount}
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        {isSuperadmin && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => e.stopPropagation()}
              >
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

function UserDetailPanel({
  user,
  onClose,
}: {
  user: AdminUser
  onClose: () => void
}) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'notes' | 'tasks'>('notes')
  const [newNote, setNewNote] = useState('')
  const [newTask, setNewTask] = useState('')
  const [newTaskDueDate, setNewTaskDueDate] = useState('')

  // Notes
  const { data: notesData, isLoading: notesLoading } = useQuery({
    queryKey: ['admin', 'notes', user.id],
    queryFn: () => adminApi.getNotes(user.id),
  })

  const createNoteMutation = useMutation({
    mutationFn: (content: string) => adminApi.createNote(user.id, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'notes', user.id] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'subscribers'] })
      setNewNote('')
    },
  })

  const deleteNoteMutation = useMutation({
    mutationFn: (noteId: number) => adminApi.deleteNote(noteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'notes', user.id] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'subscribers'] })
    },
  })

  // Tasks
  const { data: tasksData, isLoading: tasksLoading } = useQuery({
    queryKey: ['admin', 'tasks', user.id],
    queryFn: () => adminApi.getTasks(user.id),
  })

  const createTaskMutation = useMutation({
    mutationFn: ({ title, dueDate }: { title: string; dueDate?: string }) =>
      adminApi.createTask(user.id, title, dueDate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'tasks', user.id] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'subscribers'] })
      setNewTask('')
      setNewTaskDueDate('')
    },
  })

  const updateTaskMutation = useMutation({
    mutationFn: ({
      taskId,
      completed,
    }: {
      taskId: number
      completed: boolean
    }) => adminApi.updateTask(taskId, { completed }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'tasks', user.id] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'subscribers'] })
    },
  })

  const deleteTaskMutation = useMutation({
    mutationFn: (taskId: number) => adminApi.deleteTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'tasks', user.id] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'subscribers'] })
    },
  })

  const notes = notesData?.data?.notes || []
  const tasks = tasksData?.data?.tasks || []

  const handleAddNote = () => {
    if (newNote.trim()) {
      createNoteMutation.mutate(newNote.trim())
    }
  }

  const handleAddTask = () => {
    if (newTask.trim()) {
      createTaskMutation.mutate({
        title: newTask.trim(),
        dueDate: newTaskDueDate || undefined,
      })
    }
  }

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-background border-l shadow-lg z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h3 className="font-semibold">{user.fullName || user.email}</h3>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* User Stats */}
      <div className="p-4 border-b bg-muted/30">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold">
              {user.engagement.transactionCount}
            </p>
            <p className="text-xs text-muted-foreground">
              {t('admin.transactions')}
            </p>
          </div>
          <div>
            <p className="text-2xl font-bold">
              {user.engagement.completedConditions}
            </p>
            <p className="text-xs text-muted-foreground">
              {t('admin.conditions')}
            </p>
          </div>
          <div>
            <EngagementBadge level={user.engagement.level} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b">
        <button
          className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'notes'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setActiveTab('notes')}
        >
          <StickyNote className="w-4 h-4 inline mr-1" />
          {t('admin.notes')} ({notes.length})
        </button>
        <button
          className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'tasks'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setActiveTab('tasks')}
        >
          <ListTodo className="w-4 h-4 inline mr-1" />
          {t('admin.tasks')} ({tasks.filter((t) => !t.completed).length})
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'notes' ? (
          <div className="space-y-4">
            {/* Add note */}
            <div className="space-y-2">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder={t('admin.addNotePlaceholder')}
                className="w-full p-2 border rounded-md text-sm resize-none h-20 bg-background"
              />
              <Button
                size="sm"
                onClick={handleAddNote}
                disabled={!newNote.trim() || createNoteMutation.isPending}
              >
                <Plus className="w-4 h-4 mr-1" />
                {t('admin.addNote')}
              </Button>
            </div>

            {/* Notes list */}
            {notesLoading ? (
              <div className="animate-pulse space-y-2">
                {[1, 2].map((i) => (
                  <div key={i} className="h-20 bg-muted rounded" />
                ))}
              </div>
            ) : notes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                {t('admin.noNotes')}
              </p>
            ) : (
              <div className="space-y-2">
                {notes.map((note: AdminNote) => (
                  <div
                    key={note.id}
                    className="p-3 border rounded-lg bg-card group"
                  >
                    <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                    <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                      <span>{formatRelativeDate(note.createdAt)}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                        onClick={() => deleteNoteMutation.mutate(note.id)}
                      >
                        <Trash2 className="w-3 h-3 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Add task */}
            <div className="space-y-2">
              <Input
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                placeholder={t('admin.addTaskPlaceholder')}
                className="text-sm"
              />
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={newTaskDueDate}
                  onChange={(e) => setNewTaskDueDate(e.target.value)}
                  className="text-sm flex-1"
                />
                <Button
                  size="sm"
                  onClick={handleAddTask}
                  disabled={!newTask.trim() || createTaskMutation.isPending}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  {t('admin.addTask')}
                </Button>
              </div>
            </div>

            {/* Tasks list */}
            {tasksLoading ? (
              <div className="animate-pulse space-y-2">
                {[1, 2].map((i) => (
                  <div key={i} className="h-12 bg-muted rounded" />
                ))}
              </div>
            ) : tasks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                {t('admin.noTasks')}
              </p>
            ) : (
              <div className="space-y-2">
                {tasks.map((task: AdminTask) => (
                  <div
                    key={task.id}
                    className={`flex items-start gap-2 p-3 border rounded-lg bg-card group ${
                      task.completed ? 'opacity-60' : ''
                    }`}
                  >
                    <button
                      onClick={() =>
                        updateTaskMutation.mutate({
                          taskId: task.id,
                          completed: !task.completed,
                        })
                      }
                      className="mt-0.5"
                    >
                      {task.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-success" />
                      ) : (
                        <Circle className="w-5 h-5 text-muted-foreground hover:text-primary" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm ${task.completed ? 'line-through' : ''}`}
                      >
                        {task.title}
                      </p>
                      {task.dueDate && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(task.dueDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                      onClick={() => deleteTaskMutation.mutate(task.id)}
                    >
                      <Trash2 className="w-3 h-3 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function AdminSubscribersPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('')
  const [engagementFilter, setEngagementFilter] = useState<EngagementLevel | ''>(
    ''
  )
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)

  const { data: currentUser } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => authApi.me(),
  })

  const { data, isLoading } = useQuery({
    queryKey: [
      'admin',
      'subscribers',
      { page, search, role: roleFilter, engagement: engagementFilter },
    ],
    queryFn: () =>
      adminApi.getSubscribers({
        page,
        limit: 20,
        search: search || undefined,
        role: roleFilter || undefined,
        engagement: engagementFilter || undefined,
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

  const handleExport = () => {
    window.open(adminApi.exportSubscribers(), '_blank')
  }

  return (
    <div className="space-y-6" data-testid="admin-subscribers">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('admin.subscribers')}</h1>
          <p className="text-muted-foreground">
            {t('admin.subscribersSubtitle')}
          </p>
        </div>
        <Button variant="outline" onClick={handleExport}>
          <Download className="w-4 h-4 mr-2" />
          {t('admin.exportCsv')}
        </Button>
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
        <select
          value={engagementFilter}
          onChange={(e) => {
            setEngagementFilter(e.target.value as EngagementLevel | '')
            setPage(1)
          }}
          className="px-3 py-2 border rounded-md bg-background text-sm"
        >
          <option value="">{t('admin.allEngagement')}</option>
          <option value="active">{t('admin.engagementActive')}</option>
          <option value="warm">{t('admin.engagementWarm')}</option>
          <option value="inactive">{t('admin.engagementInactive')}</option>
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
                  {t('admin.engagement')}
                </th>
                <th className="px-4 py-3 text-left font-medium">
                  {t('admin.usage')}
                </th>
                <th className="px-4 py-3 text-left font-medium">
                  {t('admin.lastLogin')}
                </th>
                <th className="px-4 py-3 text-left font-medium">
                  {t('admin.crm')}
                </th>
                <th className="px-4 py-3 w-12"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center">
                    <div className="animate-pulse flex justify-center">
                      <div className="h-4 w-32 bg-muted rounded" />
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
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
                    onSelect={setSelectedUser}
                    isSelected={selectedUser?.id === user.id}
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

      {/* Detail Panel */}
      {selectedUser && (
        <UserDetailPanel
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </div>
  )
}
