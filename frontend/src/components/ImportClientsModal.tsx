import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Upload,
  FileText,
  Download,
  CheckCircle,
  AlertCircle,
  X,
  Loader2,
  FileSpreadsheet,
  Check,
  HelpCircle,
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/Dialog'
import { Button } from './ui/Button'
import { clientsApi, type CsvImportResult } from '../api/clients.api'
import { useCsvImport, FIELD_LABELS } from '../hooks/useCsvImport'

interface ImportClientsModalProps {
  isOpen: boolean
  onClose: () => void
}

type UploadState = 'ready' | 'uploading' | 'success' | 'error'

export default function ImportClientsModal({ isOpen, onClose }: ImportClientsModalProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const csv = useCsvImport()
  const [dragActive, setDragActive] = useState(false)
  const [uploadState, setUploadState] = useState<UploadState>('ready')
  const [result, setResult] = useState<CsvImportResult | null>(null)

  const importMutation = useMutation({
    mutationFn: (file: File) => clientsApi.importCsv(file),
    onSuccess: (response) => {
      const data = response.data
      const importResult: CsvImportResult = {
        success: response.success && data.imported > 0,
        imported: data.imported ?? 0,
        skipped: data.skipped ?? 0,
        errors: data.errors ?? [],
      }
      setResult(importResult)
      setUploadState(importResult.imported > 0 ? 'success' : 'error')
      queryClient.invalidateQueries({ queryKey: ['clients'] })
    },
    onError: () => {
      setUploadState('error')
      setResult({
        success: false,
        imported: 0,
        skipped: 0,
        errors: [{ row: 0, message: t('csvImport.uploadFailed') }],
      })
    },
  })

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
    if (files?.[0]) {
      csv.handleFile(files[0])
    }
  }, [csv])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files?.[0]) {
      csv.handleFile(files[0])
    }
  }

  const handleUpload = () => {
    if (!csv.selectedFile) return
    setUploadState('uploading')
    importMutation.mutate(csv.selectedFile)
  }

  const handleClose = () => {
    csv.reset()
    setUploadState('ready')
    setResult(null)
    onClose()
  }

  const handleReset = () => {
    csv.reset()
    setUploadState('ready')
    setResult(null)
  }

  // Derive combined state for rendering
  const importState = csv.state === 'error' ? 'error' as const
    : csv.state === 'idle' && uploadState === 'ready' ? 'idle' as const
    : csv.state === 'parsing' ? 'parsing' as const
    : csv.state === 'preview' && uploadState === 'ready' ? 'preview' as const
    : uploadState === 'uploading' ? 'uploading' as const
    : uploadState === 'success' ? 'success' as const
    : uploadState === 'error' ? 'error' as const
    : 'idle' as const

  const { preview, selectedFile } = csv

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-primary" />
            {t('csvImport.title')}
          </DialogTitle>
        </DialogHeader>

        {/* Idle State - File Selection */}
        {importState === 'idle' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Download template link */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
              <Download className="w-4 h-4 text-primary" />
              <span>{t('csvImport.dropzoneHint')}</span>
              <a
                href={clientsApi.getImportTemplate()}
                download="clients-template.csv"
                className="text-primary font-medium hover:underline ml-auto"
              >
                {t('csvImport.downloadTemplate')}
              </a>
            </div>

            {/* Drop zone */}
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
                data-testid="csv-file-input"
              />

              <div className="flex flex-col items-center gap-3">
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${
                    dragActive ? 'bg-primary/10' : 'bg-muted'
                  }`}
                >
                  <Upload
                    className={`w-8 h-8 transition-colors ${
                      dragActive ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  />
                </div>
                <div>
                  <p className="font-medium text-foreground">{t('csvImport.dropzone')}</p>
                  <p className="text-sm text-muted-foreground mt-1">{t('csvImport.dropzoneHint')}</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end">
              <Button variant="outline" onClick={handleClose}>
                {t('common.cancel')}
              </Button>
            </div>
          </div>
        )}

        {/* Parsing State */}
        {importState === 'parsing' && (
          <div className="py-12 text-center animate-in fade-in duration-200">
            <Loader2 className="w-10 h-10 text-primary mx-auto animate-spin" />
            <p className="mt-4 text-muted-foreground">Analyzing file...</p>
          </div>
        )}

        {/* Preview State */}
        {importState === 'preview' && preview && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* File info bar */}
            <div className="flex items-center justify-between bg-success/10 border border-success/20 rounded-lg p-3">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-success" />
                <div>
                  <p className="font-medium text-sm">{selectedFile?.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {t('csvImport.rowsTotal', { count: preview.totalRows })} •{' '}
                    {t('csvImport.columnsDetected', { count: preview.headers.length })}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4 mr-1" />
                {t('csvImport.changeFile')}
              </Button>
            </div>

            {/* Column mapping badges */}
            <div className="flex flex-wrap gap-2">
              {preview.headers.map((header) => {
                const mapped = preview.mappedColumns.get(header)
                return (
                  <div
                    key={header}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                      mapped
                        ? 'bg-success/10 text-success border border-success/20'
                        : 'bg-muted text-muted-foreground border border-border'
                    }`}
                  >
                    {mapped ? (
                      <Check className="w-3 h-3" />
                    ) : (
                      <HelpCircle className="w-3 h-3" />
                    )}
                    <span className="truncate max-w-[100px]">{header}</span>
                    {mapped && (
                      <span className="text-success/70">→ {FIELD_LABELS[mapped] || mapped}</span>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Preview table */}
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-muted/50 px-3 py-2 border-b">
                <p className="text-sm font-medium">
                  {t('csvImport.preview')} — {t('csvImport.previewSubtitle', { count: preview.rows.length })}
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/30">
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground w-12">
                        #
                      </th>
                      {preview.headers.map((header, i) => (
                        <th
                          key={i}
                          className={`px-3 py-2 text-left font-medium whitespace-nowrap ${
                            preview.mappedColumns.has(header)
                              ? 'text-foreground'
                              : 'text-muted-foreground'
                          }`}
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.rows.map((row, rowIndex) => (
                      <tr
                        key={rowIndex}
                        className="border-t border-border/50 hover:bg-muted/20 transition-colors"
                      >
                        <td className="px-3 py-2 text-muted-foreground">{rowIndex + 1}</td>
                        {row.map((cell, cellIndex) => (
                          <td
                            key={cellIndex}
                            className="px-3 py-2 truncate max-w-[150px]"
                            title={cell}
                          >
                            {cell || <span className="text-muted-foreground/50">—</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {preview.totalRows > 5 && (
                <div className="bg-muted/30 px-3 py-2 border-t text-xs text-muted-foreground text-center">
                  +{preview.totalRows - 5} more rows
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center pt-2">
              <p className="text-sm text-muted-foreground">
                {preview.mappedColumns.size}/{preview.headers.length} columns recognized
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleClose}>
                  {t('common.cancel')}
                </Button>
                <Button
                  onClick={handleUpload}
                  className="bg-primary hover:bg-primary/90"
                  data-testid="import-btn"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {t('csvImport.import')} {preview.totalRows} {preview.totalRows === 1 ? 'client' : 'clients'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Uploading State */}
        {importState === 'uploading' && (
          <div className="py-12 text-center animate-in fade-in duration-200">
            <div className="relative w-16 h-16 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
              <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
              <Upload className="absolute inset-0 m-auto w-6 h-6 text-primary" />
            </div>
            <p className="mt-4 font-medium">{t('csvImport.importing')}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {preview?.totalRows} clients...
            </p>
          </div>
        )}

        {/* Success State */}
        {importState === 'success' && result && (
          <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
            <div className="text-center py-6">
              <div className="w-16 h-16 mx-auto rounded-full bg-success/10 flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-success" />
              </div>
              <h3 className="font-semibold text-xl">{t('csvImport.success')}</h3>
              <p className="text-muted-foreground mt-2 text-lg">
                {t('csvImport.importedCount', { count: result.imported })}
              </p>
              {result.skipped > 0 && (
                <p className="text-sm text-muted-foreground mt-1">
                  {t('csvImport.skippedCount', { count: result.skipped })}
                </p>
              )}
            </div>

            {/* Error details if any */}
            {result.errors.length > 0 && (
              <div className="max-h-40 overflow-y-auto border rounded-lg p-3 bg-muted/50">
                <p className="text-sm font-medium mb-2">{t('csvImport.errors')}</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {result.errors.slice(0, 10).map((err, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-destructive">{t('csvImport.row')} {err.row}:</span>
                      <span>{err.message}</span>
                    </li>
                  ))}
                  {result.errors.length > 10 && (
                    <li className="text-muted-foreground">
                      ... {t('csvImport.moreErrors', { count: result.errors.length - 10 })}
                    </li>
                  )}
                </ul>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={handleReset}>
                {t('csvImport.importMore')}
              </Button>
              <Button onClick={handleClose} className="bg-primary">
                {t('common.close')}
              </Button>
            </div>
          </div>
        )}

        {/* Error State */}
        {importState === 'error' && (result || csv.error) && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="text-center py-6">
              <div className="w-16 h-16 mx-auto rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                <AlertCircle className="w-8 h-8 text-destructive" />
              </div>
              <h3 className="font-semibold text-xl">{t('csvImport.failed')}</h3>
            </div>

            {/* Error details */}
            <div className="max-h-40 overflow-y-auto border border-destructive/20 rounded-lg p-3 bg-destructive/5">
              <ul className="text-sm space-y-1">
                {csv.error && (
                  <li><span>{csv.error}</span></li>
                )}
                {result?.errors.map((err, i) => (
                  <li key={i} className="flex gap-2">
                    {err.row > 0 && <span className="text-destructive">{t('csvImport.row')} {err.row}:</span>}
                    <span>{err.message}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={handleReset}>
                {t('common.retry')}
              </Button>
              <Button onClick={handleClose}>
                {t('common.close')}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
