import { http } from './http'
import type { UserRole } from './auth.api'

// Engagement levels
export type EngagementLevel = 'active' | 'warm' | 'inactive'

// Subscription status
export type SubscriptionStatus = 'trial' | 'active' | 'past_due' | 'cancelled' | 'expired'

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
  charts: {
    signupsByWeek: Array<{ week: string; count: number }>
    transactionsByWeek: Array<{ week: string; count: number }>
  }
}

// Subscriber/User info with engagement
export interface AdminUser {
  id: number
  email: string
  fullName: string | null
  role: UserRole
  agency: string | null
  isFounder: boolean
  createdAt: string
  lastActivity: string | null
  onboardingCompleted: boolean
  practiceType: string | null
  annualVolume: string | null
  subscriptionStatus: SubscriptionStatus
  subscriptionStartedAt: string | null
  subscriptionEndsAt: string | null
  engagement: {
    level: EngagementLevel
    transactionCount: number
    completedConditions: number
    daysSinceLastLogin: number | null
  }
  noteCount: number
  pendingTaskCount: number
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

// Admin Note
export interface AdminNote {
  id: number
  content: string
  createdAt: string
  updatedAt: string | null
  author: {
    id: number
    email: string
    fullName: string | null
  }
}

// Admin Task
export interface AdminTask {
  id: number
  title: string
  dueDate: string | null
  completed: boolean
  completedAt: string | null
  createdAt: string
  author: {
    id: number
    email: string
    fullName: string | null
  }
}

// At-risk user
export interface AtRiskUser {
  id: number
  email: string
  fullName: string | null
  createdAt: string
  daysSinceCreation: number
  daysSinceLastLogin: number | null
  transactionCount: number
  reason: 'no_login_7d' | 'no_activity_7d'
}

// Overdue condition
export interface OverdueCondition {
  id: number
  title: string
  deadline: string
  daysOverdue: number
  transactionId: number
  clientName: string | null
  ownerEmail: string
}

// Activity feed
export interface ActivityItem {
  type: 'user_registered' | 'transaction_created'
  timestamp: string
  data: Record<string, unknown>
}

export interface ActivityResponse {
  atRiskUsers: AtRiskUser[]
  overdueConditions: OverdueCondition[]
  activities: ActivityItem[]
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
  subscription?: SubscriptionStatus | ''
  engagement?: EngagementLevel | ''
  founder?: 'true'
  sortBy?: 'createdAt' | 'email' | 'fullName' | 'role' | 'updatedAt'
  sortOrder?: 'asc' | 'desc'
}

// Plan types (G2)
export interface AdminPlan {
  id: number
  name: string
  slug: string
  monthlyPrice: number
  annualPrice: number
  maxTransactions: number | null // null = unlimited
  maxStorageGb: number
  maxUsers: number
  historyMonths: number | null // null = unlimited
  isActive: boolean
  displayOrder: number
  subscriberCount: number
  founderCount: number
  createdAt: string
  updatedAt: string
}

export interface PlanChangeLog {
  id: number
  planId: number
  planName: string
  adminName: string
  fieldChanged: string
  oldValue: string | null
  newValue: string | null
  reason: string
  createdAt: string
}

export interface UpdatePlanRequest {
  name?: string
  monthlyPrice?: number
  annualPrice?: number
  maxTransactions?: number | null
  maxStorageGb?: number
  maxUsers?: number
  historyMonths?: number | null
  isActive?: boolean
  displayOrder?: number
  reason: string
}

// Pulse data (Bloc 9)
export interface PulseData {
  kpis: {
    totalUsers: number
    newUsers30d: number
    activeTx: number
    newTx30d: number
    founders: number
    foundersMax: number
    mrr: number
  }
  alerts: {
    expiringTrials: Array<{ id: number; email: string; fullName: string | null; subscriptionEndsAt: string }>
    pastDueUsers: Array<{ id: number; email: string; fullName: string | null }>
    overdueConditionsCount: number
  }
  activityFeed: Array<{
    id: number
    type: string
    userId: number | null
    userName: string | null
    transactionId: number
    clientName: string | null
    metadata: Record<string, unknown>
    createdAt: string
  }>
  conversionStats: {
    trial: number
    active: number
    cancelled: number
    total: number
    conversionRate: number
    signupsByWeek: Array<{ week: string; count: number }>
  }
}

// Site settings (Bloc 9)
export interface SiteSettings {
  site_mode: string
  access_code: string
  custom_message: string
  launch_date: string
  pitch_points: string
  show_founder_count: string
}

// Promo code (Bloc 9)
export interface PromoCode {
  id: number
  code: string
  type: 'percent' | 'fixed' | 'free_months'
  value: number
  maxUses: number | null
  currentUses: number
  validFrom: string | null
  validUntil: string | null
  eligiblePlans: number[] | null
  active: boolean
  stripeCouponId: string | null
  createdAt: string
  updatedAt: string
}

// Waitlist email (Bloc 9)
export interface WaitlistEmail {
  id: number
  email: string
  source: string
  createdAt: string
}

// Plan change with pagination (Bloc 9)
export interface PaginatedPlanChanges {
  changes: PlanChangeLog[]
  meta: { total: number; perPage: number; currentPage: number; lastPage: number }
}

export const adminApi = {
  // Dashboard
  getOverview: () => http.get<AdminOverview>('/api/admin/overview'),

  // Subscribers
  getSubscribers: (params?: SubscribersParams) =>
    http.get<SubscribersResponse>('/api/admin/subscribers', { params }),

  exportSubscribers: () => '/api/admin/subscribers/export',

  // Role changes disabled for security - use updateSubscriptionStatus instead
  updateUserRole: (_userId: number, _role: UserRole) => {
    console.warn('updateUserRole is disabled for security reasons')
    return Promise.resolve({ success: false, error: { message: 'Role changes disabled' } })
  },

  updateSubscriptionStatus: (userId: number, subscriptionStatus: SubscriptionStatus) =>
    http.patch<{
      user: {
        id: number
        email: string
        subscriptionStatus: SubscriptionStatus
        subscriptionStartedAt: string | null
        subscriptionEndsAt: string | null
      }
    }>(`/api/admin/subscribers/${userId}/subscription`, { subscriptionStatus }),

  extendSubscription: (userId: number, days: number, reason: string) =>
    http.patch<{
      user: { id: number; email: string; subscriptionStatus: SubscriptionStatus; subscriptionEndsAt: string | null }
      extended: { days: number; reason: string; newEndDate: string }
    }>(`/api/admin/subscribers/${userId}/extend`, { days, reason }),

  toggleFounder: (userId: number) =>
    http.patch<{
      user: { id: number; email: string; isFounder: boolean }
    }>(`/api/admin/subscribers/${userId}/founder`, {}),

  // Notes
  getNotes: (userId: number) =>
    http.get<{ notes: AdminNote[] }>(`/api/admin/subscribers/${userId}/notes`),

  createNote: (userId: number, content: string) =>
    http.post<{ note: AdminNote }>(`/api/admin/subscribers/${userId}/notes`, { content }),

  updateNote: (noteId: number, content: string) =>
    http.put<{ note: AdminNote }>(`/api/admin/notes/${noteId}`, { content }),

  deleteNote: (noteId: number) =>
    http.delete<{ message: string }>(`/api/admin/notes/${noteId}`),

  // Tasks
  getTasks: (userId: number) =>
    http.get<{ tasks: AdminTask[] }>(`/api/admin/subscribers/${userId}/tasks`),

  createTask: (userId: number, title: string, dueDate?: string) =>
    http.post<{ task: AdminTask }>(`/api/admin/subscribers/${userId}/tasks`, { title, dueDate }),

  updateTask: (taskId: number, data: { title?: string; dueDate?: string | null; completed?: boolean }) =>
    http.patch<{ task: AdminTask }>(`/api/admin/tasks/${taskId}`, data),

  deleteTask: (taskId: number) =>
    http.delete<{ message: string }>(`/api/admin/tasks/${taskId}`),

  // Activity
  getActivity: (limit?: number) =>
    http.get<ActivityResponse>('/api/admin/activity', {
      params: limit ? { limit } : undefined,
    }),

  // System
  getSystemHealth: () => http.get<SystemHealth>('/api/admin/system'),

  // Plans (G2)
  getPlans: () =>
    http.get<{ plans: AdminPlan[]; changeLogs: PlanChangeLog[] }>('/api/admin/plans'),

  updatePlan: (planId: number, data: UpdatePlanRequest) =>
    http.put<{ plan: AdminPlan; changes: { field: string; oldValue: string | null; newValue: string | null }[] }>(
      `/api/admin/plans/${planId}`,
      data
    ),

  // Pulse (Bloc 9)
  getPulse: () => http.get<PulseData>('/api/admin/pulse'),

  // Site settings (Bloc 9)
  getSiteSettings: () => http.get<SiteSettings>('/api/admin/site-settings'),
  updateSiteSettings: (data: Partial<SiteSettings>) =>
    http.put<SiteSettings>('/api/admin/site-settings', data),

  // Promo codes (Bloc 9)
  getPromoCodes: () => http.get<PromoCode[]>('/api/admin/promo-codes'),
  createPromoCode: (data: Omit<PromoCode, 'id' | 'currentUses' | 'createdAt' | 'updatedAt'>) =>
    http.post<PromoCode>('/api/admin/promo-codes', data),
  updatePromoCode: (id: number, data: Partial<PromoCode>) =>
    http.put<PromoCode>(`/api/admin/promo-codes/${id}`, data),
  deletePromoCode: (id: number) =>
    http.delete(`/api/admin/promo-codes/${id}`),

  // Waitlist (Bloc 9)
  getWaitlist: (params?: { page?: number; limit?: number }) =>
    http.get<{ emails: WaitlistEmail[]; meta: { total: number; perPage: number; currentPage: number; lastPage: number } }>('/api/admin/waitlist', { params }),
  exportWaitlistUrl: () => '/api/admin/waitlist/export',

  // Plan changes paginated (Bloc 9)
  getPlanChanges: (params?: { page?: number; limit?: number }) =>
    http.get<PaginatedPlanChanges>('/api/admin/plan-changes', { params }),

  // Apply to existing (Bloc 9)
  applyToExisting: (planId: number, reason: string) =>
    http.post<{ affectedCount: number; planName: string }>(`/api/admin/plans/${planId}/apply-to-existing`, { reason }),
}
