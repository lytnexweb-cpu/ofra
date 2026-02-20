import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MessageSquare, Send, Trash2 } from 'lucide-react'
import { notesApi, type Note } from '../../api/notes.api'
import { authApi } from '../../api/auth.api'
import { toast } from '../../hooks/use-toast'
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
    <>
      <div className="mt-4 p-3 sm:p-4 rounded-xl bg-white border border-stone-200 shadow-sm" data-testid="notes-section">
        {/* Header — maquette 01 */}
        <h3 className="text-xs sm:text-sm font-semibold text-stone-700 flex items-center gap-2 mb-2">
          <MessageSquare className="w-4 h-4 text-stone-400" />
          Notes
        </h3>

        {/* Notes list */}
        {notes.length > 0 && (
          <div className="space-y-2 mb-3">
            {notes.map((note: Note) => (
              <div
                key={note.id}
                className="p-2.5 rounded-lg bg-stone-50 group"
                data-testid={`note-${note.id}`}
              >
                <div className="flex items-start justify-between">
                  <p className="text-sm text-stone-700 flex-1">{note.content}</p>
                  {isOwner(note) && (
                    <button
                      onClick={() => setDeleteTargetId(note.id)}
                      className="p-2 rounded text-stone-300 hover:text-red-500 hover:bg-red-50 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity ml-2 shrink-0"
                      aria-label={t('common.remove')}
                      data-testid={`delete-note-${note.id}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <p className="text-xs text-stone-400 mt-1">
                  {note.author?.fullName ?? 'Unknown'} &middot;{' '}
                  {formatDate(note.createdAt, 'd MMM')}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Create note — maquette 01: textarea + send icon inline */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            rows={2}
            placeholder={t('notes.addPlaceholder', 'Ajouter une note...')}
            className="flex-1 px-3 py-2 text-sm rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            data-testid="note-input"
          />
          <button
            type="submit"
            disabled={!newNote.trim() || createMutation.isPending}
            className="self-end px-3 py-2 text-sm font-medium rounded-lg bg-primary text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="note-submit"
            aria-label={t('notes.submit', 'Envoyer')}
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

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
    </>
  )
}
