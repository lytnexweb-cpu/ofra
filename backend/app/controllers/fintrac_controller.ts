import type { HttpContext } from '@adonisjs/core/http'
import { FintracService } from '#services/fintrac_service'
import { completeFintracValidator } from '#validators/fintrac_validator'
import FintracRecord from '#models/fintrac_record'
import logger from '@adonisjs/core/services/logger'

export default class FintracController {
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
  async show({ params, response }: HttpContext) {
    try {
      const record = await FintracRecord.query()
        .where('id', params.id)
        .preload('party')
        .preload('verifiedBy')
        .firstOrFail()

      return response.ok({
        success: true,
        data: { record },
      })
    } catch (error) {
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
      const payload = await request.validateUsing(completeFintracValidator)

      const record = await FintracService.complete(params.id, payload, auth.user!.id)

      return response.ok({
        success: true,
        data: { record },
      })
    } catch (error) {
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
