import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  conditionsApi,
  type CreateConditionRequest,
  type ConditionStage,
} from '../api/conditions.api'
import { parseApiError, isSessionExpired, type ParsedError } from '../utils/apiError'

interface CreateConditionModalProps {
  isOpen: boolean
  onClose: () => void
  transactionId: number
}

export default function CreateConditionModal({
  isOpen,
  onClose,
  transactionId,
}: CreateConditionModalProps) {
  const [formData, setFormData] = useState<Omit<CreateConditionRequest, 'transactionId'>>({
    title: '',
    dueDate: '',
    description: '',
    type: 'financing',
    priority: 'medium',
    stage: undefined, // Will be auto-set by backend to current transaction status
    isBlocking: true, // Default to blocking
    documentUrl: '',
    documentLabel: '',
  })
  const [error, setError] = useState<ParsedError | null>(null)
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const createMutation = useMutation({
    mutationFn: conditionsApi.create,
    onSuccess: async (response) => {
      if (response.success) {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['transaction', transactionId] }),
          queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
        ])
        onClose()
        resetForm()
      } else {
        setError({
          title: 'Error',
          message: response.error?.message || 'Failed to create condition',
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
      title: '',
      dueDate: '',
      description: '',
      type: 'financing',
      priority: 'medium',
      stage: undefined,
      isBlocking: true,
      documentUrl: '',
      documentLabel: '',
    })
    setError(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.title.trim() || !formData.dueDate) {
      setError({
        title: 'Required Fields',
        message: 'Title and due date are required.',
      })
      return
    }

    createMutation.mutate({
      transactionId,
      title: formData.title.trim(),
      dueDate: formData.dueDate,
      description: formData.description?.trim() || undefined,
      type: formData.type,
      priority: formData.priority,
      stage: formData.stage,
      isBlocking: formData.isBlocking,
      documentUrl: formData.documentUrl?.trim() || undefined,
      documentLabel: formData.documentLabel?.trim() || undefined,
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
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40" onClick={handleClose} />

      {/* Modal content */}
      <div className="relative z-10 flex min-h-full items-center justify-center p-4">
        <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
          <form onSubmit={handleSubmit}>
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                New Condition
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
                    htmlFor="title"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="title"
                    required
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label
                    htmlFor="dueDate"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Due Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="dueDate"
                    required
                    value={formData.dueDate}
                    onChange={(e) =>
                      setFormData({ ...formData, dueDate: e.target.value })
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="type"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Type
                    </label>
                    <select
                      id="type"
                      value={formData.type}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          type: e.target.value as typeof formData.type,
                        })
                      }
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="financing">Financing</option>
                      <option value="deposit">Deposit</option>
                      <option value="inspection">Inspection</option>
                      <option value="water_test">Water Test</option>
                      <option value="rpds_review">RPDS Review</option>
                      <option value="appraisal">Appraisal</option>
                      <option value="legal">Legal</option>
                      <option value="documents">Documents</option>
                      <option value="repairs">Repairs</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="priority"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Priority
                    </label>
                    <select
                      id="priority"
                      value={formData.priority}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          priority: e.target.value as typeof formData.priority,
                        })
                      }
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="stage"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Stage
                  </label>
                  <select
                    id="stage"
                    value={formData.stage || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        stage: e.target.value ? (e.target.value as ConditionStage) : undefined,
                      })
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="">Auto (Current transaction status)</option>
                    <option value="consultation">Consultation</option>
                    <option value="offer">Offer Submitted</option>
                    <option value="accepted">Offer Accepted</option>
                    <option value="conditions">Conditional Period</option>
                    <option value="notary">Firm</option>
                    <option value="closing">Closing</option>
                    <option value="completed">Completed</option>
                    <option value="canceled">Canceled</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    Leave "Auto" to use current transaction status
                  </p>
                </div>

                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="isBlocking"
                      type="checkbox"
                      checked={formData.isBlocking}
                      onChange={(e) =>
                        setFormData({ ...formData, isBlocking: e.target.checked })
                      }
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </div>
                  <div className="ml-3">
                    <label htmlFor="isBlocking" className="font-medium text-gray-700 text-sm">
                      Blocking condition
                    </label>
                    <p className="text-xs text-gray-500">
                      Prevents status change until this condition is completed
                    </p>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Description
                  </label>
                  <textarea
                    id="description"
                    rows={3}
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                {/* Document Link Section */}
                <div className="border-t pt-4 mt-4">
                  <p className="text-sm font-medium text-gray-700 mb-3">
                    Document Link (Optional)
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="documentLabel"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Label
                      </label>
                      <input
                        type="text"
                        id="documentLabel"
                        placeholder="e.g. Financing Letter"
                        value={formData.documentLabel}
                        onChange={(e) =>
                          setFormData({ ...formData, documentLabel: e.target.value })
                        }
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="documentUrl"
                        className="block text-sm font-medium text-gray-700"
                      >
                        URL
                      </label>
                      <input
                        type="url"
                        id="documentUrl"
                        placeholder="https://..."
                        value={formData.documentUrl}
                        onChange={(e) =>
                          setFormData({ ...formData, documentUrl: e.target.value })
                        }
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                  </div>
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
                {createMutation.isPending ? 'Creating...' : 'Create Condition'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
