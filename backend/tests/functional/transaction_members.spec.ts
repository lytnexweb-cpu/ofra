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
} from '#tests/helpers/index'
import Transaction from '#models/transaction'
import TransactionMember from '#models/transaction_member'

function withAuth(request: any, userId: number) {
  const sessionId = cuid()
  return request
    .withCookie('adonis-session', sessionId)
    .withEncryptedCookie(sessionId, { auth_web: userId })
}

async function setupTransaction() {
  const user = await createUser({ email: `member-${Date.now()}@test.com` })
  const client = await createClient(user.id)
  const template = await createWorkflowTemplate({ slug: `member-tpl-${Date.now()}` })
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

test.group('Transaction Members - CRUD', (group) => {
  group.each.setup(async () => {
    mail.fake()
    await truncateAll()
  })
  group.each.teardown(() => { mail.restore() })

  test('GET /api/transactions/:transactionId/members returns owner + empty members', async ({ client, assert }) => {
    const { user, transaction } = await setupTransaction()

    const response = await withAuth(
      client.get(`/api/transactions/${transaction.id}/members`),
      user.id
    )

    response.assertStatus(200)
    response.assertBodyContains({ success: true })
    const body = response.body()
    assert.isDefined(body.data.owner)
    assert.isTrue(body.data.owner.isOwner)
    assert.deepEqual(body.data.members, [])
  })

  test('POST /api/transactions/:transactionId/members invites a member', async ({ client }) => {
    const { user, transaction } = await setupTransaction()

    const response = await withAuth(
      client.post(`/api/transactions/${transaction.id}/members`),
      user.id
    ).json({
      email: 'invited@example.com',
      role: 'viewer',
    })

    response.assertStatus(201)
    response.assertBodyContains({
      success: true,
      data: { member: { email: 'invited@example.com', role: 'viewer' } },
    })
  })

  test('POST returns 422 for missing email', async ({ client }) => {
    const { user, transaction } = await setupTransaction()

    const response = await withAuth(
      client.post(`/api/transactions/${transaction.id}/members`),
      user.id
    ).json({ role: 'viewer' })

    response.assertStatus(422)
  })

  test('POST returns 422 when inviting the transaction owner', async ({ client }) => {
    const { user, transaction } = await setupTransaction()

    const response = await withAuth(
      client.post(`/api/transactions/${transaction.id}/members`),
      user.id
    ).json({
      email: user.email,
      role: 'editor',
    })

    response.assertStatus(422)
  })

  test('POST returns 409 when inviting already-invited member', async ({ client }) => {
    const { user, transaction } = await setupTransaction()

    // First invite
    await withAuth(
      client.post(`/api/transactions/${transaction.id}/members`),
      user.id
    ).json({ email: 'dup@test.com', role: 'viewer' })

    // Duplicate invite
    const response = await withAuth(
      client.post(`/api/transactions/${transaction.id}/members`),
      user.id
    ).json({ email: 'dup@test.com', role: 'editor' })

    response.assertStatus(409)
  })

  test('POST returns 403 for non-admin member on transaction', async ({ client }) => {
    const { transaction } = await setupTransaction()
    const viewer = await createUser({ email: 'viewer-member@test.com' })

    // Add viewer as a member
    await TransactionMember.create({
      transactionId: transaction.id,
      userId: viewer.id,
      email: viewer.email,
      role: 'viewer',
      status: 'active',
      invitedBy: null,
    })

    const response = await withAuth(
      client.post(`/api/transactions/${transaction.id}/members`),
      viewer.id
    ).json({ email: 'new@test.com', role: 'viewer' })

    response.assertStatus(403)
  })

  test('PATCH /api/transactions/:transactionId/members/:id updates role', async ({ client }) => {
    const { user, transaction } = await setupTransaction()
    const invited = await createUser({ email: 'role-change@test.com' })

    const member = await TransactionMember.create({
      transactionId: transaction.id,
      userId: invited.id,
      email: invited.email,
      role: 'viewer',
      status: 'active',
      invitedBy: user.id,
    })

    const response = await withAuth(
      client.patch(`/api/transactions/${transaction.id}/members/${member.id}`),
      user.id
    ).json({ role: 'editor' })

    response.assertStatus(200)
    response.assertBodyContains({
      success: true,
      data: { member: { role: 'editor' } },
    })
  })

  test('DELETE /api/transactions/:transactionId/members/:id revokes access', async ({ client, assert }) => {
    const { user, transaction } = await setupTransaction()
    const invited = await createUser({ email: 'to-revoke@test.com' })

    const member = await TransactionMember.create({
      transactionId: transaction.id,
      userId: invited.id,
      email: invited.email,
      role: 'viewer',
      status: 'active',
      invitedBy: user.id,
    })

    const response = await withAuth(
      client.delete(`/api/transactions/${transaction.id}/members/${member.id}`),
      user.id
    )

    response.assertStatus(200)
    response.assertBodyContains({ success: true })

    // Verify status changed to revoked
    await member.refresh()
    assert.equal(member.status, 'revoked')
  })

  test('DELETE by owner revokes admin member successfully', async ({ client }) => {
    const { user, transaction } = await setupTransaction()
    const adminMember = await createUser({ email: 'admin-member@test.com' })

    const member = await TransactionMember.create({
      transactionId: transaction.id,
      userId: adminMember.id,
      email: adminMember.email,
      role: 'admin',
      status: 'active',
      invitedBy: user.id,
    })

    // Owner can revoke admin members
    const response = await withAuth(
      client.delete(`/api/transactions/${transaction.id}/members/${member.id}`),
      user.id
    )

    response.assertStatus(200)
    response.assertBodyContains({ success: true })
  })
})
