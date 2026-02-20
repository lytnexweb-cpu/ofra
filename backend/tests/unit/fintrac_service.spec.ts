import { test } from '@japa/runner'
import {
  truncateAll,
  createUser,
  createClient,
  createWorkflowTemplate,
  createWorkflowStep,
  createTransactionStep,
  createTransactionParty,
} from '#tests/helpers/index'
import { FintracService } from '#services/fintrac_service'
import Transaction from '#models/transaction'
import Condition from '#models/condition'
import FintracRecord from '#models/fintrac_record'
import ConditionEvidence from '#models/condition_evidence'

/**
 * Helper: create a transaction with workflow steps including firm-pending,
 * then position the transaction at the firm-pending step.
 * Returns the firm-pending TransactionStep for direct calls to FintracService.
 */
async function setupAtFirmPending(overrides: { type?: 'purchase' | 'sale'; autoConditionsEnabled?: boolean } = {}) {
  const user = await createUser({ email: `fintrac-${Date.now()}@test.com` })
  const client = await createClient(user.id)
  const template = await createWorkflowTemplate({ slug: `fintrac-tpl-${Date.now()}` })

  // Create workflow steps
  const wfStep1 = await createWorkflowStep(template.id, { stepOrder: 1, name: 'Consultation', slug: 'consultation' })
  const wfStep5 = await createWorkflowStep(template.id, { stepOrder: 5, name: 'Firm Pending', slug: 'firm-pending' })
  const wfStep6 = await createWorkflowStep(template.id, { stepOrder: 6, name: 'Pre-closing', slug: 'pre-closing' })

  // Create transaction manually (not via WorkflowEngine to avoid offer gates)
  const transaction = await Transaction.create({
    ownerUserId: user.id,
    clientId: client.id,
    type: overrides.type ?? 'purchase',
    workflowTemplateId: template.id,
    autoConditionsEnabled: overrides.autoConditionsEnabled ?? true,
  })

  // Create transaction steps
  await createTransactionStep(transaction.id, wfStep1.id, { stepOrder: 1, status: 'completed' })
  const firmStep = await createTransactionStep(transaction.id, wfStep5.id, { stepOrder: 5, status: 'active' })
  await createTransactionStep(transaction.id, wfStep6.id, { stepOrder: 6, status: 'pending' })

  // Set current step to firm-pending
  transaction.currentStepId = firmStep.id
  await transaction.save()

  return { user, client, template, transaction, firmStep, wfStep5 }
}

/**
 * Helper: create a transaction NOT at firm-pending (at step 1)
 */
async function setupBeforeFirmPending(overrides: { type?: 'purchase' | 'sale' } = {}) {
  const user = await createUser({ email: `fintrac-pre-${Date.now()}@test.com` })
  const client = await createClient(user.id)
  const template = await createWorkflowTemplate({ slug: `fintrac-pre-${Date.now()}` })

  const wfStep1 = await createWorkflowStep(template.id, { stepOrder: 1, name: 'Consultation', slug: 'consultation' })
  const wfStep5 = await createWorkflowStep(template.id, { stepOrder: 5, name: 'Firm Pending', slug: 'firm-pending' })

  const transaction = await Transaction.create({
    ownerUserId: user.id,
    clientId: client.id,
    type: overrides.type ?? 'purchase',
    workflowTemplateId: template.id,
  })

  const step1 = await createTransactionStep(transaction.id, wfStep1.id, { stepOrder: 1, status: 'active' })
  await createTransactionStep(transaction.id, wfStep5.id, { stepOrder: 5, status: 'pending' })

  transaction.currentStepId = step1.id
  await transaction.save()

  return { user, client, template, transaction, step1 }
}

test.group('FintracService - onStepEnter', (group) => {
  group.each.setup(async () => {
    await truncateAll()
  })

  test('creates FINTRAC conditions for buyer parties on purchase at firm-pending', async ({ assert }) => {
    const { user, transaction, firmStep } = await setupAtFirmPending({ type: 'purchase' })

    await createTransactionParty(transaction.id, { role: 'buyer', fullName: 'John Buyer' })

    await FintracService.onStepEnter(transaction, firmStep, user.id)

    const conditions = await Condition.query()
      .where('transactionId', transaction.id)
      .where('title', 'like', 'FINTRAC%')

    assert.equal(conditions.length, 1)
    assert.equal(conditions[0].title, 'FINTRAC — John Buyer')
    assert.equal(conditions[0].level, 'blocking')
    assert.equal(conditions[0].status, 'pending')
    assert.equal(conditions[0].type, 'legal')

    // Check FintracRecord was created
    const records = await FintracRecord.query().where('transactionId', transaction.id)
    assert.equal(records.length, 1)
  })

  test('creates FINTRAC conditions for seller parties on sale at firm-pending', async ({ assert }) => {
    const { user, transaction, firmStep } = await setupAtFirmPending({ type: 'sale' })

    await createTransactionParty(transaction.id, { role: 'seller', fullName: 'Jane Seller' })

    await FintracService.onStepEnter(transaction, firmStep, user.id)

    const conditions = await Condition.query()
      .where('transactionId', transaction.id)
      .where('title', 'like', 'FINTRAC%')

    assert.equal(conditions.length, 1)
    assert.equal(conditions[0].title, 'FINTRAC — Jane Seller')
  })

  test('creates one condition per applicable party', async ({ assert }) => {
    const { user, transaction, firmStep } = await setupAtFirmPending({ type: 'purchase' })

    await createTransactionParty(transaction.id, { role: 'buyer', fullName: 'Buyer One' })
    await createTransactionParty(transaction.id, { role: 'buyer', fullName: 'Buyer Two' })
    // Seller should NOT get FINTRAC on purchase
    await createTransactionParty(transaction.id, { role: 'seller', fullName: 'Seller One' })

    await FintracService.onStepEnter(transaction, firmStep, user.id)

    const conditions = await Condition.query()
      .where('transactionId', transaction.id)
      .where('title', 'like', 'FINTRAC%')

    assert.equal(conditions.length, 2)
    const titles = conditions.map((c) => c.title).sort()
    assert.deepEqual(titles, ['FINTRAC — Buyer One', 'FINTRAC — Buyer Two'])
  })

  test('does not create conditions for non-firm-pending steps', async ({ assert }) => {
    const { user, transaction, step1 } = await setupBeforeFirmPending({ type: 'purchase' })

    await createTransactionParty(transaction.id, { role: 'buyer', fullName: 'John Buyer' })

    // Call onStepEnter with step1 (consultation, not firm-pending)
    await FintracService.onStepEnter(transaction, step1, user.id)

    const conditions = await Condition.query()
      .where('transactionId', transaction.id)
      .where('title', 'like', 'FINTRAC%')

    assert.equal(conditions.length, 0)
  })

  test('LEGAL: creates conditions even when autoConditionsEnabled=false', async ({ assert }) => {
    const { user, transaction, firmStep } = await setupAtFirmPending({
      type: 'purchase',
      autoConditionsEnabled: false,
    })

    await createTransactionParty(transaction.id, { role: 'buyer', fullName: 'John Buyer' })

    await FintracService.onStepEnter(transaction, firmStep, user.id)

    const conditions = await Condition.query()
      .where('transactionId', transaction.id)
      .where('title', 'like', 'FINTRAC%')

    assert.equal(conditions.length, 1, 'FINTRAC must be created even when autoConditionsEnabled=false')
  })

  test('anti-duplicate: does not create duplicate conditions', async ({ assert }) => {
    const { user, transaction, firmStep } = await setupAtFirmPending({ type: 'purchase' })

    await createTransactionParty(transaction.id, { role: 'buyer', fullName: 'John Buyer' })

    // Call twice
    await FintracService.onStepEnter(transaction, firmStep, user.id)
    await FintracService.onStepEnter(transaction, firmStep, user.id)

    const conditions = await Condition.query()
      .where('transactionId', transaction.id)
      .where('title', 'like', 'FINTRAC%')

    assert.equal(conditions.length, 1, 'Should not create duplicate FINTRAC condition')
  })

  test('does nothing when no parties of target role exist', async ({ assert }) => {
    const { user, transaction, firmStep } = await setupAtFirmPending({ type: 'purchase' })

    // Add only seller (no buyer) — purchase requires buyer FINTRAC
    await createTransactionParty(transaction.id, { role: 'seller', fullName: 'Seller Only' })

    await FintracService.onStepEnter(transaction, firmStep, user.id)

    const conditions = await Condition.query()
      .where('transactionId', transaction.id)
      .where('title', 'like', 'FINTRAC%')

    assert.equal(conditions.length, 0)
  })
})

test.group('FintracService - onPartyAdded', (group) => {
  group.each.setup(async () => {
    await truncateAll()
  })

  test('creates FINTRAC condition when party added after firm-pending', async ({ assert }) => {
    const { user, transaction, firmStep } = await setupAtFirmPending({ type: 'purchase' })

    // Initial buyer — create conditions via onStepEnter
    await createTransactionParty(transaction.id, { role: 'buyer', fullName: 'Buyer One' })
    await FintracService.onStepEnter(transaction, firmStep, user.id)

    // Add another buyer — should auto-create via onPartyAdded
    const newBuyer = await createTransactionParty(transaction.id, { role: 'buyer', fullName: 'Buyer Two' })
    await FintracService.onPartyAdded(transaction, newBuyer, user.id)

    const conditions = await Condition.query()
      .where('transactionId', transaction.id)
      .where('title', 'like', 'FINTRAC%')

    assert.equal(conditions.length, 2)
  })

  test('does not create condition for wrong role', async ({ assert }) => {
    const { user, transaction } = await setupAtFirmPending({ type: 'purchase' })

    // Add seller to a purchase — should NOT trigger FINTRAC
    const seller = await createTransactionParty(transaction.id, { role: 'seller', fullName: 'Seller One' })
    await FintracService.onPartyAdded(transaction, seller, user.id)

    const conditions = await Condition.query()
      .where('transactionId', transaction.id)
      .where('title', 'like', 'FINTRAC%')

    assert.equal(conditions.length, 0)
  })

  test('does not create condition before firm-pending', async ({ assert }) => {
    const { user, transaction } = await setupBeforeFirmPending({ type: 'purchase' })

    const buyer = await createTransactionParty(transaction.id, { role: 'buyer', fullName: 'Early Buyer' })
    await FintracService.onPartyAdded(transaction, buyer, user.id)

    const conditions = await Condition.query()
      .where('transactionId', transaction.id)
      .where('title', 'like', 'FINTRAC%')

    assert.equal(conditions.length, 0)
  })
})

test.group('FintracService - onPartyRemoved', (group) => {
  group.each.setup(async () => {
    await truncateAll()
  })

  test('archives FINTRAC condition and deletes record when party removed', async ({ assert }) => {
    const { user, transaction, firmStep } = await setupAtFirmPending({ type: 'purchase' })

    const party = await createTransactionParty(transaction.id, { role: 'buyer', fullName: 'John Buyer' })
    await FintracService.onStepEnter(transaction, firmStep, user.id)

    // Verify condition and record exist
    let activeConditions = await Condition.query()
      .where('transactionId', transaction.id)
      .where('title', 'FINTRAC — John Buyer')
      .where('archived', false)
    assert.equal(activeConditions.length, 1)

    let records = await FintracRecord.query()
      .where('transactionId', transaction.id)
      .where('partyId', party.id)
    assert.equal(records.length, 1)

    // Remove party
    await FintracService.onPartyRemoved(transaction, party, user.id)

    // Condition should be archived
    activeConditions = await Condition.query()
      .where('transactionId', transaction.id)
      .where('title', 'FINTRAC — John Buyer')
      .where('archived', false)
    assert.equal(activeConditions.length, 0)

    const archivedConditions = await Condition.query()
      .where('transactionId', transaction.id)
      .where('title', 'FINTRAC — John Buyer')
      .where('archived', true)
    assert.equal(archivedConditions.length, 1)

    // FintracRecord should be deleted
    records = await FintracRecord.query()
      .where('transactionId', transaction.id)
      .where('partyId', party.id)
    assert.equal(records.length, 0)
  })
})

test.group('FintracService - isCompliant', (group) => {
  group.each.setup(async () => {
    await truncateAll()
  })

  test('returns true when no FINTRAC conditions exist', async ({ assert }) => {
    const { transaction } = await setupAtFirmPending()
    const result = await FintracService.isCompliant(transaction.id)
    assert.isTrue(result)
  })

  test('returns false when pending FINTRAC conditions exist', async ({ assert }) => {
    const { user, transaction, firmStep } = await setupAtFirmPending({ type: 'purchase' })
    await createTransactionParty(transaction.id, { role: 'buyer', fullName: 'John Buyer' })
    await FintracService.onStepEnter(transaction, firmStep, user.id)

    const result = await FintracService.isCompliant(transaction.id)
    assert.isFalse(result)
  })

  test('returns true when all FINTRAC conditions are resolved', async ({ assert }) => {
    const { user, transaction, firmStep } = await setupAtFirmPending({ type: 'purchase' })
    const party = await createTransactionParty(transaction.id, { role: 'buyer', fullName: 'John Buyer' })
    await FintracService.onStepEnter(transaction, firmStep, user.id)

    // Complete the FINTRAC record
    const record = await FintracRecord.query()
      .where('transactionId', transaction.id)
      .where('partyId', party.id)
      .firstOrFail()

    await FintracService.complete(record.id, {
      dateOfBirth: '1990-01-15',
      idType: 'drivers_license',
      idNumber: 'NB-123456',
    }, user.id)

    // Add evidence so resolve works
    const condition = await Condition.query()
      .where('transactionId', transaction.id)
      .where('title', 'FINTRAC — John Buyer')
      .firstOrFail()

    await ConditionEvidence.create({
      conditionId: condition.id,
      type: 'file',
      fileUrl: '/api/uploads/id-scan.pdf',
      title: 'id-scan.pdf',
      createdBy: user.id,
    })

    await FintracService.resolveConditionForParty(transaction.id, party.id, user.id)

    const result = await FintracService.isCompliant(transaction.id)
    assert.isTrue(result)
  })
})

test.group('FintracService - complete', (group) => {
  group.each.setup(async () => {
    await truncateAll()
  })

  test('fills identity data on FintracRecord', async ({ assert }) => {
    const { user, transaction, firmStep } = await setupAtFirmPending({ type: 'purchase' })
    const party = await createTransactionParty(transaction.id, { role: 'buyer', fullName: 'John Buyer' })
    await FintracService.onStepEnter(transaction, firmStep, user.id)

    const record = await FintracRecord.query()
      .where('transactionId', transaction.id)
      .where('partyId', party.id)
      .firstOrFail()

    const updated = await FintracService.complete(record.id, {
      dateOfBirth: '1990-01-15',
      idType: 'drivers_license',
      idNumber: 'NB-123456',
      occupation: 'Engineer',
      sourceOfFunds: 'Employment',
    }, user.id)

    assert.equal(updated.idType, 'drivers_license')
    assert.equal(updated.idNumber, 'NB-123456')
    assert.equal(updated.occupation, 'Engineer')
    assert.equal(updated.sourceOfFunds, 'Employment')
    assert.isNotNull(updated.verifiedAt)
    assert.equal(updated.verifiedByUserId, user.id)
  })
})

test.group('FintracService - resolveConditionForParty', (group) => {
  group.each.setup(async () => {
    await truncateAll()
  })

  test('does not resolve if no evidence attached', async ({ assert }) => {
    const { user, transaction, firmStep } = await setupAtFirmPending({ type: 'purchase' })
    const party = await createTransactionParty(transaction.id, { role: 'buyer', fullName: 'John Buyer' })
    await FintracService.onStepEnter(transaction, firmStep, user.id)

    // Complete record but don't add evidence
    const record = await FintracRecord.query()
      .where('transactionId', transaction.id)
      .where('partyId', party.id)
      .firstOrFail()

    await FintracService.complete(record.id, {
      dateOfBirth: '1990-01-15',
      idType: 'drivers_license',
      idNumber: 'NB-123456',
    }, user.id)

    await FintracService.resolveConditionForParty(transaction.id, party.id, user.id)

    // Condition should still be pending
    const condition = await Condition.query()
      .where('transactionId', transaction.id)
      .where('title', 'FINTRAC — John Buyer')
      .firstOrFail()

    assert.equal(condition.status, 'pending')
  })

  test('resolves condition when evidence is present', async ({ assert }) => {
    const { user, transaction, firmStep } = await setupAtFirmPending({ type: 'purchase' })
    const party = await createTransactionParty(transaction.id, { role: 'buyer', fullName: 'John Buyer' })
    await FintracService.onStepEnter(transaction, firmStep, user.id)

    const record = await FintracRecord.query()
      .where('transactionId', transaction.id)
      .where('partyId', party.id)
      .firstOrFail()

    await FintracService.complete(record.id, {
      dateOfBirth: '1990-01-15',
      idType: 'drivers_license',
      idNumber: 'NB-123456',
    }, user.id)

    // Add evidence
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

    await FintracService.resolveConditionForParty(transaction.id, party.id, user.id)

    // Condition should be completed
    await condition.refresh()
    assert.equal(condition.status, 'completed')
  })
})
