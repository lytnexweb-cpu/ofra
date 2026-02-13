import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '../components/ui/Button'
import { OfraLogo, OfraLogoFull } from '../components/OfraLogo'
import { AppMockup } from '../components/landing/AppMockup'
import { HeroFloatingCards } from '../components/landing/HeroFloatingCards'
import {
  Shield,
  Clock,
  Users,
  ArrowRight,
  Star,
  Zap,
  FileText,
  Bell,
  TrendingUp,
  Award,
  Activity,
} from 'lucide-react'

const features = [
  {
    id: 'workflow',
    icon: FileText,
    titleKey: 'landing.features.workflow.title',
    descKey: 'landing.features.workflow.desc',
  },
  {
    id: 'reminders',
    icon: Bell,
    titleKey: 'landing.features.reminders.title',
    descKey: 'landing.features.reminders.desc',
  },
  {
    id: 'blocking',
    icon: Shield,
    titleKey: 'landing.features.blocking.title',
    descKey: 'landing.features.blocking.desc',
  },
  {
    id: 'clients',
    icon: Users,
    titleKey: 'landing.features.clients.title',
    descKey: 'landing.features.clients.desc',
  },
  {
    id: 'timeline',
    icon: Clock,
    titleKey: 'landing.features.timeline.title',
    descKey: 'landing.features.timeline.desc',
  },
  {
    id: 'fast',
    icon: Zap,
    titleKey: 'landing.features.fast.title',
    descKey: 'landing.features.fast.desc',
  },
]

const stats = [
  { id: 'agents', value: '500+', labelKey: 'landing.stats.agents', icon: Users },
  { id: 'transactions', value: '10,000+', labelKey: 'landing.stats.transactions', icon: TrendingUp },
  { id: 'uptime', value: '99.9%', labelKey: 'landing.stats.uptime', icon: Activity },
  { id: 'rating', value: '4.9/5', labelKey: 'landing.stats.rating', icon: Award, accent: true },
]

const testimonials = [
  {
    id: 'marie-claire',
    name: 'Marie-Claire Leblanc',
    role: 'Courtière immobilière, Moncton',
    quote: 'landing.testimonials.1',
    rating: 5,
    initials: 'ML',
  },
  {
    id: 'jean-philippe',
    name: 'Jean-Philippe Arsenault',
    role: 'Courtier, Dieppe',
    quote: 'landing.testimonials.2',
    rating: 5,
    initials: 'JA',
  },
  {
    id: 'sophie',
    name: 'Sophie Gallant',
    role: 'Courtière, Fredericton',
    quote: 'landing.testimonials.3',
    rating: 5,
    initials: 'SG',
  },
]

const NAV_LINKS = [
  { key: 'features', href: '#fonctionnalites' },
  { key: 'pricing', href: '/pricing', isRoute: true },
  { key: 'founder', href: '#fondateur' },
  { key: 'faq', href: '#faq' },
] as const

export default function LandingPage() {
  const { t } = useTranslation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [navScrolled, setNavScrolled] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  // Scroll shadow on nav
  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Reveal-on-scroll (IntersectionObserver)
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
    <div ref={rootRef} className="min-h-screen bg-stone-100 antialiased scroll-smooth">
      {/* ═══ INLINE NAV (navy-800) ═══ */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          navScrolled
            ? 'bg-[rgba(30,58,95,0.97)] backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.15)]'
            : 'bg-primary/90 backdrop-blur-sm'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/welcome" className="flex items-center gap-2.5 group">
            <OfraLogo size={36} className="transition-transform group-hover:scale-105" />
            <span className="text-xl font-bold text-white tracking-tight font-outfit">OFRA</span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map(({ key, href, isRoute }) =>
              isRoute ? (
                <Link
                  key={key}
                  to={href}
                  className="relative text-sm text-white/80 hover:text-white transition after:content-[''] after:absolute after:bottom-[-4px] after:left-0 after:right-0 after:h-0.5 after:bg-amber-600 after:scale-x-0 after:transition-transform after:duration-300 after:rounded-sm hover:after:scale-x-100"
                >
                  {t(`landing.nav.${key}`)}
                </Link>
              ) : (
                <a
                  key={key}
                  href={href}
                  className="relative text-sm text-white/80 hover:text-white transition after:content-[''] after:absolute after:bottom-[-4px] after:left-0 after:right-0 after:h-0.5 after:bg-amber-600 after:scale-x-0 after:transition-transform after:duration-300 after:rounded-sm hover:after:scale-x-100"
                >
                  {t(`landing.nav.${key}`)}
                </a>
              )
            )}
          </div>

          {/* Desktop right */}
          <div className="hidden md:flex items-center gap-4">
            <Link to="/login" className="text-sm text-white/70 hover:text-white transition">
              {t('landing.nav.login')}
            </Link>
            <Link
              to="/register"
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold rounded-lg shadow-[0_4px_15px_rgba(217,119,6,0.3)] hover:shadow-[0_6px_25px_rgba(217,119,6,0.45)] hover:-translate-y-0.5 transition-all duration-300"
            >
              {t('landing.nav.freeTrial')}
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden text-white p-1"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
          >
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#152a45] border-t border-white/10 px-6 py-5 space-y-3">
            {NAV_LINKS.map(({ key, href, isRoute }) =>
              isRoute ? (
                <Link
                  key={key}
                  to={href}
                  className="block text-white hover:text-amber-400 transition py-1"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t(`landing.nav.${key}`)}
                </Link>
              ) : (
                <a
                  key={key}
                  href={href}
                  className="block text-white hover:text-amber-400 transition py-1"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t(`landing.nav.${key}`)}
                </a>
              )
            )}
            <div className="pt-3 mt-3 border-t border-white/20 space-y-3">
              <Link
                to="/login"
                className="block text-white/70 text-sm"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('landing.nav.login')}
              </Link>
              <Link
                to="/register"
                className="block py-3 bg-amber-600 text-white text-center font-semibold rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('landing.nav.freeTrial')}
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* ═══ HERO SPLIT (navy-800) ═══ */}
      <section className="bg-primary relative overflow-hidden min-h-screen flex items-center pt-16">
        {/* Dot texture overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-16 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left column — Text */}
            <div className="lg:col-span-7">
              {/* Badge pill */}
              <div className="reveal inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-sm text-white mb-6">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                {t('landing.hero.badge')}
              </div>

              {/* Title */}
              <h1 className="reveal text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-[1.08] tracking-tight mb-5 font-outfit">
                {t('landing.hero.titleLine1')}<br />
                <span className="text-amber-400">{t('landing.hero.titleLine2')}</span>
              </h1>

              {/* Subtitle */}
              <p className="reveal reveal-d1 text-lg text-slate-300 max-w-xl mb-8 leading-relaxed">
                {t('landing.hero.subtitle')}
              </p>

              {/* CTAs */}
              <div className="reveal reveal-d2 flex flex-col sm:flex-row items-start gap-4 mb-6">
                <Link
                  to="/register"
                  className="px-8 py-4 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-lg shadow-[0_4px_15px_rgba(217,119,6,0.3)] hover:shadow-[0_6px_25px_rgba(217,119,6,0.45)] hover:-translate-y-0.5 transition-all duration-300"
                >
                  {t('landing.hero.cta')}
                </Link>
                <a
                  href="#"
                  className="px-8 py-4 bg-white/[0.08] border border-white/20 text-white font-semibold rounded-xl text-lg flex items-center gap-2 hover:bg-white/[0.12] hover:-translate-y-0.5 transition-all duration-300"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-amber-400">
                    <polygon points="5,3 19,12 5,21" />
                  </svg>
                  {t('landing.hero.demo')}
                </a>
              </div>

              {/* Trust badges */}
              <div className="reveal reveal-d3 flex flex-wrap items-start gap-5 text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                  <svg width="14" height="14" fill="none" stroke="#d97706" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  {t('landing.hero.trust1')}
                </div>
                <div className="flex items-center gap-1.5">
                  <svg width="14" height="14" fill="none" stroke="#d97706" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {t('landing.hero.trust2')}
                </div>
                <div className="flex items-center gap-1.5">
                  <svg width="14" height="14" fill="none" stroke="#d97706" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                  </svg>
                  {t('landing.hero.trust3')}
                </div>
              </div>
            </div>

            {/* Right column — Floating cards (desktop) */}
            <div className="lg:col-span-5 hidden lg:block">
              <HeroFloatingCards />
            </div>

            {/* Floating cards (mobile/tablet — below text) */}
            <div className="lg:hidden flex justify-center">
              <div className="scale-[0.85] origin-top">
                <HeroFloatingCards />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ SCROLL HINT ═══ */}
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

      {/* ═══ FEATURES SECTION ═══ */}
      <section id="fonctionnalites" className="py-20 bg-white dark:bg-stone-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="reveal text-center mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary dark:text-white mb-4 font-outfit">
              {t('landing.features.title')}
            </h2>
            <p className="text-base sm:text-lg text-stone-600 dark:text-stone-300 max-w-2xl mx-auto">
              {t('landing.features.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {features.map((feature, i) => {
              const Icon = feature.icon
              return (
                <div
                  key={feature.id}
                  className={`reveal ${i < 3 ? `reveal-d${i + 1}` : `reveal-d${i - 2}`} bg-stone-50 dark:bg-stone-800 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1`}
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-primary dark:text-accent" aria-hidden="true" />
                  </div>
                  <h3 className="text-lg font-semibold text-stone-900 dark:text-white mb-2">
                    {t(feature.titleKey)}
                  </h3>
                  <p className="text-stone-600 dark:text-stone-400">
                    {t(feature.descKey)}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ═══ PRODUCT TOUR (AppMockup) ═══ */}
      <section className="py-20 bg-stone-50 dark:bg-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="reveal text-center mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary dark:text-white mb-4 font-outfit">
              {t('landing.productTour.title')}
            </h2>
            <p className="text-base sm:text-lg text-stone-600 dark:text-stone-300 max-w-2xl mx-auto">
              {t('landing.productTour.subtitle')}
            </p>
          </div>
          <div className="reveal reveal-d1">
            <AppMockup />
          </div>
        </div>
      </section>

      {/* ═══ STATS SECTION ═══ */}
      <section className="py-16 bg-primary dark:bg-stone-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="reveal grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 text-center">
            {stats.map((stat) => {
              const Icon = stat.icon
              const label = t(stat.labelKey)
              return (
                <div key={stat.id} className="flex flex-col items-center">
                  <Icon
                    className={`w-6 h-6 mb-2 ${stat.accent ? 'text-accent' : 'text-white/70'}`}
                    aria-hidden="true"
                  />
                  <p className={`text-2xl sm:text-3xl md:text-4xl font-bold mb-2 ${stat.accent ? 'text-accent' : 'text-white'}`}>
                    <span aria-label={`${stat.value} ${label}`}>{stat.value}</span>
                  </p>
                  <p className="text-white/80 text-sm sm:text-base">{label}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ═══ TESTIMONIALS SECTION ═══ */}
      <section className="py-20 bg-stone-50 dark:bg-stone-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="reveal text-center mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary dark:text-white mb-4 font-outfit">
              {t('landing.testimonials.title')}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {testimonials.map((testimonial, i) => (
              <article
                key={testimonial.id}
                className={`reveal reveal-d${i + 1} bg-white dark:bg-stone-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow`}
              >
                <div className="flex gap-1 mb-4" aria-label={`${testimonial.rating} stars`}>
                  {[...Array(testimonial.rating)].map((_, j) => (
                    <Star key={j} className="w-5 h-5 fill-accent text-accent" aria-hidden="true" />
                  ))}
                </div>
                <blockquote className="text-stone-600 dark:text-stone-300 mb-6 italic">
                  &ldquo;{t(testimonial.quote)}&rdquo;
                </blockquote>
                <footer className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 dark:bg-accent/20 flex items-center justify-center" aria-hidden="true">
                    <span className="text-sm font-semibold text-primary dark:text-accent">
                      {testimonial.initials}
                    </span>
                  </div>
                  <div>
                    <cite className="font-semibold text-stone-900 dark:text-white not-italic">{testimonial.name}</cite>
                    <p className="text-sm text-stone-500 dark:text-stone-400">{testimonial.role}</p>
                  </div>
                </footer>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA SECTION ═══ */}
      <section className="py-20 bg-white dark:bg-stone-800">
        <div className="reveal max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary dark:text-white mb-4 font-outfit">
            {t('landing.cta.title')}
          </h2>
          <p className="text-base sm:text-lg text-stone-600 dark:text-stone-300 mb-8">
            {t('landing.cta.subtitle')}
          </p>
          <Link to="/register">
            <Button size="lg" className="bg-primary hover:bg-primary/90 dark:bg-accent dark:hover:bg-accent/90 gap-2 px-8">
              {t('landing.cta.button')}
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="bg-primary dark:bg-stone-950 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="sm:col-span-2 lg:col-span-1">
              <OfraLogoFull className="mb-4" invertColors />
              <p className="text-white/70 text-sm">
                {t('landing.footer.tagline')}
              </p>
            </div>

            {/* Product Links */}
            <div>
              <h4 className="font-semibold text-white mb-4">{t('landing.footer.product')}</h4>
              <ul className="space-y-2 text-sm text-white/70">
                <li>
                  <Link to="/pricing" className="hover:text-white transition-colors">
                    {t('landing.nav.pricing')}
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="hover:text-white transition-colors">
                    {t('landing.footer.signup')}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal Links */}
            <div>
              <h4 className="font-semibold text-white mb-4">{t('landing.footer.legal')}</h4>
              <ul className="space-y-2 text-sm text-white/70">
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

            {/* Contact */}
            <div>
              <h4 className="font-semibold text-white mb-4">{t('landing.footer.contact')}</h4>
              <ul className="space-y-2 text-sm text-white/70">
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
                <li>Moncton, NB</li>
              </ul>
            </div>
          </div>

          {/* Copyright */}
          <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-white/40">
            <p>&copy; {new Date().getFullYear()} Ofra. {t('landing.footer.rights')}</p>
            <p className="text-xs">v1.0.0</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
