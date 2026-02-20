import { test } from '@japa/runner'
import { cuid } from '@adonisjs/core/helpers'
import mail from '@adonisjs/mail/services/main'
import {
  truncateAll,
  createUser,
  createClient,
  createWorkflowTemplate,
  createWorkflowStep,
  createTransactionStep,
  createTransactionParty,
} from '#tests/helpers/index'
import Transaction from '#models/transaction'
import TransactionParty from '#models/transaction_party'

function withAuth(request: any, userId: number) {
  const sessionId = cuid()
  return request
    .withCookie('adonis-session', sessionId)
    .withEncryptedCookie(sessionId, { auth_web: userId })
}

async function setupTransaction() {
  const user = await createUser({ email: `party-${Date.now()}@test.com` })
  const client = await createClient(user.id)
  const template = await createWorkflowTemplate({ slug: `party-tpl-${Date.now()}` })
  const wfStep = await createWorkflowStep(template.id, { stepOrder: 1, name: 'Step 1', slug: 'step-1' })

  const transaction = await Transaction.create({
    ownerUserId: user.id,
    clientId: client.id,
    type: 'purchase',
    workflowTemplateId: template.id,
  })
  const step = await createTransactionStep(transaction.id, wfStep.id, { stepOrder: 1, status: 'active' })
  transaction.currentStepId = step.id
  await transaction.save()

  return { user, transaction }
}

test.group('Transaction Parties - CRUD', (group) => {
  group.each.setup(async () => {
    mail.fake()
    await truncateAll()
  })
  group.each.teardown(() => { mail.restore() })

  test('GET /api/transactions/:id/parties returns empty list', async ({ client }) => {
    const { user, transaction } = await setupTransaction()

    const response = await withAuth(
      client.get(`/api/transactions/${transaction.id}/parties`),
      user.id
    )

    response.assertStatus(200)
    response.assertBodyContains({ success: true, data: { parties: [] } })
  })

  test('POST /api/transactions/:id/parties creates a party', async ({ client }) => {
    const { user, transaction } = await setupTransaction()

    const response = await withAuth(
      client.post(`/api/transactions/${transaction.id}/parties`),
      user.id
    ).json({
      role: 'buyer',
      fullName: 'John Buyer',
      email: 'john@example.com',
      isPrimary: true,
    })

    response.assertStatus(201)
    response.assertBodyContains({
      success: true,
      data: { party: { fullName: 'John Buyer', role: 'buyer' } },
    })
  })

  test('POST returns 422 for missing required fields', async ({ client }) => {
    const { user, transaction } = await setupTransaction()

    const response = await withAuth(
      client.post(`/api/transactions/${transaction.id}/parties`),
      user.id
    ).json({
      email: 'noname@test.com',
    })

    response.assertStatus(422)
    response.assertBodyContains({ success: false, error: { code: 'E_VALIDATION_FAILED' } })
  })

  test('POST returns 403 for other user transaction (tenant isolation)', async ({ client }) => {
    const { transaction } = await setupTransaction()
    const otherUser = await createUser({ email: 'other@test.com' })

    const response = await withAuth(
      client.post(`/api/transactions/${transaction.id}/parties`),
      otherUser.id
    ).json({
      role: 'buyer',
      fullName: 'Hacker',
      isPrimary: false,
    })

    response.assertStatus(403)
  })

  test('PATCH /api/parties/:id updates a party', async ({ client }) => {
    const { user, transaction } = await setupTransaction()
    const party = await createTransactionParty(transaction.id, { role: 'buyer', fullName: 'Old Name' })

    const response = await withAuth(
      client.put(`/api/parties/${party.id}`),
      user.id
    ).json({
      fullName: 'New Name',
    })

    response.assertStatus(200)
    response.assertBodyContains({
      success: true,
      data: { party: { fullName: 'New Name' } },
    })
  })

  test('DELETE /api/parties/:id removes a party', async ({ client, assert }) => {
    const { user, transaction } = await setupTransaction()
    const party = await createTransactionParty(transaction.id, { role: 'buyer', fullName: 'To Delete' })

    const response = await withAuth(
      client.delete(`/api/parties/${party.id}`),
      user.id
    )

    response.assertStatus(204)

    const deleted = await TransactionParty.find(party.id)
    assert.isNull(deleted)
  })

  test('DELETE returns 404 for other user party (tenant isolation)', async ({ client }) => {
    const { transaction } = await setupTransaction()
    const otherUser = await createUser({ email: 'other2@test.com' })
    const party = await createTransactionParty(transaction.id, { role: 'buyer', fullName: 'Protected' })

    const response = await withAuth(
      client.delete(`/api/parties/${party.id}`),
      otherUser.id
    )

    response.assertStatus(404)
  })
})
