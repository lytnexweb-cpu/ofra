import { useState, useEffect, useMemo } from 'react'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import {
  transactionsApi,
  type CreateTransactionRequest,
  type CreateProfileRequest,
  type TransactionType,
  type PropertyType,
  type PropertyContext,
} from '../api/transactions.api'
import { clientsApi } from '../api/clients.api'
import {
  workflowTemplatesApi,
  type WorkflowTemplate,
} from '../api/workflow-templates.api'
import type { User } from '../api/auth.api'
import type { ApiResponse } from '../api/http'
import { toast } from '../hooks/use-toast'
import { useMediaQuery } from '../hooks/useMediaQuery'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/Dialog'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from './ui/Sheet'
import { Button } from './ui/Button'
import { Input } from './ui/Input'

interface CreateTransactionModalProps {
  isOpen: boolean
  onClose: () => void
}

function parsePrice(value: string): number | undefined {
  const cleaned = value.replace(/\s/g, '').replace(/,/g, '')
  const num = parseFloat(cleaned)
  return isNaN(num) ? undefined : num
}

export default function CreateTransactionModal({
  isOpen,
  onClose,
}: CreateTransactionModalProps) {
  const { t } = useTranslation()
  const isDesktop = useMediaQuery('(min-width: 640px)')
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  // Read user preferences from auth cache (D40: onboarding → workflow connection)
  const userDefaults = useMemo(() => {
    const cached = queryClient.getQueryData<ApiResponse<{ user: User }>>(['auth', 'me'])
    const user = cached?.data?.user
    const autoConditions = user?.preferAutoConditions ?? true

    // Map onboarding propertyContexts to transaction profile defaults
    let propertyType = '' as PropertyType | ''
    let propertyContext = '' as PropertyContext | ''
    const contexts = user?.propertyContexts ?? []
    if (contexts.length > 0) {
      const first = contexts[0]
      if (first === 'condo') propertyType = 'condo'
      else if (first === 'land') propertyType = 'land'
      else if (first === 'urban_suburban') propertyContext = 'urban'
      else if (first === 'rural') propertyContext = 'rural'
    }

    return { autoConditions, propertyType, propertyContext }
  }, [])

  const [formData, setFormData] = useState({
    clientId: 0,
    address: '',
    type: 'purchase' as TransactionType,
    salePrice: '',
    closingDate: '',
  })

  // E1: Suggestions toggle — default from onboarding preference (D40)
  const [suggestConditions, setSuggestConditions] = useState(userDefaults.autoConditions)

  // Auto-select default template (hidden from user in E1)
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null)

  const { data: clientsData } = useQuery({
    queryKey: ['clients'],
    queryFn: clientsApi.list,
  })

  const { data: templatesData } = useQuery({
    queryKey: ['workflow-templates', formData.type],
    queryFn: () => workflowTemplatesApi.list({ type: formData.type }),
    enabled: isOpen,
  })

  const clients = clientsData?.data?.clients || []
  const templates = templatesData?.data?.templates || []

  // Auto-select default template when templates load
  useEffect(() => {
    if (templates.length > 0) {
      const defaultTemplate = templates.find(
        (tmpl: WorkflowTemplate) => tmpl.isDefault
      )
      setSelectedTemplateId(
        defaultTemplate ? defaultTemplate.id : templates[0].id
      )
    } else {
      setSelectedTemplateId(null)
    }
  }, [templates])

  const createMutation = useMutation({
    mutationFn: async (payload: CreateTransactionRequest) => {
      // Step 1: Create transaction (backend auto-creates Property if address provided)
      const txResponse = await transactionsApi.create(payload)
      if (!txResponse.success || !txResponse.data?.transaction) {
        throw new Error(txResponse.error?.message || 'Failed to create transaction')
      }

      const transactionId = txResponse.data.transaction.id

      // Step 2: Auto-create profile from onboarding defaults (best-effort, non-blocking)
      if (userDefaults.propertyType && userDefaults.propertyContext) {
        const profilePayload: CreateProfileRequest = {
          propertyType: userDefaults.propertyType as PropertyType,
          propertyContext: userDefaults.propertyContext as PropertyContext,
          isFinanced: true, // Default — can be refined in suggestions panel
        }
        try {
          await transactionsApi.upsertProfile(transactionId, profilePayload)
        } catch {
          // Non-blocking — profile can be created later via suggestions panel
        }
      }

      return txResponse
    },
    onSuccess: (response) => {
      if (response.success && response.data?.transaction) {
        queryClient.invalidateQueries({ queryKey: ['transactions'] })
        queryClient.invalidateQueries({ queryKey: ['dashboard'] })
        toast({
          title: t('common.success'),
          description: t('transaction.new'),
          variant: 'success',
        })
        const txId = response.data.transaction.id
        resetForm()
        onClose()

        // E1: If suggestions toggle is on, navigate to transaction with suggestions panel open
        if (suggestConditions) {
          const params = new URLSearchParams({ suggestions: 'open' })
          if (formData.closingDate) {
            params.set('closingDate', formData.closingDate)
          }
          navigate(`/transactions/${txId}?${params.toString()}`)
        }
      } else {
        toast({
          title: t('common.error'),
          description: response.error?.message || 'Failed to create',
          variant: 'destructive',
        })
      }
    },
    onError: (error: Error) => {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const resetForm = () => {
    setFormData({
      clientId: 0,
      address: '',
      type: 'purchase',
      salePrice: '',
      closingDate: '',
    })
    setSelectedTemplateId(null)
    setSuggestConditions(userDefaults.autoConditions)
  }

  const handleClose = () => {
    if (!createMutation.isPending) {
      resetForm()
      onClose()
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.clientId || !selectedTemplateId) return

    const payload: CreateTransactionRequest = {
      clientId: formData.clientId,
      type: formData.type,
      workflowTemplateId: selectedTemplateId,
    }

    const price = parsePrice(formData.salePrice)
    if (price) payload.salePrice = price
    if (formData.address.trim()) payload.address = formData.address.trim()

    createMutation.mutate(payload)
  }

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-4" data-testid="create-form">
      {/* Client */}
      <div>
        <label
          htmlFor="clientId"
          className="block text-sm font-medium text-foreground mb-1"
        >
          {t('transaction.client')} *
        </label>
        <select
          id="clientId"
          required
          value={formData.clientId}
          onChange={(e) =>
            setFormData({ ...formData, clientId: parseInt(e.target.value) })
          }
          className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          data-testid="client-select"
        >
          <option value="0">{t('common.search')}...</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.firstName} {client.lastName}
            </option>
          ))}
        </select>
      </div>

      {/* Address (E1: auto-creates Property on backend) */}
      <div>
        <label
          htmlFor="address"
          className="block text-sm font-medium text-foreground mb-1"
        >
          {t('transaction.address', 'Adresse')}
        </label>
        <Input
          id="address"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          placeholder={t('transaction.addressPlaceholder', '123 rue Exemple, Montréal')}
          data-testid="address-input"
        />
      </div>

      {/* Type + Price row */}
      <div className="grid grid-cols-2 gap-3">
        {/* Type */}
        <div>
          <label
            htmlFor="type"
            className="block text-sm font-medium text-foreground mb-1"
          >
            {t('transaction.type')} *
          </label>
          <select
            id="type"
            required
            value={formData.type}
            onChange={(e) =>
              setFormData({ ...formData, type: e.target.value as TransactionType })
            }
            className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            data-testid="type-select"
          >
            <option value="purchase">{t('transaction.purchase')}</option>
            <option value="sale">{t('transaction.sale')}</option>
          </select>
        </div>

        {/* Price */}
        <div>
          <label
            htmlFor="salePrice"
            className="block text-sm font-medium text-foreground mb-1"
          >
            {t('transaction.price')}
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              $
            </span>
            <Input
              id="salePrice"
              value={formData.salePrice}
              onChange={(e) =>
                setFormData({ ...formData, salePrice: e.target.value })
              }
              className="pl-7"
              placeholder="350 000"
              inputMode="numeric"
              data-testid="price-input"
            />
          </div>
        </div>
      </div>

      {/* Closing Date */}
      <div>
        <label
          htmlFor="closingDate"
          className="block text-sm font-medium text-foreground mb-1"
        >
          {t('transaction.closingDate', 'Date de clôture prévue')}
        </label>
        <Input
          id="closingDate"
          type="date"
          value={formData.closingDate}
          onChange={(e) => setFormData({ ...formData, closingDate: e.target.value })}
          data-testid="closing-date-input"
        />
      </div>

      {/* E1: Suggestions toggle */}
      <div className="border-t border-border pt-4 mt-4">
        <label className="flex items-start gap-3 cursor-pointer" data-testid="suggestions-toggle">
          <input
            type="checkbox"
            checked={suggestConditions}
            onChange={(e) => setSuggestConditions(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-input accent-primary"
          />
          <div>
            <span className="text-sm font-medium text-foreground">
              {t('transaction.suggestConditions', 'Me proposer des suggestions de conditions')}
            </span>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t('transaction.suggestConditionsHint', 'Un panneau de suggestions s\'ouvrira après la création')}
            </p>
          </div>
        </label>
      </div>
    </form>
  )

  const footer = (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={handleClose}
        disabled={createMutation.isPending}
      >
        {t('common.cancel')}
      </Button>
      <Button
        onClick={handleSubmit as any}
        disabled={createMutation.isPending || !formData.clientId || !selectedTemplateId}
        data-testid="submit-create"
      >
        {createMutation.isPending ? t('common.loading') : t('common.create')}
      </Button>
    </>
  )

  if (isDesktop) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('transaction.new')}</DialogTitle>
          </DialogHeader>
          {formContent}
          <DialogFooter>{footer}</DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{t('transaction.new')}</SheetTitle>
        </SheetHeader>
        <div className="py-4">{formContent}</div>
        <SheetFooter className="flex-row gap-2">{footer}</SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
