import { http } from './http'

export interface User {
  id: number
  email: string
  fullName: string | null
  phone: string | null
  agency: string | null
  licenseNumber: string | null
  profilePhoto: string | null
  emailSignature: string | null
  language: string
  dateFormat: string
  timezone: string
}

export interface LoginRequest {
  email: string
  password: string
}

export const authApi = {
  login: (credentials: LoginRequest) =>
    http.post<{ user: User }>('/api/login', credentials),

  logout: () => http.post('/api/logout'),

  me: () => http.get<{ user: User }>('/api/me'),
}
