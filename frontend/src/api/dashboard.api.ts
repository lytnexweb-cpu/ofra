import { http } from './http'

export interface DashboardSummary {
  totalTransactions: number
  activeTransactions: number
  completedTransactions: number
  overdueConditions: number
  dueSoonConditions: number
}

export const dashboardApi = {
  getSummary: () => http.get<DashboardSummary>('/api/dashboard/summary'),
}
