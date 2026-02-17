import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MarketingLayout } from '../components/marketing/MarketingLayout'
import { Button } from '../components/ui/Button'
import { Check, Minus, Zap, ChevronDown, ChevronUp, Loader2, Crown, Infinity, ArrowRight } from 'lucide-react'
import { plansApi, type PublicPlan } from '../api/plans.api'
import { authApi } from '../api/auth.api'
import { subscriptionApi } from '../api/subscription.api'
import { toast } from '../hooks/use-toast'

// Plan metadata not stored in DB
const PLAN_META: Record<string, {
  tagline: { fr: string; en: string }
  popular?: boolean
  comingSoon?: boolean
}> = {
  starter: {
    tagline: { fr: 'Je fais ça à côté', en: 'Side hustle' },
  },
  solo: {
    tagline: { fr: 'Je lance ma pratique', en: 'Growing my practice' },
  },
  pro: {
    tagline: { fr: 'Pipeline chargé', en: 'Busy pipeline' },
    popular: true,
  },
  agence: {
    tagline: { fr: 'Mon équipe grandit', en: 'Team is growing' },
    comingSoon: true,
  },
}

// PRD §2.6 Feature Gates per plan
type GateFeature = {
  key: string
  included: boolean
  params?: Record<string, string | number>
}

const PLAN_GATES: Record<string, GateFeature[]> = {
  starter: [
    { key: 'guidedWorkflow', included: true },
    { key: 'conditionsEngine', included: true },
    { key: 'pdfExportsLimited', included: true, params: { count: 3 } },
    { key: 'shareLinksLimited', included: true, params: { count: 1 } },
    { key: 'conditionPacks', included: false },
    { key: 'fintrac', included: false },
    { key: 'evidence', included: false },
    { key: 'auditHistory', included: false },
  ],
  solo: [
    { key: 'guidedWorkflow', included: true },
    { key: 'conditionsEngine', included: true },
    { key: 'exportsUnlimited', included: true },
    { key: 'conditionPacks', included: true },
    { key: 'fintrac', included: true },
    { key: 'evidence', included: false },
    { key: 'auditHistory', included: false },
  ],
  pro: [
    { key: 'guidedWorkflow', included: true },
    { key: 'conditionsEngine', included: true },
    { key: 'exportsUnlimited', included: true },
    { key: 'conditionPacks', included: true },
    { key: 'fintrac', included: true },
    { key: 'evidence', included: true },
    { key: 'auditHistory', included: true },
  ],
  agence: [
    { key: 'guidedWorkflow', included: true },
    { key: 'conditionsEngine', included: true },
    { key: 'exportsUnlimited', included: true },
    { key: 'conditionPacks', included: true },
    { key: 'fintrac', included: true },
    { key: 'evidence', included: true },
    { key: 'auditHistory', included: true },
    { key: 'multiUser', included: true, params: { count: 3 } },
  ],
}

function formatPrice(price: number | string): string {
  const n = Number(price)
  return Math.round(n) === n ? String(n) : n.toFixed(2)
}

function PlanCard({
  plan,
  isAnnual,
  isFr,
  currentPlanSlug,
  onChangePlan,
  isChanging,
}: {
  plan: PublicPlan
  isAnnual: boolean
  isFr: boolean
  currentPlanSlug?: string | null
  onChangePlan?: (slug: string) => void
  isChanging?: boolean
}) {
  const { t } = useTranslation()
  const meta = PLAN_META[plan.slug] || {}
  const price = isAnnual
    ? Math.round(plan.annualPrice / 12)
    : plan.monthlyPrice
  const totalAnnual = plan.annualPrice
  const monthlyIfNotAnnual = plan.monthlyPrice

  return (
    <div
      className={`relative bg-white dark:bg-stone-800 rounded-2xl p-6 md:p-8 flex flex-col ${
        meta.popular
          ? 'ring-2 ring-primary dark:ring-accent shadow-xl md:scale-105 z-10'
          : meta.comingSoon
            ? 'border border-dashed border-stone-300 dark:border-stone-600 opacity-80'
            : 'border border-stone-200 dark:border-stone-700 shadow-sm'
      }`}
    >
      {meta.popular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1 bg-accent text-white text-xs font-semibold px-3 py-1 rounded-full">
            <Zap className="w-3 h-3" />
            {t('pricing.popular')}
          </span>
        </div>
      )}

      <div className="text-center mb-6">
        <h3 className="text-xl font-bold uppercase tracking-wide text-stone-900 dark:text-white mb-1">
          {plan.name}
        </h3>
        <p className="text-sm text-stone-500 dark:text-stone-400 italic mb-4">
          "{isFr ? meta.tagline?.fr : meta.tagline?.en}"
        </p>

        <div className="mb-1">
          <span className="text-4xl font-bold text-primary dark:text-white">
            {formatPrice(price)}$
          </span>
          <span className="text-stone-500 dark:text-stone-400 ml-1">
            /{t('pricing.month', 'mois')}
          </span>
        </div>

        {isAnnual && (
          <div className="text-xs mt-1">
            <p className="text-stone-400">
              <span className="line-through">{formatPrice(Number(monthlyIfNotAnnual) * 12)}$</span>
              {' → '}<span className="text-emerald-600 font-medium">{formatPrice(totalAnnual)}$/{t('pricing.year')}</span>
            </p>
            <p className="text-emerald-600 font-medium">
              {t('pricing.save', { amount: formatPrice(Number(monthlyIfNotAnnual) * 12 - Number(totalAnnual)) })}
            </p>
          </div>
        )}
      </div>

      {/* Features — PRD §2.6 gates */}
      <ul className="space-y-2.5 flex-1 mb-6">
        {/* TX actives (from API) */}
        <li className="flex items-center gap-2.5 text-sm">
          <Check className="w-4 h-4 text-emerald-500 shrink-0" />
          <span className="text-stone-700 dark:text-stone-300">
            {plan.maxTransactions
              ? `${plan.maxTransactions} TX ${t('pricing.activeTransactions', 'actives')}`
              : <span className="flex items-center gap-1"><Infinity className="w-3.5 h-3.5" /> TX {t('pricing.unlimited', 'illimité')}</span>
            }
          </span>
        </li>
        {/* Storage (from API) */}
        <li className="flex items-center gap-2.5 text-sm">
          <Check className="w-4 h-4 text-emerald-500 shrink-0" />
          <span className="text-stone-700 dark:text-stone-300">
            {plan.maxStorageGb} Go {t('pricing.storage', 'stockage')}
          </span>
        </li>
        {/* Gated features per plan */}
        {(PLAN_GATES[plan.slug] ?? []).map((gate) => (
          <li key={gate.key} className="flex items-center gap-2.5 text-sm">
            {gate.included ? (
              <Check className="w-4 h-4 text-emerald-500 shrink-0" />
            ) : (
              <Minus className="w-4 h-4 text-stone-300 dark:text-stone-600 shrink-0" />
            )}
            <span className={gate.included ? 'text-stone-700 dark:text-stone-300' : 'text-stone-400 dark:text-stone-500'}>
              {t(`pricing.gates.${gate.key}`, gate.params)}
            </span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      {meta.comingSoon ? (
        <Button variant="outline" className="w-full" disabled>
          {t('pricing.comingSoon', 'Bientôt disponible')}
        </Button>
      ) : currentPlanSlug === plan.slug ? (
        <Button variant="outline" className="w-full" disabled>
          {t('pricing.currentPlan', 'Forfait actuel')}
        </Button>
      ) : currentPlanSlug && onChangePlan ? (
        <Button
          className={`w-full ${
            meta.popular
              ? 'bg-primary hover:bg-primary/90 dark:bg-accent dark:hover:bg-accent/90'
              : ''
          }`}
          variant={meta.popular ? 'default' : 'outline'}
          onClick={() => onChangePlan(plan.slug)}
          disabled={isChanging}
        >
          {isChanging ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          {t('pricing.selectPlan', 'Choisir ce forfait')}
        </Button>
      ) : (
        <Link to="/register" className="block">
          <Button
            className={`w-full ${
              meta.popular
                ? 'bg-primary hover:bg-primary/90 dark:bg-accent dark:hover:bg-accent/90'
                : ''
            }`}
            variant={meta.popular ? 'default' : 'outline'}
          >
            {t('pricing.cta.start', 'Commencer')}
          </Button>
        </Link>
      )}
    </div>
  )
}

function FounderBanner() {
  const { t } = useTranslation()

  return (
    <div className="max-w-5xl mx-auto mb-10 relative overflow-hidden rounded-2xl border border-amber-200/60 bg-gradient-to-r from-amber-50/80 via-white to-amber-50/40 dark:from-amber-950/30 dark:via-stone-800 dark:to-amber-950/20 dark:border-amber-800/40 p-6">
      <div
        className="absolute top-0 right-0 w-[300px] h-[300px] pointer-events-none"
        style={{ background: 'radial-gradient(circle at top right, rgba(217,119,6,0.08), transparent 55%)' }}
      />
      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0">
            <Crown className="w-5 h-5 text-amber-700 dark:text-amber-400" />
          </div>
          <div>
            <h3 className="font-bold text-stone-900 dark:text-white text-sm sm:text-base flex flex-wrap items-center gap-2">
              {t('pricing.founder.title')}
              <span className="text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 rounded-full">
                {t('pricing.founder.spots')}
              </span>
            </h3>
            <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">
              {t('pricing.founder.desc')}
            </p>
          </div>
        </div>
        <Link to="/register?founder=1" className="shrink-0 sm:ml-auto">
          <Button size="sm" className="bg-primary hover:bg-primary/90 text-white gap-1.5">
            <Crown className="w-4 h-4 text-amber-400" />
            {t('pricing.founder.cta')}
            <ArrowRight className="w-3.5 h-3.5 opacity-60" />
          </Button>
        </Link>
      </div>
    </div>
  )
}

function BillingToggle({
  isAnnual,
  onToggle,
}: {
  isAnnual: boolean
  onToggle: (v: boolean) => void
}) {
  const { t } = useTranslation()

  return (
    <div className="flex items-center justify-center gap-3 mb-10">
      <button
        onClick={() => onToggle(false)}
        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
          !isAnnual
            ? 'bg-primary text-white shadow-sm'
            : 'text-stone-600 dark:text-stone-300 hover:text-stone-900'
        }`}
      >
        {t('pricing.monthly', 'Mensuel')}
      </button>
      <button
        onClick={() => onToggle(true)}
        className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${
          isAnnual
            ? 'bg-primary text-white shadow-sm'
            : 'text-stone-600 dark:text-stone-300 hover:text-stone-900'
        }`}
      >
        {t('pricing.annual', 'Annuel')}
        <span className={`text-xs px-1.5 py-0.5 rounded-full ${
          isAnnual ? 'bg-white/20' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400'
        }`}>
          {t('pricing.saveMonths')}
        </span>
      </button>
    </div>
  )
}

function FAQItem({ question, answer, id }: { question: string; answer: string; id: string }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm overflow-hidden">
      <button
        className="w-full px-6 py-4 flex items-center justify-between text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span className="font-semibold text-stone-900 dark:text-white pr-4">{question}</span>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-stone-500 shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-stone-500 shrink-0" />
        )}
      </button>
      {isOpen && (
        <div className="px-6 pb-4">
          <p className="text-stone-600 dark:text-stone-300">{answer}</p>
        </div>
      )}
    </div>
  )
}

function ComparisonTable({ plans, isFr }: { plans: PublicPlan[]; isFr: boolean }) {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const unlimited = isFr ? 'Illimité' : 'Unlimited'

  type CellValue = string | boolean
  type CompareRow = { label: string; values: Record<string, CellValue> }
  type CompareCategory = { name: string; rows: CompareRow[] }

  const categories: CompareCategory[] = [
    {
      name: t('pricing.comparison.limits'),
      rows: [
        { label: t('pricing.comparison.txActives'), values: { starter: '5', solo: '12', pro: '25', agence: '∞' } },
        { label: t('pricing.comparison.storage'), values: { starter: '1 Go', solo: '3 Go', pro: '10 Go', agence: '25 Go' } },
        { label: t('pricing.comparison.users'), values: { starter: '1', solo: '1', pro: '1', agence: '3' } },
      ],
    },
    {
      name: t('pricing.comparison.base'),
      rows: [
        { label: t('pricing.gates.guidedWorkflow'), values: { starter: true, solo: true, pro: true, agence: true } },
        { label: t('pricing.gates.conditionsEngine'), values: { starter: true, solo: true, pro: true, agence: true } },
      ],
    },
    {
      name: t('pricing.comparison.exports'),
      rows: [
        { label: t('pricing.comparison.pdfExports'), values: { starter: isFr ? '3/mois' : '3/mo', solo: unlimited, pro: unlimited, agence: unlimited } },
        { label: t('pricing.comparison.shareLinks'), values: { starter: '1/TX', solo: unlimited, pro: unlimited, agence: unlimited } },
      ],
    },
    {
      name: t('pricing.comparison.premium'),
      rows: [
        { label: t('pricing.gates.conditionPacks'), values: { starter: false, solo: true, pro: true, agence: true } },
        { label: t('pricing.gates.fintrac'), values: { starter: false, solo: true, pro: true, agence: true } },
        { label: t('pricing.gates.evidence'), values: { starter: false, solo: false, pro: true, agence: true } },
        { label: t('pricing.gates.auditHistory'), values: { starter: false, solo: false, pro: true, agence: true } },
      ],
    },
  ]

  const planOrder = ['starter', 'solo', 'pro', 'agence']

  return (
    <section className="py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="mx-auto flex items-center gap-2 text-primary dark:text-accent font-semibold hover:underline transition-colors"
        >
          {t('pricing.comparison.toggle')}
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {isOpen && (
          <div className="mt-8 overflow-x-auto rounded-xl border border-stone-200 dark:border-stone-700">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-stone-50 dark:bg-stone-800">
                  <th className="sticky left-0 z-10 bg-stone-50 dark:bg-stone-800 text-left px-4 py-3 font-semibold text-stone-600 dark:text-stone-300 min-w-[180px]">
                    {t('pricing.comparison.feature')}
                  </th>
                  {planOrder.map((slug) => {
                    const plan = plans.find((p) => p.slug === slug)
                    const isPopular = PLAN_META[slug]?.popular
                    return (
                      <th
                        key={slug}
                        className={`px-4 py-3 text-center font-bold min-w-[110px] ${
                          isPopular
                            ? 'text-primary dark:text-accent'
                            : 'text-stone-700 dark:text-stone-200'
                        }`}
                      >
                        {plan?.name ?? slug}
                        {isPopular && <Zap className="w-3 h-3 inline ml-1 text-accent" />}
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {categories.flatMap((cat) => [
                  <tr key={`cat-${cat.name}`}>
                    <td
                      colSpan={5}
                      className="px-4 py-2.5 bg-stone-100 dark:bg-stone-900/60 font-semibold text-stone-800 dark:text-stone-200 text-xs uppercase tracking-wider"
                    >
                      {cat.name}
                    </td>
                  </tr>,
                  ...cat.rows.map((row, ri) => (
                    <tr
                      key={row.label}
                      className={ri % 2 === 0 ? 'bg-white dark:bg-stone-800' : 'bg-stone-50/50 dark:bg-stone-800/50'}
                    >
                      <td className="sticky left-0 z-10 bg-inherit px-4 py-2.5 text-stone-600 dark:text-stone-300">
                        {row.label}
                      </td>
                      {planOrder.map((slug) => {
                        const val = row.values[slug]
                        const isPopular = PLAN_META[slug]?.popular
                        return (
                          <td
                            key={slug}
                            className={`px-4 py-2.5 text-center ${
                              isPopular ? 'bg-primary/[0.03] dark:bg-accent/[0.05]' : ''
                            }`}
                          >
                            {typeof val === 'boolean' ? (
                              val ? (
                                <Check className="w-4 h-4 text-emerald-500 mx-auto" />
                              ) : (
                                <Minus className="w-4 h-4 text-stone-300 dark:text-stone-600 mx-auto" />
                              )
                            ) : (
                              <span className="text-stone-700 dark:text-stone-300 font-medium">{val}</span>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  )),
                ])}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}

export default function PricingPage() {
  const { t, i18n } = useTranslation()
  const [isAnnual, setIsAnnual] = useState(false)
  const isFr = i18n.language === 'fr'
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['plans'],
    queryFn: plansApi.list,
    staleTime: 5 * 60 * 1000,
  })

  // Check if user is logged in
  const { data: authData } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: authApi.me,
    retry: false,
    staleTime: 5 * 60 * 1000,
  })
  const isLoggedIn = authData?.success === true

  // Get current plan if logged in
  const { data: subData } = useQuery({
    queryKey: ['subscription'],
    queryFn: subscriptionApi.get,
    enabled: isLoggedIn,
    staleTime: 2 * 60 * 1000,
  })
  const currentPlanSlug = subData?.data?.plan?.slug ?? null

  // Change plan mutation
  const changePlanMutation = useMutation({
    mutationFn: (slug: string) => subscriptionApi.changePlan(slug, isAnnual ? 'annual' : 'monthly'),
    onSuccess: (response) => {
      if (response.success) {
        toast({
          title: t('pricing.planChanged', 'Forfait changé avec succès!'),
          variant: 'success',
        })
        queryClient.invalidateQueries({ queryKey: ['subscription'] })
        queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
        navigate('/account')
      } else if (response.error?.code === 'E_DOWNGRADE_BLOCKED') {
        const meta = (response.error as any).meta
        toast({
          title: t('pricing.downgradeBlocked', {
            count: meta?.archiveNeeded ?? '?',
            plan: meta?.planName ?? '',
            defaultValue: 'Archivez {{count}} transaction(s) d\'abord.',
          }),
          variant: 'destructive',
        })
      }
    },
    onError: () => {
      toast({ title: t('common.error'), variant: 'destructive' })
    },
  })

  const plans = data?.data?.plans ?? []

  return (
    <MarketingLayout showBackButton>
      {/* Header — Premium dark gradient */}
      <section
        className="pt-16 relative overflow-hidden"
        style={{ background: 'linear-gradient(180deg, #0B1A2F 0%, #1E3A5F 100%)' }}
      >
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at center, rgba(217,119,6,0.06) 0%, transparent 60%)' }}
        />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-16 pb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 font-outfit">
            {t('pricing.title')}
          </h1>
          <p className="text-base sm:text-lg text-white/60 max-w-2xl mx-auto">
            {t('pricing.subtitle')}
          </p>
        </div>
      </section>

      {/* Founder Banner */}
      <section className="pb-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FounderBanner />
        </div>
      </section>

      {/* Billing Toggle */}
      <section className="pb-4">
        <BillingToggle isAnnual={isAnnual} onToggle={setIsAnnual} />
      </section>

      {/* Plan Cards */}
      <section className="pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {plans.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  isAnnual={isAnnual}
                  isFr={isFr}
                  currentPlanSlug={isLoggedIn ? currentPlanSlug : undefined}
                  onChangePlan={isLoggedIn ? (slug) => changePlanMutation.mutate(slug) : undefined}
                  isChanging={changePlanMutation.isPending}
                />
              ))}
            </div>
          )}

          {/* Trust badges */}
          <p className="text-center text-xs text-stone-400 mt-8">
            {t('pricing.trust')}
          </p>
        </div>
      </section>

      {/* Comparison Table */}
      {!isLoading && plans.length > 0 && (
        <ComparisonTable plans={plans} isFr={isFr} />
      )}

      {/* FAQ */}
      <section className="py-20 bg-stone-50 dark:bg-stone-900">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl sm:text-2xl font-bold text-primary dark:text-white text-center mb-12 font-outfit">
            {t('pricing.faq.title')}
          </h2>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <FAQItem
                key={`faq-${i}`}
                id={`${i}`}
                question={t(`pricing.faq.q${i}`)}
                answer={t(`pricing.faq.a${i}`)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        className="py-16 relative overflow-hidden"
        style={{ background: 'linear-gradient(180deg, #0B1A2F 0%, #1E3A5F 100%)' }}
      >
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at center, rgba(217,119,6,0.06) 0%, transparent 55%)' }}
        />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-4 font-outfit">
            {t('pricing.cta.title')}
          </h2>
          <p className="text-white/50 mb-8">
            {t('pricing.cta.subtitle')}
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-amber-500 hover:bg-amber-400 text-white font-bold rounded-xl text-lg shadow-[0_4px_25px_rgba(217,119,6,0.3)] hover:shadow-[0_8px_40px_rgba(217,119,6,0.45)] hover:-translate-y-0.5 transition-all duration-300"
          >
            {t('pricing.cta.button')}
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </MarketingLayout>
  )
}
