import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Pencil, X, Calendar, Check } from 'lucide-react'
import { conditionsApi, type Condition, type ConditionLevel } from '../../api/conditions.api'
import { toast } from '../../hooks/use-toast'

interface EditConditionModalProps {
  condition: Condition | null
  transactionId: number
  isOpen: boolean
  onClose: () => void
}

const LEVEL_BADGE: Record<ConditionLevel, { classes: string }> = {
  blocking: { classes: 'bg-red-100 text-red-700' },
  required: { classes: 'bg-amber-100 text-amber-700' },
  recommended: { classes: 'bg-stone-200 text-stone-600' },
}

export default function EditConditionModal({
  condition,
  transactionId,
  isOpen,
  onClose,
}: EditConditionModalProps) {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()

  const [dueDate, setDueDate] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    if (condition) {
      const dateValue = condition.dueDate
        ? new Date(condition.dueDate).toISOString().split('T')[0]
        : ''
      setDueDate(dateValue)
      setDescription(condition.description ?? '')
    }
  }, [condition])

  const updateMutation = useMutation({
    mutationFn: () => {
      if (!condition) throw new Error('No condition')
      return conditionsApi.update(condition.id, {
        dueDate: dueDate || undefined,
        description: description || undefined,
      })
    },
    onSuccess: (response) => {
      if (response.success) {
        toast({
          title: t('common.success'),
          description: t('conditions.updateSuccess'),
          variant: 'success',
        })
        queryClient.invalidateQueries({ queryKey: ['transaction', transactionId] })
        queryClient.invalidateQueries({ queryKey: ['transactions'] })
        queryClient.invalidateQueries({ queryKey: ['advance-check', transactionId] })
        onClose()
      }
    },
    onError: (error: any) => {
      const errorCode = error?.response?.data?.error?.code
      toast({
        title: t('common.error'),
        description: errorCode === 'E_CONDITION_ARCHIVED'
          ? t('conditions.archivedError')
          : t('conditions.updateError'),
        variant: 'destructive',
      })
    },
  })

  const isLoading = updateMutation.isPending

  const handleClose = useCallback(() => {
    if (isLoading) return
    onClose()
  }, [isLoading, onClose])

  if (!isOpen || !condition) return null

  const level: ConditionLevel = condition.level || (condition.isBlocking ? 'blocking' : 'recommended')
  const badgeConfig = LEVEL_BADGE[level]

  const conditionLabel =
    i18n.language.startsWith('fr') && condition.labelFr
      ? condition.labelFr
      : condition.labelEn ?? condition.title

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
                <Pencil className="w-5 h-5 text-[#1e3a5f]" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-stone-900">
                  {t('conditions.editModal.title')}
                </h2>
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

        {/* Body */}
        <div className="flex-1 overflow-y-auto min-h-0 px-5 sm:px-6 py-4 space-y-4">
          {/* Condition info card (readonly) */}
          <div className="rounded-lg bg-stone-50 border border-stone-200 p-3 sm:p-4">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${badgeConfig.classes}`}>
                {t(`resolveCondition.level.${level}`)}
              </span>
              {condition.templateId && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-stone-100 text-stone-400">
                  {t('conditions.generated')}
                </span>
              )}
            </div>
            <h3 className="text-sm font-semibold text-stone-900">{conditionLabel}</h3>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1.5 uppercase tracking-wide">
              {t('conditions.form.dueDate')}
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2.5 text-sm rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20"
              disabled={isLoading}
            />
          </div>

          {/* Description/Note */}
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">
              {t('conditions.form.description')} <span className="text-stone-400">({t('resolveCondition.noteOptional', 'optionnel')})</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('conditions.editModal.notePlaceholder')}
              className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 resize-none"
              rows={3}
              maxLength={1000}
              disabled={isLoading}
            />
            <p className="text-xs text-stone-400 text-right mt-1">
              {description.length}/1000
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
            onClick={() => updateMutation.mutate()}
            disabled={isLoading}
            className={[
              'px-6 py-2.5 rounded-lg text-sm font-semibold shadow-sm flex items-center justify-center gap-2',
              !isLoading
                ? 'bg-[#1e3a5f] hover:bg-[#1e3a5f]/90 text-white'
                : 'bg-stone-300 text-stone-500 cursor-not-allowed',
            ].join(' ')}
          >
            {isLoading ? (
              <>
                <span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full inline-block" />
                {t('common.loading')}
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                {t('common.save')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
