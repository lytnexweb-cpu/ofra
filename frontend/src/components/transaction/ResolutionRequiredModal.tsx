import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, CheckCircle2, Ban, SkipForward, FileWarning, X } from 'lucide-react'
import { conditionsApi, type Condition, type ResolutionType, type ConditionResolutionInput } from '../../api/conditions.api'
import { toast } from '../../hooks/use-toast'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'

interface ResolutionRequiredModalProps {
  isOpen: boolean
  onClose: () => void
  onResolved: () => void
  transactionId: number
  conditions: Pick<Condition, 'id' | 'title' | 'labelFr' | 'labelEn' | 'level'>[]
}

interface ConditionResolution {
  conditionId: number
  resolutionType: ResolutionType | null
  note: string
}

const RESOLUTION_OPTIONS: { value: ResolutionType; labelKey: string; icon: React.ElementType; color: string }[] = [
  { value: 'completed', labelKey: 'resolution.completed', icon: CheckCircle2, color: 'text-success' },
  { value: 'waived', labelKey: 'resolution.waived', icon: Ban, color: 'text-warning' },
  { value: 'not_applicable', labelKey: 'resolution.notApplicable', icon: SkipForward, color: 'text-muted-foreground' },
  { value: 'skipped_with_risk', labelKey: 'resolution.skippedWithRisk', icon: FileWarning, color: 'text-destructive' },
]

export default function ResolutionRequiredModal({
  isOpen,
  onClose,
  onResolved,
  transactionId,
  conditions,
}: ResolutionRequiredModalProps) {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()

  // Initialize resolutions state for each condition
  const [resolutions, setResolutions] = useState<ConditionResolution[]>(() =>
    conditions.map((c) => ({ conditionId: c.id, resolutionType: null, note: '' }))
  )

  // Reset when conditions change
  useMemo(() => {
    setResolutions(conditions.map((c) => ({ conditionId: c.id, resolutionType: null, note: '' })))
  }, [conditions])

  const resolveMutation = useMutation({
    mutationFn: async (inputs: ConditionResolutionInput[]) => {
      // Resolve each condition sequentially
      const results = []
      for (const input of inputs) {
        const result = await conditionsApi.resolve(input.conditionId, {
          resolutionType: input.resolutionType,
          note: input.note,
        })
        results.push(result)
      }
      return results
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['transaction', transactionId] }),
        queryClient.invalidateQueries({ queryKey: ['transactions'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      ])
      toast({ title: t('resolution.success'), variant: 'default' })
      onResolved()
    },
    onError: () => {
      toast({ title: t('resolution.error'), variant: 'destructive' })
    },
  })

  const updateResolution = (conditionId: number, field: 'resolutionType' | 'note', value: string | ResolutionType | null) => {
    setResolutions((prev) =>
      prev.map((r) =>
        r.conditionId === conditionId ? { ...r, [field]: value } : r
      )
    )
  }

  const getConditionTitle = (condition: Pick<Condition, 'id' | 'title' | 'labelFr' | 'labelEn'>) => {
    if (i18n.language === 'fr' && condition.labelFr) return condition.labelFr
    if (i18n.language === 'en' && condition.labelEn) return condition.labelEn
    return condition.title
  }

  const isValid = useMemo(() => {
    return resolutions.every((r) => {
      if (!r.resolutionType) return false
      // Note is required for all except 'completed'
      if (r.resolutionType !== 'completed' && !r.note.trim()) return false
      return true
    })
  }, [resolutions])

  const handleSubmit = () => {
    if (!isValid) return

    const inputs: ConditionResolutionInput[] = resolutions
      .filter((r) => r.resolutionType !== null)
      .map((r) => ({
        conditionId: r.conditionId,
        resolutionType: r.resolutionType!,
        note: r.note.trim() || undefined,
      }))

    resolveMutation.mutate(inputs)
  }

  // Filter out blocking conditions - they can't be resolved this way
  const blockingConditions = conditions.filter((c) => c.level === 'blocking')
  const requiredConditions = conditions.filter((c) => c.level === 'required' || (!c.level && c.level !== 'blocking'))

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50">
      {/* Overlay - non-closeable for required resolutions */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Modal content */}
      <div className="relative z-10 flex min-h-full items-center justify-center p-4">
        <div className="w-full max-w-2xl rounded-xl bg-background shadow-xl border border-border">
          {/* Header */}
          <div className="flex items-start justify-between p-6 border-b border-border">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <AlertTriangle className="w-6 h-6 text-warning" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  {t('resolution.modalTitle')}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t('resolution.modalDescription')}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-md hover:bg-muted transition-colors"
              disabled={resolveMutation.isPending}
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[60vh] overflow-y-auto space-y-6">
            {/* Blocking conditions warning */}
            {blockingConditions.length > 0 && (
              <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-destructive">
                      {t('resolution.blockingWarning')}
                    </p>
                    <ul className="mt-2 space-y-1">
                      {blockingConditions.map((c) => (
                        <li key={c.id} className="text-sm text-destructive/80 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
                          {getConditionTitle(c)}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Required conditions to resolve */}
            {requiredConditions.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-foreground">
                  {t('resolution.requiredConditions')} ({requiredConditions.length})
                </h3>

                {requiredConditions.map((condition) => {
                  const resolution = resolutions.find((r) => r.conditionId === condition.id)
                  const needsNote = resolution?.resolutionType && resolution.resolutionType !== 'completed'

                  return (
                    <div
                      key={condition.id}
                      className="p-4 rounded-lg border border-border bg-card"
                    >
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">
                            {getConditionTitle(condition)}
                          </span>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {t('conditions.levels.required')}
                          </Badge>
                        </div>
                      </div>

                      {/* Resolution type selection */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        {RESOLUTION_OPTIONS.map((option) => {
                          // Blocking conditions can't use skipped_with_risk
                          if (condition.level === 'blocking' && option.value === 'skipped_with_risk') {
                            return null
                          }

                          const isSelected = resolution?.resolutionType === option.value
                          const Icon = option.icon

                          return (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => updateResolution(condition.id, 'resolutionType', option.value)}
                              className={[
                                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                                isSelected
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted hover:bg-muted/80 text-muted-foreground',
                              ].join(' ')}
                            >
                              <Icon className="w-3.5 h-3.5" />
                              {t(option.labelKey)}
                            </button>
                          )
                        })}
                      </div>

                      {/* Note input - required for non-completed resolutions */}
                      {needsNote && (
                        <div>
                          <label className="block text-xs text-muted-foreground mb-1">
                            {t('resolution.noteRequired')} <span className="text-destructive">*</span>
                          </label>
                          <textarea
                            value={resolution?.note || ''}
                            onChange={(e) => updateResolution(condition.id, 'note', e.target.value)}
                            placeholder={t('resolution.notePlaceholder')}
                            rows={2}
                            className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-border bg-muted/30">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={resolveMutation.isPending}
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!isValid || resolveMutation.isPending || blockingConditions.length > 0}
            >
              {resolveMutation.isPending ? t('resolution.resolving') : t('resolution.confirmAndAdvance')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
