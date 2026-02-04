import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, motion } from 'framer-motion'
import { offersApi } from '../api/offers.api'
import type { Offer, OfferRevision, OfferStatus } from '../api/transactions.api'
import { parseApiError, isSessionExpired } from '../utils/apiError'
import ConfirmDialog from './ConfirmDialog'
import CreateOfferModal from './CreateOfferModal'
import CounterOfferModal from './CounterOfferModal'

interface OffersSectionProps {
  transactionId: number
  transactionStatus: string
}

const statusBadgeClasses: Record<OfferStatus, string> = {
  received: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  countered: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
  accepted: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  expired: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  withdrawn: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
}

function formatCAD(amount: number): string {
  return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount)
}

function getLastRevision(offer: Offer): OfferRevision | null {
  if (!offer.revisions || offer.revisions.length === 0) return null
  return offer.revisions.reduce((latest, rev) =>
    rev.revisionNumber > latest.revisionNumber ? rev : latest
  , offer.revisions[0])
}

export default function OffersSection({ transactionId, transactionStatus: _transactionStatus }: OffersSectionProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const [expandedOfferId, setExpandedOfferId] = useState<number | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  // Counter-offer modal state
  const [counterOffer, setCounterOffer] = useState<{ offerId: number; lastRevision: OfferRevision } | null>(null)

  // Confirm dialog states
  const [acceptConfirm, setAcceptConfirm] = useState<{ isOpen: boolean; offerId: number | null }>({ isOpen: false, offerId: null })
  const [rejectConfirm, setRejectConfirm] = useState<{ isOpen: boolean; offerId: number | null }>({ isOpen: false, offerId: null })
  const [withdrawConfirm, setWithdrawConfirm] = useState<{ isOpen: boolean; offerId: number | null }>({ isOpen: false, offerId: null })
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; offerId: number | null }>({ isOpen: false, offerId: null })

  const { data: offersData, isLoading } = useQuery({
    queryKey: ['offers', transactionId],
    queryFn: () => offersApi.list(transactionId),
  })

  const offers: Offer[] = offersData?.success ? (offersData.data as any)?.offers ?? (offersData as any).offers ?? [] : []

  const invalidateAll = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['transaction', transactionId] }),
      queryClient.invalidateQueries({ queryKey: ['offers', transactionId] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
    ])
  }

  const handleMutationError = (err: unknown) => {
    const parsed = parseApiError(err)
    alert(parsed.message)
    if (isSessionExpired(err)) {
      setTimeout(() => navigate('/login'), 2000)
    }
  }

  const acceptMutation = useMutation({
    mutationFn: (offerId: number) => offersApi.accept(offerId),
    onSuccess: async (response) => {
      if (response.success) {
        await invalidateAll()
      } else {
        alert(response.error?.message || t('offers.errors.acceptFailed'))
      }
      setAcceptConfirm({ isOpen: false, offerId: null })
    },
    onError: (err) => {
      handleMutationError(err)
      setAcceptConfirm({ isOpen: false, offerId: null })
    },
  })

  const rejectMutation = useMutation({
    mutationFn: (offerId: number) => offersApi.reject(offerId),
    onSuccess: async (response) => {
      if (response.success) {
        await invalidateAll()
      } else {
        alert(response.error?.message || t('offers.errors.rejectFailed'))
      }
      setRejectConfirm({ isOpen: false, offerId: null })
    },
    onError: (err) => {
      handleMutationError(err)
      setRejectConfirm({ isOpen: false, offerId: null })
    },
  })

  const withdrawMutation = useMutation({
    mutationFn: (offerId: number) => offersApi.withdraw(offerId),
    onSuccess: async (response) => {
      if (response.success) {
        await invalidateAll()
      } else {
        alert(response.error?.message || t('offers.errors.withdrawFailed'))
      }
      setWithdrawConfirm({ isOpen: false, offerId: null })
    },
    onError: (err) => {
      handleMutationError(err)
      setWithdrawConfirm({ isOpen: false, offerId: null })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (offerId: number) => offersApi.delete(offerId),
    onSuccess: async (response) => {
      if (response.success) {
        await invalidateAll()
      } else {
        alert(response.error?.message || t('offers.errors.deleteFailed'))
      }
      setDeleteConfirm({ isOpen: false, offerId: null })
    },
    onError: (err) => {
      handleMutationError(err)
      setDeleteConfirm({ isOpen: false, offerId: null })
    },
  })

  const canTakeAction = (status: OfferStatus) => status === 'received' || status === 'countered'

  const getStatusLabel = (status: OfferStatus): string => {
    return t(`offers.status.${status}`)
  }

  const getDirectionLabel = (dir: string): string => {
    return dir === 'buyer_to_seller'
      ? t('offers.direction.buyerToSellerShort')
      : t('offers.direction.sellerToBuyerShort')
  }

  const getDirectionLabelFull = (dir: string): string => {
    return dir === 'buyer_to_seller'
      ? t('offers.direction.buyerToSeller')
      : t('offers.direction.sellerToBuyer')
  }

  return (
    <div className="bg-white dark:bg-stone-800 shadow sm:rounded-lg overflow-hidden">
      <div className="px-4 py-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
            {t('offers.title')}
          </h3>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center justify-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring w-full sm:w-auto"
          >
            {t('offers.newButton')}
          </button>
        </div>

        {isLoading ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('offers.loading')}</p>
        ) : offers.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('offers.empty')}</p>
        ) : (
          <div className="space-y-3">
            {offers.map((offer) => {
              const lastRev = getLastRevision(offer)
              const isExpanded = expandedOfferId === offer.id
              const badgeClasses = statusBadgeClasses[offer.status]

              return (
                <div
                  key={offer.id}
                  className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden"
                >
                  {/* Offer card header */}
                  <button
                    type="button"
                    onClick={() => setExpandedOfferId(isExpanded ? null : offer.id)}
                    className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeClasses}`}>
                        {getStatusLabel(offer.status)}
                      </span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {lastRev ? formatCAD(lastRev.price) : '—'}
                      </span>
                      {lastRev && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {getDirectionLabelFull(lastRev.direction)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(offer.createdAt).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })}
                      </span>
                      <svg
                        className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {/* Expanded detail */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-700">
                          {/* Revision History */}
                          {offer.revisions && offer.revisions.length > 0 && (
                            <div className="mt-3">
                              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                                {t('offers.revisionHistory')}
                              </h4>
                              <div className="space-y-2">
                                {[...offer.revisions]
                                  .sort((a, b) => a.revisionNumber - b.revisionNumber)
                                  .map((rev) => (
                                    <div
                                      key={rev.id}
                                      className="flex items-start gap-3 text-sm"
                                    >
                                      <div className="flex-shrink-0 mt-1.5 w-2 h-2 rounded-full bg-blue-400 dark:bg-blue-500" />
                                      <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                          <span className="font-medium text-gray-700 dark:text-gray-300">
                                            #{rev.revisionNumber}
                                          </span>
                                          <span className="text-gray-500 dark:text-gray-400">
                                            {new Date(rev.createdAt).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })}
                                          </span>
                                          <span className="text-gray-500 dark:text-gray-400">
                                            {getDirectionLabel(rev.direction)}
                                          </span>
                                          <span className="font-semibold text-gray-900 dark:text-white">
                                            {formatCAD(rev.price)}
                                          </span>
                                          {rev.deposit != null && (
                                            <span className="text-gray-500 dark:text-gray-400">
                                              {t('offers.deposit')}: {formatCAD(rev.deposit)}
                                            </span>
                                          )}
                                          {rev.financingAmount != null && (
                                            <span className="text-gray-500 dark:text-gray-400">
                                              {t('offers.financing')}: {formatCAD(rev.financingAmount)}
                                            </span>
                                          )}
                                        </div>
                                        {rev.notes && (
                                          <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500 italic">
                                            {rev.notes}
                                          </p>
                                        )}
                                        {rev.expiryAt && (
                                          <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                                            {t('offers.expires')}: {new Date(rev.expiryAt).toLocaleString('en-CA')}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          )}

                          {/* Action buttons */}
                          <div className="mt-4 flex flex-wrap items-center gap-2">
                            {canTakeAction(offer.status) && (
                              <>
                                <button
                                  onClick={() => setAcceptConfirm({ isOpen: true, offerId: offer.id })}
                                  className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                >
                                  {t('offers.accept')}
                                </button>
                                {lastRev && (
                                  <button
                                    onClick={() => setCounterOffer({ offerId: offer.id, lastRevision: lastRev })}
                                    className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                  >
                                    {t('offers.counter')}
                                  </button>
                                )}
                                <button
                                  onClick={() => setRejectConfirm({ isOpen: true, offerId: offer.id })}
                                  className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                >
                                  {t('offers.reject')}
                                </button>
                                <button
                                  onClick={() => setWithdrawConfirm({ isOpen: true, offerId: offer.id })}
                                  className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                                >
                                  {t('offers.withdraw')}
                                </button>
                              </>
                            )}
                            {offer.status !== 'accepted' && (
                              <button
                                onClick={() => setDeleteConfirm({ isOpen: true, offerId: offer.id })}
                                className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                              >
                                {t('offers.delete')}
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Create Offer Modal */}
      <CreateOfferModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        transactionId={transactionId}
      />

      {/* Counter-Offer Modal */}
      {counterOffer && (
        <CounterOfferModal
          isOpen={true}
          onClose={() => setCounterOffer(null)}
          offerId={counterOffer.offerId}
          transactionId={transactionId}
          lastRevision={counterOffer.lastRevision}
        />
      )}

      {/* Confirm Dialogs */}
      <ConfirmDialog
        isOpen={acceptConfirm.isOpen}
        onClose={() => setAcceptConfirm({ isOpen: false, offerId: null })}
        onConfirm={() => acceptConfirm.offerId && acceptMutation.mutate(acceptConfirm.offerId)}
        title={t('offers.confirm.acceptTitle')}
        message={t('offers.confirm.acceptMessage')}
        confirmLabel={t('offers.accept')}
        variant="warning"
        isLoading={acceptMutation.isPending}
      />

      <ConfirmDialog
        isOpen={rejectConfirm.isOpen}
        onClose={() => setRejectConfirm({ isOpen: false, offerId: null })}
        onConfirm={() => rejectConfirm.offerId && rejectMutation.mutate(rejectConfirm.offerId)}
        title={t('offers.confirm.rejectTitle')}
        message={t('offers.confirm.rejectMessage')}
        confirmLabel={t('offers.reject')}
        variant="danger"
        isLoading={rejectMutation.isPending}
      />

      <ConfirmDialog
        isOpen={withdrawConfirm.isOpen}
        onClose={() => setWithdrawConfirm({ isOpen: false, offerId: null })}
        onConfirm={() => withdrawConfirm.offerId && withdrawMutation.mutate(withdrawConfirm.offerId)}
        title={t('offers.confirm.withdrawTitle')}
        message={t('offers.confirm.withdrawMessage')}
        confirmLabel={t('offers.withdraw')}
        variant="warning"
        isLoading={withdrawMutation.isPending}
      />

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, offerId: null })}
        onConfirm={() => deleteConfirm.offerId && deleteMutation.mutate(deleteConfirm.offerId)}
        title={t('offers.confirm.deleteTitle')}
        message={t('offers.confirm.deleteMessage')}
        confirmLabel={t('offers.delete')}
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
