import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { subscriptionApi } from '../api/subscription.api'
import { AlertTriangle, ArrowRight, List } from 'lucide-react'
import { Button } from './ui/Button'

const PRICING_URL = `${import.meta.env.VITE_MARKETING_URL || 'https://ofra.ca'}/pricing`

/**
 * K2: Soft limit banner — displayed globally when user is in grace period.
 * Shows warning with days remaining and upgrade/view transactions buttons.
 */
export default function SoftLimitBanner() {
  const { t } = useTranslation()

  const { data } = useQuery({
    queryKey: ['subscription'],
    queryFn: subscriptionApi.get,
    staleTime: 2 * 60 * 1000,
  })

  const sub = data?.data
  if (!sub?.grace?.active) return null

  const daysRemaining = sub.grace.daysRemaining ?? 0
  const isExpired = daysRemaining <= 0
  const activeCount = sub.usage.activeTransactions
  const maxCount = sub.usage.maxTransactions

  return (
    <div
      className={`px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center gap-3 ${
        isExpired
          ? 'bg-red-50 border-b border-red-200'
          : 'bg-amber-50 border-b border-amber-200'
      }`}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <AlertTriangle
          className={`w-5 h-5 shrink-0 ${
            isExpired ? 'text-red-500' : 'text-amber-500'
          }`}
        />
        <p className={`text-sm ${isExpired ? 'text-red-700' : 'text-amber-700'}`}>
          {isExpired
            ? t('subscription.banner.expired', { active: activeCount, max: maxCount })
            : t('subscription.banner.warning', { active: activeCount, max: maxCount, days: daysRemaining })
          }
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <a href={PRICING_URL} target="_blank" rel="noopener noreferrer">
          <Button size="sm" className="gap-1.5 bg-primary hover:bg-primary/90 text-white">
            {t('subscription.banner.upgrade')}
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </a>
        <Link to="/transactions" className="hidden sm:block">
          <Button size="sm" variant="outline" className="gap-1.5">
            <List className="w-3.5 h-3.5" />
            {t('subscription.banner.viewTransactions')}
          </Button>
        </Link>
      </div>
    </div>
  )
}
