import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Lock } from 'lucide-react'

interface UpgradePromptProps {
  feature: string
  targetPlan: 'solo' | 'pro' | 'agence'
  className?: string
}

const FEATURE_KEYS: Record<string, string> = {
  specialized_packs: 'plans.upgradeForPacks',
  condition_evidence: 'plans.upgradeForEvidence',
  condition_history: 'plans.upgradeForHistory',
  pdf_exports: 'plans.upgradeForExports',
  share_links: 'plans.upgradeForShareLinks',
}

const PLAN_KEYS: Record<string, string> = {
  solo: 'plans.upgradeToSolo',
  pro: 'plans.upgradeToPro',
  agence: 'plans.upgradeToAgence',
}

export default function UpgradePrompt({ feature, targetPlan, className = '' }: UpgradePromptProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const featureMessage = t(FEATURE_KEYS[feature] ?? 'plans.upgradeRequired')
  const planLabel = t(PLAN_KEYS[targetPlan] ?? 'plans.upgradeRequired')

  return (
    <div className={`rounded-lg border border-amber-200 bg-amber-50 p-3 ${className}`}>
      <div className="flex items-start gap-2.5">
        <div className="w-7 h-7 rounded-md bg-amber-100 flex items-center justify-center shrink-0">
          <Lock className="w-3.5 h-3.5 text-amber-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-amber-800">{featureMessage}</p>
          <p className="text-[10px] text-amber-600 mt-0.5">{planLabel}</p>
          <button
            onClick={() => navigate('/pricing')}
            className="mt-2 px-3 py-1.5 text-[10px] font-semibold text-white bg-[#e07a2f] hover:bg-[#c96a25] rounded-md transition-colors"
          >
            {t('plans.viewPlans')}
          </button>
        </div>
      </div>
    </div>
  )
}
