import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Upload, FileText, Download, CheckCircle, AlertCircle, X, Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/Dialog'
import { Button } from './ui/Button'
import { clientsApi, type CsvImportResult } from '../api/clients.api'

interface ImportClientsModalProps {
  isOpen: boolean
  onClose: () => void
}

type ImportState = 'idle' | 'uploading' | 'success' | 'error'

export default function ImportClientsModal({ isOpen, onClose }: ImportClientsModalProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const [dragActive, setDragActive] = useState(false)
  const [importState, setImportState] = useState<ImportState>('idle')
  const [result, setResult] = useState<CsvImportResult | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const importMutation = useMutation({
    mutationFn: (file: File) => clientsApi.importCsv(file),
    onSuccess: (response) => {
      // API returns { success, data: { imported, skipped, errors } }
      const data = response.data
      const importResult: CsvImportResult = {
        success: response.success && data.imported > 0,
        imported: data.imported ?? 0,
        skipped: data.skipped ?? 0,
        errors: data.errors ?? [],
      }
      setResult(importResult)
      setImportState(importResult.imported > 0 ? 'success' : 'error')
      queryClient.invalidateQueries({ queryKey: ['clients'] })
    },
    onError: () => {
      setImportState('error')
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
      handleFile(files[0])
    }
  }, [])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files?.[0]) {
      handleFile(files[0])
    }
  }

  const handleFile = (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setImportState('error')
      setResult({
        success: false,
        imported: 0,
        skipped: 0,
        errors: [{ row: 0, message: t('csvImport.invalidFormat') }],
      })
      return
    }
    setSelectedFile(file)
  }

  const handleUpload = () => {
    if (!selectedFile) return
    setImportState('uploading')
    importMutation.mutate(selectedFile)
  }

  const handleClose = () => {
    setImportState('idle')
    setResult(null)
    setSelectedFile(null)
    onClose()
  }

  const handleReset = () => {
    setImportState('idle')
    setResult(null)
    setSelectedFile(null)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('csvImport.title')}</DialogTitle>
        </DialogHeader>

        {/* Idle / File Selection State */}
        {importState === 'idle' && (
          <div className="space-y-4">
            {/* Download template link */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Download className="w-4 h-4" />
              <a
                href={clientsApi.getImportTemplate()}
                download="clients-template.csv"
                className="text-primary hover:underline"
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
              className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive
                  ? 'border-primary bg-primary/5'
                  : selectedFile
                  ? 'border-success bg-success/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <input
                type="file"
                accept=".csv"
                onChange={handleFileInput}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                data-testid="csv-file-input"
              />

              {selectedFile ? (
                <div className="flex flex-col items-center gap-2">
                  <FileText className="w-10 h-10 text-success" />
                  <p className="font-medium text-foreground">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedFile(null)
                    }}
                    className="text-muted-foreground"
                  >
                    <X className="w-4 h-4 mr-1" />
                    {t('common.remove')}
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="w-10 h-10 text-muted-foreground" />
                  <p className="font-medium text-foreground">{t('csvImport.dropzone')}</p>
                  <p className="text-sm text-muted-foreground">{t('csvImport.dropzoneHint')}</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose}>
                {t('common.cancel')}
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!selectedFile}
                className="bg-primary"
                data-testid="import-btn"
              >
                <Upload className="w-4 h-4 mr-2" />
                {t('csvImport.import')}
              </Button>
            </div>
          </div>
        )}

        {/* Uploading State */}
        {importState === 'uploading' && (
          <div className="py-8 text-center">
            <Loader2 className="w-10 h-10 text-primary mx-auto animate-spin" />
            <p className="mt-4 text-muted-foreground">{t('csvImport.importing')}</p>
          </div>
        )}

        {/* Success State */}
        {importState === 'success' && result && (
          <div className="space-y-4">
            <div className="text-center py-4">
              <CheckCircle className="w-12 h-12 text-success mx-auto" />
              <h3 className="mt-3 font-semibold text-lg">{t('csvImport.success')}</h3>
              <p className="text-muted-foreground mt-1">
                {t('csvImport.importedCount', { count: result.imported })}
              </p>
              {result.skipped > 0 && (
                <p className="text-sm text-muted-foreground">
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
                      <span className="text-destructive">Ligne {err.row}:</span>
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

            <div className="flex justify-end gap-2">
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
        {importState === 'error' && result && (
          <div className="space-y-4">
            <div className="text-center py-4">
              <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
              <h3 className="mt-3 font-semibold text-lg">{t('csvImport.failed')}</h3>
            </div>

            {/* Error details */}
            <div className="max-h-40 overflow-y-auto border rounded-lg p-3 bg-destructive/5">
              <ul className="text-sm space-y-1">
                {result.errors.map((err, i) => (
                  <li key={i} className="flex gap-2">
                    {err.row > 0 && <span className="text-destructive">Ligne {err.row}:</span>}
                    <span>{err.message}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex justify-end gap-2">
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
