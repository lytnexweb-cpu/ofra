import { http } from './http'

export interface Note {
  id: number
  transactionId: number
  authorUserId: number
  content: string
  createdAt: string
  updatedAt: string
  author?: {
    id: number
    fullName: string
    email: string
  }
}

export interface CreateNoteRequest {
  transactionId: number
  content: string
}

export const notesApi = {
  list: (transactionId: number) =>
    http.get<{ notes: Note[] }>(`/api/transactions/${transactionId}/notes`),

  create: (data: CreateNoteRequest) =>
    http.post<{ note: Note }>(
      `/api/transactions/${data.transactionId}/notes`,
      data
    ),

  delete: (id: number) => http.delete<{}>(`/api/notes/${id}`),
}
