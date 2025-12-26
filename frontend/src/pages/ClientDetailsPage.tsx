import { Link, useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { clientsApi } from '../api/clients.api'
import { transactionsApi } from '../api/transactions.api'
import { useState } from 'react'
import ConfirmDialog from '../components/ConfirmDialog'

export default function ClientDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const clientId = Number(id)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  const { data: clientData, isLoading: isLoadingClient } = useQuery({
    queryKey: ['client', clientId],
    queryFn: () => clientsApi.get(clientId),
    enabled: !!id,
  })

  const { data: transactionsData, isLoading: isLoadingTransactions } = useQuery(
    {
      queryKey: ['transactions', 'by-client', clientId],
      queryFn: () => transactionsApi.list({}),
      enabled: !!id,
      select: (data) => {
        // Filter transactions by clientId on the client side
        // Ideally this would be a backend query parameter
        const allTransactions = data?.data?.transactions || []
        return allTransactions.filter((t) => t.clientId === clientId)
      },
    }
  )

  const deleteClientMutation = useMutation({
    mutationFn: clientsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      navigate('/clients')
    },
  })

  const handleDeleteClient = () => {
    setDeleteConfirm(true)
  }

  const confirmDeleteClient = () => {
    deleteClientMutation.mutate(clientId)
  }

  const client = clientData?.data?.client
  const transactions = transactionsData || []

  if (isLoadingClient) {
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

  if (!client) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900">
              Client not found
            </h3>
            <Link
              to="/clients"
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
            >
              Back to Clients
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
            to="/clients"
            className="text-sm text-blue-600 hover:text-blue-500 mb-2 inline-block"
          >
            ← Back to Clients
          </Link>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-gray-900">
              {client.firstName} {client.lastName}
            </h1>
            <button
              onClick={handleDeleteClient}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Delete Client
            </button>
          </div>
        </div>

        {/* Client Details */}
        <div className="bg-white shadow sm:rounded-lg mb-6">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
              Contact Information
            </h3>
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              {client.email && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    <a
                      href={`mailto:${client.email}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {client.email}
                    </a>
                  </dd>
                </div>
              )}
              {client.phone && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Phone</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    <a
                      href={`tel:${client.phone}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {client.phone}
                    </a>
                  </dd>
                </div>
              )}
              {client.cellPhone && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Cell Phone</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    <a
                      href={`tel:${client.cellPhone}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {client.cellPhone}
                    </a>
                  </dd>
                </div>
              )}
              {client.homePhone && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Home Phone</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    <a
                      href={`tel:${client.homePhone}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {client.homePhone}
                    </a>
                  </dd>
                </div>
              )}
              {client.workPhone && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Work Phone</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    <a
                      href={`tel:${client.workPhone}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {client.workPhone}
                    </a>
                  </dd>
                </div>
              )}
              {(client.addressLine1 || client.city || client.provinceState || client.postalCode) && (
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Address</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {client.addressLine1 && <div>{client.addressLine1}</div>}
                    {client.addressLine2 && <div>{client.addressLine2}</div>}
                    {(client.city || client.provinceState || client.postalCode) && (
                      <div>
                        {client.city && `${client.city}, `}
                        {client.provinceState && `${client.provinceState} `}
                        {client.postalCode}
                      </div>
                    )}
                  </dd>
                </div>
              )}
              {client.notes && (
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Notes</dt>
                  <dd className="mt-1 text-sm text-gray-900">{client.notes}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        {/* Transactions */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
              Transactions
            </h3>

            {isLoadingTransactions ? (
              <div className="flex justify-center py-4">
                <svg
                  className="animate-spin h-6 w-6 text-blue-600"
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
            ) : transactions.length > 0 ? (
              <div className="space-y-3">
                {transactions.map((transaction) => (
                  <Link
                    key={transaction.id}
                    to={`/transactions/${transaction.id}`}
                    className="block border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Transaction #{transaction.id}
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            {transaction.status}
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            {transaction.type === 'purchase'
                              ? 'Purchase'
                              : 'Sale'}
                          </span>
                          {transaction.salePrice && (
                            <span className="text-xs text-gray-500">
                              $
                              {transaction.salePrice.toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                      <svg
                        className="h-5 w-5 text-gray-400"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                No transactions for this client yet.
              </p>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={deleteConfirm}
        onClose={() => setDeleteConfirm(false)}
        onConfirm={confirmDeleteClient}
        title="Delete Client"
        message={
          transactions.length > 0
            ? `Cannot delete this client because they have ${transactions.length} transaction(s). Please delete or reassign the transactions first.`
            : `Are you sure you want to delete ${client.firstName} ${client.lastName}? This action cannot be undone.`
        }
        confirmLabel="Delete"
        variant="danger"
        isLoading={deleteClientMutation.isPending}
      />
    </div>
  )
}
