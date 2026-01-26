import { test } from '@japa/runner'
import { cuid } from '@adonisjs/core/helpers'
import {
  truncateAll,
  createUser,
  createClient,
  createTransaction,
  createCondition,
} from '#tests/helpers/index'

/**
 * Helper to create authenticated request
 */
function withAuth(request: any, userId: number) {
  const sessionId = cuid()
  return request
    .withCookie('adonis-session', sessionId)
    .withEncryptedCookie(sessionId, { auth_web: userId })
}

test.group('Transactions - CRUD', (group) => {
  group.each.setup(async () => {
    await truncateAll()
  })

  test('POST /api/transactions creates a transaction', async ({ client }) => {
    const user = await createUser({ email: 'tx@test.com' })
    const testClient = await createClient(user.id)

    const response = await withAuth(client.post('/api/transactions'), user.id).json({
      clientId: testClient.id,
      type: 'purchase',
      status: 'active',
      salePrice: 500000,
    })

    response.assertStatus(201)
    response.assertBodyContains({
      success: true,
      data: {
        transaction: {
          type: 'purchase',
          status: 'active',
        },
      },
    })
  })

  test('PATCH /api/transactions/:id/status changes status', async ({ client }) => {
    const user = await createUser({ email: 'tx@test.com' })
    const testClient = await createClient(user.id)
    const transaction = await createTransaction(user.id, testClient.id, { status: 'active' })

    const response = await withAuth(
      client.patch(`/api/transactions/${transaction.id}/status`),
      user.id
    ).json({ status: 'offer' })

    response.assertStatus(200)
    response.assertBodyContains({
      success: true,
      data: {
        transaction: {
          status: 'offer',
        },
      },
    })
  })
})

test.group('Transactions - Multi-tenancy', (group) => {
  group.each.setup(async () => {
    await truncateAll()
  })

  test('User A cannot access User B transaction', async ({ client }) => {
    // Create User A with transaction
    const userA = await createUser({ email: 'usera@test.com' })
    const clientA = await createClient(userA.id)
    const txA = await createTransaction(userA.id, clientA.id)

    // Create User B
    const userB = await createUser({ email: 'userb@test.com' })

    // User B should get 404
    const response = await withAuth(client.get(`/api/transactions/${txA.id}`), userB.id)

    response.assertStatus(404)
  })
})

test.group('Transactions - Blocking Conditions', (group) => {
  group.each.setup(async () => {
    await truncateAll()
  })

  // Use firm → closing transitions to test blocking conditions
  // (conditional → firm requires an accepted offer which is a separate concern)

  test('status change BLOCKED when pending blocking condition at current stage', async ({
    client,
  }) => {
    const user = await createUser({ email: 'blocking@test.com' })
    const testClient = await createClient(user.id)
    const transaction = await createTransaction(user.id, testClient.id, { status: 'firm' })

    // Add blocking condition at SAME stage as transaction
    await createCondition(transaction.id, {
      title: 'Final Documents',
      status: 'pending',
      stage: 'firm', // Same as transaction.status
      isBlocking: true,
    })

    // Try to advance status - should be blocked
    const response = await withAuth(
      client.patch(`/api/transactions/${transaction.id}/status`),
      user.id
    ).json({ status: 'closing' })

    response.assertStatus(400)
    response.assertBodyContains({
      success: false,
      error: {
        code: 'E_BLOCKING_CONDITIONS',
      },
    })
  })

  test('status change ALLOWED when blocking condition is completed', async ({ client }) => {
    const user = await createUser({ email: 'blocking@test.com' })
    const testClient = await createClient(user.id)
    const transaction = await createTransaction(user.id, testClient.id, { status: 'firm' })

    // Add blocking condition but mark it COMPLETED
    await createCondition(transaction.id, {
      title: 'Final Documents',
      status: 'completed', // Already done
      stage: 'firm',
      isBlocking: true,
    })

    // Status change should succeed
    const response = await withAuth(
      client.patch(`/api/transactions/${transaction.id}/status`),
      user.id
    ).json({ status: 'closing' })

    response.assertStatus(200)
  }).timeout(60000) // Extended timeout for email automation

  test('status change ALLOWED when condition is NOT blocking', async ({ client }) => {
    const user = await createUser({ email: 'blocking@test.com' })
    const testClient = await createClient(user.id)
    const transaction = await createTransaction(user.id, testClient.id, { status: 'firm' })

    // Add non-blocking condition (isBlocking = false)
    await createCondition(transaction.id, {
      title: 'Optional Inspection',
      status: 'pending',
      stage: 'firm',
      isBlocking: false, // Not blocking!
    })

    // Status change should succeed
    const response = await withAuth(
      client.patch(`/api/transactions/${transaction.id}/status`),
      user.id
    ).json({ status: 'closing' })

    response.assertStatus(200)
  }).timeout(60000) // Extended timeout for email automation

  test('status change ALLOWED when blocking condition is at DIFFERENT stage', async ({
    client,
  }) => {
    const user = await createUser({ email: 'blocking@test.com' })
    const testClient = await createClient(user.id)
    const transaction = await createTransaction(user.id, testClient.id, { status: 'firm' })

    // Add blocking condition at DIFFERENT stage
    await createCondition(transaction.id, {
      title: 'Final Walkthrough',
      status: 'pending',
      stage: 'closing', // Different from transaction.status (firm)
      isBlocking: true,
    })

    // Status change should succeed (condition is for a later stage)
    const response = await withAuth(
      client.patch(`/api/transactions/${transaction.id}/status`),
      user.id
    ).json({ status: 'closing' })

    response.assertStatus(200)
  }).timeout(60000) // Extended timeout for email automation
})
