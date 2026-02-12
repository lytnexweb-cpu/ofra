import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { transactionsApi, type Transaction, type UpdateTransactionRequest } from '../../api/transactions.api'
import { toast } from '../../hooks/use-toast'
import { Button } from '../ui/Button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '../ui/Dialog'

interface EditTransactionModalProps {
  isOpen: boolean
  onClose: () => void
  transaction: Transaction
}

export default function EditTransactionModal({ isOpen, onClose, transaction }: EditTransactionModalProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const [formData, setFormData] = useState({
    type: transaction.type,
    salePrice: transaction.salePrice?.toString() ?? '',
    listPrice: transaction.listPrice?.toString() ?? '',
    commission: transaction.commission?.toString() ?? '',
    closingDate: transaction.closingDate?.split('T')[0] ?? '',
    offerExpiryDate: transaction.offerExpiryDate?.split('T')[0] ?? '',
    inspectionDeadline: transaction.inspectionDeadline?.split('T')[0] ?? '',
    financingDeadline: transaction.financingDeadline?.split('T')[0] ?? '',
    address: transaction.property?.address ?? '',
    city: transaction.property?.city ?? '',
    postalCode: transaction.property?.postalCode ?? '',
    province: transaction.property?.province ?? '',
    tags: (transaction.tags ?? []).join(', '),
    language: transaction.language ?? 'fr',
    folderUrl: transaction.folderUrl ?? '',
  })

  useEffect(() => {
    if (isOpen) {
      setFormData({
        type: transaction.type,
        salePrice: transaction.salePrice?.toString() ?? '',
        listPrice: transaction.listPrice?.toString() ?? '',
        commission: transaction.commission?.toString() ?? '',
        closingDate: transaction.closingDate?.split('T')[0] ?? '',
        offerExpiryDate: transaction.offerExpiryDate?.split('T')[0] ?? '',
        inspectionDeadline: transaction.inspectionDeadline?.split('T')[0] ?? '',
        financingDeadline: transaction.financingDeadline?.split('T')[0] ?? '',
        address: transaction.property?.address ?? '',
        city: transaction.property?.city ?? '',
        postalCode: transaction.property?.postalCode ?? '',
        province: transaction.property?.province ?? '',
            tags: (transaction.tags ?? []).join(', '),
        language: transaction.language ?? 'fr',
        folderUrl: transaction.folderUrl ?? '',
      })
    }
  }, [isOpen, transaction])

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const mutation = useMutation({
    mutationFn: (data: UpdateTransactionRequest) =>
      transactionsApi.update(transaction.id, data),
    onSuccess: (response) => {
      if (response.success) {
        toast({
          title: t('common.success'),
          description: t('transaction.editModal.success'),
          variant: 'success',
        })
        queryClient.invalidateQueries({ queryKey: ['transaction', transaction.id] })
        queryClient.invalidateQueries({ queryKey: ['transactions'] })
        onClose()
      }
    },
    onError: () => {
      toast({ title: t('common.error'), variant: 'destructive' })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const tags = formData.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)

    mutation.mutate({
      type: formData.type,
      salePrice: formData.salePrice ? parseFloat(formData.salePrice) : undefined,
      listPrice: formData.listPrice ? parseFloat(formData.listPrice) : undefined,
      commission: formData.commission ? parseFloat(formData.commission) : undefined,
      closingDate: formData.closingDate || null,
      offerExpiryDate: formData.offerExpiryDate || null,
      inspectionDeadline: formData.inspectionDeadline || null,
      financingDeadline: formData.financingDeadline || null,
      address: formData.address || undefined,
      city: formData.city || undefined,
      postalCode: formData.postalCode || undefined,
      province: formData.province || undefined,
      tags: tags.length > 0 ? tags : undefined,
      language: formData.language || undefined,
      folderUrl: formData.folderUrl || undefined,
    })
  }

  const inputClass =
    'w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background'

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('transaction.editModal.title')}</DialogTitle>
          <DialogDescription>{t('transaction.editModal.description')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-2">
          {/* General Info */}
          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-foreground">
              {t('transaction.editModal.generalInfo')}
            </legend>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">{t('transaction.type')}</label>
                <select
                  value={formData.type}
                  onChange={(e) => updateField('type', e.target.value)}
                  className={inputClass}
                >
                  <option value="purchase">{t('transaction.purchase')}</option>
                  <option value="sale">{t('transaction.sale')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('transaction.editModal.language')}
                </label>
                <select
                  value={formData.language}
                  onChange={(e) => updateField('language', e.target.value)}
                  className={inputClass}
                >
                  <option value="fr">{t('settings.language.french')}</option>
                  <option value="en">{t('settings.language.english')}</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('transaction.editModal.salePrice')}
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.salePrice}
                  onChange={(e) => updateField('salePrice', e.target.value)}
                  className={inputClass}
                  placeholder="425000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('transaction.editModal.listPrice')}
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.listPrice}
                  onChange={(e) => updateField('listPrice', e.target.value)}
                  className={inputClass}
                  placeholder="450000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('transaction.editModal.commission')}
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.commission}
                  onChange={(e) => updateField('commission', e.target.value)}
                  className={inputClass}
                  placeholder="2.5"
                />
              </div>
            </div>
          </fieldset>

          {/* Key Dates */}
          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-foreground">
              {t('transaction.editModal.keyDates')}
            </legend>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('transaction.closingDate')}
                </label>
                <input
                  type="date"
                  value={formData.closingDate}
                  onChange={(e) => updateField('closingDate', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('transaction.editModal.offerExpiry')}
                </label>
                <input
                  type="date"
                  value={formData.offerExpiryDate}
                  onChange={(e) => updateField('offerExpiryDate', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('transaction.editModal.inspectionDeadline')}
                </label>
                <input
                  type="date"
                  value={formData.inspectionDeadline}
                  onChange={(e) => updateField('inspectionDeadline', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('transaction.editModal.financingDeadline')}
                </label>
                <input
                  type="date"
                  value={formData.financingDeadline}
                  onChange={(e) => updateField('financingDeadline', e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          </fieldset>

          {/* Property */}
          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-foreground">
              {t('transaction.editModal.property')}
            </legend>
            <div>
              <label className="block text-sm font-medium mb-1">{t('transaction.address')}</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => updateField('address', e.target.value)}
                className={inputClass}
                placeholder={t('transaction.addressPlaceholder')}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('transaction.editModal.city')}
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => updateField('city', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('transaction.editModal.postalCode')}
                </label>
                <input
                  type="text"
                  value={formData.postalCode}
                  onChange={(e) => updateField('postalCode', e.target.value)}
                  className={inputClass}
                  placeholder="E1A 2B3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('transaction.editModal.province')}
                </label>
                <input
                  type="text"
                  value={formData.province}
                  onChange={(e) => updateField('province', e.target.value)}
                  className={inputClass}
                  placeholder="NB"
                />
              </div>
            </div>
          </fieldset>

          {/* Tags & Folder */}
          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-foreground">
              {t('transaction.editModal.other')}
            </legend>
            <div>
              <label className="block text-sm font-medium mb-1">
                {t('transaction.editModal.tags')}
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => updateField('tags', e.target.value)}
                className={inputClass}
                placeholder={t('transaction.editModal.tagsPlaceholder')}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {t('transaction.editModal.tagsHint')}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                {t('transaction.editModal.folderUrl')}
              </label>
              <input
                type="url"
                value={formData.folderUrl}
                onChange={(e) => updateField('folderUrl', e.target.value)}
                className={inputClass}
                placeholder="https://..."
              />
            </div>
          </fieldset>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={mutation.isPending}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? t('common.loading') : t('common.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
