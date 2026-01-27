import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { FileText, ExternalLink } from 'lucide-react'
import type { Transaction } from '../../api/transactions.api'
import type { Condition } from '../../api/conditions.api'

interface DocumentsTabProps {
  transaction: Transaction
}

interface DocGroup {
  conditionTitle: string
  docs: { url: string; label: string }[]
}

export default function DocumentsTab({ transaction }: DocumentsTabProps) {
  const { t } = useTranslation()

  const conditions = (transaction.conditions ?? []) as Condition[]

  const groups = useMemo(() => {
    const result: DocGroup[] = []
    for (const c of conditions) {
      if (!c.documentUrl) continue
      result.push({
        conditionTitle: c.title,
        docs: [{ url: c.documentUrl, label: c.documentLabel || c.title }],
      })
    }
    return result
  }, [conditions])

  const totalDocs = groups.reduce((n, g) => n + g.docs.length, 0)

  if (totalDocs === 0) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground" data-testid="documents-empty">
        {t('common.noResults')}
      </div>
    )
  }

  return (
    <div className="py-4 space-y-4" data-testid="documents-tab">
      {groups.map((group) => (
        <div key={group.conditionTitle}>
          <h3 className="text-sm font-medium text-foreground mb-2">
            {group.conditionTitle}
          </h3>
          <div className="space-y-1.5">
            {group.docs.map((doc) => (
              <a
                key={doc.url}
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-accent transition-colors"
                data-testid="document-link"
              >
                <FileText className="w-5 h-5 text-primary shrink-0" />
                <span className="flex-1 text-sm text-foreground truncate">
                  {doc.label}
                </span>
                <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0" />
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
