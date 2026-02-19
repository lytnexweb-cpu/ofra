import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Search,
  Download,
  X,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  Users,
  Clock,
  AlertCircle,
  HardHat,
  Sparkles,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  StickyNote,
  ListTodo,
  BarChart3,
  Zap,
} from 'lucide-react'
import {
  adminApi,
  type AdminUser,
  type AdminNote,
  type AdminTask,
  type EngagementLevel,
  type SubscriptionStatus,
  type SubscribersParams,
} from '../../api/admin.api'
import { authApi, type UserRole } from '../../api/auth.api'
import { formatRelativeDate, formatDate } from '../../lib/date'

/* ========== DESIGN TOKENS ========== */
const T = {
  bg: '#F8FAFC',
  fg: '#0F172A',
  card: '#FFFFFF',
  cardFg: '#0F172A',
  primary: '#1E3A5F',
  primaryFg: '#F8FAFC',
  secondary: '#F1F5F9',
  muted: '#F1F5F9',
  mutedFg: '#64748B',
  accent: '#F59E0B',
  success: '#10B981',
  successLight: '#D1FAE5',
  destructive: '#EF4444',
  destructiveLight: '#FEE2E2',
  warning: '#F97316',
  warningLight: '#FFF7ED',
  border: '#E2E8F0',
  radius: '12px',
  info: '#3B82F6',
  infoLight: '#DBEAFE',
  font: "'Inter', system-ui, -apple-system, sans-serif",
} as const

/* ========== TYPES ========== */
type Segment = 'all' | 'trial_expiring' | 'at_risk' | 'founders' | 'new_7d' | 'past_due'
type DrawerTab = 'notes' | 'tasks'

const SEGMENTS: Array<{
  key: Segment
  label: string
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>
}> = [
  { key: 'all', label: 'Tous', icon: Users },
  { key: 'trial_expiring', label: 'Trial J25+', icon: Clock },
  { key: 'at_risk', label: 'A risque', icon: AlertCircle },
  { key: 'founders', label: 'Fondateurs', icon: HardHat },
  { key: 'new_7d', label: 'Cette semaine', icon: Sparkles },
  { key: 'past_due', label: 'Impayes', icon: CreditCard },
]

/* ========== HELPERS ========== */
function statusBadge(status: SubscriptionStatus): { label: string; bg: string; color: string } {
  switch (status) {
    case 'active':
      return { label: 'Actif', bg: T.successLight, color: '#065F46' }
    case 'past_due':
      return { label: 'Impaye', bg: T.warningLight, color: '#9A3412' }
    case 'trial':
      return { label: 'Trial', bg: T.infoLight, color: '#1E40AF' }
    case 'cancelled':
    case 'expired':
      return { label: 'Resilie', bg: T.destructiveLight, color: '#991B1B' }
    default:
      return { label: status, bg: T.muted, color: T.mutedFg }
  }
}

function engagementInfo(level: EngagementLevel): { label: string; dotColor: string } {
  switch (level) {
    case 'active':
      return { label: 'Actif', dotColor: T.success }
    case 'warm':
      return { label: 'Tiede', dotColor: T.accent }
    case 'inactive':
      return { label: 'Inactif', dotColor: T.destructive }
    default:
      return { label: level, dotColor: T.mutedFg }
  }
}

function planText(user: AdminUser): { text: string; isNoPlan: boolean } {
  // We derive plan text from subscriptionStatus
  // If trial or no plan info, show dash
  if (user.subscriptionStatus === 'trial' || !user.subscriptionStatus) {
    return { text: '\u2014', isNoPlan: true }
  }
  // We don't have plan name from the API, so show status-based text
  // The API doesn't expose plan name directly on AdminUser, so we show a dash for non-active
  if (user.subscriptionStatus === 'cancelled' || user.subscriptionStatus === 'expired') {
    return { text: '\u2014', isNoPlan: true }
  }
  return { text: 'Actif', isNoPlan: false }
}

function formatShortDate(dateStr: string): string {
  try {
    return formatDate(dateStr, 'd MMM')
  } catch {
    return dateStr
  }
}

/* ========== DRAWER COMPONENT ========== */
function UserDrawer({
  user,
  onClose,
  isSuperadmin,
}: {
  user: AdminUser
  onClose: () => void
  isSuperadmin: boolean
}) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [newNote, setNewNote] = useState('')
  const [newTask, setNewTask] = useState('')
  const [activeTab, setActiveTab] = useState<DrawerTab>('notes')
  const [extendDays, setExtendDays] = useState('')
  const [extendReason, setExtendReason] = useState('')

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const { data: notesData } = useQuery({
    queryKey: ['admin', 'notes', user.id],
    queryFn: () => adminApi.getNotes(user.id),
  })

  const { data: tasksData } = useQuery({
    queryKey: ['admin', 'tasks', user.id],
    queryFn: () => adminApi.getTasks(user.id),
  })

  const createNoteMut = useMutation({
    mutationFn: (content: string) => adminApi.createNote(user.id, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'notes', user.id] })
      setNewNote('')
    },
  })

  const deleteNoteMut = useMutation({
    mutationFn: (noteId: number) => adminApi.deleteNote(noteId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'notes', user.id] }),
  })

  const createTaskMut = useMutation({
    mutationFn: (title: string) => adminApi.createTask(user.id, title),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'tasks', user.id] })
      setNewTask('')
    },
  })

  const toggleTaskMut = useMutation({
    mutationFn: ({ taskId, completed }: { taskId: number; completed: boolean }) =>
      adminApi.updateTask(taskId, { completed }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'tasks', user.id] }),
  })

  const deleteTaskMut = useMutation({
    mutationFn: (taskId: number) => adminApi.deleteTask(taskId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'tasks', user.id] }),
  })

  const subscriptionMut = useMutation({
    mutationFn: (status: string) => adminApi.updateSubscriptionStatus(user.id, status as any),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'gens'] }),
  })

  const extendMut = useMutation({
    mutationFn: ({ days, reason }: { days: number; reason: string }) =>
      adminApi.extendSubscription(user.id, days, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'gens'] })
      setExtendDays('')
      setExtendReason('')
    },
  })

  const founderMut = useMutation({
    mutationFn: () => adminApi.toggleFounder(user.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'gens'] }),
  })

  const notes = notesData?.data?.notes || []
  const tasks = tasksData?.data?.tasks || []

  const sb = statusBadge(user.subscriptionStatus)
  const eng = engagementInfo(user.engagement.level)
  const txCount = user.engagement.transactionCount
  const txMax = 25 // plan limit placeholder
  const txPct = Math.min((txCount / txMax) * 100, 100)

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.3)',
          zIndex: 100,
          transition: 'opacity 0.25s',
        }}
      />

      {/* Drawer */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 420,
          maxWidth: '100vw',
          background: T.card,
          zIndex: 110,
          boxShadow: '-8px 0 30px rgba(0,0,0,0.12)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          fontFamily: T.font,
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: `1px solid ${T.border}`,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 16,
            flexShrink: 0,
          }}
        >
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: T.fg, lineHeight: 1.3 }}>
              {user.fullName || user.email}
            </div>
            <div style={{ fontSize: 13, color: T.mutedFg, marginTop: 4 }}>
              {user.email} · Inscrit {formatShortDate(user.createdAt)}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 8,
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: T.mutedFg,
              flexShrink: 0,
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 0 }}>
          {/* Info grid section */}
          <div style={{ padding: '20px 24px', borderBottom: `1px solid ${T.border}` }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {/* Plan */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, color: T.mutedFg }}>
                  Plan
                </span>
                <span style={{ fontSize: 14, fontWeight: 500, color: T.fg }}>
                  {planText(user).isNoPlan ? '\u2014' : planText(user).text}
                  {!planText(user).isNoPlan && (
                    <span style={{ fontSize: 11, color: T.mutedFg, fontWeight: 400, marginLeft: 4 }}>
                      (prix locke)
                    </span>
                  )}
                </span>
              </div>

              {/* Status */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, color: T.mutedFg }}>
                  Statut
                </span>
                <span style={{ fontSize: 14, fontWeight: 500 }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '3px 10px',
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 600,
                      background: sb.bg,
                      color: sb.color,
                    }}
                  >
                    {sb.label}
                  </span>
                </span>
              </div>

              {/* Trial */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, color: T.mutedFg }}>
                  Trial
                </span>
                <span style={{ fontSize: 14, fontWeight: 500, color: T.mutedFg }}>
                  {user.subscriptionStatus === 'trial'
                    ? user.subscriptionEndsAt
                      ? `Expire ${formatShortDate(user.subscriptionEndsAt)}`
                      : 'En cours'
                    : '\u2014'}
                </span>
              </div>

              {/* Role */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, color: T.mutedFg }}>
                  Role
                </span>
                <span style={{ fontSize: 14, fontWeight: 500 }}>
                  {user.role === 'superadmin' ? (
                    <span style={{ fontSize: 13, fontWeight: 600, color: T.accent }}>superadmin</span>
                  ) : (
                    <span style={{ fontSize: 13, color: T.mutedFg }}>{user.role}</span>
                  )}
                </span>
              </div>

              {/* Fondateur toggle */}
              {isSuperadmin && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, color: T.mutedFg }}>
                    Fondateur
                  </span>
                  <button
                    onClick={() => founderMut.mutate()}
                    disabled={founderMut.isPending}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '4px 12px',
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 600,
                      border: 'none',
                      cursor: 'pointer',
                      background: user.isFounder ? '#FEF3C7' : T.muted,
                      color: user.isFounder ? '#92400E' : T.mutedFg,
                    }}
                  >
                    <HardHat size={12} />
                    {user.isFounder ? 'Fondateur' : 'Non'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Utilisation section */}
          <div style={{ padding: '20px 24px', borderBottom: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: T.mutedFg, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
              <BarChart3 size={14} /> Utilisation
            </div>

            {/* TX actives */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: T.fg, flexShrink: 0, minWidth: 100 }}>
                TX actives
              </span>
              <div style={{ flex: 1, margin: '0 12px', height: 8, background: T.muted, borderRadius: 999, overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 999, background: T.primary, width: `${txPct}%`, transition: 'width 0.3s' }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: T.mutedFg, fontVariantNumeric: 'tabular-nums', flexShrink: 0, minWidth: 60, textAlign: 'right' as const }}>
                {txCount} / {txMax}
              </span>
            </div>

            {/* Stockage - placeholder */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: T.fg, flexShrink: 0, minWidth: 100 }}>
                Stockage
              </span>
              <div style={{ flex: 1, margin: '0 12px', height: 8, background: T.muted, borderRadius: 999, overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 999, background: T.primary, width: '8%', transition: 'width 0.3s' }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: T.mutedFg, fontVariantNumeric: 'tabular-nums', flexShrink: 0, minWidth: 60, textAlign: 'right' as const }}>
                0.8 / 10 Go
              </span>
            </div>

            {/* Stats */}
            <div style={{ borderTop: `1px solid ${T.border}`, marginTop: 8, paddingTop: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0' }}>
                <span style={{ fontSize: 13, color: T.mutedFg }}>Conditions</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: T.fg }}>
                  {user.engagement.completedConditions} validees
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0' }}>
                <span style={{ fontSize: 13, color: T.mutedFg }}>Derniere connexion</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: user.engagement.daysSinceLastLogin === 0 ? T.success : T.fg }}>
                  {user.engagement.daysSinceLastLogin !== null
                    ? user.engagement.daysSinceLastLogin === 0
                      ? 'Aujourd\'hui'
                      : `il y a ${user.engagement.daysSinceLastLogin}j`
                    : 'Jamais'}
                </span>
              </div>
            </div>
          </div>

          {/* Abonnement control section */}
          <div style={{ padding: '20px 24px', borderBottom: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: T.mutedFg, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
              <CreditCard size={14} /> Abonnement
            </div>

            {isSuperadmin ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Subscription status dropdown — functional */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: T.fg, minWidth: 60 }}>Statut</span>
                  <select
                    value={user.subscriptionStatus}
                    onChange={(e) => subscriptionMut.mutate(e.target.value)}
                    disabled={subscriptionMut.isPending}
                    style={{
                      padding: '5px 28px 5px 10px',
                      border: `1px solid ${T.border}`,
                      borderRadius: 6,
                      fontSize: 13,
                      fontFamily: T.font,
                      fontWeight: 500,
                      background: T.card,
                      color: T.fg,
                      cursor: 'pointer',
                      appearance: 'none' as const,
                      WebkitAppearance: 'none' as const,
                      backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%2364748B' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 10px center',
                    }}
                  >
                    <option value="trial">Trial</option>
                    <option value="active">Actif</option>
                    <option value="past_due">Impaye</option>
                    <option value="cancelled">Resilie</option>
                  </select>
                </div>

                {/* Extend subscription */}
                <div style={{ background: T.muted, borderRadius: 8, padding: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.fg, marginBottom: 8 }}>
                    Prolonger l'abonnement
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                    {[7, 14, 30].map((d) => (
                      <button
                        key={d}
                        onClick={() => setExtendDays(String(d))}
                        style={{
                          padding: '4px 12px',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 600,
                          border: `1px solid ${extendDays === String(d) ? T.primary : T.border}`,
                          background: extendDays === String(d) ? T.primary : T.card,
                          color: extendDays === String(d) ? T.primaryFg : T.fg,
                          cursor: 'pointer',
                        }}
                      >
                        +{d}j
                      </button>
                    ))}
                    <input
                      type="number"
                      placeholder="Autre"
                      value={![7, 14, 30].includes(Number(extendDays)) ? extendDays : ''}
                      onChange={(e) => setExtendDays(e.target.value)}
                      min={1}
                      max={365}
                      style={{
                        width: 60,
                        padding: '4px 8px',
                        borderRadius: 6,
                        fontSize: 12,
                        border: `1px solid ${T.border}`,
                        background: T.card,
                        fontFamily: T.font,
                      }}
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Raison (obligatoire)"
                    value={extendReason}
                    onChange={(e) => setExtendReason(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '6px 10px',
                      borderRadius: 6,
                      fontSize: 12,
                      border: `1px solid ${T.border}`,
                      background: T.card,
                      fontFamily: T.font,
                      marginBottom: 8,
                      boxSizing: 'border-box',
                    }}
                  />
                  <button
                    disabled={!extendDays || !extendReason.trim() || extendMut.isPending}
                    onClick={() => extendMut.mutate({ days: Number(extendDays), reason: extendReason.trim() })}
                    style={{
                      padding: '6px 16px',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 600,
                      border: 'none',
                      background: (!extendDays || !extendReason.trim()) ? T.muted : T.primary,
                      color: (!extendDays || !extendReason.trim()) ? T.mutedFg : T.primaryFg,
                      cursor: (!extendDays || !extendReason.trim()) ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {extendMut.isPending ? 'En cours...' : 'Prolonger'}
                  </button>
                  {extendMut.isSuccess && (
                    <span style={{ fontSize: 11, color: T.success, marginLeft: 8 }}>Prolonge!</span>
                  )}
                </div>
              </div>
            ) : (
              <span style={{ fontSize: 13, color: T.mutedFg }}>
                Statut : {statusBadge(user.subscriptionStatus).label} (superadmin seulement)
              </span>
            )}
          </div>

          {/* Activite recente section */}
          <div style={{ padding: '20px 24px', borderBottom: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: T.mutedFg, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Zap size={14} /> Activite recente
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {/* Last login activity item */}
              <div style={{ display: 'flex', gap: 12, position: 'relative', paddingBottom: 16 }}>
                {/* Timeline line */}
                <div style={{
                  position: 'absolute',
                  left: 5,
                  top: 14,
                  bottom: 0,
                  width: 1.5,
                  background: T.border,
                }} />
                <div style={{
                  width: 11,
                  height: 11,
                  borderRadius: '50%',
                  background: T.success,
                  flexShrink: 0,
                  marginTop: 3,
                  position: 'relative',
                  zIndex: 1,
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: T.mutedFg, marginBottom: 2 }}>
                    {user.engagement.daysSinceLastLogin !== null
                      ? user.engagement.daysSinceLastLogin === 0
                        ? 'Aujourd\'hui'
                        : `il y a ${user.engagement.daysSinceLastLogin}j`
                      : ''}
                  </div>
                  <div style={{ fontSize: 13, color: T.fg, lineHeight: 1.4 }}>
                    Derniere connexion
                  </div>
                </div>
              </div>

              {/* Account creation */}
              <div style={{ display: 'flex', gap: 12, position: 'relative', paddingBottom: 0 }}>
                <div style={{
                  width: 11,
                  height: 11,
                  borderRadius: '50%',
                  background: T.mutedFg,
                  flexShrink: 0,
                  marginTop: 3,
                  position: 'relative',
                  zIndex: 1,
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: T.mutedFg, marginBottom: 2 }}>
                    {formatShortDate(user.createdAt)}
                  </div>
                  <div style={{ fontSize: 13, color: T.fg, lineHeight: 1.4 }}>
                    Inscription + trial demarre
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Notes / Tasks tabs */}
          <div>
            <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${T.border}` }}>
              <button
                onClick={() => setActiveTab('notes')}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  fontSize: 13,
                  fontWeight: 600,
                  textAlign: 'center' as const,
                  cursor: 'pointer',
                  color: activeTab === 'notes' ? T.primary : T.mutedFg,
                  border: 'none',
                  background: 'none',
                  borderBottom: `2px solid ${activeTab === 'notes' ? T.primary : 'transparent'}`,
                  transition: 'all 0.15s',
                  fontFamily: T.font,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <StickyNote size={14} /> Notes
              </button>
              <button
                onClick={() => setActiveTab('tasks')}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  fontSize: 13,
                  fontWeight: 600,
                  textAlign: 'center' as const,
                  cursor: 'pointer',
                  color: activeTab === 'tasks' ? T.primary : T.mutedFg,
                  border: 'none',
                  background: 'none',
                  borderBottom: `2px solid ${activeTab === 'tasks' ? T.primary : 'transparent'}`,
                  transition: 'all 0.15s',
                  fontFamily: T.font,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <ListTodo size={14} /> Taches
              </button>
            </div>

            {/* Notes tab content */}
            {activeTab === 'notes' && (
              <div style={{ padding: '16px 24px 24px' }}>
                {/* Input */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                  <input
                    type="text"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && newNote.trim() && createNoteMut.mutate(newNote.trim())}
                    placeholder="+ Ajouter une note..."
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      border: `1.5px solid ${T.border}`,
                      borderRadius: 8,
                      fontSize: 13,
                      fontFamily: T.font,
                      color: T.fg,
                      outline: 'none',
                    }}
                  />
                  <button
                    onClick={() => newNote.trim() && createNoteMut.mutate(newNote.trim())}
                    disabled={!newNote.trim() || createNoteMut.isPending}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '6px 14px',
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: !newNote.trim() || createNoteMut.isPending ? 'not-allowed' : 'pointer',
                      border: 'none',
                      background: T.primary,
                      color: T.primaryFg,
                      fontFamily: T.font,
                      opacity: !newNote.trim() || createNoteMut.isPending ? 0.5 : 1,
                    }}
                  >
                    Ajouter
                  </button>
                </div>

                {/* Notes list */}
                {notes.length === 0 ? (
                  <div style={{ color: T.mutedFg, fontSize: 13, textAlign: 'center', padding: '24px 0' }}>
                    Aucune note pour cet abonne.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {notes.map((note: AdminNote) => (
                      <div
                        key={note.id}
                        style={{
                          background: T.muted,
                          borderRadius: 10,
                          padding: '14px 16px',
                          fontSize: 13,
                          lineHeight: 1.5,
                          color: T.fg,
                          position: 'relative',
                        }}
                      >
                        <div style={{ fontSize: 11, color: T.mutedFg, fontWeight: 600, marginBottom: 6 }}>
                          {formatRelativeDate(note.createdAt)}
                        </div>
                        <div style={{ fontStyle: 'italic', color: T.cardFg }}>
                          "{note.content}"
                        </div>
                        {note.author && (
                          <div style={{ fontSize: 11, color: T.mutedFg, marginTop: 6, textAlign: 'right' as const, fontWeight: 600 }}>
                            — {note.author.fullName || note.author.email}
                          </div>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteNoteMut.mutate(note.id) }}
                          style={{
                            position: 'absolute',
                            top: 10,
                            right: 10,
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: T.mutedFg,
                            padding: 4,
                            borderRadius: 4,
                            opacity: 0.5,
                          }}
                          onMouseEnter={(e) => { (e.target as HTMLElement).style.opacity = '1' }}
                          onMouseLeave={(e) => { (e.target as HTMLElement).style.opacity = '0.5' }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tasks tab content */}
            {activeTab === 'tasks' && (
              <div style={{ padding: '16px 24px 24px' }}>
                {/* Input */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                  <input
                    type="text"
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && newTask.trim() && createTaskMut.mutate(newTask.trim())}
                    placeholder="+ Ajouter une tache..."
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      border: `1.5px solid ${T.border}`,
                      borderRadius: 8,
                      fontSize: 13,
                      fontFamily: T.font,
                      color: T.fg,
                      outline: 'none',
                    }}
                  />
                  <button
                    onClick={() => newTask.trim() && createTaskMut.mutate(newTask.trim())}
                    disabled={!newTask.trim() || createTaskMut.isPending}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '6px 14px',
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: !newTask.trim() || createTaskMut.isPending ? 'not-allowed' : 'pointer',
                      border: 'none',
                      background: T.primary,
                      color: T.primaryFg,
                      fontFamily: T.font,
                      opacity: !newTask.trim() || createTaskMut.isPending ? 0.5 : 1,
                    }}
                  >
                    Ajouter
                  </button>
                </div>

                {/* Tasks list */}
                {tasks.length === 0 ? (
                  <div style={{ color: T.mutedFg, fontSize: 13, textAlign: 'center', padding: '24px 0' }}>
                    Aucune tache pour cet abonne.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {tasks.map((task: AdminTask) => (
                      <div
                        key={task.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '8px 4px',
                          borderRadius: 6,
                        }}
                      >
                        <button
                          onClick={() => toggleTaskMut.mutate({ taskId: task.id, completed: !task.completed })}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}
                        >
                          {task.completed ? (
                            <CheckCircle2 size={16} style={{ color: T.success }} />
                          ) : (
                            <Circle size={16} style={{ color: T.mutedFg }} />
                          )}
                        </button>
                        <span
                          style={{
                            fontSize: 13,
                            flex: 1,
                            color: task.completed ? T.mutedFg : T.fg,
                            textDecoration: task.completed ? 'line-through' : 'none',
                          }}
                        >
                          {task.title}
                        </span>
                        <button
                          onClick={() => deleteTaskMut.mutate(task.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: T.mutedFg,
                            padding: 4,
                            borderRadius: 4,
                            opacity: 0.5,
                          }}
                          onMouseEnter={(e) => { (e.target as HTMLElement).style.opacity = '1' }}
                          onMouseLeave={(e) => { (e.target as HTMLElement).style.opacity = '0.5' }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

/* ========== MAIN PAGE ========== */
export default function AdminGensPage() {
  const { t } = useTranslation()
  const [segment, setSegment] = useState<Segment>('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)

  const { data: meData } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: authApi.me,
  })

  // Map segments to backend query params
  const getParams = useCallback((): SubscribersParams => {
    const params: SubscribersParams = { page, limit: 20, search: search || undefined }
    switch (segment) {
      case 'trial_expiring':
        params.subscription = 'trial'
        break
      case 'at_risk':
        params.engagement = 'inactive'
        break
      case 'founders':
        params.founder = 'true'
        break
      case 'new_7d':
        params.sortBy = 'createdAt'
        params.sortOrder = 'desc'
        break
      case 'past_due':
        params.subscription = 'past_due'
        break
    }
    return params
  }, [page, search, segment])

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'gens', { segment, page, search }],
    queryFn: () => adminApi.getSubscribers(getParams()),
  })

  const users = data?.data?.users || []
  const meta = data?.data?.meta
  const totalCount = meta?.total ?? 0
  const lastPage = meta?.lastPage ?? 1
  const currentUserRole = meData?.data?.user?.role

  // Generate page numbers for pagination
  const getPageNumbers = (): number[] => {
    const pages: number[] = []
    const maxVisible = 5
    let start = Math.max(1, page - Math.floor(maxVisible / 2))
    const end = Math.min(lastPage, start + maxVisible - 1)
    start = Math.max(1, end - maxVisible + 1)
    for (let i = start; i <= end; i++) {
      pages.push(i)
    }
    return pages
  }

  return (
    <div data-testid="admin-gens" style={{ fontFamily: T.font }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: T.fg, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Users size={24} /> Abonnes{' '}
          <span style={{ color: T.mutedFg, fontWeight: 500 }}>({totalCount})</span>
        </h1>
        <a
          href={adminApi.exportSubscribers()}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 20px',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            border: `1px solid ${T.border}`,
            background: T.card,
            color: T.fg,
            textDecoration: 'none',
            fontFamily: T.font,
            transition: 'background 0.15s',
          }}
        >
          <Download size={16} /> Exporter CSV
        </a>
      </div>

      {/* Smart Segments */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {SEGMENTS.map((seg) => {
          const isActive = segment === seg.key
          const Icon = seg.icon
          return (
            <button
              key={seg.key}
              onClick={() => { setSegment(seg.key); setPage(1) }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 16px',
                borderRadius: 999,
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                border: `1.5px solid ${isActive ? T.primary : T.border}`,
                background: isActive ? T.primary : T.card,
                color: isActive ? T.primaryFg : T.fg,
                transition: 'all 0.15s',
                fontFamily: T.font,
              }}
            >
              {seg.key !== 'all' && <Icon size={14} />}
              {seg.label}
            </button>
          )
        })}
      </div>

      {/* Search Bar */}
      <div style={{ position: 'relative', marginBottom: 20 }}>
        <Search
          size={16}
          style={{
            position: 'absolute',
            left: 14,
            top: '50%',
            transform: 'translateY(-50%)',
            color: T.mutedFg,
            pointerEvents: 'none',
          }}
        />
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          placeholder="Rechercher par nom ou email..."
          style={{
            width: '100%',
            padding: '12px 16px 12px 44px',
            border: `1.5px solid ${T.border}`,
            borderRadius: 10,
            fontSize: 14,
            fontFamily: T.font,
            background: T.card,
            color: T.fg,
            outline: 'none',
            transition: 'border-color 0.15s',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = T.primary
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(30,58,95,0.1)'
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = T.border
            e.currentTarget.style.boxShadow = 'none'
          }}
        />
      </div>

      {/* Table card */}
      <div style={{ background: T.card, borderRadius: T.radius, border: `1px solid ${T.border}`, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Nom', 'Plan', 'Statut', 'Engagement', 'TX', 'Inscrit'].map((col) => (
                  <th
                    key={col}
                    style={{
                      padding: '12px 16px',
                      fontSize: 12,
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                      color: T.mutedFg,
                      textAlign: 'left' as const,
                      borderBottom: `1px solid ${T.border}`,
                      background: T.muted,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td colSpan={6} style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', gap: 16 }}>
                        <div style={{ height: 16, width: 120, background: T.muted, borderRadius: 4 }} />
                        <div style={{ height: 16, width: 60, background: T.muted, borderRadius: 4 }} />
                        <div style={{ height: 16, width: 60, background: T.muted, borderRadius: 4 }} />
                      </div>
                    </td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '48px 16px', textAlign: 'center', color: T.mutedFg, fontSize: 14 }}>
                    Aucun utilisateur trouve
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const sb = statusBadge(user.subscriptionStatus)
                  const eng = engagementInfo(user.engagement.level)
                  const plan = planText(user)
                  const isSelected = selectedUser?.id === user.id

                  return (
                    <tr
                      key={user.id}
                      onClick={() => setSelectedUser(user)}
                      style={{
                        cursor: 'pointer',
                        borderBottom: `1px solid ${T.border}`,
                        background: isSelected ? '#EFF6FF' : undefined,
                        transition: 'background 0.1s',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) (e.currentTarget as HTMLElement).style.background = '#F1F5F9'
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) (e.currentTarget as HTMLElement).style.background = ''
                      }}
                    >
                      {/* Nom */}
                      <td style={{ padding: '14px 16px', fontSize: 14, whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: 600, color: T.fg }}>
                          {user.fullName || user.email}
                        </div>
                        <div style={{ fontSize: 12, color: T.mutedFg, marginTop: 2 }}>
                          {user.email}
                        </div>
                      </td>

                      {/* Plan */}
                      <td style={{ padding: '14px 16px', fontSize: 14, whiteSpace: 'nowrap' }}>
                        <span style={{ fontWeight: 500, color: plan.isNoPlan ? T.mutedFg : T.fg }}>
                          {plan.text}
                        </span>
                      </td>

                      {/* Statut */}
                      <td style={{ padding: '14px 16px', fontSize: 14, whiteSpace: 'nowrap' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '3px 10px',
                            borderRadius: 999,
                            fontSize: 12,
                            fontWeight: 600,
                            background: sb.bg,
                            color: sb.color,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {sb.label}
                        </span>
                      </td>

                      {/* Engagement */}
                      <td style={{ padding: '14px 16px', fontSize: 14, whiteSpace: 'nowrap' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500 }}>
                          <span
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              display: 'inline-block',
                              background: eng.dotColor,
                            }}
                          />
                          {eng.label}
                        </span>
                      </td>

                      {/* TX */}
                      <td style={{ padding: '14px 16px', fontSize: 14, whiteSpace: 'nowrap' }}>
                        <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                          {user.engagement.transactionCount}
                        </span>
                      </td>

                      {/* Inscrit */}
                      <td style={{ padding: '14px 16px', fontSize: 14, whiteSpace: 'nowrap' }}>
                        <span style={{ color: T.mutedFg, fontSize: 13 }}>
                          {formatShortDate(user.createdAt)}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {lastPage > 1 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              padding: 16,
              borderTop: `1px solid ${T.border}`,
            }}
          >
            <span style={{ fontSize: 13, color: T.mutedFg, marginRight: 16 }}>
              Page {page} / {lastPage}
            </span>
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: 36,
                height: 36,
                padding: '0 10px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 500,
                cursor: page <= 1 ? 'not-allowed' : 'pointer',
                border: `1px solid ${T.border}`,
                background: T.card,
                color: T.fg,
                fontFamily: T.font,
                opacity: page <= 1 ? 0.4 : 1,
                gap: 4,
              }}
            >
              <ChevronLeft size={14} /> Prec
            </button>
            {getPageNumbers().map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: 36,
                  height: 36,
                  padding: '0 10px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  border: `1px solid ${p === page ? T.primary : T.border}`,
                  background: p === page ? T.primary : T.card,
                  color: p === page ? T.primaryFg : T.fg,
                  fontFamily: T.font,
                  transition: 'all 0.15s',
                }}
              >
                {p}
              </button>
            ))}
            <button
              disabled={page >= lastPage}
              onClick={() => setPage(page + 1)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: 36,
                height: 36,
                padding: '0 10px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 500,
                cursor: page >= lastPage ? 'not-allowed' : 'pointer',
                border: `1px solid ${T.border}`,
                background: T.card,
                color: T.fg,
                fontFamily: T.font,
                opacity: page >= lastPage ? 0.4 : 1,
                gap: 4,
              }}
            >
              Suiv <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Mobile Card List */}
      <div className="card-list" style={{ display: 'none' }}>
        {/* Rendered below table for mobile - uses same data */}
      </div>

      {/* Drawer */}
      {selectedUser && (
        <UserDrawer user={selectedUser} onClose={() => setSelectedUser(null)} isSuperadmin={currentUserRole === 'superadmin'} />
      )}
    </div>
  )
}
