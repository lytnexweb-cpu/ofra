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
} from '../components/transaction'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/Tabs'
import { Button } from '../components/ui/Button'
import { AlertCircle, Loader2, RefreshCw } from 'lucide-react'
import ConditionsTab from '../components/transaction/ConditionsTab'
import OffersSection from '../components/OffersSection'
import DocumentsTab from '../components/transaction/DocumentsTab'
import TimelineTab from '../components/transaction/TimelineTab'
import NotesSection from '../components/transaction/NotesSection'

const TAB_KEYS = ['conditions', 'offers', 'documents', 'timeline', 'notes'] as const
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
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  // Error
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center" data-testid="detail-error">
        <AlertCircle className="w-10 h-10 text-destructive mb-3" />
        <p className="text-sm text-muted-foreground mb-4">{t('common.error')}</p>
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
        <p className="text-sm text-muted-foreground mb-4">{t('common.noResults')}</p>
        <Link to="/transactions">
          <Button variant="outline">{t('common.back')}</Button>
        </Link>
      </div>
    )
  }

  return (
    <div data-testid="transaction-detail-page">
      <TransactionHeader transaction={transaction} />

      {/* Stepper — desktop: horizontal bar, mobile: pill + sheet */}
      {steps.length > 0 && (
        <>
          <StepProgressBar steps={steps} currentStepId={transaction.currentStepId} />
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
          />
        </>
      )}

      {/* Action Zone — between stepper and tabs */}
      <ActionZone transaction={transaction} />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="w-full overflow-x-auto justify-start" data-testid="detail-tabs">
          {TAB_KEYS.map((key) => (
            <TabsTrigger key={key} value={key} data-testid={`tab-${key}`}>
              {t(`tabs.${key}`)}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="conditions">
          <ConditionsTab transaction={transaction} />
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

        <TabsContent value="timeline">
          <TimelineTab transactionId={transactionId} />
        </TabsContent>

        <TabsContent value="notes">
          <NotesSection transactionId={transactionId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
