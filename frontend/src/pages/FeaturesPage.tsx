import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { MarketingLayout } from '../components/marketing/MarketingLayout'
import {
  FileText,
  Shield,
  ArrowLeftRight,
  FileCheck,
  ArrowRight,
  Check,
  Zap,
  Brain,
  Users,
  Clock,
  Upload,
  Lock,
  Eye,
  BarChart3,
  Bell,
  Globe,
  FileDown,
  Link2,
  UserCog,
  LayoutDashboard,
  Import,
  Smartphone,
} from 'lucide-react'

const PILLARS = [
  {
    id: 'workflow',
    icon: FileText,
    color: 'primary',
    highlights: [
      { id: 'steps', icon: BarChart3 },
      { id: 'validation', icon: Check },
      { id: 'visibility', icon: Eye },
    ],
  },
  {
    id: 'conditions',
    icon: Shield,
    color: 'emerald',
    highlights: [
      { id: 'auto', icon: Brain },
      { id: 'tracking', icon: Clock },
      { id: 'alerts', icon: Bell },
    ],
  },
  {
    id: 'offers',
    icon: ArrowLeftRight,
    color: 'amber',
    highlights: [
      { id: 'intake', icon: Globe },
      { id: 'history', icon: FileText },
      { id: 'parties', icon: Users },
    ],
  },
  {
    id: 'documents',
    icon: FileCheck,
    color: 'violet',
    highlights: [
      { id: 'upload', icon: Upload },
      { id: 'versioning', icon: FileText },
      { id: 'compliance', icon: Lock },
    ],
  },
]

const COLOR_MAP: Record<string, { bg: string; bgLight: string; text: string; border: string }> = {
  primary: { bg: 'bg-primary', bgLight: 'bg-primary/10', text: 'text-primary', border: 'border-primary/20' },
  emerald: { bg: 'bg-emerald-600', bgLight: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' },
  amber: { bg: 'bg-amber-600', bgLight: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
  violet: { bg: 'bg-violet-600', bgLight: 'bg-violet-50', text: 'text-violet-600', border: 'border-violet-200' },
}

const EXTRAS_ROW1 = [
  { id: 'dashboard', icon: LayoutDashboard },
  { id: 'pdfExport', icon: FileDown },
  { id: 'shareLinks', icon: Link2 },
]

const EXTRAS_ROW2 = [
  { id: 'permissions', icon: UserCog },
  { id: 'csvImport', icon: Import },
  { id: 'fintrac', icon: Shield },
]

const EXTRAS_ROW3 = [
  { id: 'bilingual', icon: Globe },
  { id: 'notifications', icon: Bell },
  { id: 'mobile', icon: Smartphone },
]

export default function FeaturesPage() {
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
            <span className="inline-block px-4 py-1.5 mb-6 text-xs font-semibold tracking-widest uppercase text-amber-400 border border-amber-500/20 rounded-full bg-amber-500/5">
              {t('featuresPage.hero.badge')}
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6 font-outfit leading-tight">
              {t('featuresPage.hero.title')}{' '}
              <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-200 bg-clip-text text-transparent">
                {t('featuresPage.hero.titleHighlight')}
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-white/50 max-w-2xl mx-auto leading-relaxed">
              {t('featuresPage.hero.subtitle')}
            </p>
          </div>
        </section>

        {/* ═══════════════════════ 4 PILLARS ═══════════════════════ */}
        {PILLARS.map((pillar, index) => {
          const Icon = pillar.icon
          const colors = COLOR_MAP[pillar.color]
          const isEven = index % 2 === 0

          return (
            <section
              key={pillar.id}
              className={`py-20 md:py-28 ${isEven ? 'bg-white' : 'bg-stone-50'}`}
            >
              <div className="reveal max-w-5xl mx-auto px-6">
                <div className={`grid md:grid-cols-2 gap-12 md:gap-16 items-center ${!isEven ? 'md:[direction:rtl]' : ''}`}>
                  {/* Text side */}
                  <div className={!isEven ? 'md:[direction:ltr]' : ''}>
                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 mb-4 text-xs font-semibold uppercase tracking-widest ${colors.text} ${colors.bgLight} rounded-full`}>
                      <Icon className="w-3.5 h-3.5" />
                      {t(`featuresPage.pillars.${pillar.id}.badge`)}
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-bold text-stone-900 mb-4 font-outfit">
                      {t(`featuresPage.pillars.${pillar.id}.title`)}
                    </h2>
                    <p className="text-lg text-stone-500 leading-relaxed mb-8">
                      {t(`featuresPage.pillars.${pillar.id}.desc`)}
                    </p>

                    <div className="space-y-4">
                      {pillar.highlights.map(({ id, icon: HIcon }) => (
                        <div key={id} className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-lg ${colors.bgLight} flex items-center justify-center shrink-0 mt-0.5`}>
                            <HIcon className={`w-4 h-4 ${colors.text}`} />
                          </div>
                          <div>
                            <h4 className="font-semibold text-stone-800 text-sm">
                              {t(`featuresPage.pillars.${pillar.id}.${id}.title`)}
                            </h4>
                            <p className="text-sm text-stone-500 leading-relaxed">
                              {t(`featuresPage.pillars.${pillar.id}.${id}.desc`)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Visual side — feature card */}
                  <div className={!isEven ? 'md:[direction:ltr]' : ''}>
                    <div className={`rounded-2xl border ${colors.border} p-8 bg-gradient-to-br from-white to-stone-50 shadow-sm`}>
                      <div className={`w-14 h-14 rounded-xl ${colors.bgLight} flex items-center justify-center mb-6`}>
                        <Icon className={`w-7 h-7 ${colors.text}`} />
                      </div>
                      <div className="space-y-3">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className="flex items-center gap-2.5">
                            <Check className={`w-4 h-4 ${colors.text} shrink-0`} />
                            <span className="text-sm text-stone-600">
                              {t(`featuresPage.pillars.${pillar.id}.check${i}`)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )
        })}

        {/* ═══════════════════════ EXTRAS ═══════════════════════ */}
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
                {t('featuresPage.extras.title')}
              </h2>
              <p className="text-lg text-white/50 max-w-2xl mx-auto">
                {t('featuresPage.extras.subtitle')}
              </p>
            </div>

            <div className="space-y-6">
              {[EXTRAS_ROW1, EXTRAS_ROW2, EXTRAS_ROW3].map((row, rowIdx) => (
                <div key={rowIdx} className="grid sm:grid-cols-3 gap-6">
                  {row.map(({ id, icon: Icon }) => (
                    <div
                      key={id}
                      className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-xl p-6 hover:bg-white/[0.07] transition-colors"
                    >
                      <div className="w-12 h-12 rounded-lg bg-amber-500/10 flex items-center justify-center mb-4">
                        <Icon className="w-6 h-6 text-amber-400" />
                      </div>
                      <h3 className="font-bold text-white mb-2 font-outfit">
                        {t(`featuresPage.extras.${id}.title`)}
                      </h3>
                      <p className="text-sm text-white/50 leading-relaxed">
                        {t(`featuresPage.extras.${id}.desc`)}
                      </p>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════ CTA ═══════════════════════ */}
        <section className="py-20 md:py-28 bg-white">
          <div className="reveal max-w-3xl mx-auto px-6 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-stone-900 mb-4 font-outfit">
              {t('featuresPage.cta.title')}
            </h2>
            <p className="text-lg text-stone-500 mb-8 max-w-xl mx-auto">
              {t('featuresPage.cta.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/register"
                className="px-8 py-3 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl text-base shadow-lg transition-all"
              >
                {t('featuresPage.cta.trial')}
              </Link>
              <Link
                to="/pricing"
                className="inline-flex items-center gap-2 text-primary font-semibold hover:text-primary/80 transition-colors"
              >
                {t('featuresPage.cta.pricing')}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </MarketingLayout>
  )
}
