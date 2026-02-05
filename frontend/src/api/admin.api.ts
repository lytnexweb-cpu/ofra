import { http } from './http'
import type { UserRole } from './auth.api'

// Overview KPIs
export interface AdminOverview {
  kpis: {
    totalUsers: number
    totalTransactions: number
    totalClients: number
    newUsersThisMonth: number
    activeUsersThisWeek: number
  }
  usersByRole: Array<{ role: UserRole; count: number }>
  transactionsByStatus: Array<{ status: string; count: number }>
  signupTrend: Array<{ date: string; count: number }>
}

// Subscriber/User info
export interface AdminUser {
  id: number
  email: string
  fullName: string | null
  role: UserRole
  agency: string | null
  createdAt: string
  onboardingCompleted: boolean
  practiceType: string | null
  annualVolume: string | null
  transactionCount: number
  clientCount: number
}

export interface SubscribersResponse {
  users: AdminUser[]
  meta: {
    total: number
    perPage: number
    currentPage: number
    lastPage: number
  }
}

// Activity feed
export interface ActivityItem {
  type: 'user_registered' | 'transaction_created'
  timestamp: string
  data: Record<string, unknown>
}

// System health
export interface SystemHealth {
  status: 'operational' | 'degraded' | 'outage'
  timestamp: string
  checks: {
    database: 'healthy' | 'error'
  }
  stats: {
    totalUsers: number
    totalTransactions: number
  }
  runtime: {
    nodeVersion: string
    platform: string
    memoryUsedMB: number
    memoryTotalMB: number
    uptimeSeconds: number
  }
}

export interface SubscribersParams {
  page?: number
  limit?: number
  search?: string
  role?: UserRole | ''
  sortBy?: 'createdAt' | 'email' | 'fullName' | 'role'
  sortOrder?: 'asc' | 'desc'
}

export const adminApi = {
  /**
   * GET /api/admin/overview
   * Dashboard overview with KPIs
   */
  getOverview: () => http.get<AdminOverview>('/api/admin/overview'),

  /**
   * GET /api/admin/subscribers
   * List all users with pagination and filtering
   */
  getSubscribers: (params?: SubscribersParams) =>
    http.get<SubscribersResponse>('/api/admin/subscribers', { params }),

  /**
   * PATCH /api/admin/subscribers/:id/role
   * Update user role (superadmin only)
   */
  updateUserRole: (userId: number, role: UserRole) =>
    http.patch<{ user: { id: number; email: string; role: UserRole } }>(
      `/api/admin/subscribers/${userId}/role`,
      { role }
    ),

  /**
   * GET /api/admin/activity
   * Recent system activity feed
   */
  getActivity: (limit?: number) =>
    http.get<{ activities: ActivityItem[] }>('/api/admin/activity', {
      params: limit ? { limit } : undefined,
    }),

  /**
   * GET /api/admin/system
   * System health and status
   */
  getSystemHealth: () => http.get<SystemHealth>('/api/admin/system'),
}
