import { DateTime } from 'luxon'
import Notification from '#models/notification'
import type { NotificationType, NotificationSeverity } from '#models/notification'

interface NotifyOptions {
  userId: number
  transactionId?: number
  type: NotificationType | string
  icon: string
  severity?: NotificationSeverity
  title: string
  body?: string
  link?: string
  emailRecipients?: string[]
}

export class NotificationService {
  /**
   * Create a notification for a user
   */
  static async notify(opts: NotifyOptions): Promise<Notification> {
    return Notification.create({
      userId: opts.userId,
      transactionId: opts.transactionId ?? null,
      type: opts.type,
      icon: opts.icon || '🔔',
      severity: opts.severity ?? 'info',
      title: opts.title,
      body: opts.body ?? null,
      link: opts.link ?? null,
      emailRecipients: opts.emailRecipients ?? null,
    })
  }

  /**
   * Count unread notifications for a user
   */
  static async unreadCount(userId: number): Promise<number> {
    const result = await Notification.query()
      .where('userId', userId)
      .whereNull('readAt')
      .count('* as total')
      .first()

    return Number(result?.$extras.total ?? 0)
  }

  /**
   * List notifications for a user (paginated, unread first)
   */
  static async list(userId: number, page: number = 1, limit: number = 20) {
    return Notification.query()
      .where('userId', userId)
      .orderByRaw('read_at IS NOT NULL ASC')
      .orderBy('createdAt', 'desc')
      .paginate(page, limit)
  }

  /**
   * Mark a single notification as read (must belong to user)
   */
  static async markRead(notificationId: number, userId: number): Promise<void> {
    const notification = await Notification.query()
      .where('id', notificationId)
      .where('userId', userId)
      .firstOrFail()

    if (!notification.readAt) {
      notification.readAt = DateTime.now()
      await notification.save()
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllRead(userId: number): Promise<void> {
    await Notification.query()
      .where('userId', userId)
      .whereNull('readAt')
      .update({ readAt: DateTime.now().toSQL() })
  }
}
