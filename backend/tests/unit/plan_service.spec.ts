import { test } from '@japa/runner'
import { PlanService } from '#services/plan_service'

test.group('PlanService', () => {
  test('meetsMinimum returns true for same plan tier', ({ assert }) => {
    assert.isTrue(PlanService.meetsMinimum('solo', 'solo'))
    assert.isTrue(PlanService.meetsMinimum('pro', 'pro'))
    assert.isTrue(PlanService.meetsMinimum('agence', 'agence'))
  })

  test('meetsMinimum returns true for higher plan tier', ({ assert }) => {
    assert.isTrue(PlanService.meetsMinimum('pro', 'solo'))
    assert.isTrue(PlanService.meetsMinimum('agence', 'solo'))
    assert.isTrue(PlanService.meetsMinimum('agence', 'pro'))
  })

  test('meetsMinimum returns false for lower plan tier', ({ assert }) => {
    assert.isFalse(PlanService.meetsMinimum('starter', 'solo'))
    assert.isFalse(PlanService.meetsMinimum('starter', 'pro'))
    assert.isFalse(PlanService.meetsMinimum('starter', 'agence'))
    assert.isFalse(PlanService.meetsMinimum('solo', 'pro'))
    assert.isFalse(PlanService.meetsMinimum('solo', 'agence'))
    assert.isFalse(PlanService.meetsMinimum('pro', 'agence'))
  })

  test('D53: trial user (null plan) gets Pro-level access', ({ assert }) => {
    assert.isTrue(PlanService.meetsMinimum(null, 'solo'))
    assert.isTrue(PlanService.meetsMinimum(null, 'pro'))
    assert.isFalse(PlanService.meetsMinimum(null, 'agence'))
  })

  test('D53: trial user (undefined plan) gets Pro-level access', ({ assert }) => {
    assert.isTrue(PlanService.meetsMinimum(undefined, 'solo'))
    assert.isTrue(PlanService.meetsMinimum(undefined, 'pro'))
    assert.isFalse(PlanService.meetsMinimum(undefined, 'agence'))
  })

  test('formatUpgradeError returns properly structured error', ({ assert }) => {
    const result = PlanService.formatUpgradeError('fintrac_identity', 'starter', 'solo')

    assert.deepEqual(result, {
      success: false,
      error: {
        message: 'This feature requires solo plan or higher',
        code: 'E_PLAN_UPGRADE_REQUIRED',
        meta: { feature: 'fintrac_identity', currentPlan: 'starter', requiredPlan: 'solo' },
      },
    })
  })
})
