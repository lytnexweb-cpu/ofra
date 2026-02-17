import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { OfraLogo, OfraLogoFull } from '../components/OfraLogo'
import { AppMockup } from '../components/landing/AppMockup'
import { HeroFloatingCards } from '../components/landing/HeroFloatingCards'
import { LanguageToggle } from '../components/ui/LanguageToggle'
import {
  Shield,
  FileText,
  ArrowRight,
  Check,
  Crown,
  Zap,
  Lock,
  ArrowLeftRight,
  FileCheck,
  FileDown,
  Link2,
  UserCog,
  LayoutDashboard,
  Import,
  Bell,
} from 'lucide-react'

const NAV_LINKS = [
  { key: 'features', to: '/features' },
  { key: 'pricing', to: '/pricing' },
  { key: 'founder', to: '/founder' },
] as const

const FEATURES = [
  { id: 'workflow', icon: FileText },
  { id: 'conditions', icon: Shield },
  { id: 'offers', icon: ArrowLeftRight },
  { id: 'documents', icon: FileCheck },
]

const PLANS = [
  { id: 'starter', price: 29 },
  { id: 'solo', price: 49 },
  { id: 'pro', price: 79, popular: true },
  { id: 'agence', price: 149 },
]

const FOUNDER_BENEFITS = [
  { key: '1', icon: Lock },
  { key: '2', icon: Zap },
  { key: '3', icon: Crown },
]

export default function LandingPage() {
  const { t } = useTranslation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [navScrolled, setNavScrolled] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

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
    <div ref={rootRef} className="min-h-screen bg-white antialiased scroll-smooth">
      {/* ═══════════════════════ NAV ═══════════════════════ */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          navScrolled
            ? 'bg-[rgba(11,26,47,0.97)] backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.2)]'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/welcome" className="flex items-center gap-2.5 group">
            <OfraLogo size={36} variant="white" className="transition-transform group-hover:scale-105" />
            <span className="text-xl font-bold text-white tracking-tight font-outfit">OFRA</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map(({ key, to }) => (
              <Link
                key={key}
                to={to}
                className="relative text-sm text-white/70 hover:text-white transition-colors after:content-[''] after:absolute after:bottom-[-4px] after:left-0 after:right-0 after:h-0.5 after:bg-amber-500 after:scale-x-0 after:transition-transform after:duration-300 hover:after:scale-x-100"
              >
                {t(`landing.nav.${key}`)}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-4">
            <LanguageToggle className="text-white/60 hover:text-white" />
            <Link to="/login" className="text-sm text-white/60 hover:text-white transition-colors">
              {t('landing.nav.login')}
            </Link>
            <Link
              to="/register"
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-white text-sm font-semibold rounded-lg shadow-[0_4px_15px_rgba(217,119,6,0.25)] hover:shadow-[0_6px_25px_rgba(217,119,6,0.4)] hover:-translate-y-0.5 transition-all duration-300"
            >
              {t('landing.nav.freeTrial')}
            </Link>
          </div>

          <button
            className="md:hidden text-white p-1"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
          >
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
              {mobileMenuOpen ? (
                <path d="M6 6l12 12M6 18L18 6" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-[#0B1A2F]/95 backdrop-blur-lg border-t border-white/5 px-6 py-5 space-y-3">
            {NAV_LINKS.map(({ key, to }) => (
              <Link
                key={key}
                to={to}
                className="block text-white/80 hover:text-amber-400 transition py-1"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t(`landing.nav.${key}`)}
              </Link>
            ))}
            <div className="pt-3 mt-3 border-t border-white/10 space-y-3">
              <LanguageToggle className="block text-white/60 hover:text-amber-400 text-sm py-1" />
              <Link
                to="/login"
                className="block text-white/60 text-sm"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('landing.nav.login')}
              </Link>
              <Link
                to="/register"
                className="block py-3 bg-amber-500 text-white text-center font-semibold rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('landing.nav.freeTrial')}
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* ═══════════════════════ HERO ═══════════════════════ */}
      <section
        className="relative overflow-hidden min-h-screen flex items-center pt-16"
        style={{ background: 'linear-gradient(180deg, #0B1A2F 0%, #122742 50%, #1E3A5F 100%)' }}
      >
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        {/* Amber spotlight glow */}
        <div
          className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[1200px] h-[900px] pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(217,119,6,0.07) 0%, rgba(30,58,95,0.12) 35%, transparent 65%)',
          }}
        />

        {/* Blue bottom glow */}
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(96,165,250,0.06) 0%, transparent 60%)',
          }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-16 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left column */}
            <div className="lg:col-span-7">
              <div className="reveal inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.06] border border-white/[0.08] text-sm text-white/80 mb-8 backdrop-blur-sm">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                {t('landing.hero.badge')}
              </div>

              <h1 className="reveal text-4xl sm:text-5xl lg:text-[3.5rem] xl:text-[4rem] font-extrabold leading-[1.08] tracking-tight mb-6 font-outfit">
                <span className="text-white">{t('landing.hero.titleLine1')}</span>
                <br />
                <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-200 bg-clip-text text-transparent">
                  {t('landing.hero.titleLine2')}
                </span>
              </h1>

              <p className="reveal reveal-d1 text-lg sm:text-xl text-slate-300/90 max-w-xl mb-10 leading-relaxed">
                {t('landing.hero.subtitle')}
              </p>

              <div className="reveal reveal-d2 flex flex-col sm:flex-row items-start gap-4 mb-8">
                <Link
                  to="/register"
                  className="group px-8 py-4 bg-amber-500 hover:bg-amber-400 text-white font-bold rounded-xl text-lg shadow-[0_4px_25px_rgba(217,119,6,0.3)] hover:shadow-[0_8px_40px_rgba(217,119,6,0.45)] hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-2"
                >
                  {t('landing.hero.cta')}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <a
                  href="#fonctionnalites"
                  className="px-8 py-4 bg-white/[0.06] border border-white/[0.1] text-white/90 font-semibold rounded-xl text-lg flex items-center gap-2.5 hover:bg-white/[0.1] hover:-translate-y-0.5 transition-all duration-300 backdrop-blur-sm"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-amber-400">
                    <polygon points="5,3 19,12 5,21" />
                  </svg>
                  {t('landing.hero.demo')}
                </a>
              </div>

              <div className="reveal reveal-d3 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-400/80">
                {(['trust1', 'trust2', 'trust3', 'trust4'] as const).map((key) => (
                  <div key={key} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-amber-500/60" />
                    <span>{t(`landing.hero.${key}`)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right column — Floating cards */}
            <div className="lg:col-span-5 hidden lg:block">
              <HeroFloatingCards />
            </div>
            <div className="lg:hidden flex justify-center">
              <div className="scale-[0.85] origin-top">
                <HeroFloatingCards />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════ SCROLL HINT ═══════════════════════ */}
      <div className="reveal py-10 flex flex-col items-center gap-2 text-stone-400">
        <span className="text-[11px] uppercase tracking-widest font-medium">
          {t('landing.scroll')}
        </span>
        <svg
          className="scroll-bounce"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        >
          <path d="M12 5v14m0 0l-5-5m5 5l5-5" />
        </svg>
      </div>

      {/* ═══════════════════════ WHY OFRA ═══════════════════════ */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <div className="reveal text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-primary mb-4 font-outfit">
              {t('landing.why.title')}
            </h2>
            <p className="text-lg text-stone-500 max-w-2xl mx-auto leading-relaxed">
              {t('landing.why.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {(['benefit1', 'benefit2', 'benefit3'] as const).map((key, i) => (
              <div
                key={key}
                className={`reveal reveal-d${i + 1} flex items-start gap-4 p-5 rounded-xl bg-stone-50 border border-stone-100`}
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-4 h-4 text-primary" />
                </div>
                <p className="text-stone-600 leading-relaxed">{t(`landing.why.${key}`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════ FEATURES — 4 PILLARS ═══════════════════════ */}
      <section id="fonctionnalites" className="py-20 md:py-28 bg-stone-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="reveal text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-primary mb-4 font-outfit">
              {t('landing.features.title')}
            </h2>
            <p className="text-lg text-stone-500 max-w-2xl mx-auto">
              {t('landing.features.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
            {FEATURES.map((feature, i) => {
              const Icon = feature.icon
              return (
                <div
                  key={feature.id}
                  className={`reveal reveal-d${i + 1} group bg-white rounded-2xl p-8 border border-stone-200/80 hover:border-primary/20 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1`}
                >
                  <div className="w-14 h-14 rounded-2xl bg-primary/[0.08] group-hover:bg-primary/[0.12] flex items-center justify-center mb-5 transition-colors">
                    <Icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-stone-900 mb-2 font-outfit">
                    {t(`landing.features.${feature.id}.title`)}
                  </h3>
                  <p className="text-stone-500 leading-relaxed">
                    {t(`landing.features.${feature.id}.desc`)}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════ PRODUCT TOUR ═══════════════════════ */}
      <section className="py-20 md:py-28 bg-primary relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <div className="reveal text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 font-outfit">
              {t('landing.productTour.title')}
            </h2>
            <p className="text-lg text-white/50 max-w-2xl mx-auto">
              {t('landing.productTour.subtitle')}
            </p>
          </div>
          <div className="reveal reveal-d1">
            <AppMockup />
          </div>
        </div>
      </section>

      {/* ═══════════════════════ MORE FEATURES ═══════════════════════ */}
      <section className="py-20 md:py-28 bg-stone-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="reveal text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-primary mb-4 font-outfit">
              {t('landing.moreFeatures.title')}
            </h2>
            <p className="text-lg text-stone-500 max-w-2xl mx-auto">
              {t('landing.moreFeatures.subtitle')}
            </p>
          </div>

          <div className="reveal grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {([
              { id: 'dashboard', icon: LayoutDashboard },
              { id: 'pdfExport', icon: FileDown },
              { id: 'shareLinks', icon: Link2 },
              { id: 'permissions', icon: UserCog },
              { id: 'csvImport', icon: Import },
              { id: 'notifications', icon: Bell },
            ] as const).map(({ id, icon: Icon }) => (
              <div
                key={id}
                className="flex items-start gap-4 p-5 rounded-xl bg-white border border-stone-200/80 hover:border-primary/20 hover:shadow-md transition-all"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/[0.08] flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-bold text-stone-800 text-sm mb-1">
                    {t(`landing.moreFeatures.${id}.title`)}
                  </h4>
                  <p className="text-sm text-stone-500 leading-relaxed">
                    {t(`landing.moreFeatures.${id}.desc`)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="reveal text-center mt-10">
            <Link
              to="/features"
              className="inline-flex items-center gap-2 text-primary font-semibold hover:text-primary/80 transition-colors"
            >
              {t('landing.moreFeatures.seeAll')}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════ FOUNDER PROGRAM ═══════════════════════ */}
      <section id="fondateur" className="py-20 md:py-28 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="reveal relative overflow-hidden rounded-3xl border border-amber-200/60 bg-gradient-to-br from-amber-50/80 via-white to-amber-50/30 p-8 md:p-12">
            {/* Gold shimmer corner */}
            <div
              className="absolute top-0 right-0 w-[500px] h-[500px] pointer-events-none"
              style={{
                background: 'radial-gradient(circle at top right, rgba(217,119,6,0.08), transparent 55%)',
              }}
            />

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100 text-amber-800 text-sm font-semibold mb-6">
                <Crown className="w-4 h-4" />
                {t('landing.founder.badge')}
              </div>

              <h2 className="text-3xl sm:text-4xl font-bold text-primary mb-3 font-outfit">
                {t('landing.founder.title')}
              </h2>
              <p className="text-lg text-stone-500 mb-10 max-w-2xl">
                {t('landing.founder.subtitle')}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
                {FOUNDER_BENEFITS.map((benefit) => {
                  const Icon = benefit.icon
                  return (
                    <div key={benefit.key}>
                      <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center mb-3">
                        <Icon className="w-5 h-5 text-amber-700" />
                      </div>
                      <h4 className="font-bold text-stone-900 mb-1">
                        {t(`landing.founder.benefit${benefit.key}`)}
                      </h4>
                      <p className="text-sm text-stone-500 leading-relaxed">
                        {t(`landing.founder.benefit${benefit.key}Desc`)}
                      </p>
                    </div>
                  )
                })}
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                <Link
                  to="/founder"
                  className="group px-8 py-4 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl text-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-2"
                >
                  <Crown className="w-5 h-5 text-amber-400" />
                  {t('landing.founder.cta')}
                  <ArrowRight className="w-5 h-5 opacity-60 group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <div>
                  <p className="text-sm font-semibold text-amber-700">
                    {t('landing.founder.spotsLeft', { count: 19 })}
                  </p>
                  <p className="text-sm text-stone-400">{t('landing.founder.ctaSub')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════ PRICING PREVIEW ═══════════════════════ */}
      <section id="tarifs" className="py-20 md:py-28 bg-stone-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="reveal text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-primary mb-4 font-outfit">
              {t('landing.pricingPreview.title')}
            </h2>
            <p className="text-lg text-stone-500 max-w-2xl mx-auto">
              {t('landing.pricingPreview.subtitle')}
            </p>
          </div>

          <div className="reveal reveal-d1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 mb-10">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`relative bg-white rounded-2xl p-6 border transition-all duration-300 hover:-translate-y-1 ${
                  plan.popular
                    ? 'border-amber-300 shadow-lg ring-1 ring-amber-200/50'
                    : 'border-stone-200 shadow-sm hover:shadow-md'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-amber-500 text-white text-xs font-bold rounded-full whitespace-nowrap">
                    {t('landing.pricingPreview.popular')}
                  </div>
                )}
                <h3 className="text-lg font-bold text-stone-900 mb-1 font-outfit">
                  {t(`landing.plans.${plan.id}.name`)}
                </h3>
                <p className="text-sm text-stone-400 mb-4">
                  {t(`landing.plans.${plan.id}.desc`)}
                </p>
                <div className="flex items-baseline gap-1 mb-5">
                  <span className="text-3xl font-extrabold text-primary">{plan.price}$</span>
                  <span className="text-stone-400 text-sm">{t('landing.pricingPreview.perMonth')}</span>
                </div>
                <Link
                  to="/pricing"
                  className={`block text-center py-2.5 rounded-lg font-semibold text-sm transition-colors ${
                    plan.popular
                      ? 'bg-primary text-white hover:bg-primary/90'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  {t('landing.pricingPreview.trialIncluded')}
                </Link>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link
              to="/pricing"
              className="inline-flex items-center gap-2 text-primary font-semibold hover:text-primary/80 transition-colors"
            >
              {t('landing.pricingPreview.allPlans')}
              <ArrowRight className="w-4 h-4" />
            </Link>
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
            background: 'radial-gradient(ellipse at center, rgba(217,119,6,0.06) 0%, transparent 55%)',
          }}
        />

        <div className="reveal relative z-10 max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 font-outfit">
            {t('landing.cta.title')}
          </h2>
          <p className="text-lg text-white/50 mb-8 max-w-xl mx-auto">
            {t('landing.cta.subtitle')}
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-10 py-4 bg-amber-500 hover:bg-amber-400 text-white font-bold rounded-xl text-lg shadow-[0_4px_25px_rgba(217,119,6,0.3)] hover:shadow-[0_8px_40px_rgba(217,119,6,0.45)] hover:-translate-y-0.5 transition-all duration-300"
          >
            {t('landing.cta.button')}
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* ═══════════════════════ FOOTER ═══════════════════════ */}
      <footer style={{ background: '#0B1A2F' }} className="py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="sm:col-span-2 lg:col-span-1">
              <OfraLogoFull className="mb-4" invertColors showTagline={false} />
              <p className="text-white/50 text-sm">{t('landing.footer.tagline')}</p>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">{t('landing.footer.product')}</h4>
              <ul className="space-y-2 text-sm text-white/50">
                <li>
                  <Link to="/features" className="hover:text-white transition-colors">
                    {t('landing.nav.features')}
                  </Link>
                </li>
                <li>
                  <Link to="/pricing" className="hover:text-white transition-colors">
                    {t('landing.nav.pricing')}
                  </Link>
                </li>
                <li>
                  <Link to="/founder" className="hover:text-white transition-colors">
                    {t('landing.nav.founder')}
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="hover:text-white transition-colors">
                    {t('landing.footer.signup')}
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">{t('landing.footer.company')}</h4>
              <ul className="space-y-2 text-sm text-white/50">
                <li>
                  <Link to="/about" className="hover:text-white transition-colors">
                    {t('landing.footer.about')}
                  </Link>
                </li>
                <li>
                  <Link to="/faq" className="hover:text-white transition-colors">
                    {t('landing.footer.faq')}
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="hover:text-white transition-colors">
                    {t('landing.footer.contactUs')}
                  </Link>
                </li>
                <li>
                  <a href="mailto:support@ofra.ca" className="hover:text-white transition-colors">
                    support@ofra.ca
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">{t('landing.footer.legal')}</h4>
              <ul className="space-y-2 text-sm text-white/50">
                <li>
                  <Link to="/privacy" className="hover:text-white transition-colors">
                    {t('landing.footer.privacy')}
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="hover:text-white transition-colors">
                    {t('landing.footer.terms')}
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-white/30">
            <p>&copy; {new Date().getFullYear()} OFRA. {t('landing.footer.rights')}</p>
            <p className="text-xs">v1.0.0</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
