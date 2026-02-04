import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { User, Users, Building2, Home, TreePine, Building, Map, BarChart3, Settings, Check, ChevronLeft, Languages } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { OfraLogo } from '../components/OfraLogo'
import { authApi, type PracticeType, type PropertyContext, type AnnualVolume } from '../api/auth.api'
import { toast } from '../hooks/use-toast'

const TOTAL_STEPS = 5

export default function OnboardingPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Step 1: Language - initialized from current i18n language
  const [language, setLanguage] = useState<'fr' | 'en'>(
    i18n.language?.startsWith('fr') ? 'fr' : 'en'
  )
  const [isChangingLanguage, setIsChangingLanguage] = useState(false)

  const [currentStep, setCurrentStep] = useState(1)
  // Step 2: Practice type
  const [practiceType, setPracticeType] = useState<PracticeType | null>(null)
  // Step 3: Property contexts
  const [propertyContexts, setPropertyContexts] = useState<PropertyContext[]>([])
  // Step 4: Annual volume
  const [annualVolume, setAnnualVolume] = useState<AnnualVolume | null>(null)
  // Step 5: Auto conditions preference
  const [preferAutoConditions, setPreferAutoConditions] = useState<boolean | null>(null)

  // Sync i18n language with component state ONLY on mount (not during active changes)
  useEffect(() => {
    // Only sync on initial mount, not when user is actively changing
    if (!isChangingLanguage) {
      const currentLang = i18n.language?.startsWith('fr') ? 'fr' : 'en'
      if (currentLang !== language) {
        setLanguage(currentLang)
      }
    }
  }, [i18n.language]) // Removed 'language' from deps to prevent race condition

  // Select language and apply immediately
  const selectLanguage = async (lang: 'fr' | 'en') => {
    if (lang === language) return
    setIsChangingLanguage(true)
    try {
      // Debug: log before
      console.log('[Onboarding] BEFORE - lang:', lang, '| i18n.language:', i18n.language, '| i18n.languages:', i18n.languages)

      // 1. Persist to localStorage FIRST
      localStorage.setItem('i18nextLng', lang)

      // 2. Change i18n language and WAIT for it
      const result = await i18n.changeLanguage(lang)
      console.log('[Onboarding] changeLanguage result:', result)

      // 3. Update local state AFTER i18n confirms change
      setLanguage(lang)

      // Debug: log after
      console.log('[Onboarding] AFTER - i18n.language:', i18n.language, '| i18n.resolvedLanguage:', i18n.resolvedLanguage)
    } catch (error) {
      console.error('[Onboarding] Language change FAILED:', error)
      // Rollback on error
      localStorage.setItem('i18nextLng', language)
    } finally {
      setIsChangingLanguage(false)
    }
  }

  // Save onboarding mutation
  const saveMutation = useMutation({
    mutationFn: () =>
      authApi.saveOnboarding({
        language,
        practiceType: practiceType!,
        propertyContexts,
        annualVolume: annualVolume!,
        preferAutoConditions: preferAutoConditions!,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
      setCurrentStep(TOTAL_STEPS + 1) // Show success screen
    },
    onError: () => {
      toast({ title: t('common.error'), variant: 'destructive' })
    },
  })

  // Skip onboarding mutation
  const skipMutation = useMutation({
    mutationFn: () => authApi.skipOnboarding(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
      navigate('/')
    },
  })

  const canProceed = useCallback(() => {
    // Disable navigation while language is being changed
    if (isChangingLanguage) return false
    switch (currentStep) {
      case 1:
        return language !== null // Always true since initialized
      case 2:
        return practiceType !== null
      case 3:
        return propertyContexts.length > 0
      case 4:
        return annualVolume !== null
      case 5:
        return preferAutoConditions !== null
      default:
        return false
    }
  }, [currentStep, language, practiceType, propertyContexts, annualVolume, preferAutoConditions, isChangingLanguage])

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1)
    } else {
      saveMutation.mutate()
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const toggleContext = (context: PropertyContext) => {
    setPropertyContexts((prev) =>
      prev.includes(context) ? prev.filter((c) => c !== context) : [...prev, context]
    )
  }

  const progressPercent = (currentStep / TOTAL_STEPS) * 100

  // Success screen
  if (currentStep > TOTAL_STEPS) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center">
            <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-success" />
            </div>
            <h1 className="text-2xl font-bold mb-2">{t('onboarding.success.title')}</h1>
            <p className="text-muted-foreground mb-8">{t('onboarding.success.subtitle')}</p>

            <div className="bg-muted rounded-xl p-4 mb-8 text-left">
              <h3 className="font-medium mb-3">{t('onboarding.success.profileTitle')}</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('onboarding.success.language')}</span>
                  <span className="font-medium">{language === 'fr' ? 'Français' : 'English'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('onboarding.success.practice')}</span>
                  <span className="font-medium">{t(`onboarding.steps.practice.${practiceType}`)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('onboarding.success.contexts')}</span>
                  <span className="font-medium">
                    {propertyContexts.map((c) => {
                      const key = c === 'urban_suburban' ? 'urbanSuburban' : c
                      return t(`onboarding.steps.contexts.${key}`)
                    }).join(', ')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('onboarding.success.volume')}</span>
                  <span className="font-medium">{t(`onboarding.steps.volume.${annualVolume}`)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('onboarding.success.style')}</span>
                  <span className="font-medium">
                    {t(`onboarding.steps.preference.${preferAutoConditions ? 'guided' : 'manual'}`)}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground mb-6">{t('onboarding.success.editHint')}</p>

            <Button onClick={() => navigate('/')} className="w-full">
              {t('onboarding.success.cta')}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <OfraLogo size={32} />
            <span className="font-semibold text-lg font-outfit">OFRA</span>
          </div>
          <button
            onClick={() => skipMutation.mutate()}
            disabled={skipMutation.isPending}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            {t('onboarding.skip')}
          </button>
        </div>
      </header>

      {/* Progress */}
      <div className="px-4 py-3 border-b border-border">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">
              {t('onboarding.stepOf', { current: currentStep, total: TOTAL_STEPS })}
            </span>
            <span className="text-xs text-muted-foreground">{Math.round(progressPercent)}%</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 px-4 py-6 overflow-y-auto">
        <div className="max-w-lg mx-auto flex flex-col min-h-full">
          {/* Step 1: Language */}
          {currentStep === 1 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Languages className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-2xl font-bold mb-2">{t('onboarding.steps.language.title')}</h1>
                <p className="text-muted-foreground">{t('onboarding.steps.language.subtitle')}</p>
              </div>

              <div className="space-y-3">
                <OptionCard
                  selected={language === 'fr'}
                  onClick={() => selectLanguage('fr')}
                  title="Français"
                  description="Continuer en français"
                />
                <OptionCard
                  selected={language === 'en'}
                  onClick={() => selectLanguage('en')}
                  title="English"
                  description="Continue in English"
                />
              </div>
            </div>
          )}

          {/* Step 2: Practice */}
          {currentStep === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-2xl font-bold mb-2">{t('onboarding.steps.practice.title')}</h1>
                <p className="text-muted-foreground">{t('onboarding.steps.practice.subtitle')}</p>
              </div>

              <div className="space-y-3">
                <OptionCard
                  selected={practiceType === 'solo'}
                  onClick={() => setPracticeType('solo')}
                  icon={<User className="w-6 h-6" />}
                  title={t('onboarding.steps.practice.solo')}
                  description={t('onboarding.steps.practice.soloDesc')}
                />
                <OptionCard
                  selected={practiceType === 'small_team'}
                  onClick={() => setPracticeType('small_team')}
                  icon={<Users className="w-6 h-6" />}
                  title={t('onboarding.steps.practice.smallTeam')}
                  description={t('onboarding.steps.practice.smallTeamDesc')}
                />
                <OptionCard
                  selected={practiceType === 'agency'}
                  onClick={() => setPracticeType('agency')}
                  icon={<Building2 className="w-6 h-6" />}
                  title={t('onboarding.steps.practice.agency')}
                  description={t('onboarding.steps.practice.agencyDesc')}
                />
              </div>
            </div>
          )}

          {/* Step 3: Contexts */}
          {currentStep === 3 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Home className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-2xl font-bold mb-2">{t('onboarding.steps.contexts.title')}</h1>
                <p className="text-muted-foreground">{t('onboarding.steps.contexts.subtitle')}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <MultiOptionCard
                  selected={propertyContexts.includes('urban_suburban')}
                  onClick={() => toggleContext('urban_suburban')}
                  icon={<Building className="w-8 h-8" />}
                  title={t('onboarding.steps.contexts.urbanSuburban')}
                  description={t('onboarding.steps.contexts.urbanSuburbanDesc')}
                />
                <MultiOptionCard
                  selected={propertyContexts.includes('rural')}
                  onClick={() => toggleContext('rural')}
                  icon={<TreePine className="w-8 h-8" />}
                  title={t('onboarding.steps.contexts.rural')}
                  description={t('onboarding.steps.contexts.ruralDesc')}
                />
                <MultiOptionCard
                  selected={propertyContexts.includes('condo')}
                  onClick={() => toggleContext('condo')}
                  icon={<Building2 className="w-8 h-8" />}
                  title={t('onboarding.steps.contexts.condo')}
                  description={t('onboarding.steps.contexts.condoDesc')}
                />
                <MultiOptionCard
                  selected={propertyContexts.includes('land')}
                  onClick={() => toggleContext('land')}
                  icon={<Map className="w-8 h-8" />}
                  title={t('onboarding.steps.contexts.land')}
                  description={t('onboarding.steps.contexts.landDesc')}
                />
              </div>

              <p className="text-center text-xs text-muted-foreground mt-4">
                {t('onboarding.steps.contexts.hint')}
              </p>
            </div>
          )}

          {/* Step 4: Volume */}
          {currentStep === 4 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-2xl font-bold mb-2">{t('onboarding.steps.volume.title')}</h1>
                <p className="text-muted-foreground">{t('onboarding.steps.volume.subtitle')}</p>
              </div>

              <div className="space-y-3">
                <OptionCard
                  selected={annualVolume === 'beginner'}
                  onClick={() => setAnnualVolume('beginner')}
                  title={t('onboarding.steps.volume.beginner')}
                  description={t('onboarding.steps.volume.beginnerDesc')}
                  badge="<10"
                />
                <OptionCard
                  selected={annualVolume === 'established'}
                  onClick={() => setAnnualVolume('established')}
                  title={t('onboarding.steps.volume.established')}
                  description={t('onboarding.steps.volume.establishedDesc')}
                  badge="10-30"
                />
                <OptionCard
                  selected={annualVolume === 'high'}
                  onClick={() => setAnnualVolume('high')}
                  title={t('onboarding.steps.volume.high')}
                  description={t('onboarding.steps.volume.highDesc')}
                  badge="30+"
                />
              </div>
            </div>
          )}

          {/* Step 5: Preference */}
          {currentStep === 5 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Settings className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-2xl font-bold mb-2">{t('onboarding.steps.preference.title')}</h1>
                <p className="text-muted-foreground">{t('onboarding.steps.preference.subtitle')}</p>
              </div>

              <div className="space-y-3">
                <OptionCard
                  selected={preferAutoConditions === true}
                  onClick={() => setPreferAutoConditions(true)}
                  title={t('onboarding.steps.preference.guided')}
                  description={t('onboarding.steps.preference.guidedDesc')}
                  tag={t('onboarding.steps.preference.guidedTag')}
                />
                <OptionCard
                  selected={preferAutoConditions === false}
                  onClick={() => setPreferAutoConditions(false)}
                  title={t('onboarding.steps.preference.manual')}
                  description={t('onboarding.steps.preference.manualDesc')}
                />
              </div>
            </div>
          )}

          {/* Desktop buttons - inside content flow */}
          <div className="hidden md:flex gap-3 mt-8 pt-6 border-t border-border">
            {currentStep > 1 && (
              <Button variant="outline" onClick={handleBack} className="flex-1">
                <ChevronLeft className="w-4 h-4 mr-2" />
                {t('onboarding.back')}
              </Button>
            )}
            <Button
              onClick={handleNext}
              disabled={!canProceed() || saveMutation.isPending}
              className="flex-1"
            >
              {saveMutation.isPending
                ? '...'
                : currentStep === TOTAL_STEPS
                  ? t('onboarding.finish')
                  : t('onboarding.continue')}
            </Button>
          </div>
        </div>
      </main>

      {/* Mobile footer - sticky at bottom */}
      <footer className="md:hidden border-t border-border px-4 py-4">
        <div className="max-w-lg mx-auto flex gap-3">
          {currentStep > 1 && (
            <Button variant="outline" onClick={handleBack} className="flex-1">
              <ChevronLeft className="w-4 h-4 mr-2" />
              {t('onboarding.back')}
            </Button>
          )}
          <Button
            onClick={handleNext}
            disabled={!canProceed() || saveMutation.isPending}
            className="flex-1"
          >
            {saveMutation.isPending
              ? '...'
              : currentStep === TOTAL_STEPS
                ? t('onboarding.finish')
                : t('onboarding.continue')}
          </Button>
        </div>
      </footer>
    </div>
  )
}

// Single-select option card
function OptionCard({
  selected,
  onClick,
  icon,
  title,
  description,
  badge,
  tag,
}: {
  selected: boolean
  onClick: () => void
  icon?: React.ReactNode
  title: string
  description: string
  badge?: string
  tag?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'w-full p-4 rounded-xl border-2 text-left transition-colors',
        selected
          ? 'border-primary bg-primary/5'
          : 'border-border hover:border-primary/50',
      ].join(' ')}
    >
      <div className="flex items-center gap-4">
        <div
          className={[
            'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors',
            selected ? 'border-primary bg-primary' : 'border-muted-foreground/30',
          ].join(' ')}
        >
          {selected && <Check className="w-4 h-4 text-primary-foreground" />}
        </div>
        {icon && <div className="text-muted-foreground">{icon}</div>}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{title}</span>
            {tag && (
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                {tag}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {badge && (
          <span className="text-lg font-semibold text-muted-foreground">{badge}</span>
        )}
      </div>
    </button>
  )
}

// Multi-select option card
function MultiOptionCard({
  selected,
  onClick,
  icon,
  title,
  description,
}: {
  selected: boolean
  onClick: () => void
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'p-4 rounded-xl border-2 text-center transition-colors',
        selected
          ? 'border-primary bg-primary/10'
          : 'border-border hover:border-primary/50',
      ].join(' ')}
    >
      <div className="text-muted-foreground mb-2">{icon}</div>
      <div className="font-medium text-sm">{title}</div>
      <div className="text-xs text-muted-foreground">{description}</div>
    </button>
  )
}
