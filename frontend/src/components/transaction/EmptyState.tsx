import { useTranslation } from 'react-i18next'
import { FolderOpen, Plus } from 'lucide-react'
import { Button } from '../ui/Button'

interface EmptyStateProps {
  onCreateClick: () => void
}

export default function EmptyState({ onCreateClick }: EmptyStateProps) {
  const { t } = useTranslation()

  return (
    <div
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
      data-testid="empty-state"
    >
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center mb-6 bg-primary/10"
      >
        <FolderOpen className="w-10 h-10 text-primary" />
      </div>

      <h2 className="text-xl font-semibold text-stone-900 mb-2">
        {t('transaction.empty')}
      </h2>

      <p className="text-sm text-stone-500 max-w-sm mb-6">
        {t('transaction.emptyDescription')}
      </p>

      <Button
        onClick={onCreateClick}
        className="gap-2 bg-primary hover:bg-primary/90"
        data-testid="empty-state-cta"
      >
        <Plus className="w-4 h-4" />
        {t('transaction.emptyCta')}
      </Button>
    </div>
  )
}
