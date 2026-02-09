import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Save, Loader2, Clock, Infinity } from 'lucide-react'
import { adminApi, type AdminPlan, type UpdatePlanRequest, type PlanChangeLog } from '../../api/admin.api'
import { toast } from '../../hooks/use-toast'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { useMediaQuery } from '../../hooks/useMediaQuery'

// Discount constants (PRD)
const DISCOUNTS = {
  annual: 0.17,
  founder: 0.20,
  founderAnnual: 0.30,
}

function formatPrice(price: number): string {
  return price.toFixed(2).replace(/\.00$/, '')
}

function PlanCard({ plan, onSave, isSaving }: {
  plan: AdminPlan
  onSave: (planId: number, data: UpdatePlanRequest) => void
  isSaving: boolean
}) {
  const { t } = useTranslation()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    monthlyPrice: String(plan.monthlyPrice),
    annualPrice: String(plan.annualPrice),
    maxTransactions: plan.maxTransactions === null ? '' : String(plan.maxTransactions),
    maxStorageGb: String(plan.maxStorageGb),
    historyMonths: plan.historyMonths === null ? '' : String(plan.historyMonths),
    isActive: plan.isActive,
  })
  const [reason, setReason] = useState('')

  const handleSave = () => {
    if (!reason.trim() || reason.trim().length < 3) return

    const data: UpdatePlanRequest = { reason: reason.trim() }

    const monthly = parseFloat(form.monthlyPrice)
    if (!isNaN(monthly) && monthly !== plan.monthlyPrice) data.monthlyPrice = monthly

    const annual = parseFloat(form.annualPrice)
    if (!isNaN(annual) && annual !== plan.annualPrice) data.annualPrice = annual

    const maxTx = form.maxTransactions === '' ? null : parseInt(form.maxTransactions)
    if (maxTx !== plan.maxTransactions) data.maxTransactions = maxTx

    const storage = parseFloat(form.maxStorageGb)
    if (!isNaN(storage) && storage !== plan.maxStorageGb) data.maxStorageGb = storage

    const history = form.historyMonths === '' ? null : parseInt(form.historyMonths)
    if (history !== plan.historyMonths) data.historyMonths = history

    if (form.isActive !== plan.isActive) data.isActive = form.isActive

    onSave(plan.id, data)
    setEditing(false)
    setReason('')
  }

  const monthlyNum = parseFloat(form.monthlyPrice) || 0

  return (
    <div className={`border rounded-lg p-5 ${plan.isActive ? 'bg-background' : 'bg-muted/30 opacity-75'}`} data-testid={`plan-card-${plan.slug}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-bold uppercase tracking-wide">{plan.name}</h3>
          <button
            type="button"
            onClick={() => {
              setForm((f) => ({ ...f, isActive: !f.isActive }))
              setEditing(true)
            }}
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              form.isActive
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-stone-200 text-stone-600'
            }`}
          >
            {form.isActive ? t('admin.plans.active', 'Actif') : t('admin.plans.inactive', 'Inactif')}
          </button>
        </div>
        <span className="text-xs text-muted-foreground">
          {t('admin.plans.subscribers', 'Abonnés')}: {plan.subscriberCount}
          {plan.founderCount > 0 && ` (${plan.founderCount} ${t('admin.plans.founders', 'fondateurs')})`}
        </span>
      </div>

      {/* Price row */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">
            {t('admin.plans.monthly', 'Mensuel')}
          </label>
          <div className="relative">
            <Input
              value={form.monthlyPrice}
              onChange={(e) => {
                setForm({ ...form, monthlyPrice: e.target.value })
                setEditing(true)
              }}
              className="pr-6"
              inputMode="decimal"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">
            {t('admin.plans.annual', 'Annuel')}
          </label>
          <div className="relative">
            <Input
              value={form.annualPrice}
              onChange={(e) => {
                setForm({ ...form, annualPrice: e.target.value })
                setEditing(true)
              }}
              className="pr-6"
              inputMode="decimal"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
          </div>
        </div>
      </div>

      {/* Limits row */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">
            TX max
          </label>
          <div className="relative">
            <Input
              value={form.maxTransactions}
              onChange={(e) => {
                setForm({ ...form, maxTransactions: e.target.value })
                setEditing(true)
              }}
              placeholder={String.fromCodePoint(0x221E)}
              inputMode="numeric"
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">
            {t('admin.plans.storage', 'Stockage')}
          </label>
          <div className="flex items-center gap-1">
            <Input
              value={form.maxStorageGb}
              onChange={(e) => {
                setForm({ ...form, maxStorageGb: e.target.value })
                setEditing(true)
              }}
              inputMode="decimal"
            />
            <span className="text-xs text-muted-foreground shrink-0">Go</span>
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">
            {t('admin.plans.history', 'Historique')}
          </label>
          <div className="flex items-center gap-1">
            <Input
              value={form.historyMonths}
              onChange={(e) => {
                setForm({ ...form, historyMonths: e.target.value })
                setEditing(true)
              }}
              placeholder={String.fromCodePoint(0x221E)}
              inputMode="numeric"
            />
            <span className="text-xs text-muted-foreground shrink-0">{t('admin.plans.months', 'mois')}</span>
          </div>
        </div>
      </div>

      {/* Discounted prices preview */}
      <div className="border-t border-dashed pt-3 mb-3">
        <p className="text-xs text-muted-foreground mb-1">{t('admin.plans.pricePreview', 'Aperçu des prix')}</p>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div>
            <span className="text-muted-foreground">{t('admin.plans.founderMonthly', 'Fondateur')}: </span>
            <span className="font-medium">{formatPrice(monthlyNum * (1 - DISCOUNTS.founder))}$</span>
          </div>
          <div>
            <span className="text-muted-foreground">{t('admin.plans.annualDiscount', 'Annuel')}: </span>
            <span className="font-medium">{formatPrice(monthlyNum * (1 - DISCOUNTS.annual))}$/mo</span>
          </div>
          <div>
            <span className="text-muted-foreground">{t('admin.plans.founderAnnual', 'Fond.+Ann.')}: </span>
            <span className="font-medium">{formatPrice(monthlyNum * (1 - DISCOUNTS.founderAnnual))}$/mo</span>
          </div>
        </div>
      </div>

      {/* Save section (only visible when editing) */}
      {editing && (
        <div className="border-t pt-3 space-y-2">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">
              {t('admin.plans.reason', 'Raison du changement')} *
            </label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t('admin.plans.reasonPlaceholder', 'Ex: Ajustement pricing v2')}
              data-testid={`reason-${plan.slug}`}
            />
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving || !reason.trim() || reason.trim().length < 3}
              className="gap-1.5"
            >
              {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
              {t('common.save', 'Sauvegarder')}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setForm({
                  monthlyPrice: String(plan.monthlyPrice),
                  annualPrice: String(plan.annualPrice),
                  maxTransactions: plan.maxTransactions === null ? '' : String(plan.maxTransactions),
                  maxStorageGb: String(plan.maxStorageGb),
                  historyMonths: plan.historyMonths === null ? '' : String(plan.historyMonths),
                  isActive: plan.isActive,
                })
                setReason('')
                setEditing(false)
              }}
            >
              {t('common.cancel', 'Annuler')}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function ChangeLogRow({ log }: { log: PlanChangeLog }) {
  const date = new Date(log.createdAt)
  const time = date.toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' }) +
    ' ' + date.toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' })

  const fieldLabels: Record<string, string> = {
    monthlyPrice: 'mensuel',
    annualPrice: 'annuel',
    maxTransactions: 'TX max',
    maxStorageGb: 'stockage',
    historyMonths: 'historique',
    isActive: 'statut',
    name: 'nom',
    displayOrder: 'ordre',
  }

  const field = fieldLabels[log.fieldChanged] || log.fieldChanged
  const oldVal = log.oldValue ?? 'null'
  const newVal = log.newValue ?? 'null'

  return (
    <div className="flex items-start gap-3 py-2 border-b border-dashed last:border-0">
      <Clock className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
      <div className="text-xs">
        <span className="text-muted-foreground">{time}</span>
        <span className="mx-1">·</span>
        <span className="font-medium">{log.adminName}</span>
        <span className="mx-1">·</span>
        <span>{log.planName} {field}: {oldVal} → {newVal}</span>
        <span className="mx-1">·</span>
        <span className="text-muted-foreground italic">"{log.reason}"</span>
      </div>
    </div>
  )
}

function MobileReadOnly({ plans }: { plans: AdminPlan[] }) {
  const { t } = useTranslation()

  return (
    <div className="space-y-3">
      {plans.map((plan) => (
        <div key={plan.id} className={`border rounded-lg p-4 ${plan.isActive ? '' : 'opacity-60'}`}>
          <div className="flex items-center justify-between">
            <span className="font-bold uppercase">{plan.name}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              plan.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-200 text-stone-600'
            }`}>
              {plan.isActive ? t('admin.plans.active', 'Actif') : t('admin.plans.inactive', 'Inactif')}
            </span>
          </div>
          <div className="text-sm mt-2 space-y-0.5 text-muted-foreground">
            <p>{plan.monthlyPrice}$/mo · {plan.maxTransactions ?? String.fromCodePoint(0x221E)} TX · {plan.maxStorageGb} Go</p>
            <p>{plan.subscriberCount} {t('admin.plans.subscribers', 'abonnés')}</p>
          </div>
        </div>
      ))}
      <p className="text-xs text-muted-foreground text-center mt-4 italic">
        {t('admin.plans.desktopOnly', 'Édition complète sur Desktop')}
      </p>
    </div>
  )
}

export default function AdminPlansPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const isDesktop = useMediaQuery('(min-width: 768px)')

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'plans'],
    queryFn: () => adminApi.getPlans(),
  })

  const plans = data?.data?.plans ?? []
  const changeLogs = data?.data?.changeLogs ?? []

  const updateMutation = useMutation({
    mutationFn: ({ planId, data: updateData }: { planId: number; data: UpdatePlanRequest }) =>
      adminApi.updatePlan(planId, updateData),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'plans'] })
      const changesCount = response.data?.changes?.length ?? 0
      toast({
        title: t('common.success'),
        description: t('admin.plans.saved', '{{count}} champ(s) modifié(s)', { count: changesCount }),
        variant: 'success',
      })
    },
    onError: () => {
      toast({
        title: t('common.error'),
        description: t('admin.plans.saveError', 'Erreur lors de la sauvegarde'),
        variant: 'destructive',
      })
    },
  })

  const handleSave = (planId: number, updateData: UpdatePlanRequest) => {
    updateMutation.mutate({ planId, data: updateData })
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-destructive font-medium">{t('common.error')}</p>
          <p className="text-sm text-muted-foreground mt-1">{t('admin.loadError', 'Impossible de charger les données')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6" data-testid="admin-plans">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">{t('admin.plans.title', 'Plans & Pricing')}</h1>
        <p className="text-muted-foreground text-sm">
          {t('admin.plans.subtitle', 'Modifier les prix et limites sans coder.')}
        </p>
      </div>

      {/* Global discount reference */}
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
        <span>{t('admin.plans.annualDiscount', 'Annuel')}: <strong>-{DISCOUNTS.annual * 100}%</strong></span>
        <span>{t('admin.plans.founderMonthly', 'Fondateur mensuel')}: <strong>-{DISCOUNTS.founder * 100}%</strong></span>
        <span>{t('admin.plans.founderAnnual', 'Fondateur annuel')}: <strong>-{DISCOUNTS.founderAnnual * 100}%</strong></span>
      </div>

      {/* Loading */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : !isDesktop ? (
        <MobileReadOnly plans={plans} />
      ) : (
        <>
          {/* Plan cards */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                onSave={handleSave}
                isSaving={updateMutation.isPending}
              />
            ))}
          </div>

          {/* Change logs */}
          {changeLogs.length > 0 && (
            <div className="border rounded-lg p-5">
              <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground mb-3">
                {t('admin.plans.changeLog', 'Historique des changements')}
              </h2>
              <div className="max-h-64 overflow-y-auto">
                {changeLogs.map((log) => (
                  <ChangeLogRow key={log.id} log={log} />
                ))}
              </div>
            </div>
          )}

          {/* Warning */}
          <p className="text-xs text-muted-foreground italic">
            {t('admin.plans.warning', 'Les changements s\'appliquent aux nouveaux abonnés uniquement.')}
          </p>
        </>
      )}
    </div>
  )
}
