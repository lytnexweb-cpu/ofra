import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { MarketingLayout } from '../components/marketing/MarketingLayout'
import { Button } from '../components/ui/Button'
import {
  Heart,
  Shield,
  Globe,
  Lightbulb,
  MapPin,
  ArrowRight,
  Users,
  Target,
} from 'lucide-react'

const VALUES = [
  { id: 'simplicity', icon: Lightbulb },
  { id: 'compliance', icon: Shield },
  { id: 'bilingual', icon: Globe },
  { id: 'independence', icon: Heart },
]

const NB_HIGHLIGHTS = [
  { id: 'local', icon: MapPin },
  { id: 'community', icon: Users },
  { id: 'mission', icon: Target },
]

export default function AboutPage() {
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
          {/* Grid pattern */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.03]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
              backgroundSize: '60px 60px',
            }}
          />
          {/* Amber glow */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(217,119,6,0.06) 0%, transparent 60%)',
            }}
          />

          <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
            <span className="inline-block px-4 py-1.5 mb-6 text-xs font-semibold tracking-widest uppercase text-amber-400 border border-amber-500/20 rounded-full bg-amber-500/5">
              {t('about.hero.badge')}
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6 font-outfit leading-tight">
              {t('about.hero.title')}{' '}
              <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-200 bg-clip-text text-transparent">
                {t('about.hero.titleHighlight')}
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-white/50 max-w-2xl mx-auto leading-relaxed">
              {t('about.hero.subtitle')}
            </p>
          </div>
        </section>

        {/* ═══════════════════════ MISSION ═══════════════════════ */}
        <section className="py-20 md:py-28 bg-white">
          <div className="reveal max-w-4xl mx-auto px-6">
            <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
              <div>
                <h2 className="text-3xl sm:text-4xl font-bold text-stone-900 mb-6 font-outfit">
                  {t('about.mission.title')}
                </h2>
                <p className="text-lg text-stone-500 leading-relaxed mb-4">
                  {t('about.mission.p1')}
                </p>
                <p className="text-lg text-stone-500 leading-relaxed">
                  {t('about.mission.p2')}
                </p>
              </div>
              <div className="relative">
                <div className="bg-gradient-to-br from-primary/5 to-amber-500/5 rounded-2xl p-8 border border-stone-100">
                  <blockquote className="text-xl font-medium text-stone-700 italic leading-relaxed font-outfit">
                    &ldquo;{t('about.mission.quote')}&rdquo;
                  </blockquote>
                  <p className="mt-4 text-sm text-stone-400 font-semibold">
                    — {t('about.mission.quoteAuthor')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════ PROBLEM ═══════════════════════ */}
        <section className="py-20 md:py-28 bg-stone-50">
          <div className="reveal max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-stone-900 mb-6 font-outfit">
              {t('about.problem.title')}
            </h2>
            <p className="text-lg text-stone-500 max-w-3xl mx-auto leading-relaxed mb-12">
              {t('about.problem.subtitle')}
            </p>

            <div className="grid sm:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl p-6 border border-stone-200 text-left"
                >
                  <div className="text-3xl font-extrabold text-primary/15 mb-3 font-outfit">
                    0{i}
                  </div>
                  <h3 className="font-bold text-stone-800 mb-2">
                    {t(`about.problem.pain${i}.title`)}
                  </h3>
                  <p className="text-sm text-stone-500 leading-relaxed">
                    {t(`about.problem.pain${i}.desc`)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════ VALUES ═══════════════════════ */}
        <section className="py-20 md:py-28 bg-white">
          <div className="max-w-5xl mx-auto px-6">
            <div className="reveal text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-bold text-stone-900 mb-4 font-outfit">
                {t('about.values.title')}
              </h2>
              <p className="text-lg text-stone-500 max-w-2xl mx-auto">
                {t('about.values.subtitle')}
              </p>
            </div>

            <div className="reveal grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {VALUES.map(({ id, icon: Icon }) => (
                <div
                  key={id}
                  className="group bg-stone-50 hover:bg-white rounded-xl p-6 border border-stone-100 hover:border-primary/20 hover:shadow-lg transition-all duration-300"
                >
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-bold text-stone-800 mb-2 font-outfit">
                    {t(`about.values.${id}.title`)}
                  </h3>
                  <p className="text-sm text-stone-500 leading-relaxed">
                    {t(`about.values.${id}.desc`)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════ BUILT FOR NB ═══════════════════════ */}
        <section
          className="py-20 md:py-28 relative overflow-hidden"
          style={{ background: 'linear-gradient(180deg, #0B1A2F 0%, #1E3A5F 100%)' }}
        >
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.03]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
              backgroundSize: '60px 60px',
            }}
          />

          <div className="reveal relative z-10 max-w-5xl mx-auto px-6">
            <div className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 font-outfit">
                {t('about.nb.title')}{' '}
                <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-200 bg-clip-text text-transparent">
                  {t('about.nb.titleHighlight')}
                </span>
              </h2>
              <p className="text-lg text-white/50 max-w-2xl mx-auto">
                {t('about.nb.subtitle')}
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-6">
              {NB_HIGHLIGHTS.map(({ id, icon: Icon }) => (
                <div
                  key={id}
                  className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-xl p-6 hover:bg-white/[0.07] transition-colors"
                >
                  <div className="w-12 h-12 rounded-lg bg-amber-500/10 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-amber-400" />
                  </div>
                  <h3 className="font-bold text-white mb-2 font-outfit">
                    {t(`about.nb.${id}.title`)}
                  </h3>
                  <p className="text-sm text-white/50 leading-relaxed">
                    {t(`about.nb.${id}.desc`)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════ CTA ═══════════════════════ */}
        <section className="py-20 md:py-28 bg-white">
          <div className="reveal max-w-3xl mx-auto px-6 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-stone-900 mb-4 font-outfit">
              {t('about.cta.title')}
            </h2>
            <p className="text-lg text-stone-500 mb-8 max-w-xl mx-auto">
              {t('about.cta.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register">
                <Button className="px-8 py-3 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl text-base shadow-lg">
                  {t('about.cta.trial')}
                </Button>
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 text-primary font-semibold hover:text-primary/80 transition-colors"
              >
                {t('about.cta.contact')}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </MarketingLayout>
  )
}
