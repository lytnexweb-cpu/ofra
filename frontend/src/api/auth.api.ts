import { http } from './http'

// User roles
export type UserRole = 'user' | 'admin' | 'superadmin'

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
  role?: UserRole
  onboardingCompleted?: boolean
  onboardingSkipped?: boolean
}

// Onboarding request (3-step action onboarding)
export interface OnboardingRequest {
  language: 'fr' | 'en'
  fullName?: string
  phone?: string
  agency: string
  licenseNumber: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  fullName: string
  email: string
  password: string
  phone?: string
  preferredLanguage?: 'fr' | 'en'
}

export interface ForgotPasswordRequest {
  email: string
}

export interface ResetPasswordRequest {
  token: string
  password: string
}

export const authApi = {
  login: (credentials: LoginRequest) =>
    http.post<{ user: User }>('/api/login', credentials),

  register: (data: RegisterRequest) =>
    http.post<{ user: User }>('/api/register', data),

  forgotPassword: (data: ForgotPasswordRequest) =>
    http.post('/api/forgot-password', data),

  resetPassword: (data: ResetPasswordRequest) =>
    http.post('/api/reset-password', data),

  logout: () => http.post('/api/logout'),

  me: () => http.get<{ user: User }>('/api/me'),

  resendVerification: (email: string) =>
    http.post('/api/resend-verification', { email }),

  // D40: Onboarding
  saveOnboarding: (data: OnboardingRequest) =>
    http.put<{ profile: Partial<User> }>('/api/me/onboarding', data),

  skipOnboarding: () =>
    http.post<{ message: string }>('/api/me/onboarding/skip'),
}
