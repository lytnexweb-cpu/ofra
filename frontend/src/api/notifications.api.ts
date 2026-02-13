import { http } from './http'

export interface NotificationItem {
  id: number
  type: string
  icon: string
  severity: 'info' | 'warning' | 'urgent'
  title: string
  body: string | null
  link: string | null
  emailRecipients: string[] | null
  transactionId: number | null
  readAt: string | null
  createdAt: string
}

export interface NotificationListData {
  notifications: NotificationItem[]
  meta: {
    total: number
    currentPage: number
    lastPage: number
    perPage: number
  }
}

export interface UnreadCountData {
  count: number
}

export const notificationsApi = {
  list: (page = 1, limit = 20) =>
    http.get<NotificationListData>('/api/notifications', { params: { page, limit } }),

  unreadCount: () =>
    http.get<UnreadCountData>('/api/notifications/unread-count'),

  markRead: (id: number) =>
    http.patch('/api/notifications/' + id + '/read'),

  markAllRead: () =>
    http.post('/api/notifications/read-all'),
}
