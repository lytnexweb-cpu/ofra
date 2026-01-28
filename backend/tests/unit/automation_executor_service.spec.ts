import { test } from '@japa/runner'
import mail from '@adonisjs/mail/services/main'
import {
  truncateAll,
  createUser,
  createClient,
  createWorkflowTemplate,
  createWorkflowStep,
  createWorkflowStepAutomation,
  createProperty,
} from '#tests/helpers/index'
import { WorkflowEngineService } from '#services/workflow_engine_service'
import { AutomationExecutorService } from '#services/automation_executor_service'
import ActivityFeed from '#models/activity_feed'
import OfferAcceptedMail from '#mails/offer_accepted_mail'
import FirmConfirmedMail from '#mails/firm_confirmed_mail'

test.group('AutomationExecutorService', (group) => {
  let fakeMailer: ReturnType<typeof mail.fake>

  group.each.setup(async () => {
    fakeMailer = mail.fake()
    await truncateAll()
  })

  group.each.teardown(async () => {
    mail.restore()
  })

  test('send_email + offer_accepted sends OfferAcceptedMail to client', async ({ assert }) => {
    const user = await createUser({ email: 'auto1@test.com' })
    const client = await createClient(user.id, { email: 'buyer@test.com' })
    const template = await createWorkflowTemplate({ slug: 'auto-tpl-1' })
    const step = await createWorkflowStep(template.id, {
      stepOrder: 1,
      name: 'Offer Accepted',
      slug: 'auto-offer-1',
    })

    const automation = await createWorkflowStepAutomation(step.id, {
      trigger: 'on_enter',
      actionType: 'send_email',
      templateRef: 'offer_accepted',
    })

    const tx = await WorkflowEngineService.createTransactionFromTemplate({
      templateId: template.id,
      ownerUserId: user.id,
      clientId: client.id,
      type: 'purchase',
    })

    const result = await AutomationExecutorService.execute(automation, tx.id, {
      stepName: 'Offer Accepted',
      trigger: 'on_enter',
    })

    assert.isFalse(result.skipped)
    assert.isTrue(result.sent)

    fakeMailer.mails.assertSent(OfferAcceptedMail)

    const activity = await ActivityFeed.query()
      .where('transactionId', tx.id)
      .where('activityType', 'email_sent')
      .firstOrFail()
    assert.deepEqual(activity.metadata.automationTrigger, {
      automationId: automation.id,
      stepName: 'Offer Accepted',
      triggerType: 'on_enter',
    })
  })

  test('send_email + firm_confirmed sends FirmConfirmedMail to client', async ({ assert }) => {
    const user = await createUser({ email: 'auto2@test.com' })
    const client = await createClient(user.id, { email: 'firm-buyer@test.com' })
    const template = await createWorkflowTemplate({ slug: 'auto-tpl-2' })
    const step = await createWorkflowStep(template.id, {
      stepOrder: 1,
      name: 'Firm',
      slug: 'auto-firm-1',
    })

    const automation = await createWorkflowStepAutomation(step.id, {
      trigger: 'on_enter',
      actionType: 'send_email',
      templateRef: 'firm_confirmed',
    })

    const tx = await WorkflowEngineService.createTransactionFromTemplate({
      templateId: template.id,
      ownerUserId: user.id,
      clientId: client.id,
      type: 'purchase',
    })

    const result = await AutomationExecutorService.execute(automation, tx.id, {
      stepName: 'Firm',
      trigger: 'on_enter',
    })

    assert.isFalse(result.skipped)
    assert.isTrue(result.sent)

    fakeMailer.mails.assertSent(FirmConfirmedMail)
  })

  test('send_email skipped when client has no email', async ({ assert }) => {
    const user = await createUser({ email: 'auto3@test.com' })
    const client = await createClient(user.id, { email: null })
    const template = await createWorkflowTemplate({ slug: 'auto-tpl-3' })
    const step = await createWorkflowStep(template.id, {
      stepOrder: 1,
      name: 'Step',
      slug: 'auto-noemail-1',
    })

    const automation = await createWorkflowStepAutomation(step.id, {
      trigger: 'on_enter',
      actionType: 'send_email',
      templateRef: 'offer_accepted',
    })

    const tx = await WorkflowEngineService.createTransactionFromTemplate({
      templateId: template.id,
      ownerUserId: user.id,
      clientId: client.id,
      type: 'purchase',
    })

    const result = await AutomationExecutorService.execute(automation, tx.id, {
      stepName: 'Step',
      trigger: 'on_enter',
    })

    assert.isTrue(result.skipped)
    assert.isFalse(result.sent)

    const activity = await ActivityFeed.query()
      .where('transactionId', tx.id)
      .where('activityType', 'email_sent')
      .firstOrFail()

    assert.equal(activity.metadata.skipped, true)
    assert.match(activity.metadata.reason, /no email/)
    assert.isNotNull(activity.metadata.automationTrigger)
  })

  test('send_email with unknown templateRef skips gracefully', async ({ assert }) => {
    const user = await createUser({ email: 'auto4@test.com' })
    const client = await createClient(user.id, { email: 'unknown@test.com' })
    const template = await createWorkflowTemplate({ slug: 'auto-tpl-4' })
    const step = await createWorkflowStep(template.id, {
      stepOrder: 1,
      name: 'Step',
      slug: 'auto-unknown-1',
    })

    const automation = await createWorkflowStepAutomation(step.id, {
      trigger: 'on_enter',
      actionType: 'send_email',
      templateRef: 'nonexistent_template',
    })

    const tx = await WorkflowEngineService.createTransactionFromTemplate({
      templateId: template.id,
      ownerUserId: user.id,
      clientId: client.id,
      type: 'purchase',
    })

    const result = await AutomationExecutorService.execute(automation, tx.id, {
      stepName: 'Step',
      trigger: 'on_enter',
    })

    assert.isTrue(result.skipped)
    assert.isFalse(result.sent)

    const activity = await ActivityFeed.query()
      .where('transactionId', tx.id)
      .where('activityType', 'email_sent')
      .firstOrFail()

    assert.equal(activity.metadata.skipped, true)
    assert.match(activity.metadata.reason, /Unknown templateRef/)
    assert.isNotNull(activity.metadata.automationTrigger)
  })

  test('create_task logs task_created activity with title', async ({ assert }) => {
    const user = await createUser({ email: 'auto5@test.com' })
    const client = await createClient(user.id)
    const template = await createWorkflowTemplate({ slug: 'auto-tpl-5' })
    const step = await createWorkflowStep(template.id, {
      stepOrder: 1,
      name: 'Step',
      slug: 'auto-task-1',
    })

    const automation = await createWorkflowStepAutomation(step.id, {
      trigger: 'on_enter',
      actionType: 'create_task',
      templateRef: 'fintrac_reminder',
      config: { title: 'Complete FINTRAC Form' },
    })

    const tx = await WorkflowEngineService.createTransactionFromTemplate({
      templateId: template.id,
      ownerUserId: user.id,
      clientId: client.id,
      type: 'purchase',
    })

    const result = await AutomationExecutorService.execute(automation, tx.id, {
      stepName: 'Step',
      trigger: 'on_enter',
    })

    assert.isTrue(result.sent)
    assert.isFalse(result.skipped)

    const activity = await ActivityFeed.query()
      .where('transactionId', tx.id)
      .where('activityType', 'task_created')
      .firstOrFail()

    assert.equal(activity.metadata.title, 'Complete FINTRAC Form')
    assert.equal(activity.metadata.templateRef, 'fintrac_reminder')
    assert.deepEqual(activity.metadata.automationTrigger, {
      automationId: automation.id,
      stepName: 'Step',
      triggerType: 'on_enter',
    })
  })

  test('create_task with delayDays logs delay note', async ({ assert }) => {
    const user = await createUser({ email: 'auto6@test.com' })
    const client = await createClient(user.id)
    const template = await createWorkflowTemplate({ slug: 'auto-tpl-6' })
    const step = await createWorkflowStep(template.id, {
      stepOrder: 1,
      name: 'Step',
      slug: 'auto-delay-1',
    })

    const automation = await createWorkflowStepAutomation(step.id, {
      trigger: 'on_enter',
      actionType: 'create_task',
      templateRef: 'google_review_reminder',
      delayDays: 7,
      config: { title: 'Ask for Google Review' },
    })

    const tx = await WorkflowEngineService.createTransactionFromTemplate({
      templateId: template.id,
      ownerUserId: user.id,
      clientId: client.id,
      type: 'purchase',
    })

    const result = await AutomationExecutorService.execute(automation, tx.id, {
      stepName: 'Step',
      trigger: 'on_enter',
    })

    assert.isTrue(result.sent)

    const activity = await ActivityFeed.query()
      .where('transactionId', tx.id)
      .where('activityType', 'task_created')
      .firstOrFail()

    assert.match(activity.metadata.delayNote, /7 day/)
    assert.isNotNull(activity.metadata.automationTrigger)
  })

  test('advanceStep triggers on_enter automations on new step', async ({ assert }) => {
    const user = await createUser({ email: 'auto7@test.com' })
    const client = await createClient(user.id, { email: 'advance-auto@test.com' })
    const template = await createWorkflowTemplate({ slug: 'auto-tpl-7' })
    const step1 = await createWorkflowStep(template.id, {
      stepOrder: 1,
      name: 'Step 1',
      slug: 'auto-adv-1',
    })
    const step2 = await createWorkflowStep(template.id, {
      stepOrder: 2,
      name: 'Offer Accepted',
      slug: 'auto-adv-2',
    })

    // Automation on step2 (on_enter)
    await createWorkflowStepAutomation(step2.id, {
      trigger: 'on_enter',
      actionType: 'send_email',
      templateRef: 'offer_accepted',
    })

    // No automation on step1
    void step1

    const tx = await WorkflowEngineService.createTransactionFromTemplate({
      templateId: template.id,
      ownerUserId: user.id,
      clientId: client.id,
      type: 'purchase',
    })

    // Advance from step1 to step2 — should trigger the on_enter automation
    await WorkflowEngineService.advanceStep(tx.id, user.id)

    fakeMailer.mails.assertSent(OfferAcceptedMail)

    const emailActivity = await ActivityFeed.query()
      .where('transactionId', tx.id)
      .where('activityType', 'email_sent')
      .first()

    assert.isNotNull(emailActivity)
    assert.equal(emailActivity!.metadata.automationTrigger.stepName, 'Offer Accepted')
    assert.equal(emailActivity!.metadata.automationTrigger.triggerType, 'on_enter')
  })

  test('execute returns error result when transaction not found (never throws)', async ({
    assert,
  }) => {
    const user = await createUser({ email: 'auto-err@test.com' })
    const template = await createWorkflowTemplate({ slug: 'auto-tpl-err' })
    const step = await createWorkflowStep(template.id, {
      stepOrder: 1,
      name: 'Step',
      slug: 'auto-err-1',
    })

    const automation = await createWorkflowStepAutomation(step.id, {
      trigger: 'on_enter',
      actionType: 'send_email',
      templateRef: 'offer_accepted',
    })

    // Use a transactionId that does not exist — firstOrFail() will throw
    const result = await AutomationExecutorService.execute(automation, 999999, {
      stepName: 'Step',
      trigger: 'on_enter',
    })

    // Must never throw — returns graceful error result
    assert.isFalse(result.sent)
    assert.isTrue(result.skipped)
    assert.isDefined(result.error)
    assert.isString(result.error)

    void user
  })

  test('advanceStep succeeds even when automation has unknown actionType', async ({ assert }) => {
    const user = await createUser({ email: 'auto-resilience@test.com' })
    const client = await createClient(user.id, { email: 'resilience@test.com' })
    const template = await createWorkflowTemplate({ slug: 'auto-tpl-resilience' })
    const step1 = await createWorkflowStep(template.id, {
      stepOrder: 1,
      name: 'Step 1',
      slug: 'auto-res-1',
    })
    const step2 = await createWorkflowStep(template.id, {
      stepOrder: 2,
      name: 'Step 2',
      slug: 'auto-res-2',
    })

    // Attach an automation with an unknown actionType to step2
    await createWorkflowStepAutomation(step2.id, {
      trigger: 'on_enter',
      actionType: 'webhook',
      templateRef: 'some_hook',
    })

    void step1

    const tx = await WorkflowEngineService.createTransactionFromTemplate({
      templateId: template.id,
      ownerUserId: user.id,
      clientId: client.id,
      type: 'purchase',
    })

    // Advance from step1 to step2 — the unknown automation must NOT block advancement
    const result = await WorkflowEngineService.advanceStep(tx.id, user.id)

    assert.isNotNull(result.newStep)
    assert.equal(result.newStep!.stepOrder, 2)
    assert.equal(result.newStep!.status, 'active')
  })

  test('subject override from automation.config.subject applied', async ({ assert }) => {
    const user = await createUser({ email: 'auto8@test.com' })
    const client = await createClient(user.id, { email: 'subject-test@test.com' })
    const template = await createWorkflowTemplate({ slug: 'auto-tpl-8' })
    const step = await createWorkflowStep(template.id, {
      stepOrder: 1,
      name: 'Step',
      slug: 'auto-subject-1',
    })

    const customSubject = 'Custom Offer Subject Line'
    const automation = await createWorkflowStepAutomation(step.id, {
      trigger: 'on_enter',
      actionType: 'send_email',
      templateRef: 'offer_accepted',
      config: { subject: customSubject },
    })

    const tx = await WorkflowEngineService.createTransactionFromTemplate({
      templateId: template.id,
      ownerUserId: user.id,
      clientId: client.id,
      type: 'purchase',
    })

    await AutomationExecutorService.execute(automation, tx.id, {
      stepName: 'Step',
      trigger: 'on_enter',
    })

    const sentMails = fakeMailer.mails.sent(
      (m) => m instanceof OfferAcceptedMail
    )
    assert.isAbove(sentMails.length, 0)
    assert.equal((sentMails[0] as OfferAcceptedMail).subject, customSubject)
  })

  test('send_email includes property address when transaction has property', async ({ assert }) => {
    const user = await createUser({ email: 'auto-prop@test.com' })
    const client = await createClient(user.id, { email: 'prop-buyer@test.com' })
    const property = await createProperty(user.id, {
      address: '42 Rue Principale',
      city: 'Moncton',
      postalCode: 'E1C 4Z5',
    })
    const template = await createWorkflowTemplate({ slug: 'auto-tpl-prop' })
    const step = await createWorkflowStep(template.id, {
      stepOrder: 1,
      name: 'Offer Accepted',
      slug: 'auto-prop-1',
    })

    const automation = await createWorkflowStepAutomation(step.id, {
      trigger: 'on_enter',
      actionType: 'send_email',
      templateRef: 'offer_accepted',
    })

    const tx = await WorkflowEngineService.createTransactionFromTemplate({
      templateId: template.id,
      ownerUserId: user.id,
      clientId: client.id,
      propertyId: property.id,
      type: 'purchase',
    })

    const result = await AutomationExecutorService.execute(automation, tx.id, {
      stepName: 'Offer Accepted',
      trigger: 'on_enter',
    })

    assert.isTrue(result.sent)
    assert.isFalse(result.skipped)

    const sentMails = fakeMailer.mails.sent(
      (m) => m instanceof OfferAcceptedMail
    )
    assert.isAbove(sentMails.length, 0)

    const mailInstance = sentMails[0] as OfferAcceptedMail
    assert.equal(mailInstance.propertyAddress, '42 Rue Principale')
  })
})
