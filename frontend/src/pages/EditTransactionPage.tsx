import { useState, useMemo, useCallback, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  transactionsApi,
  type Transaction,
  type UpdateTransactionRequest,
} from '../api/transactions.api'
import { toast } from '../hooks/use-toast'
import {
  Pencil,
  X,
  Check,
  Home,
  Users,
  Calendar,
  Settings,
  Loader2,
  AlertCircle,
  Lock,
  ChevronRight,
  Undo2,
  Info,
  Trash2,
  Plus,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react'

type TabKey = 'property' | 'parties' | 'dates' | 'params'

interface FormData {
  // Property
  address: string
  city: string
  postalCode: string
  province: string
  // Transaction
  type: string
  listPrice: string
  // Dates
  closingDate: string
  offerExpiryDate: string
  inspectionDeadline: string
  financingDeadline: string
  // Params
  language: string
  notesText: string
  tags: string[]
  // Custom dates
  customDates: { label: string; date: string }[]
}

interface OriginalData extends FormData {}

function getInitialForm(t: Transaction): FormData {
  return {
    address: t.property?.address ?? '',
    city: t.property?.city ?? '',
    postalCode: t.property?.postalCode ?? '',
    province: t.property?.province ?? 'Nouveau-Brunswick',
    type: t.type ?? 'purchase',
    listPrice: t.listPrice != null ? String(t.listPrice) : '',
    closingDate: t.closingDate?.split('T')[0] ?? '',
    offerExpiryDate: t.offerExpiryDate?.split('T')[0] ?? '',
    inspectionDeadline: t.inspectionDeadline?.split('T')[0] ?? '',
    financingDeadline: t.financingDeadline?.split('T')[0] ?? '',
    language: t.language ?? 'fr',
    notesText: t.notesText ?? '',
    tags: t.tags ?? [],
    customDates: [],
  }
}

type FieldChange = { field: string; label: string; oldValue: string; newValue: string }

function computeChanges(original: OriginalData, current: FormData, t: (k: string, f?: string) => string): FieldChange[] {
  const changes: FieldChange[] = []
  const fields: { key: keyof FormData; label: string }[] = [
    { key: 'address', label: t('editTransaction.fields.address', 'Adresse') },
    { key: 'city', label: t('editTransaction.fields.city', 'Ville') },
    { key: 'postalCode', label: t('editTransaction.fields.postalCode', 'Code postal') },
    { key: 'province', label: t('editTransaction.fields.province', 'Province') },
    { key: 'type', label: t('editTransaction.fields.type', 'Type') },
    { key: 'listPrice', label: t('editTransaction.fields.listPrice', 'Prix affiché') },
    { key: 'closingDate', label: t('editTransaction.fields.closingDate', 'Date de closing') },
    { key: 'offerExpiryDate', label: t('editTransaction.fields.offerExpiry', 'Expiration offre') },
    { key: 'inspectionDeadline', label: t('editTransaction.fields.inspection', 'Date limite inspection') },
    { key: 'financingDeadline', label: t('editTransaction.fields.financing', 'Date limite financement') },
    { key: 'language', label: t('editTransaction.fields.language', 'Langue') },
    { key: 'notesText', label: t('editTransaction.fields.notes', 'Notes') },
  ]
  for (const f of fields) {
    const o = String(original[f.key] ?? '')
    const c = String(current[f.key] ?? '')
    if (o !== c) {
      changes.push({ field: f.key, label: f.label, oldValue: o || '—', newValue: c || '—' })
    }
  }
  // Tags
  const oTags = (original.tags ?? []).join(', ')
  const cTags = (current.tags ?? []).join(', ')
  if (oTags !== cTags) {
    changes.push({ field: 'tags', label: 'Tags', oldValue: oTags || '—', newValue: cTags || '—' })
  }
  return changes
}

function formatPrice(v: string): string {
  const num = parseInt(v.replace(/\s/g, ''), 10)
  if (isNaN(num)) return v
  return num.toLocaleString('fr-CA')
}

export default function EditTransactionPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const transactionId = Number(id)

  const [activeTab, setActiveTab] = useState<TabKey>('property')
  const [form, setForm] = useState<FormData | null>(null)
  const [original, setOriginal] = useState<OriginalData | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [confirmChecked, setConfirmChecked] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [savedChanges, setSavedChanges] = useState<FieldChange[]>([])
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [tagInput, setTagInput] = useState('')

  const { data, isLoading, error } = useQuery({
    queryKey: ['transaction', transactionId],
    queryFn: () => transactionsApi.get(transactionId),
    enabled: !!id,
  })

  const transaction = data?.data?.transaction

  useEffect(() => {
    if (transaction && !form) {
      const initial = getInitialForm(transaction)
      setForm(initial)
      setOriginal({ ...initial })
    }
  }, [transaction, form])

  const updateField = useCallback(<K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm((prev) => prev ? { ...prev, [key]: value } : prev)
    setValidationErrors((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }, [])

  const changes = useMemo(() => {
    if (!form || !original) return []
    return computeChanges(original, form, t)
  }, [form, original, t])

  const isLocked = transaction?.status === 'archived'

  const updateMutation = useMutation({
    mutationFn: (data: UpdateTransactionRequest) => transactionsApi.update(transactionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transaction', transactionId] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      setSavedChanges(changes)
      setShowConfirm(false)
      setShowSuccess(true)
    },
    onError: () => {
      toast({ title: t('common.error'), variant: 'destructive' })
      setShowConfirm(false)
    },
  })

  const handleSave = () => {
    if (!form || changes.length === 0) return
    setShowConfirm(true)
    setConfirmChecked(false)
  }

  const handleConfirmSave = () => {
    if (!form || !confirmChecked) return
    const payload: UpdateTransactionRequest = {}
    if (form.address !== original?.address) payload.address = form.address
    if (form.city !== original?.city) payload.city = form.city
    if (form.postalCode !== original?.postalCode) payload.postalCode = form.postalCode
    if (form.province !== original?.province) payload.province = form.province
    if (form.type !== original?.type) payload.type = form.type as 'purchase' | 'sale'
    if (form.listPrice !== original?.listPrice) {
      const num = parseInt(form.listPrice.replace(/\s/g, ''), 10)
      if (!isNaN(num)) payload.listPrice = num
    }
    if (form.closingDate !== original?.closingDate) payload.closingDate = form.closingDate || null
    if (form.offerExpiryDate !== original?.offerExpiryDate) payload.offerExpiryDate = form.offerExpiryDate || null
    if (form.inspectionDeadline !== original?.inspectionDeadline) payload.inspectionDeadline = form.inspectionDeadline || null
    if (form.financingDeadline !== original?.financingDeadline) payload.financingDeadline = form.financingDeadline || null
    if (form.language !== original?.language) payload.language = form.language
    if (form.notesText !== original?.notesText) payload.notesText = form.notesText
    const oTags = (original?.tags ?? []).join(',')
    const cTags = (form.tags ?? []).join(',')
    if (oTags !== cTags) payload.tags = form.tags
    updateMutation.mutate(payload)
  }

  // Loading
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-[#1e3a5f]" />
      </div>
    )
  }

  if (error || !transaction || !form || !original) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
        <p className="text-sm text-stone-500 mb-4">{t('common.error')}</p>
        <button onClick={() => navigate(-1)} className="px-4 py-2 text-sm text-white bg-[#1e3a5f] rounded-lg">
          {t('common.back')}
        </button>
      </div>
    )
  }

  // State C: Success
  if (showSuccess) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <Breadcrumb transaction={transaction} t={t} />
        <div className="max-w-lg mx-auto px-4 pt-8 sm:pt-12">
          <div className="bg-white rounded-2xl border border-stone-200 p-6 text-center shadow-sm">
            <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <Check className="w-7 h-7 text-emerald-600" />
            </div>
            <h2 className="text-lg font-bold text-stone-900">{t('editTransaction.success.title', 'Modifications enregistrées')}</h2>
            <p className="text-sm text-stone-500 mb-5">
              {t('editTransaction.success.desc', '{{count}} champ(s) mis à jour avec succès', { count: savedChanges.length })}
            </p>
            <div className="rounded-lg bg-stone-50 border border-stone-200 p-4 text-left mb-5">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-500 mb-2">
                {t('editTransaction.success.summary', 'Résumé')}
              </p>
              <div className="space-y-1.5">
                {savedChanges.map((c) => (
                  <div key={c.field} className="flex items-center gap-2 text-xs">
                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span className="text-stone-600">{c.label} → {c.newValue}</span>
                  </div>
                ))}
              </div>
            </div>
            <button
              onClick={() => navigate(`/transactions/${transactionId}`)}
              className="w-full px-4 py-2.5 text-sm font-medium text-white bg-[#1e3a5f] hover:bg-[#1e3a5f]/90 rounded-lg shadow-sm flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('editTransaction.success.back', 'Retour à la transaction')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  const clientName = transaction.client ? `${transaction.client.firstName} ${transaction.client.lastName}` : ''
  const propertyLabel = transaction.property ? `${transaction.property.address}, ${transaction.property.city}` : ''
  const statusBadge = transaction.status === 'active'
    ? { classes: 'bg-emerald-100 text-emerald-700', label: t('editTransaction.status.active', 'Active') }
    : transaction.status === 'archived'
      ? { classes: 'bg-stone-200 text-stone-600', label: t('editTransaction.status.archived', 'Archivée') }
      : { classes: 'bg-red-100 text-red-600', label: t('editTransaction.status.cancelled', 'Annulée') }

  const tabs: { key: TabKey; label: string; icon: typeof Home; badge?: number }[] = [
    { key: 'property', label: t('editTransaction.tabs.property', 'Bien'), icon: Home },
    { key: 'parties', label: t('editTransaction.tabs.parties', 'Parties'), icon: Users },
    { key: 'dates', label: t('editTransaction.tabs.dates', 'Dates'), icon: Calendar },
    { key: 'params', label: t('editTransaction.tabs.params', 'Params'), icon: Settings },
  ]

  const hasErrors = Object.keys(validationErrors).length > 0

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 sm:pb-8">
      {/* Breadcrumb */}
      <Breadcrumb transaction={transaction} t={t} />

      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg ${isLocked ? 'bg-stone-200' : 'bg-[#1e3a5f]/10'} flex items-center justify-center shrink-0`}>
            {isLocked ? <Lock className="w-4.5 h-4.5 text-stone-400" /> : <Pencil className="w-4.5 h-4.5 text-[#1e3a5f]" />}
          </div>
          <div>
            <h1 className="text-lg font-bold text-stone-900 flex items-center gap-2">
              {t('editTransaction.title', 'Éditer la transaction')}
              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${statusBadge.classes}`}>
                {statusBadge.label}
              </span>
            </h1>
            <p className="text-xs text-stone-500 mt-0.5 hidden sm:block">
              {clientName} · {propertyLabel}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/transactions/${transactionId}`)}
            className="px-2.5 sm:px-3 py-2 text-xs font-medium text-stone-600 bg-white border border-stone-300 rounded-lg hover:bg-stone-50"
          >
            {t('common.cancel')}
          </button>
          {!isLocked && (
            <button
              onClick={handleSave}
              disabled={changes.length === 0 || updateMutation.isPending}
              title={changes.length === 0 ? t('editTransaction.noChanges', 'Aucun changement détecté') : ''}
              className={[
                'px-4 py-2 text-xs font-medium text-white rounded-lg shadow-sm flex items-center gap-1.5',
                changes.length > 0 && !updateMutation.isPending
                  ? 'bg-[#1e3a5f] hover:bg-[#1e3a5f]/90'
                  : 'bg-stone-300 cursor-not-allowed',
              ].join(' ')}
            >
              <Check className="w-3.5 h-3.5" />
              {t('editTransaction.save', 'Enregistrer')}
            </button>
          )}
        </div>
      </div>

      {/* State E: Locked banner */}
      {isLocked && (
        <div className="rounded-xl bg-stone-100 border border-stone-300 p-4 mb-4 flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center shrink-0">
            <Lock className="w-4 h-4 text-stone-500" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-stone-700">{t('editTransaction.locked.title', 'Édition verrouillée')}</p>
            <p className="text-xs text-stone-500 mt-0.5">{t('editTransaction.locked.desc', 'Transaction archivée. Restaurez pour modifier.')}</p>
          </div>
          <button className="px-3 py-2 text-xs font-medium text-[#e07a2f] bg-white border border-[#e07a2f]/30 rounded-lg hover:bg-[#e07a2f]/5 shrink-0 flex items-center gap-1.5">
            <Undo2 className="w-3.5 h-3.5" />
            {t('editTransaction.locked.restore', 'Restaurer')}
          </button>
        </div>
      )}

      {/* State D: Error banner */}
      {hasErrors && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 mb-4 flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <AlertCircle className="w-4 h-4 text-red-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-red-800">
              {t('editTransaction.errors.title', '{{count}} erreur(s) de validation', { count: Object.keys(validationErrors).length })}
            </p>
            <p className="text-xs text-red-600 mt-0.5">{t('editTransaction.errors.desc', 'Corrigez les erreurs ci-dessous avant de pouvoir enregistrer.')}</p>
            <div className="mt-2 space-y-1">
              {Object.entries(validationErrors).map(([key, msg]) => (
                <div key={key} className="flex items-center gap-1.5">
                  <div className="w-1 h-1 rounded-full bg-red-400" />
                  <span className="text-xs text-red-700">{msg}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-6">
        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Tabs */}
          <div className="flex gap-0 border-b border-stone-200 mb-5 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.key
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={[
                    'flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium whitespace-nowrap transition-colors border-b-2 -mb-px',
                    isActive
                      ? 'border-[#1e3a5f] text-[#1e3a5f]'
                      : 'border-transparent text-stone-500 hover:text-stone-700',
                  ].join(' ')}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                  {tab.badge && (
                    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold bg-amber-100 text-amber-700">
                      {tab.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Tab content */}
          <div className={isLocked ? 'opacity-60 pointer-events-none select-none' : ''}>
            {activeTab === 'property' && (
              <PropertyTab form={form} original={original} updateField={updateField} validationErrors={validationErrors} t={t} isLocked={isLocked} />
            )}
            {activeTab === 'parties' && (
              <PartiesTab transaction={transaction} t={t} isLocked={isLocked} />
            )}
            {activeTab === 'dates' && (
              <DatesTab form={form} original={original} updateField={updateField} validationErrors={validationErrors} t={t} isLocked={isLocked} />
            )}
            {activeTab === 'params' && (
              <ParamsTab form={form} original={original} updateField={updateField} tagInput={tagInput} setTagInput={setTagInput} t={t} isLocked={isLocked} />
            )}
          </div>
        </div>

        {/* Sidebar — desktop only */}
        <div className="hidden lg:block w-72 shrink-0">
          <ChangesSidebar changes={changes} t={t} />
        </div>
      </div>

      {/* Mobile change bar */}
      {changes.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden pointer-events-none">
          <div className="bg-white border-t border-stone-200 shadow-[0_-4px_12px_rgba(0,0,0,0.08)] p-3 pointer-events-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-xs font-bold flex items-center justify-center">
                  {changes.length}
                </span>
                <span className="text-xs font-medium text-stone-700">
                  {t('editTransaction.sidebar.changesCount', 'champ(s) modifié(s)')}
                </span>
              </div>
              <button className="text-xs text-[#1e3a5f] font-medium hover:underline">
                {t('editTransaction.sidebar.viewSummary', 'Voir le résumé')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* State B: Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowConfirm(false)} />
          <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg mx-0 sm:mx-4 max-h-[92vh] flex flex-col">
            <div className="px-5 pt-5 pb-3 border-b border-stone-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center">
                  <AlertCircle className="w-4.5 h-4.5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-stone-900">{t('editTransaction.confirm.title', 'Confirmer les modifications')}</h3>
                  <p className="text-xs text-stone-500">{t('editTransaction.confirm.subtitle', 'Vérifiez les changements avant d\'enregistrer')}</p>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-stone-700">
                {t('editTransaction.confirm.count', '{{count}} modification(s)', { count: changes.length })}
              </p>
              <div className="rounded-lg border border-stone-200 divide-y divide-stone-100">
                {changes.map((c) => (
                  <div key={c.field} className="p-3 flex items-start gap-3">
                    <div className="w-5 h-5 rounded bg-amber-100 flex items-center justify-center shrink-0">
                      <Pencil className="w-3 h-3 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-stone-800">{c.label}</p>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <span className="text-[10px] text-stone-400 line-through">{c.oldValue}</span>
                        <ArrowRight className="w-3 h-3 text-stone-300 shrink-0" />
                        <span className="text-[10px] text-amber-700 font-medium">{c.newValue}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {/* Impact info */}
              {changes.some((c) => c.field === 'closingDate') && (
                <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-blue-800">{t('editTransaction.confirm.impact', 'Impact sur le workflow')}</p>
                    <p className="text-[10px] text-blue-600 mt-0.5">
                      {t('editTransaction.confirm.impactDesc', 'Le changement de date de closing peut affecter les échéances des conditions en cours.')}
                    </p>
                  </div>
                </div>
              )}
              {/* Checkbox */}
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmChecked}
                  onChange={(e) => setConfirmChecked(e.target.checked)}
                  className="rounded border-stone-300 text-[#1e3a5f] focus:ring-[#1e3a5f]/30 mt-0.5"
                />
                <span className="text-xs text-stone-600">
                  {t('editTransaction.confirm.checkbox', 'Je confirme que ces modifications sont exactes et souhaite les enregistrer')}
                </span>
              </label>
            </div>
            <div className="px-5 py-4 border-t border-stone-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-3 py-2 text-xs font-medium text-stone-600 bg-white border border-stone-300 rounded-lg hover:bg-stone-50"
              >
                {t('editTransaction.confirm.back', 'Retour au formulaire')}
              </button>
              <button
                onClick={handleConfirmSave}
                disabled={!confirmChecked || updateMutation.isPending}
                className={[
                  'px-4 py-2 text-xs font-medium text-white rounded-lg shadow-sm flex items-center gap-1.5',
                  confirmChecked && !updateMutation.isPending
                    ? 'bg-[#1e3a5f] hover:bg-[#1e3a5f]/90'
                    : 'bg-stone-300 cursor-not-allowed',
                ].join(' ')}
              >
                {updateMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {t('editTransaction.confirm.save', 'Enregistrer les modifications')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Breadcrumb ─── */

function Breadcrumb({ transaction, t }: { transaction: Transaction; t: (k: string, f?: string) => string }) {
  const clientName = transaction.client ? `${transaction.client.firstName} ${transaction.client.lastName}` : ''
  return (
    <div className="flex items-center gap-1.5 text-xs text-stone-400 py-4">
      <a href="/transactions" className="hover:text-stone-600">{t('editTransaction.breadcrumb.transactions', 'Transactions')}</a>
      <ChevronRight className="w-3 h-3" />
      <a href={`/transactions/${transaction.id}`} className="hover:text-stone-600">{clientName}</a>
      <ChevronRight className="w-3 h-3" />
      <span className="text-stone-600">{t('editTransaction.breadcrumb.edit', 'Éditer')}</span>
    </div>
  )
}

/* ─── Changes Sidebar ─── */

function ChangesSidebar({ changes, t }: { changes: FieldChange[]; t: (k: string, f?: string) => string }) {
  return (
    <div className="sticky top-28 bg-white rounded-xl border border-stone-200 p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center">
          <Pencil className="w-3 h-3 text-amber-600" />
        </div>
        <span className="text-xs font-semibold text-stone-700 flex-1">
          {t('editTransaction.sidebar.title', 'Résumé des changements')}
        </span>
        {changes.length > 0 && (
          <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold flex items-center justify-center">
            {changes.length}
          </span>
        )}
      </div>
      {changes.length === 0 ? (
        <p className="text-[10px] text-stone-400 text-center py-4">{t('editTransaction.sidebar.noChanges', 'Aucune modification')}</p>
      ) : (
        <>
          <div className="space-y-2">
            {changes.map((c) => (
              <div key={c.field} className="flex items-start gap-2 p-2 rounded-lg bg-amber-50/50 border border-amber-100">
                <Pencil className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-stone-700">{c.label}</p>
                  <p className="text-[10px] text-stone-400 line-through truncate">{c.oldValue}</p>
                  <p className="text-[10px] text-amber-700 truncate">{c.newValue}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-stone-100">
            <p className="text-[10px] text-stone-400 text-center">
              {changes.length} {t('editTransaction.sidebar.changesCount', 'champ(s) modifié(s)')}
            </p>
          </div>
        </>
      )}
    </div>
  )
}

/* ─── Field helpers ─── */

function FieldLabel({ label, required, modified, error }: { label: string; required?: boolean; modified?: boolean; error?: boolean }) {
  return (
    <label className={`block text-xs font-semibold mb-1.5 uppercase tracking-wide ${error ? 'text-red-600' : 'text-stone-600'}`}>
      {label}
      {required && <span className="text-red-400 ml-0.5">*</span>}
      {modified && <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 ml-1.5 align-middle" />}
    </label>
  )
}

function fieldClasses(modified: boolean, error: boolean): string {
  if (error) return 'w-full px-3 py-2 text-sm border-2 border-red-300 bg-red-50/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-200'
  if (modified) return 'w-full px-3 py-2 text-sm border border-stone-300 bg-[#fffbeb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20'
  return 'w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20'
}

function ChangeNote({ original, current, suffix }: { original: string; current: string; suffix?: string }) {
  if (original === current) return null
  return (
    <p className="text-[10px] text-amber-600 mt-1">
      Modifié — était : {original}{suffix}
    </p>
  )
}

/* ─── Property Tab ─── */

function PropertyTab({ form, original, updateField, validationErrors, t, isLocked }: {
  form: FormData; original: OriginalData; updateField: <K extends keyof FormData>(k: K, v: FormData[K]) => void
  validationErrors: Record<string, string>; t: (k: string, f?: string) => string; isLocked: boolean
}) {
  return (
    <div className={`bg-white rounded-xl border ${Object.keys(validationErrors).some(k => ['address','city','postalCode'].includes(k)) ? 'border-red-200' : 'border-stone-200'} p-5`}>
      <h3 className="text-sm font-semibold text-stone-900 mb-4 flex items-center gap-2">
        {isLocked && <Lock className="w-3.5 h-3.5 text-stone-400" />}
        {t('editTransaction.property.title', 'Informations du bien')}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Address — full width */}
        <div className="sm:col-span-2">
          <FieldLabel label={t('editTransaction.fields.address', 'Adresse')} required modified={form.address !== original.address} error={!!validationErrors.address} />
          <input type="text" value={form.address} onChange={(e) => updateField('address', e.target.value)} className={fieldClasses(form.address !== original.address, !!validationErrors.address)} disabled={isLocked} />
          {validationErrors.address && <p className="text-[10px] text-red-600 mt-1">{validationErrors.address}</p>}
          <ChangeNote original={original.address} current={form.address} />
        </div>
        {/* City */}
        <div>
          <FieldLabel label={t('editTransaction.fields.city', 'Ville')} />
          <input type="text" value={form.city} onChange={(e) => updateField('city', e.target.value)} className={fieldClasses(form.city !== original.city, !!validationErrors.city)} disabled={isLocked} />
          {validationErrors.city && <p className="text-[10px] text-red-600 mt-1">{validationErrors.city}</p>}
        </div>
        {/* Postal Code */}
        <div>
          <FieldLabel label={t('editTransaction.fields.postalCode', 'Code postal')} error={!!validationErrors.postalCode} />
          <input type="text" value={form.postalCode} onChange={(e) => updateField('postalCode', e.target.value)} className={fieldClasses(form.postalCode !== original.postalCode, !!validationErrors.postalCode)} disabled={isLocked} />
          {validationErrors.postalCode && <p className="text-[10px] text-red-600 mt-1">{validationErrors.postalCode}</p>}
        </div>
        {/* Province */}
        <div>
          <FieldLabel label={t('editTransaction.fields.province', 'Province')} />
          <select value={form.province} onChange={(e) => updateField('province', e.target.value)} className={fieldClasses(form.province !== original.province, false)} disabled={isLocked}>
            <option value="Nouveau-Brunswick">Nouveau-Brunswick</option>
            <option value="Ontario">Ontario</option>
            <option value="Québec">Québec</option>
            <option value="Nouvelle-Écosse">Nouvelle-Écosse</option>
          </select>
        </div>
        {/* Type */}
        <div>
          <FieldLabel label={t('editTransaction.fields.type', 'Type de transaction')} required />
          <select value={form.type} onChange={(e) => updateField('type', e.target.value)} className={fieldClasses(form.type !== original.type, false)} disabled={isLocked}>
            <option value="purchase">{t('editTransaction.type.purchase', 'Achat')}</option>
            <option value="sale">{t('editTransaction.type.sale', 'Vente')}</option>
          </select>
        </div>
        {/* List Price */}
        <div>
          <FieldLabel label={t('editTransaction.fields.listPrice', 'Prix affiché')} required modified={form.listPrice !== original.listPrice} />
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-stone-400">$</span>
            <input type="text" value={form.listPrice} onChange={(e) => updateField('listPrice', e.target.value.replace(/[^\d\s]/g, ''))} className={`${fieldClasses(form.listPrice !== original.listPrice, false)} pl-7`} disabled={isLocked} />
          </div>
          <ChangeNote original={original.listPrice ? `${formatPrice(original.listPrice)} $` : '—'} current={form.listPrice} />
        </div>
      </div>
    </div>
  )
}

/* ─── Parties Tab ─── */

function PartiesTab({ transaction, t, isLocked }: { transaction: Transaction; t: (k: string, f?: string) => string; isLocked: boolean }) {
  // Read-only view using transaction data - parties management is handled by PartiesModal
  const sections = [
    { key: 'buyer', label: t('editTransaction.parties.buyer', 'Acheteur(s)'), data: transaction.client },
    { key: 'seller', label: t('editTransaction.parties.seller', 'Vendeur(s)'), data: null },
  ]

  return (
    <div className="space-y-4">
      {/* Buyer */}
      <div className="bg-white rounded-xl border border-stone-200 p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-stone-900 flex items-center gap-2">
            {isLocked && <Lock className="w-3.5 h-3.5 text-stone-400" />}
            {t('editTransaction.parties.buyer', 'Acheteur(s)')}
          </h3>
          {!isLocked && (
            <button className="text-xs text-[#1e3a5f] font-medium flex items-center gap-1 hover:underline">
              <Plus className="w-3 h-3" />
              {t('editTransaction.parties.add', 'Ajouter')}
            </button>
          )}
        </div>
        {transaction.client && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <FieldLabel label={t('editTransaction.parties.fullName', 'Nom complet')} required />
              <input type="text" value={`${transaction.client.firstName} ${transaction.client.lastName}`} className={fieldClasses(false, false)} disabled readOnly />
            </div>
            <div>
              <FieldLabel label={t('editTransaction.parties.email', 'Courriel')} required />
              <input type="text" value={transaction.client.email ?? ''} className={fieldClasses(false, false)} disabled readOnly />
            </div>
            <div>
              <FieldLabel label={t('editTransaction.parties.phone', 'Téléphone')} />
              <input type="text" value={transaction.client.phone ?? ''} className={fieldClasses(false, false)} disabled readOnly />
            </div>
            <div>
              <FieldLabel label={t('editTransaction.parties.address', 'Adresse')} />
              <input type="text" value="" placeholder={t('editTransaction.parties.addressPlaceholder', 'Adresse du client')} className={fieldClasses(false, false)} disabled readOnly />
            </div>
          </div>
        )}
      </div>

      {/* Info: use PartiesModal for full management */}
      <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 flex items-center gap-2">
        <Info className="w-4 h-4 text-blue-500 shrink-0" />
        <p className="text-xs text-blue-700">
          {t('editTransaction.parties.hint', 'Pour gérer toutes les parties (vendeur, avocat, courtier), utilisez la gestion des parties depuis la page transaction.')}
        </p>
      </div>
    </div>
  )
}

/* ─── Dates Tab ─── */

function DatesTab({ form, original, updateField, validationErrors, t, isLocked }: {
  form: FormData; original: OriginalData; updateField: <K extends keyof FormData>(k: K, v: FormData[K]) => void
  validationErrors: Record<string, string>; t: (k: string, f?: string) => string; isLocked: boolean
}) {
  const addCustomDate = () => {
    updateField('customDates', [...form.customDates, { label: '', date: '' }])
  }
  const removeCustomDate = (idx: number) => {
    updateField('customDates', form.customDates.filter((_, i) => i !== idx))
  }
  const updateCustomDate = (idx: number, field: 'label' | 'date', value: string) => {
    const updated = [...form.customDates]
    updated[idx] = { ...updated[idx], [field]: value }
    updateField('customDates', updated)
  }

  return (
    <div className={`bg-white rounded-xl border ${Object.keys(validationErrors).some(k => k.includes('Date') || k.includes('deadline')) ? 'border-red-200' : 'border-stone-200'} p-5`}>
      <h3 className="text-sm font-semibold text-stone-900 mb-4 flex items-center gap-2">
        {isLocked && <Lock className="w-3.5 h-3.5 text-stone-400" />}
        {t('editTransaction.dates.title', 'Dates clés')}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <FieldLabel label={t('editTransaction.fields.closingDate', 'Date de closing')} required modified={form.closingDate !== original.closingDate} error={!!validationErrors.closingDate} />
          <input type="date" value={form.closingDate} onChange={(e) => updateField('closingDate', e.target.value)} className={fieldClasses(form.closingDate !== original.closingDate, !!validationErrors.closingDate)} disabled={isLocked} />
          {validationErrors.closingDate && <p className="text-[10px] text-red-600 mt-1">{validationErrors.closingDate}</p>}
          <ChangeNote original={original.closingDate} current={form.closingDate} />
        </div>
        <div>
          <FieldLabel label={t('editTransaction.fields.offerExpiry', 'Expiration offre')} />
          <input type="date" value={form.offerExpiryDate} onChange={(e) => updateField('offerExpiryDate', e.target.value)} className={fieldClasses(form.offerExpiryDate !== original.offerExpiryDate, false)} disabled={isLocked} />
        </div>
        <div>
          <FieldLabel label={t('editTransaction.fields.inspection', 'Date limite inspection')} error={!!validationErrors.inspectionDeadline} />
          <input type="date" value={form.inspectionDeadline} onChange={(e) => updateField('inspectionDeadline', e.target.value)} className={fieldClasses(form.inspectionDeadline !== original.inspectionDeadline, !!validationErrors.inspectionDeadline)} disabled={isLocked} />
          {validationErrors.inspectionDeadline && <p className="text-[10px] text-red-600 mt-1">{validationErrors.inspectionDeadline}</p>}
        </div>
        <div>
          <FieldLabel label={t('editTransaction.fields.financing', 'Date limite financement')} />
          <input type="date" value={form.financingDeadline} onChange={(e) => updateField('financingDeadline', e.target.value)} className={fieldClasses(form.financingDeadline !== original.financingDeadline, false)} disabled={isLocked} />
        </div>
      </div>
      {/* Custom dates */}
      {(form.customDates.length > 0 || !isLocked) && (
        <div className="border-t border-stone-100 pt-4 mt-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-stone-600 uppercase tracking-wide">
              {t('editTransaction.dates.other', 'Autres dates')}
            </span>
            {!isLocked && (
              <button onClick={addCustomDate} className="text-xs text-[#1e3a5f] font-medium flex items-center gap-1 hover:underline">
                <Plus className="w-3 h-3" />
                {t('editTransaction.dates.addDate', 'Ajouter une date')}
              </button>
            )}
          </div>
          <div className="space-y-2">
            {form.customDates.map((cd, idx) => (
              <div key={idx} className="grid grid-cols-[1fr_1fr_auto] gap-2 bg-stone-50 p-2 rounded-lg items-center">
                <input type="text" value={cd.label} onChange={(e) => updateCustomDate(idx, 'label', e.target.value)} placeholder={t('editTransaction.dates.labelPlaceholder', 'Libellé')} className="px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20" />
                <input type="date" value={cd.date} onChange={(e) => updateCustomDate(idx, 'date', e.target.value)} className="px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20" />
                <button onClick={() => removeCustomDate(idx)} className="p-1.5 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Params Tab ─── */

function ParamsTab({ form, original, updateField, tagInput, setTagInput, t, isLocked }: {
  form: FormData; original: OriginalData; updateField: <K extends keyof FormData>(k: K, v: FormData[K]) => void
  tagInput: string; setTagInput: (v: string) => void; t: (k: string, f?: string) => string; isLocked: boolean
}) {
  const addTag = () => {
    const tag = tagInput.trim()
    if (tag && !form.tags.includes(tag)) {
      updateField('tags', [...form.tags, tag])
    }
    setTagInput('')
  }
  const removeTag = (tag: string) => {
    updateField('tags', form.tags.filter((t) => t !== tag))
  }

  return (
    <div className="bg-white rounded-xl border border-stone-200 p-5">
      <h3 className="text-sm font-semibold text-stone-900 mb-4 flex items-center gap-2">
        {isLocked && <Lock className="w-3.5 h-3.5 text-stone-400" />}
        {t('editTransaction.params.title', 'Paramètres')}
      </h3>
      <div className="space-y-4">
        {/* Language */}
        <div>
          <FieldLabel label={t('editTransaction.fields.language', 'Langue principale')} />
          <select value={form.language} onChange={(e) => updateField('language', e.target.value)} className={fieldClasses(form.language !== original.language, false)} disabled={isLocked}>
            <option value="fr">Français</option>
            <option value="en">English</option>
          </select>
          <p className="text-[10px] text-stone-400 mt-1">
            {t('editTransaction.params.languageHelper', 'Langue utilisée pour les notifications et documents générés')}
          </p>
        </div>
        {/* Notes */}
        <div>
          <FieldLabel label={t('editTransaction.fields.notes', 'Notes internes')} />
          <textarea
            value={form.notesText}
            onChange={(e) => updateField('notesText', e.target.value)}
            rows={3}
            placeholder={t('editTransaction.params.notesPlaceholder', 'Notes visibles uniquement par vous...')}
            className={`${fieldClasses(form.notesText !== original.notesText, false)} resize-none`}
            disabled={isLocked}
          />
          <p className="text-[10px] text-stone-400 mt-1">
            {t('editTransaction.params.notesHelper', 'Visibles uniquement par vous et votre équipe')}
          </p>
        </div>
        {/* Tags */}
        <div>
          <FieldLabel label="Tags" />
          <div className="flex flex-wrap gap-2">
            {form.tags.map((tag) => (
              <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-[#1e3a5f]/10 text-[#1e3a5f]">
                {tag}
                {!isLocked && (
                  <button onClick={() => removeTag(tag)} className="text-[#1e3a5f]/50 hover:text-red-500">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </span>
            ))}
            {!isLocked && (
              <div className="inline-flex items-center gap-1">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
                  placeholder={form.tags.length === 0 ? t('editTransaction.params.addTag', 'Ajouter un tag') : ''}
                  className="w-24 px-2 py-1 text-xs border-0 outline-none bg-transparent"
                />
                {tagInput.trim() && (
                  <button onClick={addTag} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border border-dashed border-stone-300 text-stone-400 hover:text-[#1e3a5f] hover:border-[#1e3a5f]">
                    <Plus className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
