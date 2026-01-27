import { test } from '@japa/runner'
import {
  truncateAll,
  createUser,
  createClient,
  createWorkflowTemplate,
  createWorkflowStep,
} from '#tests/helpers/index'
import { WorkflowEngineService } from '#services/workflow_engine_service'
import WorkflowStepCondition from '#models/workflow_step_condition'
import TransactionStep from '#models/transaction_step'
import ActivityFeed from '#models/activity_feed'
import Condition from '#models/condition'

test.group('WorkflowEngineService', (group) => {
  group.each.setup(async () => {
    await truncateAll()
  })

  test('createTransactionFromTemplate creates transaction with all steps', async ({ assert }) => {
    const user = await createUser({ email: 'engine@test.com' })
    const client = await createClient(user.id)
    const template = await createWorkflowTemplate({ slug: 'test-tpl-1' })
    await createWorkflowStep(template.id, { stepOrder: 1, name: 'Step 1', slug: 'step-1' })
    await createWorkflowStep(template.id, { stepOrder: 2, name: 'Step 2', slug: 'step-2' })
    await createWorkflowStep(template.id, { stepOrder: 3, name: 'Step 3', slug: 'step-3' })

    const tx = await WorkflowEngineService.createTransactionFromTemplate({
      templateId: template.id,
      ownerUserId: user.id,
      clientId: client.id,
      type: 'purchase',
    })

    assert.equal(tx.workflowTemplateId, template.id)
    assert.isNotNull(tx.currentStepId)

    const steps = await TransactionStep.query()
      .where('transactionId', tx.id)
      .orderBy('step_order', 'asc')

    assert.equal(steps.length, 3)
    assert.equal(steps[0].status, 'active')
    assert.equal(steps[1].status, 'pending')
    assert.equal(steps[2].status, 'pending')
  })

  test('createTransactionFromTemplate creates conditions from step template', async ({
    assert,
  }) => {
    const user = await createUser({ email: 'engine2@test.com' })
    const client = await createClient(user.id)
    const template = await createWorkflowTemplate({ slug: 'test-tpl-2' })
    const step1 = await createWorkflowStep(template.id, {
      stepOrder: 1,
      name: 'Step 1',
      slug: 'step-1-cond',
    })

    // Add template conditions to step 1
    await WorkflowStepCondition.create({
      stepId: step1.id,
      title: 'Financing',
      conditionType: 'financing',
      priority: 'high',
      isBlockingDefault: true,
      isRequired: true,
      dueDateOffsetDays: 14,
      sortOrder: 1,
    })

    const tx = await WorkflowEngineService.createTransactionFromTemplate({
      templateId: template.id,
      ownerUserId: user.id,
      clientId: client.id,
      type: 'purchase',
    })

    const conditions = await Condition.query().where('transactionId', tx.id)
    assert.equal(conditions.length, 1)
    assert.equal(conditions[0].title, 'Financing')
    assert.equal(conditions[0].isBlocking, true)
    assert.equal(conditions[0].status, 'pending')
  })

  test('advanceStep completes current step and activates next', async ({ assert }) => {
    const user = await createUser({ email: 'advance@test.com' })
    const client = await createClient(user.id)
    const template = await createWorkflowTemplate({ slug: 'test-tpl-3' })
    await createWorkflowStep(template.id, { stepOrder: 1, name: 'Step 1', slug: 'adv-step-1' })
    await createWorkflowStep(template.id, { stepOrder: 2, name: 'Step 2', slug: 'adv-step-2' })

    const tx = await WorkflowEngineService.createTransactionFromTemplate({
      templateId: template.id,
      ownerUserId: user.id,
      clientId: client.id,
      type: 'purchase',
    })

    const result = await WorkflowEngineService.advanceStep(tx.id, user.id)

    assert.isNotNull(result.newStep)
    assert.equal(result.newStep!.stepOrder, 2)
    assert.equal(result.newStep!.status, 'active')

    // Old step should be completed
    const steps = await TransactionStep.query()
      .where('transactionId', tx.id)
      .orderBy('step_order', 'asc')
    assert.equal(steps[0].status, 'completed')
    assert.equal(steps[1].status, 'active')
  })

  test('advanceStep blocks when blocking conditions are pending', async ({ assert }) => {
    const user = await createUser({ email: 'block@test.com' })
    const client = await createClient(user.id)
    const template = await createWorkflowTemplate({ slug: 'test-tpl-4' })
    await createWorkflowStep(template.id, { stepOrder: 1, name: 'Step 1', slug: 'blk-step-1' })
    await createWorkflowStep(template.id, { stepOrder: 2, name: 'Step 2', slug: 'blk-step-2' })

    const tx = await WorkflowEngineService.createTransactionFromTemplate({
      templateId: template.id,
      ownerUserId: user.id,
      clientId: client.id,
      type: 'purchase',
    })

    // Add a blocking condition to the current step
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
  })

  test('advanceStep succeeds when blocking conditions are completed', async ({ assert }) => {
    const user = await createUser({ email: 'block2@test.com' })
    const client = await createClient(user.id)
    const template = await createWorkflowTemplate({ slug: 'test-tpl-5' })
    await createWorkflowStep(template.id, { stepOrder: 1, name: 'Step 1', slug: 'blk2-step-1' })
    await createWorkflowStep(template.id, { stepOrder: 2, name: 'Step 2', slug: 'blk2-step-2' })

    const tx = await WorkflowEngineService.createTransactionFromTemplate({
      templateId: template.id,
      ownerUserId: user.id,
      clientId: client.id,
      type: 'purchase',
    })

    const currentStep = await TransactionStep.query()
      .where('transactionId', tx.id)
      .where('status', 'active')
      .firstOrFail()

    await Condition.create({
      transactionId: tx.id,
      transactionStepId: currentStep.id,
      title: 'Completed Blocking Condition',
      type: 'financing',
      priority: 'high',
      isBlocking: true,
      status: 'completed',
    })

    const result = await WorkflowEngineService.advanceStep(tx.id, user.id)
    assert.isNotNull(result.newStep)
  })

  test('skipStep skips current step without blocking check', async ({ assert }) => {
    const user = await createUser({ email: 'skip@test.com' })
    const client = await createClient(user.id)
    const template = await createWorkflowTemplate({ slug: 'test-tpl-6' })
    await createWorkflowStep(template.id, { stepOrder: 1, name: 'Step 1', slug: 'skip-step-1' })
    await createWorkflowStep(template.id, { stepOrder: 2, name: 'Step 2', slug: 'skip-step-2' })

    const tx = await WorkflowEngineService.createTransactionFromTemplate({
      templateId: template.id,
      ownerUserId: user.id,
      clientId: client.id,
      type: 'purchase',
    })

    const result = await WorkflowEngineService.skipStep(tx.id, user.id)

    assert.isNotNull(result.newStep)
    assert.equal(result.newStep!.stepOrder, 2)

    const steps = await TransactionStep.query()
      .where('transactionId', tx.id)
      .orderBy('step_order', 'asc')
    assert.equal(steps[0].status, 'skipped')
    assert.equal(steps[1].status, 'active')
  })

  test('goToStep navigates to a specific step', async ({ assert }) => {
    const user = await createUser({ email: 'goto@test.com' })
    const client = await createClient(user.id)
    const template = await createWorkflowTemplate({ slug: 'test-tpl-7' })
    await createWorkflowStep(template.id, { stepOrder: 1, name: 'Step 1', slug: 'goto-step-1' })
    await createWorkflowStep(template.id, { stepOrder: 2, name: 'Step 2', slug: 'goto-step-2' })
    await createWorkflowStep(template.id, { stepOrder: 3, name: 'Step 3', slug: 'goto-step-3' })

    const tx = await WorkflowEngineService.createTransactionFromTemplate({
      templateId: template.id,
      ownerUserId: user.id,
      clientId: client.id,
      type: 'purchase',
    })

    // Advance to step 2
    await WorkflowEngineService.advanceStep(tx.id, user.id)
    // Advance to step 3
    await WorkflowEngineService.advanceStep(tx.id, user.id)

    // Go back to step 1
    const result = await WorkflowEngineService.goToStep(tx.id, 1, user.id)
    assert.equal(result.newStep.stepOrder, 1)
    assert.equal(result.newStep.status, 'active')
  })

  test('advanceStep at last step sets currentStepId to null', async ({ assert }) => {
    const user = await createUser({ email: 'last@test.com' })
    const client = await createClient(user.id)
    const template = await createWorkflowTemplate({ slug: 'test-tpl-8' })
    await createWorkflowStep(template.id, { stepOrder: 1, name: 'Only Step', slug: 'last-step-1' })

    const tx = await WorkflowEngineService.createTransactionFromTemplate({
      templateId: template.id,
      ownerUserId: user.id,
      clientId: client.id,
      type: 'purchase',
    })

    const result = await WorkflowEngineService.advanceStep(tx.id, user.id)
    assert.isNull(result.newStep)

    await tx.refresh()
    assert.isNull(tx.currentStepId)
  })

  test('createTransactionFromTemplate logs activities', async ({ assert }) => {
    const user = await createUser({ email: 'activity@test.com' })
    const client = await createClient(user.id)
    const template = await createWorkflowTemplate({ slug: 'test-tpl-9' })
    await createWorkflowStep(template.id, { stepOrder: 1, name: 'Step 1', slug: 'act-step-1' })

    const tx = await WorkflowEngineService.createTransactionFromTemplate({
      templateId: template.id,
      ownerUserId: user.id,
      clientId: client.id,
      type: 'purchase',
    })

    const activities = await ActivityFeed.query()
      .where('transactionId', tx.id)
      .orderBy('createdAt', 'asc')

    assert.isAbove(activities.length, 0)
    const types = activities.map((a) => a.activityType)
    assert.include(types, 'transaction_created')
    assert.include(types, 'step_entered')
  })

  test('getCurrentStatus returns correct progress info', async ({ assert }) => {
    const user = await createUser({ email: 'status@test.com' })
    const client = await createClient(user.id)
    const template = await createWorkflowTemplate({ slug: 'test-tpl-10' })
    await createWorkflowStep(template.id, { stepOrder: 1, name: 'Step 1', slug: 'stat-step-1' })
    await createWorkflowStep(template.id, { stepOrder: 2, name: 'Step 2', slug: 'stat-step-2' })
    await createWorkflowStep(template.id, { stepOrder: 3, name: 'Step 3', slug: 'stat-step-3' })
    await createWorkflowStep(template.id, { stepOrder: 4, name: 'Step 4', slug: 'stat-step-4' })

    const tx = await WorkflowEngineService.createTransactionFromTemplate({
      templateId: template.id,
      ownerUserId: user.id,
      clientId: client.id,
      type: 'purchase',
    })

    // Advance once (1 completed, 1 active, 2 pending)
    await WorkflowEngineService.advanceStep(tx.id, user.id)

    const status = await WorkflowEngineService.getCurrentStatus(tx.id)
    assert.equal(status.totalSteps, 4)
    assert.equal(status.completedSteps, 1)
    assert.equal(status.progress, 25)
    assert.equal(status.currentStepOrder, 2)
  })

  test('checkBlockingConditions returns only pending blocking conditions', async ({
    assert,
  }) => {
    const user = await createUser({ email: 'check@test.com' })
    const client = await createClient(user.id)
    const template = await createWorkflowTemplate({ slug: 'test-tpl-11' })
    await createWorkflowStep(template.id, { stepOrder: 1, name: 'Step 1', slug: 'chk-step-1' })

    const tx = await WorkflowEngineService.createTransactionFromTemplate({
      templateId: template.id,
      ownerUserId: user.id,
      clientId: client.id,
      type: 'purchase',
    })

    const currentStep = await TransactionStep.query()
      .where('transactionId', tx.id)
      .where('status', 'active')
      .firstOrFail()

    // Create various conditions
    await Condition.create({
      transactionId: tx.id,
      transactionStepId: currentStep.id,
      title: 'Blocking Pending',
      type: 'financing',
      priority: 'high',
      isBlocking: true,
      status: 'pending',
    })
    await Condition.create({
      transactionId: tx.id,
      transactionStepId: currentStep.id,
      title: 'Blocking Completed',
      type: 'inspection',
      priority: 'high',
      isBlocking: true,
      status: 'completed',
    })
    await Condition.create({
      transactionId: tx.id,
      transactionStepId: currentStep.id,
      title: 'Non-Blocking Pending',
      type: 'other',
      priority: 'low',
      isBlocking: false,
      status: 'pending',
    })

    const blocking = await WorkflowEngineService.checkBlockingConditions(currentStep.id)
    assert.equal(blocking.length, 1)
    assert.equal(blocking[0].title, 'Blocking Pending')
  })

  test('advanceStep logs step_completed and step_entered activities', async ({ assert }) => {
    const user = await createUser({ email: 'advlog@test.com' })
    const client = await createClient(user.id)
    const template = await createWorkflowTemplate({ slug: 'test-tpl-12' })
    await createWorkflowStep(template.id, { stepOrder: 1, name: 'Step 1', slug: 'advl-step-1' })
    await createWorkflowStep(template.id, { stepOrder: 2, name: 'Step 2', slug: 'advl-step-2' })

    const tx = await WorkflowEngineService.createTransactionFromTemplate({
      templateId: template.id,
      ownerUserId: user.id,
      clientId: client.id,
      type: 'purchase',
    })

    await WorkflowEngineService.advanceStep(tx.id, user.id)

    const activities = await ActivityFeed.query()
      .where('transactionId', tx.id)
      .orderBy('createdAt', 'asc')

    const types = activities.map((a) => a.activityType)
    assert.include(types, 'step_completed')
    // step_entered appears twice: once on create, once on advance
    const enterCount = types.filter((t) => t === 'step_entered').length
    assert.isAtLeast(enterCount, 2)
  })
})
