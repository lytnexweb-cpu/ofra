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
import { DateTime } from 'luxon'

function withAuth(request: any, userId: number) {
  const sessionId = cuid()
  return request
    .withCookie('adonis-session', sessionId)
    .withEncryptedCookie(sessionId, { auth_web: userId })
}

test.group('Conditions - Workflow', (group) => {
  group.each.setup(async () => {
    await truncateAll()
  })

  test('POST /api/transactions/:id/conditions creates linked to step', async ({ client }) => {
    const user = await createUser({ email: 'cond@test.com' })
    const testClient = await createClient(user.id)
    const template = await createWorkflowTemplate({ slug: 'cond-tpl' })
    await createWorkflowStep(template.id, { stepOrder: 1, name: 'Step 1', slug: 'cond-step-1' })

    const tx = await WorkflowEngineService.createTransactionFromTemplate({
      templateId: template.id,
      ownerUserId: user.id,
      clientId: testClient.id,
      type: 'purchase',
    })

    const response = await withAuth(
      client.post(`/api/transactions/${tx.id}/conditions`),
      user.id
    ).json({
      title: 'Financing Condition',
      dueDate: DateTime.now().plus({ days: 14 }).toISO(),
      type: 'financing',
      priority: 'high',
      isBlocking: true,
    })

    response.assertStatus(201)
    response.assertBodyContains({
      success: true,
      data: {
        condition: {
          title: 'Financing Condition',
          status: 'pending',
        },
      },
    })
  })

  test('PATCH /api/conditions/:id/complete marks condition as completed', async ({ client }) => {
    const user = await createUser({ email: 'cond2@test.com' })
    const testClient = await createClient(user.id)
    const template = await createWorkflowTemplate({ slug: 'cond-tpl-2' })
    await createWorkflowStep(template.id, { stepOrder: 1, name: 'Step 1', slug: 'cond2-step-1' })

    const tx = await WorkflowEngineService.createTransactionFromTemplate({
      templateId: template.id,
      ownerUserId: user.id,
      clientId: testClient.id,
      type: 'purchase',
    })

    const currentStep = await TransactionStep.query()
      .where('transactionId', tx.id)
      .where('status', 'active')
      .firstOrFail()

    const condition = await Condition.create({
      transactionId: tx.id,
      transactionStepId: currentStep.id,
      title: 'Test Condition',
      type: 'financing',
      priority: 'high',
      isBlocking: true,
      status: 'pending',
    })

    const response = await withAuth(
      client.patch(`/api/conditions/${condition.id}/complete`),
      user.id
    )

    response.assertStatus(200)
    response.assertBodyContains({
      success: true,
      data: {
        condition: {
          status: 'completed',
        },
      },
    })
  })

  test('blocking condition prevents step advance', async ({ assert }) => {
    const user = await createUser({ email: 'cond3@test.com' })
    const testClient = await createClient(user.id)
    const template = await createWorkflowTemplate({ slug: 'cond-tpl-3' })
    await createWorkflowStep(template.id, { stepOrder: 1, name: 'Step 1', slug: 'cond3-step-1' })
    await createWorkflowStep(template.id, { stepOrder: 2, name: 'Step 2', slug: 'cond3-step-2' })

    const tx = await WorkflowEngineService.createTransactionFromTemplate({
      templateId: template.id,
      ownerUserId: user.id,
      clientId: testClient.id,
      type: 'purchase',
    })

    const currentStep = await TransactionStep.query()
      .where('transactionId', tx.id)
      .where('status', 'active')
      .firstOrFail()

    await Condition.create({
      transactionId: tx.id,
      transactionStepId: currentStep.id,
      title: 'Blocking Condition',
      type: 'financing',
      priority: 'high',
      isBlocking: true,
      status: 'pending',
    })

    try {
      await WorkflowEngineService.advanceStep(tx.id, user.id)
      assert.fail('Should have thrown')
    } catch (error) {
      assert.equal(error.code, 'E_BLOCKING_CONDITIONS')
    }

    // Now complete the condition and try again
    const cond = await Condition.query()
      .where('transactionId', tx.id)
      .where('isBlocking', true)
      .firstOrFail()
    cond.status = 'completed'
    cond.completedAt = DateTime.now()
    await cond.save()

    const result = await WorkflowEngineService.advanceStep(tx.id, user.id)
    assert.isNotNull(result.newStep)
  })

  test('DELETE /api/conditions/:id removes condition', async ({ client }) => {
    const user = await createUser({ email: 'cond4@test.com' })
    const testClient = await createClient(user.id)
    const template = await createWorkflowTemplate({ slug: 'cond-tpl-4' })
    await createWorkflowStep(template.id, { stepOrder: 1, name: 'Step 1', slug: 'cond4-step-1' })

    const tx = await WorkflowEngineService.createTransactionFromTemplate({
      templateId: template.id,
      ownerUserId: user.id,
      clientId: testClient.id,
      type: 'purchase',
    })

    const condition = await Condition.create({
      transactionId: tx.id,
      title: 'To Delete',
      type: 'other',
      priority: 'low',
      isBlocking: false,
      status: 'pending',
    })

    const response = await withAuth(
      client.delete(`/api/conditions/${condition.id}`),
      user.id
    )

    response.assertStatus(204)
  })
})
