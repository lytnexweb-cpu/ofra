import { useState, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, ShieldAlert } from 'lucide-react'
import { Button } from '../ui/Button'
import type { Condition } from '../../api/conditions.api'

interface EscapeConfirmationModalProps {
  /** The condition being validated without proof */
  condition: Condition
  /** Whether the modal is open */
  isOpen: boolean
  /** Close handler */
  onClose: () => void
  /** Confirm handler - receives escape reason */
  onConfirm: (escapeReason: string) => void
  /** Whether confirmation is in progress */
  isConfirming?: boolean
}

const MIN_REASON_LENGTH = 10
const CONFIRM_PHRASE_FR = 'je confirme sans preuve'
const CONFIRM_PHRASE_EN = 'I confirm without evidence'

export default function EscapeConfirmationModal({
  condition,
  isOpen,
  onClose,
  onConfirm,
  isConfirming = false,
}: EscapeConfirmationModalProps) {
  const { t, i18n } = useTranslation()

  const [escapeReason, setEscapeReason] = useState('')
  const [checkboxChecked, setCheckboxChecked] = useState(false)
  const [typedPhrase, setTypedPhrase] = useState('')

  const confirmPhrase = i18n.language === 'fr' ? CONFIRM_PHRASE_FR : CONFIRM_PHRASE_EN

  // Get localized title
  const title = useMemo(() => {
    if (i18n.language === 'fr' && condition.labelFr) return condition.labelFr
    if (i18n.language === 'en' && condition.labelEn) return condition.labelEn
    return condition.title
  }, [condition, i18n.language])

  // Validation
  const reasonValid = escapeReason.trim().length >= MIN_REASON_LENGTH
  const phraseValid = typedPhrase.toLowerCase().trim() === confirmPhrase.toLowerCase()
  const canConfirm = reasonValid && checkboxChecked && phraseValid && !isConfirming

  const remainingChars = Math.max(0, MIN_REASON_LENGTH - escapeReason.trim().length)

  const handleConfirm = useCallback(() => {
    if (canConfirm) {
      onConfirm(escapeReason.trim())
    }
  }, [canConfirm, escapeReason, onConfirm])

  const handleClose = useCallback(() => {
    // Reset state on close
    setEscapeReason('')
    setCheckboxChecked(false)
    setTypedPhrase('')
    onClose()
  }, [onClose])

  if (!isOpen) return null

  return (
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
          <div className="p-2 rounded-full bg-destructive/10">
            <ShieldAlert className="w-5 h-5 text-destructive" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">
              {t('validation.escapeModal.title')}
            </h2>
            <p className="text-sm text-muted-foreground truncate">{title}</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Warning */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">
              {t('validation.escapeModal.warning')}
            </p>
          </div>

          {/* Legal disclaimer */}
          <p className="text-xs text-muted-foreground italic">
            {t('validation.escapeModal.legalDisclaimer')}
          </p>

          {/* Escape reason */}
          <div>
            <label className="block text-sm font-medium mb-1.5">
              {t('validation.escapeModal.reasonLabel')}
            </label>
            <textarea
              value={escapeReason}
              onChange={(e) => setEscapeReason(e.target.value)}
              placeholder={t('validation.escapeModal.reasonPlaceholder')}
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              rows={3}
              disabled={isConfirming}
            />
            {remainingChars > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {t('validation.escapeModal.reasonMinLength', { count: remainingChars })}
              </p>
            )}
          </div>

          {/* Checkbox */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={checkboxChecked}
              onChange={(e) => setCheckboxChecked(e.target.checked)}
              className="mt-1 w-4 h-4 rounded border-input"
              disabled={isConfirming}
            />
            <span className="text-sm">
              {t('validation.escapeModal.checkbox')}
            </span>
          </label>

          {/* Confirmation phrase */}
          <div>
            <label className="block text-sm font-medium mb-1.5">
              {t('validation.escapeModal.typePhrase')}
            </label>
            <p className="text-sm font-mono bg-muted px-3 py-2 rounded mb-2">
              {confirmPhrase}
            </p>
            <input
              type="text"
              value={typedPhrase}
              onChange={(e) => setTypedPhrase(e.target.value)}
              placeholder={confirmPhrase}
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={isConfirming}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t border-border">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            disabled={isConfirming}
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={!canConfirm}
          >
            {isConfirming ? (
              <>
                <span className="animate-spin mr-2">...</span>
                {t('validation.validating')}
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4 mr-2" />
                {t('validation.escapeModal.confirm')}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
