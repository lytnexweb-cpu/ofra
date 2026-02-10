import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Package, ChevronDown, ChevronUp } from 'lucide-react'
import { offersApi, type CreateOfferRequest } from '../api/offers.api'
import { packsApi, type ConditionPack, type PackTemplate } from '../api/packs.api'
import { parseApiError, isSessionExpired, type ParsedError } from '../utils/apiError'
import { useMediaQuery } from '../hooks/useMediaQuery'

interface CreateOfferModalProps {
  isOpen: boolean
  onClose: () => void
  transactionId: number
  listPrice?: number | null
}

function formatCAD(amount: number): string {
  return new Intl.NumberFormat('fr-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export default function CreateOfferModal({
  isOpen,
  onClose,
  transactionId,
  listPrice,
}: CreateOfferModalProps) {
  const { t } = useTranslation()
  const isDesktop = useMediaQuery('(min-width: 640px)')
  const [formData, setFormData] = useState({
    price: '',
    deposit: '',
    depositDeadline: '',
    closingDate: '',
    financingAmount: '',
    financingEnabled: false,
    expiryAt: '',
    inspectionRequired: false,
    inspectionDelay: '',
    direction: 'buyer_to_seller' as CreateOfferRequest['direction'],
    inclusions: '',
    message: '',
    notes: '',
  })
  const [error, setError] = useState<ParsedError | null>(null)
  const [selectedPack, setSelectedPack] = useState<string | null>(null)
  const [packTemplates, setPackTemplates] = useState<PackTemplate[]>([])
  const [packsExpanded, setPacksExpanded] = useState(false)
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  // Fetch available packs
  const { data: packsData } = useQuery({
    queryKey: ['condition-packs'],
    queryFn: () => packsApi.listPacks(),
    enabled: isOpen,
    staleTime: 60_000,
  })

  const packs = packsData?.data?.packs ?? []

  const handleSelectPack = async (packType: string) => {
    setSelectedPack(packType)
    try {
      const res = await packsApi.getPackTemplates(packType)
      if (res.success && res.data) {
        setPackTemplates(res.data.templates)
      }
    } catch {
      setPackTemplates([])
    }
  }

  const createMutation = useMutation({
    mutationFn: (data: CreateOfferRequest) => offersApi.create(transactionId, data),
    onSuccess: async (response) => {
      if (response.success) {
        // If a pack was selected, apply it to the offer
        if (selectedPack && response.data?.offer?.id) {
          try {
            await packsApi.applyPack(response.data.offer.id, selectedPack)
          } catch {
            // Pack application failed but offer was created
          }
        }

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
      depositDeadline: '',
      closingDate: '',
      financingAmount: '',
      financingEnabled: false,
      expiryAt: '',
      inspectionRequired: false,
      inspectionDelay: '',
      direction: 'buyer_to_seller',
      inclusions: '',
      message: '',
      notes: '',
    })
    setError(null)
    setSelectedPack(null)
    setPackTemplates([])
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
    const financingAmount = formData.financingEnabled && formData.financingAmount
      ? parseFloat(formData.financingAmount)
      : null
    const inspectionDelay = formData.inspectionRequired && formData.inspectionDelay
      ? parseInt(formData.inspectionDelay, 10)
      : null

    createMutation.mutate({
      price,
      deposit: deposit && !isNaN(deposit) ? deposit : null,
      depositDeadline: formData.depositDeadline || null,
      closingDate: formData.closingDate || null,
      financingAmount: financingAmount && !isNaN(financingAmount) ? financingAmount : null,
      expiryAt: formData.expiryAt || null,
      inspectionRequired: formData.inspectionRequired,
      inspectionDelay: inspectionDelay && !isNaN(inspectionDelay) ? inspectionDelay : null,
      direction: formData.direction,
      inclusions: formData.inclusions.trim() || null,
      message: formData.message.trim() || null,
      notes: formData.notes.trim() || null,
    })
  }

  const handleClose = () => {
    if (!createMutation.isPending) {
      resetForm()
      onClose()
    }
  }

  // Price diff calculation
  const priceNum = parseFloat(formData.price)
  const priceDiff =
    !isNaN(priceNum) && priceNum > 0 && listPrice && listPrice > 0
      ? priceNum - listPrice
      : null

  if (!isOpen) return null

  const inputClass =
    'mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white'
  const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300'

  const formSection = (
    <div className="space-y-4">
      {/* Price + Diff */}
      <div>
        <label htmlFor="offer-price" className={labelClass}>
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
          className={inputClass}
          placeholder="425000"
        />
        {priceDiff !== null && (
          <p
            className={`mt-1 text-xs font-medium ${priceDiff >= 0 ? 'text-green-600' : 'text-red-600'}`}
          >
            {priceDiff >= 0 ? '+' : ''}
            {formatCAD(priceDiff)} {t('offers.createModal.vsListPrice')}
          </p>
        )}
      </div>

      {/* Deposit + Deposit Deadline */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="offer-deposit" className={labelClass}>
            {t('offers.deposit')}
          </label>
          <input
            type="number"
            id="offer-deposit"
            min="0"
            step="0.01"
            value={formData.deposit}
            onChange={(e) => setFormData({ ...formData, deposit: e.target.value })}
            className={inputClass}
            placeholder="20000"
          />
        </div>
        <div>
          <label htmlFor="offer-deposit-deadline" className={labelClass}>
            {t('offers.createModal.depositDeadline')}
          </label>
          <input
            type="date"
            id="offer-deposit-deadline"
            value={formData.depositDeadline}
            onChange={(e) => setFormData({ ...formData, depositDeadline: e.target.value })}
            className={inputClass}
          />
        </div>
      </div>

      {/* Closing Date + Expiry */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="offer-closing" className={labelClass}>
            {t('offers.createModal.closingDate')}
          </label>
          <input
            type="date"
            id="offer-closing"
            value={formData.closingDate}
            onChange={(e) => setFormData({ ...formData, closingDate: e.target.value })}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="offer-expiry" className={labelClass}>
            {t('offers.expiryDate')}
          </label>
          <input
            type="datetime-local"
            id="offer-expiry"
            value={formData.expiryAt}
            onChange={(e) => setFormData({ ...formData, expiryAt: e.target.value })}
            className={inputClass}
          />
        </div>
      </div>

      {/* Direction */}
      <div>
        <label htmlFor="offer-direction" className={labelClass}>
          {t('offers.directionLabel')}
        </label>
        <select
          id="offer-direction"
          value={formData.direction}
          onChange={(e) =>
            setFormData({ ...formData, direction: e.target.value as CreateOfferRequest['direction'] })
          }
          className={inputClass}
        >
          <option value="buyer_to_seller">{t('offers.buyerToSeller')}</option>
          <option value="seller_to_buyer">{t('offers.sellerToBuyer')}</option>
        </select>
      </div>

      {/* Financing toggle */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.financingEnabled}
            onChange={(e) =>
              setFormData({ ...formData, financingEnabled: e.target.checked })
            }
            className="h-4 w-4 rounded border-gray-300 accent-blue-600"
          />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('offers.createModal.financingToggle')}
          </span>
        </label>
        {formData.financingEnabled && (
          <input
            type="number"
            min="0"
            step="0.01"
            value={formData.financingAmount}
            onChange={(e) => setFormData({ ...formData, financingAmount: e.target.value })}
            className={inputClass}
            placeholder={t('offers.financingAmount')}
          />
        )}
      </div>

      {/* Inspection toggle */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.inspectionRequired}
            onChange={(e) =>
              setFormData({ ...formData, inspectionRequired: e.target.checked })
            }
            className="h-4 w-4 rounded border-gray-300 accent-blue-600"
          />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('offers.createModal.inspectionToggle')}
          </span>
        </label>
        {formData.inspectionRequired && (
          <div>
            <label className={labelClass}>{t('offers.createModal.inspectionDelay')}</label>
            <input
              type="number"
              min="1"
              value={formData.inspectionDelay}
              onChange={(e) => setFormData({ ...formData, inspectionDelay: e.target.value })}
              className={inputClass}
              placeholder="10"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {t('offers.createModal.inspectionDelayHint')}
            </p>
          </div>
        )}
      </div>

      {/* Inclusions */}
      <div>
        <label htmlFor="offer-inclusions" className={labelClass}>
          {t('offers.createModal.inclusions')}
        </label>
        <textarea
          id="offer-inclusions"
          rows={2}
          value={formData.inclusions}
          onChange={(e) => setFormData({ ...formData, inclusions: e.target.value })}
          className={inputClass}
          placeholder={t('offers.createModal.inclusionsPlaceholder')}
        />
      </div>

      {/* Message */}
      <div>
        <label htmlFor="offer-message" className={labelClass}>
          {t('offers.createModal.message')}
        </label>
        <textarea
          id="offer-message"
          rows={2}
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          className={inputClass}
          placeholder={t('offers.createModal.messagePlaceholder')}
        />
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="offer-notes" className={labelClass}>
          {t('offers.notes')}
        </label>
        <textarea
          id="offer-notes"
          rows={2}
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          className={inputClass}
          placeholder={t('offers.notesPlaceholder')}
        />
      </div>
    </div>
  )

  const packLevelBadge = (level: string) => {
    const colors: Record<string, string> = {
      blocking: 'bg-red-100 text-red-700',
      required: 'bg-amber-100 text-amber-700',
      recommended: 'bg-blue-100 text-blue-700',
    }
    return (
      <span className={`inline-flex px-1.5 py-0.5 text-[10px] font-medium rounded ${colors[level] ?? 'bg-gray-100 text-gray-600'}`}>
        {t(`conditions.levels.${level}`)}
      </span>
    )
  }

  const packsSection = (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
        <Package className="w-4 h-4" />
        {t('offers.packs.title')}
      </h4>
      <p className="text-xs text-muted-foreground">{t('offers.packs.description')}</p>

      {/* Pack chips */}
      <div className="flex flex-wrap gap-2">
        {packs.map((pack: ConditionPack) => (
          <button
            key={pack.packType}
            type="button"
            onClick={() => handleSelectPack(pack.packType)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
              selectedPack === pack.packType
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background border-border hover:bg-accent'
            }`}
          >
            {pack.label}
          </button>
        ))}
      </div>

      {/* Pack loaded state */}
      {selectedPack && packTemplates.length > 0 && (
        <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-green-800 dark:text-green-300">
              {t('offers.packs.loaded')}
            </span>
            <span className="text-xs text-green-600 dark:text-green-400">
              {packTemplates.length} {t('offers.packs.conditionsCount')}
            </span>
          </div>
          <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
            {packTemplates.map((tmpl) => (
              <div
                key={tmpl.id}
                className="flex items-center justify-between gap-2 text-xs py-1"
              >
                <span className="text-gray-700 dark:text-gray-300 truncate">{tmpl.title}</span>
                {packLevelBadge(tmpl.level)}
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedPack && packTemplates.length === 0 && (
        <p className="text-xs text-muted-foreground italic">
          {t('offers.packs.noTemplates')}
        </p>
      )}
    </div>
  )

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={handleClose} />

      <div className="relative z-10 flex min-h-full items-center justify-center p-4">
        <div className={`w-full rounded-xl bg-white dark:bg-gray-800 shadow-xl ${isDesktop ? 'max-w-4xl' : 'max-w-lg'}`}>
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

              {isDesktop ? (
                /* Desktop: 2-column layout */
                <div className="grid grid-cols-5 gap-6">
                  <div className="col-span-3 max-h-[60vh] overflow-y-auto pr-2">
                    {formSection}
                  </div>
                  <div className="col-span-2 border-l border-border pl-6 max-h-[60vh] overflow-y-auto">
                    {packsSection}
                  </div>
                </div>
              ) : (
                /* Mobile: accordion */
                <div className="space-y-4">
                  {formSection}
                  <div className="border-t pt-3">
                    <button
                      type="button"
                      onClick={() => setPacksExpanded(!packsExpanded)}
                      className="flex items-center justify-between w-full text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      <span className="flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        {t('offers.packs.title')}
                        {selectedPack && (
                          <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
                            {packTemplates.length}
                          </span>
                        )}
                      </span>
                      {packsExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                    {packsExpanded && <div className="mt-3">{packsSection}</div>}
                  </div>
                </div>
              )}
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
