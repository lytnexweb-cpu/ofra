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
import Plan from '#models/plan'
import ActivityFeed from '#models/activity_feed'

function withAuth(request: any, userId: number) {
  const sessionId = cuid()
  return request
    .withCookie('adonis-session', sessionId)
    .withEncryptedCookie(sessionId, { auth_web: userId })
}

async function setupTransaction(userOverrides: Record<string, any> = {}) {
  const user = await createUser({ email: `export-${Date.now()}@test.com`, ...userOverrides })
  const client = await createClient(user.id)
  const template = await createWorkflowTemplate({ slug: `export-tpl-${Date.now()}` })
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

  return { user, client, transaction }
}

test.group('Export Controller - PDF', (group) => {
  group.each.setup(async () => {
    await truncateAll()
  })

  test('POST /api/transactions/:id/export/pdf returns PDF binary', async ({ client, assert }) => {
    const { user, transaction } = await setupTransaction()

    const response = await withAuth(
      client.post(`/api/transactions/${transaction.id}/export/pdf`),
      user.id
    ).json({})

    response.assertStatus(200)
    assert.equal(response.header('content-type'), 'application/pdf')
    assert.match(response.header('content-disposition'), /attachment; filename="Transaction_/)
  })

  test('POST /api/transactions/:id/export/pdf with custom options', async ({ client, assert }) => {
    const { user, transaction } = await setupTransaction()

    const response = await withAuth(
      client.post(`/api/transactions/${transaction.id}/export/pdf`),
      user.id
    ).json({
      includeOffers: false,
      includeConditions: false,
      includeDocuments: true,
      includeActivity: true,
      watermark: false,
      language: 'en',
    })

    response.assertStatus(200)
    assert.equal(response.header('content-type'), 'application/pdf')
  })

  test('POST /api/transactions/:id/export/pdf returns 404 for non-existent transaction', async ({ client }) => {
    const { user } = await setupTransaction()

    const response = await withAuth(
      client.post(`/api/transactions/99999/export/pdf`),
      user.id
    ).json({})

    response.assertStatus(404)
    response.assertBodyContains({ success: false, error: { code: 'E_NOT_FOUND' } })
  })

  test('POST /api/transactions/:id/export/pdf returns 403 for other user transaction (tenant isolation)', async ({ client }) => {
    const { transaction } = await setupTransaction()
    const otherUser = await createUser({ email: 'other-export@test.com' })

    const response = await withAuth(
      client.post(`/api/transactions/${transaction.id}/export/pdf`),
      otherUser.id
    ).json({})

    response.assertStatus(403)
  })

  test('POST /api/transactions/:id/export/pdf returns 403 for starter plan after 3 exports/month', async ({ client, assert }) => {
    // Create a starter plan
    const starterPlan = await Plan.create({
      name: 'Starter',
      slug: 'starter',
      monthlyPrice: 2900,
      annualPrice: 29000,
      maxTransactions: 5,
      maxStorageGb: 1,
      maxUsers: 1,
      historyMonths: 12,
      isActive: true,
      displayOrder: 1,
    })

    const user = await createUser({ email: `starter-export-${Date.now()}@test.com` })
    // Assign starter plan to user
    user.planId = starterPlan.id
    await user.save()

    const userClient = await createClient(user.id)
    const template = await createWorkflowTemplate({ slug: `starter-tpl-${Date.now()}` })
    const wfStep = await createWorkflowStep(template.id, { stepOrder: 1, name: 'Step 1', slug: 'step-1' })

    const transaction = await Transaction.create({
      ownerUserId: user.id,
      clientId: userClient.id,
      type: 'purchase',
      workflowTemplateId: template.id,
    })
    const step = await createTransactionStep(transaction.id, wfStep.id, { stepOrder: 1, status: 'active' })
    transaction.currentStepId = step.id
    await transaction.save()

    // Create 3 existing pdf_exported activities this month
    for (let i = 0; i < 3; i++) {
      await ActivityFeed.create({
        transactionId: transaction.id,
        userId: user.id,
        activityType: 'pdf_exported' as any,
        metadata: { language: 'fr' },
      })
    }

    const response = await withAuth(
      client.post(`/api/transactions/${transaction.id}/export/pdf`),
      user.id
    ).json({})

    response.assertStatus(403)
    const body = response.body()
    assert.equal(body.error.code, 'E_PLAN_LIMIT_PDF_EXPORTS')
    assert.equal(body.error.meta.used, 3)
    assert.equal(body.error.meta.limit, 3)
  })

  test('POST /api/transactions/:id/export/pdf allows non-starter plan unlimited exports', async ({ client }) => {
    // Create a pro plan
    const proPlan = await Plan.create({
      name: 'Pro',
      slug: 'pro',
      monthlyPrice: 7900,
      annualPrice: 79000,
      maxTransactions: null,
      maxStorageGb: 10,
      maxUsers: 5,
      historyMonths: null,
      isActive: true,
      displayOrder: 3,
    })

    const user = await createUser({ email: `pro-export-${Date.now()}@test.com` })
    user.planId = proPlan.id
    await user.save()

    const userClient = await createClient(user.id)
    const template = await createWorkflowTemplate({ slug: `pro-tpl-${Date.now()}` })
    const wfStep = await createWorkflowStep(template.id, { stepOrder: 1, name: 'Step 1', slug: 'step-1' })

    const transaction = await Transaction.create({
      ownerUserId: user.id,
      clientId: userClient.id,
      type: 'purchase',
      workflowTemplateId: template.id,
    })
    const step = await createTransactionStep(transaction.id, wfStep.id, { stepOrder: 1, status: 'active' })
    transaction.currentStepId = step.id
    await transaction.save()

    // Create 10 existing pdf_exported activities
    for (let i = 0; i < 10; i++) {
      await ActivityFeed.create({
        transactionId: transaction.id,
        userId: user.id,
        activityType: 'pdf_exported' as any,
        metadata: { language: 'fr' },
      })
    }

    const response = await withAuth(
      client.post(`/api/transactions/${transaction.id}/export/pdf`),
      user.id
    ).json({})

    // Pro plan has no limit — should succeed
    response.assertStatus(200)
  })

  test('POST /api/transactions/:id/export/pdf returns 401 for unauthenticated', async ({ client }) => {
    const response = await client.post('/api/transactions/1/export/pdf').json({})
    response.assertStatus(401)
  })
})

test.group('Export Controller - Email', (group) => {
  group.each.setup(async () => {
    mail.fake()
    await truncateAll()
  })
  group.each.teardown(() => { mail.restore() })

  test('POST /api/transactions/:id/export/email sends recap and returns success', async ({ client }) => {
    const { user, transaction } = await setupTransaction()

    const response = await withAuth(
      client.post(`/api/transactions/${transaction.id}/export/email`),
      user.id
    ).json({
      recipients: ['buyer@example.com', 'lawyer@example.com'],
      subject: 'Transaction recap',
      message: 'Here is the recap of your transaction.',
    })

    response.assertStatus(200)
    response.assertBodyContains({
      success: true,
      data: {
        sent: true,
        recipients: ['buyer@example.com', 'lawyer@example.com'],
      },
    })
  })

  test('POST /api/transactions/:id/export/email with minimal payload (recipients only)', async ({ client }) => {
    const { user, transaction } = await setupTransaction()

    const response = await withAuth(
      client.post(`/api/transactions/${transaction.id}/export/email`),
      user.id
    ).json({
      recipients: ['single@example.com'],
    })

    response.assertStatus(200)
    response.assertBodyContains({ success: true, data: { sent: true } })
  })

  test('POST /api/transactions/:id/export/email returns 422 for empty recipients', async ({ client }) => {
    const { user, transaction } = await setupTransaction()

    const response = await withAuth(
      client.post(`/api/transactions/${transaction.id}/export/email`),
      user.id
    ).json({
      recipients: [],
    })

    response.assertStatus(422)
  })

  test('POST /api/transactions/:id/export/email returns 422 for missing recipients', async ({ client }) => {
    const { user, transaction } = await setupTransaction()

    const response = await withAuth(
      client.post(`/api/transactions/${transaction.id}/export/email`),
      user.id
    ).json({})

    response.assertStatus(422)
  })

  test('POST /api/transactions/:id/export/email returns 422 for invalid email format', async ({ client }) => {
    const { user, transaction } = await setupTransaction()

    const response = await withAuth(
      client.post(`/api/transactions/${transaction.id}/export/email`),
      user.id
    ).json({
      recipients: ['not-an-email'],
    })

    response.assertStatus(422)
  })

  test('POST /api/transactions/:id/export/email returns 422 for >10 recipients', async ({ client }) => {
    const { user, transaction } = await setupTransaction()
    const recipients = Array.from({ length: 11 }, (_, i) => `r${i}@test.com`)

    const response = await withAuth(
      client.post(`/api/transactions/${transaction.id}/export/email`),
      user.id
    ).json({ recipients })

    response.assertStatus(422)
  })

  test('POST /api/transactions/:id/export/email returns 404 for non-existent transaction', async ({ client }) => {
    const { user } = await setupTransaction()

    const response = await withAuth(
      client.post(`/api/transactions/99999/export/email`),
      user.id
    ).json({
      recipients: ['test@example.com'],
    })

    response.assertStatus(404)
    response.assertBodyContains({ success: false, error: { code: 'E_NOT_FOUND' } })
  })

  test('POST /api/transactions/:id/export/email returns 403 for other user transaction (tenant isolation)', async ({ client }) => {
    const { transaction } = await setupTransaction()
    const otherUser = await createUser({ email: 'other-email-export@test.com' })

    const response = await withAuth(
      client.post(`/api/transactions/${transaction.id}/export/email`),
      otherUser.id
    ).json({
      recipients: ['test@example.com'],
    })

    response.assertStatus(403)
  })

  test('POST /api/transactions/:id/export/email returns 401 for unauthenticated', async ({ client }) => {
    const response = await client.post('/api/transactions/1/export/email').json({
      recipients: ['test@example.com'],
    })
    response.assertStatus(401)
  })
})
