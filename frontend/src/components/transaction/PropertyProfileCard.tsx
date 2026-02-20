import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Home, Pencil, Loader2, Lock } from 'lucide-react'
import { transactionsApi, type TransactionProfile } from '../../api/transactions.api'
import { toast } from '../../hooks/use-toast'

interface PropertyProfileCardProps {
  transactionId: number
  currentStepOrder?: number // when > 1, profile is locked
  onEdit?: () => void // kept for backwards compat but not used internally
}

function getProfileTags(profile: TransactionProfile, t: (key: string) => string): { label: string; variant: 'default' | 'blue' }[] {
  const tags: { label: string; variant: 'default' | 'blue' }[] = []

  const typeMap: Record<string, string> = { house: 'residential', condo: 'residential', land: 'land' }
  const typeKey = typeMap[profile.propertyType] ?? profile.propertyType
  tags.push({ label: t(`transaction.detail.propertyTags.${typeKey}`), variant: 'default' })

  if (profile.propertyContext) {
    tags.push({ label: t(`transaction.detail.propertyTags.${profile.propertyContext}`), variant: 'default' })
  }

  tags.push({
    label: profile.isFinanced ? t('transaction.detail.propertyTags.financed') : t('transaction.detail.propertyTags.notFinanced'),
    variant: profile.isFinanced ? 'blue' : 'default',
  })

  if (profile.propertyType === 'condo' && profile.condoDocsRequired) {
    tags.push({ label: t('transaction.detail.propertyTags.condoDocs'), variant: 'default' })
  } else if (profile.propertyType !== 'condo') {
    tags.push({ label: t('transaction.detail.propertyTags.noCondo'), variant: 'default' })
  }

  if (profile.hasWell) tags.push({ label: t('transaction.detail.propertyTags.hasWell'), variant: 'default' })
  if (profile.hasSeptic) tags.push({ label: t('transaction.detail.propertyTags.hasSeptic'), variant: 'default' })

  return tags
}

export default function PropertyProfileCard({ transactionId, currentStepOrder, onEdit }: PropertyProfileCardProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const isLocked = (currentStepOrder ?? 1) > 1

  const [showForm, setShowForm] = useState(false)
  const [propertyType, setPropertyType] = useState<string>('house')
  const [propertyContext, setPropertyContext] = useState<string>('urban')
  const [isFinanced, setIsFinanced] = useState(true)

  const { data, isLoading } = useQuery({
    queryKey: ['transaction-profile', transactionId],
    queryFn: () => transactionsApi.getProfile(transactionId),
  })

  const profile = data?.data?.profile ?? null

  const openEditForm = () => {
    if (profile) {
      setPropertyType(profile.propertyType ?? 'house')
      setPropertyContext(profile.propertyContext ?? 'urban')
      setIsFinanced(profile.isFinanced ?? true)
    }
    setShowForm(true)
  }

  const createMutation = useMutation({
    mutationFn: () =>
      transactionsApi.upsertProfile(transactionId, {
        propertyType: propertyType as any,
        propertyContext: propertyContext as any,
        isFinanced,
      }),
    onSuccess: (response) => {
      if (!response.success && response.error?.code === 'E_PROFILE_LOCKED') {
        toast({
          title: t('transaction.detail.profileLocked'),
          description: t('transaction.detail.profileLockedError'),
          variant: 'destructive',
        })
        setShowForm(false)
        return
      }
      if (!response.success) {
        toast({ title: t('common.error'), description: response.error?.message, variant: 'destructive' })
        return
      }
      queryClient.invalidateQueries({ queryKey: ['transaction-profile', transactionId] })
      queryClient.invalidateQueries({ queryKey: ['transaction', transactionId] })
      queryClient.invalidateQueries({ queryKey: ['advance-check', transactionId] })
      queryClient.invalidateQueries({ queryKey: ['conditions', 'active', transactionId] })
      setShowForm(false)
      toast({ title: t('common.success'), variant: 'success' })
    },
    onError: () => {
      toast({ title: t('common.error'), variant: 'destructive' })
    },
  })

  if (isLoading) return null

  const selectClass = 'w-full px-2 py-1 text-xs rounded-md border border-stone-200 bg-white focus:outline-none focus:ring-1 focus:ring-primary/30'

  return (
    <div className="mb-5">
      <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-3 sm:p-4">
        {/* Header — identique maquette 01 */}
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs sm:text-sm font-semibold text-stone-700 flex items-center gap-2">
            <Home className="w-4 h-4 text-stone-400" />
            {t('transaction.detail.propertyProfile')}
          </h3>
          {isLocked ? (
            <span className="text-xs text-stone-400 flex items-center gap-1">
              <Lock className="w-3 h-3" />
              {t('transaction.detail.profileLocked', 'Verrouillé')}
            </span>
          ) : (
            <button
              onClick={openEditForm}
              className="text-xs text-primary hover:underline font-medium flex items-center gap-1"
            >
              <Pencil className="w-3.5 h-3.5" />
              {t('transaction.detail.editProperty')}
            </button>
          )}
        </div>

        {/* Tags — maquette 01 : flex flex-wrap gap-1.5 */}
        {profile && !showForm ? (
          <div className="flex flex-wrap gap-1.5">
            {getProfileTags(profile, t).map((tag, i) => (
              <span
                key={i}
                className={`px-2 py-0.5 rounded-full text-xs ${
                  tag.variant === 'blue'
                    ? 'bg-blue-50 text-blue-700'
                    : 'bg-stone-100 text-stone-600'
                }`}
              >
                {tag.label}
              </span>
            ))}
          </div>
        ) : showForm ? (
          <div className="space-y-2.5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] text-stone-400 uppercase tracking-wide mb-0.5 block">
                  {t('transaction.detail.profileForm.type')}
                </label>
                <select value={propertyType} onChange={(e) => setPropertyType(e.target.value)} className={selectClass}>
                  <option value="house">{t('transaction.detail.propertyTags.residential')}</option>
                  <option value="condo">Condo</option>
                  <option value="land">{t('transaction.detail.propertyTags.land')}</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-stone-400 uppercase tracking-wide mb-0.5 block">
                  {t('transaction.detail.profileForm.context')}
                </label>
                <select value={propertyContext} onChange={(e) => setPropertyContext(e.target.value)} className={selectClass}>
                  <option value="urban">{t('transaction.detail.propertyTags.urban')}</option>
                  <option value="suburban">{t('transaction.detail.propertyTags.suburban')}</option>
                  <option value="rural">{t('transaction.detail.propertyTags.rural')}</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-stone-400 uppercase tracking-wide mb-0.5 block">
                  {t('transaction.detail.profileForm.financing')}
                </label>
                <select value={isFinanced ? 'yes' : 'no'} onChange={(e) => setIsFinanced(e.target.value === 'yes')} className={selectClass}>
                  <option value="yes">{t('transaction.detail.propertyTags.financed')}</option>
                  <option value="no">{t('transaction.detail.propertyTags.notFinanced')}</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => createMutation.mutate()}
                disabled={createMutation.isPending}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-primary text-white hover:bg-primary/90 disabled:opacity-50"
              >
                {createMutation.isPending && <Loader2 className="w-3 h-3 animate-spin" />}
                {profile ? t('common.save') : t('transaction.detail.profileForm.create')}
              </button>
              <button onClick={() => setShowForm(false)} className="px-3 py-1.5 text-xs font-medium rounded-lg text-stone-500 hover:bg-stone-100">
                {t('common.cancel')}
              </button>
            </div>
          </div>
        ) : (
          /* Empty state — meme structure visuelle que les tags */
          <div className="flex flex-wrap gap-1.5">
            <span className="px-2 py-0.5 rounded-full text-xs bg-stone-50 text-stone-300 border border-dashed border-stone-200">
              {t('transaction.detail.noProfile')}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
