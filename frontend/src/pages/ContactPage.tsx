import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MarketingLayout } from '../components/marketing/MarketingLayout'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Mail, Building2, Users, Send } from 'lucide-react'

export default function ContactPage() {
  const { t } = useTranslation()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    teamSize: '',
    message: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

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
        <div className="pt-32 pb-20">
          <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-6">
              <Send className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h1 className="text-3xl font-bold text-primary dark:text-white font-outfit mb-4">
              {t('contact.success.title')}
            </h1>
            <p className="text-lg text-stone-600 dark:text-stone-300">
              {t('contact.success.message')}
            </p>
          </div>
        </div>
      </MarketingLayout>
    )
  }

  return (
    <MarketingLayout showBackButton>
      <div className="pt-32 pb-20">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-3xl sm:text-4xl font-bold text-primary dark:text-white font-outfit mb-4">
              {t('contact.title')}
            </h1>
            <p className="text-lg text-stone-600 dark:text-stone-300">
              {t('contact.subtitle')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white dark:bg-stone-800 rounded-2xl p-8 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
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
                <label htmlFor="email" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
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
                <label htmlFor="company" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
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
                <label htmlFor="teamSize" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                  {t('contact.form.teamSize')}
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <select
                    id="teamSize"
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-700 text-stone-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                    value={formData.teamSize}
                    onChange={(e) => setFormData({ ...formData, teamSize: e.target.value })}
                  >
                    <option value="">{t('contact.form.selectTeamSize')}</option>
                    <option value="1-5">1-5</option>
                    <option value="6-20">6-20</option>
                    <option value="21-50">21-50</option>
                    <option value="50+">50+</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <label htmlFor="message" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                {t('contact.form.message')} *
              </label>
              <textarea
                id="message"
                required
                rows={5}
                className="w-full px-4 py-2 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-700 text-stone-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder={t('contact.form.messagePlaceholder')}
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 dark:bg-accent dark:hover:bg-accent/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? t('contact.form.sending') : t('contact.form.submit')}
            </Button>
          </form>
        </div>
      </div>
    </MarketingLayout>
  )
}
