import type { HttpContext } from '@adonisjs/core/http'
import Plan from '#models/plan'
import PlanChangeLog from '#models/plan_change_log'
import User from '#models/user'
import { updatePlanValidator } from '#validators/plan_validator'
import db from '@adonisjs/lucid/services/db'
import logger from '@adonisjs/core/services/logger'

export default class AdminPlansController {
  /**
   * GET /api/admin/plans
   * List all plans with subscriber counts and change logs
   */
  async index({ response }: HttpContext) {
    try {
      const plans = await Plan.query()
        .orderBy('display_order', 'asc')
        .withCount('changeLogs')

      // Get subscriber counts per plan
      const subscriberCounts = await db
        .from('users')
        .select('plan_id')
        .count('* as total')
        .count(db.raw('CASE WHEN is_founder = true THEN 1 END') as any, 'founders')
        .whereNotNull('plan_id')
        .groupBy('plan_id')

      const countMap = new Map<number, { total: number; founders: number }>()
      for (const row of subscriberCounts) {
        countMap.set(row.plan_id, {
          total: Number(row.total),
          founders: Number(row.founders),
        })
      }

      // Get recent change logs (last 50)
      const changeLogs = await PlanChangeLog.query()
        .preload('plan')
        .preload('admin')
        .orderBy('created_at', 'desc')
        .limit(50)

      const plansWithCounts = plans.map((plan) => {
        const counts = countMap.get(plan.id) || { total: 0, founders: 0 }
        return {
          ...plan.serialize(),
          subscriberCount: counts.total,
          founderCount: counts.founders,
        }
      })

      return response.ok({
        success: true,
        data: {
          plans: plansWithCounts,
          changeLogs: changeLogs.map((log) => ({
            id: log.id,
            planId: log.planId,
            planName: log.plan?.name,
            adminName: log.admin?.fullName || log.admin?.email,
            fieldChanged: log.fieldChanged,
            oldValue: log.oldValue,
            newValue: log.newValue,
            reason: log.reason,
            createdAt: log.createdAt,
          })),
        },
      })
    } catch (error) {
      logger.error({ err: error }, 'Failed to fetch plans')
      return response.internalServerError({
        success: false,
        error: { message: 'Failed to fetch plans', code: 'E_INTERNAL_ERROR' },
      })
    }
  }

  /**
   * PUT /api/admin/plans/:id
   * Update a plan and log all changes
   */
  async update({ params, request, response, auth }: HttpContext) {
    try {
      const plan = await Plan.findOrFail(params.id)
      const payload = await request.validateUsing(updatePlanValidator)

      const { reason, ...updates } = payload
      const adminId = auth.user!.id

      // Track which fields actually changed
      const changes: { field: string; oldValue: string | null; newValue: string | null }[] = []

      const editableFields = [
        'name',
        'monthlyPrice',
        'annualPrice',
        'maxTransactions',
        'maxStorageGb',
        'maxUsers',
        'historyMonths',
        'isActive',
        'displayOrder',
      ] as const

      for (const field of editableFields) {
        if (field in updates) {
          const oldVal = plan[field]
          const newVal = (updates as any)[field]

          // Compare values (handle null/undefined)
          const oldStr = oldVal === null || oldVal === undefined ? null : String(oldVal)
          const newStr = newVal === null || newVal === undefined ? null : String(newVal)

          if (oldStr !== newStr) {
            changes.push({
              field,
              oldValue: oldStr,
              newValue: newStr,
            })
            ;(plan as any)[field] = newVal
          }
        }
      }

      if (changes.length === 0) {
        return response.ok({
          success: true,
          data: { plan: plan.serialize(), changes: [] },
        })
      }

      // Save plan and create change logs in a transaction
      await db.transaction(async (trx) => {
        plan.useTransaction(trx)
        await plan.save()

        for (const change of changes) {
          await PlanChangeLog.create(
            {
              planId: plan.id,
              adminId,
              fieldChanged: change.field,
              oldValue: change.oldValue,
              newValue: change.newValue,
              reason,
            },
            { client: trx }
          )
        }
      })

      // Reload to get fresh data
      await plan.refresh()

      return response.ok({
        success: true,
        data: {
          plan: plan.serialize(),
          changes: changes.map((c) => ({
            field: c.field,
            oldValue: c.oldValue,
            newValue: c.newValue,
          })),
        },
      })
    } catch (error) {
      if (error.messages) {
        return response.unprocessableEntity({
          success: false,
          error: {
            message: 'Validation failed',
            code: 'E_VALIDATION_FAILED',
            details: error.messages,
          },
        })
      }
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.notFound({
          success: false,
          error: { message: 'Plan not found', code: 'E_NOT_FOUND' },
        })
      }
      logger.error({ err: error, planId: params.id }, 'Failed to update plan')
      return response.internalServerError({
        success: false,
        error: { message: 'Failed to update plan', code: 'E_INTERNAL_ERROR' },
      })
    }
  }

  /**
   * POST /api/admin/plans/:id/apply-to-existing
   * Bulk update planLockedPrice for non-founder users on this plan
   */
  async applyToExisting({ params, request, response, auth }: HttpContext) {
    try {
      const plan = await Plan.findOrFail(params.id)
      const { reason } = request.only(['reason'])

      if (!reason || typeof reason !== 'string' || reason.trim().length < 3) {
        return response.unprocessableEntity({
          success: false,
          error: { message: 'Reason is required (min 3 chars)', code: 'E_VALIDATION_FAILED' },
        })
      }

      // Find non-founder users on this plan
      const affectedUsers = await User.query()
        .where('planId', plan.id)
        .where('isFounder', false)

      if (affectedUsers.length === 0) {
        return response.ok({
          success: true,
          data: { affectedCount: 0, message: 'No non-founder users on this plan' },
        })
      }

      const adminId = auth.user!.id

      await db.transaction(async (trx) => {
        // Update planLockedPrice for each user based on their billing cycle
        for (const user of affectedUsers) {
          const newPrice =
            user.billingCycle === 'annual' ? plan.annualPrice : plan.monthlyPrice
          const oldPrice = user.planLockedPrice

          user.useTransaction(trx)
          user.planLockedPrice = newPrice
          await user.save()

          // Log the change
          await PlanChangeLog.create(
            {
              planId: plan.id,
              adminId,
              fieldChanged: 'apply_to_existing',
              oldValue: oldPrice !== null && oldPrice !== undefined ? String(oldPrice) : null,
              newValue: String(newPrice),
              reason: reason.trim(),
            },
            { client: trx }
          )
        }
      })

      return response.ok({
        success: true,
        data: {
          affectedCount: affectedUsers.length,
          planName: plan.name,
        },
      })
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.notFound({
          success: false,
          error: { message: 'Plan not found', code: 'E_NOT_FOUND' },
        })
      }
      logger.error({ err: error, planId: params.id }, 'Failed to apply plan to existing users')
      return response.internalServerError({
        success: false,
        error: { message: 'Failed to apply to existing users', code: 'E_INTERNAL_ERROR' },
      })
    }
  }

  /**
   * GET /api/admin/plan-changes
   * Paginated plan change history
   */
  async getChanges({ request, response }: HttpContext) {
    try {
      const page = Number(request.input('page', 1))
      const limit = Math.min(Number(request.input('limit', 20)), 100)

      const changeLogs = await PlanChangeLog.query()
        .preload('plan')
        .preload('admin')
        .orderBy('created_at', 'desc')
        .paginate(page, limit)

      return response.ok({
        success: true,
        data: {
          changes: changeLogs.all().map((log) => ({
            id: log.id,
            planId: log.planId,
            planName: log.plan?.name,
            adminName: log.admin?.fullName || log.admin?.email,
            fieldChanged: log.fieldChanged,
            oldValue: log.oldValue,
            newValue: log.newValue,
            reason: log.reason,
            createdAt: log.createdAt,
          })),
          meta: changeLogs.getMeta(),
        },
      })
    } catch (error) {
      logger.error({ err: error }, 'Failed to fetch plan changes')
      return response.internalServerError({
        success: false,
        error: { message: 'Failed to fetch plan changes', code: 'E_INTERNAL_ERROR' },
      })
    }
  }
}
