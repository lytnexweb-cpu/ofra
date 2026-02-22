import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { OfraLogo } from '../components/OfraLogo'
import { authApi } from '../api/auth.api'
import { profileApi } from '../api/profile.api'
import Step1Profile, { type Step1Data } from './onboarding/Step1Profile'
import Step2Import from './onboarding/Step2Import'
import Step3Transaction from './onboarding/Step3Transaction'

const TOTAL_STEPS = 3

export default function OnboardingPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [currentStep, setCurrentStep] = useState(1)

  // Fetch current user
  const { data: meData } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => authApi.me(),
  })
  const user = meData?.data?.user ?? null

  // Step 1 data
  const [step1Data, setStep1Data] = useState<Step1Data>({
    language: 'fr',
    fullName: '',
    phone: '',
    agency: '',
    licenseNumber: '',
  })

  // Step 2 imported count (to know if we imported or skipped)
  const [importedCount, setImportedCount] = useState<number | null>(null)

  // Skip onboarding mutation
  const skipMutation = useMutation({
    mutationFn: () => authApi.skipOnboarding(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
      navigate('/')
    },
  })

  // Save step 1 profile mutation (saves to profile so data persists even if user leaves)
  const saveStep1Mutation = useMutation({
    mutationFn: () =>
      profileApi.updateProfileInfo({
        language: step1Data.language,
        fullName: step1Data.fullName || undefined,
        phone: step1Data.phone || undefined,
        agency: step1Data.agency,
        licenseNumber: step1Data.licenseNumber,
      }),
  })

  const canProceedStep1 = useCallback(() => {
    return step1Data.agency.trim().length > 0 && step1Data.licenseNumber.trim().length > 0
  }, [step1Data])

  const handleNext = () => {
    if (currentStep === 1) {
      // Save profile data, then advance
      saveStep1Mutation.mutate(undefined, {
        onSuccess: () => setCurrentStep(2),
      })
    } else if (currentStep === 2) {
      setCurrentStep(3)
    }
    // Step 3 handles its own completion
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleImportComplete = (count: number) => {
    setImportedCount(count)
  }

  const progressPercent = (currentStep / TOTAL_STEPS) * 100

  // Determine if Continue button should be shown
  // Step 1: always show (with validation)
  // Step 2: show after import is done or method chosen as zero
  // Step 3: managed by the component itself (no external Continue needed)
  const showContinueButton = currentStep === 1 || (currentStep === 2 && importedCount !== null)
  const canProceed = currentStep === 1 ? canProceedStep1() : currentStep === 2 ? importedCount !== null : false
  const isNextLoading = saveStep1Mutation.isPending

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
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
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
              className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 px-4 py-6 overflow-y-auto">
        <div className="max-w-lg mx-auto flex flex-col min-h-full">
          {currentStep === 1 && (
            <Step1Profile user={user} data={step1Data} onChange={setStep1Data} />
          )}

          {currentStep === 2 && (
            <Step2Import onImportComplete={handleImportComplete} />
          )}

          {currentStep === 3 && (
            <Step3Transaction step1Data={step1Data} />
          )}

          {/* Desktop buttons — inside content flow */}
          {showContinueButton && (
            <div className="hidden md:flex gap-3 mt-8 pt-6 border-t border-border">
              {currentStep > 1 && (
                <Button variant="outline" onClick={handleBack} className="flex-1">
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  {t('onboarding.back')}
                </Button>
              )}
              <Button
                onClick={handleNext}
                disabled={!canProceed || isNextLoading}
                className="flex-1"
              >
                {isNextLoading ? '...' : t('onboarding.continue')}
              </Button>
            </div>
          )}
        </div>
      </main>

      {/* Mobile footer — sticky at bottom */}
      {showContinueButton && (
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
              disabled={!canProceed || isNextLoading}
              className="flex-1"
            >
              {isNextLoading ? '...' : t('onboarding.continue')}
            </Button>
          </div>
        </footer>
      )}
    </div>
  )
}
