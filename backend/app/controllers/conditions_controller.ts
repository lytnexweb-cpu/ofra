import type { HttpContext } from '@adonisjs/core/http'
import Condition from '#models/condition'
import Transaction from '#models/transaction'
import {
  createConditionValidator,
  updateConditionValidator,
} from '#validators/condition_validator'
import { ActivityFeedService } from '#services/activity_feed_service'
import { DateTime } from 'luxon'

export default class ConditionsController {
  async store({ params, request, response, auth }: HttpContext) {
    try {
      const transaction = await Transaction.query()
        .where('id', params.id)
        .where('owner_user_id', auth.user!.id)
        .firstOrFail()

      const payload = await request.validateUsing(createConditionValidator)

      // Default transactionStepId to the current step if not provided
      const transactionStepId =
        payload.transactionStepId ?? transaction.currentStepId ?? undefined

      const condition = await Condition.create({
        ...payload,
        transactionId: transaction.id,
        transactionStepId: transactionStepId ?? null,
        status: 'pending',
      })

      await ActivityFeedService.log({
        transactionId: transaction.id,
        userId: auth.user!.id,
        activityType: 'condition_created',
        metadata: { conditionId: condition.id, title: condition.title },
      })

      return response.created({
        success: true,
        data: { condition },
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
        error: { message: 'Failed to create condition', code: 'E_INTERNAL_ERROR' },
      })
    }
  }

  async update({ params, request, response, auth }: HttpContext) {
    try {
      const condition = await Condition.findOrFail(params.id)

      const transaction = await Transaction.query()
        .where('id', condition.transactionId)
        .where('owner_user_id', auth.user!.id)
        .first()

      if (!transaction) {
        return response.notFound({
          success: false,
          error: { message: 'Condition not found', code: 'E_NOT_FOUND' },
        })
      }

      const payload = await request.validateUsing(updateConditionValidator)
      condition.merge(payload)

      if (payload.status === 'pending') {
        condition.completedAt = null
      }
      if (payload.status === 'completed' && !condition.completedAt) {
        condition.completedAt = DateTime.now()
      }

      await condition.save()

      return response.ok({
        success: true,
        data: { condition },
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
          error: { message: 'Condition not found', code: 'E_NOT_FOUND' },
        })
      }
      return response.internalServerError({
        success: false,
        error: { message: 'Failed to update condition', code: 'E_INTERNAL_ERROR' },
      })
    }
  }

  async complete({ params, response, auth }: HttpContext) {
    try {
      const condition = await Condition.findOrFail(params.id)

      const transaction = await Transaction.query()
        .where('id', condition.transactionId)
        .where('owner_user_id', auth.user!.id)
        .first()

      if (!transaction) {
        return response.notFound({
          success: false,
          error: { message: 'Condition not found', code: 'E_NOT_FOUND' },
        })
      }

      condition.status = 'completed'
      condition.completedAt = DateTime.now()
      await condition.save()

      await ActivityFeedService.log({
        transactionId: transaction.id,
        userId: auth.user!.id,
        activityType: 'condition_completed',
        metadata: { conditionId: condition.id, title: condition.title },
      })

      return response.ok({
        success: true,
        data: { condition },
      })
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.notFound({
          success: false,
          error: { message: 'Condition not found', code: 'E_NOT_FOUND' },
        })
      }
      return response.internalServerError({
        success: false,
        error: { message: 'Failed to complete condition', code: 'E_INTERNAL_ERROR' },
      })
    }
  }

  async destroy({ params, response, auth }: HttpContext) {
    try {
      const condition = await Condition.findOrFail(params.id)

      const transaction = await Transaction.query()
        .where('id', condition.transactionId)
        .where('owner_user_id', auth.user!.id)
        .first()

      if (!transaction) {
        return response.notFound({
          success: false,
          error: { message: 'Condition not found', code: 'E_NOT_FOUND' },
        })
      }

      await condition.delete()
      return response.noContent()
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.notFound({
          success: false,
          error: { message: 'Condition not found', code: 'E_NOT_FOUND' },
        })
      }
      return response.internalServerError({
        success: false,
        error: { message: 'Failed to delete condition', code: 'E_INTERNAL_ERROR' },
      })
    }
  }
}
