import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Loader2, Home, Building2, Map, Search, CheckCircle } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { clientsApi, type Client } from '../../api/clients.api'
import { transactionsApi, type TransactionType } from '../../api/transactions.api'
import { workflowTemplatesApi } from '../../api/workflow-templates.api'
import { authApi } from '../../api/auth.api'
import type { Step1Data } from './Step1Profile'

type PropertyType = 'house' | 'condo' | 'land'
type Scene = 'form' | 'success'

interface Step3TransactionProps {
  step1Data: Step1Data
}

export default function Step3Transaction({ step1Data }: Step3TransactionProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [scene, setScene] = useState<Scene>('form')
  const [txType, setTxType] = useState<TransactionType>('purchase')
  const [clientId, setClientId] = useState<number | null>(null)
  const [clientSearch, setClientSearch] = useState('')
  const [showClientDropdown, setShowClientDropdown] = useState(false)
  const [propertyAddress, setPropertyAddress] = useState('')
  const [propertyType, setPropertyType] = useState<PropertyType>('house')
  const [price, setPrice] = useState('')

  // Fetch clients
  const { data: clientsData } = useQuery({
    queryKey: ['clients'],
    queryFn: () => clientsApi.list(),
  })

  const clients = clientsData?.data?.clients ?? []

  const filteredClients = useMemo(() => {
    if (!clientSearch.trim()) return clients.slice(0, 10)
    const search = clientSearch.toLowerCase()
    return clients
      .filter((c) =>
        `${c.firstName} ${c.lastName}`.toLowerCase().includes(search) ||
        c.email?.toLowerCase().includes(search)
      )
      .slice(0, 10)
  }, [clients, clientSearch])

  const selectedClient = clients.find((c) => c.id === clientId)

  // Create transaction mutation
  const createTxMutation = useMutation({
    mutationFn: async () => {
      // Fetch default template for this type
      const templatesRes = await workflowTemplatesApi.list({ type: txType, active: 'true' })
      const templates = templatesRes.data?.templates ?? []
      const defaultTemplate = templates.find((t) => t.isDefault) ?? templates[0]

      if (!defaultTemplate) {
        throw new Error('No workflow template found')
      }

      return transactionsApi.create({
        clientId: clientId!,
        type: txType,
        workflowTemplateId: defaultTemplate.id,
        address: propertyAddress || undefined,
        salePrice: price ? Number(price.replace(/\s/g, '')) : undefined,
        profile: {
          propertyType,
          propertyContext: 'urban',
          isFinanced: true,
        },
      })
    },
    onSuccess: async () => {
      // Mark onboarding complete
      await authApi.saveOnboarding({
        language: step1Data.language,
        fullName: step1Data.fullName || undefined,
        phone: step1Data.phone || undefined,
        agency: step1Data.agency,
        licenseNumber: step1Data.licenseNumber,
      })
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      setScene('success')
    },
  })

  const canCreate = clientId !== null

  const inputClass = "w-full px-3.5 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"

  // Success screen
  if (scene === 'success') {
    return (
      <div className="animate-in fade-in zoom-in-95 duration-300 text-center">
        <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-success" />
        </div>
        <h1 className="text-2xl font-bold mb-2">{t('onboarding.step3.successTitle')}</h1>
        <p className="text-muted-foreground mb-6">{t('onboarding.step3.successSubtitle')}</p>

        <div className="bg-muted rounded-xl p-4 mb-8 text-left">
          <h3 className="font-medium mb-3">{t('onboarding.step3.successNext')}</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {(t('onboarding.step3.successNextItems', { returnObjects: true }) as string[]).map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <Check className="w-4 h-4 text-success mt-0.5 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <Button onClick={() => navigate('/')} className="w-full">
          {t('onboarding.step3.goToDashboard')}
        </Button>
      </div>
    )
  }

  // Transaction creation form
  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold mb-2">{t('onboarding.step3.title')}</h1>
        <p className="text-muted-foreground">{t('onboarding.step3.subtitle')}</p>
      </div>

      <div className="space-y-5">
        {/* Transaction type toggle */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setTxType('purchase')}
            className={[
              'p-3 rounded-xl border-2 text-center transition-all',
              txType === 'purchase'
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50',
            ].join(' ')}
          >
            <span className="font-medium text-sm">{t('onboarding.step3.typePurchase')}</span>
          </button>
          <button
            type="button"
            onClick={() => setTxType('sale')}
            className={[
              'p-3 rounded-xl border-2 text-center transition-all',
              txType === 'sale'
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50',
            ].join(' ')}
          >
            <span className="font-medium text-sm">{t('onboarding.step3.typeSale')}</span>
          </button>
        </div>

        {/* Client selector */}
        <div className="relative">
          <label className="block text-sm font-medium text-foreground mb-1">
            {t('onboarding.step3.client')} <span className="text-destructive">*</span>
          </label>
          {selectedClient ? (
            <div className="flex items-center justify-between p-3 rounded-lg border border-primary bg-primary/5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-xs font-medium text-primary">
                  {selectedClient.firstName[0]}
                </div>
                <span className="font-medium text-sm">
                  {selectedClient.firstName} {selectedClient.lastName}
                </span>
              </div>
              <button
                type="button"
                onClick={() => { setClientId(null); setClientSearch('') }}
                className="text-muted-foreground hover:text-foreground text-sm"
              >
                {t('onboarding.back')}
              </button>
            </div>
          ) : (
            <>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={clientSearch}
                  onChange={(e) => { setClientSearch(e.target.value); setShowClientDropdown(true) }}
                  onFocus={() => setShowClientDropdown(true)}
                  className={`${inputClass} pl-10`}
                  placeholder={t('onboarding.step3.clientPlaceholder')}
                />
              </div>
              {showClientDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-background border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {filteredClients.length === 0 ? (
                    <div className="px-3 py-4 text-sm text-muted-foreground text-center">
                      {t('onboarding.step3.clientEmpty')}
                    </div>
                  ) : (
                    filteredClients.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setClientId(c.id)
                          setClientSearch(`${c.firstName} ${c.lastName}`)
                          setShowClientDropdown(false)
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-muted/50 flex items-center gap-3 transition-colors"
                      >
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-xs font-medium text-primary">
                          {c.firstName[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{c.firstName} {c.lastName}</p>
                          <p className="text-xs text-muted-foreground truncate">{c.email || c.phone || '—'}</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Property address */}
        <div>
          <label htmlFor="ob-address" className="block text-sm font-medium text-foreground mb-1">
            {t('onboarding.step3.propertyAddress')}
          </label>
          <input
            id="ob-address"
            type="text"
            value={propertyAddress}
            onChange={(e) => setPropertyAddress(e.target.value)}
            className={inputClass}
            placeholder={t('onboarding.step3.propertyAddressPlaceholder')}
          />
        </div>

        {/* Property type pills */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            {t('onboarding.step3.propertyType')}
          </label>
          <div className="flex gap-2">
            {([
              { type: 'house' as PropertyType, icon: Home, label: t('onboarding.step3.propertyTypeHouse') },
              { type: 'condo' as PropertyType, icon: Building2, label: t('onboarding.step3.propertyTypeCondo') },
              { type: 'land' as PropertyType, icon: Map, label: t('onboarding.step3.propertyTypeLand') },
            ]).map(({ type, icon: Icon, label }) => (
              <button
                key={type}
                type="button"
                onClick={() => setPropertyType(type)}
                className={[
                  'flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg border-2 text-sm font-medium transition-all',
                  propertyType === type
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border text-muted-foreground hover:border-primary/50',
                ].join(' ')}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Price */}
        <div>
          <label htmlFor="ob-price" className="block text-sm font-medium text-foreground mb-1">
            {t('onboarding.step3.price')}
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
            <input
              id="ob-price"
              type="text"
              inputMode="numeric"
              value={price}
              onChange={(e) => setPrice(e.target.value.replace(/[^0-9\s]/g, ''))}
              className={`${inputClass} pl-8`}
              placeholder={t('onboarding.step3.pricePlaceholder')}
            />
          </div>
        </div>

        {/* Create button */}
        <Button
          onClick={() => createTxMutation.mutate()}
          disabled={!canCreate || createTxMutation.isPending}
          className="w-full"
        >
          {createTxMutation.isPending ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> {t('onboarding.step3.creating')}</>
          ) : (
            t('onboarding.step3.createButton')
          )}
        </Button>

        {createTxMutation.isError && (
          <p className="text-sm text-destructive text-center">
            {(createTxMutation.error as Error)?.message || 'Error creating transaction'}
          </p>
        )}
      </div>
    </div>
  )
}
