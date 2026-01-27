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
import { ActivityFeedService } from '#services/activity_feed_service'
import ActivityFeed from '#models/activity_feed'

function withAuth(request: any, userId: number) {
  const sessionId = cuid()
  return request
    .withCookie('adonis-session', sessionId)
    .withEncryptedCookie(sessionId, { auth_web: userId })
}

test.group('Activity Feed', (group) => {
  group.each.setup(async () => {
    await truncateAll()
  })

  test('ActivityFeedService.log creates an activity entry', async ({ assert }) => {
    const user = await createUser({ email: 'af@test.com' })
    const client = await createClient(user.id)
    const template = await createWorkflowTemplate({ slug: 'af-tpl' })
    await createWorkflowStep(template.id, { stepOrder: 1, name: 'Step 1', slug: 'af-step-1' })

    const tx = await WorkflowEngineService.createTransactionFromTemplate({
      templateId: template.id,
      ownerUserId: user.id,
      clientId: client.id,
      type: 'purchase',
    })

    await ActivityFeedService.log({
      transactionId: tx.id,
      userId: user.id,
      activityType: 'note_added',
      metadata: { note: 'Test note' },
    })

    const activities = await ActivityFeed.query()
      .where('transactionId', tx.id)
      .where('activityType', 'note_added')

    assert.equal(activities.length, 1)
    assert.equal(activities[0].metadata.note, 'Test note')
  })

  test('activities are returned in descending order', async ({ assert }) => {
    const user = await createUser({ email: 'af2@test.com' })
    const client = await createClient(user.id)
    const template = await createWorkflowTemplate({ slug: 'af-tpl-2' })
    await createWorkflowStep(template.id, { stepOrder: 1, name: 'Step 1', slug: 'af2-step-1' })
    await createWorkflowStep(template.id, { stepOrder: 2, name: 'Step 2', slug: 'af2-step-2' })

    const tx = await WorkflowEngineService.createTransactionFromTemplate({
      templateId: template.id,
      ownerUserId: user.id,
      clientId: client.id,
      type: 'purchase',
    })

    // Advance generates more activity
    await WorkflowEngineService.advanceStep(tx.id, user.id)

    const result = await ActivityFeedService.getForTransaction(tx.id, 1, 50)

    assert.isAbove(result.total, 0)
    // Check descending order
    const dates = result.all().map((a) => a.createdAt.toMillis())
    for (let i = 1; i < dates.length; i++) {
      assert.isTrue(dates[i - 1] >= dates[i])
    }
  })

  test('GET /api/transactions/:id/activity returns paginated feed', async ({ client }) => {
    const user = await createUser({ email: 'af3@test.com' })
    const testClient = await createClient(user.id)
    const template = await createWorkflowTemplate({ slug: 'af-tpl-3' })
    await createWorkflowStep(template.id, { stepOrder: 1, name: 'Step 1', slug: 'af3-step-1' })

    const tx = await WorkflowEngineService.createTransactionFromTemplate({
      templateId: template.id,
      ownerUserId: user.id,
      clientId: testClient.id,
      type: 'purchase',
    })

    const response = await withAuth(
      client.get(`/api/transactions/${tx.id}/activity?page=1&limit=5`),
      user.id
    )

    response.assertStatus(200)
    response.assertBodyContains({ success: true })
  })

  test('activity feed includes transaction_created and step_entered on create', async ({
    assert,
  }) => {
    const user = await createUser({ email: 'af4@test.com' })
    const client = await createClient(user.id)
    const template = await createWorkflowTemplate({ slug: 'af-tpl-4' })
    await createWorkflowStep(template.id, { stepOrder: 1, name: 'Step 1', slug: 'af4-step-1' })

    const tx = await WorkflowEngineService.createTransactionFromTemplate({
      templateId: template.id,
      ownerUserId: user.id,
      clientId: client.id,
      type: 'purchase',
    })

    const activities = await ActivityFeed.query()
      .where('transactionId', tx.id)
      .orderBy('createdAt', 'asc')

    const types = activities.map((a) => a.activityType)
    assert.include(types, 'transaction_created')
    assert.include(types, 'step_entered')
  })
})
