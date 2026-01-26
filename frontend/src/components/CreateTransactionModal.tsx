import { useState, useEffect } from 'react'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  transactionsApi,
  type CreateTransactionRequest,
  type TransactionType,
} from '../api/transactions.api'
import { clientsApi } from '../api/clients.api'
import { templatesApi, type TransactionTemplate } from '../api/templates.api'
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
  })
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null)
  const [error, setError] = useState<ParsedError | null>(null)
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const { data: clientsData } = useQuery({
    queryKey: ['clients'],
    queryFn: clientsApi.list,
  })

  const { data: templatesData } = useQuery({
    queryKey: ['templates', formData.type],
    queryFn: () => templatesApi.list({ type: formData.type }),
    enabled: isOpen,
  })

  const clients = clientsData?.data?.clients || []
  const templates = templatesData?.data?.templates || []

  // Auto-select default template when templates load or type changes
  useEffect(() => {
    if (templates.length > 0) {
      const defaultTemplate = templates.find((t: TransactionTemplate) => t.isDefault)
      if (defaultTemplate) {
        setSelectedTemplateId(defaultTemplate.id)
      } else {
        setSelectedTemplateId(null)
      }
    } else {
      setSelectedTemplateId(null)
    }
  }, [templates])

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
    })
    setSelectedTemplateId(null)
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

    const payload: CreateTransactionRequest = {
      clientId: formData.clientId,
      type: formData.type,
    }

    if (selectedTemplateId) {
      payload.templateId = selectedTemplateId
    }

    if (formData.salePrice) payload.salePrice = formData.salePrice
    if (formData.notesText?.trim()) payload.notesText = formData.notesText.trim()

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
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="purchase">Purchase</option>
                    <option value="sale">Sale</option>
                  </select>
                </div>

                {/* Template Selector */}
                {templates.length > 0 && (
                  <div>
                    <label
                      htmlFor="templateId"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Template
                    </label>
                    <select
                      id="templateId"
                      value={selectedTemplateId || ''}
                      onChange={(e) =>
                        setSelectedTemplateId(
                          e.target.value ? parseInt(e.target.value) : null
                        )
                      }
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="">No template (start from scratch)</option>
                      {templates.map((template: TransactionTemplate) => (
                        <option key={template.id} value={template.id}>
                          {template.name}
                          {template.isDefault ? ' (Recommended)' : ''}
                          {template.conditions?.length
                            ? ` - ${template.conditions.length} conditions`
                            : ''}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Templates auto-create conditions with pre-configured due dates
                    </p>
                  </div>
                )}

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
