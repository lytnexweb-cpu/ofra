import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { offersApi, type AddRevisionRequest } from '../api/offers.api'
import type { OfferRevision } from '../api/transactions.api'
import { parseApiError, isSessionExpired, type ParsedError } from '../utils/apiError'

interface CounterOfferModalProps {
  isOpen: boolean
  onClose: () => void
  offerId: number
  transactionId: number
  lastRevision: OfferRevision
}

export default function CounterOfferModal({
  isOpen,
  onClose,
  offerId,
  transactionId,
  lastRevision,
}: CounterOfferModalProps) {
  const { t } = useTranslation()
  const invertedDirection: AddRevisionRequest['direction'] =
    lastRevision.direction === 'buyer_to_seller' ? 'seller_to_buyer' : 'buyer_to_seller'

  const [formData, setFormData] = useState({
    price: String(lastRevision.price),
    deposit: lastRevision.deposit != null ? String(lastRevision.deposit) : '',
    financingAmount: lastRevision.financingAmount != null ? String(lastRevision.financingAmount) : '',
    expiryAt: '',
    direction: invertedDirection,
    notes: '',
  })
  const [error, setError] = useState<ParsedError | null>(null)
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  // Re-sync form when lastRevision changes (e.g. modal reopened for different offer)
  useEffect(() => {
    if (isOpen) {
      const inverted: AddRevisionRequest['direction'] =
        lastRevision.direction === 'buyer_to_seller' ? 'seller_to_buyer' : 'buyer_to_seller'
      setFormData({
        price: String(lastRevision.price),
        deposit: lastRevision.deposit != null ? String(lastRevision.deposit) : '',
        financingAmount: lastRevision.financingAmount != null ? String(lastRevision.financingAmount) : '',
        expiryAt: '',
        direction: inverted,
        notes: '',
      })
      setError(null)
    }
  }, [isOpen, lastRevision])

  const counterMutation = useMutation({
    mutationFn: (data: AddRevisionRequest) => offersApi.addRevision(offerId, data),
    onSuccess: async (response) => {
      if (response.success) {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['transaction', transactionId] }),
          queryClient.invalidateQueries({ queryKey: ['offers', transactionId] }),
          queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
        ])
        onClose()
      } else {
        setError({
          title: t('common.error'),
          message: response.error?.message || t('offers.failedCounter'),
        })
      }
    },
    onError: (err) => {
      const parsedError = parseApiError(err)
      setError(parsedError)

      if (isSessionExpired(err)) {
        setTimeout(() => {
          navigate('/login')
        }, 2000)
      }
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const price = parseFloat(formData.price)
    if (!formData.price || isNaN(price) || price <= 0) {
      setError({
        title: t('offers.requiredFields'),
        message: t('offers.validPriceRequired'),
      })
      return
    }

    const deposit = formData.deposit ? parseFloat(formData.deposit) : null
    const financingAmount = formData.financingAmount ? parseFloat(formData.financingAmount) : null

    // Auto-invert party IDs from last revision
    const fromPartyId = lastRevision.toPartyId ?? undefined
    const toPartyId = lastRevision.fromPartyId ?? undefined

    counterMutation.mutate({
      price,
      deposit: deposit && !isNaN(deposit) ? deposit : null,
      financingAmount: financingAmount && !isNaN(financingAmount) ? financingAmount : null,
      expiryAt: formData.expiryAt || null,
      direction: formData.direction,
      notes: formData.notes.trim() || null,
      fromPartyId,
      toPartyId,
    })
  }

  const handleClose = () => {
    if (!counterMutation.isPending) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={handleClose} />

      <div className="relative z-10 flex min-h-full items-center justify-center p-4">
        <div className="w-full max-w-lg rounded-xl bg-white dark:bg-stone-800 shadow-xl">
          <form onSubmit={handleSubmit}>
            <div className="p-6">
              <h3 className="text-lg font-medium text-stone-900 dark:text-white mb-4">
                {t('offers.counterOffer')}
              </h3>

              {error && (
                <div className="mb-4 rounded-md bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 p-4">
                  <h4 className="text-sm font-semibold text-red-800 dark:text-red-300 mb-1">
                    {error.title}
                  </h4>
                  <p className="text-sm text-red-700 dark:text-red-400">{error.message}</p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label htmlFor="counter-price" className="block text-sm font-medium text-stone-700 dark:text-stone-300">
                    {t('offers.price')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="counter-price"
                    required
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="mt-1 block w-full border border-stone-300 dark:border-stone-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-stone-700 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="counter-deposit" className="block text-sm font-medium text-stone-700 dark:text-stone-300">
                      {t('offers.deposit')}
                    </label>
                    <input
                      type="number"
                      id="counter-deposit"
                      min="0"
                      step="0.01"
                      value={formData.deposit}
                      onChange={(e) => setFormData({ ...formData, deposit: e.target.value })}
                      className="mt-1 block w-full border border-stone-300 dark:border-stone-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-stone-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label htmlFor="counter-financing" className="block text-sm font-medium text-stone-700 dark:text-stone-300">
                      {t('offers.financingAmount')}
                    </label>
                    <input
                      type="number"
                      id="counter-financing"
                      min="0"
                      step="0.01"
                      value={formData.financingAmount}
                      onChange={(e) => setFormData({ ...formData, financingAmount: e.target.value })}
                      className="mt-1 block w-full border border-stone-300 dark:border-stone-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-stone-700 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="counter-expiry" className="block text-sm font-medium text-stone-700 dark:text-stone-300">
                      {t('offers.expiryDate')}
                    </label>
                    <input
                      type="datetime-local"
                      id="counter-expiry"
                      value={formData.expiryAt}
                      onChange={(e) => setFormData({ ...formData, expiryAt: e.target.value })}
                      className="mt-1 block w-full border border-stone-300 dark:border-stone-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-stone-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label htmlFor="counter-direction" className="block text-sm font-medium text-stone-700 dark:text-stone-300">
                      {t('offers.direction')}
                    </label>
                    <select
                      id="counter-direction"
                      value={formData.direction}
                      onChange={(e) =>
                        setFormData({ ...formData, direction: e.target.value as AddRevisionRequest['direction'] })
                      }
                      className="mt-1 block w-full border border-stone-300 dark:border-stone-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-stone-700 dark:text-white"
                    >
                      <option value="buyer_to_seller">{t('offers.buyerToSeller')}</option>
                      <option value="seller_to_buyer">{t('offers.sellerToBuyer')}</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="counter-notes" className="block text-sm font-medium text-stone-700 dark:text-stone-300">
                    {t('offers.notes')}
                  </label>
                  <textarea
                    id="counter-notes"
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="mt-1 block w-full border border-stone-300 dark:border-stone-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-stone-700 dark:text-white"
                    placeholder={t('offers.counterNotesPlaceholder')}
                  />
                </div>
              </div>
            </div>

            <div className="bg-stone-50 dark:bg-stone-700 px-6 py-4 flex justify-end gap-3 rounded-b-xl">
              <button
                type="button"
                onClick={handleClose}
                disabled={counterMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-stone-700 dark:text-stone-300 bg-white dark:bg-stone-600 border border-stone-300 dark:border-stone-500 rounded-md hover:bg-stone-50 dark:hover:bg-stone-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={counterMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {counterMutation.isPending ? t('offers.submitting') : t('offers.submitCounterOffer')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
