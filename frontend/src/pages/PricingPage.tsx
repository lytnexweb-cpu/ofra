import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { MarketingLayout } from '../components/marketing/MarketingLayout'
import { Button } from '../components/ui/Button'
import { Check, Zap, ChevronDown, ChevronUp, Loader2, HardHat, Infinity } from 'lucide-react'
import { plansApi, type PublicPlan } from '../api/plans.api'

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

function formatPrice(price: number): string {
  return Math.round(price) === price ? String(price) : price.toFixed(2)
}

function PlanCard({
  plan,
  isAnnual,
  isFr,
}: {
  plan: PublicPlan
  isAnnual: boolean
  isFr: boolean
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
          <p className="text-xs text-stone-400">
            <span className="line-through">{formatPrice(monthlyIfNotAnnual * 12)}$</span>
            {' '}<span className="text-emerald-600 font-medium">{formatPrice(totalAnnual)}$/an</span>
          </p>
        )}
      </div>

      {/* Features */}
      <ul className="space-y-2.5 flex-1 mb-6">
        <li className="flex items-center gap-2.5 text-sm">
          <Check className="w-4 h-4 text-emerald-500 shrink-0" />
          <span className="text-stone-700 dark:text-stone-300">
            {plan.maxTransactions
              ? `${plan.maxTransactions} TX ${t('pricing.activeTransactions', 'actives')}`
              : <span className="flex items-center gap-1"><Infinity className="w-3.5 h-3.5" /> TX {t('pricing.unlimited', 'illimité')}</span>
            }
          </span>
        </li>
        <li className="flex items-center gap-2.5 text-sm">
          <Check className="w-4 h-4 text-emerald-500 shrink-0" />
          <span className="text-stone-700 dark:text-stone-300">
            {plan.maxStorageGb} Go {t('pricing.storage', 'stockage')}
          </span>
        </li>
        <li className="flex items-center gap-2.5 text-sm">
          <Check className="w-4 h-4 text-emerald-500 shrink-0" />
          <span className="text-stone-700 dark:text-stone-300">
            {plan.historyMonths
              ? `${t('pricing.history', 'Historique')} ${plan.historyMonths} ${t('pricing.months', 'mois')}`
              : <span className="flex items-center gap-1">{t('pricing.history', 'Historique')} <Infinity className="w-3.5 h-3.5" /></span>
            }
          </span>
        </li>
        <li className="flex items-center gap-2.5 text-sm">
          <Check className="w-4 h-4 text-emerald-500 shrink-0" />
          <span className="text-stone-700 dark:text-stone-300">
            {t('pricing.conditionsEngine', 'Moteur de conditions')}
          </span>
        </li>
        <li className="flex items-center gap-2.5 text-sm">
          <Check className="w-4 h-4 text-emerald-500 shrink-0" />
          <span className="text-stone-700 dark:text-stone-300">
            {t('pricing.guidedWorkflow', 'Workflow guidé')}
          </span>
        </li>
      </ul>

      {/* CTA */}
      {meta.comingSoon ? (
        <Button variant="outline" className="w-full" disabled>
          {t('pricing.comingSoon', 'Bientôt disponible')}
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
    <div className="max-w-4xl mx-auto mb-10 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-5 md:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <HardHat className="w-8 h-8 text-amber-600 shrink-0" />
          <div>
            <h3 className="font-bold text-stone-900 dark:text-white text-sm sm:text-base">
              {t('pricing.founder.title', 'OFFRE FONDATEUR')}
              <span className="ml-2 text-xs font-normal text-amber-700 dark:text-amber-400">
                {t('pricing.founder.spots', '19/25 places restantes')}
              </span>
            </h3>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 mt-0.5">
              {t('pricing.founder.desc', '1 mois gratuit + -20% à vie (tous plans) · -30% si annuel')}
            </p>
          </div>
        </div>
        <Link to="/register" className="shrink-0 sm:ml-auto">
          <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white">
            {t('pricing.founder.cta', 'Devenir fondateur')} →
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
          -17%
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

export default function PricingPage() {
  const { t, i18n } = useTranslation()
  const [isAnnual, setIsAnnual] = useState(false)
  const isFr = i18n.language === 'fr'

  const { data, isLoading } = useQuery({
    queryKey: ['plans'],
    queryFn: plansApi.list,
    staleTime: 5 * 60 * 1000,
  })

  const plans = data?.data?.plans ?? []

  return (
    <MarketingLayout showBackButton>
      {/* Header */}
      <section className="pt-32 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary dark:text-white mb-4 font-outfit">
            {t('pricing.title')}
          </h1>
          <p className="text-base sm:text-lg text-stone-600 dark:text-stone-300 max-w-2xl mx-auto">
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
                />
              ))}
            </div>
          )}

          {/* Trust badges */}
          <p className="text-center text-xs text-stone-400 mt-8">
            {t('pricing.trust', 'Garantie 30j remboursé · 100% Canada 🍁 · FR/EN · Sans contrat')}
          </p>
        </div>
      </section>

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
      <section className="py-16 bg-primary dark:bg-stone-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-4 font-outfit">
            {t('pricing.cta.title')}
          </h2>
          <p className="text-white/80 mb-8">
            {t('pricing.cta.subtitle')}
          </p>
          <Link to="/register">
            <Button size="lg" className="bg-accent hover:bg-accent/90 text-white px-8">
              {t('pricing.cta.button')}
            </Button>
          </Link>
        </div>
      </section>
    </MarketingLayout>
  )
}
