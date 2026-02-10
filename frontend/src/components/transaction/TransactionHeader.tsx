import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, Link } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  MoreVertical,
  XCircle,
  Trash2,
  AlertTriangle,
  Archive,
  RotateCcw,
  Pencil,
  Users,
  Download,
  Info,
  Ban,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  RotateCw,
} from 'lucide-react'
import { transactionsApi, type Transaction } from '../../api/transactions.api'
import { toast } from '../../hooks/use-toast'
import { Button } from '../ui/Button'
import { Checkbox } from '../ui/Checkbox'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '../ui/Dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '../ui/DropdownMenu'

interface TransactionHeaderProps {
  transaction: Transaction
  onOpenEdit?: () => void
  onOpenMembers?: () => void
  onOpenExport?: () => void
}

const CANCELLATION_REASONS = [
  'offer_rejected',
  'buyer_withdrew',
  'financing_refused',
  'inspection_issues',
  'seller_withdrew',
  'other',
] as const

export default function TransactionHeader({ transaction, onOpenEdit, onOpenMembers, onOpenExport }: TransactionHeaderProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Cancel modal state
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelNote, setCancelNote] = useState('')
  const [cancelEmailNotify, setCancelEmailNotify] = useState(true)
  const [cancelConfirmed, setCancelConfirmed] = useState(false)
  const [cancelSuccessOpen, setCancelSuccessOpen] = useState(false)

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleteConfirmInput, setDeleteConfirmInput] = useState('')
  const [deleteCheck1, setDeleteCheck1] = useState(false)
  const [deleteCheck2, setDeleteCheck2] = useState(false)
  const [deleteSuccessOpen, setDeleteSuccessOpen] = useState(false)

  // Archive modal state
  const [archiveModalOpen, setArchiveModalOpen] = useState(false)
  const [archiveReason, setArchiveReason] = useState('')
  const [archiveConfirmed, setArchiveConfirmed] = useState(false)
  const [archiveSuccessOpen, setArchiveSuccessOpen] = useState(false)

  // Restore modal state
  const [restoreModalOpen, setRestoreModalOpen] = useState(false)

  const clientName = transaction.client
    ? `${transaction.client.firstName} ${transaction.client.lastName}`
    : t('transaction.client')

  const propertyAddress = transaction.property?.address ?? null

  // Delete confirmation
  const deleteTypeWord = t('transaction.deleteModal.typeWord')
  const isDeleteConfirmValid = useMemo(() => {
    const inputNormalized = deleteConfirmInput.trim().toUpperCase()
    return inputNormalized === deleteTypeWord && deleteCheck1 && deleteCheck2
  }, [deleteConfirmInput, deleteTypeWord, deleteCheck1, deleteCheck2])

  // Cancel validation
  const isCancelValid = useMemo(() => {
    if (!cancelReason || !cancelConfirmed) return false
    if (cancelReason === 'other' && !cancelNote.trim()) return false
    return true
  }, [cancelReason, cancelConfirmed, cancelNote])

  // Reset modals
  const handleCancelModalClose = () => {
    setCancelModalOpen(false)
    setCancelReason('')
    setCancelNote('')
    setCancelEmailNotify(true)
    setCancelConfirmed(false)
  }

  const handleDeleteModalClose = () => {
    setDeleteModalOpen(false)
    setDeleteConfirmInput('')
    setDeleteCheck1(false)
    setDeleteCheck2(false)
  }

  const handleArchiveModalClose = () => {
    setArchiveModalOpen(false)
    setArchiveReason('')
    setArchiveConfirmed(false)
  }

  const handleRestoreModalClose = () => {
    setRestoreModalOpen(false)
  }

  // Cancel mutation
  const cancelMutation = useMutation({
    mutationFn: () => transactionsApi.cancel(transaction.id, cancelReason),
    onSuccess: (response) => {
      if (response.success) {
        handleCancelModalClose()
        setCancelSuccessOpen(true)
        queryClient.invalidateQueries({ queryKey: ['transaction', transaction.id] })
        queryClient.invalidateQueries({ queryKey: ['transactions'] })
        queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      }
    },
    onError: () => {
      toast({ title: t('common.error'), variant: 'destructive' })
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: () => transactionsApi.delete(transaction.id),
    onSuccess: () => {
      handleDeleteModalClose()
      setDeleteSuccessOpen(true)
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
    onError: () => {
      toast({ title: t('common.error'), variant: 'destructive' })
    },
  })

  // Archive mutation
  const archiveMutation = useMutation({
    mutationFn: () => transactionsApi.archive(transaction.id, archiveReason || undefined),
    onSuccess: (response) => {
      if (response.success) {
        handleArchiveModalClose()
        setArchiveSuccessOpen(true)
        queryClient.invalidateQueries({ queryKey: ['transaction', transaction.id] })
        queryClient.invalidateQueries({ queryKey: ['transactions'] })
        queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      }
    },
    onError: () => {
      toast({ title: t('common.error'), variant: 'destructive' })
    },
  })

  // Restore mutation
  const restoreMutation = useMutation({
    mutationFn: () => transactionsApi.restore(transaction.id),
    onSuccess: (response) => {
      if (response.success) {
        toast({
          title: t('common.success'),
          description: t('transaction.restoreModal.success'),
          variant: 'success',
        })
        handleRestoreModalClose()
        queryClient.invalidateQueries({ queryKey: ['transaction', transaction.id] })
        queryClient.invalidateQueries({ queryKey: ['transactions'] })
        queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      }
    },
    onError: () => {
      toast({ title: t('common.error'), variant: 'destructive' })
    },
  })

  const isCancelled = transaction.status === 'cancelled'
  const isArchived = transaction.status === 'archived'
  const isCompleted = !transaction.currentStepId

  const inputClass =
    'w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background'

  return (
    <>
      <div className="mb-6" data-testid="transaction-header">
        <div className="flex items-center justify-between mb-2">
          <Link
            to="/transactions"
            className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-700"
            data-testid="back-link"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('common.back')}
          </Link>

          {/* Actions menu — État A */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                data-testid="transaction-actions-menu"
              >
                <MoreVertical className="w-4 h-4" />
                <span className="sr-only">{t('transaction.actions.moreActions')}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72 p-0">
              <DropdownMenuLabel className="px-3 py-2 text-[10px] uppercase tracking-wider text-stone-400 font-semibold">
                {t('transaction.actions.dropdownTitle')}
              </DropdownMenuLabel>

              {/* Edit */}
              {!isCancelled && !isArchived && (
                <DropdownMenuItem onClick={onOpenEdit} className="px-3 py-2.5 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                    <Pencil className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-stone-800">{t('transaction.actions.edit')}</span>
                    <p className="text-[10px] text-stone-400">{t('transaction.actions.editDescription')}</p>
                  </div>
                </DropdownMenuItem>
              )}

              {/* Members */}
              <DropdownMenuItem onClick={onOpenMembers} className="px-3 py-2.5 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <span className="text-sm font-medium text-stone-800">{t('transaction.actions.members')}</span>
                  <p className="text-[10px] text-stone-400">{t('transaction.actions.membersDescription')}</p>
                </div>
              </DropdownMenuItem>

              {/* Export */}
              <DropdownMenuItem onClick={onOpenExport} className="px-3 py-2.5 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Download className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <span className="text-sm font-medium text-stone-800">{t('transaction.actions.export')}</span>
                  <p className="text-[10px] text-stone-400">{t('transaction.actions.exportDescription')}</p>
                </div>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {/* Info footer before danger zone */}
              <div className="px-3 py-2 bg-stone-50 border-b border-stone-100">
                <p className="text-[10px] text-stone-400 italic flex items-center gap-1">
                  <Info className="w-3 h-3 shrink-0" />
                  {t('transaction.actions.dropdownInfo')}
                </p>
              </div>

              {isArchived ? (
                <DropdownMenuItem onClick={() => setRestoreModalOpen(true)} className="px-3 py-2.5 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                    <RotateCcw className="w-4 h-4 text-blue-500" />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-blue-600">{t('transaction.actions.restore')}</span>
                  </div>
                </DropdownMenuItem>
              ) : (
                <>
                  {/* Archive */}
                  <DropdownMenuItem onClick={() => setArchiveModalOpen(true)} className="px-3 py-2.5 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                      <Archive className="w-4 h-4 text-indigo-500" />
                    </div>
                    <div>
                      <span className="text-sm font-medium text-stone-800">{t('transaction.actions.archive')}</span>
                      <p className="text-[10px] text-stone-400">{t('transaction.actions.archiveDescription')}</p>
                    </div>
                  </DropdownMenuItem>

                  {/* Cancel */}
                  {!isCancelled && !isCompleted && (
                    <DropdownMenuItem onClick={() => setCancelModalOpen(true)} className="px-3 py-2.5 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                        <Ban className="w-4 h-4 text-amber-500" />
                      </div>
                      <div>
                        <span className="text-sm font-medium text-stone-800">{t('transaction.actions.cancel')}</span>
                        <p className="text-[10px] text-stone-400">{t('transaction.actions.cancelDescription')}</p>
                      </div>
                    </DropdownMenuItem>
                  )}
                </>
              )}

              <DropdownMenuSeparator />

              {/* Delete */}
              <DropdownMenuItem onClick={() => setDeleteModalOpen(true)} className="px-3 py-2.5 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                  <Trash2 className="w-4 h-4 text-red-500" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-stone-800">{t('transaction.actions.delete')}</span>
                    <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-stone-100 text-stone-400 uppercase">
                      {t('transaction.actions.adminRequired')}
                    </span>
                  </div>
                  <p className="text-[10px] text-stone-400">{t('transaction.actions.deleteDescription')}</p>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
          <div className="flex items-center gap-2">
            <h1
              className="text-xl font-bold text-stone-900 truncate"
              style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
              data-testid="header-client"
            >
              {clientName}
            </h1>
            {isCancelled && (
              <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-stone-100 text-stone-600">
                {t('transaction.status.cancelled')}
              </span>
            )}
            {isArchived && (
              <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                <Archive className="w-3 h-3 mr-1" />
                {t('transaction.status.archived')}
              </span>
            )}
          </div>

          {propertyAddress && (
            <>
              <span className="hidden sm:inline text-stone-300" aria-hidden="true">
                —
              </span>
              <p
                className="text-sm text-stone-500 truncate"
                data-testid="header-address"
              >
                {propertyAddress}
              </p>
            </>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          Cancel Modal — État D
          ═══════════════════════════════════════════════════════ */}
      <Dialog open={cancelModalOpen} onOpenChange={(open) => !open && handleCancelModalClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <Ban className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <DialogTitle>{t('transaction.cancelModal.title')}</DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground mt-0.5">
                  {t('transaction.cancelModal.description')}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Reason select */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                {t('transaction.cancelModal.reason')}
              </label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className={inputClass}
              >
                <option value="">{t('transaction.cancelModal.reasonPlaceholder')}</option>
                {CANCELLATION_REASONS.map((reason) => (
                  <option key={reason} value={reason}>
                    {t(`transaction.cancelModal.reasons.${reason}`)}
                  </option>
                ))}
              </select>
            </div>

            {/* Note */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium flex items-center gap-1">
                {t('transaction.cancelModal.note')}
                <span className={cancelReason === 'other' ? 'text-red-500 text-xs' : 'text-muted-foreground text-xs'}>
                  {cancelReason === 'other' ? t('transaction.cancelModal.noteRequired') : t('transaction.cancelModal.noteOptional')}
                </span>
              </label>
              <textarea
                value={cancelNote}
                onChange={(e) => setCancelNote(e.target.value)}
                placeholder={t('transaction.cancelModal.notePlaceholder')}
                className={`${inputClass} min-h-[70px] resize-none`}
              />
              {cancelReason === 'other' && !cancelNote.trim() && (
                <p className="text-xs text-red-500">{t('transaction.cancelModal.noteHint')}</p>
              )}
            </div>

            {/* Impact section */}
            <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3 space-y-2">
              <p className="text-xs font-semibold text-amber-700">{t('transaction.cancelModal.impact.title')}</p>
              <div className="space-y-1.5">
                {(['status', 'locked', 'history'] as const).map((key) => (
                  <div key={key} className="flex items-start gap-2">
                    <ArrowRight className="w-3 h-3 text-amber-500 mt-0.5 shrink-0" />
                    <span className="text-xs text-amber-700">{t(`transaction.cancelModal.impact.${key}`)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Email toggle */}
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-stone-700">{t('transaction.cancelModal.emailToggle')}</span>
              <button
                type="button"
                onClick={() => setCancelEmailNotify(!cancelEmailNotify)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${cancelEmailNotify ? 'bg-primary' : 'bg-stone-300'}`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${cancelEmailNotify ? 'translate-x-[18px]' : 'translate-x-[3px]'}`}
                />
              </button>
            </div>

            {/* Confirmation checkbox */}
            <label className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg border border-stone-200 bg-white cursor-pointer">
              <Checkbox
                checked={cancelConfirmed}
                onCheckedChange={(checked) => setCancelConfirmed(checked === true)}
                className="mt-0.5"
              />
              <span className="text-sm text-stone-600">{t('transaction.cancelModal.confirmLabel')}</span>
            </label>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={handleCancelModalClose}
              disabled={cancelMutation.isPending}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="warning"
              onClick={() => cancelMutation.mutate()}
              disabled={!isCancelValid || cancelMutation.isPending}
            >
              {cancelMutation.isPending ? t('common.loading') : t('transaction.cancelModal.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════
          Cancel Success Modal — État E
          ═══════════════════════════════════════════════════════ */}
      <Dialog open={cancelSuccessOpen} onOpenChange={(open) => !open && setCancelSuccessOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center text-center py-4 space-y-4">
            <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center">
              <Ban className="w-7 h-7 text-amber-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-stone-900">{t('transaction.cancelModal.successTitle')}</h3>
              <p className="text-sm text-muted-foreground mt-1">{t('transaction.cancelModal.success')}</p>
            </div>

            {/* Status cards */}
            <div className="w-full grid grid-cols-3 gap-2">
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-2.5 text-center">
                <Ban className="w-4 h-4 text-amber-500 mx-auto mb-1" />
                <p className="text-[10px] font-medium text-amber-700">{t('transaction.status.cancelled')}</p>
              </div>
              <div className="rounded-lg bg-stone-50 border border-stone-200 p-2.5 text-center">
                <Clock className="w-4 h-4 text-stone-400 mx-auto mb-1" />
                <p className="text-[10px] font-medium text-stone-500">{t('transaction.cancelModal.impact.locked').substring(0, 20)}...</p>
              </div>
              <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-2.5 text-center">
                <Check className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
                <p className="text-[10px] font-medium text-emerald-700">{t('transaction.cancelModal.impact.history').substring(0, 20)}...</p>
              </div>
            </div>

            {/* Hint: archive */}
            <div className="w-full rounded-lg border border-indigo-200 bg-indigo-50/50 p-3">
              <p className="text-xs text-indigo-700">{t('transaction.cancelModal.successHint')}</p>
            </div>
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button
              onClick={() => {
                setCancelSuccessOpen(false)
                setArchiveModalOpen(true)
              }}
              className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700"
            >
              <Archive className="w-4 h-4" />
              {t('transaction.cancelModal.archiveNow')}
            </Button>
            <Button
              variant="outline"
              onClick={() => setCancelSuccessOpen(false)}
              className="w-full"
            >
              {t('transaction.cancelModal.backToTransaction')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════
          Archive Modal — État B
          ═══════════════════════════════════════════════════════ */}
      <Dialog open={archiveModalOpen} onOpenChange={(open) => !open && handleArchiveModalClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                <Archive className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <DialogTitle>{t('transaction.archiveModal.title')}</DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground mt-0.5">
                  {t('transaction.archiveModal.description')}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Transaction summary card */}
            <div className="rounded-lg border border-stone-200 bg-stone-50 p-3">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-stone-400">{t('transaction.client')}</span>
                  <p className="font-medium text-stone-800 truncate">{clientName}</p>
                </div>
                <div>
                  <span className="text-stone-400">{t('transaction.type')}</span>
                  <p className="font-medium text-stone-800">{transaction.type === 'purchase' ? t('transaction.types.purchase') : t('transaction.types.sale')}</p>
                </div>
                {propertyAddress && (
                  <div className="col-span-2">
                    <span className="text-stone-400">{t('transaction.editModal.property')}</span>
                    <p className="font-medium text-stone-800 truncate">{propertyAddress}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Reason */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t('transaction.archiveModal.reason')}</label>
              <textarea
                value={archiveReason}
                onChange={(e) => setArchiveReason(e.target.value)}
                placeholder={t('transaction.archiveModal.reasonPlaceholder')}
                className={`${inputClass} min-h-[70px] resize-none`}
              />
            </div>

            {/* Impact section */}
            <div className="rounded-lg border border-indigo-200 bg-indigo-50/50 p-3 space-y-2">
              <p className="text-xs font-semibold text-indigo-700">{t('transaction.archiveModal.impact.title')}</p>
              <div className="space-y-1.5">
                <div className="flex items-start gap-2">
                  <ArrowRight className="w-3 h-3 text-indigo-500 mt-0.5 shrink-0" />
                  <span className="text-xs text-indigo-700">{t('transaction.archiveModal.impact.hidden')}</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-3 h-3 text-indigo-500 mt-0.5 shrink-0" />
                  <span className="text-xs text-indigo-700">{t('transaction.archiveModal.impact.readable')}</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-3 h-3 text-indigo-500 mt-0.5 shrink-0" />
                  <span className="text-xs text-indigo-700">{t('transaction.archiveModal.impact.preserved')}</span>
                </div>
                <div className="flex items-start gap-2">
                  <RotateCw className="w-3 h-3 text-indigo-500 mt-0.5 shrink-0" />
                  <span className="text-xs text-indigo-700">{t('transaction.archiveModal.impact.restorable')}</span>
                </div>
              </div>
            </div>

            {/* Confirmation checkbox */}
            <label className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg border border-stone-200 bg-white cursor-pointer">
              <Checkbox
                checked={archiveConfirmed}
                onCheckedChange={(checked) => setArchiveConfirmed(checked === true)}
                className="mt-0.5"
              />
              <span className="text-sm text-stone-600">{t('transaction.archiveModal.confirmLabel')}</span>
            </label>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={handleArchiveModalClose}
              disabled={archiveMutation.isPending}
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={() => archiveMutation.mutate()}
              disabled={!archiveConfirmed || archiveMutation.isPending}
              className={archiveConfirmed ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : ''}
            >
              {archiveMutation.isPending ? t('common.loading') : t('transaction.archiveModal.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════
          Archive Success Modal — État C
          ═══════════════════════════════════════════════════════ */}
      <Dialog open={archiveSuccessOpen} onOpenChange={(open) => !open && setArchiveSuccessOpen(false)}>
        <DialogContent className="sm:max-w-md">
          {/* Header banner */}
          <div className="flex items-center gap-2 px-4 py-3 -mx-6 -mt-6 mb-2 bg-indigo-50 border-b border-indigo-100 rounded-t-lg">
            <Archive className="w-4 h-4 text-indigo-600" />
            <span className="text-sm font-medium text-indigo-700">{t('transaction.archiveModal.successTitle')}</span>
          </div>

          <div className="flex flex-col items-center text-center py-2 space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-stone-900">{t('transaction.archiveModal.success')}</h3>
              <p className="text-sm text-muted-foreground mt-1">{t('transaction.archiveModal.description')}</p>
            </div>

            {/* Status cards */}
            <div className="w-full grid grid-cols-3 gap-2">
              <div className="rounded-lg bg-indigo-50 border border-indigo-200 p-2.5 text-center">
                <Archive className="w-4 h-4 text-indigo-500 mx-auto mb-1" />
                <p className="text-[10px] font-medium text-indigo-700">{t('transaction.status.archived')}</p>
              </div>
              <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-2.5 text-center">
                <Check className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
                <p className="text-[10px] font-medium text-emerald-700 truncate">{t('transaction.archiveModal.impact.preserved').substring(0, 22)}...</p>
              </div>
              <div className="rounded-lg bg-stone-50 border border-stone-200 p-2.5 text-center">
                <RotateCw className="w-4 h-4 text-stone-400 mx-auto mb-1" />
                <p className="text-[10px] font-medium text-stone-500 truncate">{t('transaction.archiveModal.impact.restorable').substring(0, 22)}...</p>
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button
              onClick={() => {
                setArchiveSuccessOpen(false)
                navigate('/transactions')
              }}
              className="w-full"
            >
              {t('transaction.actions.backToList')}
            </Button>
            <div className="flex gap-2 w-full">
              <Button
                variant="outline"
                onClick={() => {
                  setArchiveSuccessOpen(false)
                  restoreMutation.mutate()
                }}
                className="flex-1 gap-1.5 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
              >
                <RotateCcw className="w-4 h-4" />
                {t('transaction.actions.restore')}
              </Button>
              <Button
                variant="outline"
                disabled
                className="flex-1"
              >
                {t('transaction.actions.viewTransaction')}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restore Modal */}
      <Dialog open={restoreModalOpen} onOpenChange={(open) => !open && handleRestoreModalClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-600">
              <RotateCcw className="w-5 h-5" />
              {t('transaction.restoreModal.title')}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground pt-2">
              {t('transaction.restoreModal.description')}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={handleRestoreModalClose}
              disabled={restoreMutation.isPending}
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={() => restoreMutation.mutate()}
              disabled={restoreMutation.isPending}
            >
              {restoreMutation.isPending ? t('common.loading') : t('transaction.restoreModal.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════
          Delete Modal — État F
          ═══════════════════════════════════════════════════════ */}
      <Dialog open={deleteModalOpen} onOpenChange={(open) => !open && handleDeleteModalClose()}>
        <DialogContent className="sm:max-w-md border-2 border-red-200">
          {/* Danger banner */}
          <div className="flex items-center gap-2 px-4 py-2.5 -mx-6 -mt-6 mb-2 bg-red-50 border-b border-red-200 rounded-t-lg">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <span className="text-xs font-bold text-red-700 uppercase tracking-wide">
              {t('transaction.deleteModal.dangerBanner')}
            </span>
          </div>

          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="w-5 h-5" />
              {t('transaction.deleteModal.title')}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Warning box */}
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 space-y-2">
              <p className="text-sm font-semibold text-red-800">{t('transaction.deleteModal.warningTitle')}</p>
              <p className="text-xs text-red-700">{t('transaction.deleteModal.warningText')}</p>
              <ul className="space-y-1 pl-1">
                {(['offers', 'documents', 'history'] as const).map((item) => (
                  <li key={item} className="flex items-start gap-2 text-xs text-red-700">
                    <XCircle className="w-3 h-3 mt-0.5 shrink-0 text-red-400" />
                    {t(`transaction.deleteModal.warningItems.${item}`)}
                  </li>
                ))}
              </ul>
              <p className="text-xs font-medium text-red-800 pt-1">{t('transaction.deleteModal.warningFooter')}</p>
            </div>

            {/* Recommendation */}
            <div className="rounded-lg border border-indigo-200 bg-indigo-50/50 p-3">
              <p className="text-xs text-indigo-700">{t('transaction.deleteModal.recommendation')}</p>
            </div>

            {/* Type to confirm */}
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {t('transaction.deleteModal.typeLabel')}{' '}
                <span className="font-mono font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">{deleteTypeWord}</span>
              </p>
              <input
                type="text"
                value={deleteConfirmInput}
                onChange={(e) => setDeleteConfirmInput(e.target.value)}
                placeholder={t('transaction.deleteModal.typePlaceholder')}
                className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500/50 bg-background font-mono"
                autoComplete="off"
                spellCheck="false"
              />
            </div>

            {/* Checkbox 1 */}
            <label className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg border border-stone-200 bg-white cursor-pointer">
              <Checkbox
                checked={deleteCheck1}
                onCheckedChange={(checked) => setDeleteCheck1(checked === true)}
                className="mt-0.5 border-red-300 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
              />
              <span className="text-sm text-stone-600">{t('transaction.deleteModal.check1')}</span>
            </label>

            {/* Checkbox 2 */}
            <label className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg border border-stone-200 bg-white cursor-pointer">
              <Checkbox
                checked={deleteCheck2}
                onCheckedChange={(checked) => setDeleteCheck2(checked === true)}
                className="mt-0.5 border-red-300 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
              />
              <span className="text-sm text-stone-600">{t('transaction.deleteModal.check2')}</span>
            </label>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={handleDeleteModalClose}
              disabled={deleteMutation.isPending}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteMutation.mutate()}
              disabled={!isDeleteConfirmValid || deleteMutation.isPending}
            >
              {deleteMutation.isPending ? t('common.loading') : t('transaction.deleteModal.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════
          Delete Success Modal — État G
          ═══════════════════════════════════════════════════════ */}
      <Dialog open={deleteSuccessOpen} onOpenChange={(open) => !open && navigate('/transactions')}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center text-center py-6 space-y-4">
            <div className="w-14 h-14 rounded-full bg-stone-100 flex items-center justify-center">
              <Trash2 className="w-7 h-7 text-stone-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-stone-900">{t('transaction.deleteModal.success')}</h3>
              <p className="text-sm text-muted-foreground mt-1">{t('transaction.deleteModal.successMessage')}</p>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => navigate('/transactions')}
              className="w-full"
            >
              {t('transaction.actions.backToList')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
