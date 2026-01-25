import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import {
  truncateAll,
  createUser,
  createClient,
  createTransaction,
  createCondition,
} from '#tests/helpers/index'
import ReminderLog from '#models/reminder_log'
import { ReminderService } from '#services/reminder_service'

test.group('Reminders - Idempotence (No Duplicates)', (group) => {
  group.each.setup(async () => {
    await truncateAll()
  })

  test('running reminders twice on same day does not create duplicate emails', async ({
    assert,
  }) => {
    // Setup: Create user with overdue condition
    const user = await createUser({ email: 'reminder-test@example.com' })
    const client = await createClient(user.id)
    const transaction = await createTransaction(user.id, client.id, { status: 'conditions' })

    // Create overdue condition (due yesterday)
    await createCondition(transaction.id, {
      title: 'Financing Approval',
      status: 'pending',
      dueDate: DateTime.now().minus({ days: 1 }).toISO(),
      stage: 'conditions',
    })

    // First run
    const result1 = await ReminderService.processAllReminders()

    // Assert some reminders were sent
    assert.isTrue(result1.digestsSent > 0 || result1.overdueSent > 0)

    // Count reminder logs
    const logsAfterFirst = await ReminderLog.query().where('owner_user_id', user.id)
    const countAfterFirst = logsAfterFirst.length

    // Second run (same day)
    const result2 = await ReminderService.processAllReminders()

    // Assert NO additional reminders were sent
    assert.equal(result2.digestsSent, 0)
    assert.equal(result2.overdueSent, 0)

    // Verify no duplicate logs created
    const logsAfterSecond = await ReminderLog.query().where('owner_user_id', user.id)
    assert.equal(logsAfterSecond.length, countAfterFirst)
  })
})

test.group('Reminders - Condition Selection', (group) => {
  group.each.setup(async () => {
    await truncateAll()
  })

  test('selects only overdue and due-soon pending conditions', async ({ assert }) => {
    const user = await createUser({ email: 'selection-test@example.com' })
    const client = await createClient(user.id)
    const transaction = await createTransaction(user.id, client.id, { status: 'conditions' })

    const today = DateTime.now()

    // Condition 1: Overdue (should be selected)
    await createCondition(transaction.id, {
      title: 'Overdue Condition',
      status: 'pending',
      dueDate: today.minus({ days: 3 }).toISO(),
      stage: 'conditions',
    })

    // Condition 2: Due in 5 days (should be selected - within 7 days)
    await createCondition(transaction.id, {
      title: 'Due Soon Condition',
      status: 'pending',
      dueDate: today.plus({ days: 5 }).toISO(),
      stage: 'conditions',
    })

    // Condition 3: Due in 10 days (should NOT be selected)
    await createCondition(transaction.id, {
      title: 'Far Future Condition',
      status: 'pending',
      dueDate: today.plus({ days: 10 }).toISO(),
      stage: 'conditions',
    })

    // Run reminders
    const result = await ReminderService.processAllReminders()

    // Digest should have been sent (has overdue + due soon)
    assert.equal(result.digestsSent, 1)

    // Should have 1 overdue reminder
    assert.equal(result.overdueSent, 1)
  })

  test('completed conditions are ignored', async ({ assert }) => {
    const user = await createUser({ email: 'completed-test@example.com' })
    const client = await createClient(user.id)
    const transaction = await createTransaction(user.id, client.id, { status: 'conditions' })

    const today = DateTime.now()

    // Create COMPLETED overdue condition (should be ignored)
    await createCondition(transaction.id, {
      title: 'Completed Overdue Condition',
      status: 'completed',
      dueDate: today.minus({ days: 3 }).toISO(),
      completedAt: today.minus({ days: 1 }).toISO(),
      stage: 'conditions',
    })

    // Create COMPLETED due-soon condition (should be ignored)
    await createCondition(transaction.id, {
      title: 'Completed Due Soon Condition',
      status: 'completed',
      dueDate: today.plus({ days: 2 }).toISO(),
      completedAt: today.toISO(),
      stage: 'conditions',
    })

    // Run reminders
    const result = await ReminderService.processAllReminders()

    // No reminders should be sent
    assert.equal(result.digestsSent, 0)
    assert.equal(result.overdueSent, 0)
    assert.equal(result.due48hSent, 0)

    // No logs should be created
    const logs = await ReminderLog.query().where('owner_user_id', user.id)
    assert.equal(logs.length, 0)
  })
})

test.group('Reminders - Multi-tenant Isolation', (group) => {
  group.each.setup(async () => {
    await truncateAll()
  })

  test('User A reminders do not include User B conditions', async ({ assert }) => {
    const today = DateTime.now()

    // Create User A with overdue condition
    const userA = await createUser({ email: 'usera@example.com' })
    const clientA = await createClient(userA.id)
    const transactionA = await createTransaction(userA.id, clientA.id, { status: 'conditions' })
    await createCondition(transactionA.id, {
      title: 'User A Overdue',
      status: 'pending',
      dueDate: today.minus({ days: 2 }).toISO(),
      stage: 'conditions',
    })

    // Create User B with overdue condition
    const userB = await createUser({ email: 'userb@example.com' })
    const clientB = await createClient(userB.id)
    const transactionB = await createTransaction(userB.id, clientB.id, { status: 'conditions' })
    await createCondition(transactionB.id, {
      title: 'User B Overdue',
      status: 'pending',
      dueDate: today.minus({ days: 2 }).toISO(),
      stage: 'conditions',
    })

    // Run reminders
    const result = await ReminderService.processAllReminders()

    // Both users should get separate digest + overdue reminders
    assert.equal(result.digestsSent, 2)
    assert.equal(result.overdueSent, 2)

    // Verify logs are properly isolated
    const logsA = await ReminderLog.query().where('owner_user_id', userA.id)
    const logsB = await ReminderLog.query().where('owner_user_id', userB.id)

    // Each user should have their own logs
    assert.isTrue(logsA.length >= 1)
    assert.isTrue(logsB.length >= 1)

    // User A logs should not reference User B's entities
    for (const log of logsA) {
      assert.equal(log.ownerUserId, userA.id)
    }

    // User B logs should not reference User A's entities
    for (const log of logsB) {
      assert.equal(log.ownerUserId, userB.id)
    }
  })
})

test.group('Reminders - 48h Reminder', (group) => {
  group.each.setup(async () => {
    await truncateAll()
  })

  test('sends 48h reminder for conditions due within 48 hours', async ({ assert }) => {
    const user = await createUser({ email: '48h-test@example.com' })
    const client = await createClient(user.id)
    const transaction = await createTransaction(user.id, client.id, { status: 'conditions' })

    const today = DateTime.now()

    // Condition due tomorrow (within 48h)
    await createCondition(transaction.id, {
      title: 'Due Tomorrow',
      status: 'pending',
      dueDate: today.plus({ days: 1 }).toISO(),
      stage: 'conditions',
    })

    // Condition due in 3 days (NOT within 48h)
    await createCondition(transaction.id, {
      title: 'Due in 3 Days',
      status: 'pending',
      dueDate: today.plus({ days: 3 }).toISO(),
      stage: 'conditions',
    })

    // Run reminders
    const result = await ReminderService.processAllReminders()

    // Should send 1 digest (both conditions are within 7 days)
    assert.equal(result.digestsSent, 1)

    // Should send 1 48h reminder (only for tomorrow's condition)
    assert.equal(result.due48hSent, 1)

    // Verify correct condition got the 48h reminder
    const due48hLogs = await ReminderLog.query()
      .where('owner_user_id', user.id)
      .where('type', 'due_48h')

    assert.equal(due48hLogs.length, 1)
  })
})
