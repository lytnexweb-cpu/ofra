import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Check,
  ArrowRight,
  Clock,
  Package,
  FileText,
  AlertTriangle,
  Ban,
  Mail,
  Eye,
  Zap,
  X,
} from 'lucide-react'
import { offersApi } from '../../api/offers.api'
import { partiesApi, type PartyRole } from '../../api/parties.api'
import type { Offer, OfferRevision, Transaction } from '../../api/transactions.api'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '../ui/Dialog'

interface AcceptOfferModalProps {
  isOpen: boolean
  onClose: () => void
  offer: Offer
  transaction: Transaction
}

function formatCAD(amount: number): string {
  return new Intl.NumberFormat('fr-CA', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function getLastRevision(offer: Offer): OfferRevision | null {
  if (!offer.revisions || offer.revisions.length === 0) return null
  return offer.revisions.reduce(
    (latest, rev) => (rev.revisionNumber > latest.revisionNumber ? rev : latest),
    offer.revisions[0]
  )
}

export default function AcceptOfferModal({
  isOpen,
  onClose,
  offer,
  transaction,
}: AcceptOfferModalProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const [emailNotify, setEmailNotify] = useState(true)
  const [note, setNote] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)

  const lastRev = getLastRevision(offer)
  const offerPrice = lastRev?.price ?? 0

  // Workflow steps
  const acceptedStep = transaction.transactionSteps?.find((s) => s.stepOrder === 3)
  const conditionalStep = transaction.transactionSteps?.find((s) => s.stepOrder === 4)
  const acceptedStepName = acceptedStep?.workflowStep?.name ?? '—'
  const conditionalStepName = conditionalStep?.workflowStep?.name ?? '—'

  // Affected offers (other pending offers that will be rejected)
  const otherPendingOffers = (transaction.offers ?? []).filter(
    (o) => o.id !== offer.id && (o.status === 'received' || o.status === 'countered')
  )

  // Client info for email recipients
  const clientName = transaction.client
    ? `${transaction.client.firstName} ${transaction.client.lastName}`
    : '—'
  const clientEmail = transaction.client?.email

  // Fetch transaction parties for email recipients
  const { data: partiesData } = useQuery({
    queryKey: ['parties', transaction.id],
    queryFn: () => partiesApi.list(transaction.id),
    enabled: isOpen,
  })
  const parties = partiesData?.data?.parties ?? []

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

  const acceptMutation = useMutation({
    mutationFn: () => offersApi.accept(offer.id),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['transaction', transaction.id] }),
        queryClient.invalidateQueries({ queryKey: ['offers', transaction.id] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      ])
      setShowSuccess(true)
    },
  })

  const handleClose = () => {
    setShowSuccess(false)
    setEmailNotify(true)
    setNote('')
    onClose()
  }

  // ── Success State ──
  if (showSuccess) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="sm:max-w-lg p-0 gap-0" aria-describedby="accept-success-desc">
          <DialogTitle className="sr-only">{t('transaction.acceptOffer.successTitle')}</DialogTitle>
          <DialogDescription id="accept-success-desc" className="sr-only">
            {t('transaction.acceptOffer.successTitle')}
          </DialogDescription>

          {/* Success header */}
          <div className="px-5 sm:px-6 py-5 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
              <Check className="w-7 h-7 text-emerald-600" />
            </div>
            <h2
              className="text-base sm:text-lg font-bold text-stone-900"
              style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
            >
              {t('transaction.acceptOffer.successTitle')}
            </h2>
            <p className="text-sm text-stone-500 mt-1">
              {t('transaction.acceptOffer.successSubtitle', {
                price: formatCAD(offerPrice),
                clientName,
              })}
            </p>
          </div>

          {/* Summary cards */}
          <div className="px-5 sm:px-6 pb-5 space-y-2">
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50 border border-emerald-100">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="text-xs text-emerald-800">
                {t('transaction.acceptOffer.successStepCompleted', {
                  stepOrder: acceptedStep?.stepOrder ?? 3,
                  stepName: acceptedStepName,
                })}
              </span>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-primary/5 border border-primary/10">
              <ArrowRight className="w-4 h-4 text-primary shrink-0" />
              <span className="text-xs text-primary">
                {t('transaction.acceptOffer.successNextStep', {
                  stepOrder: conditionalStep?.stepOrder ?? 4,
                  stepName: conditionalStepName,
                  count: conditionalStep?.conditions?.length ?? 0,
                  packs: 'Universal + Finance NB',
                })}
              </span>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-stone-50 border border-stone-200">
              <FileText className="w-4 h-4 text-stone-500 shrink-0" />
              <span className="text-xs text-stone-600">
                {t('transaction.acceptOffer.successPriceUpdated', {
                  price: formatCAD(offerPrice),
                })}
              </span>
            </div>
            {otherPendingOffers.length > 0 && (
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-100">
                <Ban className="w-4 h-4 text-amber-500 shrink-0" />
                <span className="text-xs text-amber-700">
                  {t('transaction.acceptOffer.successOffersRejected', {
                    count: otherPendingOffers.length,
                  })}
                </span>
              </div>
            )}
          </div>

          {/* CTA */}
          <div className="px-5 sm:px-6 py-4 bg-stone-50 border-t border-stone-100 text-center">
            <button
              onClick={handleClose}
              className="px-6 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-white text-sm font-semibold shadow-sm"
            >
              {t('transaction.acceptOffer.backToTransaction')}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // ── Confirmation State ──
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden" aria-describedby="accept-offer-desc">
        <DialogTitle className="sr-only">{t('transaction.acceptOffer.title')}</DialogTitle>
        <DialogDescription id="accept-offer-desc" className="sr-only">
          {t('transaction.acceptOffer.subtitle')}
        </DialogDescription>

        {/* Header */}
        <div className="px-5 sm:px-6 pt-5 sm:pt-6 pb-4 border-b border-stone-100">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                <Check className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h2
                  className="text-base sm:text-lg font-bold text-stone-900"
                  style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
                >
                  {t('transaction.acceptOffer.title')}
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  {t('transaction.acceptOffer.subtitle')}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 -mt-1 -mr-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body — scrollable */}
        <div className="px-5 sm:px-6 py-4 space-y-4 overflow-y-auto max-h-[60vh]">
          {/* Offer summary */}
          {lastRev && (
            <div className="rounded-lg bg-stone-50 border border-stone-200 p-3 sm:p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-stone-500 uppercase font-semibold tracking-wide">
                  {t('transaction.acceptOffer.offerFrom')}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                  {t(`offers.status.${offer.status}`)}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <span className="text-xs text-stone-400">
                    {t('transaction.acceptOffer.price')}
                  </span>
                  <p className="font-bold text-stone-900 text-base">{formatCAD(lastRev.price)} $</p>
                </div>
                {lastRev.deposit != null && (
                  <div>
                    <span className="text-xs text-stone-400">
                      {t('transaction.acceptOffer.deposit')}
                    </span>
                    <p className="font-semibold text-stone-700">{formatCAD(lastRev.deposit)} $</p>
                  </div>
                )}
                {lastRev.financingAmount != null && (
                  <div>
                    <span className="text-xs text-stone-400">
                      {t('transaction.acceptOffer.financing')}
                    </span>
                    <p className="font-semibold text-stone-700">
                      {formatCAD(lastRev.financingAmount)} $
                    </p>
                  </div>
                )}
              </div>
              {lastRev.notes && (
                <p className="text-xs text-stone-500 italic mt-2 pt-2 border-t border-stone-200">
                  &ldquo;{lastRev.notes}&rdquo;
                </p>
              )}
            </div>
          )}

          {/* Workflow impact */}
          <div className="rounded-lg border border-indigo-200 bg-indigo-50/50 p-3 sm:p-4">
            <h3 className="text-xs font-semibold text-indigo-800 flex items-center gap-1.5 mb-2">
              <Zap className="w-3.5 h-3.5" />
              {t('transaction.acceptOffer.workflowImpact')}
            </h3>
            <div className="space-y-2">
              {/* Step completed */}
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                <span
                  className="text-xs text-stone-700"
                  dangerouslySetInnerHTML={{
                    __html: t('transaction.acceptOffer.impactStepCompleted', {
                      stepOrder: acceptedStep?.stepOrder ?? 3,
                      stepName: acceptedStepName,
                    }),
                  }}
                />
              </div>
              {/* Next step starts */}
              <div className="flex items-start gap-2">
                <ArrowRight className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <span
                  className="text-xs text-stone-700"
                  dangerouslySetInnerHTML={{
                    __html: t('transaction.acceptOffer.impactNextStep', {
                      stepOrder: conditionalStep?.stepOrder ?? 4,
                      stepName: conditionalStepName,
                    }),
                  }}
                />
              </div>
              {/* Conditions activated */}
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <span
                  className="text-xs text-stone-700"
                  dangerouslySetInnerHTML={{
                    __html: t('transaction.acceptOffer.impactConditions', {
                      stepOrder: conditionalStep?.stepOrder ?? 4,
                    }),
                  }}
                />
              </div>
              {/* Packs */}
              <div className="flex items-start gap-2">
                <Package className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                <span
                  className="text-xs text-stone-700"
                  dangerouslySetInnerHTML={{
                    __html: t('transaction.acceptOffer.impactPacks', {
                      packs: 'Universal + Finance NB',
                    }),
                  }}
                />
              </div>
              {/* Price update */}
              {transaction.salePrice && offerPrice !== Number(transaction.salePrice) && (
                <div className="flex items-start gap-2">
                  <FileText className="w-4 h-4 text-stone-400 mt-0.5 shrink-0" />
                  <span
                    className="text-xs text-stone-700"
                    dangerouslySetInnerHTML={{
                      __html: t('transaction.acceptOffer.impactPrice', {
                        oldPrice: formatCAD(Number(transaction.salePrice)),
                        newPrice: formatCAD(offerPrice),
                      }),
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Affected offers warning */}
          {otherPendingOffers.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span
                className="text-xs text-amber-800"
                dangerouslySetInnerHTML={{
                  __html: t('transaction.acceptOffer.affectedOffers', {
                    count: otherPendingOffers.length,
                  }),
                }}
              />
            </div>
          )}

          {/* Email notification toggle */}
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
                <span
                  className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${emailNotify ? 'translate-x-4' : 'translate-x-0.5'}`}
                />
              </button>
            </div>
            {emailNotify && (
              <div className="px-3 pb-3 space-y-2 border-t border-stone-100 pt-2">
                <div className="text-xs text-stone-500">
                  {t('transaction.acceptOffer.recipients')}
                </div>
                <div className="space-y-1.5">
                  {/* Client (buyer) */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${clientEmail ? 'bg-emerald-400' : 'bg-amber-400'}`}
                      />
                      <span className={`text-xs ${clientEmail ? 'text-stone-700' : 'text-stone-500'}`}>
                        {t('transaction.acceptOffer.buyerLabel')} —{' '}
                        {clientEmail ?? (
                          <span className="italic text-amber-600">
                            {t('transaction.acceptOffer.missingEmail')}
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                  {/* Transaction parties */}
                  {parties.map((party) => (
                    <div key={party.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div
                          className={`w-1.5 h-1.5 rounded-full ${party.email ? 'bg-emerald-400' : 'bg-amber-400'}`}
                        />
                        <span className={`text-xs ${party.email ? 'text-stone-700' : 'text-stone-500'}`}>
                          {ROLE_LABELS[party.role] ?? party.role} —{' '}
                          {party.email ?? (
                            <span className="italic text-amber-600">
                              {t('transaction.acceptOffer.missingEmail')}
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1 mt-1">
                  <Eye className="w-3.5 h-3.5" />
                  {t('transaction.acceptOffer.previewEmail')}
                </button>
              </div>
            )}
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">
              {t('transaction.acceptOffer.noteLabel')}
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t('transaction.acceptOffer.notePlaceholder')}
              className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-4 bg-stone-50 border-t border-stone-100 flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2 sm:justify-end">
          <button
            onClick={handleClose}
            disabled={acceptMutation.isPending}
            className="px-4 py-2.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-100 text-sm font-medium text-center"
          >
            {t('transaction.acceptOffer.cancel')}
          </button>
          <button
            onClick={() => acceptMutation.mutate()}
            disabled={acceptMutation.isPending}
            className="px-6 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            {acceptMutation.isPending
              ? t('transaction.acceptOffer.confirming')
              : t('transaction.acceptOffer.confirm')}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
