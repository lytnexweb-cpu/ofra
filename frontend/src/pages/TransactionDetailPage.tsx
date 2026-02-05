import { useState, useEffect } from 'react'
import { useParams, Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { transactionsApi } from '../api/transactions.api'
import {
  TransactionHeader,
  StepProgressBar,
  StepperPill,
  StepperBottomSheet,
  ActionZone,
  TransactionBottomNav,
} from '../components/transaction'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/Tabs'
import { Button } from '../components/ui/Button'
import { AlertCircle, Loader2, RefreshCw } from 'lucide-react'
import ConditionsTab from '../components/transaction/ConditionsTab'
import OffersSection from '../components/OffersSection'
import DocumentsTab from '../components/transaction/DocumentsTab'
import WorkflowTimeline from '../components/transaction/WorkflowTimeline'
import NotesSection from '../components/transaction/NotesSection'

const TAB_KEYS = ['conditions', 'offers', 'documents', 'steps', 'notes'] as const
type TabKey = (typeof TAB_KEYS)[number]

export default function TransactionDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const transactionId = Number(id)
  const [searchParams, setSearchParams] = useSearchParams()

  const tabParam = searchParams.get('tab') as TabKey | null
  const activeTab = TAB_KEYS.includes(tabParam as TabKey) ? tabParam! : 'conditions'
  const highlightId = searchParams.get('highlight')

  const [isStepperOpen, setIsStepperOpen] = useState(false)
  // D32: Selected step for filtering conditions
  const [selectedStepId, setSelectedStepId] = useState<number | null>(null)

  // D32: When a step is clicked, switch to conditions tab and filter
  const handleStepClick = (stepId: number | null) => {
    setSelectedStepId(stepId)
    // If selecting a step (not deselecting), switch to conditions tab
    if (stepId !== null && activeTab !== 'conditions') {
      handleTabChange('conditions')
    }
  }

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['transaction', transactionId],
    queryFn: () => transactionsApi.get(transactionId),
    staleTime: 0,
    enabled: !!id,
  })

  const transaction = data?.data?.transaction
  const steps = transaction?.transactionSteps ?? []

  // Scroll to highlighted condition when tab + highlight params are set
  useEffect(() => {
    if (highlightId && activeTab === 'conditions') {
      const el = document.querySelector(`[data-condition-id="${highlightId}"]`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        el.classList.add('ring-2', 'ring-primary')
        const timeout = setTimeout(() => el.classList.remove('ring-2', 'ring-primary'), 3000)
        return () => clearTimeout(timeout)
      }
    }
  }, [highlightId, activeTab, transaction])

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams)
    params.set('tab', value)
    params.delete('highlight')
    setSearchParams(params, { replace: true })
  }

  // Loading
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-16" data-testid="detail-loading">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  // Error
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center" data-testid="detail-error">
        <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
        <p className="text-sm text-stone-500 mb-4">{t('common.error')}</p>
        <Button variant="outline" onClick={() => refetch()} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          {t('common.retry')}
        </Button>
      </div>
    )
  }

  // Not found
  if (!transaction) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center" data-testid="detail-not-found">
        <p className="text-sm text-stone-500 mb-4">{t('common.noResults')}</p>
        <Link to="/transactions">
          <Button variant="outline">{t('common.back')}</Button>
        </Link>
      </div>
    )
  }

  return (
    <div data-testid="transaction-detail-page" className="overflow-x-hidden pb-20 lg:pb-0">
      <TransactionHeader transaction={transaction} />

      {/* Stepper — desktop: horizontal bar, mobile: pill + sheet */}
      {/* D32: Steps are clickable to filter conditions */}
      {steps.length > 0 && (
        <>
          <StepProgressBar
            steps={steps}
            currentStepId={transaction.currentStepId}
            selectedStepId={selectedStepId}
            onStepClick={handleStepClick}
          />
          <StepperPill
            steps={steps}
            currentStepId={transaction.currentStepId}
            onClick={() => setIsStepperOpen(true)}
          />
          <StepperBottomSheet
            isOpen={isStepperOpen}
            onClose={() => setIsStepperOpen(false)}
            steps={steps}
            currentStepId={transaction.currentStepId}
            selectedStepId={selectedStepId}
            onStepClick={handleStepClick}
          />
        </>
      )}

      {/* Action Zone — between stepper and tabs */}
      <ActionZone transaction={transaction} />

      {/* Tabs - Desktop only: horizontal tabs, Mobile: content only (nav at bottom) */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        {/* Desktop tabs header */}
        <div className="hidden lg:block w-full">
          <TabsList className="w-full flex overflow-x-auto" data-testid="detail-tabs">
            {TAB_KEYS.map((key) => (
              <TabsTrigger key={key} value={key} data-testid={`tab-${key}`} className="flex-1 min-w-0 whitespace-nowrap">
                {t(`tabs.${key}`)}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* Mobile: Section title */}
        <div className="lg:hidden flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-primary">
            {t(`tabs.${activeTab}`)}
          </h2>
        </div>

        <TabsContent value="conditions">
          {/* D32: Pass selectedStepId to filter conditions by step */}
          <ConditionsTab transaction={transaction} filterStepId={selectedStepId} />
        </TabsContent>

        <TabsContent value="offers">
          <OffersSection
            transactionId={transactionId}
            transactionStatus={transaction.currentStep?.workflowStep?.name || 'Completed'}
          />
        </TabsContent>

        <TabsContent value="documents">
          <DocumentsTab transaction={transaction} />
        </TabsContent>

        <TabsContent value="steps">
          <WorkflowTimeline transaction={transaction} />
        </TabsContent>

        <TabsContent value="notes">
          <NotesSection transactionId={transactionId} />
        </TabsContent>
      </Tabs>

      {/* Mobile Bottom Navigation */}
      <TransactionBottomNav
        activeTab={activeTab}
        onTabChange={(tab) => handleTabChange(tab)}
      />
    </div>
  )
}
