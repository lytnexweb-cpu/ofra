import { useState, useMemo, useCallback } from 'react'
import { useParams, Link, useSearchParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { transactionsApi } from '../api/transactions.api'
import { documentsApi, type TransactionDocument } from '../api/documents.api'
import {
  TransactionHeader,
  MembersPanel,
  ExportSharePanel,
  PropertyProfileCard,
  PartiesCard,
  OffersPanel,
  PartiesModal,
  UploadDocumentModal,
  DocumentProofModal,
  DocumentVersionModal,
  DocumentStatusBar,
  DocumentsSection,
} from '../components/transaction'
import type { DocumentFilter } from '../components/transaction/DocumentStatusBar'
import { Button } from '../components/ui/Button'
import { AlertCircle, Loader2, RefreshCw, ChevronUp } from 'lucide-react'
import VerticalTimeline from '../components/transaction/VerticalTimeline'

export default function TransactionDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const transactionId = Number(id)
  const [searchParams] = useSearchParams()
  const highlightId = searchParams.get('highlight')

  // D34: Maquettes 07-12 panel states
  const [membersOpen, setMembersOpen] = useState(false)
  const [partiesOpen, setPartiesOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)

  // M08: Documents modals
  const [uploadOpen, setUploadOpen] = useState(false)
  const [proofDoc, setProofDoc] = useState<TransactionDocument | null>(null)
  const [versionDoc, setVersionDoc] = useState<TransactionDocument | null>(null)

  // C1: Inline collapsible documents (replaces drawer)
  const [docsExpanded, setDocsExpanded] = useState(false)
  const [docsFilter, setDocsFilter] = useState<DocumentFilter>('all')

  const handleBadgeClick = useCallback((filter: DocumentFilter) => {
    if (docsExpanded && docsFilter === filter) {
      // Same filter clicked again → collapse
      setDocsExpanded(false)
    } else {
      setDocsFilter(filter)
      setDocsExpanded(true)
    }
  }, [docsExpanded, docsFilter])

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['transaction', transactionId],
    queryFn: () => transactionsApi.get(transactionId),
    staleTime: 0,
    enabled: !!id,
  })

  const transaction = data?.data?.transaction

  // M08: Documents query (TanStack deduplicates with DocumentsSection internal query)
  const { data: docsData } = useQuery({
    queryKey: ['documents', transactionId],
    queryFn: () => documentsApi.list(transactionId),
    enabled: !!id,
  })
  const allDocuments = docsData?.data?.documents ?? []

  // Previous versions for the version modal
  const previousVersions = useMemo(() => {
    if (!versionDoc) return []
    return allDocuments
      .filter((d) => d.parentDocumentId === versionDoc.id || (versionDoc.parentDocumentId && d.parentDocumentId === versionDoc.parentDocumentId && d.id !== versionDoc.id))
      .sort((a, b) => b.version - a.version)
  }, [versionDoc, allDocuments])

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
        onOpenEdit={() => navigate(`/transactions/${transaction.id}/edit`)}
        onOpenMembers={() => setMembersOpen(true)}
        onOpenParties={() => setPartiesOpen(true)}
        onOpenExport={() => setExportOpen(true)}
      />
      <PropertyProfileCard
        transactionId={transaction.id}
        currentStepOrder={transaction.currentStep?.stepOrder}
        onEdit={() => navigate(`/transactions/${transaction.id}/edit`)}
      />
      <PartiesCard
        transactionId={transaction.id}
        onManage={() => setPartiesOpen(true)}
      />
      <OffersPanel transaction={transaction} />

      {/* C1: DocumentStatusBar + inline collapsible section (after OffersPanel) */}
      <DocumentStatusBar
        transactionId={transaction.id}
        onBadgeClick={handleBadgeClick}
      />
      {docsExpanded && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-2">
          <div className="rounded-xl border border-stone-200 bg-white overflow-hidden">
            <DocumentsSection
              transactionId={transaction.id}
              onUpload={() => setUploadOpen(true)}
              onViewProof={(doc) => setProofDoc(doc)}
              onViewVersions={(doc) => setVersionDoc(doc)}
              initialFilter={docsFilter}
              compact
            />
            <div className="border-t border-stone-100 px-4 py-2 flex justify-center">
              <button
                onClick={() => setDocsExpanded(false)}
                className="flex items-center gap-1 text-xs text-stone-400 hover:text-stone-600 transition-colors"
              >
                <ChevronUp className="w-3.5 h-3.5" />
                {t('common.close', 'Fermer')}
              </button>
            </div>
          </div>
        </div>
      )}

      <VerticalTimeline
        transaction={transaction}
        highlightConditionId={highlightId}
      />
      <MembersPanel
        isOpen={membersOpen}
        onClose={() => setMembersOpen(false)}
        transactionId={transaction.id}
        ownerUserId={transaction.ownerUserId}
      />
      <PartiesModal
        isOpen={partiesOpen}
        onClose={() => setPartiesOpen(false)}
        transactionId={transaction.id}
      />
      <ExportSharePanel
        isOpen={exportOpen}
        onClose={() => setExportOpen(false)}
        transactionId={transaction.id}
      />
      <UploadDocumentModal
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        transactionId={transaction.id}
      />
      <DocumentProofModal
        isOpen={!!proofDoc}
        onClose={() => setProofDoc(null)}
        document={proofDoc}
        transactionId={transaction.id}
        stepOrder={transaction.currentStep?.stepOrder}
      />
      <DocumentVersionModal
        isOpen={!!versionDoc}
        onClose={() => setVersionDoc(null)}
        document={versionDoc}
        previousVersions={previousVersions}
        onReplace={() => {
          setVersionDoc(null)
          setUploadOpen(true)
        }}
      />
    </div>
  )
}
