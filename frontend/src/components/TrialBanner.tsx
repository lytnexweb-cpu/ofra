import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { subscriptionApi } from '../api/subscription.api'
import { Clock, AlertTriangle, XCircle, ArrowRight } from 'lucide-react'
import { Button } from './ui/Button'

const PRICING_URL = `${import.meta.env.VITE_MARKETING_URL || 'https://ofra.ca'}/pricing`

/**
 * D53: Trial banner — displayed globally during trial period.
 * - Active trial: "Essai gratuit — X jours restants"
 * - Soft wall (J30-J33): "Votre essai est terminé — lecture seule"
 * - Hard wall: handled by Layout redirect, not shown here
 */
export default function TrialBanner() {
  const { t } = useTranslation()

  const { data } = useQuery({
    queryKey: ['subscription'],
    queryFn: subscriptionApi.get,
    staleTime: 2 * 60 * 1000,
  })

  const trial = data?.data?.trial
  if (!trial) return null

  // Soft wall — urgent banner
  if (trial.softWall) {
    return (
      <div className="px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-red-50 border-b border-red-200">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <XCircle className="w-5 h-5 shrink-0 text-red-500" />
          <p className="text-sm text-red-700">
            {t('trial.banner.softWall')}
          </p>
        </div>
        <a href={PRICING_URL} target="_blank" rel="noopener noreferrer">
          <Button size="sm" className="gap-1.5 bg-primary hover:bg-primary/90 text-white">
            {t('trial.banner.choosePlan')}
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </a>
      </div>
    )
  }

  // Active trial — informational banner
  if (trial.active && trial.daysRemaining !== null) {
    const isUrgent = trial.daysRemaining <= 7

    return (
      <div
        className={`px-4 py-2.5 flex flex-col sm:flex-row items-start sm:items-center gap-3 border-b ${
          isUrgent
            ? 'bg-amber-50 border-amber-200'
            : 'bg-blue-50 border-blue-200'
        }`}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {isUrgent ? (
            <AlertTriangle className="w-4.5 h-4.5 shrink-0 text-amber-500" />
          ) : (
            <Clock className="w-4.5 h-4.5 shrink-0 text-blue-500" />
          )}
          <p
            className={`text-sm ${
              isUrgent
                ? 'text-amber-700'
                : 'text-blue-700'
            }`}
          >
            {t('trial.banner.active', { days: trial.daysRemaining })}
          </p>
        </div>
        <a href={PRICING_URL} target="_blank" rel="noopener noreferrer">
          <Button size="sm" variant="outline" className="gap-1.5 text-xs">
            {t('trial.banner.seePlans')}
            <ArrowRight className="w-3 h-3" />
          </Button>
        </a>
      </div>
    )
  }

  return null
}
