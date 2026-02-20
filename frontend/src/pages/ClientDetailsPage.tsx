import { Link, useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { clientsApi } from '../api/clients.api'
import { useState } from 'react'
import ConfirmDialog from '../components/ConfirmDialog'
import TransactionTimeline from '../components/TransactionTimeline'

export default function ClientDetailsPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const clientId = Number(id)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [editingClient, setEditingClient] = useState(false)
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    cellPhone: '',
    homePhone: '',
    workPhone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    provinceState: '',
    postalCode: '',
    notes: '',
    clientType: '' as string,
    isPreApproved: false,
    preApprovalAmount: '' as string | number,
    preApprovalLender: '',
    financingBudget: '' as string | number,
    motivationLevel: '' as string,
    floorPrice: '' as string | number,
    targetCloseDate: '',
  })

  const { data: clientData, isLoading: isLoadingClient } = useQuery({
    queryKey: ['client', clientId],
    queryFn: () => clientsApi.get(clientId),
    enabled: !!id,
  })

  const { data: transactionsData, isLoading: isLoadingTransactions } = useQuery({
    queryKey: ['client-transactions', clientId],
    queryFn: () => clientsApi.getTransactions(clientId),
    enabled: !!id,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  })

  const deleteClientMutation = useMutation({
    mutationFn: clientsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      navigate('/clients')
    },
  })

  const updateClientMutation = useMutation({
    mutationFn: (data: any) => clientsApi.update(clientId, data),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['client', clientId] }),
        queryClient.invalidateQueries({ queryKey: ['clients'] }),
        queryClient.invalidateQueries({ queryKey: ['client-transactions', clientId] }),
      ])
      setEditingClient(false)
    },
  })

  const handleDeleteClient = () => {
    setDeleteConfirm(true)
  }

  const confirmDeleteClient = () => {
    deleteClientMutation.mutate(clientId)
  }

  const handleEditClient = () => {
    if (!client) return
    setEditForm({
      firstName: client.firstName || '',
      lastName: client.lastName || '',
      email: client.email || '',
      phone: client.phone || '',
      cellPhone: client.cellPhone || '',
      homePhone: client.homePhone || '',
      workPhone: client.workPhone || '',
      addressLine1: client.addressLine1 || '',
      addressLine2: client.addressLine2 || '',
      city: client.city || '',
      provinceState: client.provinceState || '',
      postalCode: client.postalCode || '',
      notes: client.notes || '',
      clientType: client.clientType || '',
      isPreApproved: client.isPreApproved ?? false,
      preApprovalAmount: client.preApprovalAmount ?? '',
      preApprovalLender: client.preApprovalLender || '',
      financingBudget: client.financingBudget ?? '',
      motivationLevel: client.motivationLevel || '',
      floorPrice: client.floorPrice ?? '',
      targetCloseDate: client.targetCloseDate || '',
    })
    setEditingClient(true)
  }

  const handleSaveClient = () => {
    const payload: any = {}

    if (editForm.firstName.trim()) payload.firstName = editForm.firstName.trim()
    if (editForm.lastName.trim()) payload.lastName = editForm.lastName.trim()
    if (editForm.email?.trim()) payload.email = editForm.email.trim()
    if (editForm.phone?.trim()) payload.phone = editForm.phone.trim()
    if (editForm.cellPhone?.trim()) payload.cellPhone = editForm.cellPhone.trim()
    if (editForm.homePhone?.trim()) payload.homePhone = editForm.homePhone.trim()
    if (editForm.workPhone?.trim()) payload.workPhone = editForm.workPhone.trim()
    if (editForm.addressLine1?.trim()) payload.addressLine1 = editForm.addressLine1.trim()
    if (editForm.addressLine2?.trim()) payload.addressLine2 = editForm.addressLine2.trim()
    if (editForm.city?.trim()) payload.city = editForm.city.trim()
    if (editForm.provinceState?.trim()) payload.provinceState = editForm.provinceState.trim()
    if (editForm.postalCode?.trim()) payload.postalCode = editForm.postalCode.trim()
    if (editForm.notes?.trim()) payload.notes = editForm.notes.trim()
    if (editForm.clientType) payload.clientType = editForm.clientType
    payload.isPreApproved = editForm.isPreApproved || false
    if (editForm.preApprovalAmount !== '' && editForm.preApprovalAmount != null) payload.preApprovalAmount = Number(editForm.preApprovalAmount)
    if (editForm.preApprovalLender?.trim()) payload.preApprovalLender = editForm.preApprovalLender.trim()
    if (editForm.financingBudget !== '' && editForm.financingBudget != null) payload.financingBudget = Number(editForm.financingBudget)
    if (editForm.motivationLevel) payload.motivationLevel = editForm.motivationLevel
    if (editForm.floorPrice !== '' && editForm.floorPrice != null) payload.floorPrice = Number(editForm.floorPrice)
    if (editForm.targetCloseDate?.trim()) payload.targetCloseDate = editForm.targetCloseDate.trim()

    updateClientMutation.mutate(payload)
  }

  const handleCancelEditClient = () => {
    setEditingClient(false)
  }

  const client = clientData?.data?.client
  const transactions = transactionsData?.data?.transactions || []

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
            <h3 className="text-lg font-medium text-stone-900">
              {t('clients.details.notFound')}
            </h3>
            <Link
              to="/clients"
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
            >
              {t('clients.details.backToClients')}
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
            ← {t('clients.details.backToClients')}
          </Link>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-stone-900">
              {client.firstName} {client.lastName}
            </h1>
            <button
              onClick={handleDeleteClient}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              {t('clients.details.deleteClient')}
            </button>
          </div>
        </div>

        {/* Client Details */}
        <div className="bg-white shadow sm:rounded-lg mb-6">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium leading-6 text-stone-900">
                {t('clients.details.contactInfo')}
              </h3>
              {!editingClient && (
                <button
                  onClick={handleEditClient}
                  className="inline-flex items-center px-3 py-1.5 border border-stone-300 shadow-sm text-sm font-medium rounded-md text-stone-700 bg-white hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg
                    className="h-4 w-4 mr-1.5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  {t('common.edit')}
                </button>
              )}
            </div>

            {editingClient ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="edit-firstName" className="block text-sm font-medium text-stone-700">
                      {t('clients.firstName')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="edit-firstName"
                      required
                      value={editForm.firstName}
                      onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                      className="mt-1 block w-full border border-stone-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="edit-lastName" className="block text-sm font-medium text-stone-700">
                      {t('clients.lastName')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="edit-lastName"
                      required
                      value={editForm.lastName}
                      onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                      className="mt-1 block w-full border border-stone-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="edit-email" className="block text-sm font-medium text-stone-700">
                      {t('clients.email')}
                    </label>
                    <input
                      type="email"
                      id="edit-email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className="mt-1 block w-full border border-stone-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="edit-phone" className="block text-sm font-medium text-stone-700">
                      {t('clients.phone')}
                    </label>
                    <input
                      type="tel"
                      id="edit-phone"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className="mt-1 block w-full border border-stone-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label htmlFor="edit-cellPhone" className="block text-sm font-medium text-stone-700">
                      {t('clients.phones.cell')}
                    </label>
                    <input
                      type="tel"
                      id="edit-cellPhone"
                      value={editForm.cellPhone}
                      onChange={(e) => setEditForm({ ...editForm, cellPhone: e.target.value })}
                      className="mt-1 block w-full border border-stone-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="edit-homePhone" className="block text-sm font-medium text-stone-700">
                      {t('clients.phones.home')}
                    </label>
                    <input
                      type="tel"
                      id="edit-homePhone"
                      value={editForm.homePhone}
                      onChange={(e) => setEditForm({ ...editForm, homePhone: e.target.value })}
                      className="mt-1 block w-full border border-stone-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="edit-workPhone" className="block text-sm font-medium text-stone-700">
                      {t('clients.phones.work')}
                    </label>
                    <input
                      type="tel"
                      id="edit-workPhone"
                      value={editForm.workPhone}
                      onChange={(e) => setEditForm({ ...editForm, workPhone: e.target.value })}
                      className="mt-1 block w-full border border-stone-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="edit-addressLine1" className="block text-sm font-medium text-stone-700">
                    {t('clients.address.line1')}
                  </label>
                  <input
                    type="text"
                    id="edit-addressLine1"
                    value={editForm.addressLine1}
                    onChange={(e) => setEditForm({ ...editForm, addressLine1: e.target.value })}
                    className="mt-1 block w-full border border-stone-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="edit-addressLine2" className="block text-sm font-medium text-stone-700">
                    {t('clients.address.line2')}
                  </label>
                  <input
                    type="text"
                    id="edit-addressLine2"
                    value={editForm.addressLine2}
                    onChange={(e) => setEditForm({ ...editForm, addressLine2: e.target.value })}
                    className="mt-1 block w-full border border-stone-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label htmlFor="edit-city" className="block text-sm font-medium text-stone-700">
                      {t('clients.address.city')}
                    </label>
                    <input
                      type="text"
                      id="edit-city"
                      value={editForm.city}
                      onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                      className="mt-1 block w-full border border-stone-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="edit-provinceState" className="block text-sm font-medium text-stone-700">
                      {t('clients.address.provinceState')}
                    </label>
                    <input
                      type="text"
                      id="edit-provinceState"
                      value={editForm.provinceState}
                      onChange={(e) => setEditForm({ ...editForm, provinceState: e.target.value })}
                      className="mt-1 block w-full border border-stone-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="edit-postalCode" className="block text-sm font-medium text-stone-700">
                      {t('clients.address.postalCode')}
                    </label>
                    <input
                      type="text"
                      id="edit-postalCode"
                      value={editForm.postalCode}
                      onChange={(e) => setEditForm({ ...editForm, postalCode: e.target.value })}
                      className="mt-1 block w-full border border-stone-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                </div>

                {/* Client Type */}
                <div>
                  <label htmlFor="edit-clientType" className="block text-sm font-medium text-stone-700">
                    {t('clients.clientType', 'Type de client')}
                  </label>
                  <select
                    id="edit-clientType"
                    value={editForm.clientType}
                    onChange={(e) => setEditForm({ ...editForm, clientType: e.target.value })}
                    className="mt-1 block w-full border border-stone-300 rounded-md shadow-sm py-2 px-3 bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="">{t('clients.clientTypeNone', '— Non spécifié —')}</option>
                    <option value="buyer">{t('clients.clientTypeBuyer', 'Acheteur')}</option>
                    <option value="seller">{t('clients.clientTypeSeller', 'Vendeur')}</option>
                    <option value="both">{t('clients.clientTypeBoth', 'Acheteur & Vendeur')}</option>
                  </select>
                </div>

                {/* Buyer section */}
                {(editForm.clientType === 'buyer' || editForm.clientType === 'both') && (
                  <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-4 space-y-3">
                    <h4 className="text-sm font-semibold text-blue-800">{t('clients.buyerSection')}</h4>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 text-sm text-stone-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editForm.isPreApproved}
                          onChange={(e) => setEditForm({ ...editForm, isPreApproved: e.target.checked })}
                          className="rounded border-stone-300 text-blue-600 focus:ring-blue-500"
                        />
                        {t('clients.isPreApproved')}
                      </label>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label htmlFor="edit-preApprovalAmount" className="block text-xs font-medium text-stone-600">
                          {t('clients.preApprovalAmount')}
                        </label>
                        <input
                          type="number"
                          id="edit-preApprovalAmount"
                          min="0"
                          step="1000"
                          value={editForm.preApprovalAmount}
                          onChange={(e) => setEditForm({ ...editForm, preApprovalAmount: e.target.value ? Number(e.target.value) : '' })}
                          className="mt-1 block w-full border border-stone-300 rounded-md shadow-sm py-1.5 px-2.5 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                        />
                      </div>
                      <div>
                        <label htmlFor="edit-preApprovalLender" className="block text-xs font-medium text-stone-600">
                          {t('clients.preApprovalLender')}
                        </label>
                        <input
                          type="text"
                          id="edit-preApprovalLender"
                          value={editForm.preApprovalLender}
                          onChange={(e) => setEditForm({ ...editForm, preApprovalLender: e.target.value })}
                          className="mt-1 block w-full border border-stone-300 rounded-md shadow-sm py-1.5 px-2.5 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="edit-financingBudget" className="block text-xs font-medium text-stone-600">
                        {t('clients.financingBudget')}
                      </label>
                      <input
                        type="number"
                        id="edit-financingBudget"
                        min="0"
                        step="1000"
                        value={editForm.financingBudget}
                        onChange={(e) => setEditForm({ ...editForm, financingBudget: e.target.value ? Number(e.target.value) : '' })}
                        className="mt-1 block w-full border border-stone-300 rounded-md shadow-sm py-1.5 px-2.5 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                    </div>
                  </div>
                )}

                {/* Seller section */}
                {(editForm.clientType === 'seller' || editForm.clientType === 'both') && (
                  <div className="rounded-lg border border-amber-100 bg-amber-50/50 p-4 space-y-3">
                    <h4 className="text-sm font-semibold text-amber-800">{t('clients.sellerSection')}</h4>
                    <div>
                      <label htmlFor="edit-motivationLevel" className="block text-xs font-medium text-stone-600">
                        {t('clients.motivationLevel')}
                      </label>
                      <select
                        id="edit-motivationLevel"
                        value={editForm.motivationLevel}
                        onChange={(e) => setEditForm({ ...editForm, motivationLevel: e.target.value })}
                        className="mt-1 block w-full border border-stone-300 rounded-md shadow-sm py-1.5 px-2.5 bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                      >
                        <option value="">—</option>
                        <option value="low">{t('clients.motivationLow')}</option>
                        <option value="medium">{t('clients.motivationMedium')}</option>
                        <option value="high">{t('clients.motivationHigh')}</option>
                        <option value="urgent">{t('clients.motivationUrgent')}</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label htmlFor="edit-floorPrice" className="block text-xs font-medium text-stone-600">
                          {t('clients.floorPrice')}
                        </label>
                        <input
                          type="number"
                          id="edit-floorPrice"
                          min="0"
                          step="1000"
                          value={editForm.floorPrice}
                          onChange={(e) => setEditForm({ ...editForm, floorPrice: e.target.value ? Number(e.target.value) : '' })}
                          className="mt-1 block w-full border border-stone-300 rounded-md shadow-sm py-1.5 px-2.5 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                        />
                      </div>
                      <div>
                        <label htmlFor="edit-targetCloseDate" className="block text-xs font-medium text-stone-600">
                          {t('clients.targetCloseDate')}
                        </label>
                        <input
                          type="date"
                          id="edit-targetCloseDate"
                          value={editForm.targetCloseDate}
                          onChange={(e) => setEditForm({ ...editForm, targetCloseDate: e.target.value })}
                          className="mt-1 block w-full border border-stone-300 rounded-md shadow-sm py-1.5 px-2.5 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label htmlFor="edit-notes" className="block text-sm font-medium text-stone-700">
                    {t('clients.notes')}
                  </label>
                  <textarea
                    id="edit-notes"
                    rows={3}
                    value={editForm.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    className="mt-1 block w-full border border-stone-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-stone-200">
                  <button
                    type="button"
                    onClick={handleCancelEditClient}
                    disabled={updateClientMutation.isPending}
                    className="px-4 py-2 text-sm font-medium text-stone-700 bg-white border border-stone-300 rounded-md hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveClient}
                    disabled={updateClientMutation.isPending}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {updateClientMutation.isPending ? t('clients.saving') : t('clients.saveChanges')}
                  </button>
                </div>
              </div>
            ) : (
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              {client.clientType && (
                <div>
                  <dt className="text-sm font-medium text-stone-500">{t('clients.clientType')}</dt>
                  <dd className="mt-1">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      client.clientType === 'buyer' ? 'bg-blue-100 text-blue-800' :
                      client.clientType === 'seller' ? 'bg-amber-100 text-amber-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {client.clientType === 'buyer' ? t('clients.clientTypeBuyer') :
                       client.clientType === 'seller' ? t('clients.clientTypeSeller') :
                       t('clients.clientTypeBoth')}
                    </span>
                  </dd>
                </div>
              )}
              {client.email && (
                <div>
                  <dt className="text-sm font-medium text-stone-500">{t('clients.email')}</dt>
                  <dd className="mt-1 text-sm text-stone-900">
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
                  <dt className="text-sm font-medium text-stone-500">{t('clients.phone')}</dt>
                  <dd className="mt-1 text-sm text-stone-900">
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
                  <dt className="text-sm font-medium text-stone-500">{t('clients.phones.cell')}</dt>
                  <dd className="mt-1 text-sm text-stone-900">
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
                  <dt className="text-sm font-medium text-stone-500">{t('clients.phones.home')}</dt>
                  <dd className="mt-1 text-sm text-stone-900">
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
                  <dt className="text-sm font-medium text-stone-500">{t('clients.phones.work')}</dt>
                  <dd className="mt-1 text-sm text-stone-900">
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
                  <dt className="text-sm font-medium text-stone-500">{t('clients.details.address')}</dt>
                  <dd className="mt-1 text-sm text-stone-900">
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
                  <dt className="text-sm font-medium text-stone-500">{t('clients.notes')}</dt>
                  <dd className="mt-1 text-sm text-stone-900">{client.notes}</dd>
                </div>
              )}
              {/* Buyer profile read-only */}
              {(client.clientType === 'buyer' || client.clientType === 'both') && (client.isPreApproved || client.preApprovalAmount || client.financingBudget) && (
                <div className="sm:col-span-2 rounded-lg border border-blue-100 bg-blue-50/50 p-4">
                  <dt className="text-sm font-semibold text-blue-800 mb-2">{t('clients.buyerSection')}</dt>
                  <dd className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    {client.isPreApproved && (
                      <div>
                        <span className="text-stone-500">{t('clients.isPreApproved')}:</span>{' '}
                        <span className="text-emerald-700 font-medium">{t('clients.isPreApproved')}</span>
                      </div>
                    )}
                    {client.preApprovalAmount != null && (
                      <div>
                        <span className="text-stone-500">{t('clients.preApprovalAmount')}:</span>{' '}
                        <span className="text-stone-900 font-medium">{new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(client.preApprovalAmount)}</span>
                      </div>
                    )}
                    {client.preApprovalLender && (
                      <div>
                        <span className="text-stone-500">{t('clients.preApprovalLender')}:</span>{' '}
                        <span className="text-stone-900">{client.preApprovalLender}</span>
                      </div>
                    )}
                    {client.financingBudget != null && (
                      <div>
                        <span className="text-stone-500">{t('clients.financingBudget')}:</span>{' '}
                        <span className="text-stone-900 font-medium">{new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(client.financingBudget)}</span>
                      </div>
                    )}
                  </dd>
                </div>
              )}
              {/* Seller profile read-only */}
              {(client.clientType === 'seller' || client.clientType === 'both') && (client.motivationLevel || client.floorPrice || client.targetCloseDate) && (
                <div className="sm:col-span-2 rounded-lg border border-amber-100 bg-amber-50/50 p-4">
                  <dt className="text-sm font-semibold text-amber-800 mb-2">{t('clients.sellerSection')}</dt>
                  <dd className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    {client.motivationLevel && (
                      <div>
                        <span className="text-stone-500">{t('clients.motivationLevel')}:</span>{' '}
                        <span className={`font-medium ${
                          client.motivationLevel === 'urgent' ? 'text-red-600' :
                          client.motivationLevel === 'high' ? 'text-amber-600' :
                          'text-stone-900'
                        }`}>
                          {t(`clients.motivation${client.motivationLevel.charAt(0).toUpperCase() + client.motivationLevel.slice(1)}`)}
                        </span>
                      </div>
                    )}
                    {client.floorPrice != null && (
                      <div>
                        <span className="text-stone-500">{t('clients.floorPrice')}:</span>{' '}
                        <span className="text-stone-900 font-medium">{new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(client.floorPrice)}</span>
                      </div>
                    )}
                    {client.targetCloseDate && (
                      <div>
                        <span className="text-stone-500">{t('clients.targetCloseDate')}:</span>{' '}
                        <span className="text-stone-900">{client.targetCloseDate}</span>
                      </div>
                    )}
                  </dd>
                </div>
              )}
            </dl>
            )}
          </div>
        </div>

        {/* Transactions Timeline */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-stone-900 mb-4">
              {t('clients.details.transactionsHistory')}
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
              <div className="space-y-8">
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="border border-stone-200 rounded-lg p-6"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-md font-semibold text-stone-900">
                        {t('clients.details.transactionNumber', { id: transaction.id })}
                      </h4>
                      <Link
                        to={`/transactions/${transaction.id}`}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                      >
                        {t('clients.details.viewDetails')}
                      </Link>
                    </div>
                    <TransactionTimeline transaction={transaction} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-stone-500">
                {t('clients.details.noTransactions')}
              </p>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={deleteConfirm}
        onClose={() => setDeleteConfirm(false)}
        onConfirm={confirmDeleteClient}
        title={t('clients.details.deleteConfirmTitle')}
        message={
          transactions.length > 0
            ? t('clients.details.deleteBlockedMessage', { count: transactions.length })
            : t('clients.details.deleteConfirmMessage', { name: `${client.firstName} ${client.lastName}` })
        }
        confirmLabel={t('common.delete')}
        variant="danger"
        isLoading={deleteClientMutation.isPending}
      />
    </div>
  )
}
