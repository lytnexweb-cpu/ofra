import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { plansApi, type PublicPlan } from '../api/plans.api'
import { subscriptionApi } from '../api/subscription.api'
import { authApi } from '../api/auth.api'
import SubscribeModal from '../components/SubscribeModal'
import { Button } from '../components/ui/Button'
import { Check, Minus, Zap, Loader2, Star } from 'lucide-react'

type BillingCycle = 'monthly' | 'annual'

// Feature definition: key matches i18n, minPlan = minimum plan slug required
interface PlanFeature {
  key: string
  /** Dynamic value per plan (e.g. "5", "1.00 Go") — if null, use i18n key as-is */
  getValue?: (plan: PublicPlan) => string | null
  /** Minimum plan slug required for this feature to be included */
  minPlan: 'starter' | 'solo' | 'pro' | 'agence'
}

const PLAN_ORDER = ['starter', 'solo', 'pro', 'agence'] as const
const PLAN_RANK: Record<string, number> = { starter: 0, solo: 1, pro: 2, agence: 3 }

const PLAN_SUBTITLES: Record<string, { fr: string; en: string }> = {
  starter: { fr: 'Je fais ça à côté', en: "I do this on the side" },
  solo: { fr: 'Je lance ma pratique', en: 'Starting my practice' },
  pro: { fr: 'Pipeline chargé', en: 'Busy pipeline' },
  agence: { fr: 'Mon équipe grandit', en: 'My team is growing' },
}

const PLAN_COLORS: Record<string, { border: string; bg: string }> = {
  starter: { border: 'border-stone-200', bg: '' },
  solo: { border: 'border-stone-200', bg: '' },
  pro: { border: 'border-primary', bg: 'bg-primary/[0.02]' },
  agence: { border: 'border-dashed border-stone-300', bg: 'bg-stone-50/50' },
}

/** All features shown on the pricing page, in display order */
const FEATURES: PlanFeature[] = [
  {
    key: 'activeTransactions',
    getValue: (p) => p.maxTransactions === null ? null : String(p.maxTransactions),
    minPlan: 'starter',
  },
  {
    key: 'storage',
    getValue: (p) => `${p.maxStorageGb.toFixed(2).replace(/\.?0+$/, '')} Go`,
    minPlan: 'starter',
  },
  { key: 'guidedWorkflow', minPlan: 'starter' },
  { key: 'conditionsEngine', minPlan: 'starter' },
  {
    key: 'exportsSharing',
    getValue: (p) => {
      const rank = PLAN_RANK[p.slug] ?? 0
      return rank >= 1 ? null : undefined // Solo+ gets unlimited (null=use default), Starter returns undefined (excluded handled by minPlan)
    },
    minPlan: 'starter', // Starter gets limited version, Solo+ gets unlimited
  },
  { key: 'autoConditions', minPlan: 'solo' },
  { key: 'fintracIdentity', minPlan: 'solo' },
  { key: 'evidenceResolution', minPlan: 'pro' },
  { key: 'auditHistory', minPlan: 'pro' },
]

function isPlanIncluded(planSlug: string, minPlan: string): boolean {
  return (PLAN_RANK[planSlug] ?? 0) >= (PLAN_RANK[minPlan] ?? 0)
}

function getFeatureLabel(
  feature: PlanFeature,
  plan: PublicPlan,
  t: (key: string, opts?: Record<string, unknown>) => string
): string {
  // Special case: exports/sharing — Starter gets limited, Solo+ unlimited
  if (feature.key === 'exportsSharing') {
    const rank = PLAN_RANK[plan.slug] ?? 0
    if (rank === 0) {
      return t('pricing.feat.exportsLimited')
    }
    return t('pricing.feat.exportsUnlimited')
  }

  // Special: TX actives with dynamic count
  if (feature.key === 'activeTransactions') {
    if (plan.maxTransactions === null) {
      return t('pricing.feat.transactionsUnlimited')
    }
    return t('pricing.feat.activeTransactions', { count: plan.maxTransactions })
  }

  // Special: storage with dynamic value
  if (feature.key === 'storage') {
    return t('pricing.feat.storage', { value: plan.maxStorageGb })
  }

  return t(`pricing.feat.${feature.key}`)
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
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const lang = i18n.language as 'fr' | 'en'
  const [cycle, setCycle] = useState<BillingCycle>('monthly')
  const [modal, setModal] = useState<{
    open: boolean
    planSlug: string
    planName: string
    price: number
    mode: 'new' | 'change'
  }>({ open: false, planSlug: '', planName: '', price: 0, mode: 'new' })

  // Check if user is authenticated
  const { data: authData, isLoading: authLoading } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: authApi.me,
    retry: false,
    staleTime: 5 * 60 * 1000,
  })
  const isAuthenticated = authData?.success === true

  const { data: plansData, isLoading: plansLoading } = useQuery({
    queryKey: ['plans'],
    queryFn: plansApi.list,
    staleTime: 10 * 60 * 1000,
  })

  const { data: subData } = useQuery({
    queryKey: ['subscription'],
    queryFn: subscriptionApi.get,
    staleTime: 2 * 60 * 1000,
    enabled: isAuthenticated,
  })

  const plans = plansData?.data?.plans ?? []
  const discounts = plansData?.data?.discounts ?? { annual: 20, founder: 20, founderAnnual: 30 }
  const sub = subData?.data
  const isFounder = sub?.billing?.isFounder ?? false
  const currentPlanSlug = sub?.plan?.slug ?? null
  const isTrial = sub?.trial?.active ?? false
  const isActive = sub?.billing?.subscriptionStatus === 'active'

  const handleSelectPlan = (plan: PublicPlan) => {
    if (plan.slug === 'agence') return // Agence = coming soon

    // Not authenticated → redirect to register with plan param
    if (!isAuthenticated) {
      navigate(`/register?plan=${plan.slug}`)
      return
    }

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

  if (plansLoading || authLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div data-testid="pricing-page" className="max-w-6xl mx-auto">
      {/* Founder banner */}
      {isFounder && (
        <div className="mb-8 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800">
          <Zap className="w-5 h-5 text-amber-600 shrink-0" />
          <span className="text-sm font-medium">
            {t('pricing.founderBanner', { percent: cycle === 'monthly' ? discounts.founder : discounts.founderAnnual })}
          </span>
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-8">
        <h1
          className="text-2xl font-bold text-stone-900"
          style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
        >
          {t('pricing.title')}
        </h1>
        <p className="mt-2 text-stone-500">{t('pricing.subtitle')}</p>
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
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {plans
          .sort((a, b) => a.displayOrder - b.displayOrder)
          .map((plan) => {
            const price = calculatePrice(plan, cycle, isFounder, discounts)
            const isCurrentPlan = plan.slug === currentPlanSlug
            const isPopular = plan.slug === 'pro'
            const isAgence = plan.slug === 'agence'
            const colors = PLAN_COLORS[plan.slug] || { border: 'border-stone-200', bg: '' }
            const subtitle = PLAN_SUBTITLES[plan.slug]

            return (
              <div
                key={plan.id}
                className={`relative bg-white rounded-xl border-2 ${colors.border} ${colors.bg} p-6 flex flex-col transition-shadow hover:shadow-lg ${
                  isPopular ? 'ring-2 ring-primary/20' : ''
                } ${isCurrentPlan ? 'ring-2 ring-emerald-400' : ''}`}
              >
                {/* Badges */}
                {isPopular && !isCurrentPlan && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-primary text-white text-xs font-semibold rounded-full flex items-center gap-1">
                    <Star className="w-3 h-3 fill-current" />
                    {t('pricing.popular')}
                  </div>
                )}
                {isCurrentPlan && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-emerald-500 text-white text-xs font-semibold rounded-full">
                    {t('pricing.currentPlan')}
                  </div>
                )}

                {/* Plan name + subtitle */}
                <h3 className="text-lg font-bold text-stone-900">{plan.name}</h3>
                {subtitle && (
                  <p className="text-xs text-stone-400 mt-0.5 mb-3">
                    {lang === 'fr' ? subtitle.fr : subtitle.en}
                  </p>
                )}

                {/* Price */}
                <div className="mb-1">
                  <span className="text-3xl font-bold text-primary">{price}$</span>
                  <span className="text-sm text-stone-500">
                    {cycle === 'monthly' ? t('pricing.perMonth') : t('pricing.perYear')}
                  </span>
                </div>
                {isFounder && (
                  <p className="text-xs text-amber-600 mb-1">
                    {t('pricing.founderPrice')}
                  </p>
                )}
                {cycle === 'annual' ? (
                  <p className="text-xs text-stone-400 mb-4">{t('pricing.billedAnnually')}</p>
                ) : (
                  <div className="mb-4" />
                )}

                {/* Features list */}
                <ul className="space-y-2 mb-6 flex-1">
                  {FEATURES.map((feature) => {
                    const included = isPlanIncluded(plan.slug, feature.minPlan)
                    const label = getFeatureLabel(feature, plan, t)

                    // Agence extra: show "3 utilisateurs" after TX
                    if (feature.key === 'activeTransactions' && plan.slug === 'agence') {
                      return (
                        <li key={feature.key}>
                          <div className="flex items-start gap-2 text-sm">
                            <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                            <span className="text-stone-700">{t('pricing.feat.transactionsUnlimited')}</span>
                          </div>
                          <div className="flex items-start gap-2 text-sm mt-2">
                            <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                            <span className="text-stone-700">{t('pricing.feat.users', { count: plan.maxUsers })}</span>
                          </div>
                        </li>
                      )
                    }

                    return (
                      <li key={feature.key} className="flex items-start gap-2 text-sm">
                        {included ? (
                          <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        ) : (
                          <Minus className="w-4 h-4 text-stone-300 shrink-0 mt-0.5" />
                        )}
                        <span className={included ? 'text-stone-700' : 'text-stone-400'}>
                          {label}
                        </span>
                      </li>
                    )
                  })}
                </ul>

                {/* CTA */}
                {isAgence ? (
                  <Button
                    disabled
                    className="w-full bg-stone-200 text-stone-500 cursor-not-allowed"
                  >
                    {t('pricing.comingSoon')}
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleSelectPlan(plan)}
                    disabled={isAuthenticated && isCurrentPlan && isActive}
                    className={`w-full ${
                      isAuthenticated && isCurrentPlan && isActive
                        ? 'bg-stone-200 text-stone-500 cursor-not-allowed'
                        : isPopular
                          ? 'bg-primary hover:bg-primary/90 text-white'
                          : 'bg-stone-900 hover:bg-stone-800 text-white'
                    }`}
                  >
                    {!isAuthenticated
                      ? t('pricing.startTrial')
                      : isCurrentPlan && isActive
                        ? t('pricing.currentPlan')
                        : isTrial || !isActive
                          ? t('pricing.subscribe')
                          : t('pricing.changePlan')
                    }
                  </Button>
                )}
              </div>
            )
          })}
      </div>

      {/* Footer */}
      <p className="text-center text-sm text-stone-400 mt-8">
        {t('pricing.footer')}
      </p>

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
