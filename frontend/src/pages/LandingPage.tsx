import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { MarketingLayout } from '../components/marketing/MarketingLayout'
import { Button } from '../components/ui/Button'
import {
  CheckCircle,
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

export default function LandingPage() {
  const { t } = useTranslation()

  return (
    <MarketingLayout>
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary via-primary/90 to-primary/80 dark:from-stone-900 dark:via-stone-900 dark:to-stone-800" />
        {/* Decorative elements */}
        <div className="absolute top-20 right-0 w-96 h-96 rounded-full bg-accent/10 transform translate-x-1/3 -translate-y-1/5" aria-hidden="true" />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-accent/5 transform -translate-x-1/3 translate-y-1/3" aria-hidden="true" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 font-outfit">
              {t('landing.hero.title')}
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              {t('landing.hero.subtitle')}
            </p>
            <nav className="flex flex-col sm:flex-row items-center justify-center gap-4" aria-label="Hero actions">
              <Link to="/register">
                <Button size="lg" className="bg-accent hover:bg-accent/90 text-white gap-2 px-8 w-full sm:w-auto">
                  {t('landing.hero.cta')}
                  <ArrowRight className="w-5 h-5" aria-hidden="true" />
                </Button>
              </Link>
              <Link to="/pricing">
                <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10 px-8 w-full sm:w-auto">
                  {t('landing.hero.pricing')}
                </Button>
              </Link>
            </nav>

            {/* Trust badges */}
            <div className="mt-12 flex flex-col sm:flex-row flex-wrap items-center justify-center gap-4 sm:gap-6 text-white/80 text-sm">
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                {t('landing.hero.badge1')}
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                {t('landing.hero.badge2')}
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                {t('landing.hero.badge3')}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white dark:bg-stone-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary dark:text-white mb-4 font-outfit">
              {t('landing.features.title')}
            </h2>
            <p className="text-base sm:text-lg text-stone-600 dark:text-stone-300 max-w-2xl mx-auto">
              {t('landing.features.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <div
                  key={feature.id}
                  className="bg-stone-50 dark:bg-stone-800 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
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

      {/* Stats Section */}
      <section className="py-16 bg-primary dark:bg-stone-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 text-center">
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

      {/* Testimonials Section */}
      <section className="py-20 bg-stone-50 dark:bg-stone-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary dark:text-white mb-4 font-outfit">
              {t('landing.testimonials.title')}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {testimonials.map((testimonial) => (
              <article
                key={testimonial.id}
                className="bg-white dark:bg-stone-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex gap-1 mb-4" aria-label={`${testimonial.rating} stars`}>
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-accent text-accent" aria-hidden="true" />
                  ))}
                </div>
                <blockquote className="text-stone-600 dark:text-stone-300 mb-6 italic">
                  "{t(testimonial.quote)}"
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

      {/* CTA Section */}
      <section className="py-20 bg-white dark:bg-stone-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
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
    </MarketingLayout>
  )
}
