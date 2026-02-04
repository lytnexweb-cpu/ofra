import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { MarketingLayout } from '../components/marketing/MarketingLayout'
import { Button } from '../components/ui/Button'
import { Check, X, Zap, ChevronDown, ChevronUp } from 'lucide-react'

interface PlanFeature {
  key: string
  essentiel: boolean | string
  pro: boolean | string
  agence: boolean | string
}

const features: PlanFeature[] = [
  { key: 'users', essentiel: '1', pro: '3', agence: '10' },
  { key: 'transactions', essentiel: 'Unlimited', pro: 'Unlimited', agence: 'Unlimited' },
  { key: 'storage', essentiel: '500 MB', pro: '2 GB', agence: '10 GB' },
  { key: 'fileSize', essentiel: '5 MB', pro: '15 MB', agence: '25 MB' },
  { key: 'workflow', essentiel: true, pro: true, agence: true },
  { key: 'conditions', essentiel: true, pro: true, agence: true },
  { key: 'customWorkflows', essentiel: false, pro: true, agence: true },
  { key: 'reminders', essentiel: true, pro: true, agence: true },
  { key: 'csvImport', essentiel: false, pro: true, agence: true },
  { key: 'reports', essentiel: false, pro: true, agence: true },
  { key: 'advancedReports', essentiel: false, pro: false, agence: true },
  { key: 'api', essentiel: false, pro: false, agence: true },
  { key: 'onboarding', essentiel: false, pro: false, agence: true },
  { key: 'support', essentiel: 'Email', pro: 'Priority', agence: 'Phone' },
]

const plans = [
  {
    id: 'essentiel',
    nameKey: 'pricing.plans.essentiel.name',
    price: 29,
    currency: 'CAD',
    period: 'pricing.perMonth',
    descKey: 'pricing.plans.essentiel.desc',
    cta: 'pricing.plans.essentiel.cta',
    ctaLink: '/register',
    popular: false,
  },
  {
    id: 'pro',
    nameKey: 'pricing.plans.pro.name',
    price: 49,
    currency: 'CAD',
    period: 'pricing.perMonth',
    descKey: 'pricing.plans.pro.desc',
    cta: 'pricing.plans.pro.cta',
    ctaLink: '/register',
    popular: true,
  },
  {
    id: 'agence',
    nameKey: 'pricing.plans.agence.name',
    price: 99,
    currency: 'CAD',
    period: 'pricing.perMonth',
    descKey: 'pricing.plans.agence.desc',
    cta: 'pricing.plans.agence.cta',
    ctaLink: '/register',
    popular: false,
  },
]

function FAQItem({ question, answer, id }: { question: string; answer: string; id: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const panelId = `faq-panel-${id}`
  const buttonId = `faq-button-${id}`

  return (
    <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm overflow-hidden">
      <button
        id={buttonId}
        className="w-full px-6 py-4 flex items-center justify-between text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:focus-visible:ring-accent focus-visible:ring-offset-2"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls={panelId}
      >
        <span className="font-semibold text-stone-900 dark:text-white pr-4">{question}</span>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-stone-500 dark:text-stone-400 shrink-0" aria-hidden="true" />
        ) : (
          <ChevronDown className="w-5 h-5 text-stone-500 dark:text-stone-400 shrink-0" aria-hidden="true" />
        )}
      </button>
      <div
        id={panelId}
        role="region"
        aria-labelledby={buttonId}
        hidden={!isOpen}
        className={isOpen ? 'px-6 pb-4' : ''}
      >
        {isOpen && <p className="text-stone-600 dark:text-stone-300">{answer}</p>}
      </div>
    </div>
  )
}

export default function PricingPage() {
  const { t } = useTranslation()

  const renderFeatureValue = (value: boolean | string) => {
    if (typeof value === 'string') {
      return <span className="text-stone-900 dark:text-white font-medium text-sm">{value}</span>
    }
    return value ? (
      <Check className="w-5 h-5 text-emerald-500 mx-auto" aria-label="Included" />
    ) : (
      <X className="w-5 h-5 text-stone-300 dark:text-stone-600 mx-auto" aria-label="Not included" />
    )
  }

  return (
    <MarketingLayout showBackButton>
      {/* Header */}
      <section className="pt-32 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary dark:text-white mb-4 font-outfit">
            {t('pricing.title')}
          </h1>
          <p className="text-base sm:text-lg text-stone-600 dark:text-stone-300 max-w-2xl mx-auto">
            {t('pricing.subtitle')}
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative bg-white dark:bg-stone-800 rounded-2xl p-6 md:p-8 ${
                  plan.popular
                    ? 'ring-2 ring-primary dark:ring-accent shadow-xl md:scale-105'
                    : 'border border-stone-200 dark:border-stone-700 shadow-sm'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 bg-accent text-white text-xs font-semibold px-3 py-1 rounded-full">
                      <Zap className="w-3 h-3" />
                      {t('pricing.popular')}
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold text-stone-900 dark:text-white mb-2">
                    {t(plan.nameKey)}
                  </h3>
                  <div className="mb-2">
                    <span className="text-3xl md:text-4xl font-bold text-primary dark:text-white">${plan.price}</span>
                    <span className="text-stone-500 dark:text-stone-400 ml-1">{plan.currency} {t(plan.period)}</span>
                  </div>
                  <p className="text-sm text-stone-500 dark:text-stone-400">{t(plan.descKey)}</p>
                </div>

                <Link to={plan.ctaLink} className="block mb-6">
                  <Button
                    className={`w-full ${
                      plan.popular
                        ? 'bg-primary hover:bg-primary/90 dark:bg-accent dark:hover:bg-accent/90'
                        : 'bg-stone-100 dark:bg-stone-700 text-stone-900 dark:text-white hover:bg-stone-200 dark:hover:bg-stone-600'
                    }`}
                  >
                    {t(plan.cta)}
                  </Button>
                </Link>

                <ul className="space-y-3">
                  {features.map((feature) => {
                    const value = feature[plan.id as keyof typeof feature]
                    if (value === false) return null
                    return (
                      <li key={feature.key} className="flex items-center gap-3 text-sm">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span className="text-stone-600 dark:text-stone-300">
                          {t(`pricing.features.${feature.key}`)}
                          {typeof value === 'string' && (
                            <span className="text-stone-900 dark:text-white font-medium ml-1">({value})</span>
                          )}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="py-20 bg-white dark:bg-stone-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl sm:text-2xl font-bold text-primary dark:text-white text-center mb-12 font-outfit">
            {t('pricing.comparison.title')}
          </h2>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-stone-200 dark:border-stone-700">
                  <th className="text-left py-4 px-4 font-medium text-stone-500 dark:text-stone-400">
                    {t('pricing.comparison.feature')}
                  </th>
                  {plans.map((plan) => (
                    <th key={plan.id} className="text-center py-4 px-4 font-semibold text-stone-900 dark:text-white">
                      {t(plan.nameKey)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {features.map((feature) => (
                  <tr key={feature.key} className="border-b border-stone-100 dark:border-stone-700">
                    <td className="py-4 px-4 text-stone-600 dark:text-stone-300">
                      {t(`pricing.features.${feature.key}`)}
                    </td>
                    <td className="py-4 px-4 text-center">
                      {renderFeatureValue(feature.essentiel)}
                    </td>
                    <td className="py-4 px-4 text-center bg-primary/5 dark:bg-accent/5">
                      {renderFeatureValue(feature.pro)}
                    </td>
                    <td className="py-4 px-4 text-center">
                      {renderFeatureValue(feature.agence)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-6">
            {plans.map((plan) => (
              <div key={plan.id} className="bg-stone-50 dark:bg-stone-900 rounded-xl p-4">
                <h3 className="font-semibold text-stone-900 dark:text-white mb-4 text-center">
                  {t(plan.nameKey)}
                </h3>
                <ul className="space-y-2">
                  {features.map((feature) => {
                    const value = feature[plan.id as keyof typeof feature]
                    return (
                      <li key={feature.key} className="flex items-center justify-between py-2 border-b border-stone-200 dark:border-stone-700 last:border-0">
                        <span className="text-sm text-stone-600 dark:text-stone-300">
                          {t(`pricing.features.${feature.key}`)}
                        </span>
                        <span className="ml-4">{renderFeatureValue(value)}</span>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-stone-50 dark:bg-stone-900">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl sm:text-2xl font-bold text-primary dark:text-white text-center mb-12 font-outfit">
            {t('pricing.faq.title')}
          </h2>

          <div className="space-y-4" role="region" aria-label="FAQ">
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

      {/* CTA Section */}
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
