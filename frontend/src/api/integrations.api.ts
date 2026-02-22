import { http } from './http'

export interface FubContactPreview {
  id: number
  firstName: string | null
  lastName: string | null
  email: string | null
  phone: string | null
}

export interface FubConnectResponse {
  contacts: FubContactPreview[]
  total: number
}

export interface FubImportResponse {
  imported: number
  skipped: number
  errors: Array<{ contactId: number; message: string }>
}

export const integrationsApi = {
  connectFub: (apiKey: string) =>
    http.post<FubConnectResponse>('/api/integrations/followupboss/connect', { apiKey }),

  importFub: (apiKey: string, selectedContactIds?: number[]) =>
    http.post<FubImportResponse>('/api/integrations/followupboss/import', {
      apiKey,
      selectedContactIds,
    }),
}
