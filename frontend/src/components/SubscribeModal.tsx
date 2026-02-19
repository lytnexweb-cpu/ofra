import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { stripePromise } from '../lib/stripe'
import { stripeApi } from '../api/stripe.api'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/Dialog'
import { Button } from './ui/Button'
import { Loader2, CreditCard, Check, AlertCircle, Shield } from 'lucide-react'

interface SubscribeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  planSlug: string
  planName: string
  billingCycle: 'monthly' | 'annual'
  price: number
  isFounder: boolean
  /** 'new' = first subscription, 'change' = upgrade/downgrade */
  mode: 'new' | 'change'
}

function PaymentForm({
  planSlug,
  planName,
  billingCycle,
  price,
  isFounder,
  mode,
  onSuccess,
}: Omit<SubscribeModalProps, 'open' | 'onOpenChange'> & { onSuccess: () => void }) {
  const { t } = useTranslation()
  const stripe = useStripe()
  const elements = useElements()
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<'card' | 'confirming' | 'done'>('card')

  const subscribeMutation = useMutation({
    mutationFn: async () => {
      if (!stripe || !elements) throw new Error('Stripe not loaded')

      setStep('confirming')
      setError(null)

      // Step 1: Create SetupIntent
      const setupRes = await stripeApi.createSetupIntent()
      if (!setupRes.success || !setupRes.data?.clientSecret) {
        throw new Error(setupRes.error?.message || t('stripe.errorSetupIntent'))
      }

      // Step 2: Confirm card setup
      const cardElement = elements.getElement(CardElement)
      if (!cardElement) throw new Error('Card element not found')

      const { error: stripeError, setupIntent } = await stripe.confirmCardSetup(
        setupRes.data.clientSecret,
        { payment_method: { card: cardElement } }
      )

      if (stripeError || !setupIntent?.payment_method) {
        throw new Error(stripeError?.message || t('stripe.errorCardConfirm'))
      }

      // Step 3: Attach payment method
      const pmId = typeof setupIntent.payment_method === 'string'
        ? setupIntent.payment_method
        : setupIntent.payment_method.id
      const attachRes = await stripeApi.updatePaymentMethod(pmId)
      if (!attachRes.success) {
        throw new Error(attachRes.error?.message || t('stripe.errorAttach'))
      }

      // Step 4: Subscribe or change plan
      const apiFn = mode === 'new' ? stripeApi.subscribe : stripeApi.changePlan
      const subRes = await apiFn(planSlug, billingCycle)
      if (!subRes.success) {
        throw new Error(subRes.error?.message || t('stripe.errorSubscribe'))
      }

      return subRes.data
    },
    onSuccess: () => {
      setStep('done')
      queryClient.invalidateQueries({ queryKey: ['subscription'] })
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
      setTimeout(onSuccess, 1500)
    },
    onError: (err: Error) => {
      setError(err.message)
      setStep('card')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    subscribeMutation.mutate()
  }

  const isMonthly = billingCycle === 'monthly'
  const displayPrice = isMonthly ? `${price}$` : `${price}$`
  const interval = isMonthly ? t('stripe.perMonth') : t('stripe.perYear')

  if (step === 'done') {
    return (
      <div className="text-center py-8">
        <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
          <Check className="w-8 h-8 text-emerald-600" />
        </div>
        <h3 className="text-lg font-semibold text-stone-900 mb-2">
          {mode === 'new' ? t('stripe.subscriptionActive') : t('stripe.planChanged')}
        </h3>
        <p className="text-sm text-stone-500">{t('stripe.thankYou')}</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Plan summary */}
      <div className="bg-stone-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-1">
          <span className="font-medium text-stone-900">{planName}</span>
          {isFounder && (
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
              {t('stripe.founderPrice')}
            </span>
          )}
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-primary">{displayPrice}</span>
          <span className="text-sm text-stone-500">{interval}</span>
        </div>
      </div>

      {/* Card input */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-stone-700 mb-2">
          <CreditCard className="w-4 h-4 text-stone-400" />
          {t('stripe.cardDetails')}
        </label>
        <div className="border border-stone-200 rounded-lg p-3 bg-white">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#1c1917',
                  '::placeholder': { color: '#a8a29e' },
                },
                invalid: { color: '#ef4444' },
              },
              hidePostalCode: true,
            }}
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg p-3">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Security note */}
      <div className="flex items-center gap-2 text-xs text-stone-400">
        <Shield className="w-3.5 h-3.5" />
        {t('stripe.securePayment')}
      </div>

      {/* Submit */}
      <Button
        type="submit"
        disabled={!stripe || step === 'confirming'}
        className="w-full bg-primary hover:bg-primary/90"
      >
        {step === 'confirming' ? (
          <span className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            {t('stripe.processing')}
          </span>
        ) : mode === 'new' ? (
          t('stripe.subscribeCta', { price: displayPrice, interval })
        ) : (
          t('stripe.changePlanCta')
        )}
      </Button>
    </form>
  )
}

export default function SubscribeModal(props: SubscribeModalProps) {
  const { t } = useTranslation()
  const { open, onOpenChange, ...formProps } = props

  if (!stripePromise) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('stripe.title')}</DialogTitle>
            <DialogDescription>{t('stripe.notConfigured')}</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {formProps.mode === 'new' ? t('stripe.titleSubscribe') : t('stripe.titleChangePlan')}
          </DialogTitle>
          <DialogDescription>
            {formProps.mode === 'new' ? t('stripe.descSubscribe') : t('stripe.descChangePlan')}
          </DialogDescription>
        </DialogHeader>
        <Elements stripe={stripePromise}>
          <PaymentForm {...formProps} onSuccess={() => onOpenChange(false)} />
        </Elements>
      </DialogContent>
    </Dialog>
  )
}
