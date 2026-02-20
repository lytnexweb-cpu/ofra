import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { ChevronDown, Plus, Check, Loader2 } from 'lucide-react'
import { partiesApi, type PartyRole, type TransactionParty } from '../../api/parties.api'

interface PartyPickerProps {
  transactionId: number
  role: 'buyer' | 'seller'
  selectedPartyId: number | null
  onSelect: (id: number | null) => void
  error?: boolean
}

export default function PartyPicker({
  transactionId,
  role,
  selectedPartyId,
  onSelect,
  error,
}: PartyPickerProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const [isOpen, setIsOpen] = useState(false)
  const [showInlineForm, setShowInlineForm] = useState(false)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')

  const { data: partiesData } = useQuery({
    queryKey: ['parties', transactionId],
    queryFn: () => partiesApi.list(transactionId),
  })

  const parties: TransactionParty[] = (partiesData?.data?.parties ?? []).filter(
    (p) => p.role === role
  )

  const selectedParty = parties.find((p) => p.id === selectedPartyId) ?? null

  const [createError, setCreateError] = useState<string | null>(null)

  const createMutation = useMutation({
    mutationFn: (data: { fullName: string; email?: string; phone?: string }) =>
      partiesApi.create(transactionId, {
        role: role as PartyRole,
        fullName: data.fullName,
        email: data.email || null,
        phone: data.phone || null,
      }),
    onSuccess: (result) => {
      if (!(result as any)?.success) {
        setCreateError((result as any)?.error?.message || t('addOffer.partyCreateError'))
        return
      }
      setCreateError(null)
      queryClient.invalidateQueries({ queryKey: ['parties', transactionId] })
      const newParty = (result as any)?.data?.party
      if (newParty?.id) {
        onSelect(newParty.id)
      }
      setShowInlineForm(false)
      setFullName('')
      setEmail('')
      setPhone('')
      setIsOpen(false)
    },
    onError: () => {
      setCreateError(t('addOffer.partyCreateError'))
    },
  })

  const handleCreate = () => {
    if (!fullName.trim()) return
    createMutation.mutate({
      fullName: fullName.trim(),
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
    })
  }

  const label = role === 'buyer' ? t('addOffer.buyerParty') : t('addOffer.sellerParty')

  return (
    <div className="relative">
      <label className="block text-[11px] font-semibold text-stone-600 mb-1.5">
        {label}
      </label>

      {/* Trigger */}
      <button
        type="button"
        onClick={() => { setIsOpen(!isOpen); setShowInlineForm(false) }}
        className={`w-full flex items-center justify-between px-3 py-2 text-[13px] rounded-lg border focus:outline-none focus:ring-[3px] ${error && !isOpen ? 'border-[#dc2626] bg-[#fef2f2] focus:ring-[rgba(220,38,38,.1)]' : 'border-stone-200 bg-white focus:border-[#1e3a5f] focus:ring-[rgba(30,58,95,.1)]'}`}
      >
        <span className={selectedParty ? 'text-stone-900' : 'text-stone-400'}>
          {selectedParty ? selectedParty.fullName : t('addOffer.selectParty')}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-stone-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-20 mt-1 w-full bg-white rounded-lg border border-stone-200 shadow-lg max-h-[240px] overflow-y-auto">
          {/* Existing parties */}
          {parties.length > 0 && (
            <div className="py-1">
              {parties.map((party) => (
                <button
                  key={party.id}
                  type="button"
                  onClick={() => {
                    onSelect(party.id)
                    setIsOpen(false)
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-stone-50 text-xs"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-stone-900 truncate">{party.fullName}</p>
                    {party.email && (
                      <p className="text-stone-400 truncate">{party.email}</p>
                    )}
                  </div>
                  {party.id === selectedPartyId && (
                    <Check className="w-3.5 h-3.5 text-[#059669] shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Divider */}
          {parties.length > 0 && <div className="border-t border-stone-100" />}

          {/* Add new */}
          {!showInlineForm ? (
            <button
              type="button"
              onClick={() => setShowInlineForm(true)}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-medium text-[#1e3a5f] hover:bg-stone-50"
            >
              <Plus className="w-3.5 h-3.5" />
              {t('addOffer.addParty')}
            </button>
          ) : (
            <div className="p-3 space-y-2">
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={t('addOffer.partyNamePlaceholder')}
                className="w-full px-2.5 py-1.5 text-xs rounded-md border border-stone-200 focus:border-[#1e3a5f] focus:outline-none"
                autoFocus
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('addOffer.partyEmailPlaceholder')}
                className="w-full px-2.5 py-1.5 text-xs rounded-md border border-stone-200 focus:border-[#1e3a5f] focus:outline-none"
              />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t('addOffer.partyPhonePlaceholder')}
                className="w-full px-2.5 py-1.5 text-xs rounded-md border border-stone-200 focus:border-[#1e3a5f] focus:outline-none"
              />
              {createError && (
                <p className="text-[10px] text-[#dc2626]">{createError}</p>
              )}
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={!fullName.trim() || createMutation.isPending}
                  className="flex-1 flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md bg-[#1e3a5f] text-white hover:bg-[#16304d] disabled:opacity-50"
                >
                  {createMutation.isPending ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Plus className="w-3 h-3" />
                  )}
                  {t('addOffer.addParty')}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowInlineForm(false); setFullName(''); setEmail(''); setPhone(''); setCreateError(null) }}
                  className="px-2.5 py-1.5 text-xs text-stone-500 hover:bg-stone-50 rounded-md"
                >
                  {t('addOffer.cancel')}
                </button>
              </div>
            </div>
          )}

          {/* Clear selection */}
          {selectedPartyId && (
            <>
              <div className="border-t border-stone-100" />
              <button
                type="button"
                onClick={() => { onSelect(null); setIsOpen(false) }}
                className="w-full px-3 py-2 text-xs text-stone-400 hover:bg-stone-50 text-left"
              >
                {t('addOffer.clearParty')}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
