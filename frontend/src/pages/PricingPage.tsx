import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { plansApi, type PublicPlan } from '../api/plans.api'
import { subscriptionApi } from '../api/subscription.api'
import { authApi } from '../api/auth.api'
import SubscribeModal from '../components/SubscribeModal'
import { Button } from '../components/ui/Button'
import { Check, Zap, Loader2 } from 'lucide-react'

type BillingCycle = 'monthly' | 'annual'

const PLAN_COLORS: Record<string, string> = {
  starter: 'border-blue-200',
  solo: 'border-primary ring-2 ring-primary/20',
  pro: 'border-violet-200',
  agence: 'border-amber-200',
}

function getPlanFeatures(plan: PublicPlan, t: (key: string, opts?: Record<string, unknown>) => string) {
  const features: string[] = []

  if (plan.maxTransactions === null) {
    features.push(t('pricing.features.transactionsUnlimited'))
  } else {
    features.push(t('pricing.features.transactions', { count: plan.maxTransactions }))
  }

  features.push(t('pricing.features.storage', { count: plan.maxStorageGb }))
  features.push(t('pricing.features.users', { count: plan.maxUsers }))

  if (plan.historyMonths === null) {
    features.push(t('pricing.features.historyUnlimited'))
  } else {
    features.push(t('pricing.features.history', { count: plan.historyMonths }))
  }

  return features
}

function calculatePrice(
  plan: PublicPlan,
  cycle: BillingCycle,
  isFounder: boolean,
  discounts: { annual: number; founder: number; founderAnnual: number }
): number {
  const basePrice = cycle === 'monthly' ? plan.monthlyPrice : plan.annualPrice
  if (!isFounder) return basePrice

  const discount = cycle === 'monthly' ? discounts.founder : discounts.founderAnnual
  return Math.round(basePrice * (1 - discount / 100) * 100) / 100
}

export default function PricingPage() {
  const { t } = useTranslation()
  const [cycle, setCycle] = useState<BillingCycle>('monthly')
  const [modal, setModal] = useState<{
    open: boolean
    planSlug: string
    planName: string
    price: number
    mode: 'new' | 'change'
  }>({ open: false, planSlug: '', planName: '', price: 0, mode: 'new' })

  const { data: plansData, isLoading: plansLoading } = useQuery({
    queryKey: ['plans'],
    queryFn: plansApi.list,
    staleTime: 10 * 60 * 1000,
  })

  const { data: subData } = useQuery({
    queryKey: ['subscription'],
    queryFn: subscriptionApi.get,
    staleTime: 2 * 60 * 1000,
  })

  const { data: userData } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: authApi.me,
  })

  const plans = plansData?.data?.plans ?? []
  const discounts = plansData?.data?.discounts ?? { annual: 20, founder: 20, founderAnnual: 30 }
  const sub = subData?.data
  const isFounder = sub?.billing?.isFounder ?? false
  const currentPlanSlug = sub?.plan?.slug ?? null
  const isTrial = sub?.trial?.active ?? false
  const isActive = sub?.billing?.subscriptionStatus === 'active'

  const handleSelectPlan = (plan: PublicPlan) => {
    const price = calculatePrice(plan, cycle, isFounder, discounts)
    const isCurrentPlan = plan.slug === currentPlanSlug
    if (isCurrentPlan && isActive) return

    setModal({
      open: true,
      planSlug: plan.slug,
      planName: plan.name,
      price,
      mode: isActive ? 'change' : 'new',
    })
  }

  if (plansLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div data-testid="pricing-page">
      {/* Header */}
      <div className="text-center mb-8">
        <h1
          className="text-2xl font-bold text-stone-900"
          style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
        >
          {t('pricing.title')}
        </h1>
        <p className="mt-2 text-stone-500">{t('pricing.subtitle')}</p>

        {isFounder && (
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 text-amber-800 text-sm font-medium">
            <Zap className="w-4 h-4" />
            {t('pricing.founderDiscount', { percent: cycle === 'monthly' ? discounts.founder : discounts.founderAnnual })}
          </div>
        )}
      </div>

      {/* Billing toggle */}
      <div className="flex items-center justify-center gap-3 mb-10">
        <button
          onClick={() => setCycle('monthly')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            cycle === 'monthly'
              ? 'bg-primary text-white'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          {t('pricing.monthly')}
        </button>
        <button
          onClick={() => setCycle('annual')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            cycle === 'annual'
              ? 'bg-primary text-white'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          {t('pricing.annual')}
          <span className="ml-1.5 text-xs opacity-80">
            ({t('pricing.annualSave', { percent: discounts.annual })})
          </span>
        </button>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 max-w-5xl mx-auto">
        {plans
          .sort((a, b) => a.displayOrder - b.displayOrder)
          .map((plan) => {
            const price = calculatePrice(plan, cycle, isFounder, discounts)
            const isCurrentPlan = plan.slug === currentPlanSlug
            const isPopular = plan.slug === 'solo'
            const borderColor = PLAN_COLORS[plan.slug] || 'border-stone-200'

            return (
              <div
                key={plan.id}
                className={`relative bg-white rounded-xl border-2 ${borderColor} p-6 flex flex-col transition-shadow hover:shadow-lg ${
                  isCurrentPlan ? 'ring-2 ring-emerald-400' : ''
                }`}
              >
                {/* Badges */}
                {isPopular && !isCurrentPlan && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-primary text-white text-xs font-semibold rounded-full">
                    {t('pricing.popular')}
                  </div>
                )}
                {isCurrentPlan && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-emerald-500 text-white text-xs font-semibold rounded-full">
                    {t('pricing.currentPlan')}
                  </div>
                )}

                {/* Plan name */}
                <h3 className="text-lg font-bold text-stone-900 mb-2">{plan.name}</h3>

                {/* Price */}
                <div className="mb-1">
                  <span className="text-3xl font-bold text-primary">{price}$</span>
                  <span className="text-sm text-stone-500">
                    {cycle === 'monthly' ? t('pricing.perMonth') : t('pricing.perYear')}
                  </span>
                </div>
                {cycle === 'annual' && (
                  <p className="text-xs text-stone-400 mb-4">{t('pricing.billedAnnually')}</p>
                )}
                {cycle === 'monthly' && <div className="mb-4" />}

                {/* Features */}
                <ul className="space-y-2.5 mb-6 flex-1">
                  {getPlanFeatures(plan, t).map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-stone-600">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Button
                  onClick={() => handleSelectPlan(plan)}
                  disabled={isCurrentPlan && isActive}
                  className={`w-full ${
                    isCurrentPlan && isActive
                      ? 'bg-stone-200 text-stone-500 cursor-not-allowed'
                      : isPopular
                        ? 'bg-primary hover:bg-primary/90 text-white'
                        : 'bg-stone-900 hover:bg-stone-800 text-white'
                  }`}
                >
                  {isCurrentPlan && isActive
                    ? t('pricing.currentPlan')
                    : isTrial || !isActive
                      ? t('pricing.subscribe')
                      : t('pricing.changePlan')
                  }
                </Button>
              </div>
            )
          })}
      </div>

      {/* Subscribe Modal */}
      <SubscribeModal
        open={modal.open}
        onOpenChange={(open) => setModal((m) => ({ ...m, open }))}
        planSlug={modal.planSlug}
        planName={modal.planName}
        billingCycle={cycle}
        price={modal.price}
        isFounder={isFounder}
        mode={modal.mode}
      />
    </div>
  )
}
