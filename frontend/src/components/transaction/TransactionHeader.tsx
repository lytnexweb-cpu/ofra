import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, Link } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, MoreVertical, XCircle, Trash2, AlertTriangle } from 'lucide-react'
import { transactionsApi, type Transaction } from '../../api/transactions.api'
import { toast } from '../../hooks/use-toast'
import { Button } from '../ui/Button'
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
  DropdownMenuTrigger,
} from '../ui/DropdownMenu'

interface TransactionHeaderProps {
  transaction: Transaction
}

const CANCELLATION_REASONS = [
  'offer_rejected',
  'buyer_withdrew',
  'financing_refused',
  'inspection_issues',
  'seller_withdrew',
  'other',
] as const

export default function TransactionHeader({ transaction }: TransactionHeaderProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Cancel modal state
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleteConfirmInput, setDeleteConfirmInput] = useState('')
  const [deleteTermsAccepted, setDeleteTermsAccepted] = useState(false)

  const clientName = transaction.client
    ? `${transaction.client.firstName} ${transaction.client.lastName}`
    : t('transaction.client')

  const propertyAddress = transaction.property?.address ?? null

  // Delete confirmation phrase from translations
  const deleteConfirmPhrase = t('transaction.deleteModal.confirmPhrase')

  // Check if delete confirmation is valid
  const isDeleteConfirmValid = useMemo(() => {
    const inputNormalized = deleteConfirmInput.trim().toLowerCase()
    const phraseNormalized = deleteConfirmPhrase.toLowerCase()
    return inputNormalized === phraseNormalized && deleteTermsAccepted
  }, [deleteConfirmInput, deleteConfirmPhrase, deleteTermsAccepted])

  // Reset modals
  const handleCancelModalClose = () => {
    setCancelModalOpen(false)
    setCancelReason('')
  }

  const handleDeleteModalClose = () => {
    setDeleteModalOpen(false)
    setDeleteConfirmInput('')
    setDeleteTermsAccepted(false)
  }

  // Cancel mutation
  const cancelMutation = useMutation({
    mutationFn: () => transactionsApi.cancel(transaction.id, cancelReason),
    onSuccess: (response) => {
      if (response.success) {
        toast({
          title: t('common.success'),
          description: t('transaction.cancelModal.success'),
          variant: 'success',
        })
        handleCancelModalClose()
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
      toast({
        title: t('common.success'),
        description: t('transaction.deleteModal.success'),
        variant: 'success',
      })
      handleDeleteModalClose()
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      navigate('/transactions')
    },
    onError: () => {
      toast({ title: t('common.error'), variant: 'destructive' })
    },
  })

  const isCancelled = transaction.status === 'cancelled'
  const isCompleted = !transaction.currentStepId

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

          {/* Actions menu */}
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
            <DropdownMenuContent align="end">
              {!isCancelled && !isCompleted && (
                <DropdownMenuItem
                  onClick={() => setCancelModalOpen(true)}
                  className="text-amber-600 focus:text-amber-600"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  {t('transaction.actions.cancel')}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setDeleteModalOpen(true)}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {t('transaction.actions.delete')}
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

      {/* Cancel Modal - Simple confirmation */}
      <Dialog open={cancelModalOpen} onOpenChange={(open) => !open && handleCancelModalClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <XCircle className="w-5 h-5" />
              {t('transaction.cancelModal.title')}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground pt-2">
              {t('transaction.cancelModal.description')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t('transaction.cancelModal.reason')}
              </label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background"
              >
                <option value="">{t('transaction.cancelModal.reasonPlaceholder')}</option>
                {CANCELLATION_REASONS.map((reason) => (
                  <option key={reason} value={reason}>
                    {t(`transaction.cancelModal.reasons.${reason}`)}
                  </option>
                ))}
              </select>
            </div>
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
              disabled={!cancelReason || cancelMutation.isPending}
            >
              {cancelMutation.isPending ? t('common.loading') : t('transaction.cancelModal.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Modal - Type-to-confirm */}
      <Dialog open={deleteModalOpen} onOpenChange={(open) => !open && handleDeleteModalClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              {t('transaction.deleteModal.title')}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground pt-2">
              {t('transaction.deleteModal.warning', { client: clientName })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Type-to-confirm instruction */}
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {t('transaction.deleteModal.typePhrase')}
              </p>
              <p className="text-sm font-medium text-foreground bg-red-50 px-3 py-2 rounded-md border border-red-200 select-all">
                {deleteConfirmPhrase}
              </p>
              <input
                type="text"
                value={deleteConfirmInput}
                onChange={(e) => setDeleteConfirmInput(e.target.value)}
                placeholder={t('transaction.deleteModal.inputPlaceholder')}
                className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500/50 bg-background"
                autoComplete="off"
                spellCheck="false"
              />
            </div>

            {/* Terms acceptance checkbox */}
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={deleteTermsAccepted}
                onChange={(e) => setDeleteTermsAccepted(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-input accent-red-600 cursor-pointer"
              />
              <span className="text-sm text-muted-foreground">
                {t('transaction.deleteModal.termsLabel')}{' '}
                <Link
                  to="/terms"
                  target="_blank"
                  className="text-primary hover:underline"
                >
                  {t('transaction.deleteModal.termsLink')}
                </Link>
                .
              </span>
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
    </>
  )
}
