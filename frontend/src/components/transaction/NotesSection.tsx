import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Trash2 } from 'lucide-react'
import { notesApi, type Note } from '../../api/notes.api'
import { authApi } from '../../api/auth.api'
import { toast } from '../../hooks/use-toast'
import { Button } from '../ui/Button'
import { formatDate } from '../../lib/date'
import ConfirmDialog from '../ConfirmDialog'

interface NotesSectionProps {
  transactionId: number
}

export default function NotesSection({ transactionId }: NotesSectionProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [newNote, setNewNote] = useState('')
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null)

  const notesKey = ['notes', transactionId]

  const { data: meData } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: authApi.me,
  })
  const currentUserId = meData?.data?.user?.id

  const { data } = useQuery({
    queryKey: notesKey,
    queryFn: () => notesApi.list(transactionId),
  })
  const notes = data?.data?.notes ?? []

  // Create note
  const createMutation = useMutation({
    mutationFn: (content: string) => notesApi.create({ transactionId, content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notesKey })
      queryClient.invalidateQueries({ queryKey: ['activity', transactionId] })
      setNewNote('')
      toast({ title: t('common.success'), variant: 'success' })
    },
    onError: () => {
      toast({ title: t('common.error'), variant: 'destructive' })
    },
  })

  // Delete note
  const deleteMutation = useMutation({
    mutationFn: (id: number) => notesApi.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: notesKey })
      const prev = queryClient.getQueryData(notesKey)
      queryClient.setQueryData(notesKey, (old: any) => {
        if (!old?.data?.notes) return old
        return { ...old, data: { ...old.data, notes: old.data.notes.filter((n: Note) => n.id !== id) } }
      })
      return { prev }
    },
    onError: (_err, _id, context) => {
      if (context?.prev) queryClient.setQueryData(notesKey, context.prev)
      toast({ title: t('common.error'), variant: 'destructive' })
    },
    onSettled: () => {
      setDeleteTargetId(null)
      queryClient.invalidateQueries({ queryKey: notesKey })
    },
    onSuccess: () => {
      toast({ title: t('common.success'), variant: 'success' })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (newNote.trim()) createMutation.mutate(newNote.trim())
  }

  const isOwner = (note: Note) => currentUserId && note.authorUserId === currentUserId

  return (
    <div className="py-4" data-testid="notes-section">
      {/* Create note */}
      <form onSubmit={handleSubmit} className="mb-6">
        <textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          rows={3}
          placeholder={t('common.add') + '...'}
          className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          data-testid="note-input"
        />
        <div className="mt-2 flex justify-end">
          <Button
            type="submit"
            size="sm"
            disabled={!newNote.trim() || createMutation.isPending}
            data-testid="note-submit"
          >
            {createMutation.isPending ? t('common.loading') : t('common.add')}
          </Button>
        </div>
      </form>

      {/* Notes list */}
      {notes.length > 0 ? (
        <div className="space-y-3">
          {notes.map((note: Note) => (
            <div
              key={note.id}
              className="rounded-lg border border-border p-3 group"
              data-testid={`note-${note.id}`}
            >
                <div>
                  <div className="flex items-start justify-between">
                    <p className="text-sm text-foreground flex-1">{note.content}</p>
                    {isOwner(note) && (
                      <div className="flex gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setDeleteTargetId(note.id)}
                          className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          aria-label={t('common.remove')}
                          data-testid={`delete-note-${note.id}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    {note.author?.fullName ?? 'Unknown'} &middot;{' '}
                    {formatDate(note.createdAt, 'PP')}
                  </p>
                </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">
          {t('common.noResults')}
        </p>
      )}

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={() => deleteTargetId && deleteMutation.mutate(deleteTargetId)}
        title={t('common.remove')}
        message={t('common.remove') + '?'}
        confirmLabel={t('common.remove')}
        cancelLabel={t('common.cancel')}
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
