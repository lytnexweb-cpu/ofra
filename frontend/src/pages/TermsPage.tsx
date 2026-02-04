import { useTranslation } from 'react-i18next'
import { MarketingLayout } from '../components/marketing/MarketingLayout'

export default function TermsPage() {
  const { t } = useTranslation()

  return (
    <MarketingLayout showBackButton>
      <div className="pt-32 pb-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-primary dark:text-white font-outfit mb-8">
            {t('legal.terms.title')}
          </h1>

          <div className="prose prose-stone dark:prose-invert max-w-none">
            <p className="text-lg text-stone-600 dark:text-stone-300 mb-8">
              {t('legal.terms.lastUpdated')}: 2026-01-31
            </p>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-stone-900 dark:text-white mb-4">
                {t('legal.terms.sections.acceptance.title')}
              </h2>
              <p className="text-stone-600 dark:text-stone-300">
                {t('legal.terms.sections.acceptance.content')}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-stone-900 dark:text-white mb-4">
                {t('legal.terms.sections.services.title')}
              </h2>
              <p className="text-stone-600 dark:text-stone-300">
                {t('legal.terms.sections.services.content')}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-stone-900 dark:text-white mb-4">
                {t('legal.terms.sections.account.title')}
              </h2>
              <p className="text-stone-600 dark:text-stone-300">
                {t('legal.terms.sections.account.content')}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-stone-900 dark:text-white mb-4">
                {t('legal.terms.sections.payment.title')}
              </h2>
              <p className="text-stone-600 dark:text-stone-300">
                {t('legal.terms.sections.payment.content')}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-stone-900 dark:text-white mb-4">
                {t('legal.terms.sections.termination.title')}
              </h2>
              <p className="text-stone-600 dark:text-stone-300">
                {t('legal.terms.sections.termination.content')}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-stone-900 dark:text-white mb-4">
                {t('legal.terms.sections.liability.title')}
              </h2>
              <p className="text-stone-600 dark:text-stone-300">
                {t('legal.terms.sections.liability.content')}
              </p>
            </section>
          </div>
        </div>
      </div>
    </MarketingLayout>
  )
}
