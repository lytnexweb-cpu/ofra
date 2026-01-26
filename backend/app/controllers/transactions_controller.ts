import type { HttpContext } from '@adonisjs/core/http'
import Transaction, { TransactionType, TransactionStatus } from '#models/transaction'
import TransactionStatusHistory from '#models/transaction_status_history'
import {
  createTransactionValidator,
  updateTransactionValidator,
  updateStatusValidator,
} from '#validators/transaction_validator'
import { TransactionAutomationService } from '#services/transaction_automation_service'
import { TemplateService } from '#services/template_service'
import { OfferService } from '#services/offer_service'
import {
  isValidTransition,
  getTransitionError,
  getAllowedTransitions,
  STATUS_LABELS,
} from '#services/transaction_state_machine'
import env from '#start/env'

interface CreateTransactionData {
  clientId: number
  propertyId?: number | null
  type: TransactionType
  status: TransactionStatus
  salePrice?: number | null
  notesText?: string | null
  listPrice?: number | null
  commission?: number | null
  ownerUserId: number
}

interface UpdateTransactionData {
  clientId?: number
  propertyId?: number | null
  type?: TransactionType
  salePrice?: number | null
  notesText?: string | null
  listPrice?: number | null
  commission?: number | null
}

export default class TransactionsController {
  async index({ request, response, auth }: HttpContext) {
    try {
      const { status, q } = request.qs()
      const query = Transaction.query()
        .where('owner_user_id', auth.user!.id)
        .preload('client')
        .preload('property')
        .preload('conditions')
        .preload('offers', (offerQuery) => {
          offerQuery.preload('revisions', (revQuery) => revQuery.orderBy('revision_number', 'desc').limit(1))
        })

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

      // Extract templateId from payload (not part of transaction data)
      const { templateId, ...transactionPayload } = payload

      const transactionData: CreateTransactionData = {
        ...transactionPayload,
        ownerUserId: auth.user!.id,
        status: transactionPayload.status || 'active',
      }

      const transaction = await Transaction.create(transactionData)

      // Apply template if provided
      if (templateId) {
        try {
          await TemplateService.applyTemplate(transaction, templateId)
        } catch (templateError) {
          console.error('[TransactionsController] Template application error:', templateError)
        }
      }

      await transaction.load('client')
      await transaction.load('conditions')
      await transaction.load('offers')
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
        .preload('offers', (offerQuery) => {
          offerQuery
            .preload('revisions', (revQuery) => revQuery.orderBy('revision_number', 'asc'))
            .orderBy('created_at', 'desc')
        })
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

      const updateData: UpdateTransactionData = {
        ...payload,
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

      // Validate status transition
      if (!isValidTransition(oldStatus, payload.status)) {
        const errorMessage = getTransitionError(oldStatus, payload.status)
        console.log(`[INVALID_TRANSITION] Transaction ${transaction.id}: ${errorMessage}`)
        return response.badRequest({
          success: false,
          error: {
            message: errorMessage,
            code: 'E_INVALID_TRANSITION',
            currentStatus: oldStatus,
            requestedStatus: payload.status,
          },
        })
      }

      // Business rule: require accepted offer before moving to conditional or firm
      if (['conditional', 'firm'].includes(payload.status)) {
        const hasAccepted = await OfferService.hasAcceptedOffer(transaction.id)
        if (!hasAccepted) {
          console.log(
            `[OFFER_REQUIRED] Transaction ${transaction.id}: Cannot move to ${payload.status} without accepted offer`
          )
          return response.badRequest({
            success: false,
            error: {
              message: `Cannot change status to "${STATUS_LABELS[payload.status]}": an accepted offer is required`,
              code: 'E_NO_ACCEPTED_OFFER',
            },
          })
        }
      }

      // Enforce blocking conditions if feature flag is enabled
      if (env.get('ENFORCE_BLOCKING_CONDITIONS') === true) {
        await transaction.load('conditions', (query) => {
          query.where('stage', oldStatus).where('is_blocking', true).where('status', 'pending')
        })

        const blockingConditions = transaction.conditions

        if (blockingConditions.length > 0) {
          const conditionTitles = blockingConditions.map((c) => c.title).join(', ')

          console.log(
            `[BLOCKING] Transaction ${transaction.id}: Status change ${oldStatus} -> ${payload.status} BLOCKED by ${blockingConditions.length} condition(s): ${conditionTitles}`
          )

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

      console.log(
        `[STATUS_CHANGE] Transaction ${transaction.id}: ${oldStatus} -> ${payload.status} by user ${auth.user!.id}`
      )

      // Automatic email sending
      try {
        await TransactionAutomationService.handleStatusChange(
          transaction,
          oldStatus,
          payload.status
        )
      } catch (emailError) {
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

      if (transaction.ownerUserId !== auth.user!.id) {
        return response.notFound({
          success: false,
          error: {
            message: 'Transaction not found',
            code: 'E_NOT_FOUND',
          },
        })
      }

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

  async allowedTransitions({ params, response, auth }: HttpContext) {
    try {
      const transaction = await Transaction.query()
        .where('id', params.id)
        .where('owner_user_id', auth.user!.id)
        .firstOrFail()

      const allowedStatuses = getAllowedTransitions(transaction.status)
      const transitions = allowedStatuses.map((status) => ({
        status,
        label: STATUS_LABELS[status],
      }))

      return response.ok({
        success: true,
        data: {
          currentStatus: transaction.status,
          currentStatusLabel: STATUS_LABELS[transaction.status],
          allowedTransitions: transitions,
        },
      })
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
          message: 'Failed to get allowed transitions',
          code: 'E_INTERNAL_ERROR',
        },
      })
    }
  }
}
