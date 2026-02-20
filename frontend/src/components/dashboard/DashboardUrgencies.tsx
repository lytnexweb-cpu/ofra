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
    <span className={`px-1.5 py-0.5 text-xs font-semibold rounded ${styles[level] || 'bg-stone-500 text-white'}`}>
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
      ? 'text-red-600 font-semibold'
      : criticality === 'this_week'
        ? 'text-yellow-600 font-medium'
        : 'text-stone-500'

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
      className="block p-4 rounded-xl border border-stone-200 bg-white hover:border-stone-300 hover:shadow-sm transition-all group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-stone-900 truncate">
              {conditionLabel}
            </span>
            <LevelBadge level={item.level} />
          </div>
          <p className="text-sm text-stone-500 mt-1 truncate">
            {item.clientName}
            {item.address && <> &middot; {item.address}</>}
            {item.stepOrder && (
              <> &middot; {t('dashboard.urgencies.card.step', { order: item.stepOrder })}</>
            )}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <DeadlineText item={item} />
          <span className="text-xs text-primary sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
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
      <h3 className="text-sm font-bold text-stone-700 uppercase tracking-wide">
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

  const cards = [
    {
      to: '/transactions?new=true',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-3-3v6m-7 4h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      title: t('dashboard.urgencies.empty.cardTransaction', 'Créer une transaction'),
      desc: t('dashboard.urgencies.empty.cardTransactionDesc', 'Ajoutez votre première offre ou mandat'),
      color: 'text-primary bg-primary/10',
    },
    {
      to: '/clients',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      title: t('dashboard.urgencies.empty.cardClient', 'Ajouter un client'),
      desc: t('dashboard.urgencies.empty.cardClientDesc', 'Constituez votre base de contacts'),
      color: 'text-emerald-600 bg-emerald-50',
    },
    {
      to: '/clients?import=csv',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
      ),
      title: t('dashboard.urgencies.empty.cardImport', 'Importer un CSV'),
      desc: t('dashboard.urgencies.empty.cardImportDesc', 'Importez vos clients existants'),
      color: 'text-amber-600 bg-amber-50',
    },
  ]

  return (
    <div className="flex flex-col items-center justify-center py-10 px-4">
      {/* Illustration — simple house SVG matching branding */}
      <div className="mb-6">
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none" className="text-primary">
          <rect x="20" y="38" width="40" height="30" rx="3" stroke="currentColor" strokeWidth="2" fill="none" />
          <path d="M12 42L40 18L68 42" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <rect x="33" y="50" width="14" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <circle cx="44" cy="59" r="1.5" fill="currentColor" />
        </svg>
      </div>

      <h2
        className="text-2xl font-bold text-stone-900 mb-2 text-center"
        style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
      >
        {t('dashboard.urgencies.empty.welcome')}
      </h2>
      <p className="text-stone-500 mb-8 max-w-md text-center">
        {t('dashboard.urgencies.empty.message')}
      </p>

      {/* 3 Action cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl mb-8">
        {cards.map((card) => (
          <Link
            key={card.to}
            to={card.to}
            className="flex flex-col items-center text-center p-5 rounded-xl border border-stone-200 bg-white hover:border-primary/30 hover:shadow-md transition-all group"
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${card.color} transition-transform group-hover:scale-110`}>
              {card.icon}
            </div>
            <h3 className="text-sm font-semibold text-stone-900 mb-1">{card.title}</h3>
            <p className="text-xs text-stone-500">{card.desc}</p>
          </Link>
        ))}
      </div>

      {/* Primary CTA */}
      <Link
        to="/transactions?new=true"
        className="px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors"
      >
        {t('dashboard.urgencies.empty.cta')}
      </Link>
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
          className="text-2xl sm:text-3xl font-bold text-stone-900"
          style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
        >
          {t('dashboard.greeting', { name: userName })}
        </h1>
        <p className="text-stone-500 mt-1 flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-full bg-green-500" />
          {t('dashboard.urgencies.allClear')}.{' '}
          {nextDeadlineDays
            ? t('dashboard.urgencies.allClearMessage', { days: nextDeadlineDays })
            : t('dashboard.urgencies.allClearNoDeadline')}
        </p>
      </div>

      {/* Green summary */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
        <div className="text-3xl mb-2">&#9989;</div>
        <p className="text-green-800 font-semibold text-lg">
          {t('dashboard.urgencies.allClear')}
        </p>
        {greenCount > 0 && (
          <p className="text-green-600 text-sm mt-1">
            {t('dashboard.urgencies.greenCount', { count: greenCount })}
          </p>
        )}
        <Link
          to="/transactions"
          className="inline-block mt-4 text-sm text-primary font-medium hover:underline"
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
            className="text-2xl sm:text-3xl font-bold text-stone-900"
            style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
          >
            {t('dashboard.greeting', { name: userName })}
          </h1>
          <p className="text-stone-500 mt-1">
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
        <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
          <span>&#9889;</span> {t('dashboard.urgencies.burning').toUpperCase()}
        </h2>
        <div className="border-t border-stone-200" />

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
            className="block text-center text-sm text-primary font-medium py-2 hover:underline"
          >
            {t('dashboard.urgencies.seeMore', { count: moreCount })}
          </Link>
        )}
      </div>

      {/* Green section */}
      {greenCount > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-green-800 font-medium flex items-center gap-2">
            <span>&#128994;</span>
            {t('dashboard.urgencies.allClear')}{' '}
            <span className="text-green-600 font-normal">
              ({t('dashboard.urgencies.greenCount', { count: greenCount })})
            </span>
            {nextDeadlineDays && (
              <span className="text-green-600 font-normal text-sm ml-auto">
                {t('dashboard.urgencies.allClearMessage', { days: nextDeadlineDays })}
              </span>
            )}
          </p>
        </div>
      )}
    </div>
  )
}
