import { http } from './http'

export type ProfessionalRole = 'inspector' | 'notary' | 'lawyer' | 'mortgage_broker' | 'appraiser' | 'other'

export interface ProfessionalContact {
  id: number
  agentId: number
  name: string
  role: ProfessionalRole
  phone: string | null
  email: string | null
  company: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateProRequest {
  name: string
  role: ProfessionalRole
  phone?: string
  email?: string
  company?: string
  notes?: string
}

export interface UpdateProRequest {
  name?: string
  role?: ProfessionalRole
  phone?: string
  email?: string
  company?: string
  notes?: string
}

export const prosApi = {
  list: () => http.get<{ pros: ProfessionalContact[] }>('/api/pros'),
  get: (id: number) => http.get<{ pro: ProfessionalContact }>(`/api/pros/${id}`),
  create: (data: CreateProRequest) => http.post<{ pro: ProfessionalContact }>('/api/pros', data),
  update: (id: number, data: UpdateProRequest) => http.put<{ pro: ProfessionalContact }>(`/api/pros/${id}`, data),
  delete: (id: number) => http.delete<{ message: string }>(`/api/pros/${id}`),
}
