import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Check, AlertTriangle, Link2 } from 'lucide-react'
import { OfraLogo } from '../components/OfraLogo'
import { offerIntakeApi, type OfferIntakeSubmission } from '../api/offer-intake.api'

function formatCAD(amount: number): string {
  return new Intl.NumberFormat('fr-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export default function OfferIntakePage() {
  const { token } = useParams<{ token: string }>()
  const { t } = useTranslation()

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    price: '',
    message: '',
  })
  const [submitted, setSubmitted] = useState(false)

  const { data, isLoading, error: loadError } = useQuery({
    queryKey: ['offer-intake', token],
    queryFn: () => offerIntakeApi.getInfo(token!),
    enabled: !!token,
    retry: false,
  })

  const submitMutation = useMutation({
    mutationFn: (payload: OfferIntakeSubmission) => offerIntakeApi.submit(token!, payload),
    onSuccess: (response) => {
      if (response.success) {
        setSubmitted(true)
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
    })
  }

  const inputClass =
    'mt-1 block w-full border border-stone-300 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f] text-sm'
  const labelClass = 'block text-sm font-medium text-stone-700'

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
        <header className="bg-white border-b border-stone-200">
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-2.5">
            <OfraLogo size={28} />
            <span className="text-base font-bold tracking-tight text-[#1e3a5f]">OFRA</span>
          </div>
        </header>
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

  // Success state (offer submitted)
  if (submitted) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col">
        <header className="bg-white border-b border-stone-200">
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-2.5">
            <OfraLogo size={28} />
            <span className="text-base font-bold tracking-tight text-[#1e3a5f]">OFRA</span>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-stone-200 p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <Check className="w-7 h-7 text-emerald-600" />
            </div>
            <h1 className="text-lg font-semibold text-stone-900 mb-2">{t('offerIntake.successTitle')}</h1>
            <p className="text-sm text-stone-500">{t('offerIntake.successMessage')}</p>
          </div>
        </div>
        <footer className="py-4 text-center">
          <div className="flex items-center justify-center gap-1.5 text-xs text-stone-400">
            <OfraLogo size={14} />
            {t('offerIntake.poweredBy')}
          </div>
        </footer>
      </div>
    )
  }

  const info = data.data!

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-stone-200">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <OfraLogo size={28} />
            <span className="text-base font-bold tracking-tight text-[#1e3a5f]">OFRA</span>
          </div>
          <span className="text-xs text-stone-500 hidden sm:block">{t('offerIntake.headerSubtitle')}</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 flex-1 w-full">
        {/* Property summary */}
        {info.property && (
          <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-5 sm:p-6 mb-6">
            <h2 className="text-[10px] font-semibold text-stone-500 uppercase tracking-wide mb-2">
              {t('offerIntake.propertyLabel')}
            </h2>
            <p className="text-lg font-semibold text-stone-900">
              {info.property.address}
            </p>
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
        )}

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

      {/* Footer */}
      <footer className="py-4 text-center">
        <div className="flex items-center justify-center gap-1.5 text-xs text-stone-400">
          <OfraLogo size={14} />
          {t('offerIntake.poweredBy')}
        </div>
      </footer>
    </div>
  )
}
