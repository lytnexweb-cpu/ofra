import { test } from '@japa/runner'
import { createTestUser } from '../helpers/auth.js'
import Transaction from '#models/transaction'
import Condition from '#models/condition'
import TransactionProfile from '#models/transaction_profile'
import ConditionTemplate from '#models/condition_template'
import ConditionEvent from '#models/condition_event'
import { ConditionsEngineService } from '#services/conditions_engine_service'

/**
 * Conditions Engine Premium - E2E Tests
 *
 * Tests for D4 (Archivage Timeline) and D27 (Data Model)
 * Author: Murat (TEA)
 */

test.group('Conditions Engine Premium', (group) => {
  let user: any
  let transaction: Transaction
  let profile: TransactionProfile

  group.setup(async () => {
    // Create test user
    user = await createTestUser()
  })

  group.each.setup(async () => {
    // Create a test transaction with profile for each test
    // This would typically use a factory
  })

  // ============================================================
  // SCENARIO 1: Blocking empêche l'avancement
  // ============================================================

  test('blocking condition prevents step advancement', async ({ assert }) => {
    // Given: une transaction à l'étape 4
    // And: une condition Blocking "Mortgage Commitment" en pending

    const blockingCondition = await Condition.create({
      transactionId: 1, // Would use actual transaction
      transactionStepId: 1,
      title: 'Mortgage Commitment reçu',
      labelFr: 'Mortgage Commitment reçu',
      labelEn: 'Mortgage Commitment received',
      level: 'blocking',
      sourceType: 'industry',
      status: 'pending',
      type: 'financing',
      priority: 'high',
      isBlocking: true,
      stepWhenCreated: 4,
      archived: false,
    })

    // When: l'agent tente d'avancer à l'étape 5
    const check = await ConditionsEngineService.checkStepAdvancement(1, 4)

    // Then: erreur "Condition bloquante non résolue"
    assert.isFalse(check.canAdvance)
    assert.lengthOf(check.blockingConditions, 1)
    assert.equal(check.blockingConditions[0].id, blockingCondition.id)

    // And: la transaction reste à l'étape 4
    // (Would verify transaction.currentStepId hasn't changed)
  })

  test('blocking condition cannot be skipped with risk', async ({ assert }) => {
    const blockingCondition = await Condition.create({
      transactionId: 1,
      transactionStepId: 1,
      title: 'Test Blocking',
      labelFr: 'Test Blocking',
      labelEn: 'Test Blocking',
      level: 'blocking',
      sourceType: 'legal',
      status: 'pending',
      type: 'other',
      priority: 'high',
      isBlocking: true,
      stepWhenCreated: 4,
      archived: false,
    })

    // Attempt to resolve as skipped_with_risk should throw
    await assert.rejects(
      async () => {
        await blockingCondition.resolve('skipped_with_risk', user.id, 'Trying to skip')
      },
      'Blocking conditions cannot be skipped with risk'
    )
  })

  // ============================================================
  // SCENARIO 2: Required force résolution explicite
  // ============================================================

  test('required condition forces explicit resolution with note', async ({ assert }) => {
    // Given: une transaction à l'étape 4
    // And: une condition Required "Test puits" en pending

    const requiredCondition = await Condition.create({
      transactionId: 1,
      transactionStepId: 1,
      title: 'Test de puits',
      labelFr: 'Test de puits',
      labelEn: 'Well test',
      level: 'required',
      sourceType: 'government',
      status: 'pending',
      type: 'water_test',
      priority: 'medium',
      isBlocking: false,
      stepWhenCreated: 4,
      archived: false,
    })

    // When: attempting to resolve as waived without note
    await assert.rejects(
      async () => {
        await requiredCondition.resolve('waived', user.id)
      },
      'Resolution note is required for this condition'
    )

    // When: resolving with note should work
    await requiredCondition.resolve('skipped_with_risk', user.id, 'Client refuse délai')

    await requiredCondition.refresh()

    // Then: condition résolue avec audit trail
    assert.equal(requiredCondition.status, 'completed')
    assert.equal(requiredCondition.resolutionType, 'skipped_with_risk')
    assert.equal(requiredCondition.resolutionNote, 'Client refuse délai')
    assert.isNotNull(requiredCondition.resolvedAt)
    assert.equal(requiredCondition.resolvedBy, String(user.id))

    // Verify event was logged
    const events = await ConditionEvent.query().where('conditionId', requiredCondition.id)
    assert.isTrue(events.some((e) => e.eventType === 'resolved'))
  })

  test('required condition allows completion without note', async ({ assert }) => {
    const requiredCondition = await Condition.create({
      transactionId: 1,
      transactionStepId: 1,
      title: 'Test Required',
      labelFr: 'Test Required',
      labelEn: 'Test Required',
      level: 'required',
      sourceType: 'industry',
      status: 'pending',
      type: 'other',
      priority: 'medium',
      isBlocking: false,
      stepWhenCreated: 4,
      archived: false,
    })

    // Completing without note should work
    await requiredCondition.resolve('completed', user.id)

    await requiredCondition.refresh()
    assert.equal(requiredCondition.status, 'completed')
    assert.equal(requiredCondition.resolutionType, 'completed')
  })

  // ============================================================
  // SCENARIO 3: Recommended auto-archive
  // ============================================================

  test('recommended condition auto-archives on step change', async ({ assert }) => {
    // Given: une transaction à l'étape 4
    // And: une condition Recommended "Visite pré-fermeture" en pending

    const recommendedCondition = await Condition.create({
      transactionId: 1,
      transactionStepId: 1,
      title: 'Visite pré-fermeture',
      labelFr: 'Visite pré-fermeture complétée',
      labelEn: 'Pre-closing walkthrough completed',
      level: 'recommended',
      sourceType: 'best_practice',
      status: 'pending',
      type: 'other',
      priority: 'low',
      isBlocking: false,
      stepWhenCreated: 4,
      archived: false,
    })

    // When: l'agent avance à l'étape 5
    await ConditionsEngineService.archiveConditionsOnStepChange(1, 4, 5, user.id)

    await recommendedCondition.refresh()

    // Then: condition auto-résolue not_applicable
    assert.equal(recommendedCondition.status, 'completed')
    assert.equal(recommendedCondition.resolutionType, 'not_applicable')
    assert.equal(recommendedCondition.resolutionNote, 'Auto-archived on step change')
    assert.equal(recommendedCondition.resolvedBy, 'system')

    // And: condition is archived
    assert.isTrue(recommendedCondition.archived)
    assert.isNotNull(recommendedCondition.archivedAt)
    assert.equal(recommendedCondition.archivedStep, 5)
  })

  // ============================================================
  // SCENARIO 4: Audit trail complet
  // ============================================================

  test('condition events are logged correctly', async ({ assert }) => {
    const condition = await Condition.create({
      transactionId: 1,
      transactionStepId: 1,
      title: 'Test Audit',
      labelFr: 'Test Audit',
      labelEn: 'Test Audit',
      level: 'required',
      sourceType: 'industry',
      status: 'pending',
      type: 'other',
      priority: 'medium',
      isBlocking: false,
      stepWhenCreated: 3,
      archived: false,
    })

    // Log creation event
    await ConditionEvent.log(condition.id, 'created', user.id, {
      level: 'required',
      source_type: 'industry',
    })

    // Resolve the condition
    await condition.resolve('completed', user.id, 'Done')

    // Archive the condition
    await condition.archive(4)

    // Get history
    const history = await ConditionsEngineService.getConditionHistory(condition.id)

    // Verify all events are present
    assert.isTrue(history.some((e) => e.eventType === 'created'))
    assert.isTrue(history.some((e) => e.eventType === 'resolved'))
    assert.isTrue(history.some((e) => e.eventType === 'archived'))

    // Verify event order
    const eventTypes = history.map((e) => e.eventType)
    assert.deepEqual(eventTypes, ['created', 'resolved', 'archived'])
  })

  // ============================================================
  // SCENARIO 5: Template matching with Transaction Profile
  // ============================================================

  test('templates match based on transaction profile', async ({ assert }) => {
    // Create templates
    const ruralTemplate = await ConditionTemplate.create({
      labelFr: 'Test de puits',
      labelEn: 'Well test',
      level: 'required',
      sourceType: 'government',
      appliesWhen: { property_context: 'rural', has_well: true },
      pack: 'rural_nb',
      order: 1,
      isDefault: true,
      isActive: true,
    })

    const condoTemplate = await ConditionTemplate.create({
      labelFr: 'Certificat Estoppel',
      labelEn: 'Estoppel Certificate',
      level: 'blocking',
      sourceType: 'legal',
      appliesWhen: { property_type: 'condo' },
      pack: 'condo_nb',
      order: 1,
      isDefault: true,
      isActive: true,
    })

    const universalTemplate = await ConditionTemplate.create({
      labelFr: 'Avocat confirmé',
      labelEn: 'Lawyer confirmed',
      level: 'blocking',
      sourceType: 'legal',
      appliesWhen: {},
      pack: null,
      order: 1,
      isDefault: true,
      isActive: true,
    })

    // Create rural profile
    const ruralProfile = await TransactionProfile.create({
      transactionId: 1,
      propertyType: 'house',
      propertyContext: 'rural',
      isFinanced: true,
      hasWell: true,
      hasSeptic: true,
      accessType: 'private',
    })

    // Get applicable templates
    const applicableTemplates = await ConditionsEngineService.getApplicableTemplates(ruralProfile)

    // Should include rural and universal, but not condo
    const templateIds = applicableTemplates.map((t) => t.id)
    assert.isTrue(templateIds.includes(ruralTemplate.id))
    assert.isTrue(templateIds.includes(universalTemplate.id))
    assert.isFalse(templateIds.includes(condoTemplate.id))
  })

  // ============================================================
  // SCENARIO 6: Conditions groupées par étape (Timeline)
  // ============================================================

  test('conditions are grouped by step for timeline display', async ({ assert }) => {
    // Create conditions at different steps
    await Condition.create({
      transactionId: 1,
      transactionStepId: 1,
      title: 'Step 3 Condition',
      labelFr: 'Condition Étape 3',
      labelEn: 'Step 3 Condition',
      level: 'required',
      sourceType: 'industry',
      status: 'completed',
      type: 'other',
      priority: 'medium',
      isBlocking: false,
      stepWhenCreated: 3,
      archived: true,
      archivedStep: 4,
    })

    await Condition.create({
      transactionId: 1,
      transactionStepId: 2,
      title: 'Step 4 Condition 1',
      labelFr: 'Condition Étape 4 - 1',
      labelEn: 'Step 4 Condition 1',
      level: 'blocking',
      sourceType: 'legal',
      status: 'completed',
      type: 'other',
      priority: 'high',
      isBlocking: true,
      stepWhenCreated: 4,
      archived: true,
      archivedStep: 5,
    })

    await Condition.create({
      transactionId: 1,
      transactionStepId: 2,
      title: 'Step 4 Condition 2',
      labelFr: 'Condition Étape 4 - 2',
      labelEn: 'Step 4 Condition 2',
      level: 'recommended',
      sourceType: 'best_practice',
      status: 'completed',
      resolutionType: 'not_applicable',
      type: 'other',
      priority: 'low',
      isBlocking: false,
      stepWhenCreated: 4,
      archived: true,
      archivedStep: 5,
    })

    // Get grouped conditions
    const grouped = await ConditionsEngineService.getConditionsGroupedByStep(1)

    // Verify grouping
    assert.isTrue(grouped.has(3))
    assert.isTrue(grouped.has(4))
    assert.lengthOf(grouped.get(3)!, 1)
    assert.lengthOf(grouped.get(4)!, 2)

    // Verify blocking comes first in step 4
    const step4Conditions = grouped.get(4)!
    assert.equal(step4Conditions[0].level, 'blocking')
  })
})

test.group('Conditions Engine - Edge Cases', () => {
  test('cannot archive condition with pending blocking', async ({ assert }) => {
    const blockingCondition = await Condition.create({
      transactionId: 2,
      transactionStepId: 1,
      title: 'Blocking Test',
      labelFr: 'Blocking Test',
      labelEn: 'Blocking Test',
      level: 'blocking',
      sourceType: 'legal',
      status: 'pending',
      type: 'other',
      priority: 'high',
      isBlocking: true,
      stepWhenCreated: 4,
      archived: false,
    })

    await assert.rejects(
      async () => {
        await ConditionsEngineService.archiveConditionsOnStepChange(2, 4, 5, 'user-1')
      },
      /Blocking condition .* is still pending/
    )
  })

  test('cannot archive required without explicit resolution', async ({ assert }) => {
    await Condition.create({
      transactionId: 3,
      transactionStepId: 1,
      title: 'Required Test',
      labelFr: 'Required Test',
      labelEn: 'Required Test',
      level: 'required',
      sourceType: 'industry',
      status: 'pending',
      type: 'other',
      priority: 'medium',
      isBlocking: false,
      stepWhenCreated: 4,
      archived: false,
    })

    await assert.rejects(
      async () => {
        await ConditionsEngineService.archiveConditionsOnStepChange(3, 4, 5, 'user-1')
      },
      /Required condition .* must be explicitly resolved/
    )
  })
})
