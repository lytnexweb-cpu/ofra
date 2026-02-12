import { useState, useCallback, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Lock,
  ChevronRight,
  UserPlus,
  Eye,
  MessageCircle,
  Shield,
  Trash2,
  Link2,
  Check,
  X,
  Loader2,
  Send,
  Clock,
  Mail,
  Info,
  MoreVertical,
  TrendingUp,
  Pencil,
} from 'lucide-react'
import { transactionsApi, type ActivityEntry } from '../api/transactions.api'
import {
  membersApi,
  type TransactionMember,
  type MemberRole,
} from '../api/members.api'
import { shareLinksApi } from '../api/share-links.api'
import { authApi } from '../api/auth.api'
import { toast } from '../hooks/use-toast'

// ─── Types ───────────────────────────────────────────────────
type ModalState =
  | { type: 'none' }
  | { type: 'invite' }
  | { type: 'invite-sent'; email: string; role: MemberRole }
  | { type: 'remove'; member: TransactionMember }
  | { type: 'permission-error'; yourRole: string; requiredRole: string; ownerName: string }

// ─── Constants ───────────────────────────────────────────────
const ROLE_BADGE_COLORS: Record<string, string> = {
  owner: 'bg-[#1e3a5f]/10 text-[#1e3a5f]',
  admin: 'bg-amber-100 text-amber-700',
  editor: 'bg-blue-100 text-blue-700',
  viewer: 'bg-stone-100 text-stone-500',
}

const AVATAR_COLORS = [
  'bg-[#1e3a5f] text-white',
  'bg-[#e07a2f]/20 text-[#e07a2f]',
  'bg-emerald-100 text-emerald-700',
  'bg-blue-100 text-blue-700',
  'bg-stone-200 text-stone-500',
]

const PERMISSION_MATRIX = [
  { action: 'permissionsPage.matrix.viewTransaction', viewer: true, editor: true, admin: true, owner: true },
  { action: 'permissionsPage.matrix.editOffers', viewer: false, editor: true, admin: true, owner: true },
  { action: 'permissionsPage.matrix.manageDocuments', viewer: false, editor: true, admin: true, owner: true },
  { action: 'permissionsPage.matrix.cancelArchive', viewer: false, editor: false, admin: true, owner: true },
  { action: 'permissionsPage.matrix.manageAccess', viewer: false, editor: false, admin: true, owner: true },
  { action: 'permissionsPage.matrix.deleteTransaction', viewer: false, editor: false, admin: false, owner: true },
  { action: 'permissionsPage.matrix.transferOwnership', viewer: false, editor: false, admin: false, owner: true },
]

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// ─── Component ───────────────────────────────────────────────
export default function PermissionsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const transactionId = Number(id)

  // ─── Data Queries ────────────────────────────────────────
  const { data: txData, isLoading: txLoading } = useQuery({
    queryKey: ['transaction', transactionId],
    queryFn: () => transactionsApi.get(transactionId),
    enabled: !!transactionId,
  })
  const transaction = txData?.data?.transaction

  const { data: authData } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: authApi.me,
    staleTime: 5 * 60 * 1000,
  })
  const currentUser = authData?.data?.user

  const { data: membersData, isLoading: membersLoading } = useQuery({
    queryKey: ['members', transactionId],
    queryFn: () => membersApi.list(transactionId),
    enabled: !!transactionId,
  })
  const members = membersData?.data?.members ?? []

  const { data: linkData } = useQuery({
    queryKey: ['share-link', transactionId],
    queryFn: () => shareLinksApi.get(transactionId),
    enabled: !!transactionId,
  })
  const existingLink = linkData?.data?.shareLink ?? null

  const { data: activityData } = useQuery({
    queryKey: ['activity', transactionId, 1],
    queryFn: () => transactionsApi.getActivity(transactionId, 1, 10),
    enabled: !!transactionId,
  })

  // Filter member-related activities
  const memberActivities = useMemo(() => {
    const all = activityData?.data?.data ?? activityData?.data ?? []
    if (!Array.isArray(all)) return []
    return (all as ActivityEntry[])
      .filter((a) => ['member_invited', 'member_role_changed', 'member_removed'].includes(a.activityType))
      .slice(0, 5)
  }, [activityData])

  // ─── Modal & UI State ────────────────────────────────────
  const [modal, setModal] = useState<ModalState>({ type: 'none' })
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<MemberRole>('editor')
  const [inviteMessage, setInviteMessage] = useState('')
  const [removeConfirmed, setRemoveConfirmed] = useState(false)
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  const [highlightMemberId, setHighlightMemberId] = useState<number | null>(null)
  const [linkToggle, setLinkToggle] = useState(false)

  // ─── Mutations ───────────────────────────────────────────
  const inviteMutation = useMutation({
    mutationFn: () =>
      membersApi.invite(transactionId, {
        email: inviteEmail,
        role: inviteRole,
        message: inviteMessage || undefined,
      }),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: ['members', transactionId] })
        setModal({ type: 'invite-sent', email: inviteEmail, role: inviteRole })
        setInviteEmail('')
        setInviteRole('editor')
        setInviteMessage('')
      } else if (res.error?.code === 'E_MAX_MEMBERS_REACHED') {
        setModal({
          type: 'permission-error',
          yourRole: 'Admin',
          requiredRole: 'Owner',
          ownerName: '',
        })
      }
    },
    onError: () => toast({ title: t('common.error'), variant: 'destructive' }),
  })

  const updateRoleMutation = useMutation({
    mutationFn: ({ memberId, role }: { memberId: number; role: MemberRole }) =>
      membersApi.updateRole(transactionId, memberId, role),
    onSuccess: (_res, vars) => {
      queryClient.invalidateQueries({ queryKey: ['members', transactionId] })
      queryClient.invalidateQueries({ queryKey: ['activity', transactionId] })
      const member = members.find((m) => m.id === vars.memberId)
      const name = member?.user?.fullName || member?.email || ''
      setToastMsg(t('permissionsPage.toast.roleChanged', { name, role: t(`members.roles.${vars.role}`) }))
      setHighlightMemberId(vars.memberId)
      setTimeout(() => {
        setToastMsg(null)
        setHighlightMemberId(null)
      }, 4000)
    },
    onError: () => toast({ title: t('common.error'), variant: 'destructive' }),
  })

  const revokeMutation = useMutation({
    mutationFn: (memberId: number) => membersApi.revoke(transactionId, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members', transactionId] })
      queryClient.invalidateQueries({ queryKey: ['activity', transactionId] })
      setModal({ type: 'none' })
      toast({ title: t('members.revoked'), variant: 'success' })
    },
    onError: () => toast({ title: t('common.error'), variant: 'destructive' }),
  })

  const handleOpenRemove = useCallback((member: TransactionMember) => {
    setRemoveConfirmed(false)
    setModal({ type: 'remove', member })
  }, [])

  const handleOpenInvite = useCallback(() => {
    setInviteEmail('')
    setInviteRole('editor')
    setInviteMessage('')
    setModal({ type: 'invite' })
  }, [])

  // ─── Derived ─────────────────────────────────────────────
  const clientName = transaction?.client
    ? `${transaction.client.firstName} ${transaction.client.lastName}`
    : ''
  const propertyAddress = transaction?.property?.address || ''
  const isOwner = currentUser?.id === transaction?.ownerUserId
  const activeMembers = members.filter((m) => m.status === 'active')
  const pendingMembers = members.filter((m) => m.status === 'pending')
  const totalCount = 1 + activeMembers.length + pendingMembers.length // owner + members

  // ─── Loading ─────────────────────────────────────────────
  if (txLoading || membersLoading) {
    return (
      <div className="bg-stone-50 min-h-[80vh]">
        <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
          <div className="h-8 w-64 bg-stone-200 rounded animate-pulse" />
          <div className="bg-white rounded-xl border border-stone-200 h-64 animate-pulse" />
          <div className="bg-white rounded-xl border border-stone-200 h-32 animate-pulse" />
        </div>
      </div>
    )
  }

  // ─── Render ──────────────────────────────────────────────
  return (
    <div className="bg-stone-50 min-h-[80vh]">
      {/* Toast notification (État D) */}
      {toastMsg && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-3">
          <Check className="w-4 h-4" />
          <span className="text-sm font-medium">{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-stone-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs text-stone-400 mb-2">
            <button onClick={() => navigate('/transactions')} className="hover:text-stone-600">
              {t('nav.transactions', 'Transactions')}
            </button>
            <ChevronRight className="w-3 h-3" />
            <button
              onClick={() => navigate(`/transactions/${transactionId}`)}
              className="hover:text-stone-600 truncate max-w-[150px]"
            >
              {clientName}
            </button>
            <ChevronRight className="w-3 h-3" />
            <span className="text-stone-600 font-medium flex-shrink-0">
              {t('permissionsPage.title', 'Accès & Permissions')}
            </span>
          </div>

          {/* Title row */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[#1e3a5f]/10 rounded-lg flex items-center justify-center">
                <Lock className="w-4.5 h-4.5 text-[#1e3a5f]" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-bold text-stone-900">
                  {t('permissionsPage.title', 'Accès & Permissions')}
                </h1>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-stone-500">
                  <span>{clientName}</span>
                  {propertyAddress && (
                    <>
                      <span className="hidden sm:inline text-stone-300">·</span>
                      <span className="hidden sm:inline">{propertyAddress}</span>
                    </>
                  )}
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-700">
                    {t('permissionsPage.active', 'Active')}
                  </span>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#1e3a5f]/10 text-[#1e3a5f]">
                    {totalCount} {t('permissionsPage.membersCount', 'membres')}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={handleOpenInvite}
              className="px-3 py-2 text-xs font-medium text-white bg-[#1e3a5f] hover:bg-[#1e3a5f]/90 rounded-lg shadow-sm flex items-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" />
              {t('permissionsPage.invite', 'Inviter')}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        {/* ═══ Members List Card ═══ */}
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm">
          <div className="px-5 py-3 border-b border-stone-100">
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
              {t('permissionsPage.accessLabel', 'Accès à la transaction')}
            </p>
          </div>

          <div className="divide-y divide-stone-100">
            {/* Owner row */}
            {transaction && (
              <div className="px-5 py-3 flex items-center gap-3 hover:bg-stone-50 transition-colors">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${AVATAR_COLORS[0]}`}>
                  {currentUser && currentUser.id === transaction.ownerUserId
                    ? getInitials(currentUser.fullName || currentUser.email)
                    : 'OW'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-stone-900">
                      {currentUser && currentUser.id === transaction.ownerUserId
                        ? currentUser.fullName || currentUser.email
                        : t('members.owner', 'Owner')}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold uppercase ${ROLE_BADGE_COLORS.owner}`}>
                      Owner
                    </span>
                    {currentUser?.id === transaction.ownerUserId && (
                      <span className="text-[10px] text-stone-400">({t('permissionsPage.you', 'vous')})</span>
                    )}
                  </div>
                  <p className="text-xs text-stone-400 hidden sm:block">
                    {currentUser && currentUser.id === transaction.ownerUserId ? currentUser.email : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-[10px] text-emerald-600 font-medium">{t('permissionsPage.statusActive', 'Actif')}</span>
                  </div>
                  <button
                    disabled
                    className="p-1.5 text-stone-300 cursor-not-allowed"
                    title={t('permissionsPage.cannotModifyOwner', 'Impossible de modifier le Owner')}
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Active members */}
            {activeMembers.map((member, idx) => {
              const name = member.user?.fullName || member.email
              const isHighlighted = highlightMemberId === member.id
              return (
                <div
                  key={member.id}
                  className={`px-5 py-3 flex items-center gap-3 transition-colors ${
                    isHighlighted ? 'bg-amber-50/50' : 'hover:bg-stone-50'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${AVATAR_COLORS[(idx + 1) % AVATAR_COLORS.length]}`}>
                    {getInitials(name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-stone-900">{name}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold uppercase ${ROLE_BADGE_COLORS[member.role]}`}>
                        {t(`members.roles.${member.role}`)}
                      </span>
                      {isHighlighted && (
                        <span className="text-[10px] text-amber-600 flex items-center gap-0.5">
                          <TrendingUp className="w-3 h-3" />
                          {t('permissionsPage.wasRole', 'était {{role}}', { role: 'Admin' })}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-stone-400 hidden sm:block">{member.user?.email || member.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span className="text-[10px] text-emerald-600 font-medium">{t('permissionsPage.statusActive', 'Actif')}</span>
                    </div>
                    <select
                      value={member.role}
                      onChange={(e) =>
                        updateRoleMutation.mutate({ memberId: member.id, role: e.target.value as MemberRole })
                      }
                      className={`text-xs border rounded-lg px-2 py-1 bg-white ${
                        isHighlighted ? 'border-amber-300 bg-amber-50' : 'border-stone-200'
                      }`}
                    >
                      {(['admin', 'editor', 'viewer'] as const).map((r) => (
                        <option key={r} value={r}>{t(`members.roles.${r}`)}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleOpenRemove(member)}
                      className="p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })}

            {/* Pending members */}
            {pendingMembers.map((member) => (
              <div key={member.id} className="px-5 py-3 flex items-center gap-3 hover:bg-stone-50 transition-colors">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-stone-200 text-stone-500">
                  {getInitials(member.email)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-stone-500">{member.email}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold uppercase ${ROLE_BADGE_COLORS[member.role]}`}>
                      {t(`members.roles.${member.role}`)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Clock className="w-3 h-3 text-amber-500" />
                    <span className="text-xs text-stone-400">
                      {t('permissionsPage.inviteSentAgo', 'Invitation envoyée il y a 2 jours')}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span className="text-[10px] text-amber-600 font-medium">Pending</span>
                  </div>
                  <button className="text-[10px] text-[#1e3a5f] font-medium hover:underline">
                    {t('permissionsPage.resend', 'Renvoyer')}
                  </button>
                  <button
                    onClick={() => handleOpenRemove(member)}
                    className="p-1.5 text-stone-400 hover:text-red-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ═══ Public Link Section ═══ */}
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <Link2 className="w-4 h-4 text-blue-500" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-stone-900">
                  {t('permissionsPage.publicLink', 'Lien public')}
                </h3>
                <p className="text-[10px] text-stone-400">
                  {t('permissionsPage.publicLinkSub', 'Accès sans compte · Configurable via Exporter & Partager')}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                if (!linkToggle && !existingLink) {
                  navigate(`/transactions/${transactionId}/export`)
                } else {
                  setLinkToggle(!linkToggle)
                }
              }}
              className={`relative w-9 h-5 rounded-full transition-colors ${
                existingLink?.isActive || linkToggle ? 'bg-[#1e3a5f]' : 'bg-stone-300'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  existingLink?.isActive || linkToggle ? 'translate-x-4' : ''
                }`}
              />
            </button>
          </div>

          {!existingLink?.isActive && !linkToggle && (
            <div className="mt-3 rounded-lg bg-stone-50 border border-stone-100 p-3 flex items-start gap-2">
              <Info className="w-3.5 h-3.5 text-stone-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-stone-500">
                {t('permissionsPage.noActiveLink', 'Aucun lien actif. Activez pour configurer rôle, expiration et mot de passe.')}
              </p>
            </div>
          )}
        </div>

        {/* ═══ Permissions Matrix ═══ */}
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5">
          <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-3">
            {t('permissionsPage.matrixTitle', 'Matrice des permissions')}
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-stone-200">
                  <th className="text-left py-2 pr-4 font-semibold text-stone-600 min-w-[140px]">
                    {t('permissionsPage.matrix.action', 'Action')}
                  </th>
                  <th className="w-16 text-center py-2 font-semibold text-stone-400">Viewer</th>
                  <th className="w-16 text-center py-2 font-semibold text-blue-600">Editor</th>
                  <th className="w-16 text-center py-2 font-semibold text-amber-600">Admin</th>
                  <th className="w-16 text-center py-2 font-semibold text-[#1e3a5f]">Owner</th>
                </tr>
              </thead>
              <tbody>
                {PERMISSION_MATRIX.map(({ action, viewer, editor, admin, owner }) => (
                  <tr key={action} className="border-b border-stone-100 last:border-b-0">
                    <td className="py-2 pr-4 text-stone-700">{t(action)}</td>
                    {[viewer, editor, admin, owner].map((allowed, i) => (
                      <td key={i} className="text-center py-2">
                        {allowed ? (
                          <Check className="w-4 h-4 text-emerald-500 mx-auto" />
                        ) : (
                          <X className="w-4 h-4 text-stone-300 mx-auto" />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ═══ Activity Log (État D) ═══ */}
        {memberActivities.length > 0 && (
          <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5">
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-3">
              {t('permissionsPage.activityLog', 'Journal des accès (récent)')}
            </p>
            <div className="space-y-2">
              {memberActivities.map((activity) => {
                const iconMap: Record<string, { bg: string; icon: typeof Pencil; color: string }> = {
                  member_role_changed: { bg: 'bg-amber-100', icon: Pencil, color: 'text-amber-600' },
                  member_invited: { bg: 'bg-emerald-100', icon: UserPlus, color: 'text-emerald-600' },
                  member_removed: { bg: 'bg-red-100', icon: X, color: 'text-red-600' },
                }
                const config = iconMap[activity.activityType] || iconMap.member_invited
                const IconComp = config.icon
                const userName = activity.user?.fullName || activity.user?.email || t('common.system', 'Système')
                const meta = activity.metadata || {}

                let description = ''
                if (activity.activityType === 'member_role_changed') {
                  description = t('permissionsPage.activity.roleChanged', {
                    user: userName,
                    target: meta.memberName || meta.email || '',
                    oldRole: meta.oldRole || '',
                    newRole: meta.newRole || '',
                    defaultValue: '{{user}} a modifié le rôle de {{target}} : {{oldRole}} → {{newRole}}',
                  })
                } else if (activity.activityType === 'member_invited') {
                  description = t('permissionsPage.activity.invited', {
                    user: userName,
                    email: meta.email || '',
                    role: meta.role || '',
                    defaultValue: '{{user}} a invité {{email}} en tant que {{role}}',
                  })
                } else if (activity.activityType === 'member_removed') {
                  description = t('permissionsPage.activity.removed', {
                    user: userName,
                    target: meta.memberName || meta.email || '',
                    defaultValue: '{{user}} a retiré l\'accès de {{target}}',
                  })
                }

                const createdAt = new Date(activity.createdAt)
                const diffMs = Date.now() - createdAt.getTime()
                const diffMins = Math.floor(diffMs / 60000)
                const diffHours = Math.floor(diffMs / 3600000)
                const diffDays = Math.floor(diffMs / 86400000)
                let timeAgo = ''
                if (diffMins < 60) timeAgo = t('permissionsPage.activity.minutesAgo', { count: diffMins, defaultValue: 'Il y a {{count}} minute(s)' })
                else if (diffHours < 24) timeAgo = t('permissionsPage.activity.hoursAgo', { count: diffHours, defaultValue: 'Il y a {{count}} heure(s)' })
                else timeAgo = t('permissionsPage.activity.daysAgo', { count: diffDays, defaultValue: 'Il y a {{count}} jour(s)' })

                return (
                  <div key={activity.id} className="flex items-start gap-2.5">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${config.bg}`}>
                      <IconComp className={`w-3 h-3 ${config.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-stone-700" dangerouslySetInnerHTML={{ __html: description }} />
                      <p className="text-[10px] text-stone-400">{timeAgo}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* ═══ Modals Overlay ═══ */}
      {modal.type !== 'none' && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4">
          {/* ─── État B: Invite Modal ─── */}
          {modal.type === 'invite' && (
            <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 max-h-[92vh] sm:max-h-none overflow-y-auto">
              <div className="flex justify-center mb-3 sm:hidden pt-3"><div className="w-8 h-1 rounded-full bg-stone-300" /></div>

              {/* Header */}
              <div className="px-5 pt-5 pb-3 border-b border-stone-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#1e3a5f]/10 flex items-center justify-center">
                    <UserPlus className="w-4.5 h-4.5 text-[#1e3a5f]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-stone-900 font-outfit">
                      {t('permissionsPage.inviteTitle', 'Inviter un collaborateur')}
                    </h3>
                    <p className="text-xs text-stone-500">
                      {t('permissionsPage.inviteSubtitle', 'Donner accès à cette transaction')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="px-5 py-4 space-y-4">
                {/* Email */}
                <div>
                  <label className="text-xs font-medium text-stone-600">
                    {t('permissionsPage.emailLabel', 'Courriel')} <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="nom@exemple.com"
                    className="mt-1 w-full px-3 py-2 text-sm border border-stone-300 rounded-lg outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f]"
                  />
                </div>

                {/* Role radio cards */}
                <div>
                  <label className="text-xs font-medium text-stone-600">
                    {t('members.roleLabel', 'Rôle')}
                  </label>
                  <div className="grid grid-cols-3 gap-2 mt-1">
                    {([
                      { role: 'viewer' as const, label: 'Viewer', sub: t('permissionsPage.roleViewer', 'Lecture seule') },
                      { role: 'editor' as const, label: 'Editor', sub: t('permissionsPage.roleEditor', 'Modifier') },
                      { role: 'admin' as const, label: 'Admin', sub: t('permissionsPage.roleAdmin', 'Gérer') },
                    ]).map(({ role, label, sub }) => (
                      <button
                        key={role}
                        onClick={() => setInviteRole(role)}
                        className={`text-center p-2.5 rounded-xl border-2 cursor-pointer transition-colors ${
                          inviteRole === role
                            ? 'border-[#1e3a5f] bg-[#1e3a5f]/[0.03]'
                            : 'border-stone-200 hover:border-stone-400'
                        }`}
                      >
                        <p className="text-[11px] font-medium text-stone-700">{label}</p>
                        <p className="text-[9px] text-stone-400 mt-0.5">{sub}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label className="text-xs font-medium text-stone-600">
                    {t('members.messageLabel', 'Message')} <span className="text-stone-400">({t('common.optional', 'optionnel')})</span>
                  </label>
                  <textarea
                    rows={2}
                    value={inviteMessage}
                    onChange={(e) => setInviteMessage(e.target.value)}
                    placeholder={t('members.messagePlaceholder', 'Message personnalisé pour l\'invitation...')}
                    className="mt-1 w-full px-3 py-2 text-sm border border-stone-300 rounded-lg resize-none outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f]"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="px-5 py-4 border-t border-stone-100 flex items-center justify-end gap-2">
                <button
                  onClick={() => setModal({ type: 'none' })}
                  className="px-3 py-2 text-xs font-medium text-stone-600 bg-white border border-stone-300 rounded-lg hover:bg-stone-50"
                >
                  {t('common.cancel', 'Annuler')}
                </button>
                <button
                  onClick={() => inviteMutation.mutate()}
                  disabled={!inviteEmail.includes('@') || !inviteEmail.includes('.') || inviteMutation.isPending}
                  className={`px-4 py-2 text-xs font-medium text-white rounded-lg shadow-sm flex items-center gap-1.5 ${
                    inviteEmail.includes('@') && inviteEmail.includes('.')
                      ? 'bg-[#1e3a5f] hover:bg-[#1e3a5f]/90'
                      : 'bg-stone-300 cursor-not-allowed'
                  }`}
                >
                  {inviteMutation.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  {t('members.sendInvite', 'Envoyer l\'invitation')}
                </button>
              </div>
            </div>
          )}

          {/* ─── État C: Invitation Sent ─── */}
          {modal.type === 'invite-sent' && (
            <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center animate-in fade-in zoom-in-95 max-h-[92vh] sm:max-h-none overflow-y-auto">
              <div className="flex justify-center mb-3 sm:hidden"><div className="w-8 h-1 rounded-full bg-stone-300" /></div>
              <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <Mail className="w-7 h-7 text-emerald-600" />
              </div>
              <h3 className="text-sm font-bold text-stone-900 mb-1">
                {t('permissionsPage.inviteSentTitle', 'Invitation envoyée')}
              </h3>
              <p className="text-xs text-stone-500 mb-4">
                {t('permissionsPage.inviteSentSubtitle', 'Un courriel a été envoyé à l\'adresse indiquée')}
              </p>

              {/* Details */}
              <div className="rounded-lg bg-stone-50 border border-stone-200 p-3 text-left mb-4 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-500">{t('permissionsPage.emailLabel', 'Courriel')}</span>
                  <span className="text-stone-700 font-medium">{modal.email}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-500">{t('members.roleLabel', 'Rôle')}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${ROLE_BADGE_COLORS[modal.role]}`}>
                    {t(`members.roles.${modal.role}`)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-500">{t('permissionsPage.status', 'Statut')}</span>
                  <span className="text-amber-600 font-medium flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    Pending
                  </span>
                </div>
              </div>

              <p className="text-[10px] text-stone-400 mb-4">
                {t('permissionsPage.inviteSentHint', 'L\'utilisateur apparaîtra dans la liste une fois qu\'il aura accepté l\'invitation.')}
              </p>

              <button
                onClick={() => setModal({ type: 'none' })}
                className="w-full px-4 py-2.5 text-xs font-medium text-[#1e3a5f] bg-white border border-stone-300 rounded-lg hover:bg-stone-50"
              >
                {t('common.close', 'Fermer')}
              </button>
            </div>
          )}

          {/* ─── État E: Remove Access ─── */}
          {modal.type === 'remove' && (
            <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-sm animate-in fade-in zoom-in-95 max-h-[92vh] sm:max-h-none overflow-y-auto">
              <div className="flex justify-center mb-3 sm:hidden pt-3"><div className="w-8 h-1 rounded-full bg-stone-300" /></div>
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                    <UserPlus className="w-5 h-5 text-red-600 rotate-45" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-stone-900">
                      {t('permissionsPage.removeTitle', 'Retirer l\'accès')}
                    </h3>
                    <p className="text-xs text-stone-500">
                      {t('permissionsPage.removeReversible', 'Cette action est réversible')}
                    </p>
                  </div>
                </div>

                {/* Warning */}
                <div className="rounded-lg bg-red-50 border border-red-200 p-3 mb-4">
                  <p className="text-xs text-red-700">
                    {t('permissionsPage.removeWarning', {
                      name: modal.member.user?.fullName || modal.member.email,
                      role: t(`members.roles.${modal.member.role}`),
                      defaultValue: 'Vous êtes sur le point de retirer l\'accès de {{name}} ({{role}}) à cette transaction. Elle ne pourra plus consulter ni modifier les données.',
                    })}
                  </p>
                </div>

                {/* User card */}
                <div className="rounded-lg border border-stone-200 p-3 mb-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">
                    {getInitials(modal.member.user?.fullName || modal.member.email)}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-stone-900">
                      {modal.member.user?.fullName || modal.member.email}
                    </p>
                    <p className="text-[10px] text-stone-400">
                      {modal.member.user?.email || modal.member.email} · {t(`members.roles.${modal.member.role}`)}
                    </p>
                  </div>
                </div>

                {/* Confirm checkbox */}
                <label className="flex items-start gap-2 cursor-pointer mb-4">
                  <input
                    type="checkbox"
                    checked={removeConfirmed}
                    onChange={(e) => setRemoveConfirmed(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-stone-300 text-red-600 focus:ring-red-200"
                  />
                  <span className="text-xs text-stone-600">
                    {t('permissionsPage.removeConfirm', 'Je confirme vouloir retirer cet accès')}
                  </span>
                </label>

                {/* Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setModal({ type: 'none' })}
                    className="flex-1 px-3 py-2 text-xs font-medium text-stone-600 bg-white border border-stone-300 rounded-lg hover:bg-stone-50"
                  >
                    {t('common.cancel', 'Annuler')}
                  </button>
                  <button
                    onClick={() => revokeMutation.mutate(modal.member.id)}
                    disabled={!removeConfirmed || revokeMutation.isPending}
                    className={`flex-1 px-3 py-2 text-xs font-medium text-white rounded-lg shadow-sm ${
                      removeConfirmed
                        ? 'bg-red-600 hover:bg-red-700'
                        : 'bg-stone-300 cursor-not-allowed'
                    }`}
                  >
                    {revokeMutation.isPending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" />
                    ) : (
                      t('permissionsPage.removeAccess', 'Retirer l\'accès')
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ─── État F: Permission Error ─── */}
          {modal.type === 'permission-error' && (
            <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-sm animate-in fade-in zoom-in-95 max-h-[92vh] sm:max-h-none overflow-y-auto">
              <div className="flex justify-center mb-3 sm:hidden pt-3"><div className="w-8 h-1 rounded-full bg-stone-300" /></div>
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                    <Lock className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-stone-900">
                      {t('permissionsPage.errorTitle', 'Permission insuffisante')}
                    </h3>
                    <p className="text-xs text-stone-500">
                      {t('permissionsPage.errorSubtitle', 'Action non autorisée')}
                    </p>
                  </div>
                </div>

                {/* Warning */}
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 mb-4">
                  <p className="text-xs text-amber-800">
                    {t('permissionsPage.errorMessage', {
                      requiredRole: modal.requiredRole,
                      yourRole: modal.yourRole,
                      defaultValue: 'Seul le Owner peut transférer la propriété de la transaction. Vous êtes actuellement {{yourRole}}.',
                    })}
                  </p>
                </div>

                {/* Details */}
                <div className="rounded-lg border border-stone-200 p-3 mb-4 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-stone-500">{t('permissionsPage.yourRole', 'Votre rôle')}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${ROLE_BADGE_COLORS.admin}`}>
                      {modal.yourRole}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-stone-500">{t('permissionsPage.requiredRole', 'Rôle requis')}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${ROLE_BADGE_COLORS.owner}`}>
                      {modal.requiredRole}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-stone-500">{t('permissionsPage.currentOwner', 'Owner actuel')}</span>
                    <span className="text-stone-700 font-medium">{modal.ownerName}</span>
                  </div>
                </div>

                {/* Buttons */}
                <div className="space-y-2">
                  <button
                    onClick={() => setModal({ type: 'none' })}
                    className="w-full px-4 py-2.5 text-xs font-medium text-white bg-[#1e3a5f] hover:bg-[#1e3a5f]/90 rounded-lg shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    {t('permissionsPage.requestAccess', 'Demander l\'accès au Owner')}
                  </button>
                  <button
                    onClick={() => setModal({ type: 'none' })}
                    className="w-full px-4 py-2 text-xs font-medium text-stone-600 bg-white border border-stone-300 rounded-lg hover:bg-stone-50"
                  >
                    {t('common.close', 'Fermer')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
