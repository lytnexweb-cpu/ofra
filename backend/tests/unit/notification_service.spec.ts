import { test } from '@japa/runner'

import {
  truncateAll,
  createUser,
  createClient,
  createWorkflowTemplate,
  createWorkflowStep,
} from '#tests/helpers/index'
import { WorkflowEngineService } from '#services/workflow_engine_service'

/**
 * NotificationService — Unit Tests (RED)
 *
 * Tests the notification service logic:
 * - Creating notifications
 * - Counting unread
 * - Mark read / mark all read
 * - Twin pattern: email + notification created together
 *
 * Will FAIL until NotificationService and Notification model are implemented.
 */

test.group('NotificationService', (group) => {
  group.each.setup(async () => {
    await truncateAll()
  })

  // ──────────────────────────────────────────────
  // notify() — Create notifications
  // ──────────────────────────────────────────────

  test('notify() creates a notification in the database', async ({ assert }) => {
    const user = await createUser({ email: 'ns-create@test.com' })
    const { NotificationService } = await import('#services/notification_service')

    const notification = await NotificationService.notify({
      userId: user.id,
      type: 'deadline_warning',
      icon: '⏰',
      severity: 'warning',
      title: 'Deadline dans 48h',
      body: 'Inspection — Transaction Dupont',
      link: '/transactions/123',
    })

    assert.isNotNull(notification)
    assert.isNotNull(notification.id)
    assert.equal(notification.userId, user.id)
    assert.equal(notification.type, 'deadline_warning')
    assert.equal(notification.icon, '⏰')
    assert.equal(notification.severity, 'warning')
    assert.equal(notification.title, 'Deadline dans 48h')
    assert.equal(notification.body, 'Inspection — Transaction Dupont')
    assert.equal(notification.link, '/transactions/123')
    assert.notExists(notification.readAt)
  })

  test('notify() stores emailRecipients list', async ({ assert }) => {
    const user = await createUser({ email: 'ns-recipients@test.com' })
    const { NotificationService } = await import('#services/notification_service')

    const recipients = ['Me Tremblay (avocat)', 'Marie Dupont (client)']

    const notification = await NotificationService.notify({
      userId: user.id,
      type: 'step_advanced',
      icon: '✅',
      severity: 'info',
      title: 'Étape "Offre acceptée" complétée',
      emailRecipients: recipients,
    })

    assert.deepEqual(notification.emailRecipients, recipients)
  })

  test('notify() with transactionId links notification to transaction', async ({ assert }) => {
    const user = await createUser({ email: 'ns-tx@test.com' })
    const client = await createClient(user.id, { email: 'ns-client@test.com' })
    const template = await createWorkflowTemplate({ slug: 'ns-tpl-1' })
    await createWorkflowStep(template.id, { stepOrder: 1, name: 'Step 1', slug: 'ns-step-1' })

    const tx = await WorkflowEngineService.createTransactionFromTemplate({
      templateId: template.id,
      ownerUserId: user.id,
      clientId: client.id,
      type: 'purchase',
    })

    const { NotificationService } = await import('#services/notification_service')

    const notification = await NotificationService.notify({
      userId: user.id,
      transactionId: tx.id,
      type: 'condition_resolved',
      icon: '✅',
      severity: 'info',
      title: 'Condition résolue',
    })

    assert.equal(notification.transactionId, tx.id)
  })

  test('notify() defaults severity to info', async ({ assert }) => {
    const user = await createUser({ email: 'ns-default@test.com' })
    const { NotificationService } = await import('#services/notification_service')

    const notification = await NotificationService.notify({
      userId: user.id,
      type: 'email_sent',
      icon: '📨',
      title: 'Courriel envoyé',
    })

    assert.equal(notification.severity, 'info')
  })

  // ──────────────────────────────────────────────
  // unreadCount()
  // ──────────────────────────────────────────────

  test('unreadCount() returns correct count', async ({ assert }) => {
    const user = await createUser({ email: 'ns-count@test.com' })
    const { NotificationService } = await import('#services/notification_service')

    await NotificationService.notify({
      userId: user.id,
      type: 'deadline_warning',
      icon: '⏰',
      severity: 'warning',
      title: 'Notif 1',
    })

    await NotificationService.notify({
      userId: user.id,
      type: 'blocking_alert',
      icon: '⚠️',
      severity: 'urgent',
      title: 'Notif 2',
    })

    const count = await NotificationService.unreadCount(user.id)
    assert.equal(count, 2)
  })

  test('unreadCount() returns 0 after all marked read', async ({ assert }) => {
    const user = await createUser({ email: 'ns-count-zero@test.com' })
    const { NotificationService } = await import('#services/notification_service')

    await NotificationService.notify({
      userId: user.id,
      type: 'email_sent',
      icon: '📨',
      severity: 'info',
      title: 'Will be read',
    })

    await NotificationService.markAllRead(user.id)

    const count = await NotificationService.unreadCount(user.id)
    assert.equal(count, 0)
  })

  // ──────────────────────────────────────────────
  // markRead() / markAllRead()
  // ──────────────────────────────────────────────

  test('markRead() sets readAt timestamp', async ({ assert }) => {
    const user = await createUser({ email: 'ns-markread@test.com' })
    const { NotificationService } = await import('#services/notification_service')

    const notification = await NotificationService.notify({
      userId: user.id,
      type: 'step_advanced',
      icon: '✅',
      severity: 'info',
      title: 'Read me',
    })

    await NotificationService.markRead(notification.id, user.id)

    // Reload from DB
    const Notification = (await import('#models/notification')).default
    const updated = await Notification.findOrFail(notification.id)
    assert.isNotNull(updated.readAt)
  })

  test('markRead() throws or returns false for wrong user', async ({ assert }) => {
    const user1 = await createUser({ email: 'ns-wrong1@test.com' })
    const user2 = await createUser({ email: 'ns-wrong2@test.com' })
    const { NotificationService } = await import('#services/notification_service')

    const notification = await NotificationService.notify({
      userId: user1.id,
      type: 'deadline_warning',
      icon: '⏰',
      severity: 'warning',
      title: 'Not yours',
    })

    // Should throw or return false — user2 cannot mark user1's notification
    try {
      await NotificationService.markRead(notification.id, user2.id)
      // If it doesn't throw, it should have been a no-op
      const Notification = (await import('#models/notification')).default
      const unchanged = await Notification.findOrFail(notification.id)
      assert.isNull(unchanged.readAt)
    } catch {
      // Expected — access denied
      assert.isTrue(true)
    }
  })

  test('markAllRead() only affects the specified user', async ({ assert }) => {
    const user1 = await createUser({ email: 'ns-iso1@test.com' })
    const user2 = await createUser({ email: 'ns-iso2@test.com' })
    const { NotificationService } = await import('#services/notification_service')

    await NotificationService.notify({
      userId: user1.id,
      type: 'email_sent',
      icon: '📨',
      severity: 'info',
      title: 'User1',
    })

    await NotificationService.notify({
      userId: user2.id,
      type: 'email_sent',
      icon: '📨',
      severity: 'info',
      title: 'User2',
    })

    await NotificationService.markAllRead(user1.id)

    const count1 = await NotificationService.unreadCount(user1.id)
    const count2 = await NotificationService.unreadCount(user2.id)

    assert.equal(count1, 0)
    assert.equal(count2, 1)
  })

  // ──────────────────────────────────────────────
  // Twin pattern: email trigger → notification
  // ──────────────────────────────────────────────

  test('notifyWithEmailRecipients() creates notification listing who was emailed', async ({
    assert,
  }) => {
    const user = await createUser({ email: 'ns-twin@test.com' })
    const client = await createClient(user.id, { email: 'ns-twin-client@test.com' })
    const template = await createWorkflowTemplate({ slug: 'ns-twin-tpl' })
    await createWorkflowStep(template.id, { stepOrder: 1, name: 'Step 1', slug: 'ns-twin-step' })

    const tx = await WorkflowEngineService.createTransactionFromTemplate({
      templateId: template.id,
      ownerUserId: user.id,
      clientId: client.id,
      type: 'purchase',
    })

    const { NotificationService } = await import('#services/notification_service')

    const notification = await NotificationService.notify({
      userId: user.id,
      transactionId: tx.id,
      type: 'step_advanced',
      icon: '✅',
      severity: 'info',
      title: 'Étape "Offre acceptée" complétée',
      body: 'Transaction Dupont',
      link: '/transactions/1',
      emailRecipients: [
        'Me Tremblay (avocat)',
        'Marie Dupont (client)',
      ],
    })

    assert.equal(notification.title, 'Étape "Offre acceptée" complétée')
    assert.equal(notification.emailRecipients!.length, 2)
    assert.include(notification.emailRecipients!, 'Me Tremblay (avocat)')
    assert.include(notification.emailRecipients!, 'Marie Dupont (client)')
  })

  test('urgent severity is set for blocking condition alerts', async ({ assert }) => {
    const user = await createUser({ email: 'ns-urgent@test.com' })
    const { NotificationService } = await import('#services/notification_service')

    const notification = await NotificationService.notify({
      userId: user.id,
      type: 'blocking_alert',
      icon: '⚠️',
      severity: 'urgent',
      title: 'URGENT — Condition bloquante en retard',
    })

    assert.equal(notification.severity, 'urgent')
  })
})
