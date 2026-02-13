import { useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Share2,
  FileDown,
  Link2,
  Mail,
  Download,
  Check,
  Copy,
  X,
  Loader2,
  Eye,
  MessageCircle,
  Lock,
  RefreshCw,
  ExternalLink,
  AlertTriangle,
  ChevronRight,
  Send,
  Info,
} from 'lucide-react'
import { transactionsApi } from '../api/transactions.api'
import { exportApi, type ExportPdfOptions } from '../api/export.api'
import { shareLinksApi } from '../api/share-links.api'
import { toast } from '../hooks/use-toast'
import { useSubscription } from '../hooks/useSubscription'
import UpgradePrompt from '../components/ui/UpgradePrompt'

// ─── Types ───────────────────────────────────────────────────
type ModalState =
  | { type: 'none' }
  | { type: 'pdf-generating'; progress: number; label: string }
  | { type: 'pdf-ready'; filename: string; blob: Blob; pages: number; language: string; watermark: boolean }
  | { type: 'link-created'; token: string; role: string; expiresAt: string | null; hasPassword: boolean }
  | { type: 'email-sent'; recipients: string[]; subject: string }
  | { type: 'error'; errorType: 'pdf' | 'email' | 'permission'; title: string; message: string }

// ─── Component ───────────────────────────────────────────────
export default function ExportSharePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  const transactionId = Number(id)
  const { planSlug, usage, meetsMinimum } = useSubscription()
  const isStarter = planSlug === 'starter'
  const pdfUsed = usage?.pdfExportsThisMonth ?? 0
  const pdfLimit = usage?.pdfExportsLimit ?? null
  const pdfLimitReached = pdfLimit !== null && pdfUsed >= pdfLimit

  // Fetch transaction
  const { data: txData, isLoading } = useQuery({
    queryKey: ['transaction', transactionId],
    queryFn: () => transactionsApi.show(transactionId),
    enabled: !!transactionId,
  })
  const transaction = txData?.data?.transaction

  // Fetch existing share link
  const { data: linkData } = useQuery({
    queryKey: ['share-link', transactionId],
    queryFn: () => shareLinksApi.get(transactionId),
    enabled: !!transactionId,
  })
  const existingLink = linkData?.data?.shareLink ?? null

  // ─── PDF State ─────────────────────────────────────────
  const [pdfSections, setPdfSections] = useState({
    offers: true,
    conditions: true,
    documents: false,
    history: false,
  })
  const [pdfWatermark, setPdfWatermark] = useState(true)
  const [pdfLanguage, setPdfLanguage] = useState<'fr' | 'en'>(i18n.language as 'fr' | 'en')

  // ─── Link State ────────────────────────────────────────
  const [linkActive, setLinkActive] = useState(false)
  const [linkRole, setLinkRole] = useState<'viewer' | 'editor'>('viewer')
  const [linkExpiry, setLinkExpiry] = useState<'24h' | '7d' | '30d' | 'custom'>('7d')
  const [linkPassword, setLinkPassword] = useState('')

  // ─── Email State ───────────────────────────────────────
  const [emailChips, setEmailChips] = useState<string[]>([])
  const [emailInput, setEmailInput] = useState('')
  const [emailSubject, setEmailSubject] = useState('')
  const [emailMessage, setEmailMessage] = useState('')

  // ─── Modal State ───────────────────────────────────────
  const [modal, setModal] = useState<ModalState>({ type: 'none' })
  const [copied, setCopied] = useState(false)

  // Set default subject when transaction loads
  useState(() => {
    if (transaction) {
      const addr = transaction.property?.address || ''
      const city = transaction.property?.city || ''
      setEmailSubject(`Récap transaction — ${addr}${city ? ', ' + city : ''}`)
    }
  })

  // ─── PDF Export ────────────────────────────────────────
  const handleGeneratePdf = useCallback(async () => {
    setModal({ type: 'pdf-generating', progress: 15, label: t('exportPage.generating.loading', 'Chargement des données...') })

    const progressSteps = [
      { p: 35, label: t('exportPage.generating.conditions', 'Génération des conditions...') },
      { p: 65, label: t('exportPage.generating.documents', 'Compilation des documents...') },
      { p: 85, label: t('exportPage.generating.finalizing', 'Finalisation du PDF...') },
    ]

    let stepIndex = 0
    const interval = setInterval(() => {
      if (stepIndex < progressSteps.length) {
        setModal((prev) =>
          prev.type === 'pdf-generating'
            ? { ...prev, progress: progressSteps[stepIndex].p, label: progressSteps[stepIndex].label }
            : prev
        )
        stepIndex++
      }
    }, 800)

    try {
      const options: ExportPdfOptions = {
        includeOffers: pdfSections.offers,
        includeConditions: pdfSections.conditions,
        includeDocuments: pdfSections.documents,
        includeActivity: pdfSections.history,
        watermark: pdfWatermark,
        language: pdfLanguage,
      }
      const result = await exportApi.exportPdf(transactionId, options)

      clearInterval(interval)

      if (result.success && result.data) {
        const clientName = transaction?.client
          ? `${transaction.client.firstName}_${transaction.client.lastName}`
          : 'Transaction'
        const dateStr = new Date().toISOString().slice(0, 7)
        const filename = `Transaction_${clientName}_${dateStr}.pdf`

        setModal({
          type: 'pdf-ready',
          filename,
          blob: result.data.blob,
          pages: Math.ceil(result.data.blob.size / 3000), // rough estimate
          language: pdfLanguage === 'fr' ? 'Français' : 'English',
          watermark: pdfWatermark,
        })
      } else {
        setModal({
          type: 'error',
          errorType: 'pdf',
          title: t('exportPage.errors.pdfTitle', 'Échec de génération PDF'),
          message: t('exportPage.errors.pdfMessage', 'Une erreur est survenue lors de la génération du PDF.'),
        })
      }
    } catch {
      clearInterval(interval)
      setModal({
        type: 'error',
        errorType: 'pdf',
        title: t('exportPage.errors.pdfTitle', 'Échec de génération PDF'),
        message: t('exportPage.errors.pdfMessage', 'Une erreur est survenue lors de la génération du PDF.'),
      })
    }
  }, [transactionId, pdfSections, pdfWatermark, pdfLanguage, transaction, t])

  const handleDownloadPdf = useCallback(() => {
    if (modal.type !== 'pdf-ready') return
    const url = window.URL.createObjectURL(modal.blob)
    const a = document.createElement('a')
    a.href = url
    a.download = modal.filename
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
    setModal({ type: 'none' })
    toast({ title: t('export.pdfReady'), variant: 'success' })
  }, [modal, t])

  const handleOpenPdfNewTab = useCallback(() => {
    if (modal.type !== 'pdf-ready') return
    const url = window.URL.createObjectURL(modal.blob)
    window.open(url, '_blank')
  }, [modal])

  // ─── Share Link ────────────────────────────────────────
  const createLinkMutation = useMutation({
    mutationFn: () => {
      const expiryMap: Record<string, number> = { '24h': 1, '7d': 7, '30d': 30 }
      const days = expiryMap[linkExpiry] || 7
      const expiresAt = new Date(Date.now() + days * 86400000).toISOString()
      return shareLinksApi.create(transactionId, {
        expiresAt,
        password: linkPassword || null,
      })
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['share-link', transactionId] })
      const link = res?.data?.shareLink
      if (link) {
        const expiryLabels: Record<string, string> = { '24h': '24h', '7d': t('exportPage.link.7days', '7 jours'), '30d': t('exportPage.link.30days', '30 jours') }
        const expiryMap: Record<string, number> = { '24h': 1, '7d': 7, '30d': 30 }
        const days = expiryMap[linkExpiry] || 7
        const expiryDate = new Date(Date.now() + days * 86400000)
        const formattedDate = expiryDate.toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' })
        setModal({
          type: 'link-created',
          token: link.token,
          role: linkRole === 'viewer' ? t('exportPage.link.readOnly', 'Lecture seule') : t('exportPage.link.comment', 'Commentaire'),
          expiresAt: `${expiryLabels[linkExpiry] || linkExpiry} (${formattedDate})`,
          hasPassword: link.hasPassword,
        })
      }
    },
    onError: () => {
      toast({ title: t('common.error'), variant: 'destructive' })
    },
  })

  const handleCopyLink = useCallback(
    (token: string) => {
      const url = `${window.location.origin}/shared/${token}`
      navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    },
    []
  )

  const handleRevokeLink = useMutation({
    mutationFn: () => {
      if (!existingLink) return Promise.resolve({})
      return shareLinksApi.disable(transactionId, existingLink.id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['share-link', transactionId] })
      setModal({ type: 'none' })
      toast({ title: t('exportPage.link.revoked', 'Lien révoqué'), variant: 'success' })
    },
  })

  // ─── Email ─────────────────────────────────────────────
  const handleAddChip = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && emailInput.trim()) {
        e.preventDefault()
        if (emailInput.includes('@') && !emailChips.includes(emailInput.trim())) {
          setEmailChips([...emailChips, emailInput.trim()])
        }
        setEmailInput('')
      }
    },
    [emailInput, emailChips]
  )

  const handleRemoveChip = useCallback(
    (email: string) => setEmailChips(emailChips.filter((c) => c !== email)),
    [emailChips]
  )

  const emailMutation = useMutation({
    mutationFn: () =>
      exportApi.sendEmail(transactionId, {
        recipients: emailChips,
        subject: emailSubject || undefined,
        message: emailMessage || undefined,
      }),
    onSuccess: () => {
      setModal({
        type: 'email-sent',
        recipients: emailChips,
        subject: emailSubject,
      })
      setEmailChips([])
    },
    onError: () => {
      toast({ title: t('common.error'), variant: 'destructive' })
    },
  })

  // ─── Helpers ───────────────────────────────────────────
  const clientName = transaction?.client
    ? `${transaction.client.firstName} ${transaction.client.lastName}`
    : ''
  const propertyAddress = transaction?.property?.address || ''
  const propertyCity = transaction?.property?.city || ''
  const conditionsCount = transaction?.conditions?.filter((c: { status: string }) => c.status !== 'resolved')?.length ?? 0
  const documentsCount = transaction?.documents?.length ?? 0

  // ─── Loading ───────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="bg-stone-50 min-h-[80vh]">
        <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
          <div className="h-8 w-64 bg-stone-200 rounded animate-pulse" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-stone-200 h-96 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ─── Render ────────────────────────────────────────────
  return (
    <div className="bg-stone-50 min-h-[80vh]">
      {/* Header */}
      <div className="bg-white border-b border-stone-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1 text-xs text-stone-400 mb-2">
            <button onClick={() => navigate('/transactions')} className="hover:text-stone-600">
              {t('nav.transactions', 'Transactions')}
            </button>
            <ChevronRight className="w-3 h-3" />
            <button
              onClick={() => navigate(`/transactions/${transactionId}`)}
              className="hover:text-stone-600 truncate max-w-[150px]"
            >
              {clientName}
            </button>
            <ChevronRight className="w-3 h-3" />
            <span className="text-stone-600 font-medium flex-shrink-0">
              {t('export.title', 'Exporter & Partager')}
            </span>
          </div>

          {/* Title row */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[#1e3a5f]/10 rounded-lg flex items-center justify-center">
                <Share2 className="w-4.5 h-4.5 text-[#1e3a5f]" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-bold text-stone-900">
                  {t('export.title', 'Exporter & Partager')}
                </h1>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-stone-500">
                  <span>{clientName}</span>
                  {propertyAddress && (
                    <>
                      <span className="hidden sm:inline text-stone-300">·</span>
                      <span className="hidden sm:inline">
                        {propertyAddress}{propertyCity ? `, ${propertyCity}` : ''}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={() => navigate(`/transactions/${transactionId}`)}
              className="px-3 py-2 text-xs font-medium text-stone-600 bg-white border border-stone-300 rounded-lg hover:bg-stone-50"
            >
              {t('common.back', 'Retour')}
            </button>
          </div>
        </div>
      </div>

      {/* 3-Card Grid */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* ═══ Card 1: Export PDF ═══ */}
          <div className="bg-white rounded-xl border border-stone-200 shadow-sm flex flex-col">
            {/* Header */}
            <div className="border-b border-stone-100 px-5 pt-5 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
                  <FileDown className="w-4 h-4 text-red-500" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-stone-900">
                    {t('export.pdfTitle', 'Exporter PDF')}
                  </h3>
                  <p className="text-[10px] text-stone-400">
                    {t('exportPage.pdf.subtitle', 'Récap complet de la transaction')}
                  </p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="px-5 py-4 flex-1 space-y-3">
              {/* Sections */}
              <div>
                <label className="text-[10px] font-semibold text-stone-500 uppercase">
                  {t('exportPage.pdf.include', 'Inclure')}
                </label>
                <div className="mt-1.5 space-y-2">
                  {[
                    { key: 'offers' as const, label: t('exportPage.pdf.offerAccepted', 'Détails de l\'offre acceptée') },
                    { key: 'conditions' as const, label: `${t('export.section.conditions', 'Conditions')} (${conditionsCount} ${t('exportPage.pdf.active', 'actives')})` },
                    { key: 'documents' as const, label: `${t('export.section.documents', 'Documents')} (${documentsCount} ${t('exportPage.pdf.files', 'fichiers')})` },
                    { key: 'history' as const, label: t('export.section.history', 'Historique d\'activité') },
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={pdfSections[key]}
                        onChange={(e) => setPdfSections({ ...pdfSections, [key]: e.target.checked })}
                        className="h-3.5 w-3.5 rounded border-stone-300 accent-[#1e3a5f]"
                      />
                      <span className="text-xs text-stone-700">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Watermark toggle */}
              <div className="py-2 border-t border-stone-100 flex items-center justify-between">
                <span className="text-xs text-stone-700">
                  {t('exportPage.pdf.watermark', 'Filigrane « Confidentiel »')}
                </span>
                <button
                  onClick={() => setPdfWatermark(!pdfWatermark)}
                  className={`relative w-9 h-5 rounded-full transition-colors ${pdfWatermark ? 'bg-[#1e3a5f]' : 'bg-stone-300'}`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${pdfWatermark ? 'translate-x-4' : ''}`}
                  />
                </button>
              </div>

              {/* Language */}
              <div>
                <label className="text-[10px] font-semibold text-stone-500 uppercase">
                  {t('exportPage.pdf.language', 'Langue')}
                </label>
                <select
                  value={pdfLanguage}
                  onChange={(e) => setPdfLanguage(e.target.value as 'fr' | 'en')}
                  className="mt-1 w-full px-3 py-1.5 text-xs border border-stone-300 rounded-lg bg-white"
                >
                  <option value="fr">Français</option>
                  <option value="en">English</option>
                </select>
              </div>

              {/* Preview box */}
              <div className="hidden lg:block rounded-lg border border-stone-200 bg-stone-50 p-3 text-center">
                <div className="inline-flex flex-col items-center">
                  <div className="w-16 h-20 bg-white border border-stone-200 rounded flex items-center justify-center">
                    <FileDown className="w-5 h-5 text-stone-300" />
                  </div>
                  <span className="text-[10px] text-stone-400 mt-1.5">
                    {t('exportPage.pdf.preview', 'Aperçu')} ~{2 + (pdfSections.offers ? 1 : 0) + (pdfSections.conditions ? 2 : 0) + (pdfSections.documents ? 1 : 0) + (pdfSections.history ? 2 : 0)} pages
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 pb-5 space-y-2">
              {pdfLimit !== null && (
                <p className="text-[10px] text-stone-500 text-center">
                  {t('export.usageCounter', '{{used}}/{{limit}} exports ce mois', { used: pdfUsed, limit: pdfLimit })}
                </p>
              )}
              {pdfLimitReached ? (
                <UpgradePrompt feature="pdf_exports" targetPlan="solo" />
              ) : (
                <button
                  onClick={handleGeneratePdf}
                  className="w-full px-4 py-2.5 text-xs font-medium text-white bg-[#1e3a5f] hover:bg-[#1e3a5f]/90 rounded-lg shadow-sm flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  {t('export.generatePdf', 'Générer PDF')}
                </button>
              )}
            </div>
          </div>

          {/* ═══ Card 2: Lien partageable ═══ */}
          <div className="bg-white rounded-xl border border-stone-200 shadow-sm flex flex-col">
            {/* Header */}
            <div className="border-b border-stone-100 px-5 pt-5 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Link2 className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-stone-900">
                    {t('shareLink.title', 'Lien partageable')}
                  </h3>
                  <p className="text-[10px] text-stone-400">
                    {t('exportPage.link.subtitle', 'Accès web sans compte requis')}
                  </p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="px-5 py-4 flex-1 space-y-3">
              {/* Toggle */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-stone-700">
                  {t('exportPage.link.activeLabel', 'Lien actif')}
                </span>
                <button
                  onClick={() => setLinkActive(!linkActive)}
                  className={`relative w-9 h-5 rounded-full transition-colors ${linkActive ? 'bg-[#1e3a5f]' : 'bg-stone-300'}`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${linkActive ? 'translate-x-4' : ''}`}
                  />
                </button>
              </div>

              {/* Options (disabled when toggle off) */}
              <div className={`space-y-3 transition-opacity ${linkActive ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                {/* Role radio cards */}
                <p className="text-[10px] font-semibold text-stone-500 uppercase tracking-wide mb-2">
                  {t('exportPage.link.roleLabel', 'Rôle du lien')}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setLinkRole('viewer')}
                    className={`w-full py-2 px-3 rounded-xl border-2 text-left ${
                      linkRole === 'viewer'
                        ? 'border-[#1e3a5f] bg-[#1e3a5f]/[0.03]'
                        : 'border-stone-200 hover:border-stone-400'
                    }`}
                  >
                    <Eye className={`w-4 h-4 mb-1 ${linkRole === 'viewer' ? 'text-[#1e3a5f]' : 'text-stone-400'}`} />
                    <span className="text-xs font-medium text-stone-700">
                      {t('exportPage.link.readOnly', 'Lecture seule')}
                    </span>
                  </button>
                  <button
                    onClick={() => setLinkRole('editor')}
                    className={`w-full py-2 px-3 rounded-xl border-2 text-left ${
                      linkRole === 'editor'
                        ? 'border-[#1e3a5f] bg-[#1e3a5f]/[0.03]'
                        : 'border-stone-200 hover:border-stone-400'
                    }`}
                  >
                    <MessageCircle className={`w-4 h-4 mb-1 ${linkRole === 'editor' ? 'text-[#1e3a5f]' : 'text-stone-400'}`} />
                    <span className="text-xs font-medium text-stone-700">
                      {t('exportPage.link.comment', 'Commentaire')}
                    </span>
                  </button>
                </div>

                {/* Expiration */}
                <div className="grid grid-cols-4 gap-1.5">
                  {(['24h', '7d', '30d', 'custom'] as const).map((val) => (
                    <button
                      key={val}
                      onClick={() => setLinkExpiry(val)}
                      className={`px-2 py-1.5 text-[10px] font-medium rounded-lg border ${
                        linkExpiry === val
                          ? 'border-2 border-[#1e3a5f] text-[#1e3a5f] bg-[#1e3a5f]/5'
                          : 'border-stone-200 text-stone-600 hover:border-stone-400'
                      }`}
                    >
                      {val === '24h' ? '24h' : val === '7d' ? t('exportPage.link.7days', '7 jours') : val === '30d' ? t('exportPage.link.30days', '30 jours') : 'Custom'}
                    </button>
                  ))}
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center gap-1">
                    <label className="text-[10px] font-semibold text-stone-500 uppercase">
                      {t('shareLink.password', 'Mot de passe')}
                    </label>
                    <span className="text-[10px] text-stone-400">{t('common.optional', 'optionnel')}</span>
                  </div>
                  <input
                    type="password"
                    value={linkPassword}
                    onChange={(e) => setLinkPassword(e.target.value)}
                    placeholder="••••••••"
                    className="mt-1 w-full px-3 py-1.5 text-xs border border-stone-300 rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 pb-5 space-y-2">
              {isStarter && existingLink ? (
                <UpgradePrompt feature="share_links" targetPlan="solo" />
              ) : (
                <button
                  onClick={() => createLinkMutation.mutate()}
                  disabled={!linkActive || createLinkMutation.isPending}
                  className={`w-full px-4 py-2.5 text-xs font-medium text-white rounded-lg shadow-sm flex items-center justify-center gap-1.5 ${
                    linkActive
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-stone-300 cursor-not-allowed'
                  }`}
                >
                  {createLinkMutation.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Link2 className="w-3.5 h-3.5" />
                  )}
                  {t('shareLink.create', 'Créer le lien')}
                </button>
              )}
            </div>
          </div>

          {/* ═══ Card 3: Email récap ═══ */}
          <div className="bg-white rounded-xl border border-stone-200 shadow-sm flex flex-col">
            {/* Header */}
            <div className="border-b border-stone-100 px-5 pt-5 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                  <Mail className="w-4 h-4 text-emerald-500" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-stone-900">
                    {t('export.emailTitle', 'Email récap')}
                  </h3>
                  <p className="text-[10px] text-stone-400">
                    {t('exportPage.email.subtitle', 'Envoyer un résumé par courriel')}
                  </p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="px-5 py-4 flex-1 space-y-3">
              {/* Recipients chips */}
              <div>
                <label className="text-[10px] font-semibold text-stone-500 uppercase">
                  {t('exportPage.email.recipients', 'Destinataires')}
                </label>
                <div className="mt-1 border border-stone-300 rounded-lg p-2 min-h-[60px]">
                  <div className="flex flex-wrap gap-1.5">
                    {emailChips.map((email) => (
                      <span
                        key={email}
                        className="inline-flex items-center gap-1 rounded-full text-xs font-medium bg-[#1e3a5f]/10 text-[#1e3a5f]"
                        style={{ padding: '3px 10px' }}
                      >
                        {email}
                        <button onClick={() => handleRemoveChip(email)} className="hover:text-red-600">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                    <input
                      type="email"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      onKeyDown={handleAddChip}
                      placeholder={t('exportPage.email.addPlaceholder', 'Ajouter un courriel...')}
                      className="flex-1 min-w-[120px] text-xs outline-none bg-transparent"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-stone-400 mt-1">
                  {emailChips.length} {t('exportPage.email.recipientCount', 'destinataire(s)')} · {t('exportPage.email.enterHint', 'Appuyez Entrée pour ajouter')}
                </p>
              </div>

              {/* Subject */}
              <div>
                <label className="text-[10px] font-semibold text-stone-500 uppercase">
                  {t('exportPage.email.subject', 'Objet')}
                </label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="mt-1 w-full px-3 py-1.5 text-xs border border-stone-300 rounded-lg"
                />
              </div>

              {/* Message */}
              <div>
                <label className="text-[10px] font-semibold text-stone-500 uppercase">
                  {t('exportPage.email.message', 'Message')}
                </label>
                <textarea
                  rows={3}
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                  placeholder={t('exportPage.email.messagePlaceholder', 'Message personnalisé (optionnel)...')}
                  className="mt-1 w-full px-3 py-1.5 text-xs border border-stone-300 rounded-lg resize-none"
                />
              </div>

              {/* Preview link */}
              <button className="flex items-center gap-1.5 text-xs text-[#1e3a5f] font-medium hover:underline">
                <Eye className="w-3.5 h-3.5" />
                {t('exportPage.email.preview', 'Prévisualiser l\'email')}
              </button>
            </div>

            {/* Footer */}
            <div className="px-5 pb-5">
              <button
                onClick={() => emailMutation.mutate()}
                disabled={emailChips.length === 0 || emailMutation.isPending}
                className={`w-full px-4 py-2.5 text-xs font-medium text-white rounded-lg shadow-sm flex items-center justify-center gap-1.5 ${
                  emailChips.length > 0
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-stone-300 cursor-not-allowed'
                }`}
              >
                {emailMutation.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                {t('exportPage.email.send', 'Envoyer le récap')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Modals Overlay ═══ */}
      {modal.type !== 'none' && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4">
          {/* ─── État B: PDF Generating ─── */}
          {modal.type === 'pdf-generating' && (
            <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center animate-in fade-in zoom-in-95 max-h-[92vh] sm:max-h-none overflow-y-auto">
              <div className="flex justify-center mb-3 sm:hidden"><div className="w-8 h-1 rounded-full bg-stone-300" /></div>
              <div className="w-14 h-14 rounded-full bg-[#1e3a5f]/10 flex items-center justify-center mx-auto mb-4 animate-pulse">
                <FileDown className="w-7 h-7 text-[#1e3a5f]" />
              </div>
              <h3 className="text-sm font-bold text-stone-900 mb-1">
                {t('exportPage.generating.title', 'Génération du PDF en cours')}
              </h3>
              <p className="text-xs text-stone-500 mb-4">
                {t('exportPage.generating.subtitle', 'Compilation des données de la transaction...')}
              </p>
              <div className="w-full bg-stone-200 rounded-full h-2 mb-2">
                <div
                  className="bg-[#1e3a5f] h-2 rounded-full transition-all duration-600"
                  style={{ width: `${modal.progress}%` }}
                />
              </div>
              <p className="text-[10px] text-stone-400 mb-4">
                {modal.progress}% — {modal.label}
              </p>
              <button
                onClick={() => setModal({ type: 'none' })}
                className="px-4 py-2 text-xs font-medium text-stone-500 bg-white border border-stone-300 rounded-lg hover:bg-stone-50"
              >
                {t('common.cancel', 'Annuler')}
              </button>
            </div>
          )}

          {/* ─── État C: PDF Ready ─── */}
          {modal.type === 'pdf-ready' && (
            <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center animate-in fade-in zoom-in-95 max-h-[92vh] sm:max-h-none overflow-y-auto">
              <div className="flex justify-center mb-3 sm:hidden"><div className="w-8 h-1 rounded-full bg-stone-300" /></div>
              <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <Check className="w-7 h-7 text-emerald-600" />
              </div>
              <h3 className="text-sm font-bold text-stone-900 mb-1">
                {t('exportPage.pdfReady.title', 'PDF généré avec succès')}
              </h3>
              <p className="text-xs text-stone-500 mb-4">
                {modal.filename} — {modal.pages} pages, {Math.round(modal.blob.size / 1024)} Ko
              </p>

              {/* File preview card */}
              <div className="rounded-lg border border-stone-200 bg-stone-50 p-3 flex items-center gap-3 mb-4">
                <div className="w-10 h-12 bg-red-50 border border-red-200 rounded flex items-center justify-center">
                  <FileDown className="w-5 h-5 text-red-400" />
                </div>
                <div className="text-left flex-1 min-w-0">
                  <p className="text-xs font-medium text-stone-700 truncate">{modal.filename}</p>
                  <p className="text-[10px] text-stone-400">
                    {modal.pages} pages · {modal.language} · {modal.watermark ? t('exportPage.pdfReady.watermarkActive', 'Filigrane actif') : t('exportPage.pdfReady.noWatermark', 'Sans filigrane')}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  onClick={handleDownloadPdf}
                  className="w-full px-4 py-2.5 text-xs font-medium text-white bg-[#1e3a5f] hover:bg-[#1e3a5f]/90 rounded-lg shadow-sm flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  {t('exportPage.pdfReady.download', 'Télécharger')}
                </button>
                <button
                  onClick={handleOpenPdfNewTab}
                  className="w-full px-4 py-2 text-xs font-medium text-[#1e3a5f] bg-white border border-stone-300 rounded-lg hover:bg-stone-50 flex items-center justify-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  {t('exportPage.pdfReady.openTab', 'Ouvrir dans un nouvel onglet')}
                </button>
              </div>
            </div>
          )}

          {/* ─── État D: Link Created ─── */}
          {modal.type === 'link-created' && (
            <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 max-h-[92vh] sm:max-h-none overflow-y-auto">
              <div className="flex justify-center mb-3 sm:hidden"><div className="w-8 h-1 rounded-full bg-stone-300" /></div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Link2 className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-stone-900">
                    {t('exportPage.linkCreated.title', 'Lien partageable créé')}
                  </h3>
                  <p className="text-xs text-stone-500">
                    {t('exportPage.linkCreated.expiresIn', 'Expire le')} {modal.expiresAt}
                  </p>
                </div>
              </div>

              {/* URL field */}
              <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-lg p-2 mb-3">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}/shared/${modal.token}`}
                  className="flex-1 text-xs text-stone-600 bg-transparent outline-none truncate"
                />
                <button
                  onClick={() => handleCopyLink(modal.token)}
                  className={`px-3 py-1.5 text-[10px] font-medium rounded-md flex items-center gap-1 ${
                    copied
                      ? 'text-emerald-600 bg-emerald-50'
                      : 'text-white bg-[#1e3a5f] hover:bg-[#1e3a5f]/90'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3" />
                      {t('exportPage.linkCreated.copied', 'Copié !')}
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      {t('exportPage.linkCreated.copy', 'Copier')}
                    </>
                  )}
                </button>
              </div>

              {/* Link info */}
              <div className="rounded-lg border border-stone-200 divide-y divide-stone-100 mb-4">
                {[
                  { label: t('exportPage.linkCreated.role', 'Rôle'), value: modal.role },
                  { label: t('exportPage.linkCreated.expiration', 'Expiration'), value: modal.expiresAt || '—' },
                  { label: t('shareLink.password', 'Mot de passe'), value: modal.hasPassword ? t('exportPage.linkCreated.set', 'Défini') : t('exportPage.linkCreated.none', 'Aucun') },
                  { label: t('exportPage.linkCreated.visits', 'Visites'), value: '0' },
                ].map(({ label, value }) => (
                  <div key={label} className="px-3 py-2 flex justify-between">
                    <span className="text-xs text-stone-500">{label}</span>
                    <span className="text-xs font-medium text-stone-700">{value}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setModal({ type: 'none' })}
                  className="flex-1 px-3 py-2 text-xs font-medium text-stone-600 bg-white border border-stone-300 rounded-lg hover:bg-stone-50"
                >
                  {t('common.close', 'Fermer')}
                </button>
                <button
                  onClick={() => handleRevokeLink.mutate()}
                  className="px-3 py-2 text-xs font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50"
                >
                  {t('exportPage.linkCreated.revoke', 'Révoquer le lien')}
                </button>
              </div>
            </div>
          )}

          {/* ─── État E: Email Sent ─── */}
          {modal.type === 'email-sent' && (
            <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center animate-in fade-in zoom-in-95 max-h-[92vh] sm:max-h-none overflow-y-auto">
              <div className="flex justify-center mb-3 sm:hidden"><div className="w-8 h-1 rounded-full bg-stone-300" /></div>
              <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <Mail className="w-7 h-7 text-emerald-600" />
              </div>
              <h3 className="text-sm font-bold text-stone-900 mb-1">
                {t('exportPage.emailSent.title', 'Récap envoyé avec succès')}
              </h3>
              <p className="text-xs text-stone-500 mb-4">
                {t('exportPage.emailSent.subtitle', 'Le résumé de la transaction a été envoyé')}
              </p>

              {/* Recipients */}
              <div className="rounded-lg bg-stone-50 border border-stone-200 p-3 mb-3 text-left">
                <p className="text-[10px] font-semibold text-stone-500 uppercase mb-1.5">
                  {t('exportPage.email.recipients', 'Destinataires')} ({modal.recipients.length})
                </p>
                <div className="space-y-1.5">
                  {modal.recipients.map((email) => (
                    <div key={email} className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-xs text-stone-600">{email}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Subject info */}
              {modal.subject && (
                <div className="rounded-lg bg-blue-50 border border-blue-200 p-2.5 mb-4 flex items-start gap-2 text-left">
                  <Info className="w-3.5 h-3.5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-[10px] text-blue-600">{t('exportPage.email.subject', 'Objet')} :</p>
                    <p className="text-xs text-blue-800 font-medium">{modal.subject}</p>
                  </div>
                </div>
              )}

              <button
                onClick={() => setModal({ type: 'none' })}
                className="w-full px-4 py-2.5 text-xs font-medium text-[#1e3a5f] bg-white border border-stone-300 rounded-lg hover:bg-stone-50"
              >
                {t('common.close', 'Fermer')}
              </button>
            </div>
          )}

          {/* ─── État F: Error ─── */}
          {modal.type === 'error' && (
            <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-sm p-5 animate-in fade-in zoom-in-95 max-h-[92vh] sm:max-h-none overflow-y-auto">
              <div className="flex justify-center mb-3 sm:hidden"><div className="w-8 h-1 rounded-full bg-stone-300" /></div>
              <div className={`rounded-xl border p-5 ${
                modal.errorType === 'permission' ? 'border-amber-200' : 'border-red-200'
              }`}>
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    modal.errorType === 'permission' ? 'bg-amber-50' : 'bg-red-50'
                  }`}>
                    {modal.errorType === 'permission' ? (
                      <Lock className="w-4 h-4 text-amber-500" />
                    ) : modal.errorType === 'email' ? (
                      <Mail className="w-4 h-4 text-red-500" />
                    ) : (
                      <FileDown className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className={`text-sm font-semibold ${modal.errorType === 'permission' ? 'text-amber-800' : 'text-red-800'}`}>
                      {modal.title}
                    </h3>
                    <p className={`text-xs mt-0.5 ${modal.errorType === 'permission' ? 'text-amber-600' : 'text-red-600'}`}>
                      {modal.message}
                    </p>
                    <div className="flex items-center gap-2 mt-3">
                      {modal.errorType === 'pdf' && (
                        <>
                          <button
                            onClick={() => {
                              setModal({ type: 'none' })
                              setPdfSections({ ...pdfSections, documents: false })
                              handleGeneratePdf()
                            }}
                            className="px-3 py-1.5 text-xs font-medium text-white bg-[#1e3a5f] hover:bg-[#1e3a5f]/90 rounded-lg"
                          >
                            {t('exportPage.errors.retryWithoutDocs', 'Réessayer sans documents')}
                          </button>
                          <button
                            onClick={() => setModal({ type: 'none' })}
                            className="px-3 py-1.5 text-xs font-medium text-[#1e3a5f] bg-white border border-stone-300 rounded-lg hover:bg-stone-50"
                          >
                            {t('exportPage.errors.upgrade', 'Mettre à niveau')}
                          </button>
                        </>
                      )}
                      {modal.errorType === 'email' && (
                        <button
                          onClick={() => setModal({ type: 'none' })}
                          className="px-3 py-1.5 text-xs font-medium text-white bg-[#1e3a5f] hover:bg-[#1e3a5f]/90 rounded-lg"
                        >
                          {t('exportPage.errors.fixAddress', 'Corriger l\'adresse')}
                        </button>
                      )}
                      {modal.errorType === 'permission' && (
                        <button
                          onClick={() => setModal({ type: 'none' })}
                          className="px-3 py-1.5 text-xs font-medium text-white bg-[#e07a2f] hover:bg-[#e07a2f]/90 rounded-lg"
                        >
                          {t('exportPage.errors.viewPlans', 'Voir les plans')}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
