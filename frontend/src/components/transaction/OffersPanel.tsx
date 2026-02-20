import { useState, useMemo, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  FileText,
  Plus,
  ChevronDown,
  ChevronRight,
  Check,
  Zap,
  Clock,
  Link2,
  Copy,
  CheckCircle2,
  XCircle,
  ArrowLeftRight,
} from 'lucide-react'
import { offersApi } from '../../api/offers.api'
import { shareLinksApi } from '../../api/share-links.api'
import type { Offer, OfferRevision, OfferStatus, Transaction } from '../../api/transactions.api'
import { parseApiError, isSessionExpired } from '../../utils/apiError'
import { formatDate, parseISO } from '../../lib/date'
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '../ui/Tooltip'
import ConfirmDialog from '../ConfirmDialog'
import CreateOfferModal from './CreateOfferModal'
import AcceptOfferModal from './AcceptOfferModal'
import NegotiationThread from './NegotiationThread'
import OfferComparison from './OfferComparison'

interface OffersPanelProps {
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

function getDirectionLabel(dir: string): string {
  return dir === 'buyer_to_seller' ? 'Acheteur \u2192 Vendeur' : 'Vendeur \u2192 Acheteur'
}

// Status badge classes matching maquette exactly
const statusBadge: Record<OfferStatus, { badge: string; border: string; bg: string; expandBorder: string }> = {
  received: {
    badge: 'bg-blue-100 text-blue-700',
    border: 'border-blue-200',
    bg: 'bg-blue-50/30',
    expandBorder: 'border-blue-100',
  },
  countered: {
    badge: 'bg-amber-100 text-amber-700',
    border: 'border-amber-200',
    bg: 'bg-amber-50/30',
    expandBorder: 'border-amber-100',
  },
  accepted: {
    badge: 'bg-emerald-100 text-emerald-700',
    border: 'border-emerald-200',
    bg: 'bg-emerald-50/30',
    expandBorder: 'border-emerald-100',
  },
  rejected: {
    badge: 'bg-red-100 text-red-700',
    border: 'border-stone-100',
    bg: '',
    expandBorder: 'border-stone-100',
  },
  expired: {
    badge: 'bg-stone-100 text-stone-600',
    border: 'border-stone-100',
    bg: '',
    expandBorder: 'border-stone-100',
  },
  withdrawn: {
    badge: 'bg-orange-100 text-orange-700',
    border: 'border-stone-100',
    bg: '',
    expandBorder: 'border-stone-100',
  },
}

export default function OffersPanel({ transaction }: OffersPanelProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const [expandedOfferId, setExpandedOfferId] = useState<number | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [counterOffer, setCounterOffer] = useState<{
    offer: Offer
    lastRevision: OfferRevision
  } | null>(null)

  // Confirm dialog states
  const [acceptOfferTarget, setAcceptOfferTarget] = useState<Offer | null>(null)
  const [rejectConfirm, setRejectConfirm] = useState<{ isOpen: boolean; offerId: number | null }>({
    isOpen: false,
    offerId: null,
  })
  const [withdrawConfirm, setWithdrawConfirm] = useState<{
    isOpen: boolean
    offerId: number | null
  }>({ isOpen: false, offerId: null })
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; offerId: number | null }>({
    isOpen: false,
    offerId: null,
  })
  const [createConfirmOpen, setCreateConfirmOpen] = useState(false)
  const [showComparison, setShowComparison] = useState(false)
  const [showOfferLinkForm, setShowOfferLinkForm] = useState(false)
  const [offerLinkExpiry, setOfferLinkExpiry] = useState<string>('14')
  const [copied, setCopied] = useState(false)

  // Offer intake link query
  const { data: offerLinkData } = useQuery({
    queryKey: ['share-link', transaction.id, 'offer_intake'],
    queryFn: () => shareLinksApi.get(transaction.id, 'offer_intake'),
    enabled: transaction.status === 'active',
  })

  const activeOfferLink = useMemo(() => {
    const link = (offerLinkData as any)?.data?.shareLink ?? null
    if (!link || !link.isActive) return null
    if (link.expiresAt && new Date(link.expiresAt) < new Date()) return null
    return link
  }, [offerLinkData])

  const { data: offersData, isLoading } = useQuery({
    queryKey: ['offers', transaction.id],
    queryFn: () => offersApi.list(transaction.id),
  })

  const offers: Offer[] = useMemo(() => {
    if (!offersData) return []
    return (offersData as any)?.data?.offers ?? (offersData as any)?.offers ?? []
  }, [offersData])

  // Split: active (received/countered) vs history (rest)
  const activeOffers = useMemo(
    () => offers.filter((o) => o.status === 'received' || o.status === 'countered'),
    [offers]
  )
  // Auto-open comparison for sellers with 2+ active offers
  useEffect(() => {
    if (transaction.clientRole === 'seller' && activeOffers.length >= 2) {
      setShowComparison(true)
    }
  }, [transaction.clientRole, activeOffers.length])

  const historyOffers = useMemo(
    () => offers.filter((o) => o.status !== 'received' && o.status !== 'countered'),
    [offers]
  )
  const hasAcceptedOffer = useMemo(
    () => offers.some((o) => o.status === 'accepted'),
    [offers]
  )

  // Auto-expand first active offer
  const firstActiveId = activeOffers[0]?.id ?? null
  const effectiveExpanded = expandedOfferId ?? firstActiveId

  const invalidateAll = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['transaction', transaction.id] }),
      queryClient.invalidateQueries({ queryKey: ['offers', transaction.id] }),
      queryClient.invalidateQueries({ queryKey: ['transactions'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      queryClient.invalidateQueries({ queryKey: ['advance-check', transaction.id] }),
      queryClient.invalidateQueries({ queryKey: ['conditions', 'active', transaction.id] }),
    ])
  }

  const handleMutationError = (err: unknown) => {
    const parsed = parseApiError(err)
    alert(parsed.message)
    if (isSessionExpired(err)) {
      setTimeout(() => navigate('/login'), 2000)
    }
  }

  const createOfferLinkMutation = useMutation({
    mutationFn: () => {
      const days = parseInt(offerLinkExpiry)
      const expiresAt = days > 0
        ? new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
        : null
      return shareLinksApi.create(transaction.id, { linkType: 'offer_intake', expiresAt })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['share-link', transaction.id, 'offer_intake'] })
      setShowOfferLinkForm(false)
    },
    onError: handleMutationError,
  })

  const disableOfferLinkMutation = useMutation({
    mutationFn: (linkId: number) => shareLinksApi.disable(transaction.id, linkId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['share-link', transaction.id, 'offer_intake'] })
    },
    onError: handleMutationError,
  })

  const copyOfferLink = () => {
    if (!activeOfferLink) return
    const url = `${window.location.origin}/offer/${activeOfferLink.token}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const rejectMutation = useMutation({
    mutationFn: (offerId: number) => offersApi.reject(offerId),
    onSuccess: async () => {
      await invalidateAll()
      setRejectConfirm({ isOpen: false, offerId: null })
    },
    onError: (err) => {
      handleMutationError(err)
      setRejectConfirm({ isOpen: false, offerId: null })
    },
  })

  const withdrawMutation = useMutation({
    mutationFn: (offerId: number) => offersApi.withdraw(offerId),
    onSuccess: async () => {
      await invalidateAll()
      setWithdrawConfirm({ isOpen: false, offerId: null })
    },
    onError: (err) => {
      handleMutationError(err)
      setWithdrawConfirm({ isOpen: false, offerId: null })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (offerId: number) => offersApi.delete(offerId),
    onSuccess: async () => {
      await invalidateAll()
      setDeleteConfirm({ isOpen: false, offerId: null })
    },
    onError: (err) => {
      handleMutationError(err)
      setDeleteConfirm({ isOpen: false, offerId: null })
    },
  })

  if (isLoading) return null
  if (offers.length === 0 && transaction.status !== 'active') return null

  // ── Render: Active offer card (received/countered) ──
  const renderActiveCard = (offer: Offer) => {
    const lastRev = getLastRevision(offer)
    const config = statusBadge[offer.status]
    const isExpanded = effectiveExpanded === offer.id

    return (
      <div key={offer.id} className={`border ${config.border} rounded-lg mb-2 ${config.bg}`}>
        {/* Header */}
        <button
          type="button"
          onClick={() => setExpandedOfferId(isExpanded ? null : offer.id)}
          className="w-full px-3 sm:px-4 py-3 flex items-center justify-between"
        >
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.badge}`}>
              {t(`offers.status.${offer.status}`)}
            </span>
            <span className="text-sm font-semibold text-stone-900">
              {lastRev ? `${formatCAD(lastRev.price)} $` : '—'}
            </span>
            {lastRev && (
              <span className="text-xs text-stone-400 hidden sm:inline">
                {getDirectionLabel(lastRev.direction)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-400 hidden sm:inline">
              {offer.createdAt ? formatDate(parseISO(offer.createdAt), 'd MMM') : ''}
            </span>
            <ChevronDown className={`w-4 h-4 text-stone-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </div>
        </button>

        {/* Expanded details */}
        {isExpanded && lastRev && (
          <div className={`px-3 sm:px-4 pb-3 border-t ${config.expandBorder}`}>
            {/* Grid: Prix / Dépôt / Financement */}
            <div className="py-2 grid grid-cols-3 gap-2 text-xs">
              <div>
                <span className="text-stone-400">{t('offers.price')}</span>
                <p className="font-medium">{formatCAD(lastRev.price)} $</p>
              </div>
              {lastRev.deposit != null && (
                <div>
                  <span className="text-stone-400">{t('offers.deposit')}</span>
                  <p className="font-medium">{formatCAD(lastRev.deposit)} $</p>
                </div>
              )}
              {lastRev.financingAmount != null && (
                <div>
                  <span className="text-stone-400">{t('offers.financing')}</span>
                  <p className="font-medium">{formatCAD(lastRev.financingAmount)} $</p>
                </div>
              )}
            </div>

            {/* Negotiation thread */}
            <NegotiationThread offer={offer} />

            {/* Notes */}
            {lastRev.notes && (
              <p className="text-xs text-stone-500 italic mb-2">&ldquo;{lastRev.notes}&rdquo;</p>
            )}

            {/* Workflow mapping — Reçue: "Concerne étape" */}
            {(() => {
              const offerStep = transaction.transactionSteps?.find(s => s.stepOrder === 2)
              const stepName = offerStep?.workflowStep?.name ?? '—'
              return (
                <div className="flex items-center gap-1.5 mb-2 px-2 py-1.5 rounded bg-indigo-50 border border-indigo-100">
                  <Zap className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span className="text-xs text-indigo-700">
                    {t('transaction.detail.concernsStep')} : <strong>{offerStep ? `${offerStep.stepOrder}. ${stepName}` : '—'}</strong> — {t('transaction.detail.negotiating')}
                  </span>
                </div>
              )
            })()}

            {/* Contextual banner: who sent / whose turn */}
            {(() => {
              const clientRole = transaction.clientRole
              if (!clientRole || !lastRev) return null
              const weAreRecipient =
                (clientRole === 'buyer' && lastRev.direction === 'seller_to_buyer') ||
                (clientRole === 'seller' && lastRev.direction === 'buyer_to_seller')
              if (weAreRecipient) {
                const senderName = lastRev.fromParty?.fullName ?? t('offers.otherParty', { defaultValue: 'l\'autre partie' })
                return (
                  <div className="flex items-center gap-1.5 mb-2 px-2 py-1.5 rounded bg-blue-50 border border-blue-200">
                    <span className="text-xs text-blue-700">
                      {t('transaction.detail.offerReceivedFrom', { name: senderName })} — <strong>{t('transaction.detail.yourTurn')}</strong>
                    </span>
                  </div>
                )
              }
              return (
                <div className="flex items-center gap-1.5 mb-2 px-2 py-1.5 rounded bg-stone-50 border border-stone-200">
                  <span className="text-xs text-stone-600">
                    {t('transaction.detail.youSubmittedThis')} — {t('transaction.detail.waitingResponse')}
                  </span>
                </div>
              )
            })()}

            {/* Actions: Accepter / Contre-offre / Refuser + Retirer (ml-auto) */}
            {(() => {
              const clientRole = transaction.clientRole
              // Determine if it's "our turn" based on last move direction
              const weAreRecipient = clientRole === null ? null :
                (clientRole === 'buyer' && lastRev.direction === 'seller_to_buyer') ||
                (clientRole === 'seller' && lastRev.direction === 'buyer_to_seller')
              // null = show all (backward compat)
              const showAcceptCounterReject = weAreRecipient === null || weAreRecipient === true
              const showWithdraw = weAreRecipient === null || weAreRecipient === false

              return (
                <div className={`flex flex-wrap items-center gap-1.5 pt-2 border-t ${config.expandBorder}`}>
                  {showAcceptCounterReject && (
                    <>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => setAcceptOfferTarget(offer)}
                              className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-emerald-500 text-white hover:bg-emerald-600"
                            >
                              {t('offers.accept')}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">{t('actionZone.acceptTooltip')}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <button
                        onClick={() => setCounterOffer({ offer, lastRevision: lastRev })}
                        className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-blue-500 text-white hover:bg-blue-600"
                      >
                        {t('offers.counter')}
                      </button>
                      <button
                        onClick={() => setRejectConfirm({ isOpen: true, offerId: offer.id })}
                        className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-red-500 text-white hover:bg-red-600"
                      >
                        {t('offers.reject')}
                      </button>
                    </>
                  )}
                  {showWithdraw && (
                    <button
                      onClick={() => setWithdrawConfirm({ isOpen: true, offerId: offer.id })}
                      className={`px-2.5 py-1.5 text-xs font-medium rounded-lg text-stone-500 hover:bg-stone-100 ${showAcceptCounterReject ? 'ml-auto' : ''}`}
                    >
                      {t('offers.withdraw')}
                    </button>
                  )}
                </div>
              )
            })()}
          </div>
        )}
      </div>
    )
  }

  // ── Render: Accepted offer card ──
  const renderAcceptedCard = (offer: Offer) => {
    const lastRev = getLastRevision(offer)
    const config = statusBadge.accepted
    const isExpanded = effectiveExpanded === offer.id

    return (
      <div key={offer.id} className={`border ${config.border} rounded-lg ${config.bg}`}>
        <button
          type="button"
          onClick={() => setExpandedOfferId(isExpanded ? null : offer.id)}
          className="w-full px-3 sm:px-4 py-3 flex items-center justify-between"
        >
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.badge}`}>
              {t('offers.status.accepted')}
            </span>
            <span className="text-sm font-semibold text-stone-900">
              {lastRev ? `${formatCAD(lastRev.price)} $` : '—'}
            </span>
            {lastRev && (
              <span className="text-xs text-stone-400 hidden sm:inline">
                {getDirectionLabel(lastRev.direction)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-400 hidden sm:inline">
              {offer.acceptedAt ? formatDate(parseISO(offer.acceptedAt), 'd MMM') : offer.createdAt ? formatDate(parseISO(offer.createdAt), 'd MMM') : ''}
            </span>
            <ChevronDown className={`w-4 h-4 text-stone-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </div>
        </button>

        {isExpanded && lastRev && (
          <div className={`px-3 sm:px-4 pb-3 border-t ${config.expandBorder}`}>
            <div className="py-2 grid grid-cols-3 gap-2 text-xs">
              <div>
                <span className="text-stone-400">{t('offers.price')}</span>
                <p className="font-medium">{formatCAD(lastRev.price)} $</p>
              </div>
              {lastRev.deposit != null && (
                <div>
                  <span className="text-stone-400">{t('offers.deposit')}</span>
                  <p className="font-medium">{formatCAD(lastRev.deposit)} $</p>
                </div>
              )}
              {lastRev.financingAmount != null && (
                <div>
                  <span className="text-stone-400">{t('offers.financing')}</span>
                  <p className="font-medium">{formatCAD(lastRev.financingAmount)} $</p>
                </div>
              )}
            </div>

            {/* Negotiation thread */}
            <NegotiationThread offer={offer} />

            {/* Workflow mapping — Accepted: "A déclenché" */}
            {(() => {
              const acceptedStep = transaction.transactionSteps?.find(s => s.stepOrder === 3)
              const conditionalStep = transaction.transactionSteps?.find(s => s.stepOrder === 4)
              const acceptedName = acceptedStep?.workflowStep?.name ?? '—'
              const conditionalName = conditionalStep?.workflowStep?.name ?? '—'
              return (
                <div className="flex items-center gap-1.5 mb-2 px-2 py-1.5 rounded bg-emerald-50 border border-emerald-200">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="text-xs text-emerald-700">
                    {t('transaction.detail.triggeredStep')} : <strong>{acceptedStep ? `${acceptedStep.stepOrder}. ${acceptedName}` : '—'}</strong> {conditionalStep && <>&rarr; <strong>{conditionalStep.stepOrder}. {conditionalName}</strong></>}
                  </span>
                </div>
              )
            })()}

            {/* Actions: Voir détails + Addenda */}
            <div className={`flex flex-wrap items-center gap-1.5 pt-2 border-t ${config.expandBorder}`}>
              <button className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50">
                {t('transaction.detail.viewDetails')}
              </button>
              <button className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-primary/30 text-primary hover:bg-primary/5">
                {t('transaction.detail.addenda')}
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── Render: Rejected/withdrawn/expired card (collapsed in maquette) ──
  const renderRejectedCard = (offer: Offer) => {
    const lastRev = getLastRevision(offer)
    const config = statusBadge[offer.status]

    return (
      <div key={offer.id} className={`border ${config.border} rounded-lg`}>
        <div className="px-3 sm:px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.badge}`}>
              {t(`offers.status.${offer.status}`)}
            </span>
            <span className="text-sm text-stone-400 line-through">
              {lastRev ? `${formatCAD(lastRev.price)} $` : '—'}
            </span>
            <span className="text-xs text-stone-300 hidden sm:inline">
              {t('transaction.detail.noWorkflowImpact')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-2 py-0.5 text-[10px] font-medium rounded text-stone-400 hover:text-stone-600 hover:bg-stone-50 hidden sm:block">
              {t('transaction.detail.restore')}
            </button>
            <ChevronRight className="w-4 h-4 text-stone-400" />
          </div>
        </div>
      </div>
    )
  }

  // ── Dispatch to correct renderer ──
  const renderHistoryCard = (offer: Offer) => {
    if (offer.status === 'accepted') return renderAcceptedCard(offer)
    return renderRejectedCard(offer)
  }

  return (
    <div id="offers-panel" className="mb-5 bg-white rounded-xl shadow-sm border border-stone-200 p-3 sm:p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs sm:text-sm font-semibold text-stone-700 flex items-center gap-2">
          <FileText className="w-4 h-4 text-stone-400" />
          {t(transaction.clientRole === 'buyer' ? 'transaction.detail.offersTitleBuyer' : transaction.clientRole === 'seller' ? 'transaction.detail.offersTitleSeller' : 'transaction.detail.offersTitle')}
          <span className="text-xs text-stone-400 font-normal">({offers.length})</span>
        </h3>
        <div className="flex items-center gap-1.5">
          {activeOffers.length >= 2 && (
            <button
              onClick={() => setShowComparison(!showComparison)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border ${
                showComparison
                  ? 'border-[#1e3a5f] bg-[#1e3a5f]/5 text-[#1e3a5f]'
                  : 'border-stone-200 text-stone-500 hover:text-[#1e3a5f] hover:border-[#1e3a5f]'
              }`}
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('offers.compare')}</span>
            </button>
          )}
          {transaction.status === 'active' && (
            <button
              onClick={() => {
                if (hasAcceptedOffer) {
                  setCreateConfirmOpen(true)
                } else {
                  setIsCreateModalOpen(true)
                }
              }}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg ${
                hasAcceptedOffer
                  ? 'border border-stone-200 text-stone-400 hover:text-stone-600 hover:bg-stone-50'
                  : transaction.clientRole === 'seller'
                    ? 'border border-stone-200 text-stone-600 hover:bg-stone-50'
                    : 'text-white bg-primary hover:bg-primary/90'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {transaction.clientRole === 'buyer'
                  ? t('transaction.detail.submitOffer')
                  : transaction.clientRole === 'seller'
                    ? t('transaction.detail.addManually')
                    : t('transaction.detail.newOffer')}
              </span>
              <span className="sm:hidden">{t('transaction.detail.offerMobile')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Offer intake link section — hidden for buyers (they don't receive offers via intake) */}
      {transaction.status === 'active' && transaction.clientRole !== 'buyer' && (
        <div className="mb-3 rounded-lg border border-dashed border-stone-200 bg-stone-50/50 px-3 py-2.5">
          {activeOfferLink ? (
            <div className="flex items-center gap-2 flex-wrap">
              <Link2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span className="text-xs font-medium text-stone-700">{t('offerLink.activeLink')}</span>
              <button
                onClick={copyOfferLink}
                className="ml-auto inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="w-3 h-3" />
                    {t('offerLink.copied')}
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    {t('offerLink.copyLink')}
                  </>
                )}
              </button>
              <button
                onClick={() => disableOfferLinkMutation.mutate(activeOfferLink.id)}
                disabled={disableOfferLinkMutation.isPending}
                className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium rounded-md text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              >
                <XCircle className="w-3 h-3" />
                {t('offerLink.disableLink')}
              </button>
            </div>
          ) : showOfferLinkForm ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Link2 className="w-3.5 h-3.5 text-stone-400" />
                <span className="text-xs font-medium text-stone-700">{t('offerLink.generate')}</span>
              </div>
              <p className="text-xs text-stone-500">{t('offerLink.description')}</p>
              <div className="flex items-center gap-2">
                <label className="text-xs text-stone-500">{t('offerLink.expiration')}</label>
                <select
                  value={offerLinkExpiry}
                  onChange={(e) => setOfferLinkExpiry(e.target.value)}
                  className="text-xs border border-stone-200 rounded-md px-2 py-1 bg-white"
                >
                  <option value="7">{t('offerLink.days7')}</option>
                  <option value="14">{t('offerLink.days14')}</option>
                  <option value="30">{t('offerLink.days30')}</option>
                  <option value="0">{t('offerLink.noExpiry')}</option>
                </select>
                <button
                  onClick={() => createOfferLinkMutation.mutate()}
                  disabled={createOfferLinkMutation.isPending}
                  className="ml-auto px-3 py-1.5 text-xs font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {createOfferLinkMutation.isPending ? t('offerLink.creating') : t('offerLink.createButton')}
                </button>
                <button
                  onClick={() => setShowOfferLinkForm(false)}
                  className="px-2 py-1.5 text-xs text-stone-400 hover:text-stone-600"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowOfferLinkForm(true)}
              className="w-full flex items-center gap-2 text-xs text-stone-500 hover:text-blue-600 transition-colors"
            >
              <Link2 className="w-3.5 h-3.5" />
              <span>{t('offerLink.generate')}</span>
              <span className="text-stone-300">—</span>
              <span className="text-stone-400">{t('offerLink.description')}</span>
            </button>
          )}
        </div>
      )}

      {/* Active offers */}
      {activeOffers.map((offer) => renderActiveCard(offer))}

      {/* Offer comparison */}
      {showComparison && activeOffers.length >= 2 && (
        <OfferComparison
          offers={activeOffers}
          onAccept={(offer) => {
            setShowComparison(false)
            setAcceptOfferTarget(offer)
          }}
        />
      )}

      {offers.length === 0 && (
        <p className="text-xs text-stone-400 py-2">{t('offers.empty')}</p>
      )}

      {/* History: mobile toggle / desktop always visible */}
      {historyOffers.length > 0 && (
        <>
          {/* Mobile: toggle button */}
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="sm:hidden w-full flex items-center justify-center gap-1.5 py-2 mb-2 rounded-lg border border-dashed border-stone-200 text-xs text-stone-500 hover:bg-stone-50"
          >
            <Clock className="w-3 h-3" />
            <span>
              {showHistory
                ? t('transaction.detail.hideHistory')
                : t('transaction.detail.viewHistory', { count: historyOffers.length })}
            </span>
          </button>

          {/* Desktop: always visible / Mobile: conditionally visible */}
          <div className={`${showHistory ? 'block' : 'hidden'} sm:block space-y-2`}>
            {historyOffers.map((offer) => renderHistoryCard(offer))}
          </div>
        </>
      )}

      {/* Create Offer Modal (Maquette 06) */}
      <CreateOfferModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        transaction={transaction}
      />

      {/* Counter-Offer Modal (Maquette 06 — unified) */}
      {counterOffer && (
        <CreateOfferModal
          isOpen={true}
          onClose={() => setCounterOffer(null)}
          transaction={transaction}
          existingOffer={counterOffer.offer}
          lastRevision={counterOffer.lastRevision}
        />
      )}

      {/* Accept Offer Modal (Maquette 02) */}
      {acceptOfferTarget && (
        <AcceptOfferModal
          isOpen={true}
          onClose={() => setAcceptOfferTarget(null)}
          offer={acceptOfferTarget}
          transaction={transaction}
        />
      )}

      {/* Confirm Dialogs */}
      <ConfirmDialog
        isOpen={rejectConfirm.isOpen}
        onClose={() => setRejectConfirm({ isOpen: false, offerId: null })}
        onConfirm={() => rejectConfirm.offerId && rejectMutation.mutate(rejectConfirm.offerId)}
        title={t('offers.confirm.rejectTitle')}
        message={t('offers.confirm.rejectMessage')}
        confirmLabel={t('offers.reject')}
        variant="danger"
        isLoading={rejectMutation.isPending}
      />
      <ConfirmDialog
        isOpen={withdrawConfirm.isOpen}
        onClose={() => setWithdrawConfirm({ isOpen: false, offerId: null })}
        onConfirm={() =>
          withdrawConfirm.offerId && withdrawMutation.mutate(withdrawConfirm.offerId)
        }
        title={t('offers.confirm.withdrawTitle')}
        message={t('offers.confirm.withdrawMessage')}
        confirmLabel={t('offers.withdraw')}
        variant="warning"
        isLoading={withdrawMutation.isPending}
      />
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, offerId: null })}
        onConfirm={() => deleteConfirm.offerId && deleteMutation.mutate(deleteConfirm.offerId)}
        title={t('offers.confirm.deleteTitle')}
        message={t('offers.confirm.deleteMessage')}
        confirmLabel={t('offers.delete')}
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
      <ConfirmDialog
        isOpen={createConfirmOpen}
        onClose={() => setCreateConfirmOpen(false)}
        onConfirm={() => {
          setCreateConfirmOpen(false)
          setIsCreateModalOpen(true)
        }}
        title={t('offers.confirm.createWhileAcceptedTitle')}
        message={t('offers.confirm.createWhileAcceptedMessage')}
        confirmLabel={t('offers.confirm.createWhileAcceptedConfirm')}
        variant="warning"
      />
    </div>
  )
}
