import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Globe,
  CreditCard,
  Ticket,
  Monitor,
  ChevronDown,
  RefreshCw,
  Dice5,
  AlertTriangle,
  Settings,
  Construction,
  Wrench,
  Zap,
  Database,
  Mail,
  Timer,
  HardDrive,
  X,
  History,
  ArrowRight,
  CircleDot,
  Check,
  CircleOff,
  Pencil,
} from 'lucide-react'
import {
  adminApi,
  type SiteSettings,
  type AdminPlan,
  type PromoCode,
  type PlanChangeLog,
} from '../../api/admin.api'
import { authApi } from '../../api/auth.api'
import { toast } from '../../hooks/use-toast'

/* ═══════════════ COLLAPSIBLE SECTION ═══════════════ */
function Section({
  id,
  icon: Icon,
  title,
  tag,
  defaultOpen = false,
  children,
}: {
  id: string
  icon: React.ElementType
  title: string
  tag?: string
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #E2E8F0',
        borderRadius: '12px',
        marginBottom: '20px',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      <div
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 24px',
          cursor: 'pointer',
          userSelect: 'none',
          transition: 'background 150ms',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = '#F1F5F9' }}
        onMouseLeave={(e) => { e.currentTarget.style.background = '' }}
      >
        <h2
          style={{
            fontSize: '15px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: '#1E3A5F',
            margin: 0,
          }}
        >
          <Icon size={18} style={{ flexShrink: 0 }} />
          {title}
          {tag && (
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                background: '#F1F5F9',
                color: '#64748B',
                padding: '2px 8px',
                borderRadius: '4px',
                marginLeft: '8px',
              }}
            >
              {tag}
            </span>
          )}
        </h2>
        <ChevronDown
          size={18}
          style={{
            transition: 'transform 200ms',
            color: '#64748B',
            transform: open ? 'rotate(0deg)' : 'rotate(-90deg)',
          }}
        />
      </div>
      {open && (
        <div style={{ padding: '0 24px 24px', borderTop: '1px solid #E2E8F0' }}>
          {children}
        </div>
      )}
    </div>
  )
}

/* ═══════════════ SITE MODE SECTION ═══════════════ */
function SiteModeSection() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const { data } = useQuery({
    queryKey: ['admin', 'site-settings'],
    queryFn: () => adminApi.getSiteSettings(),
  })

  const settings = data?.data
  const [form, setForm] = useState<Partial<SiteSettings>>({})

  useEffect(() => {
    if (settings && Object.keys(form).length === 0) {
      setForm({})
    }
  }, [settings])

  const merged = { ...settings, ...form } as SiteSettings

  const updateMut = useMutation({
    mutationFn: (data: Partial<SiteSettings>) => adminApi.updateSiteSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'site-settings'] })
      setForm({})
      toast({ title: t('common.success', 'Succès'), variant: 'success' })
    },
    onError: () => {
      toast({ title: t('common.error', 'Erreur'), variant: 'destructive' })
    },
  })

  if (!settings) return <div style={{ height: '120px' }} />

  const modes = [
    { key: 'live', label: 'Live', sublabel: 'Site accessible normalement', Icon: Zap, activeClass: 'active-live' },
    { key: 'coming_soon', label: 'Construction', sublabel: 'Page Coming Soon activée', Icon: Construction, activeClass: 'active-construction' },
    { key: 'maintenance', label: 'Maintenance', sublabel: 'Page Maintenance activée', Icon: Wrench, activeClass: 'active-maintenance' },
  ] as const

  const modeStyles: Record<string, React.CSSProperties> = {
    'active-live': { borderColor: '#10B981', background: '#D1FAE5', color: '#065F46' },
    'active-construction': { borderColor: '#F97316', background: '#FFF7ED', color: '#9A3412' },
    'active-maintenance': { borderColor: '#EF4444', background: '#FEE2E2', color: '#991B1B' },
  }

  const dotColors: Record<string, string> = {
    live: '#10B981',
    coming_soon: '#F97316',
    maintenance: '#EF4444',
  }

  const baseBtnStyle: React.CSSProperties = {
    padding: '10px 20px',
    borderRadius: '8px',
    border: '2px solid #E2E8F0',
    background: '#fff',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 150ms',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  }

  const isDirty = Object.keys(form).length > 0

  return (
    <div>
      {/* Mode toggle group */}
      <div style={{ display: 'flex', gap: '8px', margin: '20px 0 16px' }}>
        {modes.map((m) => {
          const isActive = merged.site_mode === m.key
          return (
            <button
              key={m.key}
              onClick={() => setForm({ ...form, site_mode: m.key })}
              style={{
                ...baseBtnStyle,
                ...(isActive ? modeStyles[m.activeClass] : {}),
              }}
              onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.borderColor = '#1E3A5F' }}
              onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.borderColor = '#E2E8F0' }}
            >
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: dotColors[m.key], flexShrink: 0 }} />
              <m.Icon size={16} />
              {m.label}
            </button>
          )
        })}
      </div>

      {/* Explanation of current mode */}
      {merged.site_mode === 'coming_soon' && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '10px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 500,
          margin: '0 0 16px', background: '#FFF7ED', color: '#9A3412', border: '1px solid #FED7AA',
        }}>
          <Construction size={16} />
          La page <strong>/coming-soon</strong> est affichée aux visiteurs. Les admins et fondateurs passent librement.
        </div>
      )}
      {merged.site_mode === 'maintenance' && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '10px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 500,
          margin: '0 0 16px', background: '#FEE2E2', color: '#991B1B', border: '1px solid #FECACA',
        }}>
          <Wrench size={16} />
          La page <strong>/maintenance</strong> est affichée aux visiteurs. Les admins passent librement.
        </div>
      )}

      {/* Access code */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#0F172A', marginBottom: '6px' }}>
          Code d'accès fondateurs :
        </label>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            type="text"
            value={merged.access_code || ''}
            onChange={(e) => setForm({ ...form, access_code: e.target.value })}
            style={{
              fontFamily: "'SF Mono', 'Fira Code', 'Consolas', monospace",
              fontWeight: 600,
              letterSpacing: '0.5px',
              maxWidth: '320px',
              fontSize: '14px',
              padding: '9px 12px',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              background: '#fff',
              color: '#0F172A',
              outline: 'none',
              width: '100%',
            }}
          />
          <button
            onClick={() => {
              const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
              let code = 'OFRA-'
              for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)]
              setForm({ ...form, access_code: code })
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '8px',
              background: '#F1F5F9',
              color: '#0F172A',
              border: '1px solid #E2E8F0',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            <RefreshCw size={14} /> Régénérer
          </button>
        </div>
        <p style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>
          Utilisé pour accéder au site en mode construction
        </p>
      </div>

      {/* Custom message */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#0F172A', marginBottom: '6px' }}>
          Message personnalisé :
        </label>
        <textarea
          rows={3}
          value={merged.custom_message || ''}
          onChange={(e) => setForm({ ...form, custom_message: e.target.value })}
          style={{
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: '14px',
            padding: '9px 12px',
            border: '1px solid #E2E8F0',
            borderRadius: '8px',
            background: '#fff',
            color: '#0F172A',
            width: '100%',
            outline: 'none',
            resize: 'vertical',
            minHeight: '60px',
          }}
        />
      </div>

      {/* Warning */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 14px',
          borderRadius: '8px',
          fontSize: '13px',
          fontWeight: 500,
          margin: '16px 0',
          background: '#FFF7ED',
          color: '#9A3412',
          border: '1px solid #FED7AA',
        }}
      >
        <AlertTriangle size={16} style={{ flexShrink: 0 }} />
        Changer le mode affecte tous les visiteurs immédiatement.
      </div>

      {/* Save button */}
      <button
        onClick={() => isDirty && updateMut.mutate(form)}
        disabled={!isDirty || updateMut.isPending}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '9px 18px',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: 600,
          cursor: isDirty ? 'pointer' : 'not-allowed',
          border: 'none',
          transition: 'all 150ms',
          background: isDirty ? '#1E3A5F' : '#E2E8F0',
          color: isDirty ? '#F8FAFC' : '#64748B',
        }}
      >
        {updateMut.isPending ? 'Enregistrement...' : 'Appliquer le changement'}
      </button>
    </div>
  )
}

/* ═══════════════ PLANS SECTION ═══════════════ */
function PlansSection() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'plans'],
    queryFn: () => adminApi.getPlans(),
  })

  const { data: changesData } = useQuery({
    queryKey: ['admin', 'plan-changes'],
    queryFn: () => adminApi.getPlanChanges({ limit: 5 }),
  })

  const plans = data?.data?.plans || []
  const changeLogs = data?.data?.changeLogs || changesData?.data?.changes || []

  const [editState, setEditState] = useState<Record<number, {
    monthlyPrice: string
    annualPrice: string
    maxTransactions: string
    maxStorageGb: string
    historyMonths: string
    maxUsers: string
    reason: string
  }>>({})

  const [applyModalPlan, setApplyModalPlan] = useState<AdminPlan | null>(null)
  const [applyConfirm, setApplyConfirm] = useState('')
  const [applyReason, setApplyReason] = useState('')

  const updatePlanMut = useMutation({
    mutationFn: ({ planId, data }: { planId: number; data: any }) => adminApi.updatePlan(planId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'plans'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'plan-changes'] })
      toast({ title: t('common.success', 'Succès'), variant: 'success' })
    },
    onError: () => {
      toast({ title: t('common.error', 'Erreur'), variant: 'destructive' })
    },
  })

  const applyMut = useMutation({
    mutationFn: ({ planId, reason }: { planId: number; reason: string }) =>
      adminApi.applyToExisting(planId, reason),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'plans'] })
      toast({
        title: t('common.success', 'Succès'),
        description: `${res.data?.affectedCount || 0} utilisateur(s) mis à jour`,
        variant: 'success',
      })
      setApplyModalPlan(null)
      setApplyConfirm('')
      setApplyReason('')
    },
    onError: () => {
      toast({ title: t('common.error', 'Erreur'), variant: 'destructive' })
    },
  })

  const getEdit = (plan: AdminPlan) => {
    if (!editState[plan.id]) {
      return {
        monthlyPrice: String(plan.monthlyPrice),
        annualPrice: String(plan.annualPrice),
        maxTransactions: plan.maxTransactions === null ? '∞' : String(plan.maxTransactions),
        maxStorageGb: String(plan.maxStorageGb),
        historyMonths: plan.historyMonths === null ? '∞' : String(plan.historyMonths),
        maxUsers: String(plan.maxUsers),
        reason: '',
      }
    }
    return editState[plan.id]
  }

  const setEdit = (planId: number, field: string, value: string) => {
    const plan = plans.find(p => p.id === planId)
    if (!plan) return
    setEditState(prev => ({
      ...prev,
      [planId]: { ...getEdit(plan), [field]: value },
    }))
  }

  const savePlan = (plan: AdminPlan) => {
    const e = getEdit(plan)
    if (!e.reason.trim()) return
    updatePlanMut.mutate({
      planId: plan.id,
      data: {
        monthlyPrice: parseFloat(e.monthlyPrice) || plan.monthlyPrice,
        annualPrice: parseFloat(e.annualPrice) || plan.annualPrice,
        maxTransactions: e.maxTransactions === '∞' ? null : parseInt(e.maxTransactions) || plan.maxTransactions,
        maxStorageGb: parseFloat(e.maxStorageGb) || plan.maxStorageGb,
        historyMonths: e.historyMonths === '∞' ? null : parseInt(e.historyMonths) || plan.historyMonths,
        maxUsers: parseInt(e.maxUsers) || plan.maxUsers,
        reason: e.reason,
      },
    })
    setEditState(prev => {
      const next = { ...prev }
      delete next[plan.id]
      return next
    })
  }

  if (isLoading) return <div style={{ height: '120px' }} />

  const inputStyle: React.CSSProperties = {
    width: '80px',
    padding: '6px 8px',
    fontSize: '13px',
    textAlign: 'right',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    outline: 'none',
    background: '#fff',
    color: '#0F172A',
  }

  return (
    <div>
      {/* 4-column plan cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', margin: '20px 0 16px' }}>
        {plans.map((plan) => {
          const e = getEdit(plan)
          const isInactive = !plan.isActive
          return (
            <div
              key={plan.id}
              style={{
                border: isInactive ? '2px dashed #E2E8F0' : '2px solid #E2E8F0',
                borderRadius: '12px',
                padding: '16px',
                background: '#fff',
                opacity: isInactive ? 0.7 : 1,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0, color: isInactive ? '#64748B' : '#0F172A' }}>
                  {plan.name}
                </h3>
                <span style={{
                  fontSize: '12px', fontWeight: 600, padding: '3px 10px', borderRadius: '20px',
                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                  ...(plan.isActive ? { background: '#D1FAE5', color: '#065F46' } : { background: '#F1F5F9', color: '#64748B' }),
                }}>
                  {plan.isActive ? <><Check size={12} /> Actif</> : <><CircleOff size={12} /> Inactif</>}
                </span>
              </div>

              <div style={{ fontSize: '13px', color: '#64748B', marginBottom: '14px', lineHeight: 1.6 }}>
                Abonnés : <strong style={{ color: '#0F172A' }}>{plan.subscriberCount}</strong>
                <br />
                <span style={{ fontSize: '12px' }}>
                  {plan.founderCount > 0 ? `(${plan.founderCount} fondateur${plan.founderCount > 1 ? 's' : ''})` : '—'}
                </span>
              </div>

              {[
                { label: 'Mensuel', field: 'monthlyPrice', unit: '$' },
                { label: 'Annuel', field: 'annualPrice', unit: '$' },
                { label: 'TX max', field: 'maxTransactions', unit: '' },
                { label: 'Stockage', field: 'maxStorageGb', unit: 'Go' },
                { label: 'Historique', field: 'historyMonths', unit: 'mo' },
                { label: 'Users max', field: 'maxUsers', unit: '' },
              ].map(({ label, field, unit }) => {
                const val = (e as any)[field] as string
                const isInfinity = val === '∞'
                return (
                  <div key={field} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', gap: '8px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', whiteSpace: 'nowrap', minWidth: '60px' }}>{label}</label>
                    <input
                      type={isInfinity ? 'text' : 'number'}
                      value={val}
                      disabled={isInfinity}
                      onChange={(ev) => setEdit(plan.id, field, ev.target.value)}
                      style={{ ...inputStyle, ...(isInfinity ? { textAlign: 'center' as const } : {}) }}
                    />
                    <span style={{ fontSize: '12px', color: '#64748B', minWidth: '20px' }}>{unit}</span>
                  </div>
                )
              })}

              <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #E2E8F0' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', display: 'block', marginBottom: '4px' }}>Raison : *</label>
                <input
                  type="text"
                  value={e.reason}
                  onChange={(ev) => setEdit(plan.id, 'reason', ev.target.value)}
                  placeholder="Raison du changement..."
                  style={{ ...inputStyle, width: '100%', textAlign: 'left' as const }}
                />
              </div>

              <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => savePlan(plan)}
                  disabled={!e.reason.trim() || updatePlanMut.isPending}
                  style={{
                    padding: '6px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, border: 'none',
                    cursor: e.reason.trim() ? 'pointer' : 'not-allowed',
                    background: e.reason.trim() ? '#1E3A5F' : '#E2E8F0',
                    color: e.reason.trim() ? '#F8FAFC' : '#64748B',
                  }}
                >
                  Sauvegarder
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Warning + apply link */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '10px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 500,
        margin: '16px 0', background: '#FFF7ED', color: '#9A3412', border: '1px solid #FED7AA',
      }}>
        <AlertTriangle size={16} style={{ flexShrink: 0 }} />
        Changements = nouveaux abonnés seulement.
        <button
          onClick={() => plans.length > 0 && setApplyModalPlan(plans[0])}
          style={{
            background: 'none', border: 'none', color: '#1E3A5F',
            fontSize: '13px', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline', padding: 0, marginLeft: '8px',
          }}
        >
          Appliquer aux existants...
        </button>
      </div>

      {/* History */}
      <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #E2E8F0' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <History size={16} /> Historique
          </span>
          <button style={{ background: 'transparent', color: '#1E3A5F', padding: '6px 12px', border: 'none', fontSize: '13px', fontWeight: 600, cursor: 'pointer', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            Voir tout <ArrowRight size={14} />
          </button>
        </h3>
        {changeLogs.length === 0 ? (
          <p style={{ fontSize: '13px', color: '#64748B' }}>Aucun changement enregistré.</p>
        ) : (
          changeLogs.slice(0, 5).map((log: PlanChangeLog) => {
            const date = new Date(log.createdAt)
            const dateStr = date.toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' })
            return (
              <div key={log.id} style={{
                display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0',
                fontSize: '13px', color: '#64748B', borderBottom: '1px solid #F1F5F9',
              }}>
                <span style={{ fontWeight: 600, color: '#0F172A', minWidth: '50px' }}>{dateStr}</span>
                <span style={{ fontWeight: 600, color: '#1E3A5F' }}>{log.adminName}</span>
                <span>{log.planName} {log.fieldChanged} : {log.oldValue} → {log.newValue}</span>
                <span style={{ fontStyle: 'italic', color: '#64748B' }}>« {log.reason} »</span>
              </div>
            )
          })
        )}
      </div>

      {/* ═══ MODAL: Appliquer aux existants ═══ */}
      {applyModalPlan && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) { setApplyModalPlan(null); setApplyConfirm(''); setApplyReason('') } }}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)',
            backdropFilter: 'blur(4px)', zIndex: 100,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
          }}
        >
          <div style={{
            background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '520px',
            boxShadow: '0 24px 48px rgba(0,0,0,0.15)', maxHeight: '90vh',
            display: 'flex', flexDirection: 'column',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid #FEE2E2' }}>
              <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#EF4444', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={20} /> Action irréversible
              </h2>
              <button
                onClick={() => { setApplyModalPlan(null); setApplyConfirm(''); setApplyReason('') }}
                style={{ width: '32px', height: '32px', border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748B', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
              <p style={{ fontSize: '14px', lineHeight: 1.6, color: '#0F172A' }}>
                Vous allez mettre à jour le prix de tous les abonnés actuels du plan <strong>{applyModalPlan.name}</strong>.
              </p>

              <div style={{ margin: '16px 0' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#0F172A', marginBottom: '6px' }}>Sélectionner le plan :</label>
                <select
                  value={applyModalPlan.id}
                  onChange={(e) => { const p = plans.find(pl => pl.id === Number(e.target.value)); if (p) setApplyModalPlan(p) }}
                  style={{ fontSize: '14px', padding: '9px 12px', border: '1px solid #E2E8F0', borderRadius: '8px', background: '#fff', color: '#0F172A', width: '100%', outline: 'none' }}
                >
                  {plans.map(p => (
                    <option key={p.id} value={p.id}>{p.name} — {p.subscriberCount} abonnés ({p.founderCount} fondateurs)</option>
                  ))}
                </select>
              </div>

              <div style={{ background: '#F1F5F9', borderRadius: '8px', padding: '16px', margin: '16px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '14px' }}>
                  <span style={{ color: '#64748B' }}>Abonnés affectés</span>
                  <span style={{ fontWeight: 700 }}>
                    {applyModalPlan.subscriberCount}
                    <span style={{ fontWeight: 400, color: '#64748B' }}> (dont {applyModalPlan.founderCount} fondateurs)</span>
                  </span>
                </div>
              </div>

              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: '8px',
                padding: '10px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 500,
                margin: '16px 0', background: '#FFF7ED', color: '#9A3412', border: '1px solid #FED7AA',
              }}>
                <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>
                  Les fondateurs conservent leur prix locké.<br />
                  → <strong>{Math.max(0, applyModalPlan.subscriberCount - applyModalPlan.founderCount)} abonné(s) non-fondateur(s)</strong> sera(ont) affecté(s).
                </span>
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#0F172A', marginBottom: '6px' }}>
                  Tapez <span style={{ fontFamily: 'monospace', background: '#F1F5F9', padding: '2px 6px', borderRadius: '4px' }}>APPLIQUER</span> pour confirmer :
                </label>
                <input
                  type="text"
                  value={applyConfirm}
                  onChange={(e) => setApplyConfirm(e.target.value)}
                  placeholder="APPLIQUER"
                  autoComplete="off"
                  style={{
                    fontFamily: "'SF Mono', 'Fira Code', 'Consolas', monospace",
                    fontWeight: 700, letterSpacing: '1px', textAlign: 'center', fontSize: '16px',
                    padding: '9px 12px', border: '1px solid #E2E8F0', borderRadius: '8px',
                    background: '#fff', color: '#0F172A', width: '100%', outline: 'none',
                  }}
                />
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#0F172A', marginBottom: '6px' }}>Raison : *</label>
                <input
                  type="text"
                  value={applyReason}
                  onChange={(e) => setApplyReason(e.target.value)}
                  placeholder="Raison du changement..."
                  style={{ fontSize: '14px', padding: '9px 12px', border: '1px solid #E2E8F0', borderRadius: '8px', background: '#fff', color: '#0F172A', width: '100%', outline: 'none' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', padding: '16px 24px', borderTop: '1px solid #FEE2E2' }}>
              <button
                onClick={() => { setApplyModalPlan(null); setApplyConfirm(''); setApplyReason('') }}
                style={{ padding: '9px 18px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', background: '#F1F5F9', color: '#0F172A', border: '1px solid #E2E8F0' }}
              >
                Annuler
              </button>
              <button
                onClick={() => applyMut.mutate({ planId: applyModalPlan.id, reason: applyReason })}
                disabled={applyConfirm !== 'APPLIQUER' || applyReason.trim().length < 1 || applyMut.isPending}
                style={{
                  padding: '9px 18px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, border: 'none',
                  cursor: (applyConfirm === 'APPLIQUER' && applyReason.trim()) ? 'pointer' : 'not-allowed',
                  background: (applyConfirm === 'APPLIQUER' && applyReason.trim()) ? '#EF4444' : '#E2E8F0',
                  color: (applyConfirm === 'APPLIQUER' && applyReason.trim()) ? '#fff' : '#64748B',
                }}
              >
                {applyMut.isPending ? 'Application...' : 'Appliquer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ═══════════════ PROMO CODES SECTION ═══════════════ */
function PromoCodesSection() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newPromo, setNewPromo] = useState({
    code: '',
    type: 'percent' as 'percent' | 'fixed' | 'free_months',
    value: '',
    maxUses: '',
    validFrom: '',
    validUntil: '',
    eligiblePlans: [1, 2, 3] as number[],
  })

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'promo-codes'],
    queryFn: () => adminApi.getPromoCodes(),
  })

  const { data: plansData } = useQuery({
    queryKey: ['admin', 'plans'],
    queryFn: () => adminApi.getPlans(),
  })

  const plans = plansData?.data?.plans || []

  const createMut = useMutation({
    mutationFn: () =>
      adminApi.createPromoCode({
        code: newPromo.code.toUpperCase(),
        type: newPromo.type,
        value: parseFloat(newPromo.value) || 0,
        maxUses: newPromo.maxUses ? parseInt(newPromo.maxUses) : null,
        validFrom: newPromo.validFrom || null,
        validUntil: newPromo.validUntil || null,
        eligiblePlans: newPromo.eligiblePlans.length > 0 ? newPromo.eligiblePlans : null,
        active: true,
        stripeCouponId: null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'promo-codes'] })
      setShowCreateModal(false)
      setNewPromo({ code: '', type: 'percent', value: '', maxUses: '', validFrom: '', validUntil: '', eligiblePlans: [1, 2, 3] })
      toast({ title: t('common.success', 'Succès'), variant: 'success' })
    },
    onError: () => {
      toast({ title: t('common.error', 'Erreur'), variant: 'destructive' })
    },
  })

  const deleteMut = useMutation({
    mutationFn: (id: number) => adminApi.deletePromoCode(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'promo-codes'] })
      toast({ title: t('common.success', 'Succès'), variant: 'success' })
    },
  })

  const promos = (data?.data || []) as PromoCode[]
  const activeCount = promos.filter(p => p.active).length

  const typeLabel = (type: string) => {
    if (type === 'percent') return '%'
    if (type === 'fixed') return 'Fixe'
    return 'Mois'
  }

  const valueLabel = (promo: PromoCode) => {
    if (promo.type === 'percent') return `${promo.value}%`
    if (promo.type === 'fixed') return `${promo.value}$`
    return `${promo.value} mois`
  }

  const autoGenCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = ''
    for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)]
    setNewPromo({ ...newPromo, code })
  }

  const togglePlanEligible = (planId: number) => {
    setNewPromo(prev => ({
      ...prev,
      eligiblePlans: prev.eligiblePlans.includes(planId)
        ? prev.eligiblePlans.filter(id => id !== planId)
        : [...prev.eligiblePlans, planId],
    }))
  }

  const thStyle: React.CSSProperties = {
    textAlign: 'left', padding: '10px 12px', fontSize: '11px', fontWeight: 700,
    textTransform: 'uppercase', letterSpacing: '0.5px', color: '#64748B',
    borderBottom: '2px solid #E2E8F0', background: '#F1F5F9',
  }

  const tdStyle: React.CSSProperties = {
    padding: '10px 12px', borderBottom: '1px solid #E2E8F0', verticalAlign: 'middle', fontSize: '13px',
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '20px 0 12px' }}>
        <span style={{ fontSize: '13px', color: '#64748B' }}>{activeCount} codes actifs</span>
        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '6px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
            cursor: 'pointer', border: 'none', background: '#1E3A5F', color: '#F8FAFC',
          }}
        >
          + Nouveau code
        </button>
      </div>

      {isLoading ? (
        <div style={{ height: '100px' }} />
      ) : promos.length === 0 ? (
        <p style={{ fontSize: '13px', color: '#64748B', textAlign: 'center', padding: '24px 0' }}>Aucun code promo</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr>
              <th style={thStyle}>Code</th>
              <th style={thStyle}>Type</th>
              <th style={thStyle}>Valeur</th>
              <th style={thStyle}>Utilisations</th>
              <th style={thStyle}>Expire</th>
              <th style={thStyle}>Statut</th>
              <th style={{ ...thStyle, textAlign: 'right' }}></th>
            </tr>
          </thead>
          <tbody>
            {promos.map((promo) => {
              const isExpired = !promo.active || (promo.validUntil && new Date(promo.validUntil) < new Date()) || (promo.maxUses !== null && promo.currentUses >= promo.maxUses)
              return (
                <tr
                  key={promo.id}
                  style={{ opacity: isExpired ? 0.6 : 1 }}
                  onMouseEnter={(e) => { e.currentTarget.querySelectorAll('td').forEach(td => (td as HTMLElement).style.background = '#F1F5F9') }}
                  onMouseLeave={(e) => { e.currentTarget.querySelectorAll('td').forEach(td => (td as HTMLElement).style.background = '') }}
                >
                  <td style={{ ...tdStyle, fontFamily: "'SF Mono', 'Fira Code', 'Consolas', monospace", fontWeight: 700, color: isExpired ? '#64748B' : '#1E3A5F' }}>
                    {promo.code}
                  </td>
                  <td style={tdStyle}>{typeLabel(promo.type)}</td>
                  <td style={tdStyle}>{valueLabel(promo)}</td>
                  <td style={tdStyle}>{promo.currentUses} / {promo.maxUses ?? '∞'}</td>
                  <td style={{ ...tdStyle, ...(isExpired ? { color: '#EF4444' } : {}) }}>
                    {promo.validUntil
                      ? new Date(promo.validUntil).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' })
                      : '—'}
                  </td>
                  <td style={tdStyle}>
                    {isExpired ? (
                      <span style={{ color: '#EF4444', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CircleDot size={12} /> Expiré
                      </span>
                    ) : (
                      <span style={{ color: '#10B981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Check size={12} /> Actif
                      </span>
                    )}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>
                    <button
                      onClick={() => { if (promo.active) deleteMut.mutate(promo.id) }}
                      style={{ background: 'transparent', color: '#1E3A5F', padding: '6px 8px', border: 'none', cursor: 'pointer', borderRadius: '8px' }}
                      title="Modifier"
                    >
                      <Pencil size={14} />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '10px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 500,
        marginTop: '16px', background: '#FFF7ED', color: '#9A3412', border: '1px solid #FED7AA',
      }}>
        <AlertTriangle size={16} style={{ flexShrink: 0 }} />
        Non cumulable avec le statut Fondateur.
      </div>

      {/* ═══ MODAL: Nouveau code promo ═══ */}
      {showCreateModal && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setShowCreateModal(false) }}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)',
            backdropFilter: 'blur(4px)', zIndex: 100,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
          }}
        >
          <div style={{
            background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '560px',
            boxShadow: '0 24px 48px rgba(0,0,0,0.15)', maxHeight: '90vh',
            display: 'flex', flexDirection: 'column',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid #E2E8F0' }}>
              <h2 style={{ fontSize: '17px', fontWeight: 700, margin: 0 }}>+ Nouveau code promo</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{ width: '32px', height: '32px', border: 'none', background: 'none', cursor: 'pointer', color: '#64748B', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
              {/* Code */}
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#0F172A', marginBottom: '6px' }}>Code :</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="text"
                    value={newPromo.code}
                    onChange={(e) => setNewPromo({ ...newPromo, code: e.target.value.toUpperCase() })}
                    placeholder="NBREA2026"
                    style={{
                      flex: 1, fontFamily: "'SF Mono', 'Fira Code', 'Consolas', monospace",
                      fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px',
                      fontSize: '14px', padding: '9px 12px', border: '1px solid #E2E8F0', borderRadius: '8px',
                      background: '#fff', color: '#0F172A', outline: 'none',
                    }}
                  />
                  <button
                    onClick={autoGenCode}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '6px',
                      padding: '6px 12px', borderRadius: '8px', background: '#F1F5F9',
                      color: '#0F172A', border: '1px solid #E2E8F0', fontSize: '13px', fontWeight: 600,
                      cursor: 'pointer', whiteSpace: 'nowrap',
                    }}
                  >
                    <Dice5 size={14} /> Auto-générer
                  </button>
                </div>
              </div>

              {/* Type — radio pills */}
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#0F172A', marginBottom: '6px' }}>Type :</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {([
                    { value: 'percent', label: 'Pourcentage' },
                    { value: 'fixed', label: 'Montant fixe' },
                    { value: 'free_months', label: 'Mois gratuit' },
                  ] as const).map((opt) => (
                    <label
                      key={opt.value}
                      onClick={() => setNewPromo({ ...newPromo, type: opt.value })}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '8px 14px', border: '2px solid',
                        borderColor: newPromo.type === opt.value ? '#1E3A5F' : '#E2E8F0',
                        borderRadius: '8px', fontSize: '13px', fontWeight: 500,
                        cursor: 'pointer', transition: 'all 150ms',
                        background: newPromo.type === opt.value ? 'rgba(30,58,95,0.06)' : '#fff',
                      }}
                    >
                      {newPromo.type === opt.value && <CircleDot size={14} style={{ color: '#1E3A5F' }} />}
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>

              {/* Value */}
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#0F172A', marginBottom: '6px' }}>Valeur :</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="number"
                    value={newPromo.value}
                    onChange={(e) => setNewPromo({ ...newPromo, value: e.target.value })}
                    style={{ maxWidth: '120px', fontSize: '14px', padding: '9px 12px', border: '1px solid #E2E8F0', borderRadius: '8px', background: '#fff', color: '#0F172A', outline: 'none' }}
                  />
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#64748B' }}>
                    {newPromo.type === 'percent' ? '%' : newPromo.type === 'fixed' ? '$' : 'mois'}
                  </span>
                </div>
              </div>

              {/* Max uses */}
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#0F172A', marginBottom: '6px' }}>Utilisations max :</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="number"
                    value={newPromo.maxUses}
                    onChange={(e) => setNewPromo({ ...newPromo, maxUses: e.target.value })}
                    style={{ maxWidth: '120px', fontSize: '14px', padding: '9px 12px', border: '1px solid #E2E8F0', borderRadius: '8px', background: '#fff', color: '#0F172A', outline: 'none' }}
                  />
                  <span style={{ fontSize: '12px', color: '#64748B' }}>(vide = illimité)</span>
                </div>
              </div>

              {/* Eligible plans */}
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#0F172A', marginBottom: '6px' }}>Plans éligibles :</label>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  {plans.map((plan) => (
                    <label key={plan.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={newPromo.eligiblePlans.includes(plan.id)}
                        onChange={() => togglePlanEligible(plan.id)}
                        style={{ width: '16px', height: '16px', accentColor: '#1E3A5F' }}
                      />
                      {plan.name}
                    </label>
                  ))}
                </div>
              </div>

              {/* Dates */}
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#0F172A', marginBottom: '6px' }}>Période de validité :</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#64748B' }}>du</label>
                  <input type="date" value={newPromo.validFrom} onChange={(e) => setNewPromo({ ...newPromo, validFrom: e.target.value })}
                    style={{ width: '160px', fontSize: '14px', padding: '9px 12px', border: '1px solid #E2E8F0', borderRadius: '8px', background: '#fff', color: '#0F172A', outline: 'none' }} />
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#64748B' }}>au</label>
                  <input type="date" value={newPromo.validUntil} onChange={(e) => setNewPromo({ ...newPromo, validUntil: e.target.value })}
                    style={{ width: '160px', fontSize: '14px', padding: '9px 12px', border: '1px solid #E2E8F0', borderRadius: '8px', background: '#fff', color: '#0F172A', outline: 'none' }} />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', padding: '16px 24px', borderTop: '1px solid #E2E8F0' }}>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{ padding: '9px 18px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', background: '#F1F5F9', color: '#0F172A', border: '1px solid #E2E8F0' }}
              >
                Annuler
              </button>
              <button
                onClick={() => createMut.mutate()}
                disabled={!newPromo.code.trim() || !newPromo.value || createMut.isPending}
                style={{
                  padding: '9px 18px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, border: 'none',
                  cursor: (newPromo.code.trim() && newPromo.value) ? 'pointer' : 'not-allowed',
                  background: (newPromo.code.trim() && newPromo.value) ? '#1E3A5F' : '#E2E8F0',
                  color: (newPromo.code.trim() && newPromo.value) ? '#F8FAFC' : '#64748B',
                }}
              >
                {createMut.isPending ? 'Création...' : 'Créer le code'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ═══════════════ SYSTEM SECTION ═══════════════ */
function SystemSection() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'system'],
    queryFn: () => adminApi.getSystemHealth(),
    refetchInterval: 30_000,
  })

  const system = data?.data

  if (isLoading) return <div style={{ height: '100px' }} />

  const dbStatus = system?.checks?.database || 'unknown'
  const isHealthy = dbStatus === 'healthy'
  const uptimeStr = system?.runtime?.uptimeSeconds
    ? (() => {
        const s = system.runtime.uptimeSeconds
        const d = Math.floor(s / 86400)
        const h = Math.floor((s % 86400) / 3600)
        return d > 0 ? `${d}j` : `${h}h`
      })()
    : '—'

  const memUsed = system?.runtime?.memoryUsedMB || 0
  const memTotal = system?.runtime?.memoryTotalMB || 1
  const memPct = Math.round((memUsed / memTotal) * 100)

  const healthPill = (label: string, icon: React.ReactNode, value: string, ok: boolean) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: '#F1F5F9', borderRadius: '8px', fontSize: '13px', fontWeight: 500 }}>
      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: ok ? '#10B981' : '#EF4444', flexShrink: 0 }} />
      {icon}
      {label}
      <span style={{ fontWeight: 700, color: '#0F172A', marginLeft: '4px' }}>{value}</span>
    </div>
  )

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '16px' }}>
        {healthPill('DB', <Database size={14} />, isHealthy ? 'OK' : 'Erreur', isHealthy)}
        {healthPill('Redis', null, 'OK', true)}
        {healthPill('Emails', <Mail size={14} />, 'OK', true)}

        <div style={{ width: '1px', height: '24px', background: '#E2E8F0', margin: '0 4px', alignSelf: 'center' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: '#1E3A5F', color: '#F8FAFC', borderRadius: '8px', fontSize: '13px', fontWeight: 700 }}>
          v1.0-beta
        </div>
      </div>

      <div style={{ display: 'flex', gap: '16px', marginTop: '16px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '200px', display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px', background: '#F1F5F9', borderRadius: '8px' }}>
          <HardDrive size={14} />
          <span style={{ fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap' }}>Stockage</span>
          <div style={{ flex: 1, height: '8px', background: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ height: '100%', background: '#1E3A5F', borderRadius: '4px', width: `${memPct}%`, transition: 'width 300ms' }} />
          </div>
          <span style={{ fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap' }}>{memUsed} / {memTotal} MB</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: '#F1F5F9', borderRadius: '8px', fontSize: '13px', fontWeight: 500 }}>
          <Timer size={14} /> Uptime
          <span style={{ fontWeight: 700, color: '#0F172A', marginLeft: '4px' }}>{uptimeStr}</span>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════ MAIN PAGE ═══════════════ */
export default function AdminConfigPage() {
  const { data: meData } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: authApi.me,
  })

  const userName = meData?.data?.user?.fullName?.split(' ')[0] || 'Admin'
  const initials = meData?.data?.user?.fullName
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 1) || '?'

  return (
    <div data-testid="admin-config">
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
            <Settings size={24} /> Configuration
          </h1>
          <p style={{ fontSize: '14px', color: '#64748B', marginTop: '4px' }}>
            Mode du site, plans, codes promo et santé système
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: '#fff', border: '1px solid #E2E8F0', borderRadius: '8px',
            padding: '6px 12px', fontSize: '13px', fontWeight: 500,
          }}>
            <span style={{
              width: '24px', height: '24px', borderRadius: '50%', background: '#F59E0B',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: '11px', color: '#1E3A5F',
            }}>
              {initials}
            </span>
            {userName}
          </div>
        </div>
      </div>

      <Section id="section-sitemode" icon={Globe} title="Mode du site" tag="D58" defaultOpen>
        <SiteModeSection />
      </Section>

      <Section id="section-plans" icon={CreditCard} title="Plans & Pricing">
        <PlansSection />
      </Section>

      <Section id="section-promos" icon={Ticket} title="Codes promotionnels" tag="D59">
        <PromoCodesSection />
      </Section>

      <Section id="section-system" icon={Monitor} title="Système">
        <SystemSection />
      </Section>
    </div>
  )
}
