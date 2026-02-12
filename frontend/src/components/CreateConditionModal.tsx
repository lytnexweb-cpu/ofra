import { useState, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, X, Info, Sparkles, Calendar, Check, Ban, ClipboardList, Home } from 'lucide-react'
import {
  conditionsApi,
  type ConditionLevel,
  type ConditionTemplate,
  type Condition,
} from '../api/conditions.api'
import { toast } from '../hooks/use-toast'

interface CreateConditionModalProps {
  isOpen: boolean
  onClose: () => void
  transactionId: number
  currentStepOrder?: number
  /** Existing conditions on transaction (for "already present" check) */
  existingConditions?: Condition[]
}

type ModalMode = 'manual' | 'pack' | 'packSuccess'

interface PackResult {
  packName: string
  added: number
  ignored: number
  blocking: number
  required: number
  recommended: number
  stepOrder: number
}

const LEVEL_BADGES: Record<ConditionLevel, { classes: string }> = {
  blocking: { classes: 'bg-red-100 text-red-700' },
  required: { classes: 'bg-amber-100 text-amber-700' },
  recommended: { classes: 'bg-emerald-100 text-emerald-700' },
}

export default function CreateConditionModal({
  isOpen,
  onClose,
  transactionId,
  currentStepOrder,
  existingConditions,
}: CreateConditionModalProps) {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()

  const [mode, setMode] = useState<ModalMode>('manual')

  // Manual mode state
  const [name, setName] = useState('')
  const [level, setLevel] = useState<ConditionLevel | null>(null)
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 14)
    return d.toISOString().split('T')[0]
  })
  const [note, setNote] = useState('')

  // Pack mode state
  const [excludedTemplateIds, setExcludedTemplateIds] = useState<Set<number>>(new Set())
  const [packResult, setPackResult] = useState<PackResult | null>(null)

  // Fetch applicable templates for pack mode
  const { data: templatesData, isLoading: templatesLoading } = useQuery({
    queryKey: ['applicable-templates', transactionId, currentStepOrder],
    queryFn: () => conditionsApi.getApplicableTemplates(transactionId, currentStepOrder),
    enabled: isOpen,
    staleTime: 30000,
  })

  const templates = templatesData?.data?.templates ?? []
  const existingTemplateIds = useMemo(() => {
    const ids = new Set<number>()
    for (const c of existingConditions ?? []) {
      if (c.templateId) ids.add(c.templateId)
    }
    return ids
  }, [existingConditions])

  // Group templates: already present vs new
  const { alreadyPresent, newTemplates } = useMemo(() => {
    const present: ConditionTemplate[] = []
    const fresh: ConditionTemplate[] = []
    for (const tpl of templates) {
      if (existingTemplateIds.has(tpl.id)) {
        present.push(tpl)
      } else {
        fresh.push(tpl)
      }
    }
    return { alreadyPresent: present, newTemplates: fresh }
  }, [templates, existingTemplateIds])

  const selectedNewTemplates = newTemplates.filter((t) => !excludedTemplateIds.has(t.id))
  const packName = templates[0]?.pack
    ? templates[0].pack.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    : 'Universal'

  // Step name for subtitle
  const stepSubtitle = currentStepOrder
    ? `${t('addCondition.stepPrefix', 'Étape')} ${currentStepOrder}`
    : undefined

  // Manual CTA validation
  const canAddManual = name.trim().length > 0 && level !== null

  // Invalidate queries helper
  const invalidateAll = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['transaction', transactionId] }),
      queryClient.invalidateQueries({ queryKey: ['transactions'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      queryClient.invalidateQueries({ queryKey: ['advance-check', transactionId] }),
      queryClient.invalidateQueries({ queryKey: ['applicable-templates', transactionId] }),
    ])
  }, [queryClient, transactionId])

  // Manual create mutation
  const manualMutation = useMutation({
    mutationFn: () =>
      conditionsApi.create({
        transactionId,
        title: name.trim(),
        level: level!,
        isBlocking: level === 'blocking',
        dueDate,
        description: note.trim() || undefined,
        type: 'other',
        priority: level === 'blocking' ? 'high' : level === 'required' ? 'medium' : 'low',
      }),
    onSuccess: async (response) => {
      if (response.success) {
        await invalidateAll()
        toast({ title: t('addCondition.successManual', 'Condition ajoutée'), variant: 'success' })
        resetAndClose()
      } else {
        toast({ title: t('common.error'), description: response.error?.message, variant: 'destructive' })
      }
    },
    onError: (err: Error) => {
      toast({ title: t('common.error'), description: err.message, variant: 'destructive' })
    },
  })

  // Pack load mutation
  const packMutation = useMutation({
    mutationFn: async () => {
      const results = await Promise.allSettled(
        selectedNewTemplates.map((tpl) =>
          conditionsApi.create({
            transactionId,
            title: i18n.language === 'fr' ? tpl.labelFr : tpl.labelEn,
            description: i18n.language === 'fr' ? tpl.descriptionFr || undefined : tpl.descriptionEn || undefined,
            dueDate,
            level: tpl.level,
            isBlocking: tpl.level === 'blocking',
            type: 'other',
            priority: tpl.level === 'blocking' ? 'high' : tpl.level === 'required' ? 'medium' : 'low',
            templateId: tpl.id,
          })
        )
      )
      const succeeded = results.filter((r) => r.status === 'fulfilled').length
      const blocking = selectedNewTemplates.filter((t) => t.level === 'blocking').length
      const required = selectedNewTemplates.filter((t) => t.level === 'required').length
      const recommended = selectedNewTemplates.filter((t) => t.level === 'recommended').length
      return { succeeded, blocking, required, recommended }
    },
    onSuccess: async (result) => {
      await invalidateAll()
      setPackResult({
        packName,
        added: result.succeeded,
        ignored: alreadyPresent.length,
        blocking: result.blocking,
        required: result.required,
        recommended: result.recommended,
        stepOrder: currentStepOrder ?? 0,
      })
      setMode('packSuccess')
    },
    onError: (err: Error) => {
      toast({ title: t('common.error'), description: err.message, variant: 'destructive' })
    },
  })

  const isLoading = manualMutation.isPending || packMutation.isPending

  const resetAndClose = useCallback(() => {
    setMode('manual')
    setName('')
    setLevel(null)
    setDueDate(() => {
      const d = new Date()
      d.setDate(d.getDate() + 14)
      return d.toISOString().split('T')[0]
    })
    setNote('')
    setExcludedTemplateIds(new Set())
    setPackResult(null)
    onClose()
  }, [onClose])

  const handleClose = useCallback(() => {
    if (isLoading) return
    resetAndClose()
  }, [isLoading, resetAndClose])

  const toggleTemplate = useCallback((id: number) => {
    setExcludedTemplateIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  if (!isOpen) return null

  const getTemplateLabel = (tpl: ConditionTemplate) =>
    i18n.language === 'fr' ? tpl.labelFr : tpl.labelEn

  // ── Success State ──
  if (mode === 'packSuccess' && packResult) {
    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
        <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg mx-0 sm:mx-4 max-h-[92vh] sm:max-h-[calc(100%-2rem)] flex flex-col">
          {/* Mobile drag handle */}
          <div className="flex justify-center pt-2 pb-1 sm:hidden">
            <div className="w-10 h-1 rounded-full bg-stone-300" />
          </div>

          {/* Success header */}
          <div className="px-5 sm:px-6 py-5 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
              <Check className="w-7 h-7 text-emerald-600" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-stone-900">
              {t('addCondition.successTitle', 'Pack chargé !')}
            </h2>
            <p className="text-sm text-stone-500 mt-1">
              {packResult.packName} — {packResult.added} {t('addCondition.conditionsAdded', 'conditions ajoutées')}
            </p>
          </div>

          {/* Summary cards */}
          <div className="flex-1 overflow-y-auto min-h-0 px-5 sm:px-6 pb-5 space-y-2">
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50 border border-emerald-100">
              <Plus className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="text-xs text-emerald-800">
                {packResult.added} {t('addCondition.successAddedToStep', 'conditions ajoutées à l\'étape')} {packResult.stepOrder}
              </span>
            </div>
            {packResult.ignored > 0 && (
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-stone-50 border border-stone-200">
                <Ban className="w-4 h-4 text-stone-500 shrink-0" />
                <span className="text-xs text-stone-600">
                  {packResult.ignored} {t('addCondition.successIgnored', 'conditions ignorées (déjà présentes)')}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-[#1e3a5f]/5 border border-[#1e3a5f]/10">
              <ClipboardList className="w-4 h-4 text-[#1e3a5f] shrink-0" />
              <span className="text-xs text-[#1e3a5f]">
                {t('addCondition.successDistribution', 'Répartition')} : {packResult.blocking} {t('addCondition.levelBlocking', 'bloquantes')}, {packResult.required} {t('addCondition.levelRequired', 'requises')}, {packResult.recommended} {t('addCondition.levelRecommended', 'recommandées')}
              </span>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-stone-50 border border-stone-200">
              <Calendar className="w-4 h-4 text-stone-500 shrink-0" />
              <span className="text-xs text-stone-600">
                {t('addCondition.successDates', 'Échéances alignées sur l\'étape — modifiables individuellement')}
              </span>
            </div>
          </div>

          {/* CTA */}
          <div className="px-5 sm:px-6 py-4 bg-stone-50 border-t border-stone-100 text-center">
            <button
              onClick={handleClose}
              className="px-6 py-2.5 rounded-lg bg-[#1e3a5f] hover:bg-[#1e3a5f]/90 text-white text-sm font-semibold shadow-sm"
            >
              {t('addCondition.backToTransaction', 'Retour à la transaction')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Manual / Pack State ──
  const isManual = mode === 'manual'
  const isPack = mode === 'pack'

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
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                isManual ? 'bg-[#1e3a5f]/10' : 'bg-[#e07a2f]/10'
              }`}>
                {isManual ? (
                  <Plus className="w-5 h-5 text-[#1e3a5f]" />
                ) : (
                  <Sparkles className="w-5 h-5 text-[#e07a2f]" />
                )}
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-stone-900">
                  {isManual
                    ? t('addCondition.title', 'Ajouter une condition')
                    : t('addCondition.packTitle', 'Pack recommandé')}
                </h2>
                {stepSubtitle && (
                  <p className="text-xs text-stone-500 mt-0.5">{stepSubtitle}</p>
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

          {/* Mode switcher */}
          <div className="flex gap-2 mt-3">
            <button
              type="button"
              onClick={() => setMode('manual')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                isManual
                  ? 'bg-[#1e3a5f] text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {t('addCondition.manualTab', 'Ajout manuel')}
            </button>
            <button
              type="button"
              onClick={() => setMode('pack')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                isPack
                  ? 'bg-[#1e3a5f] text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {t('addCondition.packTab', 'Pack recommandé')}
            </button>
          </div>
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto min-h-0 px-5 sm:px-6 py-4 space-y-4">
          {isManual ? (
            <ManualForm
              name={name}
              setName={setName}
              level={level}
              setLevel={setLevel}
              dueDate={dueDate}
              setDueDate={setDueDate}
              note={note}
              setNote={setNote}
              isLoading={isLoading}
              t={t}
            />
          ) : (
            <PackForm
              templates={templates}
              alreadyPresent={alreadyPresent}
              newTemplates={newTemplates}
              excludedTemplateIds={excludedTemplateIds}
              onToggle={toggleTemplate}
              selectedCount={selectedNewTemplates.length}
              packName={packName}
              templatesLoading={templatesLoading}
              getLabel={getTemplateLabel}
              t={t}
            />
          )}
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

          {isManual ? (
            <button
              type="button"
              onClick={() => manualMutation.mutate()}
              disabled={!canAddManual || isLoading}
              className={[
                'px-6 py-2.5 rounded-lg text-sm font-semibold shadow-sm flex items-center justify-center gap-2',
                canAddManual && !isLoading
                  ? 'bg-[#1e3a5f] hover:bg-[#1e3a5f]/90 text-white'
                  : 'bg-stone-300 text-stone-500 cursor-not-allowed',
              ].join(' ')}
            >
              {isLoading ? (
                <>
                  <span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full inline-block" />
                  {t('addCondition.adding', 'Ajout en cours...')}
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  {t('addCondition.addManual', 'Ajouter la condition')}
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => packMutation.mutate()}
              disabled={selectedNewTemplates.length === 0 || isLoading}
              className={[
                'px-6 py-2.5 rounded-lg text-sm font-semibold shadow-sm flex items-center justify-center gap-2',
                selectedNewTemplates.length > 0 && !isLoading
                  ? 'bg-[#e07a2f] hover:bg-[#e07a2f]/90 text-white'
                  : 'bg-stone-300 text-stone-500 cursor-not-allowed',
              ].join(' ')}
            >
              {isLoading ? (
                <>
                  <span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full inline-block" />
                  {t('addCondition.loading', 'Chargement...')}
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  {t('addCondition.loadPack', 'Charger')} {selectedNewTemplates.length} {t('addCondition.conditionsWord', 'conditions')}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── Manual Form ─────────────────────────────────── */

function ManualForm({
  name, setName, level, setLevel, dueDate, setDueDate, note, setNote, isLoading, t,
}: {
  name: string
  setName: (v: string) => void
  level: ConditionLevel | null
  setLevel: (v: ConditionLevel) => void
  dueDate: string
  setDueDate: (v: string) => void
  note: string
  setNote: (v: string) => void
  isLoading: boolean
  t: (key: string, fallback?: string) => string
}) {
  return (
    <>
      {/* Info banner */}
      <div className="rounded-lg bg-[#1e3a5f]/5 border border-[#1e3a5f]/10 px-3 py-2 flex items-start gap-2">
        <Info className="w-4 h-4 text-[#1e3a5f] mt-0.5 shrink-0" />
        <p className="text-xs text-[#1e3a5f]/80">
          {t('addCondition.manualInfo', 'Ajout manuel — cette condition sera marquée')}{' '}
          <span className="inline-flex items-center px-1 py-0.5 rounded text-[10px] font-medium bg-violet-100 text-violet-700">
            {t('addCondition.manualBadge', 'Manuelle')}
          </span>{' '}
          {t('addCondition.manualInfoSuffix', 'dans le suivi.')}
        </p>
      </div>

      {/* Name */}
      <div>
        <label className="block text-xs font-semibold text-stone-600 mb-1.5 uppercase tracking-wide">
          {t('addCondition.nameLabel', 'Nom de la condition')} <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('addCondition.namePlaceholder', 'Ex : Vérification de la toiture')}
          className="w-full px-3 py-2.5 text-sm rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20"
          disabled={isLoading}
        />
      </div>

      {/* Level radio cards */}
      <div>
        <label className="block text-xs font-semibold text-stone-600 mb-2 uppercase tracking-wide">
          {t('addCondition.levelLabel', 'Niveau')} <span className="text-red-400">*</span>
        </label>
        <div className="space-y-2">
          <LevelCard
            value="blocking"
            selected={level === 'blocking'}
            onSelect={() => setLevel('blocking')}
            label={t('addCondition.levelBlocking', 'Bloquante')}
            description={t('addCondition.levelBlockingDesc', 'Empêche la validation de l\'étape tant qu\'elle n\'est pas résolue')}
            badgeClasses="bg-red-100 text-red-700"
          />
          <LevelCard
            value="required"
            selected={level === 'required'}
            onSelect={() => setLevel('required')}
            label={t('addCondition.levelRequired', 'Requise')}
            description={t('addCondition.levelRequiredDesc', 'Doit être résolue, mais peut être passée avec risque si nécessaire')}
            badgeClasses="bg-amber-100 text-amber-700"
          />
          <LevelCard
            value="recommended"
            selected={level === 'recommended'}
            onSelect={() => setLevel('recommended')}
            label={t('addCondition.levelRecommended', 'Recommandée')}
            description={t('addCondition.levelRecommendedDesc', 'Bonne pratique — auto-archivée si non résolue à la validation')}
            badgeClasses="bg-stone-200 text-stone-600"
          />
        </div>
      </div>

      {/* Due date */}
      <div>
        <label className="block text-xs font-semibold text-stone-600 mb-1.5 uppercase tracking-wide">
          {t('addCondition.dueDateLabel', 'Échéance')}
        </label>
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="w-full px-3 py-2.5 text-sm rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20"
          disabled={isLoading}
        />
        <p className="text-xs text-stone-400 mt-1">
          {t('addCondition.dueDateHint', 'Par défaut : aligné sur l\'échéance de l\'étape')}
        </p>
      </div>

      {/* Note */}
      <div>
        <label className="block text-xs font-medium text-stone-600 mb-1">
          {t('addCondition.noteLabel', 'Note (optionnel)')}
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder={t('addCondition.notePlaceholder', 'Ex : Demandé par l\'acheteur suite à l\'inspection...')}
          className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 resize-none"
          disabled={isLoading}
        />
      </div>
    </>
  )
}

/* ─── Pack Form ───────────────────────────────────── */

function PackForm({
  templates,
  alreadyPresent,
  newTemplates,
  excludedTemplateIds,
  onToggle,
  selectedCount,
  packName,
  templatesLoading,
  getLabel,
  t,
}: {
  templates: ConditionTemplate[]
  alreadyPresent: ConditionTemplate[]
  newTemplates: ConditionTemplate[]
  excludedTemplateIds: Set<number>
  onToggle: (id: number) => void
  selectedCount: number
  packName: string
  templatesLoading: boolean
  getLabel: (t: ConditionTemplate) => string
  t: (key: string, fallback?: string) => string
}) {
  if (templatesLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="animate-spin w-6 h-6 border-2 border-[#1e3a5f]/20 border-t-[#1e3a5f] rounded-full" />
      </div>
    )
  }

  if (templates.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-3">
          <Sparkles className="w-6 h-6 text-stone-400" />
        </div>
        <p className="text-sm text-stone-500">
          {t('addCondition.noPackAvailable', 'Aucun pack recommandé disponible pour cette transaction.')}
        </p>
      </div>
    )
  }

  const totalConditions = templates.length

  return (
    <>
      {/* Pack info card */}
      <div className="rounded-lg bg-[#e07a2f]/5 border border-[#e07a2f]/20 p-3 sm:p-4">
        <div className="flex items-center gap-2 mb-2">
          {templates[0]?.pack && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-indigo-100 text-indigo-700">
              {packName}
            </span>
          )}
          {templates[0]?.sourceType && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-sky-100 text-sky-700">
              {templates[0].sourceType.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
            </span>
          )}
        </div>
        <h3 className="text-sm font-semibold text-stone-900 mb-1">Pack {packName}</h3>
        <p className="text-xs text-stone-500">
          {t('addCondition.packInfo', 'Conditions standard applicables à toutes les transactions résidentielles au Nouveau-Brunswick.')}
        </p>
        <div className="flex items-center gap-3 mt-2 pt-2 border-t border-[#e07a2f]/10">
          <span className="text-xs text-stone-500 flex items-center gap-1">
            <ClipboardList className="w-3.5 h-3.5" />
            {totalConditions} conditions
          </span>
          <span className="text-xs text-stone-500 flex items-center gap-1">
            <Home className="w-3.5 h-3.5" />
            {t('addCondition.packProfile', 'Profil : Résidentiel')}
          </span>
        </div>
      </div>

      {/* Additive mode info */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200">
        <Info className="w-4 h-4 text-emerald-600 shrink-0" />
        <span className="text-xs text-emerald-800">
          <strong>{t('addCondition.additiveMode', 'Mode additif')}</strong> — {t('addCondition.additiveInfo', 'les conditions déjà présentes ne seront pas dupliquées.')}
        </span>
      </div>

      {/* Conditions list */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold text-stone-600 uppercase tracking-wide">
            {t('addCondition.includedConditions', 'Conditions incluses')}
          </h3>
          <span className="text-xs text-stone-400">
            {selectedCount} {t('addCondition.selectedCount', 'sélectionnées')}
          </span>
        </div>
        <div className="space-y-1.5">
          {/* Already present (grayed out) */}
          {alreadyPresent.map((tpl) => (
            <div
              key={tpl.id}
              className="rounded-lg border border-stone-200 bg-stone-50 p-2.5 flex items-center gap-2.5 opacity-40"
            >
              <input
                type="checkbox"
                checked
                disabled
                className="w-4 h-4 rounded border-stone-300 text-stone-300 shrink-0 cursor-not-allowed"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs text-stone-400 line-through">{getLabel(tpl)}</span>
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${LEVEL_BADGES[tpl.level].classes}`}>
                    {t(`addCondition.level${tpl.level.charAt(0).toUpperCase() + tpl.level.slice(1)}`, tpl.level)}
                  </span>
                </div>
              </div>
              <span className="text-[10px] text-stone-400 italic shrink-0">
                {t('addCondition.alreadyPresent', 'Déjà présente')}
              </span>
            </div>
          ))}

          {/* New templates (toggleable) */}
          {newTemplates.map((tpl) => {
            const isIncluded = !excludedTemplateIds.has(tpl.id)
            return (
              <button
                key={tpl.id}
                type="button"
                onClick={() => onToggle(tpl.id)}
                className={`w-full rounded-lg border border-stone-200 bg-white p-2.5 flex items-center gap-2.5 text-left transition-opacity ${
                  isIncluded ? 'opacity-100' : 'opacity-40'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isIncluded}
                  readOnly
                  className="w-4 h-4 rounded border-[#1e3a5f]/30 text-[#1e3a5f] shrink-0 pointer-events-none"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`text-xs ${isIncluded ? 'text-stone-800' : 'text-stone-400 line-through'}`}>
                      {getLabel(tpl)}
                    </span>
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${LEVEL_BADGES[tpl.level].classes}`}>
                      {t(`addCondition.level${tpl.level.charAt(0).toUpperCase() + tpl.level.slice(1)}`, tpl.level)}
                    </span>
                    {tpl.sourceType && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-sky-100 text-sky-700">
                        {tpl.sourceType.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                      </span>
                    )}
                  </div>
                </div>
                {isIncluded && (
                  <span className="text-[10px] text-emerald-600 font-medium shrink-0">
                    {t('addCondition.new', 'Nouvelle')}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Default due date info */}
      <div className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2.5">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-stone-400 shrink-0" />
          <span className="text-xs text-stone-600">
            {t('addCondition.dueDateInfo', 'Échéances : alignées automatiquement sur l\'échéance de l\'étape (modifiables après ajout)')}
          </span>
        </div>
      </div>
    </>
  )
}

/* ─── Level Radio Card ────────────────────────────── */

function LevelCard({
  value,
  selected,
  onSelect,
  label,
  description,
  badgeClasses,
}: {
  value: ConditionLevel
  selected: boolean
  onSelect: () => void
  label: string
  description: string
  badgeClasses: string
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        'w-full text-left rounded-lg border-2 p-3 transition-all',
        selected
          ? 'border-[#1e3a5f] bg-[#1e3a5f]/5 shadow-[0_0_0_2px_rgba(30,58,95,0.15)]'
          : 'border-stone-200 bg-white hover:border-[#1e3a5f] cursor-pointer',
      ].join(' ')}
    >
      <div className="flex items-start gap-3">
        {/* Radio indicator */}
        <div className="mt-0.5 shrink-0">
          {selected ? (
            <div className="w-4 h-4 rounded-full bg-[#1e3a5f] flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-white" />
            </div>
          ) : (
            <div className="w-4 h-4 rounded-full border-2 border-stone-300" />
          )}
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-stone-900">{label}</span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${badgeClasses}`}>
              {label}
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">{description}</p>
        </div>
      </div>
    </button>
  )
}
