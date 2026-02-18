import { test } from '@japa/runner'
import { cuid } from '@adonisjs/core/helpers'
import {
  truncateAll,
  createUser,
  createClient,
  createWorkflowTemplate,
  createWorkflowStep,
  createTransactionStep,
} from '#tests/helpers/index'
import Transaction from '#models/transaction'
import TransactionDocument from '#models/transaction_document'

function withAuth(request: any, userId: number) {
  const sessionId = cuid()
  return request
    .withCookie('adonis-session', sessionId)
    .withEncryptedCookie(sessionId, { auth_web: userId })
}

async function setupTransaction() {
  const user = await createUser({ email: `doc-${Date.now()}@test.com` })
  const client = await createClient(user.id)
  const template = await createWorkflowTemplate({ slug: `doc-tpl-${Date.now()}` })
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

test.group('Transaction Documents - CRUD', (group) => {
  group.each.setup(async () => {
    await truncateAll()
  })

  test('GET /api/transactions/:id/documents returns empty list', async ({ client }) => {
    const { user, transaction } = await setupTransaction()

    const response = await withAuth(
      client.get(`/api/transactions/${transaction.id}/documents`),
      user.id
    )

    response.assertStatus(200)
    response.assertBodyContains({ success: true, data: { documents: [] } })
  })

  test('POST /api/transactions/:id/documents creates a document', async ({ client }) => {
    const { user, transaction } = await setupTransaction()

    const response = await withAuth(
      client.post(`/api/transactions/${transaction.id}/documents`),
      user.id
    ).json({
      name: 'Inspection Report',
      category: 'inspection',
    })

    response.assertStatus(201)
    response.assertBodyContains({
      success: true,
      data: { document: { name: 'Inspection Report', category: 'inspection' } },
    })
  })

  test('POST returns 422 for missing required fields', async ({ client }) => {
    const { user, transaction } = await setupTransaction()

    const response = await withAuth(
      client.post(`/api/transactions/${transaction.id}/documents`),
      user.id
    ).json({})

    response.assertStatus(422)
  })

  test('GET /api/documents/:id returns a single document', async ({ client }) => {
    const { user, transaction } = await setupTransaction()

    const doc = await TransactionDocument.create({
      transactionId: transaction.id,
      name: 'Test Doc',
      category: 'other',
      status: 'missing',
      uploadedBy: user.id,
    })

    const response = await withAuth(
      client.get(`/api/documents/${doc.id}`),
      user.id
    )

    response.assertStatus(200)
    response.assertBodyContains({
      success: true,
      data: { document: { name: 'Test Doc' } },
    })
  })

  test('GET /api/documents/:id returns 404 for other user (tenant isolation)', async ({ client }) => {
    const { transaction } = await setupTransaction()
    const otherUser = await createUser({ email: 'other-doc@test.com' })

    const doc = await TransactionDocument.create({
      transactionId: transaction.id,
      name: 'Private Doc',
      category: 'legal',
      status: 'missing',
      uploadedBy: otherUser.id,
    })

    const response = await withAuth(
      client.get(`/api/documents/${doc.id}`),
      otherUser.id
    )

    response.assertStatus(404)
  })

  test('PUT /api/documents/:id updates a document', async ({ client }) => {
    const { user, transaction } = await setupTransaction()

    const doc = await TransactionDocument.create({
      transactionId: transaction.id,
      name: 'Old Name',
      category: 'other',
      status: 'missing',
      uploadedBy: user.id,
    })

    const response = await withAuth(
      client.put(`/api/documents/${doc.id}`),
      user.id
    ).json({ name: 'New Name' })

    response.assertStatus(200)
    response.assertBodyContains({
      success: true,
      data: { document: { name: 'New Name' } },
    })
  })

  test('PATCH /api/documents/:id/validate validates a document', async ({ client }) => {
    const { user, transaction } = await setupTransaction()

    const doc = await TransactionDocument.create({
      transactionId: transaction.id,
      name: 'To Validate',
      category: 'identity',
      status: 'uploaded',
      uploadedBy: user.id,
    })

    const response = await withAuth(
      client.patch(`/api/documents/${doc.id}/validate`),
      user.id
    )

    response.assertStatus(200)
    response.assertBodyContains({
      success: true,
      data: { document: { status: 'validated' } },
    })
  })

  test('PATCH /api/documents/:id/reject rejects a document with reason', async ({ client }) => {
    const { user, transaction } = await setupTransaction()

    const doc = await TransactionDocument.create({
      transactionId: transaction.id,
      name: 'To Reject',
      category: 'financing',
      status: 'uploaded',
      uploadedBy: user.id,
    })

    const response = await withAuth(
      client.patch(`/api/documents/${doc.id}/reject`),
      user.id
    ).json({ reason: 'Blurry scan' })

    response.assertStatus(200)
    response.assertBodyContains({
      success: true,
      data: { document: { status: 'rejected', rejectionReason: 'Blurry scan' } },
    })
  })

  test('DELETE /api/documents/:id removes a document', async ({ client, assert }) => {
    const { user, transaction } = await setupTransaction()

    const doc = await TransactionDocument.create({
      transactionId: transaction.id,
      name: 'To Delete',
      category: 'other',
      status: 'missing',
      uploadedBy: user.id,
    })

    const response = await withAuth(
      client.delete(`/api/documents/${doc.id}`),
      user.id
    )

    response.assertStatus(204)

    const deleted = await TransactionDocument.find(doc.id)
    assert.isNull(deleted)
  })
})
