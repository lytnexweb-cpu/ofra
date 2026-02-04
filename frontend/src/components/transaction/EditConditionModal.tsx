import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Calendar, Loader2 } from 'lucide-react'
import { conditionsApi, type Condition } from '../../api/conditions.api'
import { toast } from '../../hooks/use-toast'
import { Button } from '../ui/Button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/Dialog'

interface EditConditionModalProps {
  condition: Condition | null
  transactionId: number
  isOpen: boolean
  onClose: () => void
}

export default function EditConditionModal({
  condition,
  transactionId,
  isOpen,
  onClose,
}: EditConditionModalProps) {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()

  // Form state
  const [dueDate, setDueDate] = useState('')
  const [description, setDescription] = useState('')

  // Reset form when condition changes
  useEffect(() => {
    if (condition) {
      // Format date for input (YYYY-MM-DD)
      const dateValue = condition.dueDate
        ? new Date(condition.dueDate).toISOString().split('T')[0]
        : ''
      setDueDate(dateValue)
      setDescription(condition.description ?? '')
    }
  }, [condition])

  const handleClose = () => {
    onClose()
  }

  const updateMutation = useMutation({
    mutationFn: () => {
      if (!condition) throw new Error('No condition')
      return conditionsApi.update(condition.id, {
        dueDate: dueDate || undefined,
        description: description || undefined,
      })
    },
    onSuccess: (response) => {
      if (response.success) {
        toast({
          title: t('common.success'),
          description: t('conditions.updateSuccess'),
          variant: 'success',
        })
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: ['transaction', transactionId] })
        queryClient.invalidateQueries({ queryKey: ['transactions'] })
        queryClient.invalidateQueries({ queryKey: ['advance-check', transactionId] })
        handleClose()
      }
    },
    onError: (error: any) => {
      const errorCode = error?.response?.data?.error?.code
      if (errorCode === 'E_CONDITION_ARCHIVED') {
        toast({
          title: t('common.error'),
          description: t('conditions.archivedError'),
          variant: 'destructive',
        })
      } else {
        toast({
          title: t('common.error'),
          description: t('conditions.updateError'),
          variant: 'destructive',
        })
      }
    },
  })

  if (!condition) return null

  // Get display label based on locale
  const conditionLabel =
    i18n.language.startsWith('fr') && condition.labelFr
      ? condition.labelFr
      : condition.labelEn ?? condition.title

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            {t('conditions.editModal.title')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Title (readonly) */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">
              {t('conditions.form.titleLabel')}
            </label>
            <div className="px-3 py-2 text-sm bg-muted rounded-md border">
              {conditionLabel}
            </div>
          </div>

          {/* Due Date */}
          <div className="space-y-1.5">
            <label htmlFor="edit-dueDate" className="text-sm font-medium">
              {t('conditions.form.dueDate')}
            </label>
            <input
              id="edit-dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background"
            />
          </div>

          {/* Description/Note */}
          <div className="space-y-1.5">
            <label htmlFor="edit-description" className="text-sm font-medium">
              {t('conditions.form.description')}
            </label>
            <textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('conditions.editModal.notePlaceholder')}
              className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background resize-none"
              rows={4}
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground text-right">
              {description.length}/1000
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={updateMutation.isPending}
          >
            {t('common.cancel')}
          </Button>
          <Button
            onClick={() => updateMutation.mutate()}
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t('common.loading')}
              </>
            ) : (
              t('common.save')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
