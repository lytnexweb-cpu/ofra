import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import Transaction from '#models/transaction'
import TransactionStatusHistory from '#models/transaction_status_history'
import {
  createTransactionValidator,
  updateTransactionValidator,
  updateStatusValidator,
} from '#validators/transaction_validator'
import { TransactionAutomationService } from '#services/transaction_automation_service'
import env from '#start/env'

export default class TransactionsController {
  async index({ request, response, auth }: HttpContext) {
    try {
      const { status, q } = request.qs()
      const query = Transaction.query()
        .where('owner_user_id', auth.user!.id)
        .preload('client')
        .preload('property')
        .preload('conditions')

      if (status) {
        query.where('status', status)
      }

      if (q) {
        query.whereHas('client', (clientQuery) => {
          clientQuery
            .whereILike('first_name', `%${q}%`)
            .orWhereILike('last_name', `%${q}%`)
            .orWhereILike('email', `%${q}%`)
        })
      }

      const transactions = await query.orderBy('created_at', 'desc')

      return response.ok({
        success: true,
        data: { transactions },
      })
    } catch (error) {
      return response.internalServerError({
        success: false,
        error: {
          message: 'Failed to retrieve transactions',
          code: 'E_INTERNAL_ERROR',
        },
      })
    }
  }

  async store({ request, response, auth }: HttpContext) {
    try {
      const payload = await request.validateUsing(createTransactionValidator)

      // Validate counterOffer logic
      if (payload.counterOfferEnabled && !payload.counterOfferPrice) {
        return response.unprocessableEntity({
          success: false,
          error: {
            message: 'Counter offer price is required when counter offer is enabled',
            code: 'E_VALIDATION_FAILED',
          },
        })
      }

      // If counterOfferEnabled is false, set counterOfferPrice to null
      const transactionData: any = {
        ...payload,
        ownerUserId: auth.user!.id,
        status: payload.status || 'consultation',
        counterOfferEnabled: payload.counterOfferEnabled ?? false,
        counterOfferPrice: payload.counterOfferEnabled ? payload.counterOfferPrice : null,
        offerExpiryAt: payload.offerExpiryAt ? DateTime.fromISO(payload.offerExpiryAt) : undefined,
      }

      const transaction = await Transaction.create(transactionData)

      await transaction.load('client')
      if (transaction.propertyId) {
        await transaction.load('property')
      }

      return response.created({
        success: true,
        data: { transaction },
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
      return response.internalServerError({
        success: false,
        error: {
          message: 'Failed to create transaction',
          code: 'E_INTERNAL_ERROR',
        },
      })
    }
  }

  async show({ params, response, auth }: HttpContext) {
    try {
      const transaction = await Transaction.query()
        .where('id', params.id)
        .where('owner_user_id', auth.user!.id)
        .preload('client')
        .preload('property')
        .preload('conditions')
        .preload('notes', (query) => {
          query.preload('author').orderBy('created_at', 'desc')
        })
        .firstOrFail()

      return response.ok({
        success: true,
        data: { transaction },
      })
    } catch (error) {
      return response.notFound({
        success: false,
        error: {
          message: 'Transaction not found',
          code: 'E_NOT_FOUND',
        },
      })
    }
  }

  async update({ params, request, response, auth }: HttpContext) {
    try {
      const transaction = await Transaction.query()
        .where('id', params.id)
        .where('owner_user_id', auth.user!.id)
        .firstOrFail()

      const payload = await request.validateUsing(updateTransactionValidator)

      // Validate counterOffer logic
      if (payload.counterOfferEnabled && !payload.counterOfferPrice) {
        return response.unprocessableEntity({
          success: false,
          error: {
            message: 'Counter offer price is required when counter offer is enabled',
            code: 'E_VALIDATION_FAILED',
          },
        })
      }

      // Prepare update data (set counterOfferPrice to null if disabled)
      const updateData: any = {
        ...payload,
        counterOfferPrice: payload.counterOfferEnabled === false ? null : payload.counterOfferPrice,
        offerExpiryAt: payload.offerExpiryAt ? DateTime.fromISO(payload.offerExpiryAt) : undefined,
      }

      transaction.merge(updateData)
      await transaction.save()

      await transaction.load('client')
      if (transaction.propertyId) {
        await transaction.load('property')
      }

      return response.ok({
        success: true,
        data: { transaction },
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
          error: {
            message: 'Transaction not found',
            code: 'E_NOT_FOUND',
          },
        })
      }
      return response.internalServerError({
        success: false,
        error: {
          message: 'Failed to update transaction',
          code: 'E_INTERNAL_ERROR',
        },
      })
    }
  }

  async updateStatus({ params, request, response, auth }: HttpContext) {
    try {
      const transaction = await Transaction.query()
        .where('id', params.id)
        .where('owner_user_id', auth.user!.id)
        .firstOrFail()

      const payload = await request.validateUsing(updateStatusValidator)
      const oldStatus = transaction.status

      // Enforce blocking conditions if feature flag is enabled
      if (env.get('ENFORCE_BLOCKING_CONDITIONS') === true) {
        // Load blocking conditions for the current status
        await transaction.load('conditions', (query) => {
          query
            .where('stage', oldStatus)
            .where('is_blocking', true)
            .where('status', 'pending')
        })

        const blockingConditions = transaction.conditions

        if (blockingConditions.length > 0) {
          const conditionTitles = blockingConditions.map((c) => c.title).join(', ')

          // Log blocked status change attempt
          console.log(`[BLOCKING] Transaction ${transaction.id}: Status change ${oldStatus} -> ${payload.status} BLOCKED by ${blockingConditions.length} condition(s): ${conditionTitles}`)

          return response.badRequest({
            success: false,
            error: {
              message: `Cannot change status: ${blockingConditions.length} blocking condition(s) must be completed first: ${conditionTitles}`,
              code: 'E_BLOCKING_CONDITIONS',
              blockingConditions: blockingConditions.map((c) => ({
                id: c.id,
                title: c.title,
                dueDate: c.dueDate,
              })),
            },
          })
        }
      }

      transaction.status = payload.status
      await transaction.save()

      await TransactionStatusHistory.create({
        transactionId: transaction.id,
        changedByUserId: auth.user!.id,
        fromStatus: oldStatus,
        toStatus: payload.status,
        note: payload.note,
      })

      // Log successful status change
      console.log(`[STATUS_CHANGE] Transaction ${transaction.id}: ${oldStatus} -> ${payload.status} by user ${auth.user!.id}`)

      // Automatic email sending to client if applicable
      // (email sending should not block the response)
      try {
        await TransactionAutomationService.handleStatusChange(
          transaction,
          oldStatus,
          payload.status
        )
      } catch (emailError) {
        // Log the error but don't fail the request
        console.error('[TransactionController] Email automation sending error:', emailError)
      }

      return response.ok({
        success: true,
        data: { transaction },
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
          error: {
            message: 'Transaction not found',
            code: 'E_NOT_FOUND',
          },
        })
      }
      return response.internalServerError({
        success: false,
        error: {
          message: 'Failed to update transaction status',
          code: 'E_INTERNAL_ERROR',
        },
      })
    }
  }

  async destroy({ params, response, auth }: HttpContext) {
    try {
      const transaction = await Transaction.findOrFail(params.id)

      // Verify ownership (multi-tenancy)
      if (transaction.ownerUserId !== auth.user!.id) {
        return response.notFound({
          success: false,
          error: {
            message: 'Transaction not found',
            code: 'E_NOT_FOUND',
          },
        })
      }

      // Delete transaction (cascades will handle conditions, notes, status_histories)
      await transaction.delete()

      return response.noContent()
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.notFound({
          success: false,
          error: {
            message: 'Transaction not found',
            code: 'E_NOT_FOUND',
          },
        })
      }
      return response.internalServerError({
        success: false,
        error: {
          message: 'Failed to delete transaction',
          code: 'E_INTERNAL_ERROR',
        },
      })
    }
  }
}
