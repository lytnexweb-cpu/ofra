import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ShieldAlert, AlertCircle, Lightbulb, Plus, ChevronDown, ChevronRight, Search, Loader2, AlertTriangle } from 'lucide-react'
import {
  conditionsApi,
  type CreateConditionRequest,
  type ConditionLevel,
} from '../api/conditions.api'
import { http } from '../api/http'
import { parseApiError, isSessionExpired, type ParsedError } from '../utils/apiError'

interface CreateConditionModalProps {
  isOpen: boolean
  onClose: () => void
  transactionId: number
  currentStepOrder?: number
}

interface ConditionTemplate {
  id: number
  labelFr: string
  labelEn: string
  descriptionFr: string | null
  descriptionEn: string | null
  level: ConditionLevel
  sourceType: 'legal' | 'government' | 'industry' | 'best_practice'
  step: number | null
  pack: string | null
  category: string | null
}

interface ApplicableTemplatesResponse {
  success: boolean
  data?: {
    templates: ConditionTemplate[]
    profile: {
      propertyType: string
      propertyContext: string
      isFinanced: boolean
    }
  }
  error?: { message: string; code: string }
}

const LEVEL_OPTIONS: { value: ConditionLevel; icon: React.ElementType; colorClass: string; bgClass: string }[] = [
  { value: 'blocking', icon: ShieldAlert, colorClass: 'text-red-600', bgClass: 'bg-red-50 border-red-200' },
  { value: 'required', icon: AlertCircle, colorClass: 'text-amber-600', bgClass: 'bg-amber-50 border-amber-200' },
  { value: 'recommended', icon: Lightbulb, colorClass: 'text-emerald-600', bgClass: 'bg-emerald-50 border-emerald-200' },
]

// SOURCE_TYPE_LABELS moved to translation files under conditions.sourceType.*

export default function CreateConditionModal({
  isOpen,
  onClose,
  transactionId,
  currentStepOrder,
}: CreateConditionModalProps) {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const [mode, setMode] = useState<'suggestions' | 'custom'>('suggestions')
  const [showAllSteps, setShowAllSteps] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState<ParsedError | null>(null)

  // Custom form state
  const [formData, setFormData] = useState<Omit<CreateConditionRequest, 'transactionId'> & { level: ConditionLevel }>({
    title: '',
    dueDate: '',
    description: '',
    type: 'other',
    priority: 'medium',
    isBlocking: true,
    level: 'required',
    documentUrl: '',
    documentLabel: '',
  })

  // Fetch applicable templates
  const { data: templatesData, isLoading: templatesLoading, error: templatesError } = useQuery({
    queryKey: ['applicable-templates', transactionId, currentStepOrder],
    queryFn: async () => {
      try {
        const response = await http.get<ApplicableTemplatesResponse['data']>(
          `/api/transactions/${transactionId}/applicable-templates${currentStepOrder ? `?step=${currentStepOrder}` : ''}`
        )
        return response.data ?? { templates: [], profile: null }
      } catch (err: any) {
        // 404 = no profile, return empty templates (not an error state)
        if (err?.response?.status === 404) {
          return { templates: [], profile: null }
        }
        throw err
      }
    },
    enabled: isOpen,
    staleTime: 30000,
  })

  // Fetch profile status separately to know if profile exists
  const { data: profileStatus } = useQuery({
    queryKey: ['profile-status', transactionId],
    queryFn: async () => {
      try {
        const response = await http.get<{ exists: boolean; complete: boolean; missingFields?: string[] }>(
          `/api/transactions/${transactionId}/profile/status`
        )
        return response.data
      } catch {
        return { exists: false, complete: false }
      }
    },
    enabled: isOpen,
    staleTime: 30000,
  })

  // Group templates by current step vs others
  const { currentStepTemplates, otherTemplates } = useMemo(() => {
    if (!templatesData?.templates) {
      return { currentStepTemplates: [], otherTemplates: [] }
    }

    const templates = templatesData.templates
    const current = templates.filter((t) => t.step === currentStepOrder || t.step === null)
    const other = templates.filter((t) => t.step !== currentStepOrder && t.step !== null)

    // Apply search filter
    const filterBySearch = (list: ConditionTemplate[]) => {
      if (!searchQuery.trim()) return list
      const q = searchQuery.toLowerCase()
      return list.filter((t) =>
        t.labelFr.toLowerCase().includes(q) ||
        t.labelEn.toLowerCase().includes(q) ||
        t.category?.toLowerCase().includes(q)
      )
    }

    return {
      currentStepTemplates: filterBySearch(current),
      otherTemplates: filterBySearch(other),
    }
  }, [templatesData, currentStepOrder, searchQuery])

  const invalidateAll = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['transaction', transactionId] }),
      queryClient.invalidateQueries({ queryKey: ['transactions'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      queryClient.invalidateQueries({ queryKey: ['advance-check', transactionId] }),
    ])
  }

  // Create condition from template
  const createFromTemplateMutation = useMutation({
    mutationFn: async (template: ConditionTemplate) => {
      // Calculate due date (14 days from now by default)
      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + 14)

      return conditionsApi.create({
        transactionId,
        title: i18n.language === 'fr' ? template.labelFr : template.labelEn,
        description: i18n.language === 'fr' ? template.descriptionFr || undefined : template.descriptionEn || undefined,
        dueDate: dueDate.toISOString().split('T')[0],
        level: template.level,
        isBlocking: template.level === 'blocking',
        type: 'other',
        priority: template.level === 'blocking' ? 'high' : template.level === 'required' ? 'medium' : 'low',
        templateId: template.id, // Link to template for deduplication
      })
    },
    onSuccess: async (response) => {
      if (response.success) {
        await invalidateAll()
        onClose()
        resetState()
      } else {
        setError({
          title: t('common.error'),
          message: response.error?.message || 'Failed to create condition',
        })
      }
    },
    onError: (err) => {
      const parsedError = parseApiError(err)
      setError(parsedError)
      if (isSessionExpired(err)) {
        setTimeout(() => navigate('/login'), 2000)
      }
    },
  })

  // Create custom condition
  const createCustomMutation = useMutation({
    mutationFn: conditionsApi.create,
    onSuccess: async (response) => {
      if (response.success) {
        await invalidateAll()
        onClose()
        resetState()
      } else {
        setError({
          title: t('common.error'),
          message: response.error?.message || 'Failed to create condition',
        })
      }
    },
    onError: (err) => {
      const parsedError = parseApiError(err)
      setError(parsedError)
      if (isSessionExpired(err)) {
        setTimeout(() => navigate('/login'), 2000)
      }
    },
  })

  const resetState = () => {
    setMode('suggestions')
    setShowAllSteps(false)
    setSearchQuery('')
    setError(null)
    setFormData({
      title: '',
      dueDate: '',
      description: '',
      type: 'other',
      priority: 'medium',
      isBlocking: true,
      level: 'required',
      documentUrl: '',
      documentLabel: '',
    })
  }

  const handleClose = () => {
    if (!createFromTemplateMutation.isPending && !createCustomMutation.isPending) {
      resetState()
      onClose()
    }
  }

  const handleTemplateClick = (template: ConditionTemplate) => {
    createFromTemplateMutation.mutate(template)
  }

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.title.trim() || !formData.dueDate) {
      setError({ title: t('common.error'), message: t('conditions.form.requiredFields') })
      return
    }

    createCustomMutation.mutate({
      transactionId,
      title: formData.title.trim(),
      dueDate: formData.dueDate,
      description: formData.description?.trim() || undefined,
      type: formData.type,
      priority: formData.priority,
      isBlocking: formData.level === 'blocking',
      level: formData.level,
      documentUrl: formData.documentUrl?.trim() || undefined,
      documentLabel: formData.documentLabel?.trim() || undefined,
    })
  }

  const getTemplateLabel = (template: ConditionTemplate) =>
    i18n.language === 'fr' ? template.labelFr : template.labelEn

  const getLevelConfig = (level: ConditionLevel) =>
    LEVEL_OPTIONS.find((o) => o.value === level) || LEVEL_OPTIONS[1]

  if (!isOpen) return null

  const isPending = createFromTemplateMutation.isPending || createCustomMutation.isPending
  const noProfile = templatesError && (templatesError as any)?.response?.data?.error?.code === 'E_PROFILE_NOT_FOUND'
  const hasTemplates = (currentStepTemplates.length + otherTemplates.length) > 0
  const profileIncomplete = profileStatus && profileStatus.exists && !profileStatus.complete
  const profileMissing = !profileStatus?.exists

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={handleClose} />

      <div className="relative z-10 flex min-h-full items-center justify-center p-4">
        <div className="w-full max-w-lg rounded-xl bg-white shadow-xl max-h-[85vh] flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">
              {t('conditions.form.title')}
            </h3>

            {/* Mode tabs */}
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => setMode('suggestions')}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  mode === 'suggestions'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {t('conditions.form.suggestions')}
              </button>
              <button
                type="button"
                onClick={() => setMode('custom')}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  mode === 'custom'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Plus className="w-4 h-4 inline mr-1" />
                {t('conditions.form.custom')}
              </button>
            </div>
          </div>

          {/* Error display */}
          {error && (
            <div className="mx-6 mt-4 rounded-md bg-red-50 border border-red-200 p-3">
              <p className="text-sm text-red-700">{error.message}</p>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {mode === 'suggestions' ? (
              <>
                {/* Debug info (temporary) */}
                {!templatesLoading && (
                  <div className="mb-3 p-2 rounded bg-slate-100 text-[10px] text-slate-500 font-mono">
                    📊 {t('conditions.debugInfo', {
                      count: templatesData?.templates?.length ?? 0,
                      step: currentStepOrder ?? '?',
                      status: profileMissing ? `❌ ${t('conditions.debugProfileAbsent')}` : profileIncomplete ? `⚠️ ${t('conditions.debugProfileIncomplete')}` : `✅ ${t('conditions.debugProfileComplete')}`
                    })}
                  </div>
                )}

                {/* No profile warning */}
                {(noProfile || profileMissing) && (
                  <div className="mb-4 p-4 rounded-lg bg-amber-50 border border-amber-200">
                    <div className="flex gap-3">
                      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-amber-800">
                          {t('conditions.form.noProfile')}
                        </p>
                        <p className="text-xs text-amber-600 mt-1">
                          {t('conditions.form.noProfileHint')}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Profile incomplete warning */}
                {profileIncomplete && !profileMissing && (
                  <div className="mb-4 p-4 rounded-lg bg-blue-50 border border-blue-200">
                    <div className="flex gap-3">
                      <AlertCircle className="w-5 h-5 text-blue-600 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-blue-800">
                          {t('conditions.form.profileIncomplete')}
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                          {t('conditions.form.profileIncompleteHint')}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Search - disabled when no templates */}
                <div className="relative mb-4">
                  <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${hasTemplates ? 'text-gray-400' : 'text-gray-300'}`} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={hasTemplates ? t('conditions.form.searchPlaceholder') : t('conditions.form.nothingToFilter')}
                    disabled={!hasTemplates}
                    className={`w-full pl-9 pr-4 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${
                      hasTemplates ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed'
                    }`}
                  />
                </div>

                {templatesLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <>
                    {/* Current step templates */}
                    {currentStepTemplates.length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">
                          {t('conditions.form.suggestionsForStep')}
                        </h4>
                        <div className="space-y-2">
                          {currentStepTemplates.map((template) => (
                            <TemplateItem
                              key={template.id}
                              template={template}
                              label={getTemplateLabel(template)}
                              levelConfig={getLevelConfig(template.level)}
                              isPending={isPending}
                              onClick={() => handleTemplateClick(template)}
                              t={t}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Other steps templates */}
                    {otherTemplates.length > 0 && (
                      <div>
                        <button
                          type="button"
                          onClick={() => setShowAllSteps(!showAllSteps)}
                          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-2"
                        >
                          {showAllSteps ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          {t('conditions.form.otherSteps')} ({otherTemplates.length})
                        </button>
                        {showAllSteps && (
                          <div className="space-y-2">
                            {otherTemplates.map((template) => (
                              <TemplateItem
                                key={template.id}
                                template={template}
                                label={getTemplateLabel(template)}
                                levelConfig={getLevelConfig(template.level)}
                                isPending={isPending}
                                onClick={() => handleTemplateClick(template)}
                                t={t}
                                showStep
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Empty state - all templates already used */}
                    {currentStepTemplates.length === 0 && otherTemplates.length === 0 && !noProfile && !profileMissing && (
                      <div className="text-center py-6 px-4">
                        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-50 flex items-center justify-center">
                          <Lightbulb className="w-6 h-6 text-green-500" />
                        </div>
                        <p className="text-sm font-medium text-gray-700 mb-1">
                          {t('conditions.form.allSuggestionsUsed')}
                        </p>
                        <p className="text-xs text-gray-500 mb-4">
                          {t('conditions.form.allSuggestionsUsedHint')}
                        </p>

                        {/* Prominent CTA */}
                        <button
                          type="button"
                          onClick={() => setMode('custom')}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          {t('conditions.form.createCustom')}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </>
            ) : (
              /* Custom form */
              <form onSubmit={handleCustomSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t('conditions.form.titleLabel')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t('conditions.form.dueDate')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                  />
                </div>

                {/* Level selector */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('conditions.form.level')} <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {LEVEL_OPTIONS.map((option) => {
                      const Icon = option.icon
                      const isSelected = formData.level === option.value
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, level: option.value })}
                          className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all ${
                            isSelected
                              ? `${option.bgClass} border-current ${option.colorClass}`
                              : 'border-gray-200 hover:border-gray-300 bg-white'
                          }`}
                        >
                          <Icon className={`w-5 h-5 ${isSelected ? '' : 'text-gray-400'}`} />
                          <span className={`text-xs font-medium ${isSelected ? '' : 'text-gray-600'}`}>
                            {t(`conditions.levels.${option.value}`)}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    {t(`conditions.form.levelHint.${formData.level}`)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t('conditions.form.description')}
                  </label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                  />
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isPending}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 disabled:opacity-50"
                  >
                    {isPending ? t('common.loading') : t('common.create')}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Footer for suggestions mode */}
          {mode === 'suggestions' && (
            <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
              <button
                type="button"
                onClick={handleClose}
                disabled={isPending}
                className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                {t('common.close')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* Template item component */
function TemplateItem({
  template,
  label,
  levelConfig,
  isPending,
  onClick,
  t,
  showStep = false,
}: {
  template: ConditionTemplate
  label: string
  levelConfig: typeof LEVEL_OPTIONS[number]
  isPending: boolean
  onClick: () => void
  t: (key: string) => string
  showStep?: boolean
}) {
  const Icon = levelConfig.icon

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isPending}
      className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all hover:shadow-sm disabled:opacity-50 ${levelConfig.bgClass}`}
    >
      <Icon className={`w-5 h-5 shrink-0 ${levelConfig.colorClass}`} />
      <div className="flex-1 text-left">
        <span className="text-sm font-medium text-gray-900">{label}</span>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={`text-[10px] font-medium ${levelConfig.colorClass}`}>
            {t(`conditions.levels.${template.level}`)}
          </span>
          {template.sourceType && (
            <span className="text-[10px] text-gray-400">
              • {t(`conditions.sourceType.${template.sourceType}`) || template.sourceType}
            </span>
          )}
          {showStep && template.step && (
            <span className="text-[10px] text-gray-400">
              • {t('conditions.stepLabel', { step: template.step })}
            </span>
          )}
        </div>
      </div>
      <Plus className="w-4 h-4 text-gray-400" />
    </button>
  )
}
