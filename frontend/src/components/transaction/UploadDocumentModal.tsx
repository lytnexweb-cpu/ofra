import { useState, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CloudUpload, X, FileText, Plus, AlertTriangle, Wifi, Ban, Info, RefreshCw } from 'lucide-react'
import {
  documentsApi,
  type DocumentCategory,
  type TransactionDocument,
} from '../../api/documents.api'
import type { Condition } from '../../api/conditions.api'
import { toast } from '../../hooks/use-toast'

interface UploadDocumentModalProps {
  isOpen: boolean
  onClose: () => void
  transactionId: number
  transactionLabel?: string
  conditions?: Condition[]
}

const CATEGORIES: DocumentCategory[] = ['offer', 'inspection', 'financing', 'identity', 'legal', 'other']
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 Mo
const ACCEPTED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]
const ACCEPTED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.docx']

type UploadError = { type: 'tooLarge'; fileName: string; size: number } | { type: 'badFormat'; fileName: string; ext: string } | { type: 'network'; fileName: string; progress: number }

export default function UploadDocumentModal({
  isOpen,
  onClose,
  transactionId,
  transactionLabel,
  conditions,
}: UploadDocumentModalProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [file, setFile] = useState<File | null>(null)
  const [category, setCategory] = useState<DocumentCategory | ''>('')
  const [name, setName] = useState('')
  const [conditionId, setConditionId] = useState<number | null>(null)
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [uploadError, setUploadError] = useState<UploadError | null>(null)

  const selectedCondition = conditions?.find((c) => c.id === conditionId)
  const isBlocking = selectedCondition?.isBlocking || selectedCondition?.level === 'blocking'

  const createMutation = useMutation({
    mutationFn: (data: { name: string; category: DocumentCategory; conditionId?: number | null }) =>
      documentsApi.create(transactionId, {
        name: data.name,
        category: data.category,
        conditionId: data.conditionId ?? null,
      }),
    onSuccess: (response) => {
      if (response.success) {
        toast({ title: t('documents.addSuccess', 'Document ajouté'), variant: 'success' })
        queryClient.invalidateQueries({ queryKey: ['documents', transactionId] })
        queryClient.invalidateQueries({ queryKey: ['transaction', transactionId] })
        resetAndClose()
      }
    },
    onError: () => {
      toast({ title: t('common.error'), variant: 'destructive' })
    },
  })

  const isLoading = createMutation.isPending
  const canSave = name.trim().length > 0 && category !== ''

  const resetAndClose = useCallback(() => {
    setFile(null)
    setCategory('')
    setName('')
    setConditionId(null)
    setTags([])
    setTagInput('')
    setDragOver(false)
    setUploadError(null)
    onClose()
  }, [onClose])

  const handleClose = useCallback(() => {
    if (isLoading) return
    resetAndClose()
  }, [isLoading, resetAndClose])

  const validateFile = useCallback((f: File): UploadError | null => {
    if (f.size > MAX_FILE_SIZE) {
      return { type: 'tooLarge', fileName: f.name, size: f.size }
    }
    const ext = '.' + f.name.split('.').pop()?.toLowerCase()
    if (!ACCEPTED_TYPES.includes(f.type) && !ACCEPTED_EXTENSIONS.includes(ext)) {
      return { type: 'badFormat', fileName: f.name, ext }
    }
    return null
  }, [])

  const handleFileSelect = useCallback((f: File) => {
    const error = validateFile(f)
    if (error) {
      setUploadError(error)
      setFile(null)
      return
    }
    setUploadError(null)
    setFile(f)
    if (!name) setName(f.name.replace(/\.[^.]+$/, ''))
  }, [validateFile, name])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFileSelect(f)
  }, [handleFileSelect])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback(() => setDragOver(false), [])

  const handleBrowse = () => fileInputRef.current?.click()

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) handleFileSelect(f)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const addTag = () => {
    const tag = tagInput.trim()
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag])
    }
    setTagInput('')
  }

  const removeTag = (tag: string) => setTags(tags.filter((t) => t !== tag))

  const handleSubmit = () => {
    if (!canSave || isLoading) return
    createMutation.mutate({
      name: name.trim(),
      category: category as DocumentCategory,
      conditionId,
    })
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
              <div className="w-10 h-10 rounded-full bg-[#1e3a5f]/10 flex items-center justify-center shrink-0">
                <CloudUpload className="w-5 h-5 text-[#1e3a5f]" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-stone-900">
                  {t('documents.addModal.title', 'Ajouter un document')}
                </h2>
                {transactionLabel && (
                  <p className="text-xs text-stone-500 mt-0.5">
                    {t('documents.addModal.subtitle', 'Transaction')} {transactionLabel}
                  </p>
                )}
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
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_EXTENSIONS.join(',')}
            onChange={handleFileInput}
            className="hidden"
          />

          {/* Drop zone */}
          {!file && (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={handleBrowse}
              className={[
                'rounded-lg border-2 border-dashed p-6 text-center cursor-pointer transition-all',
                dragOver
                  ? 'border-[#1e3a5f] bg-[#1e3a5f]/5'
                  : 'border-stone-300 hover:border-[#1e3a5f] hover:bg-[#1e3a5f]/[0.02]',
              ].join(' ')}
            >
              <CloudUpload className="w-10 h-10 text-stone-400 mx-auto mb-2" />
              <p className="text-sm text-stone-500">
                {t('documents.addModal.dropzone', 'Glissez un fichier ici ou')}{' '}
                <span className="text-[#1e3a5f] font-semibold hover:underline">
                  {t('documents.addModal.browse', 'parcourez')}
                </span>
              </p>
              <p className="text-xs text-stone-400 mt-1">
                {t('documents.addModal.formats', 'PDF, JPG, PNG, DOCX — max 10 Mo')}
              </p>
            </div>
          )}

          {/* Selected file */}
          {file && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-stone-900 truncate">{file.name}</p>
                <p className="text-xs text-stone-400">{formatSize(file.size)}</p>
              </div>
              <button
                onClick={() => { setFile(null); setUploadError(null) }}
                className="p-1 rounded hover:bg-red-100 text-stone-400 hover:text-red-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Upload errors */}
          {uploadError && <UploadErrorCard error={uploadError} t={t} onRetry={() => setUploadError(null)} />}

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1.5 uppercase tracking-wide">
              {t('documents.addModal.category', 'Catégorie')} <span className="text-red-400">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as DocumentCategory | '')}
              className="w-full px-3 py-2.5 text-sm rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 bg-white"
              disabled={isLoading}
            >
              <option value="">{t('documents.addModal.categoryPlaceholder', 'Sélectionnez...')}</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {t(`documents.categories.${cat}`, cat)}
                </option>
              ))}
            </select>
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1.5 uppercase tracking-wide">
              {t('documents.addModal.name', 'Nom du document')}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('documents.addModal.namePlaceholder', 'Nom affiché dans la liste...')}
              className="w-full px-3 py-2.5 text-sm rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20"
              disabled={isLoading}
            />
          </div>

          {/* Associate to condition */}
          {conditions && conditions.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1.5 uppercase tracking-wide">
                {t('documents.addModal.associateTo', 'Associer à')}
              </label>
              <select
                value={conditionId ?? ''}
                onChange={(e) => setConditionId(e.target.value ? Number(e.target.value) : null)}
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 bg-white"
                disabled={isLoading}
              >
                <option value="">{t('documents.addModal.associateTransaction', 'Transaction (général)')}</option>
                {conditions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {t('documents.addModal.associateCondition', 'Condition')} : {c.title} ({c.isBlocking ? t('documents.blocking', 'Bloquante') : c.level === 'required' ? t('addCondition.levelRequired', 'Requise') : t('addCondition.levelRecommended', 'Recommandée')})
                  </option>
                ))}
              </select>
              {isBlocking && (
                <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                  <Info className="w-3 h-3 shrink-0" />
                  {t('documents.addModal.blockingHint', 'Condition bloquante — ce document servira de preuve justificative')}
                </p>
              )}
            </div>
          )}

          {/* Tags */}
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1.5">
              {t('documents.addModal.tags', 'Tags (optionnel)')}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-stone-100 text-stone-600"
                >
                  {tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="text-stone-400 hover:text-red-500"
                    type="button"
                  >
                    &times;
                  </button>
                </span>
              ))}
              <div className="inline-flex items-center gap-1">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); addTag() }
                  }}
                  placeholder={tags.length === 0 ? t('documents.addModal.addTag', '+ tag') : ''}
                  className="w-16 px-1.5 py-0.5 text-xs border-0 outline-none bg-transparent placeholder:text-stone-400"
                  disabled={isLoading}
                />
                {tagInput.trim() && (
                  <button
                    type="button"
                    onClick={addTag}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border border-dashed border-stone-300 text-stone-400 hover:text-[#1e3a5f] hover:border-[#1e3a5f]"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Info formats */}
          <div className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2.5 flex items-center gap-2">
            <Info className="w-4 h-4 text-stone-400 shrink-0" />
            <p className="text-xs text-stone-500">
              <strong>{t('documents.errors.infoFormats', 'Formats')}</strong> : PDF, JPG, PNG, DOCX · <strong>{t('documents.errors.infoMaxSize', 'Taille max')}</strong> : 10 Mo · <strong>{t('documents.errors.infoTip', 'Conseil')}</strong> : {t('documents.errors.infoTipText', 'nommez vos fichiers clairement')}
            </p>
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
            disabled={!canSave || isLoading}
            className={[
              'px-6 py-2.5 rounded-lg text-sm font-semibold shadow-sm flex items-center justify-center gap-2',
              canSave && !isLoading
                ? 'bg-[#1e3a5f] hover:bg-[#1e3a5f]/90 text-white'
                : 'bg-stone-300 text-stone-500 cursor-not-allowed',
            ].join(' ')}
          >
            {isLoading ? (
              <>
                <span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full inline-block" />
                {t('documents.addModal.uploading', 'Téléchargement en cours...')}
              </>
            ) : (
              <>
                <CloudUpload className="w-4 h-4" />
                {t('documents.addModal.save', 'Enregistrer')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Upload Error Card (State E) ─── */

function UploadErrorCard({
  error,
  t,
  onRetry,
}: {
  error: UploadError
  t: (key: string, fallback?: string) => string
  onRetry: () => void
}) {
  if (error.type === 'tooLarge') {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-3">
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-red-800">
                {t('documents.errors.tooLarge', 'Fichier trop volumineux')}
              </span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-100 text-red-600">
                {formatSize(error.size)}
              </span>
            </div>
            <p className="text-xs text-red-700">
              {error.fileName} {t('documents.errors.tooLargeDesc', 'dépasse la limite de 10 Mo.')}
            </p>
            <p className="text-xs text-red-600 font-medium mt-1">
              {t('documents.errors.tooLargeHint', 'Compressez le fichier ou uploadez-le en plusieurs parties.')}
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (error.type === 'badFormat') {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-3">
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
            <Ban className="w-4 h-4 text-red-500" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-red-800">
                {t('documents.errors.badFormat', 'Format non accepté')}
              </span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-100 text-red-600">
                {error.ext}
              </span>
            </div>
            <p className="text-xs text-red-700">
              {error.fileName} {t('documents.errors.badFormatDesc', "n'est pas un format autorisé.")}
            </p>
            <p className="text-xs text-stone-500 mt-1">
              {t('documents.errors.acceptedFormats', 'Formats acceptés : PDF, JPG, PNG, DOCX')}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Network error
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
      <div className="flex items-start gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
          <Wifi className="w-4 h-4 text-amber-500" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-amber-800">
              {t('documents.errors.networkFail', 'Échec du téléchargement')}
            </span>
          </div>
          <p className="text-xs text-amber-700">
            {t('documents.errors.networkFailDesc', "La connexion a été interrompue pendant l'envoi de")} {error.fileName}.
          </p>
          <div className="flex items-center gap-3 mt-2">
            <div className="flex-1 h-2 bg-amber-200 rounded-full overflow-hidden">
              <div className="h-full bg-amber-400 rounded-full" style={{ width: `${error.progress}%` }} />
            </div>
            <span className="text-xs font-medium text-amber-600">{error.progress}%</span>
          </div>
          <button
            onClick={onRetry}
            className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            {t('documents.errors.retry', 'Réessayer')}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Helpers ─── */

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}
