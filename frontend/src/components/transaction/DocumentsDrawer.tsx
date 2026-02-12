import { useTranslation } from 'react-i18next'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { FileText } from 'lucide-react'
import { Button } from '../ui/Button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '../ui/Sheet'
import DocumentsSection from './DocumentsSection'
import type { TransactionDocument } from '../../api/documents.api'
import type { DocumentFilter } from './DocumentStatusBar'

interface DocumentsDrawerProps {
  isOpen: boolean
  onClose: () => void
  filter: DocumentFilter
  transactionId: number
  onUpload: () => void
  onViewProof: (doc: TransactionDocument) => void
  onViewVersions: (doc: TransactionDocument) => void
}

export default function DocumentsDrawer({
  isOpen,
  onClose,
  filter,
  transactionId,
  onUpload,
  onViewProof,
  onViewVersions,
}: DocumentsDrawerProps) {
  const { t } = useTranslation()
  const isDesktop = useMediaQuery('(min-width: 768px)')

  const side = isDesktop ? 'right' : 'bottom'
  const contentClass = isDesktop
    ? 'w-[520px] sm:max-w-[520px] flex flex-col'
    : 'max-h-[85vh] flex flex-col'

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side={side} className={contentClass}>
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {t('documents.drawerTitle', 'Documents & Preuves')}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto -mx-6 px-6">
          <DocumentsSection
            transactionId={transactionId}
            onUpload={onUpload}
            onViewProof={onViewProof}
            onViewVersions={onViewVersions}
            initialFilter={filter}
            compact
          />
        </div>

        <SheetFooter className="border-t pt-3">
          <Button variant="outline" onClick={onClose} className="w-full">
            {t('common.close', 'Fermer')}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
