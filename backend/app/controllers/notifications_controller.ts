import type { HttpContext } from '@adonisjs/core/http'
import { NotificationService } from '#services/notification_service'

export default class NotificationsController {
  /**
   * GET /api/notifications
   * List paginated notifications for the authenticated user
   */
  async index({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const page = request.input('page', 1)
    const limit = request.input('limit', 20)

    const notifications = await NotificationService.list(user.id, page, limit)

    return response.ok({
      success: true,
      data: {
        notifications: notifications.all().map((n) => ({
          id: n.id,
          type: n.type,
          title: n.title,
          body: n.body,
          icon: n.icon,
          severity: n.severity,
          link: n.link,
          emailRecipients: n.emailRecipients,
          transactionId: n.transactionId,
          readAt: n.readAt?.toISO() ?? null,
          createdAt: n.createdAt.toISO(),
        })),
        meta: {
          total: notifications.total,
          currentPage: notifications.currentPage,
          lastPage: notifications.lastPage,
          perPage: notifications.perPage,
        },
      },
    })
  }

  /**
   * GET /api/notifications/unread-count
   * Get the count of unread notifications
   */
  async unreadCount({ auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const count = await NotificationService.unreadCount(user.id)

    return response.ok({
      success: true,
      data: { count },
    })
  }

  /**
   * PATCH /api/notifications/:id/read
   * Mark a single notification as read
   */
  async markRead({ auth, params, response }: HttpContext) {
    const user = auth.getUserOrFail()

    try {
      await NotificationService.markRead(params.id, user.id)
      return response.ok({ success: true })
    } catch {
      return response.notFound({
        success: false,
        error: { message: 'Notification not found', code: 'E_NOT_FOUND' },
      })
    }
  }

  /**
   * POST /api/notifications/read-all
   * Mark all notifications as read for the authenticated user
   */
  async markAllRead({ auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    await NotificationService.markAllRead(user.id)

    return response.ok({ success: true })
  }
}
