import { useState, useEffect } from 'react'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  transactionsApi,
  type CreateTransactionRequest,
  type TransactionType,
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
    mutationFn: transactionsApi.create,
    onSuccess: (response) => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: ['transactions'] })
        queryClient.invalidateQueries({ queryKey: ['dashboard'] })
        toast({
          title: t('common.success'),
          description: t('transaction.new'),
          variant: 'success',
        })
        handleClose()
      } else {
        toast({
          title: t('common.error'),
          description: response.error?.message || 'Failed to create',
          variant: 'destructive',
        })
      }
    },
    onError: () => {
      toast({
        title: t('common.error'),
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
          Template *
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
              {tmpl.isDefault ? ' (Default)' : ''}
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
          createMutation.isPending || !formData.clientId || !selectedTemplateId
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
