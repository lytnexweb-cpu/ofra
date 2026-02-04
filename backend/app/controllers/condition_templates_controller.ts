import type { HttpContext } from '@adonisjs/core/http'
import ConditionTemplate from '#models/condition_template'
import TransactionProfile from '#models/transaction_profile'
import Condition from '#models/condition'
import { ConditionsEngineService } from '#services/conditions_engine_service'

/**
 * Condition Templates Controller
 *
 * Handles Premium condition templates (packs)
 * Part of Conditions Engine Premium (D27)
 */
export default class ConditionTemplatesController {
  /**
   * List all active condition templates
   * GET /api/conditions/templates
   */
  async index({ request, response }: HttpContext) {
    try {
      const { step, pack, level } = request.qs()

      let query = ConditionTemplate.query()
        .where('isActive', true)
        .orderBy('pack', 'asc')
        .orderBy('step', 'asc')
        .orderBy('order', 'asc')

      if (step) {
        query = query.where((q) => {
          q.whereNull('step').orWhere('step', Number(step))
        })
      }

      if (pack) {
        query = query.where('pack', pack)
      }

      if (level) {
        query = query.where('level', level)
      }

      const templates = await query

      return response.ok({
        success: true,
        data: { templates },
      })
    } catch (error) {
      return response.internalServerError({
        success: false,
        error: { message: 'Failed to list templates', code: 'E_INTERNAL_ERROR' },
      })
    }
  }

  /**
   * Get templates applicable to a specific transaction
   * GET /api/transactions/:id/applicable-templates
   *
   * Filters out templates that have already been used to create conditions
   * on this transaction (prevents duplicates in suggestions)
   */
  async applicableForTransaction({ params, request, response, auth }: HttpContext) {
    try {
      const transactionId = params.id

      const profile = await TransactionProfile.query()
        .where('transactionId', transactionId)
        .first()

      if (!profile) {
        return response.notFound({
          success: false,
          error: {
            message: 'Transaction profile not found. Create a profile first.',
            code: 'E_PROFILE_NOT_FOUND',
          },
        })
      }

      const { step } = request.qs()
      const templates = await ConditionsEngineService.getApplicableTemplates(
        profile,
        step ? Number(step) : undefined
      )

      // Get existing conditions on this transaction (for deduplication)
      const existingConditions = await Condition.query()
        .where('transactionId', transactionId)
        .select('templateId', 'title', 'labelFr', 'labelEn')

      // Build sets for deduplication
      const usedTemplateIds = new Set(
        existingConditions.filter((c) => c.templateId).map((c) => c.templateId)
      )
      const usedTitles = new Set(
        existingConditions.map((c) => [c.title?.toLowerCase(), c.labelFr?.toLowerCase(), c.labelEn?.toLowerCase()]).flat().filter(Boolean)
      )

      // Filter out templates that are already used (by templateId OR by matching title)
      const availableTemplates = templates.filter((t) => {
        // Check by templateId first
        if (usedTemplateIds.has(t.id)) return false
        // Check by title match (for conditions created before templateId linking)
        if (usedTitles.has(t.labelFr?.toLowerCase()) || usedTitles.has(t.labelEn?.toLowerCase())) return false
        return true
      })

      return response.ok({
        success: true,
        data: {
          templates: availableTemplates,
          profile: {
            propertyType: profile.propertyType,
            propertyContext: profile.propertyContext,
            isFinanced: profile.isFinanced,
          },
        },
      })
    } catch (error) {
      return response.internalServerError({
        success: false,
        error: { message: 'Failed to get applicable templates', code: 'E_INTERNAL_ERROR' },
      })
    }
  }

  /**
   * Get a single template
   * GET /api/conditions/templates/:id
   */
  async show({ params, response }: HttpContext) {
    try {
      const template = await ConditionTemplate.findOrFail(params.id)

      return response.ok({
        success: true,
        data: { template },
      })
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.notFound({
          success: false,
          error: { message: 'Template not found', code: 'E_NOT_FOUND' },
        })
      }
      return response.internalServerError({
        success: false,
        error: { message: 'Failed to get template', code: 'E_INTERNAL_ERROR' },
      })
    }
  }

  /**
   * Get templates grouped by pack
   * GET /api/conditions/templates/by-pack
   */
  async byPack({ response }: HttpContext) {
    try {
      const templates = await ConditionTemplate.query()
        .where('isActive', true)
        .orderBy('step', 'asc')
        .orderBy('order', 'asc')

      const grouped: Record<string, typeof templates> = {
        universal: [],
        rural_nb: [],
        condo_nb: [],
        finance_nb: [],
      }

      for (const template of templates) {
        const pack = template.pack || 'universal'
        if (!grouped[pack]) {
          grouped[pack] = []
        }
        grouped[pack].push(template)
      }

      return response.ok({
        success: true,
        data: {
          packs: grouped,
          stats: {
            universal: grouped.universal.length,
            rural_nb: grouped.rural_nb.length,
            condo_nb: grouped.condo_nb.length,
            finance_nb: grouped.finance_nb.length,
            total: templates.length,
          },
        },
      })
    } catch (error) {
      return response.internalServerError({
        success: false,
        error: { message: 'Failed to get templates by pack', code: 'E_INTERNAL_ERROR' },
      })
    }
  }
}
