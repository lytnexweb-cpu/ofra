import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Users,
  X,
  Plus,
  Pencil,
  Trash2,
  Check,
  ChevronLeft,
  AlertTriangle,
  Info,
  Phone,
} from 'lucide-react'
import { partiesApi, type TransactionParty, type PartyRole, type CreatePartyRequest, type UpdatePartyRequest } from '../../api/parties.api'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '../ui/Dialog'
import ConfirmDialog from '../ConfirmDialog'

interface PartiesModalProps {
  isOpen: boolean
  onClose: () => void
  transactionId: number
}

const ROLES: PartyRole[] = ['buyer', 'seller', 'lawyer', 'notary', 'broker', 'agent', 'other']

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

const ROLE_COLORS: Record<PartyRole, { bg: string; text: string }> = {
  buyer: { bg: 'bg-blue-100', text: 'text-blue-700' },
  seller: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  lawyer: { bg: 'bg-stone-100', text: 'text-stone-600' },
  notary: { bg: 'bg-purple-100', text: 'text-purple-700' },
  broker: { bg: 'bg-amber-100', text: 'text-amber-700' },
  agent: { bg: 'bg-indigo-100', text: 'text-indigo-700' },
  other: { bg: 'bg-stone-100', text: 'text-stone-600' },
}

const AVATAR_COLORS: Record<PartyRole, { bg: string; text: string }> = {
  buyer: { bg: 'bg-blue-100', text: 'text-blue-700' },
  seller: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  lawyer: { bg: 'bg-amber-100', text: 'text-amber-700' },
  notary: { bg: 'bg-purple-100', text: 'text-purple-700' },
  broker: { bg: 'bg-orange-100', text: 'text-orange-700' },
  agent: { bg: 'bg-indigo-100', text: 'text-indigo-700' },
  other: { bg: 'bg-stone-100', text: 'text-stone-600' },
}

export default function PartiesModal({ isOpen, onClose, transactionId }: PartiesModalProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const [view, setView] = useState<'list' | 'add' | 'edit'>('list')
  const [editingParty, setEditingParty] = useState<TransactionParty | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; party: TransactionParty | null }>({
    isOpen: false,
    party: null,
  })

  // Form state
  const [form, setForm] = useState<{
    role: PartyRole | ''
    fullName: string
    email: string
    phone: string
    isPrimary: boolean
  }>({
    role: '',
    fullName: '',
    email: '',
    phone: '',
    isPrimary: false,
  })

  // Reset view when modal opens
  useEffect(() => {
    if (isOpen) {
      setView('list')
      setEditingParty(null)
      resetForm()
    }
  }, [isOpen])

  const resetForm = () => {
    setForm({ role: '', fullName: '', email: '', phone: '', isPrimary: false })
  }

  const { data: partiesData, isLoading } = useQuery({
    queryKey: ['parties', transactionId],
    queryFn: () => partiesApi.list(transactionId),
    enabled: isOpen,
  })
  const parties: TransactionParty[] = partiesData?.data?.parties ?? (partiesData as any)?.parties ?? []

  const invalidateParties = () =>
    queryClient.invalidateQueries({ queryKey: ['parties', transactionId] })

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: CreatePartyRequest) => partiesApi.create(transactionId, data),
    onSuccess: async () => {
      await invalidateParties()
      setView('list')
      resetForm()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdatePartyRequest }) =>
      partiesApi.update(id, data),
    onSuccess: async () => {
      await invalidateParties()
      setView('list')
      setEditingParty(null)
      resetForm()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => partiesApi.delete(id),
    onSuccess: async () => {
      await invalidateParties()
      setDeleteConfirm({ isOpen: false, party: null })
      if (editingParty) {
        setView('list')
        setEditingParty(null)
      }
    },
  })

  const isPending = createMutation.isPending || updateMutation.isPending

  const handleSubmitCreate = () => {
    if (!form.role || !form.fullName.trim()) return
    createMutation.mutate({
      role: form.role as PartyRole,
      fullName: form.fullName.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      isPrimary: form.isPrimary,
    })
  }

  const handleSubmitEdit = () => {
    if (!editingParty || !form.role || !form.fullName.trim()) return
    updateMutation.mutate({
      id: editingParty.id,
      data: {
        role: form.role as PartyRole,
        fullName: form.fullName.trim(),
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        isPrimary: form.isPrimary,
      },
    })
  }

  const openEdit = (party: TransactionParty) => {
    setEditingParty(party)
    setForm({
      role: party.role,
      fullName: party.fullName,
      email: party.email ?? '',
      phone: party.phone ?? '',
      isPrimary: party.isPrimary,
    })
    setView('edit')
  }

  const openAdd = () => {
    resetForm()
    setView('add')
  }

  const withEmail = parties.filter((p) => p.email)
  const withoutEmail = parties.filter((p) => !p.email)

  const isFormValid = form.role !== '' && form.fullName.trim().length > 0

  const roleLabel = (role: PartyRole) => t(`parties.role.${role}`)

  // ═══════════════════════════════════════
  // EDIT VIEW
  // ═══════════════════════════════════════
  if (view === 'edit' && editingParty) {
    const missingEmail = !form.email.trim()
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden" aria-describedby="parties-edit-desc">
          <DialogTitle className="sr-only">{t('parties.editTitle')}</DialogTitle>
          <DialogDescription id="parties-edit-desc" className="sr-only">{t('parties.editTitle')}</DialogDescription>

          {/* Header */}
          <div className="px-5 sm:px-6 pt-5 sm:pt-6 pb-4 border-b border-stone-100">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <button onClick={() => setView('list')} className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-stone-900" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
                    {t('parties.editTitle')}
                  </h2>
                  <p className="text-xs text-stone-500 mt-0.5">
                    {editingParty.fullName} — {roleLabel(editingParty.role)}
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 -mt-1 -mr-1">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Form */}
          <div className="px-5 sm:px-6 py-4 space-y-3 overflow-y-auto max-h-[60vh]">
            {renderFormFields(missingEmail)}
          </div>

          {/* Footer */}
          <div className="px-5 sm:px-6 py-4 bg-stone-50 border-t border-stone-100 flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2 sm:justify-between">
            <button
              onClick={() => setDeleteConfirm({ isOpen: true, party: editingParty })}
              className="px-4 py-2.5 rounded-lg text-red-500 hover:bg-red-50 text-sm font-medium text-center flex items-center justify-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
              {t('parties.deleteParty')}
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setView('list')}
                disabled={isPending}
                className="px-4 py-2.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-100 text-sm font-medium"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleSubmitEdit}
                disabled={!isFormValid || isPending}
                className="px-5 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-white text-sm font-semibold shadow-sm flex items-center gap-2 disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                {isPending ? '...' : t('parties.save')}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // ═══════════════════════════════════════
  // FORM FIELDS (shared between add inline and edit view)
  // ═══════════════════════════════════════
  function renderFormFields(highlightMissingEmail = false) {
    return (
      <>
        {/* Role */}
        <div>
          <label className="block text-xs font-semibold text-stone-600 mb-1 uppercase tracking-wide">
            {t('parties.roleLabel')} <span className="text-red-400">*</span>
          </label>
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value as PartyRole | '' })}
            className="w-full px-3 py-2.5 text-sm rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
          >
            <option value="">{t('parties.selectRole')}</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>{roleLabel(r)}</option>
            ))}
          </select>
        </div>

        {/* Full name */}
        <div>
          <label className="block text-xs font-semibold text-stone-600 mb-1 uppercase tracking-wide">
            {t('parties.fullNameLabel')} <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            placeholder={t('parties.fullNamePlaceholder')}
            className="w-full px-3 py-2.5 text-sm rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Email + Phone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1 uppercase tracking-wide flex items-center gap-1.5">
              Email
              {highlightMissingEmail && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-700">
                  {t('parties.missing')}
                </span>
              )}
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="email@exemple.com"
              className={`w-full px-3 py-2.5 text-sm rounded-lg border focus:outline-none focus:ring-2 ${
                highlightMissingEmail
                  ? 'border-amber-300 bg-amber-50/30 focus:ring-amber-200 placeholder:text-amber-400/60'
                  : 'border-stone-200 focus:ring-primary/20'
              }`}
            />
            {highlightMissingEmail && (
              <p className="text-[10px] text-amber-600 mt-1 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {t('parties.missingEmailWarning')}
              </p>
            )}
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1 uppercase tracking-wide">
              {t('parties.phoneLabel')}
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="514-555-0000"
              className="w-full px-3 py-2.5 text-sm rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        {/* Primary checkbox */}
        <label className="flex items-start gap-2.5 cursor-pointer mt-1">
          <input
            type="checkbox"
            checked={form.isPrimary}
            onChange={(e) => setForm({ ...form, isPrimary: e.target.checked })}
            className="mt-0.5 w-4 h-4 rounded border-stone-300 accent-primary"
          />
          <div>
            <span className="text-xs font-medium text-stone-700">{t('parties.primaryLabel')}</span>
            <p className="text-[10px] text-stone-400 mt-0.5">{t('parties.primaryDesc')}</p>
          </div>
        </label>
      </>
    )
  }

  // ═══════════════════════════════════════
  // LIST VIEW (default)
  // ═══════════════════════════════════════
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden" aria-describedby="parties-list-desc">
        <DialogTitle className="sr-only">{t('parties.title')}</DialogTitle>
        <DialogDescription id="parties-list-desc" className="sr-only">{t('parties.subtitle')}</DialogDescription>

        {/* Header */}
        <div className="px-5 sm:px-6 pt-5 sm:pt-6 pb-4 border-b border-stone-100">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-stone-900" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
                  {t('parties.title')}
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">{t('parties.subtitle')}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 -mt-1 -mr-1">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 sm:px-6 py-4 space-y-3 overflow-y-auto max-h-[60vh]">
          {isLoading && <p className="text-xs text-stone-400 text-center py-4">...</p>}

          {/* Party cards */}
          {parties.map((party) => {
            const avatarColor = AVATAR_COLORS[party.role]
            const roleColor = ROLE_COLORS[party.role]
            const hasMissingEmail = !party.email

            return (
              <div
                key={party.id}
                className={`rounded-lg border p-3 group transition-shadow hover:shadow-sm ${
                  hasMissingEmail ? 'border-amber-200 bg-amber-50/30' : 'border-stone-200 bg-white'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full ${avatarColor.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                    <span className={`text-xs font-bold ${avatarColor.text}`}>{getInitials(party.fullName)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-stone-900">{party.fullName}</span>
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${roleColor.bg} ${roleColor.text}`}>
                        {roleLabel(party.role)}
                      </span>
                      {party.isPrimary && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary">
                          {t('parties.primary')}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${party.email ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                      <span className={`text-xs ${party.email ? 'text-stone-600' : 'text-amber-600 italic'}`}>
                        {party.email ?? t('parties.missingEmail')}
                      </span>
                    </div>
                    {party.phone && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-stone-400" />
                        <span className="text-xs text-stone-500">{party.phone}</span>
                      </div>
                    )}
                    {hasMissingEmail && (
                      <div className="flex items-center gap-1 mt-1">
                        <AlertTriangle className="w-3 h-3 text-amber-500" />
                        <span className="text-[10px] text-amber-600 font-medium">{t('parties.missingEmailWarning')}</span>
                      </div>
                    )}
                  </div>
                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button
                      onClick={() => openEdit(party)}
                      className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-600"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm({ isOpen: true, party })}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-stone-400 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}

          {/* Add party button / inline form */}
          {view === 'list' && (
            <button
              onClick={openAdd}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border-2 border-dashed border-stone-200 text-stone-400 hover:border-primary/30 hover:text-primary hover:bg-primary/5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="text-xs font-medium">{t('parties.addParty')}</span>
            </button>
          )}

          {/* Inline add form */}
          {view === 'add' && (
            <div className="rounded-lg border border-primary/20 bg-primary/[0.02] p-4 space-y-3">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-xs font-semibold text-stone-700 uppercase tracking-wide">{t('parties.addParty')}</h3>
                <button onClick={() => setView('list')} className="p-1 rounded hover:bg-stone-100 text-stone-400">
                  <X className="w-4 h-4" />
                </button>
              </div>
              {renderFormFields()}
              <div className="flex items-center gap-2 pt-2 border-t border-stone-100">
                <button
                  onClick={() => setView('list')}
                  disabled={isPending}
                  className="px-4 py-2 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-100 text-xs font-medium"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleSubmitCreate}
                  disabled={!isFormValid || isPending}
                  className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white text-xs font-semibold shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  {isPending ? '...' : t('parties.addButton')}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Info footer */}
        <div className="px-5 sm:px-6 py-3 bg-stone-50 border-t border-stone-100">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] text-stone-500">{t('parties.infoText')}</p>
              <div className="flex items-center gap-3 mt-1.5">
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="text-[10px] text-stone-400">{t('parties.emailPresent')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span className="text-[10px] text-stone-400">{t('parties.emailMissing')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats footer */}
        <div className="px-5 sm:px-6 py-4 bg-white border-t border-stone-100 flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2 sm:justify-between">
          <div className="text-xs text-stone-400 flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-stone-600">{parties.length}</span> {t('parties.partiesCount')}
            <span className="text-stone-300 mx-1">|</span>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>{withEmail.length} {t('parties.notifiable')}</span>
            </div>
            {withoutEmail.length > 0 && (
              <>
                <span className="text-stone-300 mx-1">|</span>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span>{withoutEmail.length} {t('parties.emailMissingCount')}</span>
                </div>
              </>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-100 text-sm font-medium text-center"
          >
            {t('parties.close')}
          </button>
        </div>
      </DialogContent>

      {/* Delete confirm */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, party: null })}
        onConfirm={() => deleteConfirm.party && deleteMutation.mutate(deleteConfirm.party.id)}
        title={t('parties.deleteTitle')}
        message={t('parties.deleteMessage', {
          name: deleteConfirm.party?.fullName ?? '',
          role: deleteConfirm.party ? roleLabel(deleteConfirm.party.role) : '',
        })}
        confirmLabel={t('parties.deleteConfirm')}
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </Dialog>
  )
}
