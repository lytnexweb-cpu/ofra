import { http } from './http'

export interface User {
  id: number
  email: string
  fullName: string | null
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
