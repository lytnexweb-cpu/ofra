import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Download,
  Link2,
  Mail,
  Copy,
  Check,
  Loader2,
  FileDown,
  Eye,
  Lock,
} from 'lucide-react'
import { exportApi, type ExportPdfOptions } from '../../api/export.api'
import { shareLinksApi } from '../../api/share-links.api'
import { toast } from '../../hooks/use-toast'
import { Button } from '../ui/Button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/Dialog'

interface ExportSharePanelProps {
  isOpen: boolean
  onClose: () => void
  transactionId: number
}

export default function ExportSharePanel({ isOpen, onClose, transactionId }: ExportSharePanelProps) {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()

  // PDF export state
  const [pdfSections, setPdfSections] = useState({
    offers: true,
    conditions: true,
    documents: true,
    history: false,
  })
  const [pdfWatermark, setPdfWatermark] = useState(true)
  const [pdfLanguage, setPdfLanguage] = useState<'fr' | 'en'>(i18n.language as 'fr' | 'en')
  const [pdfExporting, setPdfExporting] = useState(false)
  const [pdfSuccess, setPdfSuccess] = useState(false)

  // Share link state
  const [linkPassword, setLinkPassword] = useState('')
  const [linkExpiry, setLinkExpiry] = useState('')
  const [copied, setCopied] = useState(false)

  // Email state
  const [emailAddress, setEmailAddress] = useState('')

  // Fetch existing share link
  const { data: linkData } = useQuery({
    queryKey: ['share-link', transactionId],
    queryFn: () => shareLinksApi.get(transactionId),
    enabled: isOpen,
  })

  const shareLink = linkData?.data?.shareLink ?? null

  // Create share link
  const createLinkMutation = useMutation({
    mutationFn: () =>
      shareLinksApi.create(transactionId, {
        expiresAt: linkExpiry || null,
        password: linkPassword || null,
      }),
    onSuccess: () => {
      toast({ title: t('shareLink.created'), variant: 'success' })
      queryClient.invalidateQueries({ queryKey: ['share-link', transactionId] })
    },
    onError: () => {
      toast({ title: t('common.error'), variant: 'destructive' })
    },
  })

  // Toggle share link active/inactive
  const toggleLinkMutation = useMutation({
    mutationFn: () => {
      if (!shareLink) return Promise.resolve({ success: false })
      return shareLinksApi.update(transactionId, shareLink.id, { isActive: !shareLink.isActive })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['share-link', transactionId] })
    },
    onError: () => {
      toast({ title: t('common.error'), variant: 'destructive' })
    },
  })

  // Email
  const emailMutation = useMutation({
    mutationFn: () => exportApi.sendEmail(transactionId, { recipients: [emailAddress] }),
    onSuccess: () => {
      toast({ title: t('export.emailSent'), variant: 'success' })
      setEmailAddress('')
    },
    onError: () => {
      toast({ title: t('common.error'), variant: 'destructive' })
    },
  })

  // PDF Export
  const handleExportPdf = async () => {
    setPdfExporting(true)
    setPdfSuccess(false)
    try {
      const options: ExportPdfOptions = {
        sections: pdfSections,
        watermark: pdfWatermark,
        language: pdfLanguage,
      }
      const result = await exportApi.exportPdf(transactionId, options)
      if (result.success && result.data) {
        const url = window.URL.createObjectURL(result.data.blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `transaction-${transactionId}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        setPdfSuccess(true)
        toast({ title: t('export.pdfReady'), variant: 'success' })
      } else {
        toast({ title: t('export.pdfFailed'), variant: 'destructive' })
      }
    } catch {
      toast({ title: t('export.pdfFailed'), variant: 'destructive' })
    } finally {
      setPdfExporting(false)
    }
  }

  const handleCopyLink = () => {
    if (!shareLink) return
    const url = `${window.location.origin}/shared/${shareLink.token}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast({ title: t('shareLink.copied'), variant: 'success' })
  }

  const inputClass =
    'w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background'

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md max-h-[85vh] flex flex-col" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            {t('export.title')}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6">
          {/* Section 1: Export PDF */}
          <div className="rounded-lg border border-border p-4 space-y-3">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <FileDown className="w-4 h-4" />
              {t('export.pdfTitle')}
            </h4>
            <p className="text-xs text-muted-foreground">{t('export.pdfDescription')}</p>

            <div className="space-y-2">
              <label className="text-xs font-medium">{t('export.sections')}</label>
              {(['offers', 'conditions', 'documents', 'history'] as const).map((section) => (
                <label key={section} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pdfSections[section]}
                    onChange={(e) =>
                      setPdfSections({ ...pdfSections, [section]: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-stone-300 accent-blue-600"
                  />
                  <span className="text-sm">{t(`export.section.${section}`)}</span>
                </label>
              ))}
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={pdfWatermark}
                onChange={(e) => setPdfWatermark(e.target.checked)}
                className="h-4 w-4 rounded border-stone-300 accent-blue-600"
              />
              <span className="text-sm">{t('export.watermark')}</span>
            </label>

            <div>
              <label className="block text-xs font-medium mb-1">{t('export.language')}</label>
              <select
                value={pdfLanguage}
                onChange={(e) => setPdfLanguage(e.target.value as 'fr' | 'en')}
                className={inputClass}
              >
                <option value="fr">{t('settings.language.french')}</option>
                <option value="en">{t('settings.language.english')}</option>
              </select>
            </div>

            <Button
              onClick={handleExportPdf}
              disabled={pdfExporting}
              className="w-full gap-2"
            >
              {pdfExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t('export.generating')}
                </>
              ) : pdfSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  {t('export.pdfReady')}
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  {t('export.generatePdf')}
                </>
              )}
            </Button>
          </div>

          {/* Section 2: Share Link */}
          <div className="rounded-lg border border-border p-4 space-y-3">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Link2 className="w-4 h-4" />
              {t('shareLink.title')}
            </h4>
            <p className="text-xs text-muted-foreground">{t('shareLink.description')}</p>

            {shareLink ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={shareLink.isActive}
                      onChange={() => toggleLinkMutation.mutate()}
                      className="h-4 w-4 rounded border-stone-300 accent-blue-600"
                    />
                    <span className="text-sm font-medium">
                      {shareLink.isActive ? t('shareLink.active') : t('shareLink.inactive')}
                    </span>
                  </label>
                </div>

                {shareLink.isActive && (
                  <>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={`${window.location.origin}/shared/${shareLink.token}`}
                        className={`${inputClass} text-xs font-mono`}
                      />
                      <Button variant="outline" size="icon" onClick={handleCopyLink} className="flex-shrink-0">
                        {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {shareLink.expiresAt && (
                        <span>{t('shareLink.expiresAt')}: {new Date(shareLink.expiresAt).toLocaleDateString()}</span>
                      )}
                      {shareLink.hasPassword && (
                        <span className="flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          {t('shareLink.passwordProtected')}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {shareLink.accessCount} {t('shareLink.views')}
                      </span>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium mb-1">{t('shareLink.expiryDate')}</label>
                  <input
                    type="date"
                    value={linkExpiry}
                    onChange={(e) => setLinkExpiry(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">{t('shareLink.password')}</label>
                  <input
                    type="text"
                    value={linkPassword}
                    onChange={(e) => setLinkPassword(e.target.value)}
                    className={inputClass}
                    placeholder={t('shareLink.passwordPlaceholder')}
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={() => createLinkMutation.mutate()}
                  disabled={createLinkMutation.isPending}
                  className="w-full gap-2"
                >
                  <Link2 className="w-4 h-4" />
                  {createLinkMutation.isPending ? t('common.loading') : t('shareLink.create')}
                </Button>
              </div>
            )}
          </div>

          {/* Section 3: Email Recap */}
          <div className="rounded-lg border border-border p-4 space-y-3">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Mail className="w-4 h-4" />
              {t('export.emailTitle')}
            </h4>
            <p className="text-xs text-muted-foreground">{t('export.emailDescription')}</p>

            <div className="flex items-center gap-2">
              <input
                type="email"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                className={inputClass}
                placeholder="courtier@example.com"
              />
              <Button
                variant="outline"
                onClick={() => emailMutation.mutate()}
                disabled={!emailAddress.trim() || emailMutation.isPending}
                className="flex-shrink-0"
              >
                {emailMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Mail className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="border-t pt-3">
          <Button variant="outline" onClick={onClose} className="w-full">
            {t('common.close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
