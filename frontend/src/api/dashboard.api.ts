import { http } from './http'

export interface PipelineStep {
  slug: string
  name: string
  count: number
}

export interface RevenueData {
  month: string
  total: number
}

export interface RecentActivity {
  id: number
  transactionId: number
  activityType: string
  metadata: Record<string, any>
  clientName: string
  userName: string | null
  createdAt: string
}

export interface UpcomingDeadline {
  id: number
  title: string
  dueDate: string | null
  transactionId: number
  clientName: string
  priority: 'low' | 'medium' | 'high'
  isBlocking: boolean
}

export interface DashboardSummary {
  // Basic stats
  totalTransactions: number
  activeTransactions: number
  completedTransactions: number
  overdueConditions: number
  dueSoonConditions: number
  // Pipeline (step-based)
  pipeline: PipelineStep[]
  // Revenue
  revenue: RevenueData[]
  totalRevenue: number
  monthRevenue: number
  // Metrics
  conversionRate: number
  // Activity
  recentActivity: RecentActivity[]
  upcomingDeadlines: UpcomingDeadline[]
}

// D42: Dashboard Urgencies
export type UrgencyCriticality = 'overdue' | 'urgent' | 'this_week' | 'ok'

export interface UrgencyItem {
  conditionId: number
  conditionTitle: string
  labelFr: string | null
  labelEn: string | null
  level: 'blocking' | 'required' | 'recommended'
  dueDate: string
  daysRemaining: number
  criticality: UrgencyCriticality
  transactionId: number
  transactionType: string
  clientName: string
  address: string | null
  stepOrder: number | null
  stepName: string | null
}

export interface DashboardUrgenciesData {
  state: 'empty' | 'all_clear' | 'urgencies'
  urgencies: UrgencyItem[]
  hasMore?: boolean
  moreCount?: number
  totalActiveTransactions: number
  totalTransactions: number
  urgencyCount: number
  greenCount: number
  nextDeadlineDays: number | null
}

export const dashboardApi = {
  getSummary: () => http.get<DashboardSummary>('/api/dashboard/summary'),
  getUrgencies: () => http.get<DashboardUrgenciesData>('/api/dashboard/urgencies'),
}
