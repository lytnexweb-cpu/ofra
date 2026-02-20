import { useState, useEffect, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { prosApi, type ProfessionalContact, type ProfessionalRole, type CreateProRequest } from '../api/pros.api'
import { normalizeSearch } from '../lib/utils'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Plus, Search, X, Briefcase, Mail, Phone, Building2, Pencil, Trash2 } from 'lucide-react'

const ROLES: ProfessionalRole[] = ['inspector', 'notary', 'lawyer', 'mortgage_broker', 'appraiser', 'other']

function getRoleBadgeColor(role: ProfessionalRole): string {
  const colors: Record<ProfessionalRole, string> = {
    inspector: 'bg-blue-100 text-blue-700',
    notary: 'bg-purple-100 text-purple-700',
    lawyer: 'bg-amber-100 text-amber-700',
    mortgage_broker: 'bg-green-100 text-green-700',
    appraiser: 'bg-cyan-100 text-cyan-700',
    other: 'bg-stone-100 text-stone-600',
  }
  return colors[role]
}

function ProCardSkeleton() {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-stone-200" />
        <div className="flex-1">
          <div className="h-5 w-32 bg-stone-200 rounded mb-2" />
          <div className="h-4 w-48 bg-stone-100 rounded" />
        </div>
      </div>
    </div>
  )
}

function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  const { t } = useTranslation()
  return (
    <div className="text-center py-16">
      <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-primary/10">
        <Briefcase className="w-8 h-8 text-primary" />
      </div>
      <h3 className="text-lg font-semibold text-stone-900 mb-2">{t('pros.empty')}</h3>
      <p className="text-stone-500 mb-6 max-w-sm mx-auto">{t('pros.emptyDescription')}</p>
      <Button onClick={onCreateClick} className="bg-primary hover:bg-primary/90">
        <Plus className="w-4 h-4" />
        {t('pros.addPro')}
      </Button>
    </div>
  )
}

// ── Modal ──────────────────────────────────────────────────────────────
interface ProModalProps {
  isOpen: boolean
  onClose: () => void
  editingPro?: ProfessionalContact | null
}

function ProModal({ isOpen, onClose, editingPro }: ProModalProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const isEdit = !!editingPro

  const [form, setForm] = useState<CreateProRequest>({
    name: editingPro?.name ?? '',
    role: editingPro?.role ?? 'inspector',
    phone: editingPro?.phone ?? '',
    email: editingPro?.email ?? '',
    company: editingPro?.company ?? '',
    notes: editingPro?.notes ?? '',
  })
  const [error, setError] = useState('')

  // Reset form when modal opens/closes or editingPro changes
  useEffect(() => {
    if (isOpen) {
      setForm({
        name: editingPro?.name ?? '',
        role: editingPro?.role ?? 'inspector',
        phone: editingPro?.phone ?? '',
        email: editingPro?.email ?? '',
        company: editingPro?.company ?? '',
        notes: editingPro?.notes ?? '',
      })
      setError('')
    }
  }, [isOpen, editingPro])

  const createMutation = useMutation({
    mutationFn: (data: CreateProRequest) => prosApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pros'] })
      onClose()
    },
    onError: () => setError(t('pros.errorCreate')),
  })

  const updateMutation = useMutation({
    mutationFn: (data: CreateProRequest) => prosApi.update(editingPro!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pros'] })
      onClose()
    },
    onError: () => setError(t('pros.errorUpdate')),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.name.trim()) return
    const payload: CreateProRequest = {
      name: form.name.trim(),
      role: form.role,
      ...(form.phone && { phone: form.phone.trim() }),
      ...(form.email && { email: form.email.trim() }),
      ...(form.company && { company: form.company.trim() }),
      ...(form.notes && { notes: form.notes.trim() }),
    }
    if (isEdit) {
      updateMutation.mutate(payload)
    } else {
      createMutation.mutate(payload)
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-stone-900">
              {isEdit ? t('pros.editPro') : t('pros.addPro')}
            </h2>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-stone-100">
              <X className="w-5 h-5 text-stone-400" />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="pro-name" className="block text-sm font-medium text-stone-700 mb-1">
                {t('pros.name')} *
              </label>
              <Input
                id="pro-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                autoFocus
                required
              />
            </div>

            <div>
              <label htmlFor="pro-role" className="block text-sm font-medium text-stone-700 mb-1">
                {t('pros.role')} *
              </label>
              <select
                id="pro-role"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as ProfessionalRole })}
                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>{t(`pros.roles.${r}`)}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="pro-phone" className="block text-sm font-medium text-stone-700 mb-1">
                  {t('pros.phone')}
                </label>
                <Input
                  id="pro-phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="pro-email" className="block text-sm font-medium text-stone-700 mb-1">
                  {t('pros.email')}
                </label>
                <Input
                  id="pro-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label htmlFor="pro-company" className="block text-sm font-medium text-stone-700 mb-1">
                {t('pros.company')}
              </label>
              <Input
                id="pro-company"
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
              />
            </div>

            <div>
              <label htmlFor="pro-notes" className="block text-sm font-medium text-stone-700 mb-1">
                {t('pros.notes')}
              </label>
              <textarea
                id="pro-notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={isPending || !form.name.trim()} className="flex-1 bg-primary hover:bg-primary/90">
                {isPending ? '...' : isEdit ? t('common.save') : t('pros.addPro')}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// ── Delete confirmation ────────────────────────────────────────────────
interface DeleteConfirmProps {
  pro: ProfessionalContact
  onClose: () => void
}

function DeleteConfirm({ pro, onClose }: DeleteConfirmProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: () => prosApi.delete(pro.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pros'] })
      onClose()
    },
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <h3 className="text-lg font-semibold text-stone-900 mb-2">{t('pros.deleteTitle')}</h3>
        <p className="text-sm text-stone-500 mb-6">
          {t('pros.deleteConfirm', { name: pro.name })}
        </p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">{t('common.cancel')}</Button>
          <Button
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
          >
            {deleteMutation.isPending ? '...' : t('common.delete')}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────
export default function ProsPage() {
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPro, setEditingPro] = useState<ProfessionalContact | null>(null)
  const [deletingPro, setDeletingPro] = useState<ProfessionalContact | null>(null)
  const [roleFilter, setRoleFilter] = useState<ProfessionalRole | ''>('')

  const { data, isLoading } = useQuery({
    queryKey: ['pros'],
    queryFn: prosApi.list,
  })

  const pros = data?.data?.pros ?? []

  const filtered = useMemo(() => {
    let result = pros
    if (roleFilter) {
      result = result.filter((p) => p.role === roleFilter)
    }
    if (searchQuery.trim()) {
      const q = normalizeSearch(searchQuery)
      result = result.filter((p) =>
        normalizeSearch(p.name).includes(q) ||
        normalizeSearch(p.company ?? '').includes(q) ||
        normalizeSearch(p.email ?? '').includes(q)
      )
    }
    return result
  }, [pros, searchQuery, roleFilter])

  const handleEdit = (pro: ProfessionalContact) => {
    setEditingPro(pro)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingPro(null)
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">{t('pros.title')}</h1>
          <p className="text-sm text-stone-500 mt-1">
            {t('pros.subtitle', { count: pros.length })}
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4" />
          {t('pros.addPro')}
        </Button>
      </div>

      {/* Search + filter */}
      {pros.length > 0 && (
        <div className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('pros.searchPlaceholder')}
              className="pl-10"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-stone-400" />
              </button>
            )}
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as ProfessionalRole | '')}
            className="rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          >
            <option value="">{t('pros.allRoles')}</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>{t(`pros.roles.${r}`)}</option>
            ))}
          </select>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <ProCardSkeleton key={i} />)}
        </div>
      ) : pros.length === 0 ? (
        <EmptyState onCreateClick={() => setIsModalOpen(true)} />
      ) : filtered.length === 0 ? (
        <p className="text-center text-stone-400 py-12">{t('pros.noResults')}</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((pro) => (
            <div
              key={pro.id}
              className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4"
            >
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Briefcase className="w-5 h-5 text-primary" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-stone-900 truncate">{pro.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getRoleBadgeColor(pro.role)}`}>
                    {t(`pros.roles.${pro.role}`)}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-stone-500">
                  {pro.company && (
                    <span className="flex items-center gap-1 truncate">
                      <Building2 className="w-3.5 h-3.5" />
                      {pro.company}
                    </span>
                  )}
                  {pro.phone && (
                    <a href={`tel:${pro.phone}`} className="flex items-center gap-1 hover:text-primary">
                      <Phone className="w-3.5 h-3.5" />
                      {pro.phone}
                    </a>
                  )}
                  {pro.email && (
                    <a href={`mailto:${pro.email}`} className="flex items-center gap-1 hover:text-primary truncate">
                      <Mail className="w-3.5 h-3.5" />
                      {pro.email}
                    </a>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => handleEdit(pro)}
                  className="p-2 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-600"
                  title={t('common.edit')}
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDeletingPro(pro)}
                  className="p-2 rounded-lg hover:bg-red-50 text-stone-400 hover:text-red-600"
                  title={t('common.delete')}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {isModalOpen && (
        <ProModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          editingPro={editingPro}
        />
      )}
      {deletingPro && (
        <DeleteConfirm pro={deletingPro} onClose={() => setDeletingPro(null)} />
      )}
    </div>
  )
}
