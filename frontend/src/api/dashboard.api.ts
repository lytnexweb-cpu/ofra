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

export const dashboardApi = {
  getSummary: () => http.get<DashboardSummary>('/api/dashboard/summary'),
}
