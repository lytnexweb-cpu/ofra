import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  transactionsApi,
  type TransactionStatus,
} from '../api/transactions.api'
import {
  conditionsApi,
  type Condition,
  type ConditionType,
  type ConditionPriority,
  type ConditionStage,
  type UpdateConditionRequest,
} from '../api/conditions.api'
import { notesApi, type Note } from '../api/notes.api'
import CreateConditionModal from '../components/CreateConditionModal'
import ConfirmDialog from '../components/ConfirmDialog'

const statusLabels: Record<TransactionStatus, string> = {
  consultation: 'Consultation',
  offer: 'Offer Submitted',
  accepted: 'Offer Accepted',
  conditions: 'Conditional Period',
  notary: 'Firm',
  closing: 'Closing',
  completed: 'Completed',
  canceled: 'Canceled',
}


const statusColors: Record<TransactionStatus, string> = {
  consultation: 'bg-gray-100 text-gray-800',
  offer: 'bg-blue-100 text-blue-800',
  accepted: 'bg-green-100 text-green-800',
  conditions: 'bg-yellow-100 text-yellow-800',
  notary: 'bg-purple-100 text-purple-800',
  closing: 'bg-indigo-100 text-indigo-800',
  completed: 'bg-green-200 text-green-900',
  canceled: 'bg-red-100 text-red-800',
}

// Workflow sequence (excludes 'canceled')
const workflowSteps: TransactionStatus[] = [
  'consultation',
  'offer',
  'accepted',
  'conditions',
  'notary',
  'closing',
  'completed',
]

export default function TransactionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const transactionId = Number(id)
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  // Define consistent queryKey for this transaction
  const transactionKey = ['transaction', transactionId] as const

  const [isConditionModalOpen, setIsConditionModalOpen] = useState(false)
  const [newNote, setNewNote] = useState('')
  const [editingCondition, setEditingCondition] = useState<number | null>(null)
  const [editConditionData, setEditConditionData] = useState<{
    title: string
    dueDate: string
    description: string
    type?: ConditionType
    priority?: ConditionPriority
    stage?: ConditionStage
  }>({
    title: '',
    dueDate: '',
    description: '',
    type: 'financing',
    priority: 'medium',
    stage: undefined,
  })

  // Confirmation dialogs state
  const [deleteConditionConfirm, setDeleteConditionConfirm] = useState<{
    isOpen: boolean
    conditionId: number | null
  }>({ isOpen: false, conditionId: null })

  const [deleteNoteConfirm, setDeleteNoteConfirm] = useState<{
    isOpen: boolean
    noteId: number | null
  }>({ isOpen: false, noteId: null })

  const [statusChangeConfirm, setStatusChangeConfirm] = useState<{
    isOpen: boolean
    newStatus: TransactionStatus | null
  }>({ isOpen: false, newStatus: null })

  const [deleteTransactionConfirm, setDeleteTransactionConfirm] = useState(false)

  // Offer Details editing state
  const [editingOfferDetails, setEditingOfferDetails] = useState(false)
  const [offerDetailsForm, setOfferDetailsForm] = useState({
    listPrice: '',
    offerPrice: '',
    offerExpiryAt: '',
    counterOfferEnabled: false,
    counterOfferPrice: '',
    commission: '',
  })

  // Queries
  const { data: transactionData, isLoading } = useQuery({
    queryKey: transactionKey,
    queryFn: () => transactionsApi.get(transactionId),
    enabled: !!id,
  })

  const { data: notesData } = useQuery({
    queryKey: ['notes', transactionId],
    queryFn: () => notesApi.list(transactionId),
    enabled: !!id,
  })

  const transaction = transactionData?.data?.transaction
  const notes = notesData?.data?.notes || []

  // Mutations
  const updateStatusMutation = useMutation({
    mutationFn: ({
      status,
      note,
    }: {
      status: TransactionStatus
      note?: string
    }) => transactionsApi.updateStatus(transactionId, status, note),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: transactionKey }),
        queryClient.invalidateQueries({ queryKey: ['transactions'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
        transaction?.clientId &&
          queryClient.invalidateQueries({
            queryKey: ['client-transactions', transaction.clientId],
          }),
      ])
      setStatusChangeConfirm({ isOpen: false, newStatus: null })
    },
  })

  const toggleConditionMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'pending' | 'completed' }) => {
      console.log('TOGGLE MUTATION CALLED with:', { id, status })
      return conditionsApi.update(id, { status })
    },
    onSuccess: async (response) => {
      console.log('TOGGLE SUCCESS:', response)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: transactionKey }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
        transaction?.clientId &&
          queryClient.invalidateQueries({
            queryKey: ['client-transactions', transaction.clientId],
          }),
      ])
    },
    onError: (error) => {
      console.error('TOGGLE ERROR:', error)
    },
  })

  const updateConditionMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number
      data: UpdateConditionRequest
    }) => conditionsApi.update(id, data),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: transactionKey }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
        transaction?.clientId &&
          queryClient.invalidateQueries({
            queryKey: ['client-transactions', transaction.clientId],
          }),
      ])
      setEditingCondition(null)
    },
  })

  const deleteConditionMutation = useMutation({
    mutationFn: (conditionId: number) => {
      console.log('DELETE MUTATION CALLED with ID:', conditionId)
      return conditionsApi.delete(conditionId)
    },
    onSuccess: async (response) => {
      console.log('DELETE SUCCESS:', response)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: transactionKey }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
        transaction?.clientId &&
          queryClient.invalidateQueries({
            queryKey: ['client-transactions', transaction.clientId],
          }),
      ])
      setDeleteConditionConfirm({ isOpen: false, conditionId: null })
    },
    onError: (error) => {
      console.error('DELETE ERROR:', error)
    },
  })

  const createNoteMutation = useMutation({
    mutationFn: (content: string) =>
      notesApi.create({ transactionId, content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes', transactionId] })
      setNewNote('')
    },
  })

  const deleteNoteMutation = useMutation({
    mutationFn: (noteId: number) => notesApi.delete(noteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes', transactionId] })
      setDeleteNoteConfirm({ isOpen: false, noteId: null })
    },
  })

  const deleteTransactionMutation = useMutation({
    mutationFn: () => transactionsApi.delete(transactionId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['transactions'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
        transaction?.clientId &&
          queryClient.invalidateQueries({ queryKey: ['client', transaction.clientId] }),
        transaction?.clientId &&
          queryClient.invalidateQueries({
            queryKey: ['client-transactions', transaction.clientId],
          }),
      ])
      setDeleteTransactionConfirm(false)
      navigate('/transactions')
    },
  })

  const updateOfferDetailsMutation = useMutation({
    mutationFn: (payload: any) => transactionsApi.update(transactionId, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: transactionKey }),
        queryClient.invalidateQueries({ queryKey: ['transactions'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
        transaction?.clientId &&
          queryClient.invalidateQueries({
            queryKey: ['client-transactions', transaction.clientId],
          }),
      ])
      setEditingOfferDetails(false)
    },
  })

  // Handlers
  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as TransactionStatus
    setStatusChangeConfirm({ isOpen: true, newStatus })
  }

  const confirmStatusChange = () => {
    if (statusChangeConfirm.newStatus) {
      updateStatusMutation.mutate({ status: statusChangeConfirm.newStatus })
    }
  }

  const handleToggleCondition = (condition: Condition) => {
    console.log('TOGGLE CLICKED:', condition.id, 'current status:', condition.status)
    const newStatus = condition.status === 'completed' ? 'pending' : 'completed'
    console.log('New status will be:', newStatus)
    toggleConditionMutation.mutate({ id: condition.id, status: newStatus })
  }

  const handleDeleteCondition = (conditionId: number) => {
    console.log('DELETE CLICKED:', conditionId)
    setDeleteConditionConfirm({ isOpen: true, conditionId })
  }

  const confirmDeleteCondition = () => {
    console.log('DELETE CONFIRMED:', deleteConditionConfirm.conditionId)
    if (deleteConditionConfirm.conditionId) {
      deleteConditionMutation.mutate(deleteConditionConfirm.conditionId)
    }
  }

  const handleEditCondition = (condition: Condition) => {
    setEditingCondition(condition.id)
    setEditConditionData({
      title: condition.title,
      dueDate: condition.dueDate.split('T')[0],
      description: condition.description || '',
      type: condition.type,
      priority: condition.priority,
      stage: condition.stage,
    })
  }

  const handleSaveCondition = () => {
    if (editingCondition) {
      updateConditionMutation.mutate({
        id: editingCondition,
        data: editConditionData,
      })
    }
  }

  const handleCreateNote = (e: React.FormEvent) => {
    e.preventDefault()
    if (newNote.trim()) {
      createNoteMutation.mutate(newNote.trim())
    }
  }

  const handleDeleteNote = (noteId: number) => {
    setDeleteNoteConfirm({ isOpen: true, noteId })
  }

  const confirmDeleteNote = () => {
    if (deleteNoteConfirm.noteId) {
      deleteNoteMutation.mutate(deleteNoteConfirm.noteId)
    }
  }

  const handleDeleteTransaction = () => {
    setDeleteTransactionConfirm(true)
  }

  const confirmDeleteTransaction = () => {
    deleteTransactionMutation.mutate()
  }

  // Helper: parse number or return undefined
  const parseNumber = (value: any): number | undefined => {
    if (value === null || value === undefined || value === '') return undefined
    const num = typeof value === 'string' ? parseFloat(value) : value
    return isNaN(num) || num < 0 ? undefined : num
  }

  const handleEditOfferDetails = () => {
    if (!transaction) return

    // Format datetime for datetime-local input (YYYY-MM-DDTHH:mm)
    const formatDatetimeLocal = (dt: string | null) => {
      if (!dt) return ''
      const date = new Date(dt)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      return `${year}-${month}-${day}T${hours}:${minutes}`
    }

    setOfferDetailsForm({
      listPrice: transaction.listPrice?.toString() || '',
      offerPrice: transaction.offerPrice?.toString() || '',
      offerExpiryAt: formatDatetimeLocal(transaction.offerExpiryAt),
      counterOfferEnabled: transaction.counterOfferEnabled || false,
      counterOfferPrice: transaction.counterOfferPrice?.toString() || '',
      commission: transaction.commission?.toString() || '',
    })
    setEditingOfferDetails(true)
  }

  const handleSaveOfferDetails = () => {
    const listPriceNum = parseNumber(offerDetailsForm.listPrice)
    const offerPriceNum = parseNumber(offerDetailsForm.offerPrice)
    const counterOfferPriceNum = parseNumber(offerDetailsForm.counterOfferPrice)
    const commissionNum = parseNumber(offerDetailsForm.commission)

    const payload: any = {}

    if (listPriceNum !== undefined) payload.listPrice = listPriceNum
    if (offerPriceNum !== undefined) payload.offerPrice = offerPriceNum
    if (offerDetailsForm.offerExpiryAt) payload.offerExpiryAt = offerDetailsForm.offerExpiryAt
    if (commissionNum !== undefined) payload.commission = commissionNum

    payload.counterOfferEnabled = offerDetailsForm.counterOfferEnabled
    // If counterOfferEnabled is false, set counterOfferPrice to null explicitly
    if (offerDetailsForm.counterOfferEnabled === false) {
      payload.counterOfferPrice = null
    } else if (counterOfferPriceNum !== undefined) {
      payload.counterOfferPrice = counterOfferPriceNum
    }

    updateOfferDetailsMutation.mutate(payload)
  }

  const handleCancelOfferDetails = () => {
    setEditingOfferDetails(false)
  }

  const isOverdue = (condition: Condition) => {
    if (condition.status === 'completed') return false
    return new Date(condition.dueDate) < new Date()
  }

  const isDueSoon = (condition: Condition) => {
    if (condition.status === 'completed') return false
    const dueDate = new Date(condition.dueDate)
    const today = new Date()
    const sevenDaysFromNow = new Date(today)
    sevenDaysFromNow.setDate(today.getDate() + 7)
    return dueDate >= today && dueDate <= sevenDaysFromNow
  }

  // Calculate conditions summary stats
  const getConditionsSummary = () => {
    if (!transaction?.conditions || transaction.conditions.length === 0) {
      return {
        total: 0,
        completed: 0,
        overdue: 0,
        dueSoon: 0,
        nextDueDate: null,
      }
    }

    const conditions = transaction.conditions
    const completed = conditions.filter((c) => c.status === 'completed').length
    const overdue = conditions.filter((c) => isOverdue(c)).length
    const dueSoon = conditions.filter((c) => isDueSoon(c)).length

    // Find next due date among pending conditions
    const pendingConditions = conditions.filter((c) => c.status === 'pending')
    const nextDueDate =
      pendingConditions.length > 0
        ? pendingConditions
            .map((c) => new Date(c.dueDate))
            .sort((a, b) => a.getTime() - b.getTime())[0]
        : null

    return {
      total: conditions.length,
      completed,
      overdue,
      dueSoon,
      nextDueDate,
    }
  }

  // Get next workflow step
  const getNextStep = (currentStatus: TransactionStatus): TransactionStatus | null => {
    const currentIndex = workflowSteps.indexOf(currentStatus)
    if (currentIndex === -1 || currentIndex === workflowSteps.length - 1) {
      return null // No next step (completed or canceled)
    }
    return workflowSteps[currentIndex + 1]
  }

  // Filter conditions by current stage
  const getConditionsForCurrentStage = () => {
    if (!transaction?.conditions) return []

    const filtered = transaction.conditions.filter(
      (c) => c.stage === transaction.status
    )

    // Sort: pending first, then by dueDate ASC
    return filtered.sort((a, b) => {
      if (a.status === 'pending' && b.status !== 'pending') return -1
      if (a.status !== 'pending' && b.status === 'pending') return 1
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    })
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <svg
          className="animate-spin h-8 w-8 text-blue-600"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      </div>
    )
  }

  if (!transaction) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900">
              Transaction not found
            </h3>
            <Link
              to="/transactions"
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
            >
              Back to Transactions
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            to="/transactions"
            className="text-sm text-blue-600 hover:text-blue-500 mb-2 inline-block"
          >
            ← Back to Transactions
          </Link>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Transaction #{transaction.id}
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                {transaction.client
                  ? `${transaction.client.firstName} ${transaction.client.lastName}`
                  : 'No client'}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusColors[transaction.status]
                  }`}
              >
                {statusLabels[transaction.status]}
              </span>
              <button
                onClick={handleDeleteTransaction}
                disabled={deleteTransactionMutation.isPending}
                className="inline-flex items-center px-3 py-1 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
              >
                {deleteTransactionMutation.isPending
                  ? 'Deleting...'
                  : 'Delete Transaction'}
              </button>
            </div>
          </div>
        </div>

        {/* Workflow Helper */}
        {transaction.status !== 'canceled' && transaction.status !== 'completed' && (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-blue-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-blue-800">
                  Workflow Helper
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>
                    <strong>Current Step:</strong>{' '}
                    {statusLabels[transaction.status]}
                  </p>
                  {getNextStep(transaction.status) && (
                    <>
                      <p className="mt-1">
                        <strong>Suggested Next Step:</strong>{' '}
                        {statusLabels[getNextStep(transaction.status)!]}
                      </p>
                      <div className="mt-3">
                        <button
                          onClick={() => {
                            const nextStep = getNextStep(transaction.status)
                            if (nextStep) {
                              setStatusChangeConfirm({
                                isOpen: true,
                                newStatus: nextStep,
                              })
                            }
                          }}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          Advance to Next Step →
                        </button>
                      </div>
                    </>
                  )}
                  {getConditionsForCurrentStage().length > 0 && (
                    <p className="mt-3 text-xs">
                      💡 <em>Tip: Conditions for this step are marked 📍 in the list below.</em>
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Transaction Details */}
        <div className="bg-white shadow sm:rounded-lg mb-6">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
              Details
            </h3>
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="mt-1">
                  <select
                    value={transaction.status}
                    onChange={handleStatusChange}
                    disabled={updateStatusMutation.isPending}
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:opacity-50"
                  >
                    {Object.entries(statusLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Type</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {transaction.type === 'purchase' ? 'Purchase' : 'Sale'}
                </dd>
              </div>
              {transaction.salePrice && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Sale Price
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    $
                    {transaction.salePrice.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </dd>
                </div>
              )}
              {transaction.notesText && (
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">
                    Transaction Notes
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {transaction.notesText}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        {/* Offer Details */}
        {(transaction.listPrice ||
          transaction.offerPrice ||
          transaction.counterOfferEnabled ||
          transaction.offerExpiryAt ||
          transaction.commission ||
          editingOfferDetails) && (
          <div className="bg-white shadow sm:rounded-lg mb-6">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium leading-6 text-gray-900">
                  Offer Details
                </h3>
                {!editingOfferDetails && (
                  <button
                    onClick={handleEditOfferDetails}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Edit
                  </button>
                )}
              </div>

              {editingOfferDetails ? (
                /* Edit Form */
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        List Price
                      </label>
                      <input
                        type="number"
                        value={offerDetailsForm.listPrice}
                        onChange={(e) =>
                          setOfferDetailsForm({
                            ...offerDetailsForm,
                            listPrice: e.target.value,
                          })
                        }
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        placeholder="450000"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Offer Price
                      </label>
                      <input
                        type="number"
                        value={offerDetailsForm.offerPrice}
                        onChange={(e) =>
                          setOfferDetailsForm({
                            ...offerDetailsForm,
                            offerPrice: e.target.value,
                          })
                        }
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        placeholder="445000"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Offer Expiry
                      </label>
                      <input
                        type="datetime-local"
                        value={offerDetailsForm.offerExpiryAt}
                        onChange={(e) =>
                          setOfferDetailsForm({
                            ...offerDetailsForm,
                            offerExpiryAt: e.target.value,
                          })
                        }
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Commission (Internal)
                      </label>
                      <input
                        type="number"
                        value={offerDetailsForm.commission}
                        onChange={(e) =>
                          setOfferDetailsForm({
                            ...offerDetailsForm,
                            commission: e.target.value,
                          })
                        }
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        placeholder="15000"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="counterOfferEnabled"
                      checked={offerDetailsForm.counterOfferEnabled}
                      onChange={(e) =>
                        setOfferDetailsForm({
                          ...offerDetailsForm,
                          counterOfferEnabled: e.target.checked,
                        })
                      }
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label
                      htmlFor="counterOfferEnabled"
                      className="text-sm font-medium text-gray-700"
                    >
                      Counter Offer Enabled
                    </label>
                  </div>

                  {offerDetailsForm.counterOfferEnabled && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Counter Offer Price
                      </label>
                      <input
                        type="number"
                        value={offerDetailsForm.counterOfferPrice}
                        onChange={(e) =>
                          setOfferDetailsForm({
                            ...offerDetailsForm,
                            counterOfferPrice: e.target.value,
                          })
                        }
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        placeholder="447500"
                      />
                    </div>
                  )}

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={handleCancelOfferDetails}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveOfferDetails}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                /* Read-only Display */
                <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                  {transaction.listPrice && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        List Price
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        $
                        {transaction.listPrice.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </dd>
                    </div>
                  )}
                  {transaction.offerPrice && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        Offer Price
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        $
                        {transaction.offerPrice.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </dd>
                    </div>
                  )}
                  {transaction.offerExpiryAt && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        Offer Expiry
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {new Date(transaction.offerExpiryAt).toLocaleString(
                          'en-US',
                          {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          }
                        )}
                      </dd>
                    </div>
                  )}
                  {transaction.counterOfferEnabled && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        Counter Offer
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {transaction.counterOfferPrice ? (
                          <span>
                            $
                            {transaction.counterOfferPrice.toLocaleString(
                              'en-US',
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              }
                            )}
                          </span>
                        ) : (
                          <span className="text-gray-500 italic">Pending</span>
                        )}
                      </dd>
                    </div>
                  )}
                  {transaction.commission && (
                    <div>
                      <dt className="text-sm font-medium text-gray-400">
                        Commission{' '}
                        <span className="text-xs font-normal">(Internal)</span>
                      </dt>
                      <dd className="mt-1 text-sm text-gray-600">
                        $
                        {transaction.commission.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </dd>
                    </div>
                  )}
                </dl>
              )}
            </div>
          </div>
        )}

        {/* Conditions Summary */}
        {(() => {
          const summary = getConditionsSummary()
          return (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Conditions</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {summary.completed} / {summary.total}
                    <span className="text-sm font-normal text-gray-600 ml-1">
                      completed
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Overdue</p>
                  <p className="text-lg font-semibold">
                    {summary.overdue > 0 ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-sm font-medium bg-red-100 text-red-800">
                        {summary.overdue}
                      </span>
                    ) : (
                      <span className="text-gray-900">{summary.overdue}</span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Due soon (7d)</p>
                  <p className="text-lg font-semibold">
                    {summary.dueSoon > 0 ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-sm font-medium bg-yellow-100 text-yellow-800">
                        {summary.dueSoon}
                      </span>
                    ) : (
                      <span className="text-gray-900">{summary.dueSoon}</span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Next due</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {summary.nextDueDate
                      ? summary.nextDueDate.toLocaleDateString()
                      : '—'}
                  </p>
                </div>
              </div>
            </div>
          )
        })()}

        {/* Conditions Section */}
        <div className="bg-white shadow sm:rounded-lg mb-6">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                Conditions
              </h3>
              <button
                onClick={() => setIsConditionModalOpen(true)}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Add Condition
              </button>
            </div>

            {transaction.conditions && transaction.conditions.length > 0 ? (
              <div className="space-y-3">
                {[...transaction.conditions]
                  .sort((a, b) => {
                    // Current stage first
                    if (
                      a.stage === transaction.status &&
                      b.stage !== transaction.status
                    )
                      return -1
                    if (
                      a.stage !== transaction.status &&
                      b.stage === transaction.status
                    )
                      return 1
                    // Then by status (pending first)
                    if (a.status === 'pending' && b.status !== 'pending')
                      return -1
                    if (a.status !== 'pending' && b.status === 'pending')
                      return 1
                    // Then by dueDate
                    return (
                      new Date(a.dueDate).getTime() -
                      new Date(b.dueDate).getTime()
                    )
                  })
                  .map((condition: Condition) => (
                  <div
                    key={condition.id}
                    className={`border rounded-lg p-4 ${isOverdue(condition)
                        ? 'border-red-300 bg-red-50'
                        : isDueSoon(condition)
                          ? 'border-yellow-300 bg-yellow-50'
                          : 'border-gray-200'
                      }`}
                  >
                    {editingCondition === condition.id ? (
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={editConditionData.title}
                          onChange={(e) =>
                            setEditConditionData({
                              ...editConditionData,
                              title: e.target.value,
                            })
                          }
                          className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                        <input
                          type="date"
                          value={editConditionData.dueDate}
                          onChange={(e) =>
                            setEditConditionData({
                              ...editConditionData,
                              dueDate: e.target.value,
                            })
                          }
                          className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                        <div className="grid grid-cols-2 gap-3">
                          <select
                            value={editConditionData.type}
                            onChange={(e) =>
                              setEditConditionData({
                                ...editConditionData,
                                type: e.target.value as ConditionType,
                              })
                            }
                            className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
                          <select
                            value={editConditionData.priority}
                            onChange={(e) =>
                              setEditConditionData({
                                ...editConditionData,
                                priority: e.target.value as ConditionPriority,
                              })
                            }
                            className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                          </select>
                        </div>
                        <select
                          value={editConditionData.stage || ''}
                          onChange={(e) =>
                            setEditConditionData({
                              ...editConditionData,
                              stage: e.target.value as ConditionStage,
                            })
                          }
                          className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        >
                          <option value="consultation">Consultation</option>
                          <option value="offer">Offer Submitted</option>
                          <option value="accepted">Offer Accepted</option>
                          <option value="conditions">Conditional Period</option>
                          <option value="notary">Firm</option>
                          <option value="closing">Closing</option>
                          <option value="completed">Completed</option>
                          <option value="canceled">Canceled</option>
                        </select>
                        <textarea
                          value={editConditionData.description}
                          onChange={(e) =>
                            setEditConditionData({
                              ...editConditionData,
                              description: e.target.value,
                            })
                          }
                          rows={2}
                          className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={handleSaveCondition}
                            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingCondition(null)}
                            className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <input
                              type="checkbox"
                              checked={condition.status === 'completed'}
                              onChange={() => handleToggleCondition(condition)}
                              className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p
                                  className={`text-sm font-medium ${condition.status === 'completed'
                                      ? 'line-through text-gray-500'
                                      : 'text-gray-900'
                                    }`}
                                >
                                  {condition.title}
                                </p>
                                {condition.stage === transaction.status && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-300">
                                    📍 Current Step
                                  </span>
                                )}
                                {condition.type && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                    {condition.type}
                                  </span>
                                )}
                                {condition.priority && (
                                  <span
                                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${condition.priority === 'high'
                                        ? 'bg-red-100 text-red-800'
                                        : condition.priority === 'medium'
                                          ? 'bg-yellow-100 text-yellow-800'
                                          : 'bg-gray-100 text-gray-800'
                                      }`}
                                  >
                                    {condition.priority}
                                  </span>
                                )}
                              </div>
                              {condition.description && (
                                <p className="mt-1 text-sm text-gray-500">
                                  {condition.description}
                                </p>
                              )}
                              <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                                <span>
                                  Due:{' '}
                                  {new Date(
                                    condition.dueDate
                                  ).toLocaleDateString()}
                                </span>
                                {condition.status === 'completed' &&
                                  condition.completedAt && (
                                    <span>
                                      Completed:{' '}
                                      {new Date(
                                        condition.completedAt
                                      ).toLocaleDateString()}
                                    </span>
                                  )}
                                {isOverdue(condition) && (
                                  <span className="text-red-600 font-medium">
                                    OVERDUE
                                  </span>
                                )}
                                {isDueSoon(condition) && (
                                  <span className="text-yellow-600 font-medium">
                                    DUE SOON
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <button
                              onClick={() => handleEditCondition(condition)}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() =>
                                handleDeleteCondition(condition.id)
                              }
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No conditions yet.</p>
            )}
          </div>
        </div>

        {/* Notes Section */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
              Notes
            </h3>

            {/* Add note form */}
            <form onSubmit={handleCreateNote} className="mb-6">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                rows={3}
                placeholder="Add a note..."
                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              <div className="mt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={!newNote.trim() || createNoteMutation.isPending}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {createNoteMutation.isPending ? 'Adding...' : 'Add Note'}
                </button>
              </div>
            </form>

            {/* Notes list */}
            {notes.length > 0 ? (
              <div className="space-y-4">
                {notes.map((note: Note) => (
                  <div
                    key={note.id}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">{note.content}</p>
                        <p className="mt-1 text-xs text-gray-500">
                          {note.author?.fullName || 'Unknown'} •{' '}
                          {new Date(note.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="ml-4 text-red-600 hover:text-red-800 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No notes yet.</p>
            )}
          </div>
        </div>
      </div>

      <CreateConditionModal
        isOpen={isConditionModalOpen}
        onClose={() => setIsConditionModalOpen(false)}
        transactionId={transactionId}
      />

      <ConfirmDialog
        isOpen={deleteConditionConfirm.isOpen}
        onClose={() =>
          setDeleteConditionConfirm({ isOpen: false, conditionId: null })
        }
        onConfirm={confirmDeleteCondition}
        title="Delete Condition"
        message="Are you sure you want to delete this condition?"
        confirmLabel="Delete"
        variant="danger"
        isLoading={deleteConditionMutation.isPending}
      />

      <ConfirmDialog
        isOpen={deleteNoteConfirm.isOpen}
        onClose={() => setDeleteNoteConfirm({ isOpen: false, noteId: null })}
        onConfirm={confirmDeleteNote}
        title="Delete Note"
        message="Are you sure you want to delete this note?"
        confirmLabel="Delete"
        variant="danger"
        isLoading={deleteNoteMutation.isPending}
      />

      <ConfirmDialog
        isOpen={statusChangeConfirm.isOpen}
        onClose={() =>
          setStatusChangeConfirm({ isOpen: false, newStatus: null })
        }
        onConfirm={confirmStatusChange}
        title="Change Status"
        message={
          statusChangeConfirm.newStatus
            ? `Change status to ${
                statusLabels[statusChangeConfirm.newStatus]
              }? This will be recorded in the status history.`
            : ''
        }
        confirmLabel="Change Status"
        variant="warning"
        isLoading={updateStatusMutation.isPending}
      />

      <ConfirmDialog
        isOpen={deleteTransactionConfirm}
        onClose={() => setDeleteTransactionConfirm(false)}
        onConfirm={confirmDeleteTransaction}
        title="Delete Transaction"
        message="Are you sure you want to delete this transaction? This will permanently remove all conditions, notes, and status history associated with it."
        confirmLabel="Delete Transaction"
        variant="danger"
        isLoading={deleteTransactionMutation.isPending}
      />
    </div>
  )
}
