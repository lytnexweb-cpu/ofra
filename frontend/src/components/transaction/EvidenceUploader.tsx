import { useState, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Upload, X, FileText, Image as ImageIcon, File } from 'lucide-react'
import { Button } from '../ui/Button'

export interface SelectedFile {
  file: File
  preview?: string
}

interface EvidenceUploaderProps {
  /** Called when a file is selected */
  onFileSelect: (file: SelectedFile | null) => void
  /** Currently selected file */
  selectedFile?: SelectedFile | null
  /** Whether upload is in progress */
  isUploading?: boolean
  /** Accepted file types */
  accept?: string
  /** Maximum file size in bytes (default 10MB) */
  maxSize?: number
  /** Compact mode */
  compact?: boolean
}

const DEFAULT_MAX_SIZE = 10 * 1024 * 1024 // 10MB
const DEFAULT_ACCEPT = '.pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.webp'

function getFileIcon(type: string) {
  if (type.startsWith('image/')) return ImageIcon
  if (type.includes('pdf') || type.includes('document')) return FileText
  return File
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function EvidenceUploader({
  onFileSelect,
  selectedFile,
  isUploading = false,
  accept = DEFAULT_ACCEPT,
  maxSize = DEFAULT_MAX_SIZE,
  compact = false,
}: EvidenceUploaderProps) {
  const { t } = useTranslation()
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback((file: File) => {
    setError(null)

    // Validate size
    if (file.size > maxSize) {
      setError(`File too large. Maximum size is ${formatFileSize(maxSize)}`)
      return
    }

    // Create preview for images
    let preview: string | undefined
    if (file.type.startsWith('image/')) {
      preview = URL.createObjectURL(file)
    }

    onFileSelect({ file, preview })
  }, [maxSize, onFileSelect])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFile(files[0])
    }
  }, [handleFile])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFile(files[0])
    }
  }, [handleFile])

  const handleRemove = useCallback(() => {
    if (selectedFile?.preview) {
      URL.revokeObjectURL(selectedFile.preview)
    }
    onFileSelect(null)
    setError(null)
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }, [selectedFile, onFileSelect])

  const handleClick = useCallback(() => {
    inputRef.current?.click()
  }, [])

  // File selected - show preview
  if (selectedFile) {
    const FileIcon = getFileIcon(selectedFile.file.type)

    return (
      <div className="relative rounded-lg border border-border bg-muted/30 p-3">
        <div className="flex items-center gap-3">
          {selectedFile.preview ? (
            <img
              src={selectedFile.preview}
              alt="Preview"
              className="w-12 h-12 object-cover rounded"
            />
          ) : (
            <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
              <FileIcon className="w-6 h-6 text-muted-foreground" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{selectedFile.file.name}</p>
            <p className="text-xs text-muted-foreground">{formatFileSize(selectedFile.file.size)}</p>
          </div>
          {!isUploading && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              className="shrink-0"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
        {isUploading && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-lg">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
          </div>
        )}
      </div>
    )
  }

  // Dropzone
  return (
    <div>
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={[
          'relative rounded-lg border-2 border-dashed cursor-pointer transition-colors',
          compact ? 'p-4' : 'p-6',
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30',
          error ? 'border-destructive' : '',
        ].join(' ')}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleInputChange}
          className="sr-only"
          disabled={isUploading}
        />

        <div className="flex flex-col items-center gap-2 text-center">
          <Upload className={[
            'text-muted-foreground',
            compact ? 'w-6 h-6' : 'w-8 h-8',
          ].join(' ')} />

          <div>
            <p className={[
              'font-medium',
              compact ? 'text-sm' : 'text-base',
            ].join(' ')}>
              {t('validation.uploadEvidence')}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {t('validation.uploadHint')}
            </p>
          </div>

          {!compact && (
            <p className="text-[10px] text-muted-foreground">
              {t('validation.uploadFormats')}
            </p>
          )}
        </div>
      </div>

      {error && (
        <p className="text-xs text-destructive mt-1">{error}</p>
      )}
    </div>
  )
}
