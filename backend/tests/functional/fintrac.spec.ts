import { test } from '@japa/runner'
import { cuid } from '@adonisjs/core/helpers'
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
import FintracRecord from '#models/fintrac_record'
import Condition from '#models/condition'
import ConditionEvidence from '#models/condition_evidence'
import { FintracService } from '#services/fintrac_service'

function withAuth(request: any, userId: number) {
  const sessionId = cuid()
  return request
    .withCookie('adonis-session', sessionId)
    .withEncryptedCookie(sessionId, { auth_web: userId })
}

/**
 * Setup a transaction at firm-pending with a buyer party and FINTRAC condition+record.
 */
async function setupFintracScenario() {
  const user = await createUser({ email: `fn-ctrl-${Date.now()}@test.com` })
  const client = await createClient(user.id)
  const template = await createWorkflowTemplate({ slug: `fn-ctrl-${Date.now()}` })

  const wfStep1 = await createWorkflowStep(template.id, { stepOrder: 1, name: 'Consultation', slug: 'consultation' })
  const wfStep5 = await createWorkflowStep(template.id, { stepOrder: 5, name: 'Firm Pending', slug: 'firm-pending' })

  const transaction = await Transaction.create({
    ownerUserId: user.id,
    clientId: client.id,
    type: 'purchase',
    workflowTemplateId: template.id,
  })

  await createTransactionStep(transaction.id, wfStep1.id, { stepOrder: 1, status: 'completed' })
  const firmStep = await createTransactionStep(transaction.id, wfStep5.id, { stepOrder: 5, status: 'active' })
  transaction.currentStepId = firmStep.id
  await transaction.save()

  const party = await createTransactionParty(transaction.id, { role: 'buyer', fullName: 'John Buyer' })

  // Create FINTRAC condition + record via service
  await FintracService.onStepEnter(transaction, firmStep, user.id)

  const record = await FintracRecord.query()
    .where('transactionId', transaction.id)
    .firstOrFail()

  return { user, transaction, party, record, firmStep }
}

test.group('FINTRAC Controller - GET /api/transactions/:id/fintrac', (group) => {
  group.each.setup(async () => {
    await truncateAll()
  })

  test('returns records and compliance status', async ({ client }) => {
    const { user, transaction } = await setupFintracScenario()

    const response = await withAuth(
      client.get(`/api/transactions/${transaction.id}/fintrac`),
      user.id
    )

    response.assertStatus(200)
    response.assertBodyContains({
      success: true,
      data: {
        isCompliant: false,
      },
    })
  })

  test('returns compliant=true when no FINTRAC conditions', async ({ client }) => {
    const user = await createUser({ email: 'no-fintrac@test.com' })
    const cl = await createClient(user.id)
    const template = await createWorkflowTemplate({ slug: 'no-fn-tpl' })
    const wfStep = await createWorkflowStep(template.id, { stepOrder: 1, name: 'Step 1', slug: 's1' })

    const transaction = await Transaction.create({
      ownerUserId: user.id,
      clientId: cl.id,
      type: 'purchase',
      workflowTemplateId: template.id,
    })
    const step = await createTransactionStep(transaction.id, wfStep.id, { stepOrder: 1, status: 'active' })
    transaction.currentStepId = step.id
    await transaction.save()

    const response = await withAuth(
      client.get(`/api/transactions/${transaction.id}/fintrac`),
      user.id
    )

    response.assertStatus(200)
    response.assertBodyContains({
      success: true,
      data: { isCompliant: true },
    })
  })
})

test.group('FINTRAC Controller - GET /api/fintrac/:id', (group) => {
  group.each.setup(async () => {
    await truncateAll()
  })

  test('returns a single FINTRAC record', async ({ client }) => {
    const { user, record } = await setupFintracScenario()

    const response = await withAuth(
      client.get(`/api/fintrac/${record.id}`),
      user.id
    )

    response.assertStatus(200)
    response.assertBodyContains({ success: true })
  })

  test('returns 403 for record belonging to another user', async ({ client }) => {
    const { record } = await setupFintracScenario()
    const otherUser = await createUser({ email: 'other@test.com' })

    const response = await withAuth(
      client.get(`/api/fintrac/${record.id}`),
      otherUser.id
    )

    response.assertStatus(403)
  })

  test('returns 404 for non-existent record', async ({ client }) => {
    const user = await createUser({ email: 'nobody@test.com' })

    const response = await withAuth(
      client.get('/api/fintrac/99999'),
      user.id
    )

    response.assertStatus(404)
  })
})

test.group('FINTRAC Controller - PATCH /api/fintrac/:id/complete', (group) => {
  group.each.setup(async () => {
    await truncateAll()
  })

  test('completes a FINTRAC record with valid identity data', async ({ client }) => {
    const { user, record } = await setupFintracScenario()

    const response = await withAuth(
      client.patch(`/api/fintrac/${record.id}/complete`),
      user.id
    ).json({
      dateOfBirth: '1990-01-15',
      idType: 'drivers_license',
      idNumber: 'NB-123456',
      occupation: 'Engineer',
      sourceOfFunds: 'Employment income',
    })

    response.assertStatus(200)
    response.assertBodyContains({
      success: true,
      data: {
        record: {
          idType: 'drivers_license',
          idNumber: 'NB-123456',
        },
      },
    })
  })

  test('returns 422 for invalid data (missing required fields)', async ({ client }) => {
    const { user, record } = await setupFintracScenario()

    const response = await withAuth(
      client.patch(`/api/fintrac/${record.id}/complete`),
      user.id
    ).json({
      occupation: 'Engineer',
    })

    response.assertStatus(422)
    response.assertBodyContains({
      success: false,
      error: { code: 'E_VALIDATION_FAILED' },
    })
  })

  test('returns 403 for unauthorized user', async ({ client }) => {
    const { record } = await setupFintracScenario()
    const otherUser = await createUser({ email: 'hacker@test.com' })

    const response = await withAuth(
      client.patch(`/api/fintrac/${record.id}/complete`),
      otherUser.id
    ).json({
      dateOfBirth: '1990-01-15',
      idType: 'drivers_license',
      idNumber: 'NB-123456',
    })

    response.assertStatus(403)
  })
})

test.group('FINTRAC Controller - POST /api/fintrac/:id/resolve', (group) => {
  group.each.setup(async () => {
    await truncateAll()
  })

  test('resolves FINTRAC condition when complete + evidence present', async ({ client, assert }) => {
    const { user, record, transaction, party } = await setupFintracScenario()

    // Complete the record
    await FintracService.complete(record.id, {
      dateOfBirth: '1990-01-15',
      idType: 'drivers_license',
      idNumber: 'NB-123456',
    }, user.id)

    // Add evidence to the condition
    const condition = await Condition.query()
      .where('transactionId', transaction.id)
      .where('title', 'FINTRAC — John Buyer')
      .firstOrFail()

    await ConditionEvidence.create({
      conditionId: condition.id,
      type: 'file',
      fileUrl: '/api/uploads/id-scan.pdf',
      title: 'ID Scan',
      createdBy: user.id,
    })

    const response = await withAuth(
      client.post(`/api/fintrac/${record.id}/resolve`),
      user.id
    )

    response.assertStatus(200)
    response.assertBodyContains({
      success: true,
      data: { message: 'FINTRAC condition resolved' },
    })

    // Verify condition is resolved
    await condition.refresh()
    assert.equal(condition.status, 'completed')
  })

  test('returns 422 when record not yet completed', async ({ client }) => {
    const { user, record } = await setupFintracScenario()

    const response = await withAuth(
      client.post(`/api/fintrac/${record.id}/resolve`),
      user.id
    )

    response.assertStatus(422)
    response.assertBodyContains({
      success: false,
      error: { code: 'E_FINTRAC_INCOMPLETE' },
    })
  })
})
