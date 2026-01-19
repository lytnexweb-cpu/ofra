import { http } from './http'

export interface PipelineData {
  consultation: number
  offer: number
  accepted: number
  conditions: number
  notary: number
  closing: number
}

export interface RevenueData {
  month: string
  total: number
}

export interface RecentActivity {
  type: 'status_change' | 'note' | 'condition_completed'
  id: number
  transactionId: number
  clientName: string
  description: string
  createdAt: string
  fromStatus?: string
  toStatus?: string
  author?: string
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
  // Pipeline
  pipeline: PipelineData
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
