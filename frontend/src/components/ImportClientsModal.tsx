import { useState, useCallback, useEffect } from 'react'
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

interface ImportClientsModalProps {
  isOpen: boolean
  onClose: () => void
}

type ImportState = 'idle' | 'parsing' | 'preview' | 'uploading' | 'success' | 'error'

interface CsvPreview {
  headers: string[]
  rows: string[][]
  totalRows: number
  mappedColumns: Map<string, string>
}

// Known column mappings (same as backend)
const COLUMN_MAPPINGS: Record<string, string> = {
  // English
  firstname: 'firstName',
  first_name: 'firstName',
  'first name': 'firstName',
  lastname: 'lastName',
  last_name: 'lastName',
  'last name': 'lastName',
  email: 'email',
  'e-mail': 'email',
  phone: 'phone',
  telephone: 'phone',
  tel: 'phone',
  notes: 'notes',
  note: 'notes',
  comments: 'notes',
  addressline1: 'addressLine1',
  address_line1: 'addressLine1',
  'address line 1': 'addressLine1',
  address: 'addressLine1',
  addressline2: 'addressLine2',
  address_line2: 'addressLine2',
  'address line 2': 'addressLine2',
  apt: 'addressLine2',
  apartment: 'addressLine2',
  suite: 'addressLine2',
  city: 'city',
  provincestate: 'provinceState',
  province_state: 'provinceState',
  province: 'provinceState',
  state: 'provinceState',
  postalcode: 'postalCode',
  postal_code: 'postalCode',
  'postal code': 'postalCode',
  zip: 'postalCode',
  zipcode: 'postalCode',
  homephone: 'homePhone',
  home_phone: 'homePhone',
  'home phone': 'homePhone',
  workphone: 'workPhone',
  work_phone: 'workPhone',
  'work phone': 'workPhone',
  cellphone: 'cellPhone',
  cell_phone: 'cellPhone',
  'cell phone': 'cellPhone',
  mobile: 'cellPhone',
  // French
  prénom: 'firstName',
  prenom: 'firstName',
  nom: 'lastName',
  'nom de famille': 'lastName',
  courriel: 'email',
  téléphone: 'phone',
  commentaires: 'notes',
  adresse: 'addressLine1',
  ville: 'city',
  'code postal': 'postalCode',
  cellulaire: 'cellPhone',
  'tel maison': 'homePhone',
  'tel travail': 'workPhone',
  'tel cellulaire': 'cellPhone',
}

// Human-readable field names
const FIELD_LABELS: Record<string, string> = {
  firstName: 'First Name',
  lastName: 'Last Name',
  email: 'Email',
  phone: 'Phone',
  notes: 'Notes',
  addressLine1: 'Address',
  addressLine2: 'Address 2',
  city: 'City',
  provinceState: 'Province/State',
  postalCode: 'Postal Code',
  homePhone: 'Home Phone',
  workPhone: 'Work Phone',
  cellPhone: 'Cell Phone',
}

function mapColumnName(header: string): string | null {
  const normalized = header.toLowerCase().trim()
  return COLUMN_MAPPINGS[normalized] || null
}

function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.split(/\r?\n/).filter((line) => line.trim())
  if (lines.length === 0) return { headers: [], rows: [] }

  // Simple CSV parser - handles basic cases
  const parseLine = (line: string): string[] => {
    const result: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    result.push(current.trim())
    return result
  }

  const headers = parseLine(lines[0])
  const rows = lines.slice(1).map(parseLine)

  return { headers, rows }
}

export default function ImportClientsModal({ isOpen, onClose }: ImportClientsModalProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const [dragActive, setDragActive] = useState(false)
  const [importState, setImportState] = useState<ImportState>('idle')
  const [result, setResult] = useState<CsvImportResult | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<CsvPreview | null>(null)

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

  // Parse CSV when file is selected
  useEffect(() => {
    if (!selectedFile) {
      setPreview(null)
      return
    }

    setImportState('parsing')

    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const { headers, rows } = parseCSV(text)

      // Map columns
      const mappedColumns = new Map<string, string>()
      headers.forEach((header) => {
        const mapped = mapColumnName(header)
        if (mapped) {
          mappedColumns.set(header, mapped)
        }
      })

      setPreview({
        headers,
        rows: rows.slice(0, 5), // First 5 rows for preview
        totalRows: rows.length,
        mappedColumns,
      })
      setImportState('preview')
    }
    reader.onerror = () => {
      setImportState('error')
      setResult({
        success: false,
        imported: 0,
        skipped: 0,
        errors: [{ row: 0, message: t('csvImport.uploadFailed') }],
      })
    }
    reader.readAsText(selectedFile)
  }, [selectedFile, t])

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
    setPreview(null)
    onClose()
  }

  const handleReset = () => {
    setImportState('idle')
    setResult(null)
    setSelectedFile(null)
    setPreview(null)
  }

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
        {importState === 'error' && result && (
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
                {result.errors.map((err, i) => (
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
