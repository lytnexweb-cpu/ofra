import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Upload,
  FileText,
  Check,
  HelpCircle,
  Loader2,
  CheckCircle,
  X,
  Zap,
  FileSpreadsheet,
  Clock,
} from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { integrationsApi, type FubContactPreview } from '../../api/integrations.api'
import { clientsApi } from '../../api/clients.api'
import { useCsvImport, FIELD_LABELS } from '../../hooks/useCsvImport'

type ImportMethod = null | 'fub' | 'csv' | 'zero'
type FubState = 'idle' | 'connecting' | 'connected' | 'importing' | 'done'
type CsvUploadState = 'ready' | 'uploading' | 'done'

interface Step2ImportProps {
  onImportComplete: (count: number) => void
}

export default function Step2Import({ onImportComplete }: Step2ImportProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const [method, setMethod] = useState<ImportMethod>(null)

  // FollowUpBoss state
  const [fubApiKey, setFubApiKey] = useState('')
  const [fubState, setFubState] = useState<FubState>('idle')
  const [fubContacts, setFubContacts] = useState<FubContactPreview[]>([])
  const [fubError, setFubError] = useState<string | null>(null)
  const [importedCount, setImportedCount] = useState(0)

  // CSV state
  const csv = useCsvImport()
  const [csvUploadState, setCsvUploadState] = useState<CsvUploadState>('ready')
  const [dragActive, setDragActive] = useState(false)

  // FUB Connect mutation
  const connectFubMutation = useMutation({
    mutationFn: () => integrationsApi.connectFub(fubApiKey),
    onSuccess: (res) => {
      if (res.success && res.data) {
        setFubContacts(res.data.contacts)
        setFubState('connected')
        setFubError(null)
      } else {
        setFubState('idle')
        setFubError(res.error?.code === 'E_FUB_INVALID_KEY'
          ? t('onboarding.step2.fubInvalidKey')
          : t('onboarding.step2.fubError'))
      }
    },
    onError: () => {
      setFubState('idle')
      setFubError(t('onboarding.step2.fubError'))
    },
  })

  // FUB Import mutation
  const importFubMutation = useMutation({
    mutationFn: () => integrationsApi.importFub(fubApiKey),
    onSuccess: (res) => {
      if (res.success && res.data) {
        setImportedCount(res.data.imported)
        setFubState('done')
        queryClient.invalidateQueries({ queryKey: ['clients'] })
        onImportComplete(res.data.imported)
      }
    },
    onError: () => {
      setFubState('connected')
      setFubError(t('onboarding.step2.fubError'))
    },
  })

  // CSV Import mutation
  const csvImportMutation = useMutation({
    mutationFn: (file: File) => clientsApi.importCsv(file),
    onSuccess: (res) => {
      const count = res.data?.imported ?? 0
      setImportedCount(count)
      setCsvUploadState('done')
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      onImportComplete(count)
    },
    onError: () => {
      setCsvUploadState('ready')
    },
  })

  const handleConnectFub = () => {
    if (fubApiKey.length < 10) return
    setFubState('connecting')
    setFubError(null)
    connectFubMutation.mutate()
  }

  const handleImportFub = () => {
    setFubState('importing')
    importFubMutation.mutate()
  }

  const handleCsvUpload = () => {
    if (!csv.selectedFile) return
    setCsvUploadState('uploading')
    csvImportMutation.mutate(csv.selectedFile)
  }

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    const files = e.dataTransfer.files
    if (files?.[0]) csv.handleFile(files[0])
  }, [csv])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files?.[0]) csv.handleFile(files[0])
  }

  // Scene A: Method selection
  if (!method) {
    return (
      <div className="animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">{t('onboarding.step2.title')}</h1>
          <p className="text-muted-foreground">{t('onboarding.step2.subtitle')}</p>
        </div>

        <div className="space-y-3">
          {/* FollowUpBoss */}
          <button
            type="button"
            onClick={() => setMethod('fub')}
            className="w-full p-4 rounded-xl border-2 border-border hover:border-primary/50 text-left transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{t('onboarding.step2.methodFub')}</span>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                    {t('onboarding.step2.methodFubRecommended')}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{t('onboarding.step2.methodFubDesc')}</p>
              </div>
            </div>
          </button>

          {/* CSV */}
          <button
            type="button"
            onClick={() => setMethod('csv')}
            className="w-full p-4 rounded-xl border-2 border-border hover:border-primary/50 text-left transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <span className="font-medium">{t('onboarding.step2.methodCsv')}</span>
                <p className="text-sm text-muted-foreground">{t('onboarding.step2.methodCsvDesc')}</p>
              </div>
            </div>
          </button>

          {/* Zero */}
          <button
            type="button"
            onClick={() => {
              setMethod('zero')
              onImportComplete(0)
            }}
            className="w-full p-4 rounded-xl border-2 border-border hover:border-primary/50 text-left transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <span className="font-medium">{t('onboarding.step2.methodZero')}</span>
                <p className="text-sm text-muted-foreground">{t('onboarding.step2.methodZeroDesc')}</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    )
  }

  // Scene B: FollowUpBoss flow
  if (method === 'fub') {
    return (
      <div className="animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-2">{t('onboarding.step2.methodFub')}</h1>
          <p className="text-muted-foreground">{t('onboarding.step2.methodFubDesc')}</p>
        </div>

        {/* Done state */}
        {fubState === 'done' ? (
          <div className="text-center py-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
            <p className="font-semibold text-lg">
              {t('onboarding.step2.importSuccess', { count: importedCount })}
            </p>
          </div>
        ) : (
          <>
            {/* API Key input */}
            <div className="mb-4">
              <label htmlFor="fub-key" className="block text-sm font-medium text-foreground mb-1">
                {t('onboarding.step2.fubApiKey')}
              </label>
              <div className="flex gap-2">
                <input
                  id="fub-key"
                  type="text"
                  value={fubApiKey}
                  onChange={(e) => setFubApiKey(e.target.value)}
                  disabled={fubState !== 'idle'}
                  className="flex-1 px-3.5 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors disabled:opacity-50"
                  placeholder={t('onboarding.step2.fubApiKeyPlaceholder')}
                />
                <Button
                  onClick={handleConnectFub}
                  disabled={fubApiKey.length < 10 || fubState !== 'idle'}
                >
                  {fubState === 'connecting' ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> {t('onboarding.step2.fubConnecting')}</>
                  ) : (
                    t('onboarding.step2.fubConnect')
                  )}
                </Button>
              </div>
              {fubError && (
                <p className="mt-2 text-sm text-destructive">{fubError}</p>
              )}
            </div>

            {/* Connected: show contacts preview */}
            {fubState === 'connected' && fubContacts.length > 0 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center gap-2 bg-success/10 border border-success/20 rounded-lg p-3">
                  <CheckCircle className="w-5 h-5 text-success" />
                  <span className="text-sm font-medium">
                    {t('onboarding.step2.fubConnected')} — {t('onboarding.step2.previewContacts', { count: fubContacts.length })}
                  </span>
                </div>

                {/* Contact list preview */}
                <div className="border rounded-lg overflow-hidden max-h-60 overflow-y-auto">
                  <div className="bg-muted/50 px-3 py-2 border-b sticky top-0">
                    <p className="text-sm font-medium">{t('onboarding.step2.previewTitle')}</p>
                  </div>
                  {fubContacts.slice(0, 20).map((c) => (
                    <div key={c.id} className="px-3 py-2 border-b border-border/50 flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-xs font-medium text-primary">
                        {(c.firstName?.[0] || '?').toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {c.firstName} {c.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{c.email || c.phone || '—'}</p>
                      </div>
                    </div>
                  ))}
                  {fubContacts.length > 20 && (
                    <div className="px-3 py-2 text-xs text-muted-foreground text-center bg-muted/30">
                      +{fubContacts.length - 20} more
                    </div>
                  )}
                </div>

                <Button onClick={handleImportFub} className="w-full" disabled={fubState === 'importing'}>
                  {fubState === 'importing' ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> {t('onboarding.step2.importing')}</>
                  ) : (
                    <><Upload className="w-4 h-4" /> {t('onboarding.step2.importButton', { count: fubContacts.length })}</>
                  )}
                </Button>
              </div>
            )}
          </>
        )}

        <button
          type="button"
          onClick={() => { setMethod(null); setFubState('idle'); setFubContacts([]); setFubError(null) }}
          className="mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          &larr; {t('onboarding.back')}
        </button>
      </div>
    )
  }

  // Scene C: CSV flow
  if (method === 'csv') {
    return (
      <div className="animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-2">{t('onboarding.step2.methodCsv')}</h1>
          <p className="text-muted-foreground">{t('onboarding.step2.methodCsvDesc')}</p>
        </div>

        {/* Done state */}
        {csvUploadState === 'done' ? (
          <div className="text-center py-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
            <p className="font-semibold text-lg">
              {t('onboarding.step2.importSuccess', { count: importedCount })}
            </p>
          </div>
        ) : csv.state === 'idle' ? (
          /* Drop zone */
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200 ${
              dragActive
                ? 'border-primary bg-primary/5 scale-[1.02]'
                : 'border-border hover:border-primary/50 hover:bg-muted/30'
            }`}
          >
            <input
              type="file"
              accept=".csv"
              onChange={handleFileInput}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center gap-3">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${
                dragActive ? 'bg-primary/10' : 'bg-muted'
              }`}>
                <Upload className={`w-8 h-8 transition-colors ${dragActive ? 'text-primary' : 'text-muted-foreground'}`} />
              </div>
              <div>
                <p className="font-medium text-foreground">{t('onboarding.step2.csvDrop')}</p>
                <p className="text-sm text-muted-foreground mt-1">{t('onboarding.step2.csvDropHint')}</p>
              </div>
            </div>
          </div>
        ) : csv.state === 'parsing' ? (
          <div className="py-12 text-center">
            <Loader2 className="w-10 h-10 text-primary mx-auto animate-spin" />
          </div>
        ) : csv.state === 'preview' && csv.preview ? (
          /* Preview */
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between bg-success/10 border border-success/20 rounded-lg p-3">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-success" />
                <div>
                  <p className="font-medium text-sm">{csv.selectedFile?.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {csv.preview.totalRows} rows &bull; {csv.preview.headers.length} columns
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={csv.reset}
                className="text-muted-foreground hover:text-foreground p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Column mapping badges */}
            <div className="flex flex-wrap gap-2">
              {csv.preview.headers.map((header) => {
                const mapped = csv.preview!.mappedColumns.get(header)
                return (
                  <div
                    key={header}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                      mapped
                        ? 'bg-success/10 text-success border border-success/20'
                        : 'bg-muted text-muted-foreground border border-border'
                    }`}
                  >
                    {mapped ? <Check className="w-3 h-3" /> : <HelpCircle className="w-3 h-3" />}
                    <span className="truncate max-w-[80px]">{header}</span>
                    {mapped && <span className="text-success/70">&rarr; {FIELD_LABELS[mapped] || mapped}</span>}
                  </div>
                )
              })}
            </div>

            {/* Preview table */}
            <div className="border rounded-lg overflow-hidden max-h-48 overflow-y-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/30">
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground w-12">#</th>
                    {csv.preview.headers.map((header, i) => (
                      <th key={i} className="px-3 py-2 text-left font-medium whitespace-nowrap text-foreground">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {csv.preview.rows.map((row, rowIndex) => (
                    <tr key={rowIndex} className="border-t border-border/50">
                      <td className="px-3 py-2 text-muted-foreground">{rowIndex + 1}</td>
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex} className="px-3 py-2 truncate max-w-[120px]">{cell || '—'}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Button onClick={handleCsvUpload} className="w-full" disabled={csvUploadState === 'uploading'}>
              {csvUploadState === 'uploading' ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> {t('onboarding.step2.importing')}</>
              ) : (
                <><Upload className="w-4 h-4" /> {t('onboarding.step2.importButton', { count: csv.preview.totalRows })}</>
              )}
            </Button>
          </div>
        ) : csv.state === 'error' ? (
          <div className="text-center py-6">
            <p className="text-destructive text-sm">{csv.error}</p>
            <Button variant="outline" onClick={csv.reset} className="mt-4">
              {t('onboarding.back')}
            </Button>
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => { setMethod(null); csv.reset(); setCsvUploadState('ready') }}
          className="mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          &larr; {t('onboarding.back')}
        </button>
      </div>
    )
  }

  // Zero method: already called onImportComplete(0), show nothing special
  return null
}
