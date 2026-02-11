import { useState, useEffect, useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  FileText,
  X,
  ArrowLeftRight,
  ClipboardList,
  Plus,
  Mail,
  Eye,
  Info,
  CheckCircle,
  Zap,
  Clock,
  Ban,
  Check,
  ChevronLeft,
} from 'lucide-react'
import { offersApi } from '../../api/offers.api'
import { partiesApi, type PartyRole } from '../../api/parties.api'
import type { Offer, OfferRevision, Transaction } from '../../api/transactions.api'
import { formatDate, parseISO, differenceInDays } from '../../lib/date'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '../ui/Dialog'

interface CreateOfferModalProps {
  isOpen: boolean
  onClose: () => void
  transaction: Transaction
  existingOffer?: Offer | null
  lastRevision?: OfferRevision | null
}

function formatCAD(amount: number): string {
  return new Intl.NumberFormat('fr-CA', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function parseMoney(value: string): number {
  return parseFloat(value.replace(/\s/g, '').replace(',', '.')) || 0
}

export default function CreateOfferModal({
  isOpen,
  onClose,
  transaction,
  existingOffer,
  lastRevision,
}: CreateOfferModalProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const isCounter = !!existingOffer && !!lastRevision

  const [step, setStep] = useState<'form' | 'confirm' | 'success'>('form')
  const [emailNotify, setEmailNotify] = useState(true)
  const [markPrevious, setMarkPrevious] = useState(true)
  const [note, setNote] = useState('')
  const [selectedConditionIds, setSelectedConditionIds] = useState<number[]>([])
  const [showConditionPicker, setShowConditionPicker] = useState(false)
  const [showEmailPreview, setShowEmailPreview] = useState(false)
  const [formData, setFormData] = useState({
    price: '',
    deposit: '',
    financingAmount: '',
    expiryAt: '',
  })

  // Reset form when modal opens/changes
  useEffect(() => {
    if (isOpen) {
      setStep('form')
      setEmailNotify(true)
      setMarkPrevious(true)
      setNote('')
      setSelectedConditionIds(
        isCounter && lastRevision?.conditions
          ? lastRevision.conditions.map((c: any) => c.id)
          : []
      )
      setShowConditionPicker(false)
      setShowEmailPreview(false)
      setFormData({
        price: isCounter ? String(lastRevision!.price) : '',
        deposit: isCounter && lastRevision!.deposit != null ? String(lastRevision!.deposit) : '',
        financingAmount: isCounter && lastRevision!.financingAmount != null ? String(lastRevision!.financingAmount) : '',
        expiryAt: '',
      })
    }
  }, [isOpen, isCounter, lastRevision])

  // Current step info
  const currentStep = transaction.currentStep
  const stepOrder = currentStep?.stepOrder ?? 2
  const stepName = currentStep?.workflowStep?.name ?? '—'

  // Available conditions from current step (pending/in_progress only)
  const availableConditions = useMemo(() => {
    const stepConditions = currentStep?.conditions ?? []
    const txConditions = transaction.conditions ?? []
    const allConditions = stepConditions.length > 0 ? stepConditions : txConditions
    return allConditions.filter((c: any) => c.status !== 'completed')
  }, [currentStep, transaction.conditions])

  // Parsed values
  const priceNum = parseMoney(formData.price)
  const depositNum = parseMoney(formData.deposit)
  const financingNum = parseMoney(formData.financingAmount)

  // Deltas vs previous
  const priceDelta = isCounter ? priceNum - lastRevision!.price : null
  const depositDelta = isCounter && lastRevision!.deposit != null ? depositNum - lastRevision!.deposit : null
  const financingDelta = isCounter && lastRevision!.financingAmount != null ? financingNum - lastRevision!.financingAmount : null

  // Form validity
  const isFormValid = priceNum > 0 && depositNum >= 0 && formData.deposit.trim() !== '' && formData.financingAmount.trim() !== '' && formData.expiryAt.trim() !== ''

  // Fetch parties for email recipients
  const { data: partiesData } = useQuery({
    queryKey: ['parties', transaction.id],
    queryFn: () => partiesApi.list(transaction.id),
    enabled: isOpen,
  })
  const parties = partiesData?.data?.parties ?? []

  const clientEmail = transaction.client?.email
  const recipientsWithEmail = (clientEmail ? 1 : 0) + parties.filter((p) => p.email).length
  const recipientsMissing = (clientEmail ? 0 : 1) + parties.filter((p) => !p.email).length

  // Role label mapping
  const ROLE_LABELS: Record<PartyRole, string> = {
    buyer: t('transaction.acceptOffer.buyerLabel'),
    seller: t('transaction.acceptOffer.sellerLabel'),
    lawyer: t('transaction.acceptOffer.lawyerLabel'),
    notary: t('transaction.acceptOffer.notaryLabel'),
    agent: t('transaction.acceptOffer.agentLabel'),
    broker: t('transaction.acceptOffer.brokerLabel'),
    other: t('transaction.acceptOffer.otherLabel'),
  }

  // Direction for counter-offer (invert previous)
  const direction: 'buyer_to_seller' | 'seller_to_buyer' = isCounter
    ? (lastRevision!.direction === 'buyer_to_seller' ? 'seller_to_buyer' : 'buyer_to_seller')
    : 'buyer_to_seller'

  // Create mutation (new offer)
  const createMutation = useMutation({
    mutationFn: () =>
      offersApi.create(transaction.id, {
        price: priceNum,
        deposit: depositNum || null,
        financingAmount: financingNum || null,
        expiryAt: formData.expiryAt || null,
        direction,
        notes: note.trim() || null,
        conditionIds: selectedConditionIds.length > 0 ? selectedConditionIds : undefined,
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['transaction', transaction.id] }),
        queryClient.invalidateQueries({ queryKey: ['offers', transaction.id] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      ])
      setStep('success')
    },
  })

  // Counter mutation (add revision)
  const counterMutation = useMutation({
    mutationFn: () =>
      offersApi.addRevision(existingOffer!.id, {
        price: priceNum,
        deposit: depositNum || null,
        financingAmount: financingNum || null,
        expiryAt: formData.expiryAt || null,
        direction,
        notes: note.trim() || null,
        conditionIds: selectedConditionIds.length > 0 ? selectedConditionIds : undefined,
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['transaction', transaction.id] }),
        queryClient.invalidateQueries({ queryKey: ['offers', transaction.id] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      ])
      setStep('success')
    },
  })

  const isPending = createMutation.isPending || counterMutation.isPending

  const handleConfirm = () => {
    if (isCounter) {
      counterMutation.mutate()
    } else {
      createMutation.mutate()
    }
  }

  const handleClose = () => {
    if (!isPending) {
      setStep('form')
      onClose()
    }
  }

  // Delta display helper
  const deltaClass = (val: number | null) => {
    if (val === null) return 'text-stone-500'
    if (val > 0) return 'text-emerald-600'
    if (val < 0) return 'text-red-600'
    return 'text-stone-500'
  }

  const deltaText = (val: number | null) => {
    if (val === null) return '—'
    if (val === 0) return '0 $'
    return `${val > 0 ? '+' : ''}${formatCAD(val)} $`
  }

  // Expiry info for success state
  const expiryDate = formData.expiryAt ? parseISO(formData.expiryAt) : null
  const daysUntilExpiry = expiryDate ? differenceInDays(expiryDate, new Date()) : null

  // ═══════════════════════════════════════
  // ÉTAT C — SUCCÈS
  // ═══════════════════════════════════════
  if (step === 'success') {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="sm:max-w-lg p-0 gap-0" aria-describedby="create-offer-success-desc">
          <DialogTitle className="sr-only">{t('transaction.createOffer.successTitle')}</DialogTitle>
          <DialogDescription id="create-offer-success-desc" className="sr-only">
            {t('transaction.createOffer.successTitle')}
          </DialogDescription>

          {/* Success header */}
          <div className="px-5 sm:px-6 py-5 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
              <Check className="w-7 h-7 text-emerald-600" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-stone-900" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
              {t('transaction.createOffer.successTitle')}
            </h2>
            <p className="text-sm text-stone-500 mt-1">
              {t('transaction.createOffer.successSubtitle', {
                type: isCounter ? t('transaction.createOffer.counterBadge') : t('transaction.createOffer.title'),
                price: formatCAD(priceNum),
              })}
            </p>
          </div>

          {/* Summary cards */}
          <div className="px-5 sm:px-6 pb-5 space-y-2">
            {/* Offer added */}
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50 border border-emerald-100">
              <Plus className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="text-xs text-emerald-800" dangerouslySetInnerHTML={{ __html: t('transaction.createOffer.successOfferAdded') }} />
            </div>

            {/* Previous marked non-retenue */}
            {isCounter && markPrevious && (
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-100">
                <Ban className="w-4 h-4 text-amber-500 shrink-0" />
                <span className="text-xs text-amber-700" dangerouslySetInnerHTML={{
                  __html: t('transaction.createOffer.successPreviousMarked', { price: formatCAD(lastRevision!.price) }),
                }} />
              </div>
            )}

            {/* Email notification */}
            {emailNotify && (
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-stone-50 border border-stone-200">
                <Mail className="w-4 h-4 text-stone-500 shrink-0" />
                <span className="text-xs text-stone-600">
                  {t('transaction.createOffer.successNotification', { count: recipientsWithEmail })}
                </span>
              </div>
            )}

            {/* Expiry countdown */}
            {expiryDate && daysUntilExpiry !== null && (
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-primary/5 border border-primary/10">
                <Clock className="w-4 h-4 text-primary shrink-0" />
                <span className="text-xs text-primary" dangerouslySetInnerHTML={{
                  __html: t('transaction.createOffer.successExpiry', {
                    date: formatDate(expiryDate, 'd MMM yyyy'),
                    days: daysUntilExpiry,
                  }),
                }} />
              </div>
            )}
          </div>

          {/* Recommended action */}
          {expiryDate && (
            <div className="px-5 sm:px-6 pb-4">
              <div className="rounded-lg border border-accent/20 bg-accent/5 p-3">
                <h3 className="text-xs font-semibold text-accent flex items-center gap-1.5 mb-1.5">
                  <Zap className="w-3.5 h-3.5" />
                  {t('transaction.createOffer.recommendedAction')}
                </h3>
                <p className="text-xs text-stone-600">
                  {t('transaction.createOffer.recommendedActionDesc', {
                    date: formatDate(expiryDate, 'd MMM'),
                  })}
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="px-5 sm:px-6 py-4 bg-stone-50 border-t border-stone-100 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:justify-center">
            <button
              onClick={handleClose}
              className="px-5 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-white text-sm font-semibold shadow-sm flex items-center justify-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              {t('transaction.createOffer.viewTransaction')}
            </button>
            <a
              href={`mailto:${[
                clientEmail,
                ...parties.filter((p) => p.email).map((p) => p.email),
              ].filter(Boolean).join(',')}?subject=${encodeURIComponent(
                isCounter
                  ? t('transaction.createOffer.emailPreview.subjectCounter', { price: formatCAD(priceNum), address: transaction.property?.address ?? '' })
                  : t('transaction.createOffer.emailPreview.subjectNew', { price: formatCAD(priceNum), address: transaction.property?.address ?? '' })
              )}&body=${encodeURIComponent(
                (isCounter
                  ? t('transaction.createOffer.emailPreview.bodyCounter', { price: formatCAD(priceNum), address: transaction.property?.address ?? '—' })
                  : t('transaction.createOffer.emailPreview.bodyNew', { price: formatCAD(priceNum), address: transaction.property?.address ?? '—' })
                ) + '\n\n' + t('transaction.createOffer.emailPreview.footer')
              )}`}
              className="px-5 py-2.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-100 text-sm font-medium flex items-center justify-center gap-2"
            >
              <Mail className="w-4 h-4" />
              {t('transaction.createOffer.followUpEmail')}
            </a>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // ═══════════════════════════════════════
  // ÉTAT B — CONFIRMATION
  // ═══════════════════════════════════════
  if (step === 'confirm') {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden" aria-describedby="create-offer-confirm-desc">
          <DialogTitle className="sr-only">{t('transaction.createOffer.confirmTitle')}</DialogTitle>
          <DialogDescription id="create-offer-confirm-desc" className="sr-only">
            {t('transaction.createOffer.confirmSubtitle')}
          </DialogDescription>

          {/* Header */}
          <div className="px-5 sm:px-6 pt-5 sm:pt-6 pb-4 border-b border-stone-100">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <CheckCircle className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-stone-900" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
                    {t('transaction.createOffer.confirmTitle')}
                  </h2>
                  <p className="text-xs text-stone-500 mt-0.5">
                    {t('transaction.createOffer.confirmSubtitle')}
                  </p>
                </div>
              </div>
              <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 -mt-1 -mr-1">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="px-5 sm:px-6 py-4 space-y-4 overflow-y-auto max-h-[60vh]">
            {/* Recap card */}
            <div className="rounded-lg bg-stone-50 border border-stone-200 p-3 sm:p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-stone-500 uppercase font-semibold tracking-wide">
                  {t('transaction.createOffer.recap')}
                </span>
                {isCounter && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                    {t('transaction.createOffer.counterBadge')}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div>
                  <span className="text-xs text-stone-400">{t('transaction.createOffer.priceOffered')}</span>
                  <p className="font-bold text-stone-900">{formatCAD(priceNum)} $</p>
                </div>
                <div>
                  <span className="text-xs text-stone-400">{t('transaction.createOffer.depositLabel')}</span>
                  <p className="font-semibold text-stone-700">{formatCAD(depositNum)} $</p>
                </div>
                <div>
                  <span className="text-xs text-stone-400">{t('transaction.createOffer.financingLabel')}</span>
                  <p className="font-semibold text-stone-700">{formatCAD(financingNum)} $</p>
                </div>
                <div>
                  <span className="text-xs text-stone-400">{t('transaction.createOffer.expiration')}</span>
                  <p className="font-semibold text-stone-700">
                    {expiryDate ? formatDate(expiryDate, 'd MMM yyyy') : '—'}
                  </p>
                </div>
              </div>
              {isCounter && (
                <div className="mt-2 pt-2 border-t border-stone-200 flex items-center gap-2">
                  <ClipboardList className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                  <span className="text-xs text-stone-500">
                    {t('transaction.createOffer.conditionsRecap', { count: selectedConditionIds.length })}
                  </span>
                </div>
              )}
            </div>

            {/* Deltas (counter-offer only) */}
            {isCounter && (
              <div className="rounded-lg border border-indigo-200 bg-indigo-50/50 p-3">
                <h3 className="text-xs font-semibold text-indigo-800 flex items-center gap-1.5 mb-2">
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                  {t('transaction.createOffer.deltaTitleWithPrice', { price: formatCAD(lastRevision!.price) })}
                </h3>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-stone-400">{t('transaction.createOffer.priceLabel')}</span>
                    <p className={`font-semibold ${deltaClass(priceDelta)}`}>{deltaText(priceDelta)}</p>
                  </div>
                  <div>
                    <span className="text-stone-400">{t('transaction.createOffer.depositLabel')}</span>
                    <p className={`font-semibold ${deltaClass(depositDelta)}`}>{deltaText(depositDelta)}</p>
                  </div>
                  <div>
                    <span className="text-stone-400">{t('transaction.createOffer.financingLabel')}</span>
                    <p className={`font-semibold ${deltaClass(financingDelta)}`}>{deltaText(financingDelta)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Workflow impact */}
            <div className="rounded-lg border border-indigo-200 bg-indigo-50/50 p-3 sm:p-4">
              <h3 className="text-xs font-semibold text-indigo-800 flex items-center gap-1.5 mb-2">
                <Zap className="w-3.5 h-3.5" />
                {t('transaction.createOffer.impactTitle')}
              </h3>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <Clock className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <span className="text-xs text-stone-700" dangerouslySetInnerHTML={{
                    __html: t('transaction.createOffer.impactStepActive', { stepOrder, stepName }),
                  }} />
                </div>
                <div className="flex items-start gap-2">
                  <FileText className="w-4 h-4 text-stone-400 mt-0.5 shrink-0" />
                  <span className="text-xs text-stone-700" dangerouslySetInnerHTML={{
                    __html: t('transaction.createOffer.impactOfferPrice', { price: formatCAD(priceNum) }),
                  }} />
                </div>
              </div>
            </div>

            {/* Mark previous as non-retenue (counter-offer only) */}
            {isCounter && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={markPrevious}
                    onChange={(e) => setMarkPrevious(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-amber-300 accent-primary"
                  />
                  <div>
                    <span className="text-xs font-medium text-amber-800">
                      {t('transaction.createOffer.markPreviousTitle')}
                    </span>
                    <p className="text-[10px] text-amber-600 mt-0.5">
                      {t('transaction.createOffer.markPreviousDesc', {
                        price: formatCAD(lastRevision!.price),
                        status: t(`offers.status.${existingOffer!.status}`),
                      })}
                    </p>
                  </div>
                </label>
              </div>
            )}

            {/* Email notification recap */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-stone-50 border border-stone-200">
              <Mail className="w-4 h-4 text-stone-400 shrink-0" />
              <span className="text-xs text-stone-600" dangerouslySetInnerHTML={{
                __html: t('transaction.createOffer.emailRecap', {
                  state: emailNotify ? t('transaction.createOffer.emailEnabled') : t('transaction.createOffer.emailDisabled'),
                  count: recipientsWithEmail,
                  missing: recipientsMissing,
                }),
              }} />
            </div>
          </div>

          {/* Footer */}
          <div className="px-5 sm:px-6 py-4 bg-stone-50 border-t border-stone-100 flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2 sm:justify-end">
            <button
              onClick={() => setStep('form')}
              disabled={isPending}
              className="px-4 py-2.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-100 text-sm font-medium text-center"
            >
              {t('transaction.createOffer.back')}
            </button>
            <button
              onClick={handleConfirm}
              disabled={isPending}
              className="px-6 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-white text-sm font-semibold shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              {isPending ? '...' : t('transaction.createOffer.confirmCreate')}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // ═══════════════════════════════════════
  // ÉTAT A — FORMULAIRE
  // ═══════════════════════════════════════
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden" aria-describedby="create-offer-form-desc">
        <DialogTitle className="sr-only">{t('transaction.createOffer.title')}</DialogTitle>
        <DialogDescription id="create-offer-form-desc" className="sr-only">
          {t('transaction.createOffer.stepInfo', { stepOrder, stepName })}
        </DialogDescription>

        {/* Header */}
        <div className="px-5 sm:px-6 pt-5 sm:pt-6 pb-4 border-b border-stone-100">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-stone-900" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
                    {t('transaction.createOffer.title')}
                  </h2>
                  {isCounter && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-700">
                      {t('transaction.createOffer.counterBadge')}
                    </span>
                  )}
                </div>
                <p className="text-xs text-stone-500 mt-0.5">
                  {t('transaction.createOffer.stepInfo', { stepOrder, stepName })}
                </p>
              </div>
            </div>
            <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 -mt-1 -mr-1">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 sm:px-6 py-4 space-y-4 overflow-y-auto max-h-[60vh]">
          {/* Previous offer reference (counter-offer only) */}
          {isCounter && lastRevision && (
            <div className="rounded-lg bg-stone-50 border border-stone-200 p-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-stone-500 uppercase font-semibold tracking-wide">
                  {t('transaction.createOffer.previousOffer')}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                  {t(`offers.status.${existingOffer!.status}`)}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-stone-400">{t('transaction.createOffer.priceLabel')}</span>
                  <p className="font-semibold text-stone-700">{formatCAD(lastRevision.price)} $</p>
                </div>
                {lastRevision.deposit != null && (
                  <div>
                    <span className="text-stone-400">{t('transaction.createOffer.depositLabel')}</span>
                    <p className="font-semibold text-stone-700">{formatCAD(lastRevision.deposit)} $</p>
                  </div>
                )}
                {lastRevision.financingAmount != null && (
                  <div>
                    <span className="text-stone-400">{t('transaction.createOffer.financingLabel')}</span>
                    <p className="font-semibold text-stone-700">{formatCAD(lastRevision.financingAmount)} $</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Prix offert */}
          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1.5 uppercase tracking-wide">
              {t('transaction.createOffer.priceLabel')} <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="350 000"
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-primary/20 pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 font-medium">$</span>
            </div>
          </div>

          {/* Dépôt + Financement */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1.5 uppercase tracking-wide">
                {t('transaction.createOffer.depositLabel')} <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.deposit}
                  onChange={(e) => setFormData({ ...formData, deposit: e.target.value })}
                  placeholder="10 000"
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-primary/20 pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 font-medium">$</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1.5 uppercase tracking-wide">
                {t('transaction.createOffer.financingLabel')} <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.financingAmount}
                  onChange={(e) => setFormData({ ...formData, financingAmount: e.target.value })}
                  placeholder="280 000"
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-primary/20 pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 font-medium">$</span>
              </div>
            </div>
          </div>

          {/* Date d'expiration */}
          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1.5 uppercase tracking-wide">
              {t('transaction.createOffer.expiryLabel')} <span className="text-red-400">*</span>
            </label>
            <input
              type="date"
              value={formData.expiryAt}
              onChange={(e) => setFormData({ ...formData, expiryAt: e.target.value })}
              className="w-full px-3 py-2.5 text-sm rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Deltas vs previous (counter-offer only) */}
          {isCounter && priceNum > 0 && (
            <div className="rounded-lg border border-indigo-200 bg-indigo-50/50 p-3">
              <h3 className="text-xs font-semibold text-indigo-800 flex items-center gap-1.5 mb-2">
                <ArrowLeftRight className="w-3.5 h-3.5" />
                {t('transaction.createOffer.deltaTitle')}
              </h3>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-stone-400">{t('transaction.createOffer.priceLabel')}</span>
                  <p className={`font-semibold ${deltaClass(priceDelta)}`}>{deltaText(priceDelta)}</p>
                </div>
                <div>
                  <span className="text-stone-400">{t('transaction.createOffer.depositLabel')}</span>
                  <p className={`font-semibold ${deltaClass(depositDelta)}`}>{deltaText(depositDelta)}</p>
                </div>
                <div>
                  <span className="text-stone-400">{t('transaction.createOffer.financingLabel')}</span>
                  <p className={`font-semibold ${deltaClass(financingDelta)}`}>{deltaText(financingDelta)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Conditions liées */}
          <div className="rounded-lg border border-stone-200 bg-white p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-stone-400" />
                <span className="text-xs font-medium text-stone-700">{t('transaction.createOffer.conditionsLinked')}</span>
                <span className="text-xs text-stone-400">({t('transaction.createOffer.conditionsActive', { count: selectedConditionIds.length })})</span>
              </div>
              {availableConditions.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowConditionPicker(!showConditionPicker)}
                  className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  {t('transaction.createOffer.conditionsAdd')}
                </button>
              )}
            </div>

            {/* Selected conditions tags */}
            {selectedConditionIds.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {selectedConditionIds.map((cId) => {
                  const cond = availableConditions.find((c: any) => c.id === cId)
                  if (!cond) return null
                  return (
                    <span key={cId} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {cond.title ?? cond.labelFr ?? `#${cId}`}
                      <button
                        type="button"
                        onClick={() => setSelectedConditionIds((prev) => prev.filter((id) => id !== cId))}
                        className="hover:text-red-500 ml-0.5"
                      >
                        &times;
                      </button>
                    </span>
                  )
                })}
              </div>
            )}

            {/* Condition picker popover */}
            {showConditionPicker && (
              <div className="mt-2 rounded-lg border border-stone-200 bg-stone-50 p-2 space-y-1">
                {availableConditions.map((cond: any) => {
                  const isSelected = selectedConditionIds.includes(cond.id)
                  return (
                    <label key={cond.id} className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-white cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {
                          setSelectedConditionIds((prev) =>
                            isSelected ? prev.filter((id) => id !== cond.id) : [...prev, cond.id]
                          )
                        }}
                        className="w-3.5 h-3.5 rounded border-stone-300 accent-primary"
                      />
                      <span className="text-xs text-stone-700 flex-1">{cond.title ?? cond.labelFr ?? `Condition #${cond.id}`}</span>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                        cond.level === 'blocking' ? 'bg-red-100 text-red-700' :
                        cond.level === 'required' ? 'bg-amber-100 text-amber-700' :
                        'bg-stone-100 text-stone-500'
                      }`}>
                        {cond.level ?? 'required'}
                      </span>
                    </label>
                  )
                })}
                {availableConditions.length === 0 && (
                  <p className="text-[10px] text-stone-400 text-center py-2">{t('transaction.createOffer.noConditions')}</p>
                )}
              </div>
            )}

            {isCounter && (
              <p className="text-[10px] text-stone-400 mt-1">
                {t('transaction.createOffer.conditionsNote')}
              </p>
            )}
          </div>

          {/* Note interne */}
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">
              {t('transaction.createOffer.noteLabel')}
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t('transaction.createOffer.notePlaceholder')}
              className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            />
          </div>

          {/* Email toggle */}
          <div className="rounded-lg border border-stone-200 bg-white overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2.5">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-stone-500" />
                <span className="text-xs font-medium text-stone-700">
                  {t('transaction.acceptOffer.emailToggle')}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setEmailNotify(!emailNotify)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${emailNotify ? 'bg-primary' : 'bg-stone-300'}`}
              >
                <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${emailNotify ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </button>
            </div>
            {emailNotify && (
              <div className="px-3 pb-3 space-y-2 border-t border-stone-100 pt-2">
                <div className="text-xs text-stone-500">{t('transaction.acceptOffer.recipients')}</div>
                <div className="space-y-1.5">
                  {/* Client */}
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${clientEmail ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                    <span className={`text-xs ${clientEmail ? 'text-stone-700' : 'text-stone-500'}`}>
                      {t('transaction.acceptOffer.buyerLabel')} —{' '}
                      {clientEmail ?? <span className="italic text-amber-600">{t('transaction.acceptOffer.missingEmail')}</span>}
                    </span>
                  </div>
                  {/* Parties */}
                  {parties.map((party) => (
                    <div key={party.id} className="flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${party.email ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                      <span className={`text-xs ${party.email ? 'text-stone-700' : 'text-stone-500'}`}>
                        {ROLE_LABELS[party.role] ?? party.role} —{' '}
                        {party.email ?? <span className="italic text-amber-600">{t('transaction.acceptOffer.missingEmail')}</span>}
                      </span>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setShowEmailPreview(!showEmailPreview)}
                  className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1 mt-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  {showEmailPreview ? t('transaction.createOffer.hidePreview') : t('transaction.acceptOffer.previewEmail')}
                </button>

                {/* Email preview */}
                {showEmailPreview && (
                  <div className="mt-2 rounded-lg border border-stone-200 bg-white overflow-hidden">
                    {/* Email header */}
                    <div className="px-3 py-2 bg-stone-50 border-b border-stone-100 space-y-1">
                      <div className="flex items-center gap-2 text-[10px]">
                        <span className="font-semibold text-stone-500 uppercase w-8 shrink-0">{t('transaction.createOffer.emailPreview.from')}</span>
                        <span className="text-stone-700">Ofra &lt;noreply@ofra.ca&gt;</span>
                      </div>
                      <div className="flex items-start gap-2 text-[10px]">
                        <span className="font-semibold text-stone-500 uppercase w-8 shrink-0">{t('transaction.createOffer.emailPreview.to')}</span>
                        <span className="text-stone-700">
                          {[
                            clientEmail ? `${transaction.client?.fullName ?? t('transaction.acceptOffer.buyerLabel')} <${clientEmail}>` : null,
                            ...parties.filter((p) => p.email).map((p) => `${p.fullName} <${p.email}>`),
                          ].filter(Boolean).join(', ') || t('transaction.createOffer.emailPreview.noRecipients')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px]">
                        <span className="font-semibold text-stone-500 uppercase w-8 shrink-0">{t('transaction.createOffer.emailPreview.subject')}</span>
                        <span className="text-stone-700 font-medium">
                          {isCounter
                            ? t('transaction.createOffer.emailPreview.subjectCounter', { price: formatCAD(priceNum), address: transaction.property?.address ?? '' })
                            : t('transaction.createOffer.emailPreview.subjectNew', { price: formatCAD(priceNum), address: transaction.property?.address ?? '' })
                          }
                        </span>
                      </div>
                    </div>
                    {/* Email body */}
                    <div className="px-3 py-3 text-xs text-stone-700 space-y-2">
                      <p>{t('transaction.createOffer.emailPreview.greeting')}</p>
                      <p>
                        {isCounter
                          ? t('transaction.createOffer.emailPreview.bodyCounter', { price: formatCAD(priceNum), address: transaction.property?.address ?? '—' })
                          : t('transaction.createOffer.emailPreview.bodyNew', { price: formatCAD(priceNum), address: transaction.property?.address ?? '—' })
                        }
                      </p>
                      <div className="rounded bg-stone-50 border border-stone-100 p-2 space-y-0.5">
                        <div className="flex justify-between">
                          <span className="text-stone-500">{t('transaction.createOffer.priceLabel')}</span>
                          <span className="font-semibold">{formatCAD(priceNum)} $</span>
                        </div>
                        {depositNum > 0 && (
                          <div className="flex justify-between">
                            <span className="text-stone-500">{t('transaction.createOffer.depositLabel')}</span>
                            <span className="font-semibold">{formatCAD(depositNum)} $</span>
                          </div>
                        )}
                        {financingNum > 0 && (
                          <div className="flex justify-between">
                            <span className="text-stone-500">{t('transaction.createOffer.financingLabel')}</span>
                            <span className="font-semibold">{formatCAD(financingNum)} $</span>
                          </div>
                        )}
                        {expiryDate && (
                          <div className="flex justify-between">
                            <span className="text-stone-500">{t('transaction.createOffer.expiryLabel')}</span>
                            <span className="font-semibold">{formatDate(expiryDate, 'd MMM yyyy')}</span>
                          </div>
                        )}
                      </div>
                      <p className="text-stone-500 italic text-[10px]">{t('transaction.createOffer.emailPreview.footer')}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Info mention */}
          <p className="text-[10px] text-stone-400 italic flex items-center gap-1">
            <Info className="w-3 h-3 shrink-0" />
            {t('transaction.createOffer.infoMention')}
          </p>
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-4 bg-stone-50 border-t border-stone-100 flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2 sm:justify-end">
          <button
            onClick={handleClose}
            className="px-4 py-2.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-100 text-sm font-medium text-center"
          >
            {t('transaction.acceptOffer.cancel')}
          </button>
          <button
            onClick={() => setStep('confirm')}
            disabled={!isFormValid}
            className="px-6 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-white text-sm font-semibold shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileText className="w-4 h-4" />
            {t('transaction.createOffer.createButton')}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
