import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { UrgencyItem, UrgencyCriticality } from '../../api/dashboard.api'

// --- Sub-components ---

function LevelBadge({ level }: { level: string }) {
  const { t } = useTranslation()
  const styles: Record<string, string> = {
    blocking: 'bg-red-600 text-white',
    required: 'bg-yellow-500 text-white',
    recommended: 'bg-green-600 text-white',
  }
  return (
    <span className={`px-1.5 py-0.5 text-xs font-semibold rounded ${styles[level] || 'bg-gray-500 text-white'}`}>
      {t(`conditions.levels.${level}`)}
    </span>
  )
}

function DeadlineText({ item }: { item: UrgencyItem }) {
  const { t } = useTranslation()
  const { daysRemaining, criticality } = item

  let text: string
  if (daysRemaining < 0) {
    text = t('dashboard.urgencies.card.daysOverdue', { count: Math.abs(daysRemaining) })
  } else if (daysRemaining === 0) {
    text = t('dashboard.urgencies.card.today')
  } else if (daysRemaining === 1) {
    text = t('dashboard.urgencies.card.tomorrow')
  } else {
    text = t('dashboard.urgencies.card.daysLeft', { count: daysRemaining })
  }

  const colorClass =
    criticality === 'overdue' || criticality === 'urgent'
      ? 'text-red-600 dark:text-red-400 font-semibold'
      : criticality === 'this_week'
        ? 'text-yellow-600 dark:text-yellow-400 font-medium'
        : 'text-stone-500 dark:text-stone-400'

  return <span className={`text-sm ${colorClass}`}>{text}</span>
}

function UrgencyCard({ item }: { item: UrgencyItem }) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language?.substring(0, 2) || 'fr'
  const conditionLabel =
    locale === 'en' && item.labelEn ? item.labelEn : item.labelFr || item.conditionTitle

  return (
    <Link
      to={`/transactions/${item.transactionId}`}
      className="block p-4 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 hover:border-stone-300 dark:hover:border-stone-600 hover:shadow-sm transition-all group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-stone-900 dark:text-white truncate">
              {conditionLabel}
            </span>
            <LevelBadge level={item.level} />
          </div>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1 truncate">
            {item.clientName}
            {item.address && <> &middot; {item.address}</>}
            {item.stepOrder && (
              <> &middot; {t('dashboard.urgencies.card.step', { order: item.stepOrder })}</>
            )}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <DeadlineText item={item} />
          <span className="text-xs text-primary dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
            {t('dashboard.urgencies.card.open')} &rarr;
          </span>
        </div>
      </div>
    </Link>
  )
}

// --- Section grouping ---

function UrgencySection({
  emoji,
  label,
  items,
}: {
  emoji: string
  label: string
  items: UrgencyItem[]
}) {
  if (items.length === 0) return null
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wide">
        {emoji} {label}
      </h3>
      <div className="space-y-2">
        {items.map((item) => (
          <UrgencyCard key={item.conditionId} item={item} />
        ))}
      </div>
    </div>
  )
}

// --- Main states ---

/** A3: Empty — no transactions at all */
function EmptyState() {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="text-4xl mb-4">&#128075;</div>
      <h2
        className="text-2xl font-bold text-stone-900 dark:text-white mb-2"
        style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
      >
        {t('dashboard.urgencies.empty.welcome')}
      </h2>
      <p className="text-stone-600 dark:text-stone-400 mb-6 max-w-md">
        {t('dashboard.urgencies.empty.message')}
      </p>
      <div className="text-left space-y-2 mb-8 text-sm text-stone-600 dark:text-stone-400">
        <p>1) {t('dashboard.urgencies.empty.step1')}</p>
        <p>2) {t('dashboard.urgencies.empty.step2')}</p>
        <p>3) {t('dashboard.urgencies.empty.step3')}</p>
      </div>
      <Link
        to="/transactions?new=true"
        className="px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors"
      >
        {t('dashboard.urgencies.empty.cta')}
      </Link>
      <p className="text-xs text-stone-400 dark:text-stone-500 mt-4">
        {t('dashboard.urgencies.empty.csvHint')}
      </p>
    </div>
  )
}

/** A2: All clear — has transactions but no urgent conditions */
function AllClearState({
  greenCount,
  nextDeadlineDays,
  userName,
}: {
  greenCount: number
  nextDeadlineDays: number | null
  userName: string
}) {
  const { t } = useTranslation()
  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1
          className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-white"
          style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
        >
          {t('dashboard.greeting', { name: userName })}
        </h1>
        <p className="text-stone-500 dark:text-stone-400 mt-1 flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-full bg-green-500" />
          {t('dashboard.urgencies.allClear')}.{' '}
          {nextDeadlineDays
            ? t('dashboard.urgencies.allClearMessage', { days: nextDeadlineDays })
            : t('dashboard.urgencies.allClearNoDeadline')}
        </p>
      </div>

      {/* Green summary */}
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6 text-center">
        <div className="text-3xl mb-2">&#9989;</div>
        <p className="text-green-800 dark:text-green-300 font-semibold text-lg">
          {t('dashboard.urgencies.allClear')}
        </p>
        {greenCount > 0 && (
          <p className="text-green-600 dark:text-green-400 text-sm mt-1">
            {t('dashboard.urgencies.greenCount', { count: greenCount })}
          </p>
        )}
        <Link
          to="/transactions"
          className="inline-block mt-4 text-sm text-primary dark:text-blue-400 font-medium hover:underline"
        >
          {t('dashboard.urgencies.viewAll')} &rarr;
        </Link>
      </div>
    </div>
  )
}

// --- Main component ---

interface DashboardUrgenciesProps {
  state: 'empty' | 'all_clear' | 'urgencies'
  urgencies: UrgencyItem[]
  hasMore?: boolean
  moreCount?: number
  urgencyCount: number
  greenCount: number
  nextDeadlineDays: number | null
  totalActiveTransactions: number
  userName: string
}

export default function DashboardUrgencies({
  state,
  urgencies,
  hasMore,
  moreCount,
  urgencyCount,
  greenCount,
  nextDeadlineDays,
  totalActiveTransactions,
  userName,
}: DashboardUrgenciesProps) {
  const { t } = useTranslation()

  // A3: Empty state
  if (state === 'empty') {
    return <EmptyState />
  }

  // A2: All clear
  if (state === 'all_clear') {
    return (
      <AllClearState
        greenCount={greenCount}
        nextDeadlineDays={nextDeadlineDays}
        userName={userName}
      />
    )
  }

  // A1: Urgencies view
  const overdue = urgencies.filter((u) => u.criticality === 'overdue')
  const urgent = urgencies.filter((u) => u.criticality === 'urgent')
  const thisWeek = urgencies.filter((u) => u.criticality === 'this_week')

  return (
    <div className="space-y-6">
      {/* Greeting + urgency count */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1
            className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-white"
            style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
          >
            {t('dashboard.greeting', { name: userName })}
          </h1>
          <p className="text-stone-500 dark:text-stone-400 mt-1">
            {urgencyCount > 0
              ? t('dashboard.urgencies.title', { count: urgencyCount })
              : t('dashboard.urgencies.titleZero')}
          </p>
        </div>
        <Link
          to="/transactions?new=true"
          className="self-start sm:self-auto px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
        >
          + {t('dashboard.urgencies.newTx')}
        </Link>
      </div>

      {/* Burning section */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-stone-900 dark:text-white flex items-center gap-2">
          <span>&#9889;</span> {t('dashboard.urgencies.burning').toUpperCase()}
        </h2>
        <div className="border-t border-stone-200 dark:border-stone-700" />

        <UrgencySection
          emoji="&#128308;"
          label={t('dashboard.urgencies.overdue').toUpperCase()}
          items={overdue}
        />
        <UrgencySection
          emoji="&#128308;"
          label={t('dashboard.urgencies.urgent48h').toUpperCase()}
          items={urgent}
        />
        <UrgencySection
          emoji="&#128993;"
          label={t('dashboard.urgencies.thisWeek').toUpperCase()}
          items={thisWeek}
        />

        {hasMore && moreCount && moreCount > 0 && (
          <Link
            to="/transactions"
            className="block text-center text-sm text-primary dark:text-blue-400 font-medium py-2 hover:underline"
          >
            {t('dashboard.urgencies.seeMore', { count: moreCount })}
          </Link>
        )}
      </div>

      {/* Green section */}
      {greenCount > 0 && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
          <p className="text-green-800 dark:text-green-300 font-medium flex items-center gap-2">
            <span>&#128994;</span>
            {t('dashboard.urgencies.allClear')}{' '}
            <span className="text-green-600 dark:text-green-400 font-normal">
              ({t('dashboard.urgencies.greenCount', { count: greenCount })})
            </span>
            {nextDeadlineDays && (
              <span className="text-green-600 dark:text-green-400 font-normal text-sm ml-auto">
                {t('dashboard.urgencies.allClearMessage', { days: nextDeadlineDays })}
              </span>
            )}
          </p>
        </div>
      )}
    </div>
  )
}
