import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { MarketingLayout } from '../components/marketing/MarketingLayout'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Mail, Building2, Users, Send, MapPin, Clock, MessageSquare } from 'lucide-react'

const CONTACT_INFO = [
  { id: 'email', icon: Mail, value: 'support@ofra.ca', href: 'mailto:support@ofra.ca' },
  { id: 'location', icon: MapPin, value: 'Moncton, NB' },
  { id: 'response', icon: Clock },
]

export default function ContactPage() {
  const { t } = useTranslation()
  const rootRef = useRef<HTMLDivElement>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    teamSize: '',
    message: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsSubmitting(false)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <MarketingLayout showBackButton>
        <div className="pt-32 pb-20 min-h-[60vh] flex items-center">
          <div className="max-w-xl mx-auto px-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-6">
              <Send className="w-8 h-8 text-emerald-600" />
            </div>
            <h1 className="text-3xl font-bold text-stone-900 font-outfit mb-4">
              {t('contact.success.title')}
            </h1>
            <p className="text-lg text-stone-500 leading-relaxed">
              {t('contact.success.message')}
            </p>
          </div>
        </div>
      </MarketingLayout>
    )
  }

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
            <span className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 text-xs font-semibold tracking-widest uppercase text-amber-400 border border-amber-500/20 rounded-full bg-amber-500/5">
              <MessageSquare className="w-3.5 h-3.5" />
              {t('contact.hero.badge')}
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6 font-outfit leading-tight">
              {t('contact.title')}
            </h1>
            <p className="text-lg sm:text-xl text-white/50 max-w-2xl mx-auto leading-relaxed">
              {t('contact.subtitle')}
            </p>
          </div>
        </section>

        {/* ═══════════════════════ FORM + INFO ═══════════════════════ */}
        <section className="py-20 md:py-28 bg-white">
          <div className="reveal max-w-5xl mx-auto px-6">
            <div className="grid md:grid-cols-3 gap-12 md:gap-16">
              {/* Contact info sidebar */}
              <div className="space-y-8">
                <div>
                  <h2 className="text-xl font-bold text-stone-900 mb-2 font-outfit">
                    {t('contact.info.title')}
                  </h2>
                  <p className="text-sm text-stone-500 leading-relaxed">
                    {t('contact.info.subtitle')}
                  </p>
                </div>

                {CONTACT_INFO.map(({ id, icon: Icon, value, href }) => (
                  <div key={id} className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-stone-800 text-sm">
                        {t(`contact.info.${id}.label`)}
                      </h3>
                      {href ? (
                        <a href={href} className="text-sm text-primary hover:text-primary/80 transition-colors">
                          {value}
                        </a>
                      ) : value ? (
                        <p className="text-sm text-stone-500">{value}</p>
                      ) : (
                        <p className="text-sm text-stone-500">{t(`contact.info.${id}.value`)}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Form */}
              <div className="md:col-span-2">
                <form onSubmit={handleSubmit} className="bg-stone-50 rounded-2xl p-8 border border-stone-100">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-stone-700 mb-2">
                        {t('contact.form.name')} *
                      </label>
                      <Input
                        id="name"
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder={t('contact.form.namePlaceholder')}
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-stone-700 mb-2">
                        {t('contact.form.email')} *
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                        <Input
                          id="email"
                          type="email"
                          required
                          className="pl-10"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder={t('contact.form.emailPlaceholder')}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label htmlFor="company" className="block text-sm font-medium text-stone-700 mb-2">
                        {t('contact.form.company')}
                      </label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                        <Input
                          id="company"
                          type="text"
                          className="pl-10"
                          value={formData.company}
                          onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                          placeholder={t('contact.form.companyPlaceholder')}
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="teamSize" className="block text-sm font-medium text-stone-700 mb-2">
                        {t('contact.form.teamSize')}
                      </label>
                      <div className="relative">
                        <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                        <select
                          id="teamSize"
                          className="w-full pl-10 pr-4 py-2 rounded-lg border border-stone-300 bg-white text-stone-900 focus:ring-2 focus:ring-primary focus:border-transparent"
                          value={formData.teamSize}
                          onChange={(e) => setFormData({ ...formData, teamSize: e.target.value })}
                        >
                          <option value="">{t('contact.form.selectTeamSize')}</option>
                          <option value="1">1 ({t('contact.form.solo')})</option>
                          <option value="2-5">2-5</option>
                          <option value="6-20">6-20</option>
                          <option value="20+">20+</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <label htmlFor="message" className="block text-sm font-medium text-stone-700 mb-2">
                      {t('contact.form.message')} *
                    </label>
                    <textarea
                      id="message"
                      required
                      rows={5}
                      className="w-full px-4 py-2 rounded-lg border border-stone-300 bg-white text-stone-900 focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder={t('contact.form.messagePlaceholder')}
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 rounded-xl shadow-lg"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? t('contact.form.sending') : t('contact.form.submit')}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </section>
      </div>
    </MarketingLayout>
  )
}
