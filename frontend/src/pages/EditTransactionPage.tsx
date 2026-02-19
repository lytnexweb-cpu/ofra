import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  transactionsApi,
  type Transaction,
  type TransactionProfile,
  type UpdateTransactionRequest,
  type CreateTransactionRequest,
  type PropertyType,
  type PropertyContext,
  type ClientRole,
} from '../api/transactions.api'
import { clientsApi } from '../api/clients.api'
import CreateClientModal from '../components/CreateClientModal'
import {
  workflowTemplatesApi,
  type WorkflowTemplate,
} from '../api/workflow-templates.api'
import type { User } from '../api/auth.api'
import type { ApiResponse } from '../api/http'
import { toast } from '../hooks/use-toast'
import {
  Pencil,
  Check,
  Home,
  Users,
  Calendar,
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
  Building2,
  TreePine,
  Building,
  Mountain,
} from 'lucide-react'

type TabKey = 'property' | 'parties' | 'dates'

interface FormData {
  // Create-only
  clientId: number
  clientRole: ClientRole | ''
  autoConditionsEnabled: boolean
  // Property
  address: string
  city: string
  postalCode: string
  province: string
  // Transaction
  type: string
  listPrice: string
  // Profile
  propertyType: string
  propertyContext: string
  isFinanced: boolean
  hasWell: boolean
  hasSeptic: boolean
  // Dates
  closingDate: string
  offerExpiryDate: string
  inspectionDeadline: string
  financingDeadline: string
}

interface OriginalData extends FormData {}

function getInitialForm(t: Transaction, profile?: TransactionProfile | null): FormData {
  return {
    clientId: t.clientId ?? 0,
    clientRole: t.clientRole ?? '',
    autoConditionsEnabled: true,
    address: t.property?.address ?? '',
    city: t.property?.city ?? '',
    postalCode: t.property?.postalCode ?? '',
    province: t.property?.province ?? 'Nouveau-Brunswick',
    type: t.type ?? 'purchase',
    listPrice: t.listPrice != null ? String(t.listPrice) : '',
    propertyType: profile?.propertyType ?? 'house',
    propertyContext: profile?.propertyContext ?? 'urban',
    isFinanced: profile?.isFinanced ?? false,
    hasWell: profile?.hasWell ?? false,
    hasSeptic: profile?.hasSeptic ?? false,
    closingDate: t.closingDate?.split('T')[0] ?? '',
    offerExpiryDate: t.offerExpiryDate?.split('T')[0] ?? '',
    inspectionDeadline: t.inspectionDeadline?.split('T')[0] ?? '',
    financingDeadline: t.financingDeadline?.split('T')[0] ?? '',
  }
}

function getEmptyForm(autoConditions: boolean): FormData {
  return {
    clientId: 0,
    clientRole: '',
    autoConditionsEnabled: autoConditions,
    address: '',
    city: '',
    postalCode: '',
    province: 'Nouveau-Brunswick',
    type: 'purchase',
    listPrice: '',
    propertyType: 'house',
    propertyContext: 'urban',
    isFinanced: true,
    hasWell: false,
    hasSeptic: false,
    closingDate: '',
    offerExpiryDate: '',
    inspectionDeadline: '',
    financingDeadline: '',
  }
}

const NB_CITIES = [
  'Alma', 'Atholville', 'Baker Brook', 'Bathurst', 'Beresford', 'Bertrand',
  'Blackville', 'Bouctouche', 'Campbellton', 'Cap-Pelé', 'Caraquet', 'Chipman',
  'Clair', 'Cocagne', 'Dalhousie', 'Dieppe', 'Doaktown', 'Drummond',
  'Edmundston', 'Florenceville-Bristol', 'Fredericton', 'Grand Bay-Westfield',
  'Grand Falls', 'Grande-Anse', 'Hampton', 'Hartland', 'Hillsborough',
  'Kedgwick', 'Lamèque', 'McAdam', 'Memramcook', 'Miramichi', 'Moncton',
  'Neguac', 'Nigadoo', 'Norton', 'Oromocto', 'Paquetville', 'Perth-Andover',
  'Petit-Rocher', 'Petitcodiac', 'Plaster Rock', 'Quispamsis', 'Rexton',
  'Richibucto', 'Riverview', 'Rogersville', 'Rothesay', 'Sackville',
  'Saint Andrews', 'Saint John', 'Saint-François-de-Madawaska', 'Saint-Léonard',
  'Saint-Louis de Kent', 'Saint-Quentin', 'Salisbury', 'Shediac', 'Shippagan',
  'St. Stephen', 'Sussex', 'Tide Head', 'Tracadie', 'Woodstock',
]

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
    { key: 'propertyType', label: t('editTransaction.fields.propertyType', 'Type de bien') },
    { key: 'propertyContext', label: t('editTransaction.fields.propertyContext', 'Contexte') },
    { key: 'closingDate', label: t('editTransaction.fields.closingDate', 'Date de closing') },
    { key: 'offerExpiryDate', label: t('editTransaction.fields.offerExpiry', 'Expiration offre') },
    { key: 'inspectionDeadline', label: t('editTransaction.fields.inspection', 'Date limite inspection') },
    { key: 'financingDeadline', label: t('editTransaction.fields.financing', 'Date limite financement') },
  ]
  for (const f of fields) {
    const o = String(original[f.key] ?? '')
    const c = String(current[f.key] ?? '')
    if (o !== c) {
      changes.push({ field: f.key, label: f.label, oldValue: o || '—', newValue: c || '—' })
    }
  }
  // Boolean fields
  const boolFields: { key: keyof FormData; label: string }[] = [
    { key: 'isFinanced', label: t('editTransaction.fields.isFinanced', 'Financé') },
    { key: 'hasWell', label: t('editTransaction.fields.hasWell', 'Puits privé') },
    { key: 'hasSeptic', label: t('editTransaction.fields.hasSeptic', 'Fosse septique') },
  ]
  for (const f of boolFields) {
    if (original[f.key] !== current[f.key]) {
      changes.push({ field: f.key, label: f.label, oldValue: original[f.key] ? 'Oui' : 'Non', newValue: current[f.key] ? 'Oui' : 'Non' })
    }
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
  const isCreateMode = !id
  const transactionId = Number(id)

  // Read user preferences for create mode defaults
  const userDefaults = useMemo(() => {
    const cached = queryClient.getQueryData<ApiResponse<{ user: User }>>(['auth', 'me'])
    const user = cached?.data?.user
    return { autoConditions: user?.preferAutoConditions ?? true }
  }, [queryClient])

  const [activeTab, setActiveTab] = useState<TabKey>('property')
  const [form, setForm] = useState<FormData | null>(isCreateMode ? getEmptyForm(userDefaults.autoConditions) : null)
  const [original, setOriginal] = useState<OriginalData | null>(isCreateMode ? getEmptyForm(userDefaults.autoConditions) : null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [confirmChecked, setConfirmChecked] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [savedChanges, setSavedChanges] = useState<FieldChange[]>([])
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [createdTxId, setCreatedTxId] = useState<number | null>(null)
  const [showCreateClient, setShowCreateClient] = useState(false)

  // Edit mode: load transaction
  const { data, isLoading, error } = useQuery({
    queryKey: ['transaction', transactionId],
    queryFn: () => transactionsApi.get(transactionId),
    enabled: !isCreateMode,
  })

  const transaction = data?.data?.transaction

  const { data: profileData } = useQuery({
    queryKey: ['transaction-profile', transactionId],
    queryFn: () => transactionsApi.getProfile(transactionId),
    enabled: !isCreateMode && !!transaction,
  })

  const profile = profileData?.data?.profile

  // Create mode: load clients + workflow templates
  const { data: clientsData } = useQuery({
    queryKey: ['clients'],
    queryFn: clientsApi.list,
    enabled: isCreateMode,
  })
  const clients = clientsData?.data?.clients ?? []

  const { data: templatesData } = useQuery({
    queryKey: ['workflow-templates', form?.type ?? 'purchase'],
    queryFn: () => workflowTemplatesApi.list({ type: (form?.type ?? 'purchase') as 'purchase' | 'sale' }),
    enabled: isCreateMode,
  })
  const templates = templatesData?.data?.templates ?? []

  // Auto-select default template
  const selectedTemplateId = useMemo(() => {
    if (!isCreateMode || templates.length === 0) return null
    const def = templates.find((tmpl: WorkflowTemplate) => tmpl.isDefault)
    return def ? def.id : templates[0].id
  }, [isCreateMode, templates])

  useEffect(() => {
    if (!isCreateMode && transaction && !form) {
      const initial = getInitialForm(transaction, profile)
      setForm(initial)
      setOriginal({ ...initial })
    }
  }, [isCreateMode, transaction, profile, form])

  const updateField = useCallback(<K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm((prev) => prev ? { ...prev, [key]: value } : prev)
    setValidationErrors((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }, [])

  const changes = useMemo(() => {
    if (isCreateMode || !form || !original) return []
    return computeChanges(original, form, t)
  }, [isCreateMode, form, original, t])

  const isLocked = !isCreateMode && transaction?.status === 'archived'

  // Edit mode: update mutation
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

  // Create mode: create mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateTransactionRequest) => transactionsApi.create(data),
    onSuccess: (response) => {
      if (response.success && response.data?.transaction) {
        queryClient.invalidateQueries({ queryKey: ['transactions'] })
        queryClient.invalidateQueries({ queryKey: ['dashboard'] })
        const txId = response.data.transaction.id
        setCreatedTxId(txId)
        setShowSuccess(true)
        toast({ title: t('common.success'), description: t('transaction.new'), variant: 'success' })
      }
    },
    onError: (err: Error) => {
      toast({ title: t('common.error'), description: err.message, variant: 'destructive' })
    },
  })

  const isSaving = updateMutation.isPending || createMutation.isPending

  const handleSave = () => {
    if (!form) return
    if (isCreateMode) {
      // Validate required fields
      const errors: Record<string, string> = {}
      if (!form.clientId) errors.clientId = t('editTransaction.errors.clientRequired', 'Client requis')
      if (!form.clientRole) errors.clientRole = t('editTransaction.errors.clientRoleRequired', 'Rôle du client requis')
      if (!form.address.trim()) errors.address = t('editTransaction.errors.addressRequired', 'Adresse requise')
      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors)
        return
      }
      setShowConfirm(true)
      setConfirmChecked(false)
    } else {
      if (changes.length === 0) return
      setShowConfirm(true)
      setConfirmChecked(false)
    }
  }

  const handleConfirmSave = async () => {
    if (!form || !confirmChecked) return

    if (isCreateMode) {
      if (!selectedTemplateId) return
      const price = parseInt(form.listPrice.replace(/\s/g, ''), 10)
      const payload: CreateTransactionRequest = {
        clientId: form.clientId,
        type: form.type as 'purchase' | 'sale',
        workflowTemplateId: selectedTemplateId,
        autoConditionsEnabled: form.autoConditionsEnabled,
        clientRole: form.clientRole || undefined,
        address: form.address.trim() || undefined,
        closingDate: form.closingDate || undefined,
        salePrice: !isNaN(price) ? price : undefined,
        profile: {
          propertyType: form.propertyType as PropertyType,
          propertyContext: form.propertyContext as PropertyContext,
          isFinanced: form.isFinanced,
        },
      }
      createMutation.mutate(payload)
    } else {
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

      const profileChanged = form.propertyType !== original?.propertyType ||
        form.propertyContext !== original?.propertyContext ||
        form.isFinanced !== original?.isFinanced ||
        form.hasWell !== original?.hasWell ||
        form.hasSeptic !== original?.hasSeptic
      if (profileChanged) {
        await transactionsApi.upsertProfile(transactionId, {
          propertyType: form.propertyType as 'house' | 'condo' | 'land',
          propertyContext: form.propertyContext as 'urban' | 'suburban' | 'rural',
          isFinanced: form.isFinanced,
          hasWell: form.hasWell,
          hasSeptic: form.hasSeptic,
        })
        queryClient.invalidateQueries({ queryKey: ['transaction-profile', transactionId] })
      }

      updateMutation.mutate(payload)
    }
  }

  // Loading (edit mode only)
  if (!isCreateMode && isLoading) {
    return (
      <div className="flex justify-center items-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-[#1e3a5f]" />
      </div>
    )
  }

  if (!isCreateMode && (error || !transaction || !form || !original)) {
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

  // Guard for create mode form
  if (!form || !original) return null

  // State C: Success
  if (showSuccess) {
    const navId = isCreateMode ? createdTxId : transactionId
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="flex items-center gap-1.5 text-xs text-stone-400 py-4">
          <a href="/transactions" className="hover:text-stone-600">{t('editTransaction.breadcrumb.transactions', 'Transactions')}</a>
          <ChevronRight className="w-3 h-3" />
          <span className="text-stone-600">{isCreateMode ? t('editTransaction.breadcrumb.new', 'Nouvelle') : t('editTransaction.breadcrumb.edit', 'Éditer')}</span>
        </div>
        <div className="max-w-lg mx-auto px-4 pt-8 sm:pt-12">
          <div className="bg-white rounded-2xl border border-stone-200 p-6 text-center shadow-sm">
            <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <Check className="w-7 h-7 text-emerald-600" />
            </div>
            <h2 className="text-lg font-bold text-stone-900">
              {isCreateMode
                ? t('editTransaction.createSuccess.title', 'Transaction créée')
                : t('editTransaction.success.title', 'Modifications enregistrées')}
            </h2>
            <p className="text-sm text-stone-500 mb-5">
              {isCreateMode
                ? t('editTransaction.createSuccess.desc', 'Votre nouvelle transaction a été créée avec succès.')
                : t('editTransaction.success.desc', '{{count}} champ(s) mis à jour avec succès', { count: savedChanges.length })}
            </p>
            {!isCreateMode && savedChanges.length > 0 && (
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
            )}
            <button
              onClick={() => navigate(navId ? `/transactions/${navId}` : '/transactions')}
              className="w-full px-4 py-2.5 text-sm font-medium text-white bg-[#1e3a5f] hover:bg-[#1e3a5f]/90 rounded-lg shadow-sm flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              {isCreateMode
                ? t('editTransaction.createSuccess.back', 'Voir la transaction')
                : t('editTransaction.success.back', 'Retour à la transaction')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  const clientName = transaction?.client ? `${transaction.client.firstName} ${transaction.client.lastName}` : ''
  const propertyLabel = transaction?.property ? `${transaction.property.address}, ${transaction.property.city}` : ''
  const statusBadge = !isCreateMode && transaction
    ? transaction.status === 'active'
      ? { classes: 'bg-emerald-100 text-emerald-700', label: t('editTransaction.status.active', 'Active') }
      : transaction.status === 'archived'
        ? { classes: 'bg-stone-200 text-stone-600', label: t('editTransaction.status.archived', 'Archivée') }
        : { classes: 'bg-red-100 text-red-600', label: t('editTransaction.status.cancelled', 'Annulée') }
    : null

  const tabs: { key: TabKey; label: string; icon: typeof Home; badge?: number }[] = [
    { key: 'property', label: t('editTransaction.tabs.property', 'Bien'), icon: Home },
    { key: 'parties', label: t('editTransaction.tabs.parties', 'Parties'), icon: Users },
    { key: 'dates', label: t('editTransaction.tabs.dates', 'Dates'), icon: Calendar },
  ]

  const hasErrors = Object.keys(validationErrors).length > 0
  const canSave = isCreateMode ? form.clientId > 0 : changes.length > 0

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 sm:pb-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-stone-400 py-4">
        <a href="/transactions" className="hover:text-stone-600">{t('editTransaction.breadcrumb.transactions', 'Transactions')}</a>
        <ChevronRight className="w-3 h-3" />
        {!isCreateMode && transaction && (
          <>
            <a href={`/transactions/${transaction.id}`} className="hover:text-stone-600">{clientName}</a>
            <ChevronRight className="w-3 h-3" />
          </>
        )}
        <span className="text-stone-600">
          {isCreateMode ? t('editTransaction.breadcrumb.new', 'Nouvelle') : t('editTransaction.breadcrumb.edit', 'Éditer')}
        </span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg ${isLocked ? 'bg-stone-200' : isCreateMode ? 'bg-emerald-100' : 'bg-[#1e3a5f]/10'} flex items-center justify-center shrink-0`}>
            {isLocked ? <Lock className="w-4.5 h-4.5 text-stone-400" /> : isCreateMode ? <Plus className="w-4.5 h-4.5 text-emerald-600" /> : <Pencil className="w-4.5 h-4.5 text-[#1e3a5f]" />}
          </div>
          <div>
            <h1 className="text-lg font-bold text-stone-900 flex items-center gap-2">
              {isCreateMode
                ? t('editTransaction.createTitle', 'Nouvelle transaction')
                : t('editTransaction.title', 'Éditer la transaction')}
              {statusBadge && (
                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${statusBadge.classes}`}>
                  {statusBadge.label}
                </span>
              )}
            </h1>
            {!isCreateMode && (
              <p className="text-xs text-stone-500 mt-0.5 hidden sm:block">
                {clientName} · {propertyLabel}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => isCreateMode ? navigate('/transactions') : navigate(`/transactions/${transactionId}`)}
            className="px-2.5 sm:px-3 py-2 text-xs font-medium text-stone-600 bg-white border border-stone-300 rounded-lg hover:bg-stone-50"
          >
            {t('common.cancel')}
          </button>
          {!isLocked && (
            <button
              onClick={handleSave}
              disabled={!canSave || isSaving}
              className={[
                'px-4 py-2 text-xs font-medium text-white rounded-lg shadow-sm flex items-center gap-1.5',
                canSave && !isSaving
                  ? 'bg-[#1e3a5f] hover:bg-[#1e3a5f]/90'
                  : 'bg-stone-300 cursor-not-allowed',
              ].join(' ')}
            >
              {isCreateMode ? <Plus className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
              {isCreateMode ? t('editTransaction.create', 'Créer') : t('editTransaction.save', 'Enregistrer')}
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
              <PropertyTab
                form={form} original={original} updateField={updateField}
                validationErrors={validationErrors} t={t} isLocked={isLocked}
                isCreateMode={isCreateMode} clients={clients}
                onCreateClient={isCreateMode ? () => setShowCreateClient(true) : undefined}
              />
            )}
            {activeTab === 'parties' && (
              isCreateMode
                ? <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 flex items-center gap-2">
                    <Info className="w-4 h-4 text-blue-500 shrink-0" />
                    <p className="text-xs text-blue-700">
                      {t('editTransaction.parties.createHint', 'Vous pourrez gérer les parties (vendeur, avocat, courtier) depuis la page de la transaction après la création.')}
                    </p>
                  </div>
                : <PartiesTab transaction={transaction!} t={t} isLocked={isLocked} />
            )}
            {activeTab === 'dates' && (
              <DatesTab form={form} original={original} updateField={updateField} validationErrors={validationErrors} t={t} isLocked={isLocked} />
            )}
          </div>
        </div>

        {/* Sidebar — desktop only */}
        <div className="hidden lg:block w-72 shrink-0">
          {isCreateMode ? (
            <CreateSidebar form={form} updateField={updateField} t={t} />
          ) : (
            <ChangesSidebar changes={changes} t={t} />
          )}
        </div>
      </div>

      {/* Mobile change bar (edit mode) */}
      {!isCreateMode && changes.length > 0 && (
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
                <div className={`w-9 h-9 rounded-full ${isCreateMode ? 'bg-emerald-100' : 'bg-amber-100'} flex items-center justify-center`}>
                  {isCreateMode ? <Plus className="w-4.5 h-4.5 text-emerald-600" /> : <AlertCircle className="w-4.5 h-4.5 text-amber-600" />}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-stone-900">
                    {isCreateMode
                      ? t('editTransaction.confirmCreate.title', 'Créer la transaction')
                      : t('editTransaction.confirm.title', 'Confirmer les modifications')}
                  </h3>
                  <p className="text-xs text-stone-500">
                    {isCreateMode
                      ? t('editTransaction.confirmCreate.subtitle', 'Vérifiez les informations avant de créer')
                      : t('editTransaction.confirm.subtitle', 'Vérifiez les changements avant d\'enregistrer')}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {isCreateMode ? (
                <div className="rounded-lg border border-stone-200 p-3 space-y-2">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-stone-500 w-20">{t('transaction.client', 'Client')}</span>
                    <span className="text-stone-800 font-medium">{clients.find(c => c.id === form.clientId)?.firstName} {clients.find(c => c.id === form.clientId)?.lastName}</span>
                  </div>
                  {form.address && (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-stone-500 w-20">{t('editTransaction.fields.address', 'Adresse')}</span>
                      <span className="text-stone-800 font-medium">{form.address}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-stone-500 w-20">{t('editTransaction.fields.type', 'Type')}</span>
                    <span className="text-stone-800 font-medium">{form.type === 'purchase' ? t('editTransaction.type.purchase', 'Achat') : t('editTransaction.type.sale', 'Vente')}</span>
                  </div>
                  {form.clientRole && (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-stone-500 w-20">{t('editTransaction.fields.clientRole', 'Rôle')}</span>
                      <span className="text-stone-800 font-medium">{form.clientRole === 'buyer' ? t('editTransaction.clientRole.buyer', 'Acheteur') : t('editTransaction.clientRole.seller', 'Vendeur')}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-stone-500 w-20">{t('editTransaction.fields.propertyType', 'Bien')}</span>
                    <span className="text-stone-800 font-medium">{form.propertyType} · {form.propertyContext}</span>
                  </div>
                  {form.autoConditionsEnabled && (
                    <div className="text-xs text-emerald-700 font-medium mt-1">
                      {t('editTransaction.autoConditions.enabled', 'Conditions automatiques activées')}
                    </div>
                  )}
                </div>
              ) : (
                <>
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
                </>
              )}
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmChecked}
                  onChange={(e) => setConfirmChecked(e.target.checked)}
                  className="rounded border-stone-300 text-[#1e3a5f] focus:ring-[#1e3a5f]/30 mt-0.5"
                />
                <span className="text-xs text-stone-600">
                  {isCreateMode
                    ? t('editTransaction.confirmCreate.checkbox', 'Je confirme que ces informations sont exactes')
                    : t('editTransaction.confirm.checkbox', 'Je confirme que ces modifications sont exactes et souhaite les enregistrer')}
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
                disabled={!confirmChecked || isSaving}
                className={[
                  'px-4 py-2 text-xs font-medium text-white rounded-lg shadow-sm flex items-center gap-1.5',
                  confirmChecked && !isSaving
                    ? 'bg-[#1e3a5f] hover:bg-[#1e3a5f]/90'
                    : 'bg-stone-300 cursor-not-allowed',
                ].join(' ')}
              >
                {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {isCreateMode
                  ? t('editTransaction.confirmCreate.submit', 'Créer la transaction')
                  : t('editTransaction.confirm.save', 'Enregistrer les modifications')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Client Modal (inline from transaction) */}
      <CreateClientModal
        isOpen={showCreateClient}
        onClose={() => setShowCreateClient(false)}
        onCreated={(client) => {
          if (form) {
            updateField('clientId', client.id)
          }
        }}
      />
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

/* ─── Create Sidebar (C6: autoConditionsEnabled toggle) ─── */

function CreateSidebar({ form, updateField, t }: {
  form: FormData; updateField: <K extends keyof FormData>(k: K, v: FormData[K]) => void
  t: (k: string, f?: string) => string
}) {
  return (
    <div className="sticky top-28 space-y-4">
      <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
            <Plus className="w-3 h-3 text-emerald-600" />
          </div>
          <span className="text-xs font-semibold text-stone-700 flex-1">
            {t('editTransaction.sidebar.createTitle', 'Nouvelle transaction')}
          </span>
        </div>
        <p className="text-[10px] text-stone-400 mb-4">
          {t('editTransaction.sidebar.createDesc', 'Remplissez les onglets puis cliquez sur Créer.')}
        </p>

        {/* C6: Auto-conditions toggle */}
        <div className="border-t border-stone-100 pt-3">
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={form.autoConditionsEnabled}
              onChange={(e) => updateField('autoConditionsEnabled', e.target.checked)}
              className="rounded border-stone-300 text-[#1e3a5f] focus:ring-[#1e3a5f]/30 mt-0.5"
            />
            <div>
              <span className="text-xs font-medium text-stone-700">
                {t('editTransaction.autoConditions.label', 'Conditions automatiques')}
              </span>
              <p className="text-[10px] text-stone-400 mt-0.5">
                {t('editTransaction.autoConditions.hint', 'Générer les conditions selon le profil de propriété ci-dessus')}
              </p>
            </div>
          </label>
        </div>
      </div>
    </div>
  )
}

/* ─── Property Tab ─── */

function ClientCombobox({ clients, value, onChange, onCreateClient, placeholder, error }: {
  clients: { id: number; firstName: string; lastName: string }[]
  value: number
  onChange: (id: number) => void
  onCreateClient?: () => void
  placeholder: string
  error?: boolean
}) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const selected = clients.find((c) => c.id === value)
  const filtered = search
    ? clients.filter((c) => `${c.firstName} ${c.lastName}`.toLowerCase().includes(search.toLowerCase()))
    : clients

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="flex gap-2">
      <div ref={ref} className="relative flex-1">
        <input
          type="text"
          value={open ? search : (selected ? `${selected.firstName} ${selected.lastName}` : '')}
          onChange={(e) => { setSearch(e.target.value); if (!open) setOpen(true) }}
          onFocus={() => { setOpen(true); setSearch('') }}
          placeholder={placeholder}
          className={fieldClasses(false, !!error)}
          autoComplete="off"
        />
        {open && (
          <div className="absolute z-20 left-0 right-0 top-full mt-1 bg-white border border-stone-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-3 py-2 text-xs text-stone-400">Aucun client trouvé</div>
            ) : (
              filtered.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-stone-50 transition-colors ${c.id === value ? 'bg-primary/5 text-primary font-medium' : 'text-stone-700'}`}
                  onClick={() => { onChange(c.id); setOpen(false); setSearch('') }}
                >
                  {c.firstName} {c.lastName}
                </button>
              ))
            )}
          </div>
        )}
      </div>
      {onCreateClient && (
        <button
          type="button"
          onClick={onCreateClient}
          className="px-3 py-2 rounded-md border border-stone-300 bg-white text-stone-600 hover:bg-stone-50 hover:text-primary transition-colors text-sm font-medium"
          title="Nouveau client"
        >
          +
        </button>
      )}
    </div>
  )
}

function PropertyTab({ form, original, updateField, validationErrors, t, isLocked, isCreateMode, clients, onCreateClient }: {
  form: FormData; original: OriginalData; updateField: <K extends keyof FormData>(k: K, v: FormData[K]) => void
  validationErrors: Record<string, string>; t: (k: string, f?: string) => string; isLocked: boolean
  isCreateMode?: boolean; clients?: { id: number; firstName: string; lastName: string; clientType?: string | null }[]
  onCreateClient?: () => void
}) {
  // C3b: Pre-select clientRole from client's clientType when client changes
  const selectedClient = clients?.find((c) => c.id === form.clientId)
  useEffect(() => {
    if (!isCreateMode || !selectedClient) return
    const ct = selectedClient.clientType
    if (ct === 'buyer' || ct === 'seller') {
      updateField('clientRole', ct)
    } else {
      // 'both' or null — always clear so user must choose
      updateField('clientRole', '')
    }
  }, [form.clientId, isCreateMode, selectedClient, updateField])
  return (
    <div className={`bg-white rounded-xl border ${Object.keys(validationErrors).some(k => ['address','city','postalCode','clientId'].includes(k)) ? 'border-red-200' : 'border-stone-200'} p-5`}>
      {/* Create mode: Client select */}
      {isCreateMode && (
        <div className="mb-5 pb-5 border-b border-stone-200">
          <FieldLabel label={t('transaction.client', 'Client')} required error={!!validationErrors.clientId} />
          <ClientCombobox
            clients={clients ?? []}
            value={form.clientId}
            onChange={(id) => updateField('clientId', id)}
            onCreateClient={onCreateClient}
            placeholder={t('editTransaction.fields.selectClient', 'Rechercher un client...')}
            error={!!validationErrors.clientId}
          />
          {validationErrors.clientId && <p className="text-[10px] text-red-600 mt-1">{validationErrors.clientId}</p>}

          {/* C3b: Client role radio */}
          {form.clientId > 0 && (
            <div className="mt-3">
              <FieldLabel label={t('editTransaction.fields.clientRole', 'Rôle du client dans cette transaction')} required error={!!validationErrors.clientRole} />
              <div className="flex gap-3">
                <label className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 cursor-pointer transition-all ${form.clientRole === 'buyer' ? 'border-[#1e3a5f] bg-[#1e3a5f]/5' : 'border-stone-200 hover:border-stone-300'}`}>
                  <input
                    type="radio"
                    name="clientRole"
                    value="buyer"
                    checked={form.clientRole === 'buyer'}
                    onChange={() => updateField('clientRole', 'buyer')}
                    className="text-[#1e3a5f] focus:ring-[#1e3a5f]/30"
                  />
                  <span className={`text-sm font-medium ${form.clientRole === 'buyer' ? 'text-[#1e3a5f]' : 'text-stone-600'}`}>
                    {t('editTransaction.clientRole.buyer', 'Acheteur')}
                  </span>
                </label>
                <label className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 cursor-pointer transition-all ${form.clientRole === 'seller' ? 'border-[#1e3a5f] bg-[#1e3a5f]/5' : 'border-stone-200 hover:border-stone-300'}`}>
                  <input
                    type="radio"
                    name="clientRole"
                    value="seller"
                    checked={form.clientRole === 'seller'}
                    onChange={() => updateField('clientRole', 'seller')}
                    className="text-[#1e3a5f] focus:ring-[#1e3a5f]/30"
                  />
                  <span className={`text-sm font-medium ${form.clientRole === 'seller' ? 'text-[#1e3a5f]' : 'text-stone-600'}`}>
                    {t('editTransaction.clientRole.seller', 'Vendeur')}
                  </span>
                </label>
              </div>
              {validationErrors.clientRole && <p className="text-[10px] text-red-600 mt-1">{validationErrors.clientRole}</p>}
            </div>
          )}
        </div>
      )}

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
        {/* City — NB dropdown */}
        <div>
          <FieldLabel label={t('editTransaction.fields.city', 'Ville')} />
          <select value={form.city} onChange={(e) => updateField('city', e.target.value)} className={fieldClasses(form.city !== original.city, !!validationErrors.city)} disabled={isLocked}>
            <option value="">{t('editTransaction.fields.cityPlaceholder', 'Sélectionner une ville')}</option>
            {NB_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
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
          <select value={form.province} onChange={(e) => updateField('province', e.target.value)} className={fieldClasses(form.province !== original.province, false)} disabled>
            <option value="Nouveau-Brunswick">Nouveau-Brunswick</option>
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

      {/* Profile propriété */}
      <h3 className="text-sm font-semibold text-stone-900 mt-6 mb-4">
        {t('editTransaction.profile.title', 'Profil de la propriété')}
      </h3>

      {/* Property Type — icon cards */}
      <FieldLabel label={t('editTransaction.fields.propertyType', 'Type de bien')} required modified={form.propertyType !== original.propertyType} />
      <div className="grid grid-cols-3 gap-2 mb-4">
        <ProfileCard
          icon={Home}
          label={t('editTransaction.propertyType.house', 'Maison')}
          selected={form.propertyType === 'house'}
          modified={form.propertyType !== original.propertyType && form.propertyType === 'house'}
          onClick={() => !isLocked && updateField('propertyType', 'house')}
          disabled={isLocked}
        />
        <ProfileCard
          icon={Building2}
          label={t('editTransaction.propertyType.condo', 'Condo')}
          selected={form.propertyType === 'condo'}
          modified={form.propertyType !== original.propertyType && form.propertyType === 'condo'}
          onClick={() => !isLocked && updateField('propertyType', 'condo')}
          disabled={isLocked}
        />
        <ProfileCard
          icon={TreePine}
          label={t('editTransaction.propertyType.land', 'Terrain')}
          selected={form.propertyType === 'land'}
          modified={form.propertyType !== original.propertyType && form.propertyType === 'land'}
          onClick={() => !isLocked && updateField('propertyType', 'land')}
          disabled={isLocked}
        />
      </div>
      <ChangeNote original={original.propertyType} current={form.propertyType} />

      {/* Property Context — icon cards */}
      <FieldLabel label={t('editTransaction.fields.propertyContext', 'Contexte')} required modified={form.propertyContext !== original.propertyContext} />
      <div className="grid grid-cols-3 gap-2 mb-4">
        <ProfileCard
          icon={Building}
          label={t('editTransaction.propertyContext.urban', 'Urbain')}
          selected={form.propertyContext === 'urban'}
          modified={form.propertyContext !== original.propertyContext && form.propertyContext === 'urban'}
          onClick={() => !isLocked && updateField('propertyContext', 'urban')}
          disabled={isLocked}
        />
        <ProfileCard
          icon={Home}
          label={t('editTransaction.propertyContext.suburban', 'Banlieue')}
          selected={form.propertyContext === 'suburban'}
          modified={form.propertyContext !== original.propertyContext && form.propertyContext === 'suburban'}
          onClick={() => !isLocked && updateField('propertyContext', 'suburban')}
          disabled={isLocked}
        />
        <ProfileCard
          icon={Mountain}
          label={t('editTransaction.propertyContext.rural', 'Rural')}
          selected={form.propertyContext === 'rural'}
          modified={form.propertyContext !== original.propertyContext && form.propertyContext === 'rural'}
          onClick={() => !isLocked && updateField('propertyContext', 'rural')}
          disabled={isLocked}
        />
      </div>
      <ChangeNote original={original.propertyContext} current={form.propertyContext} />

      {/* Boolean toggles */}
      <div className="flex flex-wrap gap-4 mt-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.isFinanced} onChange={(e) => updateField('isFinanced', e.target.checked)} className="rounded border-stone-300 text-[#1e3a5f] focus:ring-[#1e3a5f]/30" disabled={isLocked} />
          <span className="text-sm text-stone-700">{t('editTransaction.fields.isFinanced', 'Financé')}</span>
        </label>
        {form.propertyContext === 'rural' && (
          <>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.hasWell} onChange={(e) => updateField('hasWell', e.target.checked)} className="rounded border-stone-300 text-[#1e3a5f] focus:ring-[#1e3a5f]/30" disabled={isLocked} />
              <span className="text-sm text-stone-700">{t('editTransaction.fields.hasWell', 'Puits privé')}</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.hasSeptic} onChange={(e) => updateField('hasSeptic', e.target.checked)} className="rounded border-stone-300 text-[#1e3a5f] focus:ring-[#1e3a5f]/30" disabled={isLocked} />
              <span className="text-sm text-stone-700">{t('editTransaction.fields.hasSeptic', 'Fosse septique')}</span>
            </label>
          </>
        )}
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

/* ─── Profile Card (icon-based selector) ─── */

function ProfileCard({ icon: Icon, label, selected, modified, onClick, disabled }: {
  icon: typeof Home; label: string; selected: boolean; modified: boolean
  onClick: () => void; disabled: boolean
}) {
  const base = 'flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all cursor-pointer text-center'
  const selectedClass = selected
    ? modified
      ? 'border-amber-400 bg-[#fffbeb] shadow-sm'
      : 'border-[#1e3a5f] bg-[#1e3a5f]/5 shadow-sm'
    : 'border-stone-200 bg-white hover:border-stone-300'
  const disabledClass = disabled ? 'opacity-60 pointer-events-none' : ''
  const iconColor = selected
    ? modified ? 'text-amber-600' : 'text-[#1e3a5f]'
    : 'text-stone-400'
  const labelColor = selected
    ? modified ? 'text-amber-700' : 'text-[#1e3a5f]'
    : 'text-stone-500'

  return (
    <button type="button" onClick={onClick} className={`${base} ${selectedClass} ${disabledClass}`}>
      <Icon className={`w-5 h-5 ${iconColor}`} />
      <span className={`text-xs font-medium ${labelColor}`}>{label}</span>
    </button>
  )
}

/* ─── Dates Tab ─── */

function DatesTab({ form, original, updateField, validationErrors, t, isLocked }: {
  form: FormData; original: OriginalData; updateField: <K extends keyof FormData>(k: K, v: FormData[K]) => void
  validationErrors: Record<string, string>; t: (k: string, f?: string) => string; isLocked: boolean
}) {
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
    </div>
  )
}

