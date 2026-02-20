import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { clientsApi, type CreateClientRequest } from '../api/clients.api'
import { parseApiError, isSessionExpired, type ParsedError } from '../utils/apiError'

interface CreateClientModalProps {
  isOpen: boolean
  onClose: () => void
  onCreated?: (client: { id: number; firstName: string; lastName: string }) => void
}

type TabType = 'basic' | 'address' | 'phones'

export default function CreateClientModal({ isOpen, onClose, onCreated }: CreateClientModalProps) {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<TabType>('basic')
  const [formData, setFormData] = useState<CreateClientRequest>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    notes: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    provinceState: '',
    postalCode: '',
    homePhone: '',
    workPhone: '',
    cellPhone: '',
    isPreApproved: undefined,
    preApprovalAmount: undefined,
    preApprovalLender: '',
    financingBudget: undefined,
    motivationLevel: undefined,
    floorPrice: undefined,
    targetCloseDate: '',
  })
  const [error, setError] = useState<ParsedError | null>(null)
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const createMutation = useMutation({
    mutationFn: clientsApi.create,
    onSuccess: (response) => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: ['clients'] })
        const created = response.data?.client
        if (created && onCreated) {
          onCreated({ id: created.id, firstName: created.firstName, lastName: created.lastName })
        }
        onClose()
        resetForm()
      } else {
        setError({
          title: t('common.error'),
          message: response.error?.message || t('clients.failedCreate'),
        })
      }
    },
    onError: (err) => {
      const parsedError = parseApiError(err)
      setError(parsedError)

      // Redirect to login if session expired
      if (isSessionExpired(err)) {
        setTimeout(() => {
          navigate('/login')
        }, 2000)
      }
    },
  })

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      notes: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      provinceState: '',
      postalCode: '',
      homePhone: '',
      workPhone: '',
      cellPhone: '',
      isPreApproved: undefined,
      preApprovalAmount: undefined,
      preApprovalLender: '',
      financingBudget: undefined,
      motivationLevel: undefined,
      floorPrice: undefined,
      targetCloseDate: '',
    })
    setError(null)
    setActiveTab('basic')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setError({
        title: t('clients.requiredFields'),
        message: t('clients.nameRequired'),
      })
      return
    }

    createMutation.mutate({
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      email: formData.email?.trim() || undefined,
      phone: formData.phone?.trim() || undefined,
      notes: formData.notes?.trim() || undefined,
      addressLine1: formData.addressLine1?.trim() || undefined,
      addressLine2: formData.addressLine2?.trim() || undefined,
      city: formData.city?.trim() || undefined,
      provinceState: formData.provinceState?.trim() || undefined,
      postalCode: formData.postalCode?.trim() || undefined,
      homePhone: formData.homePhone?.trim() || undefined,
      workPhone: formData.workPhone?.trim() || undefined,
      cellPhone: formData.cellPhone?.trim() || undefined,
      clientType: formData.clientType || undefined,
      isPreApproved: formData.isPreApproved ?? undefined,
      preApprovalAmount: formData.preApprovalAmount || undefined,
      preApprovalLender: formData.preApprovalLender?.trim() || undefined,
      financingBudget: formData.financingBudget || undefined,
      motivationLevel: formData.motivationLevel || undefined,
      floorPrice: formData.floorPrice || undefined,
      targetCloseDate: formData.targetCloseDate?.trim() || undefined,
    })
  }

  const handleClose = () => {
    if (!createMutation.isPending) {
      resetForm()
      onClose()
    }
  }

  if (!isOpen) return null

  const tabs = [
    { id: 'basic' as TabType, label: t('clients.tabs.basic') },
    { id: 'address' as TabType, label: t('clients.tabs.address') },
    { id: 'phones' as TabType, label: t('clients.tabs.phones') },
  ]

  return (
    <div className="fixed inset-0 z-50">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40" onClick={handleClose} />

      {/* Modal content */}
      <div className="relative z-10 flex min-h-full items-center justify-center p-4">
        <div
          className="w-full max-w-lg rounded-xl bg-white shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <form onSubmit={handleSubmit}>
            <div className="p-6">
              <h3 className="text-lg font-medium text-stone-900 mb-4">{t('clients.new')}</h3>

              {/* Error Display */}
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
                      {t('clients.goToLogin')}
                    </button>
                  )}
                </div>
              )}

              {/* Tabs */}
              <div className="border-b border-stone-200 mb-4">
                <nav className="-mb-px flex space-x-4">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`py-2 px-1 text-sm font-medium border-b-2 ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Tab Content */}
              <div className="space-y-4">
                {/* Basic Info Tab */}
                {activeTab === 'basic' && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="firstName"
                          className="block text-sm font-medium text-stone-700"
                        >
                          {t('clients.firstName')} <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="firstName"
                          required
                          value={formData.firstName}
                          onChange={(e) =>
                            setFormData({ ...formData, firstName: e.target.value })
                          }
                          className="mt-1 block w-full border border-stone-300 rounded-md shadow-sm py-2 px-3 bg-white text-stone-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="lastName"
                          className="block text-sm font-medium text-stone-700"
                        >
                          {t('clients.lastName')} <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="lastName"
                          required
                          value={formData.lastName}
                          onChange={(e) =>
                            setFormData({ ...formData, lastName: e.target.value })
                          }
                          className="mt-1 block w-full border border-stone-300 rounded-md shadow-sm py-2 px-3 bg-white text-stone-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium text-stone-700"
                      >
                        {t('clients.email')}
                      </label>
                      <input
                        type="email"
                        id="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        className="mt-1 block w-full border border-stone-300 rounded-md shadow-sm py-2 px-3 bg-white text-stone-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="phone"
                        className="block text-sm font-medium text-stone-700"
                      >
                        {t('clients.phone')}
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                        className="mt-1 block w-full border border-stone-300 rounded-md shadow-sm py-2 px-3 bg-white text-stone-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="clientType"
                        className="block text-sm font-medium text-stone-700"
                      >
                        {t('clients.clientType', 'Type de client')}
                      </label>
                      <select
                        id="clientType"
                        value={formData.clientType || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, clientType: (e.target.value || undefined) as CreateClientRequest['clientType'] })
                        }
                        className="mt-1 block w-full border border-stone-300 rounded-md shadow-sm py-2 px-3 bg-white text-stone-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      >
                        <option value="">{t('clients.clientTypeNone', '— Non spécifié —')}</option>
                        <option value="buyer">{t('clients.clientTypeBuyer', 'Acheteur')}</option>
                        <option value="seller">{t('clients.clientTypeSeller', 'Vendeur')}</option>
                        <option value="both">{t('clients.clientTypeBoth', 'Acheteur & Vendeur')}</option>
                      </select>
                    </div>

                    {/* Buyer section — visible when clientType is buyer or both */}
                    {(formData.clientType === 'buyer' || formData.clientType === 'both') && (
                      <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-4 space-y-3">
                        <h4 className="text-sm font-semibold text-blue-800">{t('clients.buyerSection')}</h4>
                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-2 text-sm text-stone-700 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.isPreApproved ?? false}
                              onChange={(e) => setFormData({ ...formData, isPreApproved: e.target.checked })}
                              className="rounded border-stone-300 text-blue-600 focus:ring-blue-500"
                            />
                            {t('clients.isPreApproved')}
                          </label>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label htmlFor="preApprovalAmount" className="block text-xs font-medium text-stone-600">
                              {t('clients.preApprovalAmount')}
                            </label>
                            <input
                              type="number"
                              id="preApprovalAmount"
                              min="0"
                              step="1000"
                              value={formData.preApprovalAmount ?? ''}
                              onChange={(e) => setFormData({ ...formData, preApprovalAmount: e.target.value ? Number(e.target.value) : undefined })}
                              className="mt-1 block w-full border border-stone-300 rounded-md shadow-sm py-1.5 px-2.5 bg-white text-stone-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                            />
                          </div>
                          <div>
                            <label htmlFor="preApprovalLender" className="block text-xs font-medium text-stone-600">
                              {t('clients.preApprovalLender')}
                            </label>
                            <input
                              type="text"
                              id="preApprovalLender"
                              value={formData.preApprovalLender ?? ''}
                              onChange={(e) => setFormData({ ...formData, preApprovalLender: e.target.value })}
                              className="mt-1 block w-full border border-stone-300 rounded-md shadow-sm py-1.5 px-2.5 bg-white text-stone-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                            />
                          </div>
                        </div>
                        <div>
                          <label htmlFor="financingBudget" className="block text-xs font-medium text-stone-600">
                            {t('clients.financingBudget')}
                          </label>
                          <input
                            type="number"
                            id="financingBudget"
                            min="0"
                            step="1000"
                            value={formData.financingBudget ?? ''}
                            onChange={(e) => setFormData({ ...formData, financingBudget: e.target.value ? Number(e.target.value) : undefined })}
                            className="mt-1 block w-full border border-stone-300 rounded-md shadow-sm py-1.5 px-2.5 bg-white text-stone-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                          />
                        </div>
                      </div>
                    )}

                    {/* Seller section — visible when clientType is seller or both */}
                    {(formData.clientType === 'seller' || formData.clientType === 'both') && (
                      <div className="rounded-lg border border-amber-100 bg-amber-50/50 p-4 space-y-3">
                        <h4 className="text-sm font-semibold text-amber-800">{t('clients.sellerSection')}</h4>
                        <div>
                          <label htmlFor="motivationLevel" className="block text-xs font-medium text-stone-600">
                            {t('clients.motivationLevel')}
                          </label>
                          <select
                            id="motivationLevel"
                            value={formData.motivationLevel || ''}
                            onChange={(e) => setFormData({ ...formData, motivationLevel: (e.target.value || undefined) as CreateClientRequest['motivationLevel'] })}
                            className="mt-1 block w-full border border-stone-300 rounded-md shadow-sm py-1.5 px-2.5 bg-white text-stone-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                          >
                            <option value="">—</option>
                            <option value="low">{t('clients.motivationLow')}</option>
                            <option value="medium">{t('clients.motivationMedium')}</option>
                            <option value="high">{t('clients.motivationHigh')}</option>
                            <option value="urgent">{t('clients.motivationUrgent')}</option>
                          </select>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label htmlFor="floorPrice" className="block text-xs font-medium text-stone-600">
                              {t('clients.floorPrice')}
                            </label>
                            <input
                              type="number"
                              id="floorPrice"
                              min="0"
                              step="1000"
                              value={formData.floorPrice ?? ''}
                              onChange={(e) => setFormData({ ...formData, floorPrice: e.target.value ? Number(e.target.value) : undefined })}
                              className="mt-1 block w-full border border-stone-300 rounded-md shadow-sm py-1.5 px-2.5 bg-white text-stone-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                            />
                          </div>
                          <div>
                            <label htmlFor="targetCloseDate" className="block text-xs font-medium text-stone-600">
                              {t('clients.targetCloseDate')}
                            </label>
                            <input
                              type="date"
                              id="targetCloseDate"
                              value={formData.targetCloseDate ?? ''}
                              onChange={(e) => setFormData({ ...formData, targetCloseDate: e.target.value })}
                              className="mt-1 block w-full border border-stone-300 rounded-md shadow-sm py-1.5 px-2.5 bg-white text-stone-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    <div>
                      <label
                        htmlFor="notes"
                        className="block text-sm font-medium text-stone-700"
                      >
                        {t('clients.notes')}
                      </label>
                      <textarea
                        id="notes"
                        rows={3}
                        value={formData.notes}
                        onChange={(e) =>
                          setFormData({ ...formData, notes: e.target.value })
                        }
                        className="mt-1 block w-full border border-stone-300 rounded-md shadow-sm py-2 px-3 bg-white text-stone-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                  </>
                )}

                {/* Address Tab */}
                {activeTab === 'address' && (
                  <>
                    <div>
                      <label
                        htmlFor="addressLine1"
                        className="block text-sm font-medium text-stone-700"
                      >
                        {t('clients.address.line1')}
                      </label>
                      <input
                        type="text"
                        id="addressLine1"
                        placeholder={t('clients.address.line1Placeholder')}
                        value={formData.addressLine1}
                        onChange={(e) =>
                          setFormData({ ...formData, addressLine1: e.target.value })
                        }
                        className="mt-1 block w-full border border-stone-300 rounded-md shadow-sm py-2 px-3 bg-white text-stone-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="addressLine2"
                        className="block text-sm font-medium text-stone-700"
                      >
                        {t('clients.address.line2')}
                      </label>
                      <input
                        type="text"
                        id="addressLine2"
                        placeholder={t('clients.address.line2Placeholder')}
                        value={formData.addressLine2}
                        onChange={(e) =>
                          setFormData({ ...formData, addressLine2: e.target.value })
                        }
                        className="mt-1 block w-full border border-stone-300 rounded-md shadow-sm py-2 px-3 bg-white text-stone-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="city"
                          className="block text-sm font-medium text-stone-700"
                        >
                          {t('clients.address.city')}
                        </label>
                        <input
                          type="text"
                          id="city"
                          value={formData.city}
                          onChange={(e) =>
                            setFormData({ ...formData, city: e.target.value })
                          }
                          className="mt-1 block w-full border border-stone-300 rounded-md shadow-sm py-2 px-3 bg-white text-stone-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="provinceState"
                          className="block text-sm font-medium text-stone-700"
                        >
                          {t('clients.address.provinceState')}
                        </label>
                        <input
                          type="text"
                          id="provinceState"
                          placeholder={t('clients.address.provincePlaceholder')}
                          value={formData.provinceState}
                          onChange={(e) =>
                            setFormData({ ...formData, provinceState: e.target.value })
                          }
                          className="mt-1 block w-full border border-stone-300 rounded-md shadow-sm py-2 px-3 bg-white text-stone-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label
                        htmlFor="postalCode"
                        className="block text-sm font-medium text-stone-700"
                      >
                        {t('clients.address.postalCode')}
                      </label>
                      <input
                        type="text"
                        id="postalCode"
                        placeholder={t('clients.address.postalPlaceholder')}
                        value={formData.postalCode}
                        onChange={(e) =>
                          setFormData({ ...formData, postalCode: e.target.value })
                        }
                        className="mt-1 block w-full border border-stone-300 rounded-md shadow-sm py-2 px-3 bg-white text-stone-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                  </>
                )}

                {/* Phones Tab */}
                {activeTab === 'phones' && (
                  <>
                    <div>
                      <label
                        htmlFor="cellPhone"
                        className="block text-sm font-medium text-stone-700"
                      >
                        {t('clients.phones.cell')}
                      </label>
                      <input
                        type="tel"
                        id="cellPhone"
                        placeholder={t('clients.phones.cellPlaceholder')}
                        value={formData.cellPhone}
                        onChange={(e) =>
                          setFormData({ ...formData, cellPhone: e.target.value })
                        }
                        className="mt-1 block w-full border border-stone-300 rounded-md shadow-sm py-2 px-3 bg-white text-stone-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="homePhone"
                        className="block text-sm font-medium text-stone-700"
                      >
                        {t('clients.phones.home')}
                      </label>
                      <input
                        type="tel"
                        id="homePhone"
                        placeholder={t('clients.phones.homePlaceholder')}
                        value={formData.homePhone}
                        onChange={(e) =>
                          setFormData({ ...formData, homePhone: e.target.value })
                        }
                        className="mt-1 block w-full border border-stone-300 rounded-md shadow-sm py-2 px-3 bg-white text-stone-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="workPhone"
                        className="block text-sm font-medium text-stone-700"
                      >
                        {t('clients.phones.work')}
                      </label>
                      <input
                        type="tel"
                        id="workPhone"
                        placeholder={t('clients.phones.workPlaceholder')}
                        value={formData.workPhone}
                        onChange={(e) =>
                          setFormData({ ...formData, workPhone: e.target.value })
                        }
                        className="mt-1 block w-full border border-stone-300 rounded-md shadow-sm py-2 px-3 bg-white text-stone-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="bg-stone-50 px-6 py-4 flex justify-end gap-3 rounded-b-xl">
              <button
                type="button"
                onClick={handleClose}
                disabled={createMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-stone-700 bg-white border border-stone-300 rounded-md hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {createMutation.isPending ? t('clients.creating') : t('clients.createClient')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
