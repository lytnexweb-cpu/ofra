import type { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'
import { cuid } from '@adonisjs/core/helpers'
import Condition from '#models/condition'
import ConditionEvidence from '#models/condition_evidence'
import ConditionEvent from '#models/condition_event'
import Offer from '#models/offer'
import Transaction from '#models/transaction'
import {
  createConditionValidator,
  updateConditionValidator,
} from '#validators/condition_validator'
import { ActivityFeedService } from '#services/activity_feed_service'
import { ConditionsEngineService } from '#services/conditions_engine_service'
import vine from '@vinejs/vine'
import { DateTime } from 'luxon'

/**
 * Premium validators
 */
/**
 * D41: Enhanced resolve validator with evidence and escape tracking
 */
const resolveConditionValidator = vine.compile(
  vine.object({
    resolutionType: vine.enum(['completed', 'waived', 'not_applicable', 'skipped_with_risk']),
    note: vine.string().trim().minLength(1).optional(),
    // D41: Evidence tracking
    hasEvidence: vine.boolean().optional(),
    evidenceId: vine.number().positive().optional(),
    evidenceFilename: vine.string().trim().maxLength(255).optional(),
    // D41: Escape without proof (for blocking conditions)
    escapedWithoutProof: vine.boolean().optional(),
    escapeReason: vine.string().trim().minLength(10).maxLength(1000).optional(),
  })
)

const addEvidenceValidator = vine.compile(
  vine.object({
    type: vine.enum(['file', 'link', 'note']),
    fileUrl: vine.string().trim().optional(),
    url: vine.string().trim().url().optional(),
    note: vine.string().trim().optional(),
    title: vine.string().trim().maxLength(255).optional(),
  })
)

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

      // Derive level from isBlocking if not provided
      const level = payload.level ?? (payload.isBlocking ? 'blocking' : 'recommended')

      const condition = await Condition.create({
        ...payload,
        level,
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

      // D38: Check if condition is archived (read-only)
      if (condition.archived) {
        return response.conflict({
          success: false,
          error: { message: 'Condition is read-only (archived)', code: 'E_CONDITION_ARCHIVED' },
        })
      }

      // D38: Capture "before" state for audit trail
      const before = {
        dueDate: condition.dueDate?.toISO() ?? null,
        description: condition.description ?? null,
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

      // D38: Log audit event if dueDate or description changed
      const after = {
        dueDate: condition.dueDate?.toISO() ?? null,
        description: condition.description ?? null,
      }

      const changes: Record<string, { from: string | null; to: string | null }> = {}
      if (before.dueDate !== after.dueDate) {
        changes.dueDate = { from: before.dueDate, to: after.dueDate }
      }
      if (before.description !== after.description) {
        changes.description = { from: before.description, to: after.description }
      }

      if (Object.keys(changes).length > 0) {
        await ConditionEvent.log(condition.id, 'condition_updated', auth.user!.id, { changes })
      }

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

  // ============================================================
  // PREMIUM METHODS (D4/D27)
  // ============================================================

  /**
   * Resolve a condition with Premium resolution types
   * POST /api/conditions/:id/resolve
   */
  async resolve({ params, request, response, auth }: HttpContext) {
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

      // Check if already archived (read-only)
      if (condition.archived) {
        return response.unprocessableEntity({
          success: false,
          error: {
            message: 'Cannot modify archived condition',
            code: 'E_CONDITION_ARCHIVED',
          },
        })
      }

      const payload = await request.validateUsing(resolveConditionValidator)

      // D41: Pass complete options to resolve
      try {
        await condition.resolve(payload.resolutionType, auth.user!.id, {
          resolutionType: payload.resolutionType,
          note: payload.note,
          hasEvidence: payload.hasEvidence,
          evidenceId: payload.evidenceId,
          evidenceFilename: payload.evidenceFilename,
          escapedWithoutProof: payload.escapedWithoutProof,
          escapeReason: payload.escapeReason,
        })
      } catch (resolveError: any) {
        return response.unprocessableEntity({
          success: false,
          error: {
            message: resolveError.message,
            code: 'E_RESOLUTION_FAILED',
          },
        })
      }

      // D41: Enhanced activity log with escape tracking
      await ActivityFeedService.log({
        transactionId: transaction.id,
        userId: auth.user!.id,
        activityType: 'condition_completed',
        metadata: {
          conditionId: condition.id,
          title: condition.title,
          resolutionType: payload.resolutionType,
          hasEvidence: payload.hasEvidence ?? false,
          escapedWithoutProof: payload.escapedWithoutProof ?? false,
        },
      })

      await condition.refresh()

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
        error: { message: 'Failed to resolve condition', code: 'E_INTERNAL_ERROR' },
      })
    }
  }

  /**
   * Get condition audit history
   * GET /api/conditions/:id/history
   */
  async history({ params, response, auth }: HttpContext) {
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

      const events = await ConditionsEngineService.getConditionHistory(condition.id)

      return response.ok({
        success: true,
        data: {
          condition: {
            id: condition.id,
            title: condition.title,
            labelFr: condition.labelFr,
            labelEn: condition.labelEn,
            level: condition.level,
            status: condition.status,
            resolutionType: condition.resolutionType,
            archived: condition.archived,
          },
          events,
        },
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
        error: { message: 'Failed to get history', code: 'E_INTERNAL_ERROR' },
      })
    }
  }

  /**
   * List evidence for a condition
   * GET /api/conditions/:id/evidence
   */
  async listEvidence({ params, response, auth }: HttpContext) {
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

      const evidence = await ConditionEvidence.query()
        .where('conditionId', condition.id)
        .preload('creator')
        .orderBy('createdAt', 'desc')

      return response.ok({
        success: true,
        data: { evidence },
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
        error: { message: 'Failed to list evidence', code: 'E_INTERNAL_ERROR' },
      })
    }
  }

  /**
   * Add evidence to a condition
   * POST /api/conditions/:id/evidence
   *
   * Accepts either:
   * - multipart/form-data with a "file" field (file upload)
   * - JSON body with type/url/note/title (link or note)
   */
  async addEvidence({ params, request, response, auth }: HttpContext) {
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

      // Check if this is a file upload (multipart)
      const file = request.file('file', {
        size: '10mb',
        extnames: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'png', 'jpg', 'jpeg', 'gif', 'webp'],
      })

      if (file) {
        // File upload path
        if (!file.isValid) {
          return response.unprocessableEntity({
            success: false,
            error: {
              message: file.errors[0]?.message || 'Invalid file',
              code: 'E_VALIDATION_FAILED',
            },
          })
        }

        const fileName = `${cuid()}.${file.extname}`
        await file.move(app.makePath('storage/uploads'), { name: fileName })

        const fileUrl = `/api/uploads/${fileName}`

        const evidence = await ConditionEvidence.create({
          conditionId: condition.id,
          type: 'file',
          fileUrl,
          title: request.input('title') || file.clientName,
          createdBy: auth.user!.id,
        })

        await ConditionEvent.log(condition.id, 'evidence_added', auth.user!.id, {
          evidenceId: evidence.id,
          type: 'file',
          fileName: file.clientName,
        })

        return response.created({
          success: true,
          data: { evidence },
        })
      }

      // JSON path (link or note)
      const payload = await request.validateUsing(addEvidenceValidator)

      const evidence = await ConditionEvidence.create({
        conditionId: condition.id,
        type: payload.type,
        fileUrl: payload.fileUrl,
        url: payload.url,
        note: payload.note,
        title: payload.title,
        createdBy: auth.user!.id,
      })

      await ConditionEvent.log(condition.id, 'evidence_added', auth.user!.id, {
        evidenceId: evidence.id,
        type: payload.type,
      })

      return response.created({
        success: true,
        data: { evidence },
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
        error: { message: 'Failed to add evidence', code: 'E_INTERNAL_ERROR' },
      })
    }
  }

  /**
   * Delete evidence
   * DELETE /api/conditions/:id/evidence/:evidenceId
   */
  async removeEvidence({ params, response, auth }: HttpContext) {
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

      const evidence = await ConditionEvidence.query()
        .where('id', params.evidenceId)
        .where('conditionId', condition.id)
        .first()

      if (!evidence) {
        return response.notFound({
          success: false,
          error: { message: 'Evidence not found', code: 'E_NOT_FOUND' },
        })
      }

      await evidence.delete()

      // Log event
      await ConditionEvent.log(condition.id, 'evidence_removed', auth.user!.id, {
        evidenceId: params.evidenceId,
      })

      return response.noContent()
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.notFound({
          success: false,
          error: { message: 'Not found', code: 'E_NOT_FOUND' },
        })
      }
      return response.internalServerError({
        success: false,
        error: { message: 'Failed to remove evidence', code: 'E_INTERNAL_ERROR' },
      })
    }
  }

  /**
   * Get conditions grouped by step for Timeline
   * GET /api/transactions/:id/conditions/timeline
   */
  async timeline({ params, response, auth }: HttpContext) {
    try {
      const transaction = await Transaction.query()
        .where('id', params.id)
        .where('owner_user_id', auth.user!.id)
        .first()

      if (!transaction) {
        return response.notFound({
          success: false,
          error: { message: 'Transaction not found', code: 'E_NOT_FOUND' },
        })
      }

      const grouped = await ConditionsEngineService.getConditionsGroupedByStep(params.id)

      // Convert Map to object for JSON serialization
      const timeline: Record<number, any[]> = {}
      for (const [step, conditions] of grouped) {
        timeline[step] = conditions.map((c) => ({
          id: c.id,
          title: c.title,
          labelFr: c.labelFr,
          labelEn: c.labelEn,
          level: c.level,
          status: c.status,
          resolutionType: c.resolutionType,
          resolutionNote: c.resolutionNote,
          resolvedAt: c.resolvedAt,
          resolvedBy: c.resolvedBy,
          archived: c.archived,
          archivedStep: c.archivedStep,
        }))
      }

      return response.ok({
        success: true,
        data: { timeline },
      })
    } catch (error) {
      return response.internalServerError({
        success: false,
        error: { message: 'Failed to get timeline', code: 'E_INTERNAL_ERROR' },
      })
    }
  }

  /**
   * Get active (non-archived) conditions for a transaction
   * GET /api/transactions/:id/conditions/active
   */
  async active({ params, response, auth }: HttpContext) {
    try {
      const transaction = await Transaction.query()
        .where('id', params.id)
        .where('owner_user_id', auth.user!.id)
        .first()

      if (!transaction) {
        return response.notFound({
          success: false,
          error: { message: 'Transaction not found', code: 'E_NOT_FOUND' },
        })
      }

      const conditions = await ConditionsEngineService.getActiveConditions(params.id)

      return response.ok({
        success: true,
        data: {
          conditions,
          summary: {
            total: conditions.length,
            blocking: conditions.filter((c) => c.level === 'blocking').length,
            required: conditions.filter((c) => c.level === 'required').length,
            recommended: conditions.filter((c) => c.level === 'recommended').length,
            pending: conditions.filter((c) => c.status === 'pending').length,
            completed: conditions.filter((c) => c.status === 'completed').length,
          },
        },
      })
    } catch (error) {
      return response.internalServerError({
        success: false,
        error: { message: 'Failed to get active conditions', code: 'E_INTERNAL_ERROR' },
      })
    }
  }

  /**
   * Check what's needed before step advancement
   * GET /api/transactions/:id/conditions/advance-check
   */
  async advanceCheck({ params, request, response, auth }: HttpContext) {
    try {
      const transaction = await Transaction.query()
        .where('id', params.id)
        .where('owner_user_id', auth.user!.id)
        .preload('currentStep', (q) => q.preload('workflowStep'))
        .first()

      if (!transaction) {
        return response.notFound({
          success: false,
          error: { message: 'Transaction not found', code: 'E_NOT_FOUND' },
        })
      }

      if (!transaction.currentStep) {
        return response.ok({
          success: true,
          data: {
            canAdvance: false,
            reason: 'No active step',
            currentStep: null,
          },
        })
      }

      const currentStepOrder = transaction.currentStep.stepOrder
      const stepSlug = transaction.currentStep.workflowStep?.slug ?? ''
      const check = await ConditionsEngineService.checkStepAdvancement(params.id, currentStepOrder)

      // Offer gate: check if negotiation step requires accepted offer
      const requiresAcceptedOffer = ['negotiation', 'en-negociation', 'offer-submitted'].includes(stepSlug)
      let hasAcceptedOffer = false
      if (requiresAcceptedOffer) {
        const acceptedOffer = await Offer.query()
          .where('transactionId', params.id)
          .where('status', 'accepted')
          .first()
        hasAcceptedOffer = !!acceptedOffer
      }

      const conditionsOk = check.canAdvance
      const canAdvance = conditionsOk && (!requiresAcceptedOffer || hasAcceptedOffer)

      return response.ok({
        success: true,
        data: {
          canAdvance,
          requiresAcceptedOffer,
          hasAcceptedOffer,
          currentStep: {
            order: currentStepOrder,
            name: transaction.currentStep.workflowStep?.name,
            slug: stepSlug,
          },
          blockingConditions: check.blockingConditions.map((c) => ({
            id: c.id,
            title: c.title,
            labelFr: c.labelFr,
            labelEn: c.labelEn,
          })),
          requiredPendingConditions: check.requiredPendingConditions.map((c) => ({
            id: c.id,
            title: c.title,
            labelFr: c.labelFr,
            labelEn: c.labelEn,
          })),
          recommendedPendingConditions: check.recommendedPendingConditions.map((c) => ({
            id: c.id,
            title: c.title,
            labelFr: c.labelFr,
            labelEn: c.labelEn,
          })),
        },
      })
    } catch (error) {
      return response.internalServerError({
        success: false,
        error: { message: 'Failed to check advance requirements', code: 'E_INTERNAL_ERROR' },
      })
    }
  }
}
