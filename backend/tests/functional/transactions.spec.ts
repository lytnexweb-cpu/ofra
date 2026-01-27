import { test } from '@japa/runner'
import { cuid } from '@adonisjs/core/helpers'
import {
  truncateAll,
  createUser,
  createClient,
  createWorkflowTemplate,
  createWorkflowStep,
} from '#tests/helpers/index'
import { WorkflowEngineService } from '#services/workflow_engine_service'
import TransactionStep from '#models/transaction_step'
import Condition from '#models/condition'

function withAuth(request: any, userId: number) {
  const sessionId = cuid()
  return request
    .withCookie('adonis-session', sessionId)
    .withEncryptedCookie(sessionId, { auth_web: userId })
}

async function setupWorkflow() {
  const user = await createUser({ email: `tx-${Date.now()}@test.com` })
  const client = await createClient(user.id)
  const template = await createWorkflowTemplate({
    slug: `tpl-${Date.now()}`,
    transactionType: 'purchase',
  })
  await createWorkflowStep(template.id, { stepOrder: 1, name: 'Step 1', slug: `s1-${Date.now()}` })
  await createWorkflowStep(template.id, { stepOrder: 2, name: 'Step 2', slug: `s2-${Date.now()}` })
  await createWorkflowStep(template.id, { stepOrder: 3, name: 'Step 3', slug: `s3-${Date.now()}` })
  return { user, client, template }
}

test.group('Transactions - Workflow CRUD', (group) => {
  group.each.setup(async () => {
    await truncateAll()
  })

  test('POST /api/transactions creates a workflow-based transaction', async ({ client }) => {
    const { user, client: testClient, template } = await setupWorkflow()

    const response = await withAuth(client.post('/api/transactions'), user.id).json({
      clientId: testClient.id,
      workflowTemplateId: template.id,
      type: 'purchase',
      salePrice: 500000,
    })

    response.assertStatus(201)
    response.assertBodyContains({
      success: true,
      data: {
        transaction: {
          type: 'purchase',
          workflowTemplateId: template.id,
        },
      },
    })
  })

  test('GET /api/transactions/:id returns transaction with steps', async ({ client }) => {
    const { user, client: testClient, template } = await setupWorkflow()

    const tx = await WorkflowEngineService.createTransactionFromTemplate({
      templateId: template.id,
      ownerUserId: user.id,
      clientId: testClient.id,
      type: 'purchase',
    })

    const response = await withAuth(client.get(`/api/transactions/${tx.id}`), user.id)

    response.assertStatus(200)
    response.assertBodyContains({
      success: true,
      data: {
        transaction: {
          id: tx.id,
        },
      },
    })
  })

  test('PUT /api/transactions/:id updates scalar fields', async ({ client }) => {
    const { user, client: testClient, template } = await setupWorkflow()

    const tx = await WorkflowEngineService.createTransactionFromTemplate({
      templateId: template.id,
      ownerUserId: user.id,
      clientId: testClient.id,
      type: 'purchase',
    })

    const response = await withAuth(client.put(`/api/transactions/${tx.id}`), user.id).json({
      salePrice: 600000,
    })

    response.assertStatus(200)
    response.assertBodyContains({
      success: true,
      data: {
        transaction: {
          salePrice: 600000,
        },
      },
    })
  })

  test('PATCH /api/transactions/:id/advance advances the step', async ({ client }) => {
    const { user, client: testClient, template } = await setupWorkflow()

    const tx = await WorkflowEngineService.createTransactionFromTemplate({
      templateId: template.id,
      ownerUserId: user.id,
      clientId: testClient.id,
      type: 'purchase',
    })

    const response = await withAuth(
      client.patch(`/api/transactions/${tx.id}/advance`),
      user.id
    )

    response.assertStatus(200)
    response.assertBodyContains({ success: true })
  })

  test('PATCH /api/transactions/:id/advance blocks on blocking conditions', async ({
    client,
  }) => {
    const { user, client: testClient, template } = await setupWorkflow()

    const tx = await WorkflowEngineService.createTransactionFromTemplate({
      templateId: template.id,
      ownerUserId: user.id,
      clientId: testClient.id,
      type: 'purchase',
    })

    // Add blocking condition to current step
    const currentStep = await TransactionStep.query()
      .where('transactionId', tx.id)
      .where('status', 'active')
      .firstOrFail()

    await Condition.create({
      transactionId: tx.id,
      transactionStepId: currentStep.id,
      title: 'Blocking',
      type: 'financing',
      priority: 'high',
      isBlocking: true,
      status: 'pending',
    })

    const response = await withAuth(
      client.patch(`/api/transactions/${tx.id}/advance`),
      user.id
    )

    response.assertStatus(400)
    response.assertBodyContains({
      success: false,
      error: { code: 'E_BLOCKING_CONDITIONS' },
    })
  })

  test('PATCH /api/transactions/:id/skip skips the step', async ({ client }) => {
    const { user, client: testClient, template } = await setupWorkflow()

    const tx = await WorkflowEngineService.createTransactionFromTemplate({
      templateId: template.id,
      ownerUserId: user.id,
      clientId: testClient.id,
      type: 'purchase',
    })

    const response = await withAuth(
      client.patch(`/api/transactions/${tx.id}/skip`),
      user.id
    )

    response.assertStatus(200)
    response.assertBodyContains({ success: true })
  })

  test('PATCH /api/transactions/:id/goto/:stepOrder navigates to step', async ({ client }) => {
    const { user, client: testClient, template } = await setupWorkflow()

    const tx = await WorkflowEngineService.createTransactionFromTemplate({
      templateId: template.id,
      ownerUserId: user.id,
      clientId: testClient.id,
      type: 'purchase',
    })

    // Advance to step 2 first
    await WorkflowEngineService.advanceStep(tx.id, user.id)

    const response = await withAuth(
      client.patch(`/api/transactions/${tx.id}/goto/1`),
      user.id
    )

    response.assertStatus(200)
    response.assertBodyContains({ success: true })
  })

  test('GET /api/transactions/:id/activity returns activity feed', async ({ client }) => {
    const { user, client: testClient, template } = await setupWorkflow()

    const tx = await WorkflowEngineService.createTransactionFromTemplate({
      templateId: template.id,
      ownerUserId: user.id,
      clientId: testClient.id,
      type: 'purchase',
    })

    const response = await withAuth(
      client.get(`/api/transactions/${tx.id}/activity`),
      user.id
    )

    response.assertStatus(200)
    response.assertBodyContains({ success: true })
  })

  test('DELETE /api/transactions/:id deletes the transaction', async ({ client }) => {
    const { user, client: testClient, template } = await setupWorkflow()

    const tx = await WorkflowEngineService.createTransactionFromTemplate({
      templateId: template.id,
      ownerUserId: user.id,
      clientId: testClient.id,
      type: 'purchase',
    })

    const response = await withAuth(
      client.delete(`/api/transactions/${tx.id}`),
      user.id
    )

    response.assertStatus(204)
  })
})

test.group('Transactions - Multi-tenancy', (group) => {
  group.each.setup(async () => {
    await truncateAll()
  })

  test('User A cannot access User B transaction', async ({ client }) => {
    const { user: userA, client: clientA, template } = await setupWorkflow()

    const txA = await WorkflowEngineService.createTransactionFromTemplate({
      templateId: template.id,
      ownerUserId: userA.id,
      clientId: clientA.id,
      type: 'purchase',
    })

    const userB = await createUser({ email: 'userb@test.com' })

    const response = await withAuth(client.get(`/api/transactions/${txA.id}`), userB.id)
    response.assertStatus(404)
  })
})
