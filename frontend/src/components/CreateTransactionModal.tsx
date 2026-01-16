import { useState } from 'react'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  transactionsApi,
  type CreateTransactionRequest,
  type TransactionType,
} from '../api/transactions.api'
import { clientsApi } from '../api/clients.api'
import { parseApiError, isSessionExpired, type ParsedError } from '../utils/apiError'

interface CreateTransactionModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function CreateTransactionModal({
  isOpen,
  onClose,
}: CreateTransactionModalProps) {
  const [formData, setFormData] = useState<CreateTransactionRequest>({
    clientId: 0,
    type: 'purchase',
    counterOfferEnabled: false,
  })
  const [showOfferDetails, setShowOfferDetails] = useState(false)
  const [error, setError] = useState<ParsedError | null>(null)
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const { data: clientsData } = useQuery({
    queryKey: ['clients'],
    queryFn: clientsApi.list,
  })

  const clients = clientsData?.data?.clients || []

  const createMutation = useMutation({
    mutationFn: transactionsApi.create,
    onSuccess: (response) => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: ['transactions'] })
        queryClient.invalidateQueries({ queryKey: ['dashboard'] })
        onClose()
        resetForm()
      } else {
        setError({
          title: 'Error',
          message: response.error?.message || 'Failed to create transaction',
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
      clientId: 0,
      type: 'purchase',
      counterOfferEnabled: false,
    })
    setShowOfferDetails(false)
    setError(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.clientId) {
      setError({
        title: 'Required Field',
        message: 'Please select a client.',
      })
      return
    }

    // Validate counterOffer logic
    if (formData.counterOfferEnabled && !formData.counterOfferPrice) {
      setError({
        title: 'Required Field',
        message: 'Counter offer price is required when counter offer is enabled.',
      })
      return
    }

    // Helper: parse number or return undefined
    const parseNumber = (value: any): number | undefined => {
      if (value === null || value === undefined || value === '') return undefined
      const num = typeof value === 'string' ? parseFloat(value) : value
      return isNaN(num) || num < 0 ? undefined : num
    }

    // Helper: parse datetime-local string to ISO or undefined
    const parseDatetime = (value: any): string | undefined => {
      if (!value || value === '') return undefined
      // datetime-local format: "YYYY-MM-DDTHH:mm" -> convert to ISO string for backend
      return value
    }

    // Build payload: only include fields if they have values (not empty strings or 0 when untouched)
    const payload: any = {
      clientId: formData.clientId,
      type: formData.type,
    }

    // Optional basic fields
    if (formData.salePrice) payload.salePrice = parseNumber(formData.salePrice)
    if (formData.notesText?.trim()) payload.notesText = formData.notesText.trim()

    // Offer Details: only include if showOfferDetails was opened and user filled them
    if (showOfferDetails) {
      const listPriceNum = parseNumber(formData.listPrice)
      const offerPriceNum = parseNumber(formData.offerPrice)
      const counterOfferPriceNum = parseNumber(formData.counterOfferPrice)
      const commissionNum = parseNumber(formData.commission)
      const expiryDate = parseDatetime(formData.offerExpiryAt)

      if (listPriceNum !== undefined) payload.listPrice = listPriceNum
      if (offerPriceNum !== undefined) payload.offerPrice = offerPriceNum
      if (expiryDate !== undefined) payload.offerExpiryAt = expiryDate
      if (commissionNum !== undefined) payload.commission = commissionNum

      // Counter offer logic
      payload.counterOfferEnabled = formData.counterOfferEnabled || false
      if (formData.counterOfferEnabled && counterOfferPriceNum !== undefined) {
        payload.counterOfferPrice = counterOfferPriceNum
      }
    }

    createMutation.mutate(payload)
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
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40" onClick={handleClose} />

      {/* Modal content */}
      <div className="relative z-10 flex min-h-full items-center justify-center p-4">
        <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
          <form onSubmit={handleSubmit}>
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                New Transaction
              </h3>

              {error && (
                <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-4">
                  <h4 className="text-sm font-semibold text-red-800 mb-1">
                    {error.title}
                  </h4>
                  <p className="text-sm text-red-700">{error.message}</p>
                  {error.fieldErrors && (
                    <ul className="mt-2 text-xs text-red-600 list-disc list-inside">
                      {Object.entries(error.fieldErrors).map(([field, messages]) => (
                        <li key={field}>
                          <strong>{field}:</strong> {messages.join(', ')}
                        </li>
                      ))}
                    </ul>
                  )}
                  {isSessionExpired(error) && (
                    <button
                      type="button"
                      onClick={() => navigate('/login')}
                      className="mt-2 text-sm font-medium text-red-800 underline hover:text-red-900"
                    >
                      Go to login page →
                    </button>
                  )}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="clientId"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Client <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="clientId"
                    required
                    value={formData.clientId}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        clientId: parseInt(e.target.value),
                      })
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="0">Select a client...</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.firstName} {client.lastName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="type"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="type"
                    required
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        type: e.target.value as TransactionType,
                      })
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="purchase">Purchase</option>
                    <option value="sale">Sale</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="salePrice"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Sale Price
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <span className="text-gray-500 sm:text-sm">$</span>
                    </div>
                    <input
                      type="number"
                      id="salePrice"
                      value={formData.salePrice || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          salePrice: e.target.value
                            ? parseFloat(e.target.value)
                            : undefined,
                        })
                      }
                      className="block w-full border border-gray-300 rounded-md py-2 pl-7 pr-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="0.00"
                      step="0.01"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="notes"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Notes
                  </label>
                  <textarea
                    id="notes"
                    rows={3}
                    value={formData.notesText || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, notesText: e.target.value })
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                {/* Offer Details Section (Collapsible) */}
                <div className="border-t border-gray-200 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowOfferDetails(!showOfferDetails)}
                    className="flex items-center justify-between w-full text-left text-sm font-medium text-gray-700 hover:text-gray-900"
                  >
                    <span>Offer Details (optional)</span>
                    <svg
                      className={`w-5 h-5 transition-transform ${showOfferDetails ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {showOfferDetails && (
                    <div className="mt-4 space-y-4">
                      <div>
                        <label
                          htmlFor="listPrice"
                          className="block text-sm font-medium text-gray-700"
                        >
                          List Price
                        </label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <span className="text-gray-500 sm:text-sm">$</span>
                          </div>
                          <input
                            type="number"
                            id="listPrice"
                            value={formData.listPrice || ''}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                listPrice: e.target.value
                                  ? parseFloat(e.target.value)
                                  : undefined,
                              })
                            }
                            className="block w-full border border-gray-300 rounded-md py-2 pl-7 pr-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="0.00"
                            step="0.01"
                            min="0"
                          />
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="offerPrice"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Offer Price
                        </label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <span className="text-gray-500 sm:text-sm">$</span>
                          </div>
                          <input
                            type="number"
                            id="offerPrice"
                            value={formData.offerPrice || ''}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                offerPrice: e.target.value
                                  ? parseFloat(e.target.value)
                                  : undefined,
                              })
                            }
                            className="block w-full border border-gray-300 rounded-md py-2 pl-7 pr-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="0.00"
                            step="0.01"
                            min="0"
                          />
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="offerExpiryAt"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Offer Expiry
                        </label>
                        <input
                          type="datetime-local"
                          id="offerExpiryAt"
                          value={formData.offerExpiryAt || ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              offerExpiryAt: e.target.value || undefined,
                            })
                          }
                          className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      </div>

                      <div>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.counterOfferEnabled || false}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                counterOfferEnabled: e.target.checked,
                                counterOfferPrice: e.target.checked
                                  ? formData.counterOfferPrice
                                  : undefined,
                              })
                            }
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm font-medium text-gray-700">
                            Counter offer?
                          </span>
                        </label>
                      </div>

                      {formData.counterOfferEnabled && (
                        <div>
                          <label
                            htmlFor="counterOfferPrice"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Counter Offer Price{' '}
                            <span className="text-red-500">*</span>
                          </label>
                          <div className="mt-1 relative rounded-md shadow-sm">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                              <span className="text-gray-500 sm:text-sm">$</span>
                            </div>
                            <input
                              type="number"
                              id="counterOfferPrice"
                              value={formData.counterOfferPrice || ''}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  counterOfferPrice: e.target.value
                                    ? parseFloat(e.target.value)
                                    : undefined,
                                })
                              }
                              className="block w-full border border-gray-300 rounded-md py-2 pl-7 pr-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              placeholder="0.00"
                              step="0.01"
                              min="0"
                            />
                          </div>
                        </div>
                      )}

                      <div>
                        <label
                          htmlFor="commission"
                          className="block text-sm font-medium text-gray-500"
                        >
                          Commission{' '}
                          <span className="text-xs font-normal text-gray-400">
                            (Internal / optional)
                          </span>
                        </label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <span className="text-gray-500 sm:text-sm">$</span>
                          </div>
                          <input
                            type="number"
                            id="commission"
                            value={formData.commission || ''}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                commission: e.target.value
                                  ? parseFloat(e.target.value)
                                  : undefined,
                              })
                            }
                            className="block w-full border border-gray-300 rounded-md py-2 pl-7 pr-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="0.00"
                            step="0.01"
                            min="0"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 rounded-b-xl">
              <button
                type="button"
                onClick={handleClose}
                disabled={createMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {createMutation.isPending
                  ? 'Creating...'
                  : 'Create Transaction'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
