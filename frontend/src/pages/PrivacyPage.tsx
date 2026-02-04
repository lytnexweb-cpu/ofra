import { useTranslation } from 'react-i18next'
import { MarketingLayout } from '../components/marketing/MarketingLayout'

export default function PrivacyPage() {
  const { t } = useTranslation()

  return (
    <MarketingLayout showBackButton>
      <div className="pt-32 pb-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-primary dark:text-white font-outfit mb-8">
            {t('legal.privacy.title')}
          </h1>

          <div className="prose prose-stone dark:prose-invert max-w-none">
            <p className="text-lg text-stone-600 dark:text-stone-300 mb-8">
              {t('legal.privacy.lastUpdated')}: 2026-01-31
            </p>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-stone-900 dark:text-white mb-4">
                {t('legal.privacy.sections.collection.title')}
              </h2>
              <p className="text-stone-600 dark:text-stone-300">
                {t('legal.privacy.sections.collection.content')}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-stone-900 dark:text-white mb-4">
                {t('legal.privacy.sections.usage.title')}
              </h2>
              <p className="text-stone-600 dark:text-stone-300">
                {t('legal.privacy.sections.usage.content')}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-stone-900 dark:text-white mb-4">
                {t('legal.privacy.sections.storage.title')}
              </h2>
              <p className="text-stone-600 dark:text-stone-300">
                {t('legal.privacy.sections.storage.content')}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-stone-900 dark:text-white mb-4">
                {t('legal.privacy.sections.rights.title')}
              </h2>
              <p className="text-stone-600 dark:text-stone-300">
                {t('legal.privacy.sections.rights.content')}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-stone-900 dark:text-white mb-4">
                {t('legal.privacy.sections.contact.title')}
              </h2>
              <p className="text-stone-600 dark:text-stone-300">
                {t('legal.privacy.sections.contact.content')}
              </p>
            </section>
          </div>
        </div>
      </div>
    </MarketingLayout>
  )
}
