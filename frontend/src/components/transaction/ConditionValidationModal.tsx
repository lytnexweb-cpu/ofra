import { useState, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ShieldAlert, AlertCircle, Check } from 'lucide-react'
import { Button } from '../ui/Button'
import EvidenceUploader, { type SelectedFile } from './EvidenceUploader'
import EscapeConfirmationModal from './EscapeConfirmationModal'
import { conditionsApi, type Condition, type ConditionLevel } from '../../api/conditions.api'
import { toast } from '../../hooks/use-toast'

interface ConditionValidationModalProps {
  /** The condition to validate */
  condition: Condition
  /** Transaction ID for cache invalidation */
  transactionId: number
  /** Whether the modal is open */
  isOpen: boolean
  /** Close handler */
  onClose: () => void
  /** Success callback */
  onSuccess?: () => void
}

const LEVEL_CONFIG: Record<ConditionLevel, { icon: React.ElementType; colorClass: string }> = {
  blocking: { icon: ShieldAlert, colorClass: 'text-destructive' },
  required: { icon: AlertCircle, colorClass: 'text-warning' },
  recommended: { icon: Check, colorClass: 'text-success' },
}

export default function ConditionValidationModal({
  condition,
  transactionId,
  isOpen,
  onClose,
  onSuccess,
}: ConditionValidationModalProps) {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()

  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null)
  const [note, setNote] = useState('')
  const [showEscapeModal, setShowEscapeModal] = useState(false)

  const level = condition.level || 'recommended'
  const isBlocking = level === 'blocking'
  const isRequired = level === 'required'

  // Get localized title
  const title = useMemo(() => {
    if (i18n.language === 'fr' && condition.labelFr) return condition.labelFr
    if (i18n.language === 'en' && condition.labelEn) return condition.labelEn
    return condition.title
  }, [condition, i18n.language])

  const config = LEVEL_CONFIG[level]
  const Icon = config.icon

  // Add evidence mutation
  const addEvidenceMutation = useMutation({
    mutationFn: async (file: File) => {
      // For now, we'll create a note-type evidence with the filename
      // In a real implementation, this would upload the file first
      // and then create the evidence with the file URL
      return conditionsApi.addEvidence(condition.id, {
        type: 'note',
        title: file.name,
        note: `File: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`,
      })
    },
  })

  // Resolve mutation
  const resolveMutation = useMutation({
    mutationFn: async (params: {
      hasEvidence: boolean
      evidenceId?: number
      evidenceFilename?: string
      escapedWithoutProof?: boolean
      escapeReason?: string
    }) => {
      return conditionsApi.resolve(condition.id, {
        resolutionType: 'completed',
        note: note.trim() || undefined,
        hasEvidence: params.hasEvidence,
        evidenceId: params.evidenceId,
        evidenceFilename: params.evidenceFilename,
        escapedWithoutProof: params.escapedWithoutProof,
        escapeReason: params.escapeReason,
      })
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['transaction', transactionId] })
      queryClient.invalidateQueries({ queryKey: ['conditions', 'active', transactionId] })
      queryClient.invalidateQueries({ queryKey: ['conditions', 'advance-check', transactionId] })

      toast({ title: t('validation.success'), variant: 'success' })
      handleClose()
      onSuccess?.()
    },
    onError: () => {
      toast({ title: t('validation.error'), variant: 'destructive' })
    },
  })

  const isLoading = addEvidenceMutation.isPending || resolveMutation.isPending

  const handleClose = useCallback(() => {
    if (isLoading) return
    setSelectedFile(null)
    setNote('')
    setShowEscapeModal(false)
    onClose()
  }, [isLoading, onClose])

  const handleValidate = useCallback(async () => {
    if (isLoading) return

    // If blocking and no evidence, show escape modal
    if (isBlocking && !selectedFile) {
      setShowEscapeModal(true)
      return
    }

    // If we have a file, upload it first
    let evidenceId: number | undefined
    let evidenceFilename: string | undefined

    if (selectedFile) {
      try {
        const evidenceResult = await addEvidenceMutation.mutateAsync(selectedFile.file)
        evidenceId = evidenceResult.data.evidence.id
        evidenceFilename = selectedFile.file.name
      } catch {
        // Error handled by mutation
        return
      }
    }

    // Resolve the condition
    await resolveMutation.mutateAsync({
      hasEvidence: !!selectedFile,
      evidenceId,
      evidenceFilename,
    })
  }, [isLoading, isBlocking, selectedFile, addEvidenceMutation, resolveMutation])

  const handleEscapeConfirm = useCallback(async (escapeReason: string) => {
    await resolveMutation.mutateAsync({
      hasEvidence: false,
      escapedWithoutProof: true,
      escapeReason,
    })
  }, [resolveMutation])

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={handleClose}
        />

        {/* Modal */}
        <div className="relative bg-background rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center gap-3 p-4 border-b border-border">
            <div className={`p-2 rounded-full ${isBlocking ? 'bg-destructive/10' : isRequired ? 'bg-warning/10' : 'bg-success/10'}`}>
              <Icon className={`w-5 h-5 ${config.colorClass}`} />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold">
                {isBlocking
                  ? t('validation.modalTitleBlocking')
                  : isRequired
                    ? t('validation.modalTitleRequired')
                    : t('validation.modalTitle')}
              </h2>
              <p className="text-sm text-muted-foreground truncate">{title}</p>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {/* Evidence uploader for blocking and required */}
            {(isBlocking || isRequired) && (
              <div>
                <EvidenceUploader
                  selectedFile={selectedFile}
                  onFileSelect={setSelectedFile}
                  isUploading={addEvidenceMutation.isPending}
                />

                {/* "No evidence" option for blocking */}
                {isBlocking && !selectedFile && (
                  <button
                    type="button"
                    onClick={() => setShowEscapeModal(true)}
                    className="w-full mt-3 text-sm text-muted-foreground hover:text-foreground underline"
                    disabled={isLoading}
                  >
                    {t('validation.noEvidence')}
                  </button>
                )}
              </div>
            )}

            {/* Note field */}
            <div>
              <label className="block text-sm font-medium mb-1.5">
                {t('validation.addNote')}
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t('validation.notePlaceholder')}
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                rows={2}
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 p-4 border-t border-border">
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              disabled={isLoading}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="button"
              onClick={handleValidate}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="animate-spin mr-2 w-4 h-4 border-2 border-white/30 border-t-white rounded-full inline-block" />
                  {t('validation.validating')}
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  {t('validation.validate')}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Escape confirmation modal for blocking without evidence */}
      <EscapeConfirmationModal
        condition={condition}
        isOpen={showEscapeModal}
        onClose={() => setShowEscapeModal(false)}
        onConfirm={handleEscapeConfirm}
        isConfirming={resolveMutation.isPending}
      />
    </>
  )
}
