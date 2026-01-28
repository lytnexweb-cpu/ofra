import type { HttpContext } from '@adonisjs/core/http'
import Transaction from '#models/transaction'
import {
  createTransactionValidator,
  updateTransactionValidator,
} from '#validators/transaction_validator'
import { WorkflowEngineService } from '#services/workflow_engine_service'
import { ActivityFeedService } from '#services/activity_feed_service'

export default class TransactionsController {
  async index({ request, response, auth }: HttpContext) {
    try {
      const { step, q } = request.qs()
      const query = Transaction.query()
        .where('owner_user_id', auth.user!.id)
        .preload('client')
        .preload('property')
        .preload('currentStep', (sq) => sq.preload('workflowStep'))
        .preload('transactionSteps', (sq) => sq.orderBy('step_order', 'asc'))
        .preload('conditions')
        .preload('offers', (offerQuery) => {
          offerQuery.preload('revisions', (revQuery) =>
            revQuery.orderBy('revision_number', 'desc').limit(1)
          )
        })

      if (step) {
        query.whereHas('currentStep', (sq) => {
          sq.whereHas('workflowStep', (wsq) => wsq.where('slug', step))
        })
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
        error: { message: 'Failed to retrieve transactions', code: 'E_INTERNAL_ERROR' },
      })
    }
  }

  async store({ request, response, auth }: HttpContext) {
    try {
      const payload = await request.validateUsing(createTransactionValidator)

      const transaction = await WorkflowEngineService.createTransactionFromTemplate({
        templateId: payload.workflowTemplateId,
        ownerUserId: auth.user!.id,
        clientId: payload.clientId,
        propertyId: payload.propertyId ?? null,
        type: payload.type,
        salePrice: payload.salePrice ?? null,
        listPrice: payload.listPrice ?? null,
        commission: payload.commission ?? null,
        notesText: payload.notesText ?? null,
        folderUrl: payload.folderUrl ?? null,
      })

      // Reload with full relations
      await transaction.load('client')
      await transaction.load('conditions')
      await transaction.load('offers')
      await transaction.load('currentStep', (sq) => sq.preload('workflowStep'))
      await transaction.load('transactionSteps', (sq) => sq.orderBy('step_order', 'asc'))
      if (transaction.propertyId) await transaction.load('property')

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
        error: { message: 'Failed to create transaction', code: 'E_INTERNAL_ERROR' },
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
        .preload('currentStep', (sq) => sq.preload('workflowStep'))
        .preload('transactionSteps', (sq) => {
          sq.orderBy('step_order', 'asc').preload('workflowStep').preload('conditions')
        })
        .preload('conditions')
        .preload('offers', (offerQuery) => {
          offerQuery
            .preload('revisions', (revQuery) => revQuery.orderBy('revision_number', 'asc'))
            .orderBy('created_at', 'desc')
        })
        .preload('notes', (nq) => {
          nq.preload('author').orderBy('created_at', 'desc')
        })
        .firstOrFail()

      return response.ok({
        success: true,
        data: { transaction },
      })
    } catch (error) {
      return response.notFound({
        success: false,
        error: { message: 'Transaction not found', code: 'E_NOT_FOUND' },
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
      transaction.merge(payload)
      await transaction.save()

      await transaction.load('client')
      if (transaction.propertyId) await transaction.load('property')

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
          error: { message: 'Transaction not found', code: 'E_NOT_FOUND' },
        })
      }
      return response.internalServerError({
        success: false,
        error: { message: 'Failed to update transaction', code: 'E_INTERNAL_ERROR' },
      })
    }
  }

  async advanceStep({ params, response, auth }: HttpContext) {
    try {
      const transaction = await Transaction.query()
        .where('id', params.id)
        .where('owner_user_id', auth.user!.id)
        .firstOrFail()

      const result = await WorkflowEngineService.advanceStep(transaction.id, auth.user!.id)

      // Reload full data
      await result.transaction.load('currentStep', (sq) => sq.preload('workflowStep'))
      await result.transaction.load('transactionSteps', (sq) => sq.orderBy('step_order', 'asc'))

      return response.ok({
        success: true,
        data: {
          transaction: result.transaction,
          newStep: result.newStep,
        },
      })
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.notFound({
          success: false,
          error: { message: 'Transaction not found', code: 'E_NOT_FOUND' },
        })
      }
      if (error.code === 'E_STEP_NOT_ACTIVE') {
        return response.conflict({
          success: false,
          error: { message: error.message, code: 'E_STEP_NOT_ACTIVE' },
        })
      }
      if (error.code === 'E_BLOCKING_CONDITIONS') {
        return response.badRequest({
          success: false,
          error: {
            message: error.message,
            code: 'E_BLOCKING_CONDITIONS',
            blockingConditions: error.blockingConditions?.map((c: any) => ({
              id: c.id,
              title: c.title,
              dueDate: c.dueDate,
            })),
          },
        })
      }
      return response.internalServerError({
        success: false,
        error: { message: 'Failed to advance step', code: 'E_INTERNAL_ERROR' },
      })
    }
  }

  async skipStep({ params, response, auth }: HttpContext) {
    try {
      const transaction = await Transaction.query()
        .where('id', params.id)
        .where('owner_user_id', auth.user!.id)
        .firstOrFail()

      const result = await WorkflowEngineService.skipStep(transaction.id, auth.user!.id)

      await result.transaction.load('currentStep', (sq) => sq.preload('workflowStep'))
      await result.transaction.load('transactionSteps', (sq) => sq.orderBy('step_order', 'asc'))

      return response.ok({
        success: true,
        data: {
          transaction: result.transaction,
          newStep: result.newStep,
        },
      })
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.notFound({
          success: false,
          error: { message: 'Transaction not found', code: 'E_NOT_FOUND' },
        })
      }
      if (error.code === 'E_STEP_NOT_ACTIVE') {
        return response.conflict({
          success: false,
          error: { message: error.message, code: 'E_STEP_NOT_ACTIVE' },
        })
      }
      return response.internalServerError({
        success: false,
        error: { message: 'Failed to skip step', code: 'E_INTERNAL_ERROR' },
      })
    }
  }

  async goToStep({ params, response, auth }: HttpContext) {
    try {
      const transaction = await Transaction.query()
        .where('id', params.id)
        .where('owner_user_id', auth.user!.id)
        .firstOrFail()

      const targetStepOrder = Number(params.stepOrder)
      if (!targetStepOrder || targetStepOrder < 1) {
        return response.badRequest({
          success: false,
          error: { message: 'Invalid step order', code: 'E_INVALID_STEP' },
        })
      }

      const result = await WorkflowEngineService.goToStep(
        transaction.id,
        targetStepOrder,
        auth.user!.id
      )

      await result.transaction.load('currentStep', (sq) => sq.preload('workflowStep'))
      await result.transaction.load('transactionSteps', (sq) => sq.orderBy('step_order', 'asc'))

      return response.ok({
        success: true,
        data: {
          transaction: result.transaction,
          newStep: result.newStep,
        },
      })
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.notFound({
          success: false,
          error: { message: 'Transaction not found', code: 'E_NOT_FOUND' },
        })
      }
      return response.badRequest({
        success: false,
        error: { message: error.message || 'Failed to go to step', code: 'E_GOTO_FAILED' },
      })
    }
  }

  async activity({ params, request, response, auth }: HttpContext) {
    try {
      // Verify ownership
      await Transaction.query()
        .where('id', params.id)
        .where('owner_user_id', auth.user!.id)
        .firstOrFail()

      const page = Number(request.qs().page) || 1
      const limit = Number(request.qs().limit) || 20

      const activities = await ActivityFeedService.getForTransaction(params.id, page, limit)

      return response.ok({
        success: true,
        data: activities,
      })
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.notFound({
          success: false,
          error: { message: 'Transaction not found', code: 'E_NOT_FOUND' },
        })
      }
      return response.internalServerError({
        success: false,
        error: { message: 'Failed to retrieve activity', code: 'E_INTERNAL_ERROR' },
      })
    }
  }

  async destroy({ params, response, auth }: HttpContext) {
    try {
      const transaction = await Transaction.findOrFail(params.id)

      if (transaction.ownerUserId !== auth.user!.id) {
        return response.notFound({
          success: false,
          error: { message: 'Transaction not found', code: 'E_NOT_FOUND' },
        })
      }

      await transaction.delete()
      return response.noContent()
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.notFound({
          success: false,
          error: { message: 'Transaction not found', code: 'E_NOT_FOUND' },
        })
      }
      return response.internalServerError({
        success: false,
        error: { message: 'Failed to delete transaction', code: 'E_INTERNAL_ERROR' },
      })
    }
  }
}
