import { apiRequest } from './http'

export interface ExportPdfOptions {
  sections?: {
    offers?: boolean
    conditions?: boolean
    documents?: boolean
    history?: boolean
  }
  watermark?: boolean
  language?: 'fr' | 'en'
}

const API_URL = import.meta.env.VITE_API_URL || ''

export const exportApi = {
  exportPdf: async (transactionId: number, options: ExportPdfOptions = {}) => {
    const url = `${API_URL}/api/transactions/${transactionId}/export/pdf`
    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: 'Export failed' } }))
      return { success: false as const, error: error.error }
    }

    const blob = await response.blob()
    return { success: true as const, data: { blob } }
  },

  sendEmail: (transactionId: number, email: string) =>
    apiRequest<{ sent: boolean }>(`/api/transactions/${transactionId}/export/email`, {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
}
