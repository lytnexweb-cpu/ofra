import { useTranslation } from 'react-i18next'
import {
  ClipboardCheck,
  DollarSign,
  FileText,
  ListOrdered,
  MessageSquare
} from 'lucide-react'

const TAB_KEYS = ['conditions', 'offers', 'documents', 'steps', 'notes'] as const
type TabKey = (typeof TAB_KEYS)[number]

interface TransactionBottomNavProps {
  activeTab: TabKey
  onTabChange: (tab: TabKey) => void
}

const TAB_CONFIG: Record<TabKey, { icon: typeof ClipboardCheck; labelKey: string }> = {
  conditions: { icon: ClipboardCheck, labelKey: 'tabs.conditions' },
  offers: { icon: DollarSign, labelKey: 'tabs.offers' },
  documents: { icon: FileText, labelKey: 'tabs.documents' },
  steps: { icon: ListOrdered, labelKey: 'tabs.steps' },
  notes: { icon: MessageSquare, labelKey: 'tabs.notes' },
}

export default function TransactionBottomNav({ activeTab, onTabChange }: TransactionBottomNavProps) {
  const { t } = useTranslation()

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white dark:bg-stone-800 border-t border-stone-200 dark:border-stone-700 safe-area-bottom"
      aria-label={t('common.tabNavigation')}
    >
      <div className="flex justify-around items-center h-16">
        {TAB_KEYS.map((key) => {
          const { icon: Icon, labelKey } = TAB_CONFIG[key]
          const isActive = activeTab === key

          return (
            <button
              key={key}
              onClick={() => onTabChange(key)}
              className={`flex flex-col items-center justify-center flex-1 h-full px-1 transition-colors ${
                isActive
                  ? 'text-primary'
                  : 'text-stone-400 dark:text-stone-500'
              }`}
              aria-current={isActive ? 'page' : undefined}
              data-testid={`bottom-tab-${key}`}
            >
              <Icon
                className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.5]'}`}
              />
              <span className={`text-[10px] mt-1 ${isActive ? 'font-semibold' : 'font-medium'}`}>
                {t(labelKey)}
              </span>
              {isActive && (
                <span
                  className="w-1 h-1 rounded-full mt-0.5 bg-primary"
                />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
