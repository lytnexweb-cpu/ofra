import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  FileText,
  ExternalLink,
  Plus,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Trash2,
  Upload,
  Shield,
} from 'lucide-react'
import {
  documentsApi,
  type TransactionDocument,
  type DocumentCategory,
  type DocumentStatus,
  type CreateDocumentRequest,
} from '../../api/documents.api'
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

interface DocumentsSectionProps {
  transactionId: number
}

const CATEGORIES: DocumentCategory[] = ['offer', 'inspection', 'financing', 'identity', 'legal', 'other']

const statusConfig: Record<DocumentStatus, { icon: typeof FileText; color: string; bg: string }> = {
  missing: { icon: AlertCircle, color: 'text-stone-400', bg: 'bg-stone-100' },
  uploaded: { icon: Upload, color: 'text-blue-600', bg: 'bg-blue-50' },
  validated: { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
  rejected: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
}

export default function DocumentsSection({ transactionId }: DocumentsSectionProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const [addModalOpen, setAddModalOpen] = useState(false)
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [rejectingDocId, setRejectingDocId] = useState<number | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [newDoc, setNewDoc] = useState<CreateDocumentRequest>({
    name: '',
    category: 'other',
    fileUrl: '',
    conditionId: null,
  })

  const { data, isLoading } = useQuery({
    queryKey: ['documents', transactionId],
    queryFn: () => documentsApi.list(transactionId),
  })

  const documents = data?.data?.documents ?? []

  // Group by category
  const grouped = CATEGORIES.reduce(
    (acc, cat) => {
      const docs = documents.filter((d) => d.category === cat)
      if (docs.length > 0) acc[cat] = docs
      return acc
    },
    {} as Record<string, TransactionDocument[]>
  )

  const createMutation = useMutation({
    mutationFn: (data: CreateDocumentRequest) => documentsApi.create(transactionId, data),
    onSuccess: (response) => {
      if (response.success) {
        toast({ title: t('common.success'), description: t('documents.addSuccess'), variant: 'success' })
        queryClient.invalidateQueries({ queryKey: ['documents', transactionId] })
        setAddModalOpen(false)
        setNewDoc({ name: '', category: 'other', fileUrl: '', conditionId: null })
      }
    },
    onError: () => {
      toast({ title: t('common.error'), variant: 'destructive' })
    },
  })

  const validateMutation = useMutation({
    mutationFn: (id: number) => documentsApi.validate(id),
    onSuccess: () => {
      toast({ title: t('documents.validated'), variant: 'success' })
      queryClient.invalidateQueries({ queryKey: ['documents', transactionId] })
    },
    onError: () => {
      toast({ title: t('common.error'), variant: 'destructive' })
    },
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => documentsApi.reject(id, reason),
    onSuccess: () => {
      toast({ title: t('documents.rejected'), variant: 'success' })
      queryClient.invalidateQueries({ queryKey: ['documents', transactionId] })
      setRejectModalOpen(false)
      setRejectingDocId(null)
      setRejectReason('')
    },
    onError: () => {
      toast({ title: t('common.error'), variant: 'destructive' })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => documentsApi.delete(id),
    onSuccess: () => {
      toast({ title: t('documents.deleted'), variant: 'success' })
      queryClient.invalidateQueries({ queryKey: ['documents', transactionId] })
    },
    onError: () => {
      toast({ title: t('common.error'), variant: 'destructive' })
    },
  })

  const handleReject = (docId: number) => {
    setRejectingDocId(docId)
    setRejectReason('')
    setRejectModalOpen(true)
  }

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newDoc.name.trim()) return
    createMutation.mutate({
      ...newDoc,
      fileUrl: newDoc.fileUrl || undefined,
      conditionId: newDoc.conditionId || null,
    })
  }

  const inputClass =
    'w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background'

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <FileText className="w-4 h-4" />
          {t('documents.title')} ({documents.length})
        </h3>
        <Button variant="outline" size="sm" onClick={() => setAddModalOpen(true)} className="gap-1.5">
          <Plus className="w-3.5 h-3.5" />
          {t('documents.add')}
        </Button>
      </div>

      {/* Empty state */}
      {documents.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">{t('documents.empty')}</p>
        </div>
      )}

      {/* Grouped documents */}
      {Object.entries(grouped).map(([category, docs]) => (
        <div key={category} className="space-y-2">
          <h4 className="text-xs font-medium uppercase text-muted-foreground tracking-wider">
            {t(`documents.categories.${category}`)}
          </h4>
          <div className="space-y-1.5">
            {docs.map((doc) => {
              const config = statusConfig[doc.status]
              const StatusIcon = config.icon
              return (
                <div
                  key={doc.id}
                  className="flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-accent/50 transition-colors"
                >
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${config.bg}`}>
                    <StatusIcon className={`w-4 h-4 ${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{doc.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-xs font-medium ${config.color}`}>
                        {t(`documents.status.${doc.status}`)}
                      </span>
                      {doc.rejectionReason && (
                        <span className="text-xs text-red-500 truncate">
                          — {doc.rejectionReason}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {doc.fileUrl && (
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {doc.status === 'uploaded' && (
                      <>
                        <button
                          onClick={() => validateMutation.mutate(doc.id)}
                          className="p-1.5 rounded-md hover:bg-green-50 text-green-600"
                          title={t('documents.validate')}
                        >
                          <Shield className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleReject(doc.id)}
                          className="p-1.5 rounded-md hover:bg-red-50 text-red-500"
                          title={t('documents.reject')}
                        >
                          <XCircle className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => deleteMutation.mutate(doc.id)}
                      className="p-1.5 rounded-md hover:bg-red-50 text-muted-foreground hover:text-red-500"
                      title={t('common.delete')}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {/* Add Document Modal */}
      <Dialog open={addModalOpen} onOpenChange={(open) => !open && setAddModalOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('documents.addModal.title')}</DialogTitle>
            <DialogDescription>{t('documents.addModal.description')}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddSubmit} className="space-y-4 py-2">
            <div>
              <label className="block text-sm font-medium mb-1">{t('documents.addModal.name')}</label>
              <input
                type="text"
                required
                value={newDoc.name}
                onChange={(e) => setNewDoc({ ...newDoc, name: e.target.value })}
                className={inputClass}
                placeholder={t('documents.addModal.namePlaceholder')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('documents.addModal.category')}</label>
              <select
                value={newDoc.category}
                onChange={(e) => setNewDoc({ ...newDoc, category: e.target.value as DocumentCategory })}
                className={inputClass}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {t(`documents.categories.${cat}`)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('documents.addModal.fileUrl')}</label>
              <input
                type="url"
                value={newDoc.fileUrl}
                onChange={(e) => setNewDoc({ ...newDoc, fileUrl: e.target.value })}
                className={inputClass}
                placeholder="https://..."
              />
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setAddModalOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={createMutation.isPending || !newDoc.name.trim()}>
                {createMutation.isPending ? t('common.loading') : t('common.add')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={rejectModalOpen} onOpenChange={(open) => !open && setRejectModalOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">{t('documents.rejectModal.title')}</DialogTitle>
            <DialogDescription>{t('documents.rejectModal.description')}</DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <label className="block text-sm font-medium mb-1">
              {t('documents.rejectModal.reason')} <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className={`${inputClass} min-h-[80px] resize-none`}
              placeholder={t('documents.rejectModal.reasonPlaceholder')}
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setRejectModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={() => rejectingDocId && rejectMutation.mutate({ id: rejectingDocId, reason: rejectReason })}
              disabled={!rejectReason.trim() || rejectMutation.isPending}
            >
              {rejectMutation.isPending ? t('common.loading') : t('documents.reject')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
