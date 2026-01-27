interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning' | 'info'
  isLoading?: boolean
  hideCancelButton?: boolean
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'info',
  isLoading = false,
  hideCancelButton = false,
}: ConfirmDialogProps) {
  if (!isOpen) return null

  const variantClasses = {
    danger: 'bg-destructive hover:bg-destructive/90 focus:ring-destructive',
    warning: 'bg-warning hover:bg-warning/90 focus:ring-warning',
    info: 'bg-primary hover:bg-primary/90 focus:ring-primary',
  }

  return (
    <div className="fixed inset-0 z-40">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Modal content */}
      <div className="relative z-10 flex min-h-full items-center justify-center p-4">
        <div
          className="w-full max-w-md rounded-xl bg-card shadow-xl border border-border"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Body */}
          <div className="p-6">
            <h3 className="text-lg font-medium text-foreground mb-4">
              {title}
            </h3>
            <p className="text-sm text-muted-foreground">{message}</p>
          </div>

          {/* Footer */}
          <div className="bg-muted px-6 py-4 flex justify-end gap-3 rounded-b-xl">
            {!hideCancelButton && (
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-foreground bg-card border border-border rounded-md hover:bg-muted focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring disabled:opacity-50"
              >
                {cancelLabel}
              </button>
            )}
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className={`px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 ${variantClasses[variant]}`}
            >
              {isLoading ? 'Loading...' : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
