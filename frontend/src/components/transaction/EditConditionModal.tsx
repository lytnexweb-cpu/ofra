import { useState, useEffect, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, X, Check, UserPlus, UserCheck, XCircle } from 'lucide-react'
import { conditionsApi, type Condition, type ConditionLevel, type ConditionType } from '../../api/conditions.api'
import { prosApi, type ProfessionalContact, type ProfessionalRole } from '../../api/pros.api'
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

// C11: Condition type → suggested professional role mapping
const TYPE_TO_ROLE: Partial<Record<ConditionType, ProfessionalRole[]>> = {
  inspection: ['inspector'],
  water_test: ['inspector'],
  legal: ['lawyer', 'notary'],
  rpds_review: ['lawyer'],
  financing: ['mortgage_broker'],
  deposit: ['mortgage_broker'],
  appraisal: ['appraiser'],
  documents: ['notary'],
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
  const [assignedProId, setAssignedProId] = useState<number | null>(null)

  // C12: Load agent's professional contacts
  const { data: prosData } = useQuery({
    queryKey: ['pros'],
    queryFn: prosApi.list,
    staleTime: 5 * 60 * 1000,
    enabled: isOpen,
  })
  const allPros = prosData?.data?.pros ?? []

  useEffect(() => {
    if (condition) {
      const dateValue = condition.dueDate
        ? new Date(condition.dueDate).toISOString().split('T')[0]
        : ''
      setDueDate(dateValue)
      setDescription(condition.description ?? '')
      setAssignedProId(condition.assignedProId ?? null)
    }
  }, [condition])

  // C11: Split pros into suggested (matching condition type) and others
  const { suggestedPros, otherPros } = useMemo(() => {
    if (!condition) return { suggestedPros: [], otherPros: allPros }
    const matchingRoles = TYPE_TO_ROLE[condition.type] ?? []
    if (matchingRoles.length === 0) return { suggestedPros: [], otherPros: allPros }
    const suggested: ProfessionalContact[] = []
    const others: ProfessionalContact[] = []
    for (const pro of allPros) {
      if (matchingRoles.includes(pro.role)) {
        suggested.push(pro)
      } else {
        others.push(pro)
      }
    }
    return { suggestedPros: suggested, otherPros: others }
  }, [condition, allPros])

  const updateMutation = useMutation({
    mutationFn: () => {
      if (!condition) throw new Error('No condition')
      return conditionsApi.update(condition.id, {
        dueDate: dueDate || undefined,
        description: description || undefined,
        assignedProId: assignedProId,
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

  const selectedPro = allPros.find((p) => p.id === assignedProId)

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

          {/* C12: Assign professional contact */}
          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1.5 uppercase tracking-wide">
              {t('conditions.assignPro.label')}
            </label>

            {/* Currently assigned */}
            {selectedPro ? (
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-violet-50 border border-violet-200">
                <div className="flex items-center gap-2 min-w-0">
                  <UserCheck className="w-4 h-4 text-violet-600 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-sm font-medium text-violet-900 block truncate">{selectedPro.name}</span>
                    <span className="text-xs text-violet-600">{t(`pros.roles.${selectedPro.role}`)}</span>
                    {selectedPro.company && <span className="text-xs text-violet-500 ml-1">— {selectedPro.company}</span>}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAssignedProId(null)}
                  className="p-1 rounded-md text-violet-400 hover:text-violet-700 hover:bg-violet-100 transition-colors"
                  aria-label={t('conditions.assignPro.remove')}
                  disabled={isLoading}
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="text-xs text-stone-400 mb-2">
                {t('conditions.assignPro.none')}
              </div>
            )}

            {/* Pro picker */}
            {allPros.length > 0 ? (
              <div className="mt-2 space-y-1.5">
                {/* C11: Suggested pros (matching condition type) */}
                {suggestedPros.length > 0 && (
                  <>
                    <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wide">
                      {t('conditions.assignPro.suggested')}
                    </p>
                    {suggestedPros.map((pro) => (
                      <ProOption
                        key={pro.id}
                        pro={pro}
                        isSelected={assignedProId === pro.id}
                        onSelect={() => setAssignedProId(pro.id)}
                        isSuggested
                        disabled={isLoading}
                        t={t}
                      />
                    ))}
                  </>
                )}

                {/* Other pros */}
                {otherPros.length > 0 && (
                  <>
                    {suggestedPros.length > 0 && (
                      <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wide mt-2">
                        {t('conditions.assignPro.others')}
                      </p>
                    )}
                    {otherPros.map((pro) => (
                      <ProOption
                        key={pro.id}
                        pro={pro}
                        isSelected={assignedProId === pro.id}
                        onSelect={() => setAssignedProId(pro.id)}
                        isSuggested={false}
                        disabled={isLoading}
                        t={t}
                      />
                    ))}
                  </>
                )}
              </div>
            ) : (
              <p className="text-xs text-stone-400 italic mt-1">
                {t('conditions.assignPro.empty')}
              </p>
            )}
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

// Small component for pro option row
function ProOption({
  pro,
  isSelected,
  onSelect,
  isSuggested,
  disabled,
  t,
}: {
  pro: ProfessionalContact
  isSelected: boolean
  onSelect: () => void
  isSuggested: boolean
  disabled: boolean
  t: (key: string) => string
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled || isSelected}
      className={[
        'w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left text-sm transition-colors',
        isSelected
          ? 'bg-violet-100 border border-violet-300 text-violet-900'
          : isSuggested
            ? 'bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 text-stone-800'
            : 'bg-white border border-stone-200 hover:bg-stone-50 text-stone-800',
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
      ].join(' ')}
    >
      {isSelected ? (
        <UserCheck className="w-3.5 h-3.5 text-violet-600 shrink-0" />
      ) : (
        <UserPlus className="w-3.5 h-3.5 text-stone-400 shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <span className="font-medium truncate block">{pro.name}</span>
        <span className="text-xs text-stone-500">{t(`pros.roles.${pro.role}`)}</span>
        {pro.company && <span className="text-xs text-stone-400 ml-1">— {pro.company}</span>}
      </div>
    </button>
  )
}
