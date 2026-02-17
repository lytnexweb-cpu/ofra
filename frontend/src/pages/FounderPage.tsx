import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { MarketingLayout } from '../components/marketing/MarketingLayout'
import { Button } from '../components/ui/Button'
import {
  Crown,
  Lock,
  Zap,
  Star,
  ArrowRight,
  Check,
  Shield,
  Clock,
  Users,
} from 'lucide-react'

const BENEFITS = [
  { id: 'priceLock', icon: Lock },
  { id: 'earlyAccess', icon: Zap },
  { id: 'badge', icon: Star },
  { id: 'directSupport', icon: Shield },
]

const STEPS = [
  { id: 'signup', icon: Users },
  { id: 'choose', icon: Crown },
  { id: 'locked', icon: Lock },
]

const SPOTS_TOTAL = 25
const SPOTS_TAKEN = 6

export default function FounderPage() {
  const { t } = useTranslation()
  const rootRef = useRef<HTMLDivElement>(null)
  const spotsRemaining = SPOTS_TOTAL - SPOTS_TAKEN

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
          {/* Grid pattern */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.03]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
              backgroundSize: '60px 60px',
            }}
          />
          {/* Golden glow */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(217,119,6,0.08) 0%, transparent 55%)',
            }}
          />

          <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 text-xs font-semibold tracking-widest uppercase text-amber-400 border border-amber-500/20 rounded-full bg-amber-500/5">
              <Crown className="w-3.5 h-3.5" />
              {t('founderPage.hero.badge')}
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6 font-outfit leading-tight">
              {t('founderPage.hero.title')}{' '}
              <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-200 bg-clip-text text-transparent">
                {t('founderPage.hero.titleHighlight')}
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-white/50 max-w-2xl mx-auto leading-relaxed mb-10">
              {t('founderPage.hero.subtitle')}
            </p>

            {/* Spots counter */}
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/[0.04] backdrop-blur-sm border border-white/[0.08] rounded-xl">
              <div className="flex -space-x-1.5">
                {Array.from({ length: Math.min(spotsRemaining, 8) }).map((_, i) => (
                  <div
                    key={i}
                    className="w-3 h-3 rounded-full bg-amber-400 border-2 border-[#122742]"
                  />
                ))}
                {Array.from({ length: Math.min(SPOTS_TAKEN, 4) }).map((_, i) => (
                  <div
                    key={`taken-${i}`}
                    className="w-3 h-3 rounded-full bg-white/20 border-2 border-[#122742]"
                  />
                ))}
              </div>
              <span className="text-sm font-semibold text-amber-400">
                {t('founderPage.hero.spotsLeft', { count: spotsRemaining, total: SPOTS_TOTAL })}
              </span>
            </div>
          </div>
        </section>

        {/* ═══════════════════════ WHAT IS IT ═══════════════════════ */}
        <section className="py-20 md:py-28 bg-white">
          <div className="reveal max-w-4xl mx-auto px-6">
            <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
              <div>
                <h2 className="text-3xl sm:text-4xl font-bold text-stone-900 mb-6 font-outfit">
                  {t('founderPage.what.title')}
                </h2>
                <p className="text-lg text-stone-500 leading-relaxed mb-4">
                  {t('founderPage.what.p1')}
                </p>
                <p className="text-lg text-stone-500 leading-relaxed">
                  {t('founderPage.what.p2')}
                </p>
              </div>

              {/* Golden card */}
              <div
                className="relative rounded-2xl p-8 border border-amber-200/60 overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 30%, #FDE68A 100%)',
                }}
              >
                <div
                  className="absolute inset-0 pointer-events-none opacity-30"
                  style={{
                    background: 'linear-gradient(135deg, transparent 40%, rgba(217,119,6,0.15) 100%)',
                  }}
                />
                <div className="relative z-10">
                  <Crown className="w-10 h-10 text-amber-600 mb-4" />
                  <h3 className="text-2xl font-bold text-amber-900 mb-2 font-outfit">
                    {t('founderPage.what.cardTitle')}
                  </h3>
                  <p className="text-amber-800/70 mb-6">
                    {t('founderPage.what.cardDesc')}
                  </p>
                  <div className="space-y-3">
                    {['perk1', 'perk2', 'perk3', 'perk4'].map((perk) => (
                      <div key={perk} className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-amber-600 shrink-0" />
                        <span className="text-sm font-medium text-amber-900">
                          {t(`founderPage.what.${perk}`)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════ BENEFITS ═══════════════════════ */}
        <section className="py-20 md:py-28 bg-stone-50">
          <div className="max-w-5xl mx-auto px-6">
            <div className="reveal text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-bold text-stone-900 mb-4 font-outfit">
                {t('founderPage.benefits.title')}
              </h2>
              <p className="text-lg text-stone-500 max-w-2xl mx-auto">
                {t('founderPage.benefits.subtitle')}
              </p>
            </div>

            <div className="reveal grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {BENEFITS.map(({ id, icon: Icon }) => (
                <div
                  key={id}
                  className="group bg-white rounded-xl p-6 border border-stone-100 hover:border-amber-200 hover:shadow-lg transition-all duration-300"
                >
                  <div className="w-12 h-12 rounded-lg bg-amber-50 group-hover:bg-amber-100 flex items-center justify-center mb-4 transition-colors">
                    <Icon className="w-6 h-6 text-amber-600" />
                  </div>
                  <h3 className="font-bold text-stone-800 mb-2 font-outfit">
                    {t(`founderPage.benefits.${id}.title`)}
                  </h3>
                  <p className="text-sm text-stone-500 leading-relaxed">
                    {t(`founderPage.benefits.${id}.desc`)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════ HOW IT WORKS ═══════════════════════ */}
        <section className="py-20 md:py-28 bg-white">
          <div className="max-w-4xl mx-auto px-6">
            <div className="reveal text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-bold text-stone-900 mb-4 font-outfit">
                {t('founderPage.howItWorks.title')}
              </h2>
              <p className="text-lg text-stone-500 max-w-2xl mx-auto">
                {t('founderPage.howItWorks.subtitle')}
              </p>
            </div>

            <div className="reveal grid sm:grid-cols-3 gap-8">
              {STEPS.map(({ id, icon: Icon }, index) => (
                <div key={id} className="relative text-center">
                  {/* Connector line */}
                  {index < STEPS.length - 1 && (
                    <div className="hidden sm:block absolute top-8 left-[60%] right-[-40%] h-px bg-gradient-to-r from-amber-300 to-amber-100" />
                  )}
                  <div className="relative z-10 w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 flex items-center justify-center mx-auto mb-5">
                    <Icon className="w-7 h-7 text-amber-600" />
                  </div>
                  <div className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-2">
                    {t('founderPage.howItWorks.stepLabel', { n: index + 1 })}
                  </div>
                  <h3 className="font-bold text-stone-800 mb-2 font-outfit">
                    {t(`founderPage.howItWorks.${id}.title`)}
                  </h3>
                  <p className="text-sm text-stone-500 leading-relaxed">
                    {t(`founderPage.howItWorks.${id}.desc`)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════ FAQ ═══════════════════════ */}
        <section className="py-20 md:py-28 bg-stone-50">
          <div className="max-w-3xl mx-auto px-6">
            <div className="reveal text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-bold text-stone-900 mb-4 font-outfit">
                {t('founderPage.faq.title')}
              </h2>
            </div>

            <div className="reveal space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <details
                  key={i}
                  className="group bg-white rounded-xl border border-stone-200 overflow-hidden"
                >
                  <summary className="flex items-center justify-between px-6 py-5 cursor-pointer list-none font-semibold text-stone-800 hover:text-primary transition-colors">
                    {t(`founderPage.faq.q${i}`)}
                    <span className="ml-4 text-stone-400 group-open:rotate-45 transition-transform duration-200 text-xl leading-none">
                      +
                    </span>
                  </summary>
                  <div className="px-6 pb-5 text-stone-500 leading-relaxed">
                    {t(`founderPage.faq.a${i}`)}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════ FINAL CTA ═══════════════════════ */}
        <section
          className="py-20 md:py-28 relative overflow-hidden"
          style={{ background: 'linear-gradient(180deg, #0B1A2F 0%, #1E3A5F 100%)' }}
        >
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(217,119,6,0.08) 0%, transparent 55%)',
            }}
          />

          <div className="reveal relative z-10 max-w-3xl mx-auto px-6 text-center">
            <Crown className="w-10 h-10 text-amber-400 mx-auto mb-6" />
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 font-outfit">
              {t('founderPage.cta.title')}
            </h2>
            <p className="text-lg text-white/50 mb-4 max-w-xl mx-auto">
              {t('founderPage.cta.subtitle')}
            </p>
            <p className="text-sm font-semibold text-amber-400 mb-8">
              {t('founderPage.hero.spotsLeft', { count: spotsRemaining, total: SPOTS_TOTAL })}
            </p>
            <Link
              to="/register?founder=1"
              className="inline-flex items-center gap-2 px-10 py-4 bg-amber-500 hover:bg-amber-400 text-white font-bold rounded-xl text-lg shadow-[0_4px_25px_rgba(217,119,6,0.3)] hover:shadow-[0_8px_40px_rgba(217,119,6,0.45)] hover:-translate-y-0.5 transition-all duration-300"
            >
              <Crown className="w-5 h-5" />
              {t('founderPage.cta.button')}
              <ArrowRight className="w-5 h-5" />
            </Link>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm text-white/30">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {t('founderPage.cta.trust1')}
              </span>
              <span>·</span>
              <span>{t('founderPage.cta.trust2')}</span>
              <span>·</span>
              <span>{t('founderPage.cta.trust3')}</span>
            </div>
          </div>
        </section>
      </div>
    </MarketingLayout>
  )
}
