import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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
  Lock,
  Mail,
  Phone,
  Calendar,
  RotateCw,
  Zap,
  UserCheck,
} from 'lucide-react'
import { transactionsApi, type Transaction } from '../../api/transactions.api'
import { authApi } from '../../api/auth.api'
import { formatDate, parseISO, differenceInDays } from '../../lib/date'
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
  onOpenParties?: () => void
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

export default function TransactionHeader({ transaction, onOpenEdit, onOpenMembers, onOpenParties, onOpenExport }: TransactionHeaderProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: authData } = useQuery({ queryKey: ['auth', 'me'], queryFn: authApi.me })
  const isAdmin = authData?.data?.user?.role === 'admin' || authData?.data?.user?.role === 'superadmin'

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

  // Info pills data
  const clientPhone = transaction.client?.cellPhone || transaction.client?.phone
  const clientEmail = transaction.client?.email
  const acceptedOffer = transaction.offers?.find((o) => o.status === 'accepted')
  const acceptedOfferPrice = acceptedOffer?.revisions?.length
    ? acceptedOffer.revisions.reduce((latest, rev) => (rev.revisionNumber > latest.revisionNumber ? rev : latest), acceptedOffer.revisions[0]).price
    : null

  // Closing date data
  const daysUntilClosing = transaction.closingDate
    ? differenceInDays(parseISO(transaction.closingDate), new Date())
    : null
  const currentStepOrder = transaction.currentStep?.stepOrder ?? 0
  const totalSteps = transaction.transactionSteps?.length ?? 0
  const stepProgress = totalSteps > 0 ? Math.round((currentStepOrder / totalSteps) * 100) : 0
  const currentStepName = transaction.currentStep?.workflowStep?.name ?? ''

  // Next actions — pending conditions on current step
  const upcomingConditions = useMemo(() => {
    if (!transaction.conditions || !transaction.currentStepId) return []
    return transaction.conditions
      .filter(
        (c: any) =>
          c.status !== 'completed' &&
          c.status !== 'waived' &&
          c.transactionStepId === transaction.currentStepId
      )
      .sort((a: any, b: any) => {
        if (!a.dueDate && !b.dueDate) return 0
        if (!a.dueDate) return 1
        if (!b.dueDate) return -1
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      })
  }, [transaction.conditions, transaction.currentStepId])

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
        queryClient.invalidateQueries({ queryKey: ['advance-check', transaction.id] })
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
        queryClient.invalidateQueries({ queryKey: ['advance-check', transaction.id] })
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
        queryClient.invalidateQueries({ queryKey: ['advance-check', transaction.id] })
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
      <div className="mb-5" data-testid="transaction-header">
        <Link
          to="/transactions"
          className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-primary mb-3"
          data-testid="back-link"
        >
          <ArrowLeft className="w-4 h-4" />
          Transactions
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
          <div className="min-w-0">
            <h1
              className="text-xl sm:text-2xl font-bold text-stone-900 truncate"
              style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
              data-testid="header-client"
            >
              {clientName}
              {isCancelled && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-stone-100 text-stone-600 align-middle">
                  {t('transaction.status.cancelled')}
                </span>
              )}
              {isArchived && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-amber-50 text-amber-700 border border-amber-200 align-middle">
                  <Archive className="w-3 h-3 mr-1" />
                  {t('transaction.status.archived')}
                </span>
              )}
            </h1>
            {propertyAddress && (
              <p
                className="text-sm text-stone-400 mt-0.5 truncate"
                data-testid="header-address"
              >
                {propertyAddress}
              </p>
            )}
          </div>

          {/* Actions menu — État A */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="self-start p-2 rounded-lg hover:bg-stone-100 text-stone-400 shrink-0"
                data-testid="transaction-actions-menu"
              >
                <MoreVertical className="w-5 h-5" />
                <span className="sr-only">{t('transaction.actions.moreActions')}</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 p-0">
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

              {/* Parties */}
              <DropdownMenuItem onClick={onOpenParties} className="px-3 py-2.5 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                  <UserCheck className="w-4 h-4 text-emerald-500" />
                </div>
                <div>
                  <span className="text-sm font-medium text-stone-800">{t('transaction.actions.parties')}</span>
                  <p className="text-[10px] text-stone-400">{t('transaction.actions.partiesDescription')}</p>
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
              <DropdownMenuItem
                onClick={() => isAdmin && setDeleteModalOpen(true)}
                disabled={!isAdmin}
                className={`px-3 py-2.5 flex items-center gap-3 ${!isAdmin ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                  <Trash2 className="w-4 h-4 text-red-500" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-red-600">{t('transaction.actions.delete')}</span>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded uppercase ${isAdmin ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-400'}`}>
                      {isAdmin ? t('transaction.actions.adminOn', 'Admin ON') : t('transaction.actions.adminRequired')}
                    </span>
                  </div>
                  <p className="text-[10px] text-stone-400">{t('transaction.actions.deleteDescription')}</p>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Info pills + Contact rapide */}
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {t(`transaction.${transaction.type}`)}
          </span>
          {transaction.salePrice && (
            <span className="text-sm text-stone-600 font-semibold">
              {Number(transaction.salePrice).toLocaleString()} $
            </span>
          )}
          {acceptedOfferPrice && (
            <span className="text-xs text-emerald-600 font-medium">
              ({t('transaction.detail.acceptedOffer', { price: Number(acceptedOfferPrice).toLocaleString() })})
            </span>
          )}
          <span className="text-stone-300">|</span>
          {clientPhone && (
            <a
              href={`tel:${clientPhone}`}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-stone-100 text-stone-600 hover:bg-primary/10 hover:text-primary transition-colors"
            >
              <Phone className="w-3 h-3" />
              {t('transaction.detail.call')}
            </a>
          )}
          {clientEmail && (
            <a
              href={`mailto:${clientEmail}`}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-stone-100 text-stone-600 hover:bg-primary/10 hover:text-primary transition-colors"
            >
              <Mail className="w-3 h-3" />
              {t('transaction.detail.email')}
            </a>
          )}
        </div>

        {/* Fermeture prévue + Étape card — toujours visible */}
        <div className="mt-3">
          <div className="rounded-lg bg-primary/5 border border-primary/10 overflow-hidden">
            <div className="flex items-center gap-3 px-3 py-2.5">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs text-stone-500">{t('transaction.detail.closingExpected')}</span>
                <div className="flex items-baseline gap-2 flex-wrap">
                  {transaction.closingDate ? (
                    <>
                      <span className="text-base sm:text-lg font-bold text-primary">
                        {formatDate(parseISO(transaction.closingDate), 'd MMMM yyyy')}
                      </span>
                      {daysUntilClosing !== null && (
                        <span className={`text-sm font-semibold ${daysUntilClosing < 0 ? 'text-red-600' : 'text-accent'}`}>
                          {daysUntilClosing < 0
                            ? t('transaction.detail.overdueDays', { count: Math.abs(daysUntilClosing) })
                            : t('transaction.detail.inDays', { count: daysUntilClosing })}
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-sm text-stone-400 italic">
                      {t('transaction.detail.noClosingDate')}
                    </span>
                  )}
                </div>
              </div>
            </div>
            {totalSteps > 0 && (
              <div className="flex items-center gap-3 px-3 py-2 bg-primary/[0.03] border-t border-primary/10">
                <div className="w-9 shrink-0" />
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-xs text-stone-500">{t('transaction.step')}</span>
                  <span className="text-sm font-bold text-primary">{currentStepOrder} / {totalSteps}</span>
                  <div className="flex-1 max-w-[120px] h-1.5 bg-stone-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${stepProgress}%` }}
                    />
                  </div>
                  {currentStepName && (
                    <span className="text-[10px] text-stone-400">{currentStepName}</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Prochaines actions cockpit */}
        {upcomingConditions.length > 0 && (
          <div className="mt-3">
            <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3">
              <h3 className="text-xs font-semibold text-amber-800 flex items-center gap-1.5 mb-2">
                <Zap className="w-3.5 h-3.5" />
                {t('transaction.detail.nextActions')}
              </h3>
              <div className="space-y-1.5">
                {upcomingConditions.map((condition: any) => {
                  const days = condition.dueDate
                    ? differenceInDays(parseISO(condition.dueDate), new Date())
                    : null
                  const isOverdue = days !== null && days < 0
                  const isSoon = days !== null && days <= 7 && days >= 0
                  const borderColor = isOverdue ? 'border-red-100' : isSoon ? 'border-amber-100' : 'border-stone-100'
                  const dotColor = isOverdue ? 'bg-red-500' : isSoon ? 'bg-amber-500' : 'bg-stone-300'
                  const textColor = isOverdue ? 'text-red-600 font-bold' : isSoon ? 'text-amber-600 font-medium' : 'text-stone-400 font-medium'

                  return (
                    <div key={condition.id} className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-white border ${borderColor}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${dotColor} shrink-0`} />
                      <span className="text-xs text-stone-700 flex-1">{condition.title}</span>
                      {days !== null && (
                        <span className={`text-[10px] ${textColor}`}>
                          {days}j
                        </span>
                      )}
                      <button
                        onClick={() => {
                          const el = document.querySelector(`[data-condition-id="${condition.id}"]`)
                          if (el) {
                            el.scrollIntoView({ behavior: 'smooth', block: 'center' })
                            el.classList.add('ring-2', 'ring-primary')
                            setTimeout(() => el.classList.remove('ring-2', 'ring-primary'), 3000)
                          }
                        }}
                        className="text-[10px] font-medium text-primary hover:underline shrink-0"
                      >
                        {isOverdue ? t('transaction.detail.followUp') : isSoon ? t('transaction.detail.plan') : t('transaction.detail.track')}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════
          Cancel Modal — État D
          ═══════════════════════════════════════════════════════ */}
      <Dialog open={cancelModalOpen} onOpenChange={(open) => !open && handleCancelModalClose()}>
        <DialogContent className="sm:max-w-lg">
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
                <div className="flex items-center gap-1 mt-1 text-xs text-amber-600">
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  {t('transaction.cancelModal.noteHint')}
                </div>
              )}
            </div>

            {/* Impact section */}
            <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3 sm:p-4 space-y-2">
              <h3 className="text-xs font-semibold text-amber-800 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                {t('transaction.cancelModal.impact.title')}
              </h3>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <Ban className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                  <span className="text-xs text-stone-700">{t('transaction.cancelModal.impact.status')}</span>
                </div>
                <div className="flex items-start gap-2">
                  <Lock className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                  <span className="text-xs text-stone-700">{t('transaction.cancelModal.impact.locked')}</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                  <span className="text-xs text-stone-700">{t('transaction.cancelModal.impact.history')}</span>
                </div>
              </div>
            </div>

            {/* Email toggle with recipients */}
            <div className="rounded-lg border border-stone-200 bg-white overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-stone-500" />
                  <span className="text-xs font-medium text-stone-700">{t('transaction.cancelModal.emailToggle')}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setCancelEmailNotify(!cancelEmailNotify)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${cancelEmailNotify ? 'bg-primary' : 'bg-stone-300'}`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${cancelEmailNotify ? 'translate-x-4' : 'translate-x-0.5'}`}
                  />
                </button>
              </div>
              {cancelEmailNotify && (
                <div className="px-3 pb-3 space-y-2 border-t border-stone-100 pt-2">
                  <div className="text-xs text-stone-500">{t('transaction.cancelModal.emailToggle')} :</div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span className="text-xs text-stone-700">{clientName}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Confirmation checkbox */}
            <label className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg border border-stone-200 bg-white cursor-pointer">
              <Checkbox
                checked={cancelConfirmed}
                onCheckedChange={(checked) => setCancelConfirmed(checked === true)}
                className="mt-0.5"
              />
              <span className="text-xs text-stone-700 font-medium">{t('transaction.cancelModal.confirmLabel')}</span>
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
        <DialogContent className="sm:max-w-lg">
          <div className="flex flex-col items-center text-center py-4 space-y-4">
            <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center">
              <Ban className="w-7 h-7 text-amber-600" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-stone-900">{t('transaction.cancelModal.successTitle')}</h3>
              <p className="text-sm text-stone-500 mt-1">{clientName}</p>
            </div>

            {/* Status cards — 4 items like mockup */}
            <div className="w-full space-y-2">
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-100">
                <Ban className="w-4 h-4 text-amber-500 shrink-0" />
                <span className="text-xs text-amber-800">{t('transaction.cancelModal.successCard1')}</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-stone-50 border border-stone-200">
                <Lock className="w-4 h-4 text-stone-500 shrink-0" />
                <span className="text-xs text-stone-600">{t('transaction.cancelModal.successCard2')}</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50 border border-emerald-100">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-xs text-emerald-800">{t('transaction.cancelModal.successCard3')}</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-stone-50 border border-stone-200">
                <Mail className="w-4 h-4 text-stone-500 shrink-0" />
                <span className="text-xs text-stone-600">{t('transaction.cancelModal.successCard4')}</span>
              </div>
            </div>

            {/* Hint: archive */}
            <div className="w-full rounded-lg border border-indigo-200 bg-indigo-50/50 p-3">
              <h3 className="text-xs font-semibold text-indigo-800 flex items-center gap-1.5 mb-1">
                <Zap className="w-3.5 h-3.5" />
                {t('transaction.cancelModal.recommendedAction')}
              </h3>
              <p className="text-xs text-stone-600">{t('transaction.cancelModal.successHint')}</p>
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
        <DialogContent className="sm:max-w-lg">
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
            <div className="rounded-lg border border-stone-200 bg-stone-50 p-3 sm:p-4">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-stone-400">{t('transaction.client')}</span>
                  <p className="font-semibold text-stone-800 truncate">{clientName}</p>
                </div>
                <div>
                  <span className="text-stone-400">{t('transaction.type')}</span>
                  <p className="font-semibold text-stone-800">{transaction.type === 'purchase' ? t('transaction.types.purchase') : t('transaction.types.sale')}</p>
                </div>
                {propertyAddress && (
                  <div>
                    <span className="text-stone-400">{t('transaction.editModal.property')}</span>
                    <p className="font-semibold text-stone-800 truncate">{propertyAddress}</p>
                  </div>
                )}
                {transaction.salePrice && (
                  <div>
                    <span className="text-stone-400">{t('transaction.editModal.salePrice')}</span>
                    <p className="font-semibold text-stone-800">{Number(transaction.salePrice).toLocaleString()} $</p>
                  </div>
                )}
              </div>
              {(transaction.closingDate || transaction.currentStep) && (
                <div className="mt-2 pt-2 border-t border-stone-200 flex items-center gap-2 text-xs">
                  {transaction.closingDate && (
                    <>
                      <span className="text-stone-500">{t('transaction.editModal.offerExpiry')} : <strong>{new Date(transaction.closingDate).toLocaleDateString()}</strong></span>
                    </>
                  )}
                  {transaction.currentStep && transaction.transactionSteps && (
                    <>
                      {transaction.closingDate && <span className="text-stone-400">|</span>}
                      <span className="text-stone-500">{t('transaction.step')} <strong>{transaction.currentStep.stepOrder} / {transaction.transactionSteps.length}</strong></span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Impact section */}
            <div className="rounded-lg border border-indigo-200 bg-indigo-50/50 p-3 sm:p-4 space-y-2">
              <h3 className="text-xs font-semibold text-indigo-800 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" />
                {t('transaction.archiveModal.impact.title')}
              </h3>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <ArrowRight className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                  <span className="text-xs text-stone-700">{t('transaction.archiveModal.impact.hidden')}</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                  <span className="text-xs text-stone-700">{t('transaction.archiveModal.impact.readable')}</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                  <span className="text-xs text-stone-700">{t('transaction.archiveModal.impact.preserved')}</span>
                </div>
                <div className="flex items-start gap-2">
                  <RotateCw className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                  <span className="text-xs text-stone-700">{t('transaction.archiveModal.impact.restorable')}</span>
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
              <span className="text-xs text-stone-700 font-medium">{t('transaction.archiveModal.confirmLabel')}</span>
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
        <DialogContent className="sm:max-w-lg">
          {/* Header banner */}
          <div className="flex items-center gap-2 px-5 sm:px-6 py-2.5 -mx-6 -mt-6 mb-2 bg-indigo-50 border-b border-indigo-100 rounded-t-lg">
            <Archive className="w-4 h-4 text-indigo-500" />
            <span className="text-xs font-semibold text-indigo-700">{t('transaction.archiveModal.successTitle')}</span>
          </div>

          <div className="flex flex-col items-center text-center py-2 space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
              <Check className="w-7 h-7 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-stone-900">{t('transaction.archiveModal.success')}</h3>
              <p className="text-sm text-stone-500 mt-1">{clientName}{propertyAddress ? ` — ${propertyAddress}` : ''}</p>
            </div>

            {/* Status cards */}
            <div className="w-full space-y-2">
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-indigo-50 border border-indigo-100">
                <Archive className="w-4 h-4 text-indigo-500 shrink-0" />
                <span className="text-xs text-indigo-800">{t('transaction.archiveModal.successCard1')}</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50 border border-emerald-100">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-xs text-emerald-800">{t('transaction.archiveModal.successCard2')}</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-stone-50 border border-stone-200">
                <RotateCw className="w-4 h-4 text-stone-500 shrink-0" />
                <span className="text-xs text-stone-600">{t('transaction.archiveModal.successCard3')}</span>
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
        <DialogContent className="sm:max-w-lg border-2 border-red-200">
          {/* Danger banner */}
          <div className="flex items-center gap-2 px-5 sm:px-6 py-2.5 -mx-6 -mt-6 mb-2 bg-red-50 border-b border-red-200 rounded-t-2xl sm:rounded-t-2xl">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <span className="text-xs font-bold text-red-700 uppercase tracking-wide">
              {t('transaction.deleteModal.dangerBanner')} — Mode Admin
            </span>
          </div>

          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-800">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <span>{t('transaction.deleteModal.title')}</span>
                <p className="text-xs text-stone-500 font-normal mt-0.5">{clientName} — {propertyAddress || ''}</p>
              </div>
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
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wide">
                {t('transaction.deleteModal.typeLabel')}{' '}
                <span className="font-mono text-red-600 bg-red-50 px-1.5 py-0.5 rounded normal-case">{deleteTypeWord}</span>
              </label>
              <input
                type="text"
                value={deleteConfirmInput}
                onChange={(e) => setDeleteConfirmInput(e.target.value)}
                placeholder={t('transaction.deleteModal.typePlaceholder')}
                className="w-full px-3 py-2.5 text-sm border border-red-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-300/50 bg-background font-mono"
                autoComplete="off"
                spellCheck="false"
              />
            </div>

            {/* Checkboxes */}
            <div className="space-y-2">
              <label className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg border border-red-100 bg-red-50/50 cursor-pointer">
                <Checkbox
                  checked={deleteCheck1}
                  onCheckedChange={(checked) => setDeleteCheck1(checked === true)}
                  className="mt-0.5 border-red-300 data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500"
                />
                <span className="text-xs text-red-800 font-medium">{t('transaction.deleteModal.check1')}</span>
              </label>
              <label className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg border border-red-100 bg-red-50/50 cursor-pointer">
                <Checkbox
                  checked={deleteCheck2}
                  onCheckedChange={(checked) => setDeleteCheck2(checked === true)}
                  className="mt-0.5 border-red-300 data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500"
                />
                <span className="text-xs text-red-800 font-medium">{t('transaction.deleteModal.check2')}</span>
              </label>
            </div>
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
