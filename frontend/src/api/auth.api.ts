import { http } from './http'

// D40: Onboarding profile types
export type PracticeType = 'solo' | 'small_team' | 'agency'
export type PropertyContext = 'urban_suburban' | 'rural' | 'condo' | 'land'
export type AnnualVolume = 'beginner' | 'established' | 'high'

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
  // D40: Onboarding profile
  onboardingCompleted?: boolean
  onboardingSkipped?: boolean
  practiceType?: PracticeType | null
  propertyContexts?: PropertyContext[]
  annualVolume?: AnnualVolume | null
  preferAutoConditions?: boolean
}

// D40: Onboarding request
export interface OnboardingRequest {
  language: 'fr' | 'en'
  practiceType: PracticeType
  propertyContexts: PropertyContext[]
  annualVolume: AnnualVolume
  preferAutoConditions: boolean
  skipped?: boolean
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
  address?: string
  city?: string
  provinceCode?: string
  agency?: string
  licenseNumber?: string
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
