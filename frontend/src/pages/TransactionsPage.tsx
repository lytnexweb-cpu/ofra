import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { differenceInDays, parseISO } from '../lib/date'
import { transactionsApi, type Transaction } from '../api/transactions.api'
import type { Condition } from '../api/conditions.api'
import { normalizeSearch } from '../lib/utils'
import { TransactionCard, TransactionCardSkeleton, WeeklySummary, EmptyState, ReturnBanner } from '../components/transaction'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { AlertCircle, Plus, RefreshCw, Search, X } from 'lucide-react'

const STEP_SLUGS = [
  'consultation',
  'offer-submitted',
  'offer-accepted',
  'conditional-period',
  'firm-pending',
  'pre-closing',
  'closing-day',
  'post-closing',
] as const

function getUrgencyScore(transaction: Transaction): number {
  const conditions = (transaction.conditions ?? []) as Condition[]
  const blocking = conditions.filter((c) => c.isBlocking && c.status === 'pending')

  if (blocking.length === 0) return 0

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let minDays = Infinity
  for (const c of blocking) {
    if (!c.dueDate) continue
    const due = parseISO(c.dueDate)
    due.setHours(0, 0, 0, 0)
    const days = differenceInDays(due, today)
    if (days < minDays) minDays = days
  }

  if (minDays === Infinity) return 0
  return -minDays
}

function sortByUrgency(transactions: Transaction[]): Transaction[] {
  return [...transactions].sort((a, b) => getUrgencyScore(b) - getUrgencyScore(a))
}

export default function TransactionsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [stepFilter, setStepFilter] = useState('')

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => transactionsApi.list(),
    staleTime: 30_000,
  })

  const transactions = data?.data?.transactions ?? []
  const sorted = useMemo(() => sortByUrgency(transactions), [transactions])

  // Client-side filtering (FR20, AR4)
  const filtered = useMemo(() => {
    const normalizedQuery = normalizeSearch(searchQuery)
    return sorted.filter((tx) => {
      // Step filter
      if (stepFilter && tx.currentStep?.workflowStep?.slug !== stepFilter) {
        return false
      }
      // Search filter (accent-safe)
      if (normalizedQuery) {
        const clientName = tx.client
          ? `${tx.client.firstName} ${tx.client.lastName}`
          : ''
        const property = tx.property?.address ?? ''
        const haystack = normalizeSearch(`${clientName} ${property}`)
        if (!haystack.includes(normalizedQuery)) return false
      }
      return true
    })
  }, [sorted, searchQuery, stepFilter])

  const hasActiveFilters = searchQuery !== '' || stepFilter !== ''
  const isFilteredEmpty = hasActiveFilters && filtered.length === 0 && transactions.length > 0

  return (
    <div data-testid="transactions-page">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <h1
          className="text-2xl font-bold text-stone-900"
          style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
        >
          {t('nav.transactions')}
        </h1>
        <Button
          onClick={() => navigate('/transactions/new')}
          className="hidden sm:inline-flex bg-primary hover:bg-primary/90"
          data-testid="create-transaction-btn"
        >
          <Plus className="w-4 h-4" />
          {t('transaction.new')}
        </Button>
      </div>

      {/* Return banner — conditional after 24h absence (FR26) */}
      {!isLoading && !error && transactions.length > 0 && <ReturnBanner />}

      {/* Weekly summary (FR21) */}
      {!isLoading && !error && transactions.length > 0 && (
        <WeeklySummary transactions={transactions} />
      )}

      {/* Search + Filter bar */}
      {!isLoading && !error && transactions.length > 0 && (
        <div className="mb-4 flex flex-col sm:flex-row gap-3" data-testid="filter-bar">
          {/* SearchBar */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={t('common.search') + '...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-9"
              data-testid="search-input"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-sm text-muted-foreground hover:text-foreground"
                aria-label={t('common.close')}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Step filter */}
          <select
            value={stepFilter}
            onChange={(e) => setStepFilter(e.target.value)}
            className="h-10 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-shadow sm:w-56"
            data-testid="step-filter"
            aria-label={t('transaction.step')}
          >
            <option value="">{t('common.all')}</option>
            {STEP_SLUGS.map((slug) => (
              <option key={slug} value={slug}>
                {t(`workflow.steps.${slug}`)}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Loading state — 3 skeleton cards */}
      {isLoading && (
        <div
          className="grid grid-cols-1 lg:grid-cols-2 gap-3"
          data-testid="transactions-skeleton"
        >
          <TransactionCardSkeleton />
          <TransactionCardSkeleton />
          <TransactionCardSkeleton />
        </div>
      )}

      {/* Error state with retry */}
      {error && !isLoading && (
        <div
          className="flex flex-col items-center justify-center py-12 text-center"
          data-testid="transactions-error"
        >
          <AlertCircle className="w-10 h-10 text-destructive mb-3" />
          <p className="text-sm text-muted-foreground mb-4">
            {t('common.error')}
          </p>
          <Button
            variant="outline"
            onClick={() => refetch()}
            className="gap-2"
            data-testid="retry-btn"
          >
            <RefreshCw className="w-4 h-4" />
            {t('common.retry')}
          </Button>
        </div>
      )}

      {/* Empty state — no transactions (FR25) */}
      {!isLoading && !error && transactions.length === 0 && (
        <EmptyState onCreateClick={() => navigate('/transactions/new')} />
      )}

      {/* Empty filter results */}
      {isFilteredEmpty && (
        <div className="text-center py-12" data-testid="filter-empty">
          <p className="text-sm text-muted-foreground mb-2">
            {t('common.noResults')}
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchQuery('')
              setStepFilter('')
            }}
            data-testid="clear-filters-btn"
          >
            {t('common.clearFilters')}
          </Button>
        </div>
      )}

      {/* Transaction cards grid */}
      {!isLoading && !error && filtered.length > 0 && (
        <div
          className="grid grid-cols-1 lg:grid-cols-2 gap-3 stagger-children"
          data-testid="transactions-grid"
        >
          {filtered.map((transaction) => (
            <TransactionCard key={transaction.id} transaction={transaction} />
          ))}
        </div>
      )}

      {/* FAB for mobile - positioned above fixed footer */}
      <button
        onClick={() => navigate('/transactions/new')}
        className="fixed bottom-16 right-4 z-20 w-14 h-14 rounded-full shadow-lg hover:shadow-xl active:scale-95 transition-all flex items-center justify-center sm:hidden bg-primary"
        data-testid="fab-create"
        aria-label={t('transaction.new')}
      >
        <Plus className="w-6 h-6 text-white" />
      </button>
    </div>
  )
}
