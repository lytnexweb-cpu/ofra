import { useState, useMemo, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { ChevronDown, Plus, Check, Loader2, Search } from 'lucide-react'
import { partiesApi, type PartyRole, type TransactionParty } from '../../api/parties.api'
import { clientsApi, type Client } from '../../api/clients.api'

interface PartyPickerProps {
  transactionId: number
  role: 'buyer' | 'seller'
  selectedPartyId: number | null
  onSelect: (id: number | null) => void
  error?: boolean
}

/** Normalize string for accent-safe matching */
function normalize(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
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

  // Client lookup state
  const [lookupQuery, setLookupQuery] = useState('')
  const lookupInputRef = useRef<HTMLInputElement>(null)

  const { data: partiesData } = useQuery({
    queryKey: ['parties', transactionId],
    queryFn: () => partiesApi.list(transactionId),
  })

  // Fetch clients list for lookup (cached 5min)
  const { data: clientsData } = useQuery({
    queryKey: ['clients'],
    queryFn: () => clientsApi.list(),
    staleTime: 5 * 60 * 1000,
  })

  const parties: TransactionParty[] = (partiesData?.data?.parties ?? []).filter(
    (p) => p.role === role
  )

  const selectedParty = parties.find((p) => p.id === selectedPartyId) ?? null

  // Filtered clients for lookup
  const filteredClients = useMemo(() => {
    const clients: Client[] = clientsData?.data?.clients ?? []
    if (!lookupQuery.trim()) return clients.slice(0, 5)
    const q = normalize(lookupQuery.trim())
    return clients.filter((c) => {
      const name = normalize(`${c.firstName} ${c.lastName}`)
      const emailStr = normalize(c.email ?? '')
      return name.includes(q) || emailStr.includes(q)
    }).slice(0, 8)
  }, [clientsData, lookupQuery])

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
      setLookupQuery('')
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

  const handleSelectClient = (client: Client) => {
    const name = `${client.firstName} ${client.lastName}`.trim()
    setFullName(name)
    setEmail(client.email ?? '')
    setPhone(client.cellPhone ?? client.phone ?? '')
    setLookupQuery('')
    setShowInlineForm(true)
  }

  // Focus lookup input when inline form opens
  useEffect(() => {
    if (showInlineForm && lookupInputRef.current) {
      lookupInputRef.current.focus()
    }
  }, [showInlineForm])

  const label = role === 'buyer' ? t('addOffer.buyerParty') : t('addOffer.sellerParty')

  return (
    <div className="relative">
      <label className="block text-[11px] font-semibold text-stone-600 mb-1.5">
        {label}
      </label>

      {/* Trigger */}
      <button
        type="button"
        onClick={() => { setIsOpen(!isOpen); setShowInlineForm(false); setLookupQuery('') }}
        className={`w-full flex items-center justify-between px-3 py-2 text-[13px] rounded-lg border focus:outline-none focus:ring-[3px] ${error && !isOpen ? 'border-[#dc2626] bg-[#fef2f2] focus:ring-[rgba(220,38,38,.1)]' : 'border-stone-200 bg-white focus:border-[#1e3a5f] focus:ring-[rgba(30,58,95,.1)]'}`}
      >
        <span className={selectedParty ? 'text-stone-900' : 'text-stone-400'}>
          {selectedParty ? selectedParty.fullName : t('addOffer.selectParty')}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-stone-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-20 mt-1 w-full bg-white rounded-lg border border-stone-200 shadow-lg max-h-[320px] overflow-y-auto">
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
              {/* Client lookup autocomplete */}
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-stone-400" />
                <input
                  ref={lookupInputRef}
                  type="text"
                  value={lookupQuery}
                  onChange={(e) => setLookupQuery(e.target.value)}
                  placeholder={t('addOffer.clientLookupHint')}
                  className="w-full pl-7 pr-2.5 py-1.5 text-xs rounded-md border border-stone-200 focus:border-[#1e3a5f] focus:outline-none bg-stone-50"
                />
              </div>

              {/* Client suggestions */}
              {lookupQuery.trim() && filteredClients.length > 0 && (
                <div className="rounded-md border border-stone-100 bg-stone-50 max-h-[120px] overflow-y-auto">
                  {filteredClients.map((client) => (
                    <button
                      key={client.id}
                      type="button"
                      onClick={() => handleSelectClient(client)}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 text-left hover:bg-white text-xs"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-stone-900 truncate">
                          {client.firstName} {client.lastName}
                        </p>
                        {client.email && (
                          <p className="text-[10px] text-stone-400 truncate">{client.email}</p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {lookupQuery.trim() && filteredClients.length === 0 && (
                <p className="text-[10px] text-stone-400 text-center py-1">
                  {t('addOffer.noClientMatch')}
                </p>
              )}

              {/* Manual form fields */}
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={t('addOffer.partyNamePlaceholder')}
                className="w-full px-2.5 py-1.5 text-xs rounded-md border border-stone-200 focus:border-[#1e3a5f] focus:outline-none"
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
                  onClick={() => { setShowInlineForm(false); setFullName(''); setEmail(''); setPhone(''); setLookupQuery(''); setCreateError(null) }}
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
