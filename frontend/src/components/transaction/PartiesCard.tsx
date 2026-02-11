import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Users, Plus, AlertCircle } from 'lucide-react'
import { partiesApi, type TransactionParty } from '../../api/parties.api'

interface PartiesCardProps {
  transactionId: number
  onManage: () => void
}

export default function PartiesCard({ transactionId, onManage }: PartiesCardProps) {
  const { t } = useTranslation()

  const { data, isLoading } = useQuery({
    queryKey: ['parties', transactionId],
    queryFn: () => partiesApi.list(transactionId),
  })

  const parties: TransactionParty[] = data?.data?.parties ?? []

  if (isLoading) return null

  const notifiableCount = parties.filter((p) => p.email).length
  const missingEmailCount = parties.filter((p) => !p.email).length

  return (
    <div className="mb-5">
      <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-3 sm:p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs sm:text-sm font-semibold text-stone-700 flex items-center gap-2">
            <Users className="w-4 h-4 text-stone-400" />
            {t('parties.title', 'Parties de la transaction')}
            {parties.length > 0 && (
              <span className="text-xs font-normal text-stone-400">
                ({parties.length})
              </span>
            )}
          </h3>
          <button
            onClick={onManage}
            className="text-xs text-primary hover:underline font-medium flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            {t('parties.addParty', 'Ajouter')}
          </button>
        </div>

        {/* Content */}
        {parties.length === 0 ? (
          <div className="flex flex-wrap gap-1.5">
            <span className="px-2 py-0.5 rounded-full text-xs bg-stone-50 text-stone-300 border border-dashed border-stone-200">
              {t('transaction.detail.noParties', 'Aucune partie ajoutée')}
            </span>
          </div>
        ) : (
          <div className="space-y-1.5">
            {parties.map((party) => (
              <div
                key={party.id}
                className="flex items-center justify-between py-1 px-2 rounded-lg hover:bg-stone-50 cursor-pointer"
                onClick={onManage}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide bg-stone-100 text-stone-500 shrink-0">
                    {t(`parties.role.${party.role}`, party.role)}
                  </span>
                  <span className="text-xs text-stone-700 truncate">{party.fullName}</span>
                  {party.isPrimary && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-primary/10 text-primary shrink-0">
                      {t('parties.primary', 'Principal')}
                    </span>
                  )}
                </div>
                {!party.email && (
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                )}
              </div>
            ))}

            {/* Footer stats */}
            <div className="flex items-center gap-3 pt-1.5 border-t border-stone-100 mt-1">
              <span className="text-[10px] text-stone-400">
                {notifiableCount} {t('parties.notifiable', 'notifiables')}
              </span>
              {missingEmailCount > 0 && (
                <span className="text-[10px] text-amber-500 flex items-center gap-0.5">
                  <AlertCircle className="w-3 h-3" />
                  {missingEmailCount} {t('parties.missing', 'sans courriel')}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
