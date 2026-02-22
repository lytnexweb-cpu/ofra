import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { stripeApi } from '../api/stripe.api'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/Dialog'
import { Button } from './ui/Button'
import { Loader2, ArrowRight, ArrowDown, AlertTriangle, Check, List } from 'lucide-react'

interface ChangePlanModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentPlanName: string
  currentPlanSlug: string
  currentPrice: number
  newPlanName: string
  newPlanSlug: string
  newPrice: number
  billingCycle: 'monthly' | 'annual'
  isDowngrade: boolean
  onSuccess: () => void
}

interface DowngradeBlockedError {
  activeTransactions: number
  maxTransactions: number
  archiveNeeded: number
}

export default function ChangePlanModal({
  open,
  onOpenChange,
  currentPlanName,
  currentPrice,
  newPlanName,
  newPlanSlug,
  newPrice,
  billingCycle,
  isDowngrade,
  onSuccess,
}: ChangePlanModalProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [blocked, setBlocked] = useState<DowngradeBlockedError | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const mutation = useMutation({
    mutationFn: async () => {
      setErrorMsg(null)
      setBlocked(null)
      const res = await stripeApi.changePlan(newPlanSlug, billingCycle) as any
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: ['subscription'] })
        queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
        setSuccess(true)
        setTimeout(onSuccess, 1200)
      } else if (res.error?.code === 'E_DOWNGRADE_BLOCKED') {
        const meta = res.error.meta || res.error.details
        setBlocked(meta as DowngradeBlockedError)
      } else {
        setErrorMsg(res.error?.message || t('common.error'))
      }
    },
  })
  const interval = billingCycle === 'monthly' ? t('pricing.perMonth') : t('pricing.perYear')

  const handleClose = (v: boolean) => {
    if (!v) {
      setBlocked(null)
      setErrorMsg(null)
      setSuccess(false)
      mutation.reset()
    }
    onOpenChange(v)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isDowngrade ? t('changePlan.downgradeTitle') : t('changePlan.upgradeTitle')}
          </DialogTitle>
          <DialogDescription>
            {isDowngrade ? t('changePlan.downgradeDesc') : t('changePlan.upgradeDesc')}
          </DialogDescription>
        </DialogHeader>

        {/* Success state */}
        {success ? (
          <div className="text-center py-6">
            <div className="mx-auto w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mb-3">
              <Check className="w-7 h-7 text-emerald-600" />
            </div>
            <h3 className="text-lg font-semibold text-stone-900 mb-1">
              {t('changePlan.success')}
            </h3>
            <p className="text-sm text-stone-500">{t('changePlan.redirecting')}</p>
          </div>
        ) : (
          <div className="space-y-5 pt-2">
            {/* Plan comparison */}
            <div className="flex items-center gap-3">
              {/* Current plan */}
              <div className="flex-1 rounded-lg border border-stone-200 p-3 bg-stone-50">
                <p className="text-xs text-stone-400 mb-0.5">{t('changePlan.current')}</p>
                <p className="font-semibold text-stone-900">{currentPlanName}</p>
                <p className="text-sm text-stone-600">{currentPrice}$ {interval}</p>
              </div>

              {/* Arrow */}
              <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                isDowngrade ? 'bg-amber-100' : 'bg-emerald-100'
              }`}>
                {isDowngrade
                  ? <ArrowDown className="w-4 h-4 text-amber-600" />
                  : <ArrowRight className="w-4 h-4 text-emerald-600" />
                }
              </div>

              {/* New plan */}
              <div className={`flex-1 rounded-lg border-2 p-3 ${
                isDowngrade ? 'border-amber-200 bg-amber-50/50' : 'border-emerald-200 bg-emerald-50/50'
              }`}>
                <p className="text-xs text-stone-400 mb-0.5">{t('changePlan.new')}</p>
                <p className="font-semibold text-stone-900">{newPlanName}</p>
                <p className="text-sm text-stone-600">{newPrice}$ {interval}</p>
              </div>
            </div>

            {/* Prorate note */}
            <p className="text-xs text-stone-400 text-center">
              {t('changePlan.prorateNote')}
            </p>

            {/* Downgrade warning */}
            {isDowngrade && !blocked && (
              <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 p-3">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-700">
                  {t('changePlan.downgradeWarning')}
                </p>
              </div>
            )}

            {/* Downgrade blocked error */}
            {blocked && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-4 space-y-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-700">
                      {t('changePlan.blocked')}
                    </p>
                    <p className="text-sm text-red-600 mt-1">
                      {t('changePlan.blockedDetail', {
                        active: blocked.activeTransactions,
                        max: blocked.maxTransactions,
                        archive: blocked.archiveNeeded,
                      })}
                    </p>
                  </div>
                </div>
                <Link
                  to="/transactions"
                  onClick={() => handleClose(false)}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-red-700 hover:text-red-800"
                >
                  <List className="w-3.5 h-3.5" />
                  {t('changePlan.goToTransactions')}
                </Link>
              </div>
            )}

            {/* Generic error */}
            {errorMsg && !blocked && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg p-3">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {errorMsg}
              </div>
            )}

            {/* Actions */}
            {!blocked && (
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleClose(false)}
                  disabled={mutation.isPending}
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  className={`flex-1 ${
                    isDowngrade
                      ? 'bg-amber-600 hover:bg-amber-700 text-white'
                      : 'bg-primary hover:bg-primary/90 text-white'
                  }`}
                  onClick={() => mutation.mutate()}
                  disabled={mutation.isPending}
                >
                  {mutation.isPending ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t('changePlan.processing')}
                    </span>
                  ) : (
                    t('changePlan.confirm')
                  )}
                </Button>
              </div>
            )}

            {/* Close button when blocked */}
            {blocked && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleClose(false)}
              >
                {t('common.close')}
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
