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
  Package,
  ArrowRight,
  Mail,
  RefreshCw,
  Copy,
  ChevronDown,
  ClipboardList,
} from 'lucide-react'
import { offersApi } from '../../api/offers.api'
import { packsApi, type PackTemplate, type ConditionPack } from '../../api/packs.api'
import type { Offer, OfferRevision, Transaction } from '../../api/transactions.api'
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

const BADGE_COLORS: Record<string, string> = {
  auto: 'bg-[rgba(30,58,95,.1)] text-[#1e3a5f]',
  pack: 'bg-[rgba(224,122,47,.1)] text-[#e07a2f]',
  legal: 'bg-[#ede9fe] text-[#7c3aed]',
  industry: 'bg-[#e0f2fe] text-[#0284c7]',
  finance: 'bg-[#e0f2fe] text-[#0284c7]',
  inspection: 'bg-[#e0f2fe] text-[#0284c7]',
  status: 'bg-[#d1fae5] text-[#059669]',
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

  // ── Pack state ──
  const [selectedPackType, setSelectedPackType] = useState<string | null>(null)
  const [packTemplates, setPackTemplates] = useState<PackTemplate[]>([])
  const [packLoaded, setPackLoaded] = useState(false)
  const [loadingPack, setLoadingPack] = useState(false)

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

  // ── Reset on open ──
  useEffect(() => {
    if (isOpen) {
      setView('form')
      setOfferType(isCounter ? 'counter' : 'offer')
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
      setSelectedPackType(null)
      setPackTemplates([])
      setPackLoaded(false)
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
  const errorCount = Object.keys(errors).length
  const hasErrors = showErrors && errorCount > 0

  // ── Packs query ──
  const { data: packsData } = useQuery({
    queryKey: ['condition-packs'],
    queryFn: () => packsApi.listPacks(),
    enabled: isOpen,
  })
  const packs = packsData?.data?.packs ?? []

  // ── Recommended pack ──
  const recommendedPack = useMemo((): ConditionPack | null => {
    if (packs.length === 0) return null
    const profile = transaction.profile
    if (profile?.isFinanced) return packs.find(p => p.packType === 'finance_nb') || null
    if (profile?.propertyType === 'condo') return packs.find(p => p.packType === 'condo_nb') || null
    if (profile?.propertyContext === 'rural') return packs.find(p => p.packType === 'rural_nb') || null
    return packs.find(p => p.packType === 'universal') || packs[0] || null
  }, [packs, transaction.profile])

  const packLabel = (pack: ConditionPack) =>
    i18n.language === 'en' && pack.labelEn ? pack.labelEn : pack.label

  // ── Load pack templates ──
  const handleLoadPack = async (packType: string) => {
    setLoadingPack(true)
    try {
      const res = await packsApi.getPackTemplates(packType)
      if (res.success && res.data) {
        setPackTemplates(res.data.templates)
        setSelectedPackType(packType)
        setPackLoaded(true)
      }
    } finally {
      setLoadingPack(false)
    }
  }

  // ── Submit mutation ──
  const createMutation = useMutation({
    mutationFn: async () => {
      const direction = offerType === 'counter' ? 'seller_to_buyer' as const : 'buyer_to_seller' as const
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
        result = await offersApi.addRevision(existingOffer!.id, payload)
      } else {
        result = await offersApi.create(transaction.id, payload)
      }

      if (!result.success) {
        throw { type: 'permission', message: result.error?.message || '' }
      }

      // Apply pack if loaded
      const offerId = isCounter
        ? existingOffer!.id
        : (result.data as any)?.offer?.id
      if (packLoaded && selectedPackType && offerId) {
        await packsApi.applyPack(offerId, selectedPackType)
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

  const clientName = transaction.client?.fullName || transaction.client?.email || '—'
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
                  <span className="text-stone-500">{t('addOffer.successConditions')}</span>
                  <span className="font-medium text-stone-900">{packTemplates.length}</span>
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
    `w-full px-3 py-2 text-[13px] rounded-lg border ${
      showErrors && errors[key]
        ? 'border-[#dc2626] bg-[#fef2f2]'
        : 'border-stone-200 focus:border-[#1e3a5f]'
    } focus:outline-none focus:ring-[3px] focus:ring-[rgba(30,58,95,.1)]`

  const selectedPackData = packs.find(p => p.packType === selectedPackType) || null

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
                    {t('addOffer.title')}
                  </h2>
                  {offerType === 'counter' && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[rgba(224,122,47,.15)] text-[#e07a2f]">
                      {t('addOffer.typeCounter')}
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
                <PartyPicker
                  transactionId={transaction.id}
                  role="buyer"
                  selectedPartyId={buyerPartyId}
                  onSelect={setBuyerPartyId}
                />
                <PartyPicker
                  transactionId={transaction.id}
                  role="seller"
                  selectedPartyId={sellerPartyId}
                  onSelect={setSellerPartyId}
                />
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
                <div className="flex justify-between text-[11px] py-1">
                  <span className="text-stone-500">{t('addOffer.summaryConditions')}</span>
                  <span className="font-medium text-stone-900">{packTemplates.length}</span>
                </div>
              </div>
            </div>

            {/* ═══ RIGHT COLUMN — PACKS ═══ */}
            <div className="border-t sm:border-t-0 sm:border-l border-stone-200 bg-stone-50 px-5 sm:px-6 py-5 space-y-4 overflow-y-auto">
              {/* Mobile accordion toggle */}
              <button
                type="button"
                onClick={() => setAccordionOpen(!accordionOpen)}
                className="flex sm:hidden items-center justify-between w-full py-2.5 border-t border-stone-200"
              >
                <span className="text-[11px] uppercase font-semibold text-stone-700">
                  {t('addOffer.accordionConditions')}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-stone-500 transition-transform ${accordionOpen ? 'rotate-180' : ''}`} />
              </button>

              <div className={`${accordionOpen ? 'block' : 'hidden'} sm:block space-y-4`}>
                {/* Pack recommandé card */}
                {recommendedPack && !packLoaded && (
                  <div className="flex items-center gap-2.5 p-3 rounded-lg border border-stone-200 bg-white">
                    <div className="w-9 h-9 rounded-lg bg-[rgba(30,58,95,.08)] flex items-center justify-center shrink-0">
                      <Package className="w-[18px] h-[18px] text-[#1e3a5f]" strokeWidth={2} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-stone-900">{packLabel(recommendedPack)}</p>
                      <span className="text-[10px] text-stone-400">
                        {t('addOffer.conditionsInfo', { count: recommendedPack.templateCount, tags: recommendedPack.description || '' })}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleLoadPack(recommendedPack.packType)}
                      disabled={loadingPack}
                      className="px-3.5 py-1.5 rounded-md bg-[#1e3a5f] hover:bg-[#16304d] text-white text-[11px] font-semibold shrink-0 disabled:opacity-50"
                    >
                      {loadingPack ? '...' : t('addOffer.loadPack')}
                    </button>
                  </div>
                )}

                {/* Pack loaded card */}
                {packLoaded && selectedPackData && (
                  <div className="flex items-center gap-2.5 p-3 rounded-lg border border-[#059669] bg-[#f0fdf4]">
                    <div className="w-9 h-9 rounded-lg bg-[rgba(5,150,105,.1)] flex items-center justify-center shrink-0">
                      <Check className="w-[18px] h-[18px] text-[#059669]" strokeWidth={2} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[#059669]">
                        {t('addOffer.packLoadedLabel', { name: packLabel(selectedPackData) })}
                      </p>
                      <span className="text-[10px] text-[#059669]/70">
                        {t('addOffer.packConditionsApplied', { count: packTemplates.length })}
                      </span>
                    </div>
                  </div>
                )}

                {/* Packs chips */}
                <div>
                  <h3 className="text-[10px] uppercase font-bold text-stone-500 mb-2 tracking-wide">
                    {t('addOffer.packsTitle')}
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {packs.map(pack => (
                      <button
                        key={pack.packType}
                        type="button"
                        onClick={() => handleLoadPack(pack.packType)}
                        disabled={loadingPack}
                        className={`px-3 py-[5px] rounded-2xl text-[11px] font-medium border transition-colors ${
                          selectedPackType === pack.packType
                            ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]'
                            : 'bg-white text-stone-600 border-stone-200 hover:border-[#1e3a5f] hover:text-[#1e3a5f]'
                        }`}
                      >
                        {packLabel(pack)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Conditions list */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-[10px] uppercase font-bold text-stone-500 tracking-wide">
                      {t('addOffer.conditionsTitle')}
                    </h3>
                    {packTemplates.length > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-[#1e3a5f] text-white text-[10px] font-bold">
                        {packTemplates.length}
                      </span>
                    )}
                  </div>

                  {packTemplates.length === 0 ? (
                    /* Empty state */
                    <div className="text-center py-6">
                      <ClipboardList className="w-8 h-8 text-stone-300 mx-auto mb-3" strokeWidth={1.5} />
                      <p className="text-xs text-stone-400">
                        {t('addOffer.conditionsEmpty')}
                      </p>
                    </div>
                  ) : (
                    /* Conditions list */
                    <div className="flex flex-col gap-1.5">
                      {packTemplates.map(tpl => (
                        <div
                          key={tpl.id}
                          className="flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg border border-stone-200 bg-white"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-stone-900 truncate">
                              {i18n.language === 'en' && tpl.titleEn ? tpl.titleEn : tpl.title}
                            </p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              <span className="px-[7px] py-px rounded-full text-[9px] font-bold uppercase bg-[rgba(224,122,47,.1)] text-[#e07a2f]">
                                {t('addOffer.badgePack')}
                              </span>
                              {tpl.conditionType && (
                                <span className={`px-[7px] py-px rounded-full text-[9px] font-bold uppercase ${
                                  BADGE_COLORS[tpl.conditionType] || 'bg-stone-100 text-stone-500'
                                }`}>
                                  {tpl.conditionType}
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="px-[7px] py-px rounded-full text-[9px] font-bold uppercase bg-[#d1fae5] text-[#059669] shrink-0">
                            {t('addOffer.badgeActive')}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Manage link */}
                  <button
                    type="button"
                    onClick={() => navigate(`/transactions/${transaction.id}`)}
                    className="flex items-center gap-1.5 text-[11px] text-[#1e3a5f] hover:underline font-medium mt-3"
                  >
                    {t('addOffer.conditionsManageLink')}
                    <ArrowRight className="w-3 h-3" />
                  </button>
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
                {createMutation.isPending ? '...' : t('addOffer.submit')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
