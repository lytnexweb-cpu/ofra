import { useState, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ShieldAlert, AlertCircle, Lightbulb, Loader2, X, Sparkles } from 'lucide-react'
import {
  conditionsApi,
  type ConditionTemplate,
  type ConditionLevel,
  type CreateConditionRequest,
} from '../../api/conditions.api'
import type { Transaction, TransactionStep } from '../../api/transactions.api'
import { toast } from '../../hooks/use-toast'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { Button } from '../ui/Button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '../ui/Sheet'

interface SuggestionsPanelProps {
  isOpen: boolean
  onClose: () => void
  transaction: Transaction
  closingDate?: string | null
}

const LEVEL_CONFIG: Record<ConditionLevel, {
  icon: React.ElementType
  colorClass: string
  bgClass: string
  dotClass: string
  label: string
}> = {
  blocking: {
    icon: ShieldAlert,
    colorClass: 'text-red-600',
    bgClass: 'bg-red-50 border-red-200',
    dotClass: 'bg-red-500',
    label: 'Block',
  },
  required: {
    icon: AlertCircle,
    colorClass: 'text-amber-600',
    bgClass: 'bg-amber-50 border-amber-200',
    dotClass: 'bg-amber-500',
    label: 'Req.',
  },
  recommended: {
    icon: Lightbulb,
    colorClass: 'text-emerald-600',
    bgClass: 'bg-emerald-50 border-emerald-200',
    dotClass: 'bg-emerald-500',
    label: 'Reco',
  },
}

function getDeadlineDays(template: ConditionTemplate): string {
  if (!template.defaultDeadlineDays) return ''
  return `+${template.defaultDeadlineDays}j`
}

function calculateDueDate(template: ConditionTemplate, closingDate?: string | null): string {
  const offsetDays = template.defaultDeadlineDays ?? 14
  const ref = template.deadlineReference

  // If reference is closing_date and we have a closing date, offset from that
  if (ref === 'closing_date' && closingDate) {
    const base = new Date(closingDate)
    base.setDate(base.getDate() - offsetDays) // Before closing
    return base.toISOString().split('T')[0]
  }

  // Default: offset from today (acceptance date approximation)
  const base = new Date()
  base.setDate(base.getDate() + offsetDays)
  return base.toISOString().split('T')[0]
}

export default function SuggestionsPanel({
  isOpen,
  onClose,
  transaction,
  closingDate,
}: SuggestionsPanelProps) {
  const { t, i18n } = useTranslation()
  const isDesktop = useMediaQuery('(min-width: 640px)')
  const queryClient = useQueryClient()
  const isFr = i18n.language === 'fr'

  // Current step info for filtering templates
  const currentStep = transaction.currentStep
  const currentStepOrder = currentStep?.stepOrder

  // Fetch applicable templates
  const { data: templatesData, isLoading } = useQuery({
    queryKey: ['applicable-templates', transaction.id, currentStepOrder],
    queryFn: async () => {
      try {
        const response = await conditionsApi.getApplicableTemplates(
          transaction.id,
          currentStepOrder
        )
        return response.data ?? { templates: [], profile: null }
      } catch (err: any) {
        // 404 = no profile, return empty
        if (err?.response?.status === 404) {
          return { templates: [], profile: null }
        }
        throw err
      }
    },
    enabled: isOpen,
    staleTime: 30000,
  })

  const templates = templatesData?.templates ?? []
  const profile = templatesData?.profile

  // Selection state: blocking/required pre-checked, recommended unchecked
  const [selection, setSelection] = useState<Set<number>>(new Set())
  const [initialized, setInitialized] = useState(false)

  // Initialize selection when templates load
  useMemo(() => {
    if (templates.length > 0 && !initialized) {
      const preChecked = new Set<number>()
      for (const t of templates) {
        if (t.level === 'blocking' || t.level === 'required') {
          preChecked.add(t.id)
        }
      }
      setSelection(preChecked)
      setInitialized(true)
    }
  }, [templates, initialized])

  const toggleTemplate = useCallback((id: number) => {
    setSelection((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const selectedCount = selection.size

  // Group templates by level for display
  const grouped = useMemo(() => {
    const blocking: ConditionTemplate[] = []
    const required: ConditionTemplate[] = []
    const recommended: ConditionTemplate[] = []
    for (const t of templates) {
      if (t.level === 'blocking') blocking.push(t)
      else if (t.level === 'required') required.push(t)
      else recommended.push(t)
    }
    return { blocking, required, recommended }
  }, [templates])

  // Find the transaction step ID for the current step
  const currentTransactionStepId = useMemo(() => {
    const step = transaction.transactionSteps?.find(
      (s: TransactionStep) => s.stepOrder === currentStepOrder
    )
    return step?.id
  }, [transaction.transactionSteps, currentStepOrder])

  // Batch create mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      const selectedTemplates = templates.filter((t) => selection.has(t.id))
      const results = []

      for (const template of selectedTemplates) {
        const payload: CreateConditionRequest = {
          transactionId: transaction.id,
          title: isFr ? template.labelFr : template.labelEn,
          description: isFr ? (template.descriptionFr ?? '') : (template.descriptionEn ?? ''),
          dueDate: calculateDueDate(template, closingDate),
          level: template.level,
          templateId: template.id,
          isBlocking: template.level === 'blocking',
          type: 'other',
          priority: template.level === 'blocking' ? 'high' : template.level === 'required' ? 'medium' : 'low',
        }

        if (currentTransactionStepId) {
          payload.transactionStepId = currentTransactionStepId
        }

        try {
          const res = await conditionsApi.create(payload)
          results.push(res)
        } catch {
          // Continue with remaining — partial success is acceptable
        }
      }

      return results
    },
    onSuccess: (results) => {
      const successCount = results.filter((r) => r.success).length
      queryClient.invalidateQueries({ queryKey: ['transaction', transaction.id] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['applicable-templates', transaction.id] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })

      toast({
        title: t('common.success'),
        description: t('suggestions.added', { count: successCount }),
        variant: 'success',
      })
      onClose()
    },
    onError: () => {
      toast({
        title: t('common.error'),
        description: t('suggestions.addError', 'Erreur lors de l\'ajout'),
        variant: 'destructive',
      })
    },
  })

  // Profile summary text
  const profileSummary = useMemo(() => {
    if (!profile) return null
    const parts = []
    if (transaction.type === 'purchase') parts.push(t('transaction.purchase'))
    else parts.push(t('transaction.sale'))

    const ctxMap: Record<string, string> = {
      urban: t('transaction.profile.urban', 'Urbain'),
      suburban: t('transaction.profile.suburban', 'Banlieue'),
      rural: t('transaction.profile.rural', 'Rural'),
    }
    const typeMap: Record<string, string> = {
      house: t('transaction.profile.house', 'Maison'),
      condo: t('transaction.profile.condo', 'Condo'),
      land: t('transaction.profile.land', 'Terrain'),
    }

    if (ctxMap[profile.propertyContext]) parts.push(ctxMap[profile.propertyContext])
    if (typeMap[profile.propertyType]) parts.push(typeMap[profile.propertyType].toLowerCase())
    if (profile.isFinanced) parts.push(t('transaction.profile.financed', 'financé').toLowerCase())

    return parts.join(' · ')
  }, [profile, transaction.type, t])

  const renderTemplateRow = (template: ConditionTemplate) => {
    const config = LEVEL_CONFIG[template.level] || LEVEL_CONFIG.recommended
    const Icon = config.icon
    const isChecked = selection.has(template.id)
    const label = isFr ? template.labelFr : template.labelEn
    const deadlineDays = getDeadlineDays(template)

    return (
      <label
        key={template.id}
        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
          isChecked ? config.bgClass : 'border-border hover:border-border/80 bg-background'
        }`}
      >
        <input
          type="checkbox"
          checked={isChecked}
          onChange={() => toggleTemplate(template.id)}
          className="h-4 w-4 rounded border-input accent-primary shrink-0"
        />
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium text-foreground truncate block">
            {label}
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`inline-flex items-center gap-1 text-xs font-medium ${config.colorClass}`}>
            <Icon className="w-3 h-3" />
            {config.label}
          </span>
          {deadlineDays && (
            <span className="text-xs text-muted-foreground">{deadlineDays}</span>
          )}
        </div>
      </label>
    )
  }

  const panelContent = (
    <div className="flex flex-col h-full">
      {/* Profile summary */}
      {profileSummary && (
        <div className="px-1 pb-3">
          <p className="text-xs text-muted-foreground">
            {t('suggestions.basedOn', 'Basé sur')} : {profileSummary}
          </p>
        </div>
      )}

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : templates.length === 0 ? (
        <div className="flex-1 flex items-center justify-center py-12 text-center">
          <p className="text-sm text-muted-foreground">
            {t('suggestions.empty', 'Aucune suggestion disponible pour cette transaction.')}
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-2 pb-4">
          {grouped.blocking.length > 0 && (
            <>
              {grouped.blocking.map(renderTemplateRow)}
            </>
          )}
          {grouped.required.length > 0 && (
            <>
              {grouped.required.map(renderTemplateRow)}
            </>
          )}
          {grouped.recommended.length > 0 && (
            <>
              {grouped.recommended.map(renderTemplateRow)}
            </>
          )}
        </div>
      )}
    </div>
  )

  const footer = (
    <>
      <div className="text-sm text-muted-foreground">
        {selectedCount > 0
          ? t('suggestions.selectedCount', '{{count}} sélectionnée(s)', { count: selectedCount })
          : t('suggestions.noneSelected', 'Aucune sélectionnée')}
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={onClose} disabled={createMutation.isPending}>
          {t('common.close', 'Fermer')}
        </Button>
        <Button
          onClick={() => createMutation.mutate()}
          disabled={selectedCount === 0 || createMutation.isPending}
        >
          {createMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin mr-1" />
          ) : null}
          {t('suggestions.add', 'Ajouter')} ({selectedCount})
        </Button>
      </div>
    </>
  )

  const title = (
    <div className="flex items-center gap-2">
      <Sparkles className="w-4 h-4 text-primary" />
      <span>{t('suggestions.title', 'Suggestions')}</span>
      {currentStep?.workflowStep && (
        <span className="text-xs font-normal text-muted-foreground">
          — {currentStep.workflowStep.name}
        </span>
      )}
    </div>
  )

  // Desktop: right slide-in panel
  if (isDesktop) {
    return (
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent side="right" className="w-[400px] sm:max-w-[400px] flex flex-col">
          <SheetHeader>
            <SheetTitle>{title}</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-hidden py-4">
            {panelContent}
          </div>
          <SheetFooter className="flex-row items-center justify-between border-t pt-4">
            {footer}
          </SheetFooter>
        </SheetContent>
      </Sheet>
    )
  }

  // Mobile: bottom sheet
  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="max-h-[80vh] flex flex-col">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-hidden py-4">
          {panelContent}
        </div>
        <SheetFooter className="flex-row items-center justify-between border-t pt-4">
          {footer}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
