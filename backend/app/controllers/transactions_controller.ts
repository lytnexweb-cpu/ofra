import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import mail from '@adonisjs/mail/services/main'
import Transaction from '#models/transaction'
import Property from '#models/property'
import {
  createTransactionValidator,
  updateTransactionValidator,
} from '#validators/transaction_validator'
import { WorkflowEngineService } from '#services/workflow_engine_service'
import { ActivityFeedService } from '#services/activity_feed_service'
import { NotificationService } from '#services/notification_service'
import { TenantScopeService } from '#services/tenant_scope_service'
import StepAdvancedMail from '#mails/step_advanced_mail'
import TransactionCancelledMail from '#mails/transaction_cancelled_mail'
import logger from '@adonisjs/core/services/logger'

export default class TransactionsController {
  async index({ request, response, auth }: HttpContext) {
    try {
      const { step, q, page = 1, limit = 50 } = request.qs()
      const baseQuery = Transaction.query()
      TenantScopeService.apply(baseQuery, auth.user!)

      // Optimization: Use withCount instead of preload for conditions
      // This prevents N+1 queries when listing many transactions
      // Full conditions are loaded via GET /transactions/:id or dedicated endpoint
      const query = baseQuery
        .preload('client')
        .preload('property')
        .preload('currentStep', (sq) => sq.preload('workflowStep'))
        .preload('transactionSteps', (sq) => sq.orderBy('step_order', 'asc'))
        .withCount('conditions')
        .withCount('conditions', (q) => {
          q.as('pendingConditionsCount').where('status', 'pending')
        })
        .withCount('conditions', (q) => {
          q.as('blockingConditionsCount').where('status', 'pending').where('level', 'blocking')
        })
        .preload('offers', (offerQuery) => {
          offerQuery.preload('revisions', (revQuery) =>
            revQuery.preload('fromParty').preload('toParty').orderBy('revision_number', 'desc').limit(1)
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

      // Pagination for large datasets
      const pageNum = Math.max(1, parseInt(String(page), 10) || 1)
      const limitNum = Math.min(100, Math.max(1, parseInt(String(limit), 10) || 50))

      const transactions = await query
        .orderBy('created_at', 'desc')
        .paginate(pageNum, limitNum)

      return response.ok({
        success: true,
        data: {
          transactions: transactions.all(),
          meta: {
            total: transactions.total,
            perPage: transactions.perPage,
            currentPage: transactions.currentPage,
            lastPage: transactions.lastPage,
          },
        },
      })
    } catch (error) {
      logger.error({ err: error }, 'Failed to retrieve transactions')
      return response.internalServerError({
        success: false,
        error: { message: 'Failed to retrieve transactions', code: 'E_INTERNAL_ERROR' },
      })
    }
  }

  async store({ request, response, auth }: HttpContext) {
    try {
      const payload = await request.validateUsing(createTransactionValidator)

      // E1: If address is provided without propertyId, auto-create a Property
      let propertyId = payload.propertyId ?? null
      if (!propertyId && payload.address) {
        const property = await Property.create({
          ownerUserId: auth.user!.id,
          address: payload.address,
          city: '',
          postalCode: '',
        })
        propertyId = property.id
      }

      const autoConditionsEnabled = payload.autoConditionsEnabled ?? true

      const transaction = await WorkflowEngineService.createTransactionFromTemplate({
        templateId: payload.workflowTemplateId,
        ownerUserId: auth.user!.id,
        organizationId: TenantScopeService.getOrganizationId(auth.user!),
        clientId: payload.clientId,
        propertyId,
        type: payload.type,
        salePrice: payload.salePrice ?? null,
        listPrice: payload.listPrice ?? null,
        commission: payload.commission ?? null,
        notesText: payload.notesText ?? null,
        folderUrl: payload.folderUrl ?? null,
        profile: autoConditionsEnabled && payload.profile ? payload.profile : undefined,
        autoConditionsEnabled,
      })

      // D53: Mark trial TX as used
      const user = auth.user!
      if (!user.planId && user.subscriptionStatus === 'trial' && !user.trialTxUsed) {
        user.trialTxUsed = true
        await user.save()
      }

      // Set closing date if provided
      if (payload.closingDate) {
        transaction.closingDate = DateTime.fromISO(payload.closingDate)
        await transaction.save()
      }

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
      const query = Transaction.query().where('id', params.id)
      TenantScopeService.apply(query, auth.user!)
      const transaction = await query
        .preload('client')
        .preload('property')
        .preload('currentStep', (sq) => sq.preload('workflowStep'))
        .preload('transactionSteps', (sq) => {
          sq.orderBy('step_order', 'asc').preload('workflowStep').preload('conditions')
        })
        .preload('conditions')
        .preload('offers', (offerQuery) => {
          offerQuery
            .preload('revisions', (revQuery) =>
              revQuery.preload('fromParty').preload('toParty').orderBy('revision_number', 'asc')
            )
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
      const query = Transaction.query().where('id', params.id)
      TenantScopeService.apply(query, auth.user!)
      const transaction = await query.firstOrFail()

      const payload = await request.validateUsing(updateTransactionValidator)

      // M09: Extract property fields before merging into transaction
      const { closingDate, offerExpiryDate, inspectionDeadline, financingDeadline, address, city, postalCode, province, ...rest } = payload
      transaction.merge(rest)
      if (closingDate !== undefined) transaction.closingDate = closingDate ? DateTime.fromISO(closingDate) : null
      if (offerExpiryDate !== undefined) transaction.offerExpiryDate = offerExpiryDate ? DateTime.fromISO(offerExpiryDate) : null
      if (inspectionDeadline !== undefined) transaction.inspectionDeadline = inspectionDeadline ? DateTime.fromISO(inspectionDeadline) : null
      if (financingDeadline !== undefined) transaction.financingDeadline = financingDeadline ? DateTime.fromISO(financingDeadline) : null
      await transaction.save()

      // M09: Update related property if property fields provided
      const propertyFields = { address, city, postalCode, province }
      const hasPropertyUpdate = Object.values(propertyFields).some((v) => v !== undefined)
      if (hasPropertyUpdate && transaction.propertyId) {
        const Property = (await import('#models/property')).default
        const property = await Property.find(transaction.propertyId)
        if (property) {
          if (address !== undefined) property.address = address
          if (city !== undefined) property.city = city
          if (postalCode !== undefined) property.postalCode = postalCode
          if (province !== undefined) property.province = province
          await property.save()
        }
      }

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

  async advanceStep({ params, request, response, auth }: HttpContext) {
    try {
      const { note, notifyEmail } = request.only(['note', 'notifyEmail'])
      const query = Transaction.query().where('id', params.id)
      TenantScopeService.apply(query, auth.user!)
      const transaction = await query.firstOrFail()

      const result = await WorkflowEngineService.advanceStep(transaction.id, auth.user!.id, {
        note,
        notifyEmail,
      })

      // Reload full data
      await result.transaction.load('currentStep', (sq) => sq.preload('workflowStep'))
      await result.transaction.load('transactionSteps', (sq) => sq.orderBy('step_order', 'asc'))

      // Email confirmation to broker (fire-and-forget)
      const fromStepName = result.newStep?.workflowStep?.name ?? 'N/A'
      const toStepName = result.transaction.currentStep?.workflowStep?.name ?? 'N/A'
      mail.send(new StepAdvancedMail({
        to: auth.user!.email,
        fromStepName,
        toStepName,
        transactionId: transaction.id,
        language: auth.user!.language,
      })).catch((mailError) => {
        logger.error({ mailError, transactionId: transaction.id }, 'Failed to send step advanced email — non-blocking')
      })

      // Notification twin for the broker
      const advLang = auth.user!.language?.substring(0, 2) || 'fr'
      try {
        await NotificationService.notify({
          userId: auth.user!.id,
          transactionId: transaction.id,
          type: 'step_advanced',
          icon: '📈',
          severity: 'info',
          title: advLang === 'fr'
            ? `Étape avancée: ${toStepName}`
            : `Step advanced: ${toStepName}`,
          link: `/transactions/${transaction.id}`,
        })
      } catch (notifError) {
        logger.error({ notifError }, 'Failed to create step advanced notification — non-blocking')
      }

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
              title: c.title ?? c.labelFr,
              dueDate: c.dueDate,
            })),
          },
        })
      }
      if (error.code === 'E_REQUIRED_RESOLUTIONS_NEEDED') {
        return response.badRequest({
          success: false,
          error: {
            message: error.message,
            code: 'E_REQUIRED_RESOLUTIONS_NEEDED',
            requiredConditions: error.requiredConditions?.map((c: any) => ({
              id: c.id,
              title: c.title ?? c.labelFr,
              level: c.level,
            })),
          },
        })
      }
      logger.error({ error, transactionId: params.id }, 'Failed to advance step')
      return response.internalServerError({
        success: false,
        error: { message: 'Failed to advance step', code: 'E_INTERNAL_ERROR' },
      })
    }
  }

  async skipStep({ params, response, auth }: HttpContext) {
    try {
      const query = Transaction.query().where('id', params.id)
      TenantScopeService.apply(query, auth.user!)
      const transaction = await query.firstOrFail()

      const result = await WorkflowEngineService.skipStep(transaction.id, auth.user!.id)

      await result.transaction.load('currentStep', (sq) => sq.preload('workflowStep'))
      await result.transaction.load('transactionSteps', (sq) => sq.orderBy('step_order', 'asc'))

      // Notification twin for the broker (skip = no email, just bell)
      const skipLang = auth.user!.language?.substring(0, 2) || 'fr'
      const skipStepName = result.transaction.currentStep?.workflowStep?.name ?? ''
      try {
        await NotificationService.notify({
          userId: auth.user!.id,
          transactionId: transaction.id,
          type: 'step_skipped',
          icon: '⏭️',
          severity: 'info',
          title: skipLang === 'fr'
            ? `Étape sautée → ${skipStepName}`
            : `Step skipped → ${skipStepName}`,
          link: `/transactions/${transaction.id}`,
        })
      } catch (notifError) {
        logger.error({ notifError }, 'Failed to create step skipped notification — non-blocking')
      }

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
      const query = Transaction.query().where('id', params.id)
      TenantScopeService.apply(query, auth.user!)
      const transaction = await query.firstOrFail()

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
      // Verify access
      const query = Transaction.query().where('id', params.id)
      TenantScopeService.apply(query, auth.user!)
      await query.firstOrFail()

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

  async cancel({ params, request, response, auth }: HttpContext) {
    try {
      const query = Transaction.query().where('id', params.id)
      TenantScopeService.apply(query, auth.user!)
      const transaction = await query.firstOrFail()

      const { reason } = request.only(['reason'])

      // Update transaction status to cancelled
      transaction.status = 'cancelled'
      transaction.cancelledAt = DateTime.now()
      transaction.cancellationReason = reason || null
      await transaction.save()

      // Log activity
      await ActivityFeedService.log({
        transactionId: transaction.id,
        userId: auth.user!.id,
        activityType: 'transaction_cancelled',
        metadata: { reason: reason || null },
      })

      await transaction.load('client')
      await transaction.load('currentStep', (sq) => sq.preload('workflowStep'))

      // Email confirmation to broker (fire-and-forget)
      mail.send(new TransactionCancelledMail({
        to: auth.user!.email,
        reason: reason || null,
        transactionId: transaction.id,
        language: auth.user!.language,
      })).catch((mailError) => {
        logger.error({ mailError, transactionId: transaction.id }, 'Failed to send transaction cancelled email — non-blocking')
      })

      // Notification twin for the broker
      const cancelLang = auth.user!.language?.substring(0, 2) || 'fr'
      try {
        await NotificationService.notify({
          userId: auth.user!.id,
          transactionId: transaction.id,
          type: 'transaction_cancelled',
          icon: '🚫',
          severity: 'warning',
          title: cancelLang === 'fr'
            ? 'Transaction annulée'
            : 'Transaction cancelled',
          body: reason || undefined,
          link: `/transactions/${transaction.id}`,
        })
      } catch (notifError) {
        logger.error({ notifError }, 'Failed to create transaction cancelled notification — non-blocking')
      }

      return response.ok({
        success: true,
        data: { transaction },
      })
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.notFound({
          success: false,
          error: { message: 'Transaction not found', code: 'E_NOT_FOUND' },
        })
      }
      logger.error({ error, transactionId: params.id }, 'Failed to cancel transaction')
      return response.internalServerError({
        success: false,
        error: { message: 'Failed to cancel transaction', code: 'E_INTERNAL_ERROR' },
      })
    }
  }

  async archive({ params, request, response, auth }: HttpContext) {
    try {
      const query = Transaction.query().where('id', params.id)
      TenantScopeService.apply(query, auth.user!)
      const transaction = await query.firstOrFail()

      if (transaction.status !== 'active') {
        return response.unprocessableEntity({
          success: false,
          error: {
            message: 'Only active transactions can be archived',
            code: 'E_INVALID_STATUS',
          },
        })
      }

      const { reason } = request.only(['reason'])

      transaction.status = 'archived'
      transaction.archivedAt = DateTime.now()
      transaction.archivedReason = reason || null
      await transaction.save()

      await ActivityFeedService.log({
        transactionId: transaction.id,
        userId: auth.user!.id,
        activityType: 'transaction_archived',
        metadata: { reason: reason || null },
      })

      await transaction.load('client')
      await transaction.load('currentStep', (sq) => sq.preload('workflowStep'))

      return response.ok({
        success: true,
        data: { transaction },
      })
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.notFound({
          success: false,
          error: { message: 'Transaction not found', code: 'E_NOT_FOUND' },
        })
      }
      logger.error({ error, transactionId: params.id }, 'Failed to archive transaction')
      return response.internalServerError({
        success: false,
        error: { message: 'Failed to archive transaction', code: 'E_INTERNAL_ERROR' },
      })
    }
  }

  async restore({ params, response, auth }: HttpContext) {
    try {
      const query = Transaction.query().where('id', params.id)
      TenantScopeService.apply(query, auth.user!)
      const transaction = await query.firstOrFail()

      if (transaction.status !== 'archived') {
        return response.unprocessableEntity({
          success: false,
          error: {
            message: 'Only archived transactions can be restored',
            code: 'E_INVALID_STATUS',
          },
        })
      }

      transaction.status = 'active'
      transaction.archivedAt = null
      transaction.archivedReason = null
      await transaction.save()

      await ActivityFeedService.log({
        transactionId: transaction.id,
        userId: auth.user!.id,
        activityType: 'transaction_restored',
        metadata: {},
      })

      await transaction.load('client')
      await transaction.load('currentStep', (sq) => sq.preload('workflowStep'))

      return response.ok({
        success: true,
        data: { transaction },
      })
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.notFound({
          success: false,
          error: { message: 'Transaction not found', code: 'E_NOT_FOUND' },
        })
      }
      logger.error({ error, transactionId: params.id }, 'Failed to restore transaction')
      return response.internalServerError({
        success: false,
        error: { message: 'Failed to restore transaction', code: 'E_INTERNAL_ERROR' },
      })
    }
  }

  async destroy({ params, response, auth }: HttpContext) {
    try {
      const transaction = await Transaction.findOrFail(params.id)

      if (!TenantScopeService.canAccess(transaction, auth.user!)) {
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
