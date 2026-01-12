import { http } from './http'

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
  newPasswordConfirmation: string
}

export interface UpdateProfileRequest {
  email: string
  currentPassword: string
}

export interface UpdateProfileInfoRequest {
  fullName?: string
  phone?: string
  agency?: string
  licenseNumber?: string
  profilePhoto?: string
  emailSignature?: string
  dateFormat?: 'DD/MM/YYYY' | 'MM/DD/YYYY'
  timezone?: string
}

export interface UserProfile {
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

export const profileApi = {
  changePassword: (data: ChangePasswordRequest) =>
    http.put<{ message: string }>('/api/me/password', data),

  updateProfile: (data: UpdateProfileRequest) =>
    http.put<{ message: string; user: { id: number; email: string; fullName: string | null } }>(
      '/api/me',
      data
    ),

  updateProfileInfo: (data: UpdateProfileInfoRequest) =>
    http.put<{ message: string; user: UserProfile }>('/api/me/profile', data),

  logoutAll: () => http.post<{ message: string }>('/api/me/logout-all'),
}
