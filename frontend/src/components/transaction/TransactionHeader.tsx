import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import type { Transaction } from '../../api/transactions.api'

interface TransactionHeaderProps {
  transaction: Transaction
}

export default function TransactionHeader({ transaction }: TransactionHeaderProps) {
  const { t } = useTranslation()

  const clientName = transaction.client
    ? `${transaction.client.firstName} ${transaction.client.lastName}`
    : t('transaction.client')

  const propertyAddress = transaction.property?.address ?? null

  return (
    <div className="mb-4" data-testid="transaction-header">
      <Link
        to="/transactions"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-2"
        data-testid="back-link"
      >
        <ArrowLeft className="w-4 h-4" />
        {t('common.back')}
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
        <h1
          className="text-xl font-semibold text-foreground truncate"
          data-testid="header-client"
        >
          {clientName}
        </h1>

        {propertyAddress && (
          <>
            <span className="hidden sm:inline text-muted-foreground" aria-hidden="true">
              —
            </span>
            <p
              className="text-sm text-muted-foreground truncate"
              data-testid="header-address"
            >
              {propertyAddress}
            </p>
          </>
        )}
      </div>
    </div>
  )
}
