import { useState, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ShieldCheck, X, Upload, CheckCircle2, AlertTriangle, FileText, Image as ImageIcon, File as FileIcon } from 'lucide-react'
import { fintracApi, type FintracRecord, type FintracIdType, type CompleteFintracData } from '../../api/fintrac.api'
import { conditionsApi } from '../../api/conditions.api'
import { toast } from '../../hooks/use-toast'

interface FintracComplianceModalProps {
  isOpen: boolean
  onClose: () => void
  transactionId: number
  conditionId: number
  fintracRecordId: number
  partyName: string
}

const ID_TYPES: FintracIdType[] = [
  'drivers_license',
  'canadian_passport',
  'foreign_passport',
  'citizenship_card',
  'other_government_id',
]

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 Mo
const ACCEPTED_EXTENSIONS = '.pdf,.jpg,.jpeg,.png,.docx'

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

function getFileIcon(type: string) {
  if (type.startsWith('image/')) return ImageIcon
  if (type.includes('pdf') || type.includes('document')) return FileText
  return FileIcon
}

export default function FintracComplianceModal({
  isOpen,
  onClose,
  transactionId,
  conditionId,
  fintracRecordId,
  partyName,
}: FintracComplianceModalProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Form state
  const [idType, setIdType] = useState<FintracIdType | ''>('')
  const [idNumber, setIdNumber] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [occupation, setOccupation] = useState('')
  const [sourceOfFunds, setSourceOfFunds] = useState('')
  const [notes, setNotes] = useState('')

  // File state
  const [file, setFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [fileError, setFileError] = useState<string | null>(null)

  // Load existing record data
  const { data: recordData } = useQuery({
    queryKey: ['fintrac', fintracRecordId],
    queryFn: () => fintracApi.get(fintracRecordId),
    enabled: isOpen && fintracRecordId > 0,
  })

  // Pre-fill form when data loads
  const record = recordData?.data?.record
  const isAlreadyComplete = !!record?.verifiedAt

  // If record has data and form is empty, pre-fill
  if (record && !idType && record.idType) {
    setIdType(record.idType)
    setIdNumber(record.idNumber || '')
    setDateOfBirth(record.dateOfBirth?.split('T')[0] || '')
    setOccupation(record.occupation || '')
    setSourceOfFunds(record.sourceOfFunds || '')
    setNotes(record.notes || '')
  }

  // Step 1: Complete FINTRAC record
  const completeMutation = useMutation({
    mutationFn: (data: CompleteFintracData) => fintracApi.complete(fintracRecordId, data),
    onError: () => {
      toast({ title: t('common.error'), variant: 'destructive' })
    },
  })

  // Step 2: Upload evidence to condition
  const uploadEvidenceMutation = useMutation({
    mutationFn: (evidenceFile: File) => conditionsApi.uploadEvidence(conditionId, evidenceFile, `FINTRAC — ${partyName}`),
    onError: () => {
      toast({ title: t('common.error'), variant: 'destructive' })
    },
  })

  // Step 3: Resolve FINTRAC condition
  const resolveMutation = useMutation({
    mutationFn: () => fintracApi.resolve(fintracRecordId),
    onSuccess: () => {
      toast({ title: t('fintrac.success'), variant: 'success' })
      queryClient.invalidateQueries({ queryKey: ['fintrac', transactionId] })
      queryClient.invalidateQueries({ queryKey: ['transaction', transactionId] })
      queryClient.invalidateQueries({ queryKey: ['conditions', transactionId] })
      queryClient.invalidateQueries({ queryKey: ['conditions-active', transactionId] })
      queryClient.invalidateQueries({ queryKey: ['advance-check', transactionId] })
      resetAndClose()
    },
    onError: () => {
      toast({ title: t('common.error'), variant: 'destructive' })
    },
  })

  const isLoading = completeMutation.isPending || uploadEvidenceMutation.isPending || resolveMutation.isPending
  const canSubmit = idType !== '' && idNumber.trim() !== '' && dateOfBirth !== '' && file !== null

  const resetAndClose = useCallback(() => {
    setIdType('')
    setIdNumber('')
    setDateOfBirth('')
    setOccupation('')
    setSourceOfFunds('')
    setNotes('')
    setFile(null)
    setFilePreview(null)
    setFileError(null)
    setDragOver(false)
    onClose()
  }, [onClose])

  const handleClose = useCallback(() => {
    if (isLoading) return
    resetAndClose()
  }, [isLoading, resetAndClose])

  const handleFileSelect = useCallback((f: File) => {
    setFileError(null)
    if (f.size > MAX_FILE_SIZE) {
      setFileError(t('fintrac.fileTooLarge'))
      return
    }
    setFile(f)
    if (f.type.startsWith('image/')) {
      setFilePreview(URL.createObjectURL(f))
    } else {
      setFilePreview(null)
    }
  }, [t])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFileSelect(f)
  }, [handleFileSelect])

  const handleRemoveFile = useCallback(() => {
    if (filePreview) URL.revokeObjectURL(filePreview)
    setFile(null)
    setFilePreview(null)
    setFileError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [filePreview])

  const handleSubmit = async () => {
    if (!canSubmit || isLoading) return

    try {
      // Step 1: Complete FINTRAC record
      await completeMutation.mutateAsync({
        dateOfBirth,
        idType: idType as FintracIdType,
        idNumber: idNumber.trim(),
        occupation: occupation.trim() || undefined,
        sourceOfFunds: sourceOfFunds.trim() || undefined,
        notes: notes.trim() || undefined,
      })

      // Step 2: Upload identity document as evidence on the condition
      if (file) {
        await uploadEvidenceMutation.mutateAsync(file)
      }

      // Step 3: Auto-resolve the FINTRAC condition
      await resolveMutation.mutateAsync()
    } catch {
      // Error toasts already handled by individual mutations
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg mx-0 sm:mx-4 max-h-[92vh] sm:max-h-[calc(100%-2rem)] flex flex-col">
        {/* Mobile drag handle */}
        <div className="flex justify-center pt-2 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-stone-300" />
        </div>

        {/* Header */}
        <div className="px-5 sm:px-6 pt-5 sm:pt-6 pb-4 border-b border-stone-100">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-stone-900">
                  {t('fintrac.modalTitle')}
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">{partyName}</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 -mt-1 -mr-1"
              disabled={isLoading}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto min-h-0 px-5 sm:px-6 py-4 space-y-4">
          {/* Already complete info */}
          {isAlreadyComplete && (
            <div className="flex items-start gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-emerald-800">{t('fintrac.alreadyVerified')}</p>
                <p className="text-xs text-emerald-700 mt-0.5">{t('fintrac.alreadyVerifiedDesc')}</p>
              </div>
            </div>
          )}

          {/* Compliance notice */}
          <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">{t('fintrac.complianceNotice')}</p>
          </div>

          {/* ID Type */}
          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1.5 uppercase tracking-wide">
              {t('fintrac.idType')} <span className="text-red-400">*</span>
            </label>
            <select
              value={idType}
              onChange={(e) => setIdType(e.target.value as FintracIdType | '')}
              className="w-full px-3 py-2.5 text-sm rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 bg-white"
              disabled={isLoading}
            >
              <option value="">{t('fintrac.selectIdType')}</option>
              {ID_TYPES.map((type) => (
                <option key={type} value={type}>
                  {t(`fintrac.idTypes.${type}`)}
                </option>
              ))}
            </select>
          </div>

          {/* ID Number */}
          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1.5 uppercase tracking-wide">
              {t('fintrac.idNumber')} <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={idNumber}
              onChange={(e) => setIdNumber(e.target.value)}
              placeholder={t('fintrac.idNumberPlaceholder')}
              className="w-full px-3 py-2.5 text-sm rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20"
              disabled={isLoading}
            />
          </div>

          {/* Date of Birth */}
          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1.5 uppercase tracking-wide">
              {t('fintrac.dateOfBirth')} <span className="text-red-400">*</span>
            </label>
            <input
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              className="w-full px-3 py-2.5 text-sm rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20"
              disabled={isLoading}
            />
          </div>

          {/* Occupation */}
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1.5">
              {t('fintrac.occupation')}
            </label>
            <input
              type="text"
              value={occupation}
              onChange={(e) => setOccupation(e.target.value)}
              placeholder={t('fintrac.occupationPlaceholder')}
              className="w-full px-3 py-2.5 text-sm rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20"
              disabled={isLoading}
            />
          </div>

          {/* Source of Funds */}
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1.5">
              {t('fintrac.sourceOfFunds')}
            </label>
            <input
              type="text"
              value={sourceOfFunds}
              onChange={(e) => setSourceOfFunds(e.target.value)}
              placeholder={t('fintrac.sourceOfFundsPlaceholder')}
              className="w-full px-3 py-2.5 text-sm rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20"
              disabled={isLoading}
            />
          </div>

          {/* Identity Document Upload */}
          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1.5 uppercase tracking-wide">
              {t('fintrac.identityDocument')} <span className="text-red-400">*</span>
            </label>

            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_EXTENSIONS}
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) handleFileSelect(f)
                if (fileInputRef.current) fileInputRef.current.value = ''
              }}
              className="hidden"
            />

            {!file ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                className={[
                  'rounded-lg border-2 border-dashed p-4 text-center cursor-pointer transition-all',
                  dragOver
                    ? 'border-[#1e3a5f] bg-[#1e3a5f]/5'
                    : 'border-stone-300 hover:border-[#1e3a5f] hover:bg-[#1e3a5f]/[0.02]',
                ].join(' ')}
              >
                <Upload className="w-6 h-6 text-stone-400 mx-auto mb-1.5" />
                <p className="text-sm text-stone-500">
                  {t('fintrac.dropzone')}{' '}
                  <span className="text-[#1e3a5f] font-semibold hover:underline">
                    {t('fintrac.browse')}
                  </span>
                </p>
                <p className="text-xs text-stone-400 mt-0.5">
                  {t('fintrac.formats')}
                </p>
              </div>
            ) : (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                  {filePreview ? (
                    <img src={filePreview} alt="Preview" className="w-9 h-9 object-cover rounded-lg" />
                  ) : (
                    (() => { const Icon = getFileIcon(file.type); return <Icon className="w-4 h-4 text-emerald-600" /> })()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-stone-900 truncate">{file.name}</p>
                  <p className="text-xs text-stone-400">{formatFileSize(file.size)}</p>
                </div>
                {!isLoading && (
                  <button
                    onClick={handleRemoveFile}
                    className="p-1 rounded hover:bg-red-100 text-stone-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}

            {fileError && <p className="text-xs text-red-500 mt-1">{fileError}</p>}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1.5">
              {t('fintrac.notes')}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('fintrac.notesPlaceholder')}
              className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 resize-none"
              rows={2}
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-4 bg-stone-50 border-t border-stone-100 flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2 sm:justify-end">
          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-100 text-sm font-medium text-center"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit || isLoading}
            className={[
              'px-6 py-2.5 rounded-lg text-sm font-semibold shadow-sm flex items-center justify-center gap-2',
              canSubmit && !isLoading
                ? 'bg-[#1e3a5f] hover:bg-[#1e3a5f]/90 text-white'
                : 'bg-stone-300 text-stone-500 cursor-not-allowed',
            ].join(' ')}
          >
            {isLoading ? (
              <>
                <span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full inline-block" />
                {t('fintrac.submitting')}
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                {t('fintrac.submit')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
