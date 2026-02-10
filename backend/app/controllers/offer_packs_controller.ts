import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import Offer from '#models/offer'
import Condition, { type ConditionType } from '#models/condition'
import ConditionTemplate from '#models/condition_template'
import Transaction from '#models/transaction'
import { TenantScopeService } from '#services/tenant_scope_service'
import { ActivityFeedService } from '#services/activity_feed_service'
import logger from '@adonisjs/core/services/logger'

const applyPackValidator = vine.compile(
  vine.object({
    packType: vine.enum([
      'universal', 'rural_nb', 'condo_nb', 'finance_nb', 'inspection_nb', 'cash_nb',
    ]),
  })
)

export default class OfferPacksController {
  /**
   * List available packs with condition count
   * GET /api/condition-packs
   */
  async index({ response }: HttpContext) {
    try {
      const templates = await ConditionTemplate.query()
        .where('isActive', true)
        .orderBy('pack', 'asc')
        .orderBy('order', 'asc')

      const packs: Record<string, { count: number; templates: typeof templates }> = {}

      for (const t of templates) {
        const pack = t.pack || 'universal'
        if (!packs[pack]) {
          packs[pack] = { count: 0, templates: [] }
        }
        packs[pack].count++
        packs[pack].templates.push(t)
      }

      // Map to maquette 12 chip labels
      const packList = Object.entries(packs).map(([key, val]) => ({
        packType: key,
        label: packLabel(key),
        count: val.count,
      }))

      return response.ok({
        success: true,
        data: { packs: packList },
      })
    } catch (error) {
      logger.error({ error }, 'Failed to list condition packs')
      return response.internalServerError({
        success: false,
        error: { message: 'Failed to list packs', code: 'E_INTERNAL_ERROR' },
      })
    }
  }

  /**
   * List templates for a specific pack
   * GET /api/condition-packs/:packType/templates
   */
  async templates({ params, response }: HttpContext) {
    try {
      const templates = await ConditionTemplate.query()
        .where('isActive', true)
        .where('pack', params.packType)
        .orderBy('order', 'asc')

      return response.ok({
        success: true,
        data: {
          packType: params.packType,
          label: packLabel(params.packType),
          templates,
        },
      })
    } catch (error) {
      logger.error({ error, packType: params.packType }, 'Failed to list pack templates')
      return response.internalServerError({
        success: false,
        error: { message: 'Failed to list pack templates', code: 'E_INTERNAL_ERROR' },
      })
    }
  }

  /**
   * Apply a pack to an offer — creates conditions linked to the offer's transaction
   * POST /api/offers/:offerId/apply-pack
   *
   * Packs are additive: applying a 2nd pack adds its conditions without removing existing ones.
   * Duplicates are skipped (same templateId on same transaction+offer).
   */
  async applyPack({ params, request, response, auth }: HttpContext) {
    try {
      const offer = await Offer.findOrFail(params.offerId)

      // Verify access to the transaction
      const txQuery = Transaction.query().where('id', offer.transactionId)
      TenantScopeService.apply(txQuery, auth.user!)
      const transaction = await txQuery.firstOrFail()

      const { packType } = await request.validateUsing(applyPackValidator)

      // Load pack templates
      const templates = await ConditionTemplate.query()
        .where('isActive', true)
        .where('pack', packType)
        .orderBy('order', 'asc')

      if (templates.length === 0) {
        return response.ok({
          success: true,
          data: { created: 0, conditions: [], message: 'No templates in this pack' },
        })
      }

      // Get existing conditions on this offer to avoid duplicates
      const existingConditions = await Condition.query()
        .where('transactionId', transaction.id)
        .where('offerId', offer.id)
        .whereNotNull('templateId')

      const usedTemplateIds = new Set(existingConditions.map((c) => c.templateId))

      // Create conditions for each template not already applied
      const created: Condition[] = []
      for (const template of templates) {
        if (usedTemplateIds.has(template.id)) {
          continue // Skip duplicate
        }

        const condition = await Condition.create({
          transactionId: transaction.id,
          offerId: offer.id,
          templateId: template.id,
          title: template.labelFr,
          labelFr: template.labelFr,
          labelEn: template.labelEn,
          description: template.descriptionFr,
          status: 'pending',
          type: mapSourceToConditionType(template.sourceType),
          priority: 'medium',
          isBlocking: template.level === 'blocking',
          level: template.level,
          sourceType: template.sourceType,
          archived: false,
          escapedWithoutProof: false,
          dueDate: template.calculateDueDate({
            closingDate: transaction.closingDate,
          }),
        })

        created.push(condition)
      }

      // Log activity
      if (created.length > 0) {
        await ActivityFeedService.log({
          transactionId: transaction.id,
          userId: auth.user!.id,
          activityType: 'condition_created',
          metadata: {
            packType,
            offerId: offer.id,
            conditionsCreated: created.length,
            source: 'pack',
          },
        })
      }

      return response.created({
        success: true,
        data: {
          created: created.length,
          conditions: created,
          packType,
        },
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
          error: { message: 'Offer not found', code: 'E_NOT_FOUND' },
        })
      }
      logger.error({ error, offerId: params.offerId }, 'Failed to apply pack')
      return response.internalServerError({
        success: false,
        error: { message: 'Failed to apply pack', code: 'E_INTERNAL_ERROR' },
      })
    }
  }
}

/**
 * Map pack type to maquette 12 chip label
 */
function packLabel(packType: string): string {
  const labels: Record<string, string> = {
    universal: 'Standard',
    finance_nb: 'Financement',
    inspection_nb: 'Inspection',
    cash_nb: 'Cash offer',
    rural_nb: 'Rural NB',
    condo_nb: 'Condo NB',
  }
  return labels[packType] || packType
}

/**
 * Map template sourceType to legacy ConditionType
 */
function mapSourceToConditionType(sourceType: string | null): ConditionType {
  const map: Record<string, ConditionType> = {
    legal: 'legal',
    government: 'documents',
    industry: 'inspection',
    best_practice: 'other',
  }
  return map[sourceType || ''] || 'other'
}
