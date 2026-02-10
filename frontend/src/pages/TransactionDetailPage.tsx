import { useState, useEffect } from 'react'
import { useParams, Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { transactionsApi } from '../api/transactions.api'
import {
  TransactionHeader,
  SuggestionsPanel,
  EditTransactionModal,
  MembersPanel,
  ExportSharePanel,
} from '../components/transaction'
import { Button } from '../components/ui/Button'
import { AlertCircle, Loader2, RefreshCw } from 'lucide-react'
import VerticalTimeline from '../components/transaction/VerticalTimeline'

export default function TransactionDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const transactionId = Number(id)
  const [searchParams, setSearchParams] = useSearchParams()
  const highlightId = searchParams.get('highlight')

  // E1 → C1: Auto-open suggestions panel from creation modal
  const [suggestionsOpen, setSuggestionsOpen] = useState(false)
  const closingDate = searchParams.get('closingDate')

  // D34: Maquettes 07-12 panel states
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [membersOpen, setMembersOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)

  useEffect(() => {
    if (searchParams.get('suggestions') === 'open') {
      setSuggestionsOpen(true)
      // Clean URL params after reading
      const next = new URLSearchParams(searchParams)
      next.delete('suggestions')
      next.delete('closingDate')
      setSearchParams(next, { replace: true })
    }
  }, [])

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['transaction', transactionId],
    queryFn: () => transactionsApi.get(transactionId),
    staleTime: 0,
    enabled: !!id,
  })

  const transaction = data?.data?.transaction

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
    <div data-testid="transaction-detail-page" className="pb-8">
      <TransactionHeader
        transaction={transaction}
        onOpenEdit={() => setEditModalOpen(true)}
        onOpenMembers={() => setMembersOpen(true)}
        onOpenExport={() => setExportOpen(true)}
      />
      <VerticalTimeline
        transaction={transaction}
        highlightConditionId={highlightId}
        onOpenSuggestions={() => setSuggestionsOpen(true)}
      />
      <SuggestionsPanel
        isOpen={suggestionsOpen}
        onClose={() => setSuggestionsOpen(false)}
        transaction={transaction}
        closingDate={closingDate}
      />
      <EditTransactionModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        transaction={transaction}
      />
      <MembersPanel
        isOpen={membersOpen}
        onClose={() => setMembersOpen(false)}
        transactionId={transaction.id}
        ownerUserId={transaction.ownerUserId}
      />
      <ExportSharePanel
        isOpen={exportOpen}
        onClose={() => setExportOpen(false)}
        transactionId={transaction.id}
      />
    </div>
  )
}
