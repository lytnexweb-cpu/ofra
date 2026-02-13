import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Users, Plus, AlertCircle } from 'lucide-react'
import { partiesApi, type TransactionParty, type PartyRole } from '../../api/parties.api'

/** Role-specific badge colors per maquette M13 */
function getRoleBadgeClasses(role: PartyRole): string {
  switch (role) {
    case 'buyer': return 'bg-blue-100 text-blue-700'
    case 'seller': return 'bg-emerald-100 text-emerald-700'
    case 'lawyer': return 'bg-amber-100 text-amber-700'
    case 'notary': return 'bg-indigo-100 text-indigo-700'
    case 'agent': return 'bg-violet-100 text-violet-700'
    case 'broker': return 'bg-cyan-100 text-cyan-700'
    default: return 'bg-stone-100 text-stone-500'
  }
}

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
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${getRoleBadgeClasses(party.role)}`}>
                    {t(`parties.role.${party.role}`, party.role)}
                  </span>
                  <span className="text-xs text-stone-700 truncate">{party.fullName}</span>
                  {party.isPrimary && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-primary/10 text-primary shrink-0">
                      {t('parties.primary', 'Principal')}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className={`w-1.5 h-1.5 rounded-full ${party.email ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                  {!party.email && (
                    <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                  )}
                </div>
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
