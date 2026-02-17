import type { HttpContext } from '@adonisjs/core/http'
import { FintracService } from '#services/fintrac_service'
import { PlanService } from '#services/plan_service'
import { TenantScopeService } from '#services/tenant_scope_service'
import { completeFintracValidator } from '#validators/fintrac_validator'
import FintracRecord from '#models/fintrac_record'
import Transaction from '#models/transaction'
import logger from '@adonisjs/core/services/logger'

export default class FintracController {
  /**
   * Load a FINTRAC record and verify the authenticated user
   * has access to its parent transaction via TenantScope.
   */
  private async loadRecordWithOwnershipCheck(recordId: number, auth: HttpContext['auth']) {
    const record = await FintracRecord.query()
      .where('id', recordId)
      .preload('party')
      .preload('verifiedBy')
      .firstOrFail()

    const transaction = await Transaction.findOrFail(record.transactionId)

    if (!TenantScopeService.canAccess(transaction, auth.user!)) {
      throw { code: 'E_AUTHORIZATION_FAILURE', status: 403 }
    }

    return record
  }
  /**
   * List all FINTRAC records for a transaction
   * GET /api/transactions/:id/fintrac
   */
  async index({ params, response }: HttpContext) {
    try {
      const records = await FintracService.getRecords(params.id)

      return response.ok({
        success: true,
        data: {
          records,
          isCompliant: await FintracService.isCompliant(params.id),
        },
      })
    } catch (error) {
      logger.error({ error, transactionId: params.id }, 'Failed to retrieve FINTRAC records')
      return response.internalServerError({
        success: false,
        error: { message: 'Failed to retrieve FINTRAC records', code: 'E_INTERNAL_ERROR' },
      })
    }
  }

  /**
   * Get a single FINTRAC record
   * GET /api/fintrac/:id
   */
  async show({ params, response, auth }: HttpContext) {
    try {
      const record = await this.loadRecordWithOwnershipCheck(params.id, auth)

      return response.ok({
        success: true,
        data: { record },
      })
    } catch (error) {
      if (error.code === 'E_AUTHORIZATION_FAILURE') {
        return response.forbidden({
          success: false,
          error: { message: 'Access denied', code: 'E_AUTHORIZATION_FAILURE' },
        })
      }
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.notFound({
          success: false,
          error: { message: 'FINTRAC record not found', code: 'E_NOT_FOUND' },
        })
      }
      logger.error({ error, recordId: params.id }, 'Failed to retrieve FINTRAC record')
      return response.internalServerError({
        success: false,
        error: { message: 'Failed to retrieve FINTRAC record', code: 'E_INTERNAL_ERROR' },
      })
    }
  }

  /**
   * Complete a FINTRAC record with identity data
   * PATCH /api/fintrac/:id/complete
   */
  async complete({ params, request, response, auth }: HttpContext) {
    try {
      // Ownership check: verify user can access parent transaction
      await this.loadRecordWithOwnershipCheck(params.id, auth)

      // Gate: FINTRAC identity verification requires Solo+
      await auth.user!.load('plan')
      if (!PlanService.meetsMinimum(auth.user!.plan?.slug, 'solo')) {
        return response.forbidden(
          PlanService.formatUpgradeError('fintrac_identity', auth.user!.plan?.slug ?? 'none', 'solo')
        )
      }

      const payload = await request.validateUsing(completeFintracValidator)

      const record = await FintracService.complete(params.id, payload, auth.user!.id)

      return response.ok({
        success: true,
        data: { record },
      })
    } catch (error) {
      if (error.code === 'E_AUTHORIZATION_FAILURE') {
        return response.forbidden({
          success: false,
          error: { message: 'Access denied', code: 'E_AUTHORIZATION_FAILURE' },
        })
      }
      if (error.messages) {
        return response.unprocessableEntity({
          success: false,
          error: { message: 'Validation failed', code: 'E_VALIDATION_FAILED', details: error.messages },
        })
      }
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.notFound({
          success: false,
          error: { message: 'FINTRAC record not found', code: 'E_NOT_FOUND' },
        })
      }
      logger.error({ error, recordId: params.id }, 'Failed to complete FINTRAC record')
      return response.internalServerError({
        success: false,
        error: { message: 'Failed to complete FINTRAC record', code: 'E_INTERNAL_ERROR' },
      })
    }
  }

  /**
   * Auto-resolve FINTRAC condition after completion + evidence upload
   * POST /api/fintrac/:id/resolve
   */
  async resolve({ params, response, auth }: HttpContext) {
    try {
      // Ownership check: verify user can access parent transaction
      await this.loadRecordWithOwnershipCheck(params.id, auth)

      // Gate: FINTRAC identity verification requires Solo+
      await auth.user!.load('plan')
      if (!PlanService.meetsMinimum(auth.user!.plan?.slug, 'solo')) {
        return response.forbidden(
          PlanService.formatUpgradeError('fintrac_identity', auth.user!.plan?.slug ?? 'none', 'solo')
        )
      }

      const record = await FintracRecord.findOrFail(params.id)

      if (!record.verifiedAt) {
        return response.unprocessableEntity({
          success: false,
          error: { message: 'FINTRAC record must be completed before resolving', code: 'E_FINTRAC_INCOMPLETE' },
        })
      }

      await FintracService.resolveConditionForParty(
        record.transactionId,
        record.partyId,
        auth.user!.id
      )

      return response.ok({
        success: true,
        data: { message: 'FINTRAC condition resolved' },
      })
    } catch (error) {
      if (error.code === 'E_AUTHORIZATION_FAILURE') {
        return response.forbidden({
          success: false,
          error: { message: 'Access denied', code: 'E_AUTHORIZATION_FAILURE' },
        })
      }
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.notFound({
          success: false,
          error: { message: 'FINTRAC record not found', code: 'E_NOT_FOUND' },
        })
      }
      logger.error({ error, recordId: params.id }, 'Failed to resolve FINTRAC condition')
      return response.internalServerError({
        success: false,
        error: { message: 'Failed to resolve FINTRAC condition', code: 'E_INTERNAL_ERROR' },
      })
    }
  }
}
