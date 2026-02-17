import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { MarketingLayout } from '../components/marketing/MarketingLayout'
import { ArrowRight } from 'lucide-react'

const FAQ_CATEGORIES = ['general', 'trial', 'features', 'billing', 'security'] as const

const FAQ_COUNTS: Record<string, number> = {
  general: 4,
  trial: 3,
  features: 4,
  billing: 3,
  security: 3,
}

export default function FaqPage() {
  const { t } = useTranslation()
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.1 }
    )
    const els = rootRef.current?.querySelectorAll('.reveal')
    els?.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <MarketingLayout showBackButton>
      <div ref={rootRef}>
        {/* ═══════════════════════ HERO ═══════════════════════ */}
        <section
          className="relative pt-28 pb-20 md:pt-36 md:pb-28 overflow-hidden"
          style={{ background: 'linear-gradient(180deg, #0B1A2F 0%, #122742 50%, #1E3A5F 100%)' }}
        >
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.03]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
              backgroundSize: '60px 60px',
            }}
          />
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(217,119,6,0.06) 0%, transparent 60%)',
            }}
          />

          <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6 font-outfit leading-tight">
              {t('faqPage.hero.title')}
            </h1>
            <p className="text-lg sm:text-xl text-white/50 max-w-2xl mx-auto leading-relaxed">
              {t('faqPage.hero.subtitle')}
            </p>
          </div>
        </section>

        {/* ═══════════════════════ FAQ SECTIONS ═══════════════════════ */}
        <section className="py-20 md:py-28 bg-white">
          <div className="max-w-3xl mx-auto px-6 space-y-16">
            {FAQ_CATEGORIES.map((category) => (
              <div key={category} className="reveal">
                <h2 className="text-2xl font-bold text-stone-900 mb-6 font-outfit flex items-center gap-3">
                  <span className="w-1 h-6 bg-primary rounded-full" />
                  {t(`faqPage.categories.${category}`)}
                </h2>

                <div className="space-y-3">
                  {Array.from({ length: FAQ_COUNTS[category] }).map((_, i) => (
                    <details
                      key={i}
                      className="group bg-stone-50 hover:bg-stone-100/80 rounded-xl border border-stone-200 overflow-hidden transition-colors"
                    >
                      <summary className="flex items-center justify-between px-6 py-5 cursor-pointer list-none font-semibold text-stone-800 hover:text-primary transition-colors">
                        {t(`faqPage.${category}.q${i + 1}`)}
                        <span className="ml-4 text-stone-400 group-open:rotate-45 transition-transform duration-200 text-xl leading-none shrink-0">
                          +
                        </span>
                      </summary>
                      <div className="px-6 pb-5 text-stone-500 leading-relaxed">
                        {t(`faqPage.${category}.a${i + 1}`)}
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══════════════════════ CTA ═══════════════════════ */}
        <section className="py-20 md:py-28 bg-stone-50">
          <div className="reveal max-w-3xl mx-auto px-6 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-stone-900 mb-4 font-outfit">
              {t('faqPage.cta.title')}
            </h2>
            <p className="text-lg text-stone-500 mb-8 max-w-xl mx-auto">
              {t('faqPage.cta.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/contact"
                className="px-8 py-3 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl text-base shadow-lg transition-all"
              >
                {t('faqPage.cta.contact')}
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 text-primary font-semibold hover:text-primary/80 transition-colors"
              >
                {t('faqPage.cta.trial')}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </MarketingLayout>
  )
}
