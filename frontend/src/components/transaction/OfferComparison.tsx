import { useTranslation } from 'react-i18next'
import { Check, X } from 'lucide-react'
import type { Offer, OfferRevision } from '../../api/transactions.api'
import { formatDate, parseISO } from '../../lib/date'

interface OfferComparisonProps {
  offers: Offer[]
  onAccept: (offer: Offer) => void
}

function formatCAD(amount: number): string {
  return new Intl.NumberFormat('fr-CA', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function getLastRevision(offer: Offer): OfferRevision | null {
  if (!offer.revisions || offer.revisions.length === 0) return null
  return offer.revisions.reduce(
    (latest, rev) => (rev.revisionNumber > latest.revisionNumber ? rev : latest),
    offer.revisions[0]
  )
}

export default function OfferComparison({
  offers,
  onAccept,
}: OfferComparisonProps) {
  const { t } = useTranslation()

  if (offers.length < 2) return null

  // Compute highlights: for numeric rows, find best/worst
  const prices = offers.map((o) => getLastRevision(o)?.price ?? 0)
  const bestPrice = Math.max(...prices)
  const worstPrice = Math.min(...prices)

  const deposits = offers.map((o) => getLastRevision(o)?.deposit ?? null)
  const validDeposits = deposits.filter((d): d is number => d != null && d > 0)
  const bestDeposit = validDeposits.length > 1 ? Math.max(...validDeposits) : null
  const worstDeposit = validDeposits.length > 1 ? Math.min(...validDeposits) : null

  const financings = offers.map((o) => getLastRevision(o)?.financingAmount ?? null)
  const validFinancings = financings.filter((f): f is number => f != null && f > 0)
  const bestFinancing = validFinancings.length > 1 ? Math.min(...validFinancings) : null
  const worstFinancing = validFinancings.length > 1 ? Math.max(...validFinancings) : null

  function highlightNumeric(val: number | null, best: number | null, worst: number | null): 'best' | 'worst' | undefined {
    if (val == null || best == null || worst == null || best === worst) return undefined
    if (val === best) return 'best'
    if (val === worst) return 'worst'
    return undefined
  }

  const rows: {
    key: string
    label: string
    values: (string | { text: string; highlight?: 'best' | 'worst' })[]
  }[] = [
    {
      key: 'price',
      label: t('offers.comparison.price'),
      values: offers.map((o) => {
        const rev = getLastRevision(o)
        const price = rev?.price ?? 0
        return {
          text: price > 0 ? `${formatCAD(price)} $` : t('offers.comparison.noValue'),
          highlight:
            prices.filter((p) => p > 0).length > 1
              ? price === bestPrice
                ? 'best'
                : price === worstPrice
                  ? 'worst'
                  : undefined
              : undefined,
        }
      }),
    },
    {
      key: 'deposit',
      label: t('offers.comparison.deposit'),
      values: offers.map((o) => {
        const rev = getLastRevision(o)
        const dep = rev?.deposit ?? null
        return dep != null
          ? { text: `${formatCAD(dep)} $`, highlight: highlightNumeric(dep, bestDeposit, worstDeposit) }
          : t('offers.comparison.noValue')
      }),
    },
    {
      key: 'financing',
      label: t('offers.comparison.financing'),
      values: offers.map((o) => {
        const rev = getLastRevision(o)
        const fin = rev?.financingAmount ?? null
        return fin != null
          ? { text: `${formatCAD(fin)} $`, highlight: highlightNumeric(fin, bestFinancing, worstFinancing) }
          : t('offers.comparison.noValue')
      }),
    },
    {
      key: 'closingDate',
      label: t('offers.comparison.closingDate'),
      values: offers.map((o) => {
        const rev = getLastRevision(o)
        return rev?.closingDate
          ? formatDate(parseISO(rev.closingDate), 'd MMM yyyy')
          : t('offers.comparison.noValue')
      }),
    },
    {
      key: 'expiry',
      label: t('offers.comparison.expiry'),
      values: offers.map((o) => {
        const rev = getLastRevision(o)
        return rev?.expiryAt
          ? formatDate(parseISO(rev.expiryAt), 'd MMM yyyy')
          : t('offers.comparison.noValue')
      }),
    },
    {
      key: 'inspection',
      label: t('offers.comparison.inspection'),
      values: offers.map((o) => {
        const rev = getLastRevision(o)
        return rev?.inspectionRequired ? `${rev.inspectionDelay ?? '—'}` : t('offers.comparison.noValue')
      }),
    },
    {
      key: 'conditions',
      label: t('offers.comparison.conditions'),
      values: offers.map((o) => {
        const rev = getLastRevision(o)
        const count = rev?.inclusions ? 1 : 0
        return count > 0 ? rev!.inclusions! : t('offers.comparison.noValue')
      }),
    },
    {
      key: 'parties',
      label: t('offers.comparison.parties'),
      values: offers.map((o) => {
        const buyer = o.buyerParty?.fullName ?? t('offers.comparison.noValue')
        const seller = o.sellerParty?.fullName ?? t('offers.comparison.noValue')
        return `${t('offers.comparison.buyer')}: ${buyer}\n${t('offers.comparison.seller')}: ${seller}`
      }),
    },
  ]

  return (
    <div className="mt-3 rounded-lg border border-stone-200 overflow-hidden">
      {/* Header */}
      <div className="bg-stone-50 px-3 py-2.5 border-b border-stone-200">
        <h4 className="text-xs font-semibold text-stone-700">
          {t('offers.compareTitle')}
        </h4>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-stone-100">
              <th className="text-left px-3 py-2 text-stone-500 font-medium w-[120px] shrink-0" />
              {offers.map((o, i) => (
                <th key={o.id} className="text-center px-3 py-2 font-semibold text-stone-700 min-w-[140px]">
                  {t('offers.title')} #{i + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key} className="border-b border-stone-50">
                <td className="px-3 py-2 text-stone-500 font-medium align-top">
                  {row.label}
                </td>
                {row.values.map((val, i) => {
                  const isObj = typeof val === 'object'
                  const text = isObj ? val.text : val
                  const highlight = isObj ? val.highlight : undefined

                  return (
                    <td
                      key={i}
                      className={`px-3 py-2 text-center align-top ${
                        highlight === 'best'
                          ? 'text-emerald-700 font-semibold bg-emerald-50/50'
                          : highlight === 'worst'
                            ? 'text-red-600 bg-red-50/30'
                            : 'text-stone-700'
                      }`}
                    >
                      {text.includes('\n') ? (
                        <span className="whitespace-pre-line text-left block">{text}</span>
                      ) : (
                        text
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
            {/* Accept CTA row */}
            <tr>
              <td className="px-3 py-3" />
              {offers.map((o) => (
                <td key={o.id} className="px-3 py-3 text-center">
                  <button
                    type="button"
                    onClick={() => onAccept(o)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-500 text-white hover:bg-emerald-600"
                  >
                    <Check className="w-3 h-3" />
                    {t('offers.comparison.selectForAcceptance')}
                  </button>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
