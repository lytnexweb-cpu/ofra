import type { HttpContext } from '@adonisjs/core/http'
import Transaction from '#models/transaction'
import TransactionParty from '#models/transaction_party'
import { createPartyValidator, updatePartyValidator } from '#validators/transaction_party_validator'
import { TenantScopeService } from '#services/tenant_scope_service'
import { FintracService } from '#services/fintrac_service'
import logger from '@adonisjs/core/services/logger'

export default class TransactionPartiesController {
  async index({ params, response, auth }: HttpContext) {
    try {
      const query = Transaction.query().where('id', params.id)
      TenantScopeService.apply(query, auth.user!)
      const transaction = await query.firstOrFail()

      const parties = await TransactionParty.query()
        .where('transaction_id', transaction.id)
        .orderBy('is_primary', 'desc')
        .orderBy('created_at', 'asc')

      return response.ok({
        success: true,
        data: { parties },
      })
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.notFound({
          success: false,
          error: { message: 'Transaction not found', code: 'E_NOT_FOUND' },
        })
      }
      logger.error({ error, transactionId: params.id }, 'Failed to retrieve parties')
      return response.internalServerError({
        success: false,
        error: { message: 'Failed to retrieve parties', code: 'E_INTERNAL_ERROR' },
      })
    }
  }

  async store({ params, request, response, auth }: HttpContext) {
    try {
      const query = Transaction.query().where('id', params.id)
      TenantScopeService.apply(query, auth.user!)
      const transaction = await query.firstOrFail()

      const payload = await request.validateUsing(createPartyValidator)
      const party = await TransactionParty.create({
        ...payload,
        transactionId: transaction.id,
      })

      // FINTRAC: Auto-create condition if transaction is at/past firm-pending
      try {
        await FintracService.onPartyAdded(transaction, party, auth.user!.id)
      } catch (fintracError) {
        logger.error({ fintracError, partyId: party.id }, 'FINTRAC onPartyAdded failed — non-blocking')
      }

      return response.created({
        success: true,
        data: { party },
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
          error: { message: 'Transaction not found', code: 'E_NOT_FOUND' },
        })
      }
      logger.error({ error, transactionId: params.id }, 'Failed to create party')
      return response.internalServerError({
        success: false,
        error: { message: 'Failed to create party', code: 'E_INTERNAL_ERROR' },
      })
    }
  }

  async update({ params, request, response, auth }: HttpContext) {
    try {
      const party = await TransactionParty.findOrFail(params.id)

      const txQuery = Transaction.query().where('id', party.transactionId)
      TenantScopeService.apply(txQuery, auth.user!)
      await txQuery.firstOrFail()

      const payload = await request.validateUsing(updatePartyValidator)
      party.merge(payload)
      await party.save()

      return response.ok({
        success: true,
        data: { party },
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
          error: { message: 'Party not found', code: 'E_NOT_FOUND' },
        })
      }
      logger.error({ error, partyId: params.id }, 'Failed to update party')
      return response.internalServerError({
        success: false,
        error: { message: 'Failed to update party', code: 'E_INTERNAL_ERROR' },
      })
    }
  }

  async destroy({ params, response, auth }: HttpContext) {
    try {
      const party = await TransactionParty.findOrFail(params.id)

      const txQuery = Transaction.query().where('id', party.transactionId)
      TenantScopeService.apply(txQuery, auth.user!)
      await txQuery.firstOrFail()

      // FINTRAC: Archive condition if party is removed
      const transaction = await Transaction.findOrFail(party.transactionId)
      try {
        await FintracService.onPartyRemoved(transaction, party, auth.user!.id)
      } catch (fintracError) {
        logger.error({ fintracError, partyId: party.id }, 'FINTRAC onPartyRemoved failed — non-blocking')
      }

      await party.delete()
      return response.noContent()
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.notFound({
          success: false,
          error: { message: 'Party not found', code: 'E_NOT_FOUND' },
        })
      }
      logger.error({ error, partyId: params.id }, 'Failed to delete party')
      return response.internalServerError({
        success: false,
        error: { message: 'Failed to delete party', code: 'E_INTERNAL_ERROR' },
      })
    }
  }
}
