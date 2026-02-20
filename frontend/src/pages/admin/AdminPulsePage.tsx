import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Users, FileText, HardHat, DollarSign, BarChart3, Zap, AlertCircle, Clock, CreditCard, ClipboardList } from 'lucide-react'
import { adminApi } from '../../api/admin.api'
import { authApi } from '../../api/auth.api'
import { formatRelativeDate } from '../../lib/date'
import type { ReactNode } from 'react'

// Activity type labels in French (human-readable)
const ACTIVITY_LABELS: Record<string, string> = {
  transaction_created: 'a cree une transaction',
  transaction_cancelled: 'a annule une transaction',
  transaction_archived: 'a archive une transaction',
  transaction_restored: 'a restaure une transaction',
  step_entered: 'a atteint une nouvelle etape',
  step_completed: 'a complete une etape',
  step_skipped: 'a saute une etape',
  condition_created: 'a ajoute une condition',
  condition_completed: 'a valide une condition',
  offer_created: 'a soumis une offre',
  offer_accepted: 'a accepte une offre',
  offer_rejected: 'a refuse une offre',
  offer_withdrawn: 'a retire une offre',
  note_added: 'a ajoute une note',
  document_uploaded: 'a televerse un document',
  document_validated: 'a valide un document',
  document_rejected: 'a rejete un document',
  member_invited: 'a invite un membre',
  member_removed: 'a retire un membre',
  share_link_created: 'a cree un lien de partage',
  pdf_exported: 'a exporte un PDF',
  email_sent: 'a envoye un courriel',
  user_registered: "s'est inscrit",
  offer_intake_received: 'a recu une offre externe',
}

// Plan badge colors
const PLAN_COLORS: Record<string, { bg: string; color: string }> = {
  pro: { bg: '#EDE9FE', color: '#6D28D9' },
  solo: { bg: '#DBEAFE', color: '#2563EB' },
  starter: { bg: '#D1FAE5', color: '#065F46' },
  agence: { bg: '#FFF7ED', color: '#9A3412' },
}

export default function AdminPulsePage() {
  const { t } = useTranslation()

  const { data: meData } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: authApi.me,
  })

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin', 'pulse'],
    queryFn: () => adminApi.getPulse(),
    refetchInterval: 60_000,
  })

  const pulse = data?.data
  const userName = meData?.data?.user?.fullName?.split(' ')[0] || 'Admin'
  const today = new Date()
  const dateStr = today.toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' })

  if (isLoading) {
    return (
      <div className="space-y-6" data-testid="admin-pulse">
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-[#E2E8F0] rounded mb-8" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white border border-[#E2E8F0] rounded-xl p-5">
                <div className="h-3 w-16 bg-[#E2E8F0] rounded mb-3" />
                <div className="h-8 w-12 bg-[#E2E8F0] rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!pulse) {
    return (
      <div className="space-y-6" data-testid="admin-pulse">
        <div className="text-center py-12">
          <p style={{ color: '#EF4444', fontWeight: 600 }}>Erreur de chargement</p>
          <p style={{ color: '#64748B', fontSize: '14px', marginTop: '4px' }}>Impossible de charger les donnees du dashboard.</p>
          <button
            onClick={() => refetch()}
            style={{
              marginTop: '12px',
              padding: '8px 16px',
              background: '#1E3A5F',
              color: '#F8FAFC',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Reessayer
          </button>
        </div>
      </div>
    )
  }

  const founders = pulse.kpis?.founders || 0
  const foundersMax = pulse.kpis?.foundersMax || 25

  return (
    <div className="space-y-8" data-testid="admin-pulse">
      {/* Header — Greeting + Live badge + Date */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A' }}>
            {t('admin.pulse.greeting', { name: userName, defaultValue: `Bonjour ${userName}` })}
          </h1>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: '#D1FAE5',
              color: '#065F46',
              fontSize: '12px',
              fontWeight: 600,
              padding: '4px 12px',
              borderRadius: '999px',
              border: '1px solid #A7F3D0',
            }}
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: '#10B981',
                display: 'inline-block',
                animation: 'pulse-dot 2s infinite',
              }}
            />
            Live
          </span>
        </div>
        <span style={{ marginLeft: 'auto', fontSize: '14px', color: '#64748B', fontWeight: 500 }}>
          {dateStr}
        </span>
      </div>

      {/* KPI Cards — 4 columns */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          icon={<Users size={16} style={{ color: '#64748B' }} />}
          label={t('admin.pulse.totalUsers', 'Users')}
          value={pulse.kpis.totalUsers}
          delta={`+${pulse.kpis.newUsers30d} ${t('admin.pulse.thisMonth', 'ce mois')}`}
          deltaType="success"
        />
        <KPICard
          icon={<FileText size={16} style={{ color: '#64748B' }} />}
          label={t('admin.pulse.activeTx', 'TX Actives')}
          value={pulse.kpis.activeTx}
          delta={`+${pulse.kpis.newTx30d} ${t('admin.pulse.thisMonth', 'ce mois')}`}
          deltaType="success"
        />
        <KPICard
          icon={<HardHat size={16} style={{ color: '#64748B' }} />}
          label={t('admin.pulse.founders', 'Fondateurs')}
          value={founders}
          valueSuffix={`/${foundersMax}`}
          delta={`${foundersMax - founders} ${t('admin.pulse.available', 'dispo')}`}
          deltaType="neutral"
        />
        <KPICard
          icon={<DollarSign size={16} style={{ color: '#64748B' }} />}
          label={t('admin.pulse.mrr', 'MRR')}
          value="—"
          subtext={t('admin.pulse.mrrPlaceholder', 'pre-Stripe')}
          delta={`${t('admin.pulse.mrrExpected', 'Prevu')} : ~686$`}
          deltaType="neutral"
        />
      </div>

      {/* Actions requises */}
      {pulse.alerts && (
        <ActionsRequises
          expiringTrials={pulse.alerts.expiringTrials}
          pastDueUsers={pulse.alerts.pastDueUsers}
          overdueCount={pulse.alerts.overdueConditionsCount}
          t={t}
        />
      )}

      {/* Two columns: Conversion stats + Fondateurs table */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Conversion stats */}
        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChart3 size={16} style={{ color: '#64748B' }} />
              {t('admin.pulse.conversionTitle', 'Conversion Trial')}
            </div>
          </div>
          <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <StatRow label={t('admin.pulse.signedUp', 'Inscrits')} value={String(pulse.conversionStats?.trial || 0)} />
              <StatRow
                label={t('admin.pulse.trialToPaid', 'Trial -> Payant')}
                value={String(pulse.conversionStats?.active || 0)}
                pct={pulse.conversionStats?.conversionRate ? `${pulse.conversionStats.conversionRate.toFixed(1)}%` : undefined}
                pctType="success"
              />
              <StatRow
                label={t('admin.pulse.churn', 'Churn M1')}
                value={String(pulse.conversionStats?.cancelled || 0)}
                pct={pulse.conversionStats?.trial ? `${((pulse.conversionStats.cancelled / pulse.conversionStats.trial) * 100).toFixed(0)}%` : undefined}
                pctType="warn"
              />
            </div>
          </div>
        </div>

        {/* Fondateurs table */}
        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <HardHat size={16} style={{ color: '#64748B' }} />
              {t('admin.pulse.foundersTitle', 'Fondateurs')}
            </div>
            <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 500 }}>{founders}/{foundersMax}</span>
          </div>
          <div style={{ padding: '12px 20px' }}>
            {pulse.alerts?.expiringTrials ? (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#64748B', textAlign: 'left', padding: '0 0 12px 0', borderBottom: '1px solid #E2E8F0', width: '30px' }}>#</th>
                    <th style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#64748B', textAlign: 'left', padding: '0 0 12px 0', borderBottom: '1px solid #E2E8F0' }}>Nom</th>
                    <th style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#64748B', textAlign: 'center', padding: '0 0 12px 0', borderBottom: '1px solid #E2E8F0' }}>Plan</th>
                    <th style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#64748B', textAlign: 'center', padding: '0 0 12px 0', borderBottom: '1px solid #E2E8F0' }}>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Placeholder — backend needs to return founder list */}
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', color: '#64748B', padding: '20px 0', fontSize: '13px' }}>
                      {founders === 0 ? t('admin.pulse.noFounders', 'Aucun fondateur encore') : `${founders} fondateur${founders > 1 ? 's' : ''} inscrits`}
                    </td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <p style={{ textAlign: 'center', color: '#64748B', padding: '20px 0', fontSize: '13px' }}>
                {t('admin.pulse.noFounders', 'Aucun fondateur encore')}
              </p>
            )}
          </div>
          <div style={{ padding: '12px 20px', borderTop: '1px solid #E2E8F0', textAlign: 'right' }}>
            <button
              style={{ background: 'none', border: 'none', color: '#1E3A5F', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
              onClick={() => {/* navigate to gens with founder filter */}}
            >
              {t('admin.pulse.viewAll', 'Voir tous ->')}
            </button>
          </div>
        </div>
      </div>

      {/* Activity Feed */}
      <div>
        <div style={{ fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Zap size={16} style={{ color: '#F59E0B' }} />
          {t('admin.pulse.activityFeed', "Fil d'activite")}
        </div>
        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
          {pulse.activityFeed.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px', color: '#64748B', fontSize: '13px' }}>
              {t('admin.noActivity', 'Aucune activite recente')}
            </div>
          ) : (
            <>
              {pulse.activityFeed.map((activity, idx) => {
                const isRecent = idx < 2
                const label = ACTIVITY_LABELS[activity.type] || activity.type.replace(/_/g, ' ')
                return (
                  <div
                    key={activity.id}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '14px',
                      padding: '14px 20px',
                      borderBottom: idx < pulse.activityFeed.length - 1 ? '1px solid #E2E8F0' : 'none',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#F1F5F9' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                  >
                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: 500,
                        color: '#64748B',
                        minWidth: '48px',
                        flexShrink: 0,
                        textAlign: 'right',
                        paddingTop: '1px',
                      }}
                    >
                      {formatRelativeDate(activity.createdAt)}
                    </span>
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: isRecent ? '#10B981' : '#1E3A5F',
                        opacity: isRecent ? 1 : 0.4,
                        flexShrink: 0,
                        marginTop: '5px',
                      }}
                    />
                    <div style={{ fontSize: '13px', color: '#0F172A', lineHeight: 1.5 }}>
                      <strong style={{ fontWeight: 600 }}>{activity.userName || 'System'}</strong>
                      {' '}{label}
                      {activity.clientName && (
                        <span style={{ color: '#64748B', fontSize: '12px', display: 'block', marginTop: '2px' }}>
                          {activity.clientName}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
              <div style={{ padding: '12px 20px', borderTop: '1px solid #E2E8F0', textAlign: 'center' }}>
                <button style={{ background: 'none', border: 'none', color: '#1E3A5F', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                  {t('admin.pulse.viewAll', 'Voir tout ->')}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Pulse dot animation */}
      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  )
}

/* ——— Sub-components ——— */

function KPICard({
  icon,
  label,
  value,
  valueSuffix,
  subtext,
  delta,
  deltaType = 'success',
}: {
  icon: ReactNode
  label: string
  value: number | string
  valueSuffix?: string
  subtext?: string
  delta?: string
  deltaType?: 'success' | 'warn' | 'neutral'
}) {
  const deltaColors = {
    success: { color: '#10B981', bg: '#D1FAE5' },
    warn: { color: '#F97316', bg: '#FFF7ED' },
    neutral: { color: '#64748B', bg: '#F1F5F9' },
  }
  const dc = deltaColors[deltaType]

  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #E2E8F0',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      <div
        style={{
          fontSize: '11px',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.8px',
          color: '#64748B',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          marginBottom: '8px',
        }}
      >
        {icon}
        {label}
      </div>
      <div style={{ fontSize: '32px', fontWeight: 700, color: '#0F172A', lineHeight: 1.1 }}>
        {value}
        {valueSuffix && (
          <span style={{ fontSize: '18px', fontWeight: 500, color: '#64748B' }}>{valueSuffix}</span>
        )}
      </div>
      {subtext && (
        <div style={{ fontSize: '14px', fontWeight: 500, color: '#64748B', marginTop: '2px' }}>{subtext}</div>
      )}
      {delta && (
        <div style={{ fontSize: '13px', color: '#64748B', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '2px',
              fontSize: '12px',
              fontWeight: 600,
              color: dc.color,
              background: dc.bg,
              padding: '2px 8px',
              borderRadius: '999px',
            }}
          >
            {delta}
          </span>
        </div>
      )}
    </div>
  )
}

function ActionsRequises({
  expiringTrials,
  pastDueUsers,
  overdueCount,
  t,
}: {
  expiringTrials: Array<{ id: number; fullName: string | null; email: string; subscriptionEndsAt?: string }>
  pastDueUsers: Array<{ id: number; fullName: string | null; email: string }>
  overdueCount: number
  t: (key: string, fallback?: string) => string
}) {
  const totalActions = expiringTrials.length + pastDueUsers.length + (overdueCount > 0 ? 1 : 0)
  if (totalActions === 0) return null

  return (
    <div>
      <div style={{ fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: '#EF4444', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <AlertCircle size={16} style={{ color: '#EF4444' }} />
        {t('admin.pulse.actionsRequired', 'Actions requises')}
        <span
          style={{
            background: '#EF4444',
            color: '#fff',
            fontSize: '11px',
            fontWeight: 700,
            width: '22px',
            height: '22px',
            borderRadius: '50%',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {totalActions}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {expiringTrials.map((u) => (
          <ActionCard
            key={`trial-${u.id}`}
            icon={<Clock size={20} style={{ color: '#F97316' }} />}
            title={`Trial expire — ${u.fullName || u.email}`}
            desc={u.email}
            primaryBtn={t('admin.pulse.viewProfile', 'Voir profil ->')}
            secondaryBtn={t('admin.pulse.sendReminder', 'Envoyer rappel')}
          />
        ))}
        {pastDueUsers.map((u) => (
          <ActionCard
            key={`due-${u.id}`}
            icon={<CreditCard size={20} style={{ color: '#EF4444' }} />}
            title={`Paiement echoue — ${u.fullName || u.email}`}
            desc={u.email}
            primaryBtn={t('admin.pulse.viewProfile', 'Voir profil ->')}
            secondaryBtn={t('admin.pulse.contact', 'Contacter')}
          />
        ))}
        {overdueCount > 0 && (
          <ActionCard
            icon={<ClipboardList size={20} style={{ color: '#EF4444' }} />}
            title={`${overdueCount} condition${overdueCount > 1 ? 's' : ''} en retard`}
            desc={t('admin.pulse.overdueDesc', 'Conditions depassant leur date limite')}
            primaryBtn={t('admin.pulse.viewDetails', 'Voir details ->')}
          />
        )}
      </div>
    </div>
  )
}

function ActionCard({
  icon,
  title,
  desc,
  primaryBtn,
  secondaryBtn,
}: {
  icon: ReactNode
  title: string
  desc: string
  primaryBtn: string
  secondaryBtn?: string
}) {
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #E2E8F0',
        borderLeft: '4px solid #EF4444',
        borderRadius: '12px',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '14px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      <span style={{ flexShrink: 0, marginTop: '2px', display: 'flex', alignItems: 'center' }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '14px', fontWeight: 600, color: '#0F172A', marginBottom: '4px' }}>{title}</div>
        <div style={{ fontSize: '13px', color: '#64748B', lineHeight: 1.5 }}>{desc}</div>
      </div>
      <div style={{ display: 'flex', gap: '8px', flexShrink: 0, alignSelf: 'center' }}>
        <button
          style={{
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: '13px',
            fontWeight: 600,
            padding: '8px 16px',
            borderRadius: '8px',
            cursor: 'pointer',
            background: '#1E3A5F',
            color: '#F8FAFC',
            border: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          {primaryBtn}
        </button>
        {secondaryBtn && (
          <button
            style={{
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: '13px',
              fontWeight: 600,
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              background: 'transparent',
              color: '#1E3A5F',
              border: '1px solid #E2E8F0',
              whiteSpace: 'nowrap',
            }}
          >
            {secondaryBtn}
          </button>
        )}
      </div>
    </div>
  )
}

function StatRow({
  label,
  value,
  pct,
  pctType,
}: {
  label: string
  value: string
  pct?: string
  pctType?: 'success' | 'warn' | 'neutral'
}) {
  const pctColors = {
    success: { color: '#10B981', bg: '#D1FAE5' },
    warn: { color: '#F97316', bg: '#FFF7ED' },
    neutral: { color: '#64748B', bg: '#F1F5F9' },
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: '14px',
        borderBottom: '1px solid #E2E8F0',
      }}
    >
      <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
        {value}
        {pct && pctType && (
          <span
            style={{
              fontSize: '12px',
              fontWeight: 600,
              color: pctColors[pctType].color,
              background: pctColors[pctType].bg,
              padding: '2px 8px',
              borderRadius: '999px',
            }}
          >
            {pct}
          </span>
        )}
      </span>
    </div>
  )
}
