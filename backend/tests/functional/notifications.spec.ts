import { test } from '@japa/runner'
import { cuid } from '@adonisjs/core/helpers'
import {
  truncateAll,
  createUser,
} from '#tests/helpers/index'

function withAuth(request: any, userId: number) {
  const sessionId = cuid()
  return request
    .withCookie('adonis-session', sessionId)
    .withEncryptedCookie(sessionId, { auth_web: userId })
}

/**
 * Notifications API — Functional Tests
 *
 * Tests the 4 notification endpoints:
 *   GET  /api/notifications
 *   GET  /api/notifications/unread-count
 *   PATCH /api/notifications/:id/read
 *   POST  /api/notifications/read-all
 */

test.group('Notifications API', (group) => {
  group.each.setup(async () => {
    await truncateAll()
  })

  // ──────────────────────────────────────────────
  // GET /api/notifications — List
  // ──────────────────────────────────────────────

  test('GET /api/notifications returns paginated list for authenticated user', async ({
    client,
    assert,
  }) => {
    const user = await createUser({ email: 'notif-list@test.com' })

    const response = await withAuth(client.get('/api/notifications'), user.id)

    response.assertStatus(200)
    response.assertBodyContains({ success: true })

    const body = response.body()
    assert.isArray(body.data.notifications)
    assert.isDefined(body.data.meta)
    assert.isDefined(body.data.meta.total)
    assert.isDefined(body.data.meta.currentPage)
  })

  test('GET /api/notifications returns only notifications for the current user', async ({
    client,
    assert,
  }) => {
    const user1 = await createUser({ email: 'notif-user1@test.com' })
    const user2 = await createUser({ email: 'notif-user2@test.com' })

    // Create notifications for both users via the service
    const { NotificationService } = await import('#services/notification_service')

    await NotificationService.notify({
      userId: user1.id,
      type: 'deadline_warning',
      icon: '⏰',
      severity: 'warning',
      title: 'User1 notification',
    })

    await NotificationService.notify({
      userId: user2.id,
      type: 'deadline_warning',
      icon: '⏰',
      severity: 'warning',
      title: 'User2 notification',
    })

    const response = await withAuth(client.get('/api/notifications'), user1.id)

    response.assertStatus(200)
    const body = response.body()
    assert.equal(body.data.notifications.length, 1)
    assert.equal(body.data.notifications[0].title, 'User1 notification')
  })

  test('GET /api/notifications returns unread first, then read, by descending date', async ({
    client,
    assert,
  }) => {
    const user = await createUser({ email: 'notif-order@test.com' })
    const { NotificationService } = await import('#services/notification_service')

    const n1 = await NotificationService.notify({
      userId: user.id,
      type: 'step_advanced',
      icon: '✅',
      severity: 'info',
      title: 'Older read notification',
    })

    await NotificationService.markRead(n1.id, user.id)

    await NotificationService.notify({
      userId: user.id,
      type: 'deadline_warning',
      icon: '⏰',
      severity: 'warning',
      title: 'Newer unread notification',
    })

    const response = await withAuth(client.get('/api/notifications'), user.id)

    response.assertStatus(200)
    const notifications = response.body().data.notifications
    assert.equal(notifications.length, 2)
    // Unread first
    assert.isNull(notifications[0].readAt)
    assert.equal(notifications[0].title, 'Newer unread notification')
    // Read second
    assert.isNotNull(notifications[1].readAt)
  })

  test('GET /api/notifications requires authentication', async ({ client }) => {
    const response = await client.get('/api/notifications')
    response.assertStatus(401)
  })

  // ──────────────────────────────────────────────
  // GET /api/notifications/unread-count
  // ──────────────────────────────────────────────

  test('GET /api/notifications/unread-count returns count of unread notifications', async ({
    client,
    assert,
  }) => {
    const user = await createUser({ email: 'notif-count@test.com' })
    const { NotificationService } = await import('#services/notification_service')

    await NotificationService.notify({
      userId: user.id,
      type: 'deadline_warning',
      icon: '⏰',
      severity: 'warning',
      title: 'Unread 1',
    })

    await NotificationService.notify({
      userId: user.id,
      type: 'blocking_alert',
      icon: '⚠️',
      severity: 'urgent',
      title: 'Unread 2',
    })

    const n3 = await NotificationService.notify({
      userId: user.id,
      type: 'email_sent',
      icon: '📨',
      severity: 'info',
      title: 'Already read',
    })

    await NotificationService.markRead(n3.id, user.id)

    const response = await withAuth(client.get('/api/notifications/unread-count'), user.id)

    response.assertStatus(200)
    assert.equal(response.body().data.count, 2)
  })

  test('GET /api/notifications/unread-count returns 0 when no notifications', async ({
    client,
    assert,
  }) => {
    const user = await createUser({ email: 'notif-zero@test.com' })

    const response = await withAuth(client.get('/api/notifications/unread-count'), user.id)

    response.assertStatus(200)
    assert.equal(response.body().data.count, 0)
  })

  // ──────────────────────────────────────────────
  // PATCH /api/notifications/:id/read
  // ──────────────────────────────────────────────

  test('PATCH /api/notifications/:id/read marks a notification as read', async ({
    client,
    assert,
  }) => {
    const user = await createUser({ email: 'notif-read@test.com' })
    const { NotificationService } = await import('#services/notification_service')

    const notification = await NotificationService.notify({
      userId: user.id,
      type: 'step_advanced',
      icon: '✅',
      severity: 'info',
      title: 'Mark me read',
    })

    const response = await withAuth(
      client.patch(`/api/notifications/${notification.id}/read`),
      user.id
    )

    response.assertStatus(200)
    response.assertBodyContains({ success: true })

    // Verify it's actually marked as read
    const countResponse = await withAuth(
      client.get('/api/notifications/unread-count'),
      user.id
    )

    assert.equal(countResponse.body().data.count, 0)
  })

  test('PATCH /api/notifications/:id/read cannot mark another user notification', async ({
    client,
  }) => {
    const user1 = await createUser({ email: 'notif-own1@test.com' })
    const user2 = await createUser({ email: 'notif-own2@test.com' })
    const { NotificationService } = await import('#services/notification_service')

    const notification = await NotificationService.notify({
      userId: user1.id,
      type: 'deadline_warning',
      icon: '⏰',
      severity: 'warning',
      title: 'Not yours',
    })

    const response = await withAuth(
      client.patch(`/api/notifications/${notification.id}/read`),
      user2.id
    )

    response.assertStatus(404)
  })

  test('PATCH /api/notifications/:id/read returns 404 for non-existent notification', async ({
    client,
  }) => {
    const user = await createUser({ email: 'notif-404@test.com' })

    const response = await withAuth(
      client.patch('/api/notifications/999999/read'),
      user.id
    )

    response.assertStatus(404)
  })

  // ──────────────────────────────────────────────
  // POST /api/notifications/read-all
  // ──────────────────────────────────────────────

  test('POST /api/notifications/read-all marks all user notifications as read', async ({
    client,
    assert,
  }) => {
    const user = await createUser({ email: 'notif-readall@test.com' })
    const { NotificationService } = await import('#services/notification_service')

    await NotificationService.notify({
      userId: user.id,
      type: 'deadline_warning',
      icon: '⏰',
      severity: 'warning',
      title: 'Unread 1',
    })

    await NotificationService.notify({
      userId: user.id,
      type: 'step_advanced',
      icon: '✅',
      severity: 'info',
      title: 'Unread 2',
    })

    await NotificationService.notify({
      userId: user.id,
      type: 'blocking_alert',
      icon: '⚠️',
      severity: 'urgent',
      title: 'Unread 3',
    })

    const response = await withAuth(
      client.post('/api/notifications/read-all'),
      user.id
    )

    response.assertStatus(200)
    response.assertBodyContains({ success: true })

    const countResponse = await withAuth(
      client.get('/api/notifications/unread-count'),
      user.id
    )

    assert.equal(countResponse.body().data.count, 0)
  })

  test('POST /api/notifications/read-all only affects current user', async ({
    client,
    assert,
  }) => {
    const user1 = await createUser({ email: 'notif-iso1@test.com' })
    const user2 = await createUser({ email: 'notif-iso2@test.com' })
    const { NotificationService } = await import('#services/notification_service')

    await NotificationService.notify({
      userId: user1.id,
      type: 'deadline_warning',
      icon: '⏰',
      severity: 'warning',
      title: 'User1 notif',
    })

    await NotificationService.notify({
      userId: user2.id,
      type: 'deadline_warning',
      icon: '⏰',
      severity: 'warning',
      title: 'User2 notif',
    })

    // User1 marks all as read
    await withAuth(
      client.post('/api/notifications/read-all'),
      user1.id
    )

    // User2 should still have 1 unread
    const countResponse = await withAuth(
      client.get('/api/notifications/unread-count'),
      user2.id
    )

    assert.equal(countResponse.body().data.count, 1)
  })
})
