import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowRight, ChevronDown } from 'lucide-react'
import type { Offer, OfferRevision } from '../../api/transactions.api'
import { formatDate, parseISO } from '../../lib/date'

interface NegotiationThreadProps {
  offer: Offer
  compact?: boolean
  showSingle?: boolean
}

function formatCAD(amount: number): string {
  return new Intl.NumberFormat('fr-CA', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export default function NegotiationThread({
  offer,
  compact = true,
  showSingle = false,
}: NegotiationThreadProps) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(!compact)

  const revisions = [...(offer.revisions ?? [])].sort(
    (a, b) => a.revisionNumber - b.revisionNumber
  )

  if (revisions.length === 0) return null
  if (revisions.length === 1 && !showSingle) return null // Single revision — no thread to show

  const lastRevision = revisions[revisions.length - 1]

  // In compact mode, show only the toggle + last revision hint
  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-[#1e3a5f] transition-colors py-1"
      >
        <ChevronDown className="w-3 h-3" />
        <span>
          {t('offers.thread.showAll')} ({revisions.length})
        </span>
      </button>
    )
  }

  return (
    <div className="mt-2">
      {/* Thread toggle */}
      <button
        type="button"
        onClick={() => setExpanded(false)}
        className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-[#1e3a5f] transition-colors py-1 mb-2"
      >
        <ChevronDown className="w-3 h-3 rotate-180" />
        <span>{t('offers.thread.hideAll')}</span>
      </button>

      {/* Revision nodes */}
      <div className="relative">
        {revisions.map((rev, index) => {
          const isLast = index === revisions.length - 1
          const isFirst = index === 0
          const isBuyerToSeller = rev.direction === 'buyer_to_seller'
          const fromName = rev.fromParty?.fullName ?? (isBuyerToSeller ? t('offers.comparison.buyer') : t('offers.comparison.seller'))
          const toName = rev.toParty?.fullName ?? (isBuyerToSeller ? t('offers.comparison.seller') : t('offers.comparison.buyer'))

          return (
            <div key={rev.id} className="relative flex gap-3">
              {/* Vertical line + node */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-2.5 h-2.5 rounded-full shrink-0 mt-1 ${
                    isLast
                      ? 'bg-[#1e3a5f] ring-2 ring-[#1e3a5f]/20'
                      : isFirst
                        ? 'bg-emerald-500'
                        : 'bg-stone-300'
                  }`}
                />
                {!isLast && (
                  <div className="w-px flex-1 bg-stone-200 min-h-[24px]" />
                )}
              </div>

              {/* Content */}
              <div className={`flex-1 pb-3 ${isLast ? '' : ''}`}>
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Label */}
                  <span
                    className={`text-xs font-medium ${
                      isLast ? 'text-[#1e3a5f]' : 'text-stone-600'
                    }`}
                  >
                    {isFirst
                      ? t('offers.thread.initial')
                      : t('offers.thread.counter', { number: rev.revisionNumber })}
                  </span>

                  {/* Latest badge */}
                  {isLast && (
                    <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase bg-[#1e3a5f] text-white">
                      {t('offers.thread.latest')}
                    </span>
                  )}

                  {/* Date */}
                  <span className="text-[10px] text-stone-400 ml-auto">
                    {rev.createdAt ? formatDate(parseISO(rev.createdAt), 'd MMM HH:mm') : ''}
                  </span>
                </div>

                {/* Price + direction */}
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`text-sm font-semibold ${
                      isLast ? 'text-stone-900' : 'text-stone-700'
                    }`}
                  >
                    {formatCAD(rev.price)} $
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-stone-400">
                    {fromName}
                    <ArrowRight className="w-2.5 h-2.5" />
                    {toName}
                  </span>
                </div>

                {/* Delta from previous */}
                {index > 0 && (
                  <span
                    className={`text-[10px] font-medium ${
                      rev.price > revisions[index - 1].price
                        ? 'text-emerald-600'
                        : rev.price < revisions[index - 1].price
                          ? 'text-red-500'
                          : 'text-stone-400'
                    }`}
                  >
                    {rev.price > revisions[index - 1].price ? '+' : ''}
                    {formatCAD(rev.price - revisions[index - 1].price)} $
                  </span>
                )}

                {/* Notes */}
                {rev.notes && (
                  <p className="text-[10px] text-stone-400 italic mt-0.5 truncate">
                    &ldquo;{rev.notes}&rdquo;
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
