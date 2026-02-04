import { useState, useEffect } from 'react'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Home, Building2, Mountain, Trees, Building, Package, Wrench } from 'lucide-react'
import {
  transactionsApi,
  type CreateTransactionRequest,
  type CreateProfileRequest,
  type TransactionType,
  type PropertyType,
  type PropertyContext,
  type AccessType,
} from '../api/transactions.api'
import { clientsApi } from '../api/clients.api'
import {
  workflowTemplatesApi,
  type WorkflowTemplate,
} from '../api/workflow-templates.api'
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

  const [formData, setFormData] = useState({
    clientId: 0,
    type: 'purchase' as TransactionType,
    salePrice: '',
    notesText: '',
  })
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(
    null
  )

  // Profile fields (D1: Conditions Engine Premium)
  const [profileData, setProfileData] = useState({
    propertyType: '' as PropertyType | '',
    propertyContext: '' as PropertyContext | '',
    isFinanced: null as boolean | null,
    // Rural-specific
    hasWell: null as boolean | null,
    hasSeptic: null as boolean | null,
    accessType: '' as AccessType | '',
    // Financed-specific
    appraisalRequired: false,
  })

  // D39: Pack conditions optionnel
  const [loadConditionPack, setLoadConditionPack] = useState(true) // Default: load pack

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
      // Step 1: Create transaction
      const txResponse = await transactionsApi.create(payload)
      if (!txResponse.success || !txResponse.data?.transaction) {
        throw new Error(txResponse.error?.message || 'Failed to create transaction')
      }

      const transactionId = txResponse.data.transaction.id

      // Step 2: Create profile (if profile data is provided)
      if (profileData.propertyType && profileData.propertyContext && profileData.isFinanced !== null) {
        const profilePayload: CreateProfileRequest = {
          propertyType: profileData.propertyType as PropertyType,
          propertyContext: profileData.propertyContext as PropertyContext,
          isFinanced: profileData.isFinanced,
        }

        // Add rural fields if applicable
        if (profileData.propertyContext === 'rural') {
          if (profileData.hasWell !== null) profilePayload.hasWell = profileData.hasWell
          if (profileData.hasSeptic !== null) profilePayload.hasSeptic = profileData.hasSeptic
          if (profileData.accessType) profilePayload.accessType = profileData.accessType as AccessType
        }

        // Add financed fields if applicable
        if (profileData.isFinanced) {
          profilePayload.appraisalRequired = profileData.appraisalRequired
        }

        try {
          await transactionsApi.upsertProfile(transactionId, profilePayload)

          // D39: Load condition pack if user opted in
          if (loadConditionPack) {
            try {
              await transactionsApi.loadConditionPack(transactionId)
            } catch (packError) {
              console.error('D39: Pack loading failed:', packError)
              // Non-blocking - transaction and profile exist
            }
          }
        } catch (profileError) {
          // Profile creation failed, but transaction exists
          console.error('Profile creation failed:', profileError)
          // We don't throw here - transaction is created, profile can be added later
        }
      }

      return txResponse
    },
    onSuccess: (response) => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: ['transactions'] })
        queryClient.invalidateQueries({ queryKey: ['dashboard'] })
        toast({
          title: t('common.success'),
          description: t('transaction.new'),
          variant: 'success',
        })
        // Close directly without checking isPending (race condition fix)
        resetForm()
        onClose()
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
      type: 'purchase',
      salePrice: '',
      notesText: '',
    })
    setSelectedTemplateId(null)
    setProfileData({
      propertyType: '',
      propertyContext: '',
      isFinanced: null,
      hasWell: null,
      hasSeptic: null,
      accessType: '',
      appraisalRequired: false,
    })
    setLoadConditionPack(true) // D39: Reset to default
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
    if (formData.notesText?.trim()) payload.notesText = formData.notesText.trim()

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

      {/* Template */}
      <div>
        <label
          htmlFor="templateId"
          className="block text-sm font-medium text-foreground mb-1"
        >
          {t('transaction.template')} *
        </label>
        <select
          id="templateId"
          value={selectedTemplateId || ''}
          onChange={(e) =>
            setSelectedTemplateId(
              e.target.value ? parseInt(e.target.value) : null
            )
          }
          className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          data-testid="template-select"
        >
          <option value="">{t('common.search')}...</option>
          {templates.map((tmpl: WorkflowTemplate) => (
            <option key={tmpl.id} value={tmpl.id}>
              {tmpl.name}
              {tmpl.isDefault ? ` (${t('common.default')})` : ''}
            </option>
          ))}
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

      {/* Profile Section */}
      <div className="border-t border-border pt-4 mt-4">
        <p className="text-sm font-medium text-foreground mb-1">
          {t('transaction.profile.title', 'Profil de la propriété')} *
        </p>
        <p className="text-xs text-muted-foreground mb-3">
          {t('transaction.profile.hint', 'Ce profil permet des suggestions de conditions adaptées.')}
        </p>

        {/* Property Type */}
        <div className="mb-3">
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">
            {t('transaction.profile.propertyType', 'Type de propriété')} *
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'house', label: t('transaction.profile.house', 'Maison'), icon: Home },
              { value: 'condo', label: t('transaction.profile.condo', 'Condo'), icon: Building2 },
              { value: 'land', label: t('transaction.profile.land', 'Terrain'), icon: Mountain },
            ].map((option) => {
              const Icon = option.icon
              const isSelected = profileData.propertyType === option.value
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setProfileData({ ...profileData, propertyType: option.value as PropertyType })}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-input hover:border-primary/50'
                  }`}
                  data-testid={`property-type-${option.value}`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-xs font-medium">{option.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Property Context */}
        <div className="mb-3">
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">
            {t('transaction.profile.propertyContext', 'Contexte')} *
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'urban', label: t('transaction.profile.urban', 'Urbain'), icon: Building },
              { value: 'suburban', label: t('transaction.profile.suburban', 'Banlieue'), icon: Home },
              { value: 'rural', label: t('transaction.profile.rural', 'Rural'), icon: Trees },
            ].map((option) => {
              const Icon = option.icon
              const isSelected = profileData.propertyContext === option.value
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setProfileData({
                    ...profileData,
                    propertyContext: option.value as PropertyContext,
                    // Reset rural fields if not rural
                    ...(option.value !== 'rural' ? { hasWell: null, hasSeptic: null, accessType: '' } : {})
                  })}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-input hover:border-primary/50'
                  }`}
                  data-testid={`property-context-${option.value}`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-xs font-medium">{option.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Is Financed */}
        <div className="mb-3">
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">
            {t('transaction.profile.isFinanced', 'Financement')} *
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: true, label: t('transaction.profile.financed', 'Financé') },
              { value: false, label: t('transaction.profile.cash', 'Comptant') },
            ].map((option) => {
              const isSelected = profileData.isFinanced === option.value
              return (
                <button
                  key={String(option.value)}
                  type="button"
                  onClick={() => setProfileData({
                    ...profileData,
                    isFinanced: option.value,
                    // Reset appraisalRequired if not financed
                    ...(option.value === false ? { appraisalRequired: false } : {})
                  })}
                  className={`py-2 px-3 rounded-lg border-2 text-sm font-medium transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-input hover:border-primary/50'
                  }`}
                  data-testid={`is-financed-${option.value}`}
                >
                  {option.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Rural-specific fields (progressive disclosure) */}
        {profileData.propertyContext === 'rural' && (
          <div className="mt-3 p-3 bg-muted/50 rounded-lg space-y-3">
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Trees className="w-3 h-3" />
              {t('transaction.profile.ruralDetails', 'Détails ruraux')}
              <span className="text-primary text-[10px]">({t('common.recommended', 'Recommandé')})</span>
            </p>

            {/* Has Well */}
            <div className="flex items-center justify-between">
              <span className="text-sm">{t('transaction.profile.hasWell', 'Puits')}</span>
              <div className="flex gap-1">
                {[
                  { value: true, label: t('common.yes', 'Oui') },
                  { value: false, label: t('common.no', 'Non') },
                ].map((option) => (
                  <button
                    key={String(option.value)}
                    type="button"
                    onClick={() => setProfileData({ ...profileData, hasWell: option.value })}
                    className={`px-3 py-1 text-xs rounded border transition-all ${
                      profileData.hasWell === option.value
                        ? 'border-primary bg-primary text-white'
                        : 'border-input hover:border-primary/50'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Has Septic */}
            <div className="flex items-center justify-between">
              <span className="text-sm">{t('transaction.profile.hasSeptic', 'Fosse septique')}</span>
              <div className="flex gap-1">
                {[
                  { value: true, label: t('common.yes', 'Oui') },
                  { value: false, label: t('common.no', 'Non') },
                ].map((option) => (
                  <button
                    key={String(option.value)}
                    type="button"
                    onClick={() => setProfileData({ ...profileData, hasSeptic: option.value })}
                    className={`px-3 py-1 text-xs rounded border transition-all ${
                      profileData.hasSeptic === option.value
                        ? 'border-primary bg-primary text-white'
                        : 'border-input hover:border-primary/50'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Access Type */}
            <div>
              <span className="text-sm block mb-1.5">{t('transaction.profile.accessType', 'Type d\'accès')}</span>
              <div className="grid grid-cols-3 gap-1">
                {[
                  { value: 'public', label: t('transaction.profile.accessPublic', 'Public') },
                  { value: 'private', label: t('transaction.profile.accessPrivate', 'Privé') },
                  { value: 'right_of_way', label: t('transaction.profile.accessRightOfWay', 'Servitude') },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setProfileData({ ...profileData, accessType: option.value as AccessType })}
                    className={`px-2 py-1.5 text-xs rounded border transition-all ${
                      profileData.accessType === option.value
                        ? 'border-primary bg-primary text-white'
                        : 'border-input hover:border-primary/50'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Financed-specific fields (progressive disclosure) */}
        {profileData.isFinanced && (
          <div className="mt-3 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm">{t('transaction.profile.appraisalRequired', 'Évaluation requise')}</span>
              <div className="flex gap-1">
                {[
                  { value: true, label: t('common.yes', 'Oui') },
                  { value: false, label: t('common.no', 'Non') },
                ].map((option) => (
                  <button
                    key={String(option.value)}
                    type="button"
                    onClick={() => setProfileData({ ...profileData, appraisalRequired: option.value })}
                    className={`px-3 py-1 text-xs rounded border transition-all ${
                      profileData.appraisalRequired === option.value
                        ? 'border-primary bg-primary text-white'
                        : 'border-input hover:border-primary/50'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* D39: Condition Pack Option */}
      {profileData.propertyType && profileData.propertyContext && profileData.isFinanced !== null && (
        <div className="border-t border-border pt-4 mt-4">
          <p className="text-sm font-medium text-foreground mb-1">
            {t('transaction.conditionPack.title', 'Conditions de départ')}
          </p>
          <p className="text-xs text-muted-foreground mb-3">
            {t('transaction.conditionPack.hint', 'Choisissez comment initialiser les conditions de la transaction.')}
          </p>

          <div className="grid grid-cols-1 gap-2">
            {[
              {
                value: true,
                label: t('transaction.conditionPack.loadPack', 'Charger le pack recommandé'),
                description: t('transaction.conditionPack.loadPackDesc', 'Conditions pré-configurées selon le profil'),
                icon: Package,
              },
              {
                value: false,
                label: t('transaction.conditionPack.manual', 'Je gère moi-même'),
                description: t('transaction.conditionPack.manualDesc', 'Transaction vide, ajout manuel'),
                icon: Wrench,
              },
            ].map((option) => {
              const Icon = option.icon
              const isSelected = loadConditionPack === option.value
              return (
                <button
                  key={String(option.value)}
                  type="button"
                  onClick={() => setLoadConditionPack(option.value)}
                  className={`flex items-start gap-3 p-3 rounded-lg border-2 text-left transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-input hover:border-primary/50'
                  }`}
                  data-testid={`condition-pack-${option.value}`}
                >
                  <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    isSelected ? 'border-primary bg-primary' : 'border-muted-foreground/50'
                  }`}>
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span className={`text-sm font-medium ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                        {option.label}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{option.description}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}
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
        disabled={
          createMutation.isPending ||
          !formData.clientId ||
          !selectedTemplateId ||
          !profileData.propertyType ||
          !profileData.propertyContext ||
          profileData.isFinanced === null
        }
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
