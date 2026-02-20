import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import {
  X,
  FileText,
  Check,
  Lock,
  AlertTriangle,
  ArrowRight,
  Mail,
  RefreshCw,
  Copy,
  ChevronDown,
  MessageCircle,
} from 'lucide-react'
import { offersApi } from '../../api/offers.api'
import { partiesApi } from '../../api/parties.api'
import type { Offer, OfferRevision, Transaction, OfferStatus } from '../../api/transactions.api'
import { formatDate, parseISO } from '../../lib/date'
import NegotiationThread from './NegotiationThread'
import PartyPicker from './PartyPicker'

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

const EXPIRY_OPTIONS = ['24h', '48h', '7d', 'custom'] as const
type ExpiryOption = (typeof EXPIRY_OPTIONS)[number] | ''

function computeExpiryAt(option: ExpiryOption, customDate: string): string | null {
  const now = new Date()
  switch (option) {
    case '24h': return new Date(now.getTime() + 24 * 3600 * 1000).toISOString()
    case '48h': return new Date(now.getTime() + 48 * 3600 * 1000).toISOString()
    case '7d': return new Date(now.getTime() + 7 * 24 * 3600 * 1000).toISOString()
    case 'custom': return customDate ? new Date(customDate + 'T23:59:59').toISOString() : null
    default: return null
  }
}

const STATUS_COLORS: Record<string, string> = {
  received: 'bg-blue-100 text-blue-700',
  countered: 'bg-amber-100 text-amber-700',
  accepted: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700',
  expired: 'bg-stone-100 text-stone-500',
  withdrawn: 'bg-stone-100 text-stone-500',
}

export default function CreateOfferModal({
  isOpen,
  onClose,
  transaction,
  existingOffer,
  lastRevision,
}: CreateOfferModalProps) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isCounter = !!existingOffer && !!lastRevision

  // ── View state ──
  const [view, setView] = useState<'form' | 'success' | 'perm-error' | 'server-error'>('form')

  // ── Form state ──
  const [offerType, setOfferType] = useState<'offer' | 'counter'>('offer')
  const [price, setPrice] = useState('')
  const [deposit, setDeposit] = useState('')
  const [depositDeadline, setDepositDeadline] = useState('')
  const [closingDate, setClosingDate] = useState('')
  const [expiryOption, setExpiryOption] = useState<ExpiryOption>('48h')
  const [customExpiry, setCustomExpiry] = useState('')
  const [financingEnabled, setFinancingEnabled] = useState(false)
  const [financingAmount, setFinancingAmount] = useState('')
  const [inspectionEnabled, setInspectionEnabled] = useState(false)
  const [inspectionDelay, setInspectionDelay] = useState('')
  const [inclusions, setInclusions] = useState('')
  const [message, setMessage] = useState('')
  const [emailNotify, setEmailNotify] = useState(true)

  // ── Validation ──
  const [showErrors, setShowErrors] = useState(false)

  // ── Error details (State F) ──
  const [serverErrorDetails, setServerErrorDetails] = useState({ code: '', timestamp: '' })
  const [copiedDetails, setCopiedDetails] = useState(false)

  // ── Party state ──
  const [buyerPartyId, setBuyerPartyId] = useState<number | null>(null)
  const [sellerPartyId, setSellerPartyId] = useState<number | null>(null)

  // ── Mobile accordion ──
  const [accordionOpen, setAccordionOpen] = useState(false)

  // C4: Pre-fetch parties for pre-selection
  const { data: partiesData } = useQuery({
    queryKey: ['parties', transaction.id],
    queryFn: () => partiesApi.list(transaction.id),
    enabled: isOpen,
  })

  // ── Reset on open ──
  useEffect(() => {
    if (isOpen) {
      setView('form')
      setOfferType(isCounter ? 'counter' : (transaction.clientRole === 'seller' ? 'counter' : 'offer'))
      setPrice(isCounter ? String(lastRevision!.price) : '')
      setDeposit(isCounter && lastRevision!.deposit != null ? String(lastRevision!.deposit) : '')
      setDepositDeadline(isCounter && lastRevision!.depositDeadline ? lastRevision!.depositDeadline.substring(0, 10) : '')
      setClosingDate(isCounter && lastRevision!.closingDate ? lastRevision!.closingDate.substring(0, 10) : '')
      setExpiryOption('48h')
      setCustomExpiry('')
      setFinancingEnabled(isCounter ? !!lastRevision!.financingAmount : false)
      setFinancingAmount(isCounter && lastRevision!.financingAmount != null ? String(lastRevision!.financingAmount) : '')
      setInspectionEnabled(isCounter ? !!lastRevision!.inspectionRequired : false)
      setInspectionDelay(isCounter && lastRevision!.inspectionDelay != null ? String(lastRevision!.inspectionDelay) : '')
      setInclusions(isCounter && lastRevision!.inclusions ? lastRevision!.inclusions : '')
      setMessage(isCounter && lastRevision!.message ? lastRevision!.message : '')
      setEmailNotify(true)
      setShowErrors(false)
      setAccordionOpen(false)
      setCopiedDetails(false)
      // Pre-populate parties from last revision in counter mode
      if (isCounter && lastRevision) {
        // In counter mode, swap from/to: the fromParty of last revision becomes the toParty
        const fromRole = lastRevision.direction === 'buyer_to_seller' ? 'buyer' : 'seller'
        if (fromRole === 'buyer') {
          setBuyerPartyId(lastRevision.fromPartyId ?? null)
          setSellerPartyId(lastRevision.toPartyId ?? null)
        } else {
          setBuyerPartyId(lastRevision.toPartyId ?? null)
          setSellerPartyId(lastRevision.fromPartyId ?? null)
        }
      } else {
        setBuyerPartyId(null)
        setSellerPartyId(null)
      }
    }
  }, [isOpen, isCounter, lastRevision])

  // C4: Pre-select primary buyer/seller parties when data loads (new offer only)
  useEffect(() => {
    if (!isOpen || isCounter || !partiesData?.data?.parties) return
    const allParties = partiesData.data.parties
    if (buyerPartyId === null) {
      const primaryBuyer = allParties.find((p) => p.role === 'buyer' && p.isPrimary) ?? allParties.find((p) => p.role === 'buyer')
      if (primaryBuyer) setBuyerPartyId(primaryBuyer.id)
    }
    if (sellerPartyId === null) {
      const primarySeller = allParties.find((p) => p.role === 'seller' && p.isPrimary) ?? allParties.find((p) => p.role === 'seller')
      if (primarySeller) setSellerPartyId(primarySeller.id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isCounter, partiesData])

  // ── Escape key ──
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen])

  // ── Derived values ──
  const priceNum = parseMoney(price)
  const depositNum = parseMoney(deposit)
  const listPrice = transaction.listPrice ?? 0
  const diff = priceNum > 0 && listPrice > 0 ? priceNum - listPrice : null

  const expiryLabel = useMemo(() => {
    switch (expiryOption) {
      case '24h': return '24h'
      case '48h': return '48h'
      case '7d': return t('addOffer.exp7d')
      case 'custom': return customExpiry || '—'
      default: return '—'
    }
  }, [expiryOption, customExpiry, t])

  // ── Validation ──
  const errors: Record<string, string> = {}
  if (!priceNum) errors.price = t('addOffer.errorAmountRequired')
  if (depositNum > priceNum && priceNum > 0) errors.deposit = t('addOffer.errorDepositExceeds')
  if (closingDate && new Date(closingDate) < new Date(new Date().toDateString())) errors.closingDate = t('addOffer.errorClosingPast')
  if (!expiryOption) errors.expiry = t('addOffer.errorExpirationRequired')
  if (financingEnabled && !parseMoney(financingAmount)) errors.financing = t('addOffer.errorFinancingRequired')
  if (!buyerPartyId) errors.buyerParty = t('addOffer.errorBuyerRequired')
  if (!sellerPartyId) errors.sellerParty = t('addOffer.errorSellerRequired')
  const errorCount = Object.keys(errors).length
  const hasErrors = showErrors && errorCount > 0

  // ── Offers query (for history panel) ──
  const { data: offersData } = useQuery({
    queryKey: ['offers', transaction.id],
    queryFn: () => offersApi.list(transaction.id),
    enabled: isOpen,
  })
  const allOffers: Offer[] = (offersData as any)?.data?.offers ?? []

  // ── Submit mutation ──
  const createMutation = useMutation({
    mutationFn: async () => {
      let direction: 'buyer_to_seller' | 'seller_to_buyer'
      if (isCounter && lastRevision) {
        // Counter-offer: invert the direction of the last revision
        direction = lastRevision.direction === 'buyer_to_seller' ? 'seller_to_buyer' : 'buyer_to_seller'
      } else {
        // New offer: based on clientRole
        direction = transaction.clientRole === 'seller' ? 'seller_to_buyer' : 'buyer_to_seller'
      }
      const payload = {
        price: priceNum,
        deposit: depositNum || null,
        depositDeadline: depositDeadline || null,
        closingDate: closingDate || null,
        financingAmount: financingEnabled ? parseMoney(financingAmount) || null : null,
        expiryAt: computeExpiryAt(expiryOption, customExpiry),
        direction,
        inspectionRequired: inspectionEnabled,
        inspectionDelay: inspectionEnabled ? parseInt(inspectionDelay) || null : null,
        inclusions: inclusions.trim() || null,
        message: message.trim() || null,
        notes: null,
        buyerPartyId: buyerPartyId ?? undefined,
        sellerPartyId: sellerPartyId ?? undefined,
      }

      let result
      if (isCounter) {
        // Convert buyer/seller to from/to based on direction for addRevision
        const fromPartyId = direction === 'buyer_to_seller' ? buyerPartyId : sellerPartyId
        const toPartyId = direction === 'buyer_to_seller' ? sellerPartyId : buyerPartyId
        result = await offersApi.addRevision(existingOffer!.id, {
          ...payload,
          fromPartyId: fromPartyId ?? undefined,
          toPartyId: toPartyId ?? undefined,
        })
      } else {
        result = await offersApi.create(transaction.id, payload)
      }

      if (!result.success) {
        throw { type: 'permission', message: result.error?.message || '' }
      }

      return result
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['transaction', transaction.id] }),
        queryClient.invalidateQueries({ queryKey: ['offers', transaction.id] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      ])
      setView('success')
    },
    onError: (error: any) => {
      if (error?.type === 'permission') {
        setView('perm-error')
      } else {
        setServerErrorDetails({
          code: 'ERR_OFFER_SUBMIT_500',
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        })
        setView('server-error')
      }
    },
  })

  // ── Handlers ──
  const handleSubmit = () => {
    setShowErrors(true)
    if (errorCount > 0) return
    createMutation.mutate()
  }

  const handleClose = () => {
    if (createMutation.isPending) return
    onClose()
  }

  const handleRetry = () => {
    setView('form')
    createMutation.reset()
  }

  const handleCopyDetails = () => {
    const text = `${serverErrorDetails.code}\n${serverErrorDetails.timestamp}`
    navigator.clipboard.writeText(text)
    setCopiedDetails(true)
    setTimeout(() => setCopiedDetails(false), 1500)
  }

  if (!isOpen) return null

  const clientName = transaction.client
    ? `${transaction.client.firstName ?? ''} ${transaction.client.lastName ?? ''}`.trim() || transaction.client.email || '—'
    : '—'
  const address = transaction.property?.address
    ? `${transaction.property.address}, ${transaction.property.city || ''}`
    : '—'

  // ═════════════════════════════════════════
  // STATE D — SUCCESS
  // ═════════════════════════════════════════
  if (view === 'success') {
    return createPortal(
      <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
        <div className="absolute inset-0 bg-black/50 animate-[fadeIn_.2s_ease-out]" onClick={handleClose} />
        <div className="absolute inset-0 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            className="relative w-full sm:max-w-[400px] bg-white rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-xl animate-[sheetUp_.25s_ease-out] sm:animate-[modalIn_.25s_ease-out]"
            onClick={e => e.stopPropagation()}
          >
            {/* Mobile handle */}
            <div className="flex sm:hidden justify-center pt-2 pb-1">
              <div className="w-8 h-1 rounded-full bg-stone-300" />
            </div>

            <div className="px-6 py-8 text-center">
              {/* Icon */}
              <div className="w-14 h-14 rounded-full bg-[#d1fae5] flex items-center justify-center mx-auto mb-4">
                <Check className="w-7 h-7 text-[#059669]" strokeWidth={2} />
              </div>

              <h2 className="text-base font-bold text-stone-900" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
                {t('addOffer.successTitle')}
              </h2>
              <p className="text-xs text-stone-500 mt-1 mb-5">
                {t('addOffer.successSubtitle')}
              </p>

              {/* Info card */}
              <div className="rounded-lg border border-stone-200 bg-stone-50 p-3 text-left space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-stone-500">{t('addOffer.successType')}</span>
                  <span className="font-medium text-stone-900">
                    {offerType === 'counter' ? t('addOffer.typeCounter') : t('addOffer.typeOffer')}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-stone-500">{t('addOffer.successAmount')}</span>
                  <span className="font-medium text-stone-900">{formatCAD(priceNum)} $</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-stone-500">{t('addOffer.successExpiration')}</span>
                  <span className="font-medium text-stone-900">{expiryLabel}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-stone-500">{t('addOffer.successNotification')}</span>
                  <span className="font-medium text-[#059669]">{emailNotify ? t('addOffer.successEmailSent') : '—'}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 pb-6 flex flex-col gap-2">
              <button
                onClick={() => { handleClose(); navigate(`/transactions/${transaction.id}`) }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#1e3a5f] hover:bg-[#16304d] text-white text-xs font-semibold"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                {t('addOffer.viewTimeline')}
              </button>
              <button
                onClick={handleClose}
                className="w-full px-4 py-2.5 rounded-lg border border-stone-300 text-stone-600 hover:bg-stone-50 text-xs font-semibold"
              >
                {t('addOffer.close')}
              </button>
            </div>
          </div>
        </div>
      </div>,
      document.body,
    )
  }

  // ═════════════════════════════════════════
  // STATE E — PERMISSION ERROR
  // ═════════════════════════════════════════
  if (view === 'perm-error') {
    return createPortal(
      <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
        <div className="absolute inset-0 bg-black/50 animate-[fadeIn_.2s_ease-out]" onClick={handleClose} />
        <div className="absolute inset-0 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            className="relative w-full sm:max-w-[400px] bg-white rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-xl animate-[sheetUp_.25s_ease-out] sm:animate-[modalIn_.25s_ease-out]"
            onClick={e => e.stopPropagation()}
          >
            {/* Mobile handle */}
            <div className="flex sm:hidden justify-center pt-2 pb-1">
              <div className="w-8 h-1 rounded-full bg-stone-300" />
            </div>

            <div className="px-6 pt-7 pb-5">
              {/* Icon */}
              <div className="w-11 h-11 rounded-full bg-[#fffbeb] flex items-center justify-center mx-auto mb-4">
                <Lock className="w-5.5 h-5.5 text-[#d97706]" strokeWidth={2} />
              </div>

              <h2 className="text-[15px] font-bold text-stone-900 text-center" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
                {t('addOffer.permErrorTitle')}
              </h2>
              <p className="text-[11px] text-stone-500 text-center mt-0.5 mb-4">
                {t('addOffer.permErrorSubtitle')}
              </p>

              {/* Warning card */}
              <div className="rounded-lg border border-[#fde68a] bg-[#fffbeb] p-3 mb-4">
                <p className="text-xs text-[#92400e]">
                  {t('addOffer.permErrorMessage', { role: 'Viewer' })}
                </p>
              </div>

              {/* Info card */}
              <div className="rounded-lg border border-stone-200 bg-stone-50 p-3 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-stone-500">{t('addOffer.permErrorYourRole')}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-stone-100 text-stone-600">Viewer</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-stone-500">{t('addOffer.permErrorRequiredRole')}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#1e3a5f] text-white">{t('addOffer.permErrorRequiredValue')}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-stone-500">{t('addOffer.permErrorOwner')}</span>
                  <span className="font-medium text-stone-900">{transaction.user?.fullName || '—'}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 pb-6 flex flex-col gap-2">
              <button
                onClick={() => navigate(`/transactions/${transaction.id}/access`)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#1e3a5f] hover:bg-[#16304d] text-white text-xs font-semibold"
              >
                <Mail className="w-3.5 h-3.5" />
                {t('addOffer.requestAccess')}
              </button>
              <button
                onClick={handleClose}
                className="w-full px-4 py-2.5 rounded-lg border border-stone-300 text-stone-600 hover:bg-stone-50 text-xs font-semibold"
              >
                {t('addOffer.close')}
              </button>
            </div>
          </div>
        </div>
      </div>,
      document.body,
    )
  }

  // ═════════════════════════════════════════
  // STATE F — SERVER ERROR
  // ═════════════════════════════════════════
  if (view === 'server-error') {
    return createPortal(
      <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
        <div className="absolute inset-0 bg-black/50 animate-[fadeIn_.2s_ease-out]" onClick={handleClose} />
        <div className="absolute inset-0 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            className="relative w-full sm:max-w-[400px] bg-white rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-xl animate-[sheetUp_.25s_ease-out] sm:animate-[modalIn_.25s_ease-out]"
            onClick={e => e.stopPropagation()}
          >
            {/* Mobile handle */}
            <div className="flex sm:hidden justify-center pt-2 pb-1">
              <div className="w-8 h-1 rounded-full bg-stone-300" />
            </div>

            <div className="px-6 pt-7 pb-5">
              {/* Icon */}
              <div className="w-11 h-11 rounded-full bg-[#fef2f2] flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-5.5 h-5.5 text-[#dc2626]" strokeWidth={2} />
              </div>

              <h2 className="text-[15px] font-bold text-stone-900 text-center" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
                {t('addOffer.serverErrorTitle')}
              </h2>
              <p className="text-[11px] text-stone-500 text-center mt-0.5 mb-4">
                {t('addOffer.serverErrorSubtitle', { code: '500' })}
              </p>

              {/* Error card */}
              <div className="rounded-lg border border-[#fecaca] bg-[#fef2f2] p-3 mb-4">
                <p className="text-xs text-[#991b1b]">
                  {t('addOffer.serverErrorMessage')}
                </p>
              </div>

              {/* Info card */}
              <div className="rounded-lg border border-stone-200 bg-stone-50 p-3 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-stone-500">{t('addOffer.serverErrorCode')}</span>
                  <span className="font-mono text-[10px] text-stone-700">{serverErrorDetails.code}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-stone-500">{t('addOffer.serverErrorTimestamp')}</span>
                  <span className="font-mono text-[10px] text-stone-700">{serverErrorDetails.timestamp}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 pb-6 flex flex-col gap-2">
              <button
                onClick={handleRetry}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#dc2626] hover:bg-[#b91c1c] text-white text-xs font-semibold"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                {t('addOffer.retry')}
              </button>
              <button
                onClick={handleCopyDetails}
                className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border text-xs font-semibold transition-colors ${
                  copiedDetails
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                    : 'border-stone-300 text-stone-600 hover:bg-stone-50'
                }`}
              >
                {copiedDetails ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedDetails ? t('addOffer.copied') : t('addOffer.copyDetails')}
              </button>
              <button
                onClick={handleClose}
                className="w-full px-4 py-2.5 rounded-lg border border-stone-300 text-stone-600 hover:bg-stone-50 text-xs font-semibold"
              >
                {t('addOffer.close')}
              </button>
            </div>
          </div>
        </div>
      </div>,
      document.body,
    )
  }

  // ═════════════════════════════════════════
  // STATES A / B / C — FORM
  // ═════════════════════════════════════════
  const fieldError = (key: string) =>
    showErrors && errors[key] ? (
      <p className="text-[10px] text-[#dc2626] mt-1">{errors[key]}</p>
    ) : null

  const inputClass = (key: string) =>
    `w-full px-3 py-2 text-base sm:text-[13px] rounded-lg border ${
      showErrors && errors[key]
        ? 'border-[#dc2626] bg-[#fef2f2]'
        : 'border-stone-200 focus:border-[#1e3a5f]'
    } focus:outline-none focus:ring-[3px] focus:ring-[rgba(30,58,95,.1)]`

  // ── Party names for draft preview ──
  const allParties = partiesData?.data?.parties ?? []
  const buyerName = allParties.find(p => p.id === buyerPartyId)?.fullName ?? t('addOffer.buyerParty')
  const sellerName = allParties.find(p => p.id === sellerPartyId)?.fullName ?? t('addOffer.sellerParty')

  return createPortal(
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/50 animate-[fadeIn_.2s_ease-out]" onClick={handleClose} />
      <div className="absolute inset-0 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
        <div
          className="relative w-full sm:max-w-[820px] max-h-[85vh] sm:max-h-[90vh] bg-white rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-xl flex flex-col animate-[sheetUp_.25s_ease-out] sm:animate-[modalIn_.25s_ease-out]"
          onClick={e => e.stopPropagation()}
        >
          {/* Mobile handle */}
          <div className="flex sm:hidden justify-center pt-2 pb-1">
            <div className="w-8 h-1 rounded-full bg-stone-300" />
          </div>

          {/* ── HEADER ── */}
          <div className="px-4 sm:px-6 pt-3 sm:pt-5 pb-3 sm:pb-4 border-b border-stone-200 flex items-start justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[10px] bg-[rgba(30,58,95,.08)] flex items-center justify-center shrink-0">
                <FileText className="w-[18px] h-[18px] text-[#1e3a5f]" strokeWidth={2} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-[15px] font-bold text-stone-900" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
                    {isCounter ? t('addOffer.titleCounter') : t('addOffer.title')}
                  </h2>
                  {isCounter && lastRevision && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[rgba(224,122,47,.15)] text-[#e07a2f]">
                      {t('addOffer.revisionBadge', { number: (lastRevision.revisionNumber ?? 0) + 1 })}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  {t('addOffer.transactionLabel', { client: clientName, address })}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="flex w-8 h-8 rounded-lg items-center justify-center text-stone-400 hover:bg-stone-100"
            >
              <X className="w-[18px] h-[18px]" />
            </button>
          </div>

          {/* ── ERROR BANNER (State B) ── */}
          {hasErrors && (
            <div className="px-5 sm:px-6 py-2.5 bg-[#fef2f2] border-b border-[#fecaca] flex items-center gap-2 shrink-0">
              <AlertTriangle className="w-4 h-4 text-[#dc2626] shrink-0" />
              <p className="text-xs text-[#991b1b] font-medium">
                {t('addOffer.errorBanner', { count: errorCount })}
              </p>
            </div>
          )}

          {/* ── BODY (two-column) ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 min-h-0 flex-1 overflow-y-auto">
            {/* ═══ LEFT COLUMN — FORM ═══ */}
            <div className="px-5 sm:px-6 py-5 space-y-3.5 overflow-y-auto">
              {/* Type segmented */}
              <div>
                <label className="block text-[11px] font-semibold text-stone-600 mb-1.5">
                  {t('addOffer.typeLabel')}
                </label>
                <div className="inline-flex rounded-lg border border-stone-200 bg-stone-100 p-[3px] gap-[2px]">
                  <button
                    type="button"
                    onClick={() => setOfferType('offer')}
                    className={`px-4 py-1.5 rounded-md text-[11px] font-medium transition-all ${
                      offerType === 'offer'
                        ? 'bg-white text-[#1e3a5f] shadow-sm'
                        : 'text-stone-500 hover:text-stone-700'
                    }`}
                  >
                    {t('addOffer.typeOffer')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setOfferType('counter')}
                    className={`px-4 py-1.5 rounded-md text-[11px] font-medium transition-all ${
                      offerType === 'counter'
                        ? 'bg-white text-[#1e3a5f] shadow-sm'
                        : 'text-stone-500 hover:text-stone-700'
                    }`}
                  >
                    {t('addOffer.typeCounter')}
                  </button>
                </div>
              </div>

              {/* Party pickers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <PartyPicker
                    transactionId={transaction.id}
                    role="buyer"
                    selectedPartyId={buyerPartyId}
                    onSelect={setBuyerPartyId}
                    error={showErrors && !!errors.buyerParty}
                  />
                  {fieldError('buyerParty')}
                </div>
                <div>
                  <PartyPicker
                    transactionId={transaction.id}
                    role="seller"
                    selectedPartyId={sellerPartyId}
                    onSelect={setSellerPartyId}
                    error={showErrors && !!errors.sellerParty}
                  />
                  {fieldError('sellerParty')}
                </div>
              </div>

              {/* Montant offert */}
              <div>
                <label className="block text-[11px] font-semibold text-stone-600 mb-1.5">
                  {t('addOffer.amountLabel')} <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  placeholder={t('addOffer.amountPlaceholder')}
                  className={inputClass('price')}
                />
                {listPrice > 0 && (
                  <p className="text-[10px] text-stone-400 mt-1">
                    {t('addOffer.askingPriceHint', { price: `${formatCAD(listPrice)} $` })}
                  </p>
                )}
                {fieldError('price')}
              </div>

              {/* Dépôt + Date limite dépôt */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-stone-600 mb-1.5">
                    {t('addOffer.depositLabel')}
                  </label>
                  <input
                    type="text"
                    value={deposit}
                    onChange={e => setDeposit(e.target.value)}
                    placeholder={t('addOffer.depositPlaceholder')}
                    className={inputClass('deposit')}
                  />
                  {fieldError('deposit')}
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-stone-600 mb-1.5">
                    {t('addOffer.depositDeadlineLabel')}
                  </label>
                  <input
                    type="date"
                    value={depositDeadline}
                    onChange={e => setDepositDeadline(e.target.value)}
                    className={inputClass('')}
                  />
                </div>
              </div>

              {/* Date de clôture */}
              <div>
                <label className="block text-[11px] font-semibold text-stone-600 mb-1.5">
                  {t('addOffer.closingDateLabel')}
                </label>
                <input
                  type="date"
                  value={closingDate}
                  onChange={e => setClosingDate(e.target.value)}
                  className={inputClass('closingDate')}
                />
                {fieldError('closingDate')}
              </div>

              {/* Expiration pills */}
              <div>
                <label className="block text-[11px] font-semibold text-stone-600 mb-1.5">
                  {t('addOffer.expirationLabel')} <span className="text-red-400">*</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {EXPIRY_OPTIONS.map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setExpiryOption(opt)}
                      className={`px-3.5 py-1.5 rounded-[20px] text-[11px] font-medium border transition-colors ${
                        expiryOption === opt
                          ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]'
                          : 'bg-white text-stone-600 border-stone-300 hover:border-[#1e3a5f] hover:text-[#1e3a5f]'
                      }`}
                    >
                      {opt === '24h' ? t('addOffer.exp24h') :
                       opt === '48h' ? t('addOffer.exp48h') :
                       opt === '7d' ? t('addOffer.exp7d') :
                       t('addOffer.expCustom')}
                    </button>
                  ))}
                </div>
                {expiryOption === 'custom' && (
                  <input
                    type="date"
                    value={customExpiry}
                    onChange={e => setCustomExpiry(e.target.value)}
                    className={`mt-2 ${inputClass('')}`}
                  />
                )}
                {fieldError('expiry')}
              </div>

              {/* Financement toggle */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-stone-600">
                    {t('addOffer.financingLabel')}
                  </label>
                  <button
                    type="button"
                    onClick={() => setFinancingEnabled(!financingEnabled)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      financingEnabled ? 'bg-[#1e3a5f]' : 'bg-stone-300'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                      financingEnabled ? 'translate-x-[16px]' : 'translate-x-[2px]'
                    }`} />
                  </button>
                </div>
                <div
                  className="overflow-hidden transition-all duration-250"
                  style={{ maxHeight: financingEnabled ? 80 : 0 }}
                >
                  <input
                    type="text"
                    value={financingAmount}
                    onChange={e => setFinancingAmount(e.target.value)}
                    placeholder={t('addOffer.financingPlaceholder')}
                    className={`mt-2 ${inputClass('financing')}`}
                  />
                  {fieldError('financing')}
                </div>
              </div>

              {/* Inspection toggle */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-stone-600">
                    {t('addOffer.inspectionLabel')}
                  </label>
                  <button
                    type="button"
                    onClick={() => setInspectionEnabled(!inspectionEnabled)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      inspectionEnabled ? 'bg-[#1e3a5f]' : 'bg-stone-300'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                      inspectionEnabled ? 'translate-x-[16px]' : 'translate-x-[2px]'
                    }`} />
                  </button>
                </div>
                <div
                  className="overflow-hidden transition-all duration-250"
                  style={{ maxHeight: inspectionEnabled ? 80 : 0 }}
                >
                  <input
                    type="text"
                    value={inspectionDelay}
                    onChange={e => setInspectionDelay(e.target.value)}
                    placeholder={t('addOffer.inspectionPlaceholder')}
                    className={`mt-2 ${inputClass('')}`}
                  />
                </div>
              </div>

              {/* Inclusions / Exclusions */}
              <div>
                <label className="block text-[11px] font-semibold text-stone-600 mb-1.5">
                  {t('addOffer.inclusionsLabel')}
                </label>
                <textarea
                  value={inclusions}
                  onChange={e => setInclusions(e.target.value)}
                  placeholder={t('addOffer.inclusionsPlaceholder')}
                  className={`${inputClass('')} resize-y`}
                  style={{ minHeight: 60 }}
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-[11px] font-semibold text-stone-600 mb-1.5">
                  {t('addOffer.messageLabel')}{' '}
                  <span className="font-normal text-stone-400">({t('addOffer.messageOptional')})</span>
                </label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder={t('addOffer.messagePlaceholder')}
                  className={`${inputClass('')} resize-y`}
                  style={{ minHeight: 60 }}
                />
              </div>

              {/* ── Summary card ── */}
              <div className="rounded-lg border border-stone-200 bg-stone-50 p-3 mt-4 space-y-1">
                <div className="flex justify-between text-[11px] py-1">
                  <span className="text-stone-500">{t('addOffer.summaryAskingPrice')}</span>
                  <span className="font-medium text-stone-900">{listPrice > 0 ? `${formatCAD(listPrice)} $` : '—'}</span>
                </div>
                <div className="flex justify-between text-[11px] py-1">
                  <span className="text-stone-500">{t('addOffer.summaryOffered')}</span>
                  <span className={`font-medium ${priceNum > 0 ? 'text-stone-900' : 'text-stone-400'}`}>
                    {priceNum > 0 ? `${formatCAD(priceNum)} $` : '—'}
                  </span>
                </div>
                <div className="border-t border-dashed border-stone-200 my-1" />
                <div className="flex justify-between text-[11px] py-1">
                  <span className="text-stone-500">{t('addOffer.summaryDiff')}</span>
                  <span className={`font-bold ${
                    diff === null ? 'text-stone-400' :
                    diff > 0 ? 'text-[#059669]' :
                    diff < 0 ? 'text-[#e07a2f]' : 'text-stone-500'
                  }`}>
                    {diff === null ? '—' : `${diff > 0 ? '+' : ''}${formatCAD(diff)} $`}
                  </span>
                </div>
                <div className="flex justify-between text-[11px] py-1">
                  <span className="text-stone-500">{t('addOffer.summaryExpiration')}</span>
                  <span className="font-medium text-stone-900">{expiryLabel}</span>
                </div>
              </div>
            </div>

            {/* ═══ RIGHT COLUMN — HISTORY ═══ */}
            <div className="border-t sm:border-t-0 sm:border-l border-stone-200 bg-stone-50 px-5 sm:px-6 py-5 space-y-4 overflow-y-auto">
              {/* Mobile accordion toggle */}
              <button
                type="button"
                onClick={() => setAccordionOpen(!accordionOpen)}
                className="flex sm:hidden items-center justify-between w-full py-2.5 border-t border-stone-200"
              >
                <span className="text-[11px] uppercase font-semibold text-stone-700">
                  {t('addOffer.accordionHistory')}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-stone-500 transition-transform ${accordionOpen ? 'rotate-180' : ''}`} />
              </button>

              <div className={`${accordionOpen ? 'block' : 'hidden'} sm:block space-y-4`}>
                {/* ── Draft preview card ── */}
                <div>
                  <h3 className="text-[10px] uppercase font-bold text-stone-500 mb-2 tracking-wide">
                    {t('addOffer.draftTitle')}
                  </h3>
                  <div className="rounded-lg border border-dashed border-[#1e3a5f]/40 bg-white p-3 space-y-1.5 relative">
                    <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase bg-[rgba(30,58,95,.08)] text-[#1e3a5f]">
                      {t('addOffer.draftBadge')}
                    </span>
                    <div className="flex justify-between text-[11px] pr-16">
                      <span className="text-stone-500">{t('addOffer.amountLabel')}</span>
                      <span className="font-medium text-stone-900">
                        {priceNum > 0 ? `${formatCAD(priceNum)} $` : '—'}
                      </span>
                    </div>
                    {depositNum > 0 && (
                      <div className="flex justify-between text-[11px]">
                        <span className="text-stone-500">{t('addOffer.depositLabel')}</span>
                        <span className="font-medium text-stone-900">{formatCAD(depositNum)} $</span>
                      </div>
                    )}
                    {closingDate && (
                      <div className="flex justify-between text-[11px]">
                        <span className="text-stone-500">{t('addOffer.closingDateLabel')}</span>
                        <span className="font-medium text-stone-900">{closingDate}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-[11px]">
                      <span className="text-stone-500">{t('addOffer.expirationLabel')}</span>
                      <span className="font-medium text-stone-900">{expiryLabel}</span>
                    </div>
                    {financingEnabled && parseMoney(financingAmount) > 0 && (
                      <div className="flex justify-between text-[11px]">
                        <span className="text-stone-500">{t('addOffer.financingLabel')}</span>
                        <span className="font-medium text-stone-900">{formatCAD(parseMoney(financingAmount))} $</span>
                      </div>
                    )}
                    {inspectionEnabled && inspectionDelay && (
                      <div className="flex justify-between text-[11px]">
                        <span className="text-stone-500">{t('addOffer.inspectionLabel')}</span>
                        <span className="font-medium text-stone-900">{inspectionDelay} {t('addOffer.inspectionPlaceholder').includes('jours') ? 'jours' : 'days'}</span>
                      </div>
                    )}
                    <div className="border-t border-stone-100 pt-1.5 mt-1">
                      <span className="text-[10px] text-stone-400">
                        {offerType === 'offer'
                          ? t('addOffer.draftDirection', { from: buyerName, to: sellerName })
                          : t('addOffer.draftDirection', { from: sellerName, to: buyerName })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* ── Offers history ── */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-[10px] uppercase font-bold text-stone-500 tracking-wide">
                      {t('addOffer.historyTitle')}
                    </h3>
                    {allOffers.length > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-[#1e3a5f] text-white text-[10px] font-bold">
                        {allOffers.length}
                      </span>
                    )}
                  </div>

                  {allOffers.length === 0 ? (
                    <div className="text-center py-6">
                      <MessageCircle className="w-8 h-8 text-stone-300 mx-auto mb-3" strokeWidth={1.5} />
                      <p className="text-xs text-stone-500 font-medium">
                        {t('addOffer.historyEmpty')}
                      </p>
                      <p className="text-[10px] text-stone-400 mt-1">
                        {t('addOffer.historyEmptyHint')}
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2.5">
                      {allOffers.map((offer, idx) => {
                        const lastRev = offer.revisions?.length
                          ? [...offer.revisions].sort((a, b) => b.revisionNumber - a.revisionNumber)[0]
                          : null
                        const lastPrice = lastRev?.price ?? 0
                        const badgeClass = STATUS_COLORS[offer.status] || 'bg-stone-100 text-stone-500'

                        return (
                          <div key={offer.id} className="rounded-lg border border-stone-200 bg-white overflow-hidden">
                            {/* Offer header */}
                            <div className="px-3 py-2.5 flex items-center justify-between gap-2">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-semibold text-stone-900">
                                    {t('addOffer.offerLabel', { number: idx + 1 })}
                                  </span>
                                  <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${badgeClass}`}>
                                    {t(`offers.status.${offer.status}`)}
                                  </span>
                                </div>
                                <span className="text-[10px] text-stone-400">
                                  {offer.createdAt ? formatDate(parseISO(offer.createdAt), 'd MMM yyyy') : ''}
                                </span>
                              </div>
                              <span className="text-sm font-semibold text-stone-900 shrink-0">
                                {lastPrice > 0 ? `${formatCAD(lastPrice)} $` : '—'}
                              </span>
                            </div>
                            {/* Negotiation thread */}
                            <div className="px-3 pb-2.5">
                              <NegotiationThread offer={offer} compact={false} showSingle />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── FOOTER ── */}
          <div className="px-5 sm:px-6 py-4 border-t border-stone-200 bg-stone-50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0 rounded-b-none sm:rounded-b-2xl">
            {/* Email checkbox */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={emailNotify}
                onChange={e => setEmailNotify(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-stone-300 accent-[#1e3a5f]"
              />
              <span className="text-[11px] font-semibold text-stone-600">{t('addOffer.emailNotify')}</span>
            </label>

            {/* Buttons */}
            <div className="flex gap-2 sm:ml-auto">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 sm:flex-none px-4.5 py-2 rounded-lg border border-stone-300 bg-white text-stone-600 hover:bg-stone-50 text-xs font-semibold"
              >
                {t('addOffer.cancel')}
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={createMutation.isPending}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4.5 py-2 rounded-lg bg-[#1e3a5f] hover:bg-[#16304d] text-white text-xs font-semibold disabled:bg-stone-300 disabled:cursor-not-allowed"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="19" x2="12" y2="5" /><polyline points="5 12 12 5 19 12" />
                </svg>
                {createMutation.isPending ? '...' : isCounter ? t('addOffer.submitCounter') : t('addOffer.submit')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
