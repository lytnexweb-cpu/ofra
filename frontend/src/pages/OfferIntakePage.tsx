import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Check, AlertTriangle, Link2, ChevronDown, ChevronUp, ArrowRightLeft, Clock } from 'lucide-react'
import { OfraLogo } from '../components/OfraLogo'
import { offerIntakeApi, type OfferIntakeSubmission, type OfferIntakeRespondPayload } from '../api/offer-intake.api'

function formatCAD(amount: number): string {
  return new Intl.NumberFormat('fr-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

const STORAGE_KEY_PREFIX = 'ofra-intake-'

export default function OfferIntakePage() {
  const { token } = useParams<{ token: string }>()
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  // Check localStorage for existing offerId (Phase C — returning visitor)
  const storedOfferId = token ? localStorage.getItem(`${STORAGE_KEY_PREFIX}${token}`) : null

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    price: '',
    message: '',
    // Phase B
    deposit: '',
    depositDeadline: '',
    closingDate: '',
    financingAmount: '',
    inspectionRequired: false,
    inspectionDelay: '',
    inclusions: '',
  })
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [offerId, setOfferId] = useState<number | null>(storedOfferId ? Number(storedOfferId) : null)

  // Phase C — respond form
  const [respondData, setRespondData] = useState({
    price: '',
    message: '',
    deposit: '',
    depositDeadline: '',
    closingDate: '',
    financingAmount: '',
    inspectionRequired: false,
    inspectionDelay: '',
    inclusions: '',
  })
  const [showRespondAdvanced, setShowRespondAdvanced] = useState(false)

  const { data, isLoading, error: loadError } = useQuery({
    queryKey: ['offer-intake', token],
    queryFn: () => offerIntakeApi.getInfo(token!),
    enabled: !!token,
    retry: false,
  })

  // Phase C — load status if we have an offerId
  const { data: statusData, isLoading: isLoadingStatus } = useQuery({
    queryKey: ['offer-intake-status', token, offerId],
    queryFn: () => offerIntakeApi.getStatus(token!, offerId!),
    enabled: !!token && !!offerId,
    refetchInterval: 30000,
  })

  const submitMutation = useMutation({
    mutationFn: (payload: OfferIntakeSubmission) => offerIntakeApi.submit(token!, payload),
    onSuccess: (response) => {
      if (response.success && response.data) {
        const newOfferId = response.data.offerId
        setOfferId(newOfferId)
        if (token) localStorage.setItem(`${STORAGE_KEY_PREFIX}${token}`, String(newOfferId))
        queryClient.invalidateQueries({ queryKey: ['offer-intake-status', token, newOfferId] })
      }
    },
  })

  const respondMutation = useMutation({
    mutationFn: (payload: OfferIntakeRespondPayload) => offerIntakeApi.respond(token!, offerId!, payload),
    onSuccess: (response) => {
      if (response.success) {
        setRespondData({ price: '', message: '', deposit: '', depositDeadline: '', closingDate: '', financingAmount: '', inspectionRequired: false, inspectionDelay: '', inclusions: '' })
        queryClient.invalidateQueries({ queryKey: ['offer-intake-status', token, offerId] })
      }
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const price = parseFloat(formData.price)
    if (!formData.fullName.trim() || !formData.email.trim() || isNaN(price) || price <= 0) return

    submitMutation.mutate({
      fullName: formData.fullName.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim() || undefined,
      price,
      message: formData.message.trim() || undefined,
      deposit: formData.deposit ? Number(formData.deposit) : undefined,
      depositDeadline: formData.depositDeadline || undefined,
      closingDate: formData.closingDate || undefined,
      financingAmount: formData.financingAmount ? Number(formData.financingAmount) : undefined,
      inspectionRequired: formData.inspectionRequired || undefined,
      inspectionDelay: formData.inspectionRequired && formData.inspectionDelay ? formData.inspectionDelay : undefined,
      inclusions: formData.inclusions.trim() || undefined,
    })
  }

  const handleRespond = (e: React.FormEvent) => {
    e.preventDefault()
    const price = parseFloat(respondData.price)
    if (isNaN(price) || price <= 0) return

    respondMutation.mutate({
      price,
      message: respondData.message.trim() || undefined,
      deposit: respondData.deposit ? Number(respondData.deposit) : undefined,
      depositDeadline: respondData.depositDeadline || undefined,
      closingDate: respondData.closingDate || undefined,
      financingAmount: respondData.financingAmount ? Number(respondData.financingAmount) : undefined,
      inspectionRequired: respondData.inspectionRequired || undefined,
      inspectionDelay: respondData.inspectionRequired && respondData.inspectionDelay ? respondData.inspectionDelay : undefined,
      inclusions: respondData.inclusions.trim() || undefined,
    })
  }

  const inputClass =
    'mt-1 block w-full border border-stone-300 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f] text-sm'
  const labelClass = 'block text-sm font-medium text-stone-700'
  const smallLabelClass = 'block text-xs font-medium text-stone-600'

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="animate-pulse text-stone-400">{t('common.loading')}</div>
      </div>
    )
  }

  // Error states (expired, disabled, not found)
  if (loadError || !data?.success) {
    const errorCode = (data as any)?.error?.code
    let title = t('offerIntake.errorTitle')
    let message = t('offerIntake.errorGeneric')

    if (errorCode === 'E_LINK_EXPIRED') {
      title = t('offerIntake.expiredTitle')
      message = t('offerIntake.expiredMessage')
    } else if (errorCode === 'E_LINK_DISABLED') {
      title = t('offerIntake.disabledTitle')
      message = t('offerIntake.disabledMessage')
    } else if (errorCode === 'E_LINK_NOT_FOUND') {
      title = t('offerIntake.notFoundTitle')
      message = t('offerIntake.notFoundMessage')
    }

    return (
      <div className="min-h-screen bg-stone-50 flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-stone-200 p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <h1 className="text-lg font-semibold text-stone-900 mb-2">{title}</h1>
            <p className="text-sm text-stone-500">{message}</p>
          </div>
        </div>
      </div>
    )
  }

  // ── Phase C: Negotiation view (offerId exists → show status) ──
  if (offerId && statusData?.success && statusData.data) {
    const status = statusData.data
    const canRespond = ['received', 'countered'].includes(status.status) && status.waitingFor === 'seller'
    const isAccepted = status.status === 'accepted'
    const isRejected = status.status === 'rejected'

    return (
      <div className="min-h-screen bg-stone-50 flex flex-col">
        <Header />
        <main className="max-w-2xl mx-auto px-4 py-8 flex-1 w-full">
          {/* Property summary */}
          <PropertySummary info={data.data!} t={t} />

          {/* Status card */}
          <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-5 sm:p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                isAccepted ? 'bg-emerald-100' : isRejected ? 'bg-red-100' : 'bg-blue-100'
              }`}>
                {isAccepted ? <Check className="w-4.5 h-4.5 text-emerald-600" /> :
                 isRejected ? <AlertTriangle className="w-4.5 h-4.5 text-red-600" /> :
                 <ArrowRightLeft className="w-4.5 h-4.5 text-blue-600" />}
              </div>
              <div>
                <h2 className="text-base font-semibold text-stone-900">{t('offerIntake.negotiationTitle')}</h2>
                <p className="text-xs text-stone-500">
                  {isAccepted ? t('offerIntake.statusAccepted') :
                   isRejected ? t('offerIntake.statusRejected') :
                   status.waitingFor === 'seller'
                     ? t('offerIntake.waitingSeller')
                     : t('offerIntake.waitingBuyer')}
                </p>
              </div>
            </div>

            {/* Revision history */}
            <div className="space-y-3">
              {status.revisions.map((rev) => (
                <div
                  key={rev.revisionNumber}
                  className={`rounded-lg border p-4 ${
                    rev.direction === 'buyer_to_seller'
                      ? 'border-blue-200 bg-blue-50/50'
                      : 'border-amber-200 bg-amber-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-stone-500">
                      {rev.direction === 'buyer_to_seller'
                        ? `${rev.fromName ?? t('offerIntake.buyer')} →`
                        : `${rev.fromName ?? t('offerIntake.seller')} →`}
                    </span>
                    <span className="text-xs text-stone-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(rev.createdAt).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-lg font-bold text-stone-900">{formatCAD(rev.price)}</p>
                  {rev.deposit != null && (
                    <p className="text-xs text-stone-600">{t('offerIntake.depositLabel')}: {formatCAD(rev.deposit)}</p>
                  )}
                  {rev.closingDate && (
                    <p className="text-xs text-stone-600">{t('offerIntake.closingDateLabel')}: {rev.closingDate}</p>
                  )}
                  {rev.message && (
                    <p className="text-sm text-stone-600 mt-1 italic">"{rev.message}"</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Respond form — only if it's the buyer's turn (waitingFor === 'seller' means seller hasn't responded yet, but from public link the external party is the buyer) */}
          {canRespond && (
            <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-5 sm:p-6">
              <h3 className="text-sm font-semibold text-stone-900 mb-4">{t('offerIntake.respondTitle')}</h3>

              {respondMutation.error && (
                <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3">
                  <p className="text-sm text-red-700">{t('offerIntake.submitError')}</p>
                </div>
              )}

              <form onSubmit={handleRespond} className="space-y-4">
                <div>
                  <label htmlFor="respond-price" className={labelClass}>
                    {t('offerIntake.offerPrice')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="respond-price"
                    required
                    min="1"
                    step="1"
                    value={respondData.price}
                    onChange={(e) => setRespondData({ ...respondData, price: e.target.value })}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label htmlFor="respond-message" className={labelClass}>
                    {t('offerIntake.message')}
                  </label>
                  <textarea
                    id="respond-message"
                    rows={2}
                    value={respondData.message}
                    onChange={(e) => setRespondData({ ...respondData, message: e.target.value })}
                    className={inputClass}
                  />
                </div>

                {/* Advanced fields toggle */}
                <button
                  type="button"
                  onClick={() => setShowRespondAdvanced(!showRespondAdvanced)}
                  className="flex items-center gap-1.5 text-xs font-medium text-stone-500 hover:text-stone-700"
                >
                  {showRespondAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  {t('offerIntake.advancedFields')}
                </button>

                {showRespondAdvanced && (
                  <AdvancedFields
                    data={respondData}
                    onChange={setRespondData}
                    inputClass={inputClass}
                    smallLabelClass={smallLabelClass}
                    t={t}
                  />
                )}

                <button
                  type="submit"
                  disabled={respondMutation.isPending}
                  className="w-full py-2.5 px-4 rounded-lg shadow-sm text-sm font-semibold text-white bg-[#1e3a5f] hover:bg-[#1e3a5f]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1e3a5f] disabled:opacity-50 transition-colors"
                >
                  {respondMutation.isPending ? t('offerIntake.submitting') : t('offerIntake.respondButton')}
                </button>
              </form>
            </div>
          )}

          {(isAccepted || isRejected) && (
            <div className={`rounded-xl border p-6 text-center ${isAccepted ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}`}>
              <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 ${isAccepted ? 'bg-emerald-100' : 'bg-red-100'}`}>
                {isAccepted ? <Check className="w-7 h-7 text-emerald-600" /> : <AlertTriangle className="w-7 h-7 text-red-600" />}
              </div>
              <p className="text-sm font-semibold text-stone-900">
                {isAccepted ? t('offerIntake.acceptedMessage') : t('offerIntake.rejectedMessage')}
              </p>
            </div>
          )}
        </main>
        <Footer t={t} />
      </div>
    )
  }

  // Loading status for returning visitor
  if (offerId && isLoadingStatus) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="animate-pulse text-stone-400">{t('common.loading')}</div>
      </div>
    )
  }

  const info = data.data!

  // ── Phase A/B: Initial offer form ──
  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      <Header />

      <main className="max-w-2xl mx-auto px-4 py-8 flex-1 w-full">
        <PropertySummary info={info} t={t} />

        {/* Offer form */}
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-5 sm:p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 bg-[#1e3a5f]/10 rounded-lg flex items-center justify-center">
              <Link2 className="w-4.5 h-4.5 text-[#1e3a5f]" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-stone-900">{t('offerIntake.formTitle')}</h1>
              <p className="text-xs text-stone-500">{t('offerIntake.formSubtitle')}</p>
            </div>
          </div>

          {submitMutation.error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3">
              <p className="text-sm text-red-700">{t('offerIntake.submitError')}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="intake-name" className={labelClass}>
                {t('offerIntake.fullName')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="intake-name"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className={inputClass}
                placeholder={t('offerIntake.fullNamePlaceholder')}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="intake-email" className={labelClass}>
                  {t('offerIntake.email')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="intake-email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={inputClass}
                  placeholder="nom@exemple.com"
                />
              </div>
              <div>
                <label htmlFor="intake-phone" className={labelClass}>
                  {t('offerIntake.phone')}
                </label>
                <input
                  type="tel"
                  id="intake-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className={inputClass}
                  placeholder="506-555-1234"
                />
              </div>
            </div>

            <div>
              <label htmlFor="intake-price" className={labelClass}>
                {t('offerIntake.offerPrice')} <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="intake-price"
                required
                min="1"
                step="1"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className={inputClass}
                placeholder="425000"
              />
            </div>

            {/* Phase B: Advanced fields toggle */}
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-1.5 text-xs font-medium text-[#1e3a5f] hover:text-[#1e3a5f]/80"
            >
              {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              {t('offerIntake.advancedFields')}
            </button>

            {showAdvanced && (
              <AdvancedFields
                data={formData}
                onChange={setFormData}
                inputClass={inputClass}
                smallLabelClass={smallLabelClass}
                t={t}
              />
            )}

            <div>
              <label htmlFor="intake-message" className={labelClass}>
                {t('offerIntake.message')}
              </label>
              <textarea
                id="intake-message"
                rows={3}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className={inputClass}
                placeholder={t('offerIntake.messagePlaceholder')}
              />
            </div>

            <button
              type="submit"
              disabled={submitMutation.isPending}
              className="w-full py-3 px-4 rounded-lg shadow-sm text-sm font-semibold text-white bg-[#1e3a5f] hover:bg-[#1e3a5f]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1e3a5f] disabled:opacity-50 transition-colors"
            >
              {submitMutation.isPending ? t('offerIntake.submitting') : t('offerIntake.submitButton')}
            </button>
          </form>
        </div>
      </main>

      <Footer t={t} />
    </div>
  )
}

// ── Shared sub-components ──

function Header() {
  return (
    <header className="bg-white border-b border-stone-200">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-2.5">
        <OfraLogo size={28} />
        <span className="text-base font-bold tracking-tight text-[#1e3a5f]">OFRA</span>
      </div>
    </header>
  )
}

function Footer({ t }: { t: (key: string) => string }) {
  return (
    <footer className="py-4 text-center">
      <div className="flex items-center justify-center gap-1.5 text-xs text-stone-400">
        <OfraLogo size={14} />
        {t('offerIntake.poweredBy')}
      </div>
    </footer>
  )
}

function PropertySummary({ info, t }: { info: { property: { address: string; city: string; postalCode: string } | null; listPrice: number | null; brokerName: string | null }; t: (key: string) => string }) {
  if (!info.property) return null
  return (
    <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-5 sm:p-6 mb-6">
      <h2 className="text-[10px] font-semibold text-stone-500 uppercase tracking-wide mb-2">
        {t('offerIntake.propertyLabel')}
      </h2>
      <p className="text-lg font-semibold text-stone-900">{info.property.address}</p>
      <p className="text-sm text-stone-600">
        {info.property.city}{info.property.postalCode ? `, ${info.property.postalCode}` : ''}
      </p>
      {info.listPrice && (
        <p className="mt-2 text-sm text-stone-500">
          {t('offerIntake.askingPrice')}: <span className="font-semibold text-stone-900">{formatCAD(info.listPrice)}</span>
        </p>
      )}
      {info.brokerName && (
        <p className="mt-1 text-xs text-stone-400">
          {t('offerIntake.listedBy')} {info.brokerName}
        </p>
      )}
    </div>
  )
}

function AdvancedFields<T extends { deposit: string; depositDeadline: string; closingDate: string; financingAmount: string; inspectionRequired: boolean; inspectionDelay: string; inclusions: string }>({
  data,
  onChange,
  inputClass,
  smallLabelClass,
  t,
}: {
  data: T
  onChange: (d: T) => void
  inputClass: string
  smallLabelClass: string
  t: (key: string) => string
}) {
  return (
    <div className="rounded-lg border border-stone-200 bg-stone-50/50 p-4 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="adv-deposit" className={smallLabelClass}>
            {t('offerIntake.depositLabel')}
          </label>
          <input
            type="number"
            id="adv-deposit"
            min="0"
            step="500"
            value={data.deposit}
            onChange={(e) => onChange({ ...data, deposit: e.target.value })}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="adv-depositDeadline" className={smallLabelClass}>
            {t('offerIntake.depositDeadlineLabel')}
          </label>
          <input
            type="date"
            id="adv-depositDeadline"
            value={data.depositDeadline}
            onChange={(e) => onChange({ ...data, depositDeadline: e.target.value })}
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="adv-closingDate" className={smallLabelClass}>
            {t('offerIntake.closingDateLabel')}
          </label>
          <input
            type="date"
            id="adv-closingDate"
            value={data.closingDate}
            onChange={(e) => onChange({ ...data, closingDate: e.target.value })}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="adv-financing" className={smallLabelClass}>
            {t('offerIntake.financingLabel')}
          </label>
          <input
            type="number"
            id="adv-financing"
            min="0"
            step="1000"
            value={data.financingAmount}
            onChange={(e) => onChange({ ...data, financingAmount: e.target.value })}
            className={inputClass}
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-stone-700 cursor-pointer">
          <input
            type="checkbox"
            checked={data.inspectionRequired}
            onChange={(e) => onChange({ ...data, inspectionRequired: e.target.checked })}
            className="rounded border-stone-300 text-[#1e3a5f] focus:ring-[#1e3a5f]"
          />
          {t('offerIntake.inspectionRequired')}
        </label>
        {data.inspectionRequired && (
          <input
            type="text"
            placeholder={t('offerIntake.inspectionDelayPlaceholder')}
            value={data.inspectionDelay}
            onChange={(e) => onChange({ ...data, inspectionDelay: e.target.value })}
            className="flex-1 border border-stone-300 rounded-lg shadow-sm py-1.5 px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f]"
          />
        )}
      </div>

      <div>
        <label htmlFor="adv-inclusions" className={smallLabelClass}>
          {t('offerIntake.inclusionsLabel')}
        </label>
        <textarea
          id="adv-inclusions"
          rows={2}
          value={data.inclusions}
          onChange={(e) => onChange({ ...data, inclusions: e.target.value })}
          className={inputClass}
          placeholder={t('offerIntake.inclusionsPlaceholder')}
        />
      </div>
    </div>
  )
}
