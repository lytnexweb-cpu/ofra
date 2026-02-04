import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { offersApi, type CreateOfferRequest } from '../api/offers.api'
import { parseApiError, isSessionExpired, type ParsedError } from '../utils/apiError'

interface CreateOfferModalProps {
  isOpen: boolean
  onClose: () => void
  transactionId: number
}

export default function CreateOfferModal({
  isOpen,
  onClose,
  transactionId,
}: CreateOfferModalProps) {
  const { t } = useTranslation()
  const [formData, setFormData] = useState({
    price: '',
    deposit: '',
    financingAmount: '',
    expiryAt: '',
    direction: 'buyer_to_seller' as CreateOfferRequest['direction'],
    notes: '',
  })
  const [error, setError] = useState<ParsedError | null>(null)
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const createMutation = useMutation({
    mutationFn: (data: CreateOfferRequest) => offersApi.create(transactionId, data),
    onSuccess: async (response) => {
      if (response.success) {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['transaction', transactionId] }),
          queryClient.invalidateQueries({ queryKey: ['offers', transactionId] }),
          queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
        ])
        onClose()
        resetForm()
      } else {
        setError({
          title: t('common.error'),
          message: response.error?.message || t('offers.failedCreate'),
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

  const resetForm = () => {
    setFormData({
      price: '',
      deposit: '',
      financingAmount: '',
      expiryAt: '',
      direction: 'buyer_to_seller',
      notes: '',
    })
    setError(null)
  }

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

    createMutation.mutate({
      price,
      deposit: deposit && !isNaN(deposit) ? deposit : null,
      financingAmount: financingAmount && !isNaN(financingAmount) ? financingAmount : null,
      expiryAt: formData.expiryAt || null,
      direction: formData.direction,
      notes: formData.notes.trim() || null,
    })
  }

  const handleClose = () => {
    if (!createMutation.isPending) {
      resetForm()
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={handleClose} />

      <div className="relative z-10 flex min-h-full items-center justify-center p-4">
        <div className="w-full max-w-lg rounded-xl bg-white dark:bg-gray-800 shadow-xl">
          <form onSubmit={handleSubmit}>
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                {t('offers.new')}
              </h3>

              {error && (
                <div className="mb-4 rounded-md bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 p-4">
                  <h4 className="text-sm font-semibold text-red-800 dark:text-red-300 mb-1">
                    {error.title}
                  </h4>
                  <p className="text-sm text-red-700 dark:text-red-400">{error.message}</p>
                  {error.fieldErrors && (
                    <ul className="mt-2 text-xs text-red-600 dark:text-red-400 list-disc list-inside">
                      {Object.entries(error.fieldErrors).map(([field, messages]) => (
                        <li key={field}>
                          <strong>{field}:</strong> {messages.join(', ')}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label htmlFor="offer-price" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('offers.price')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="offer-price"
                    required
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                    placeholder="425000"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="offer-deposit" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('offers.deposit')}
                    </label>
                    <input
                      type="number"
                      id="offer-deposit"
                      min="0"
                      step="0.01"
                      value={formData.deposit}
                      onChange={(e) => setFormData({ ...formData, deposit: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                      placeholder="20000"
                    />
                  </div>
                  <div>
                    <label htmlFor="offer-financing" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('offers.financingAmount')}
                    </label>
                    <input
                      type="number"
                      id="offer-financing"
                      min="0"
                      step="0.01"
                      value={formData.financingAmount}
                      onChange={(e) => setFormData({ ...formData, financingAmount: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                      placeholder="350000"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="offer-expiry" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('offers.expiryDate')}
                    </label>
                    <input
                      type="datetime-local"
                      id="offer-expiry"
                      value={formData.expiryAt}
                      onChange={(e) => setFormData({ ...formData, expiryAt: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label htmlFor="offer-direction" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('offers.direction')}
                    </label>
                    <select
                      id="offer-direction"
                      value={formData.direction}
                      onChange={(e) =>
                        setFormData({ ...formData, direction: e.target.value as CreateOfferRequest['direction'] })
                      }
                      className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                    >
                      <option value="buyer_to_seller">{t('offers.buyerToSeller')}</option>
                      <option value="seller_to_buyer">{t('offers.sellerToBuyer')}</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="offer-notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('offers.notes')}
                  </label>
                  <textarea
                    id="offer-notes"
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                    placeholder={t('offers.notesPlaceholder')}
                  />
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 flex justify-end gap-3 rounded-b-xl">
              <button
                type="button"
                onClick={handleClose}
                disabled={createMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md hover:bg-gray-50 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {createMutation.isPending ? t('offers.creating') : t('offers.createOffer')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
