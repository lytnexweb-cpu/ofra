import type { HttpContext } from '@adonisjs/core/http'
import { TemplateService } from '#services/template_service'

export default class TemplatesController {
  /**
   * Liste tous les templates disponibles pour l'utilisateur courant.
   * Filtre optionnel par type de transaction.
   *
   * GET /api/templates
   * GET /api/templates?type=sale
   * GET /api/templates?type=purchase
   */
  async index({ request, response, auth }: HttpContext) {
    try {
      const { type } = request.qs()

      // Validate type if provided
      if (type && !['purchase', 'sale'].includes(type)) {
        return response.badRequest({
          success: false,
          error: {
            message: 'Invalid transaction type. Must be "purchase" or "sale"',
            code: 'E_INVALID_TYPE',
          },
        })
      }

      const templates = await TemplateService.getAvailableTemplates(type, auth.user!.id)

      return response.ok({
        success: true,
        data: { templates },
      })
    } catch (error) {
      console.error('[TemplatesController] Error listing templates:', error)
      return response.internalServerError({
        success: false,
        error: {
          message: 'Failed to retrieve templates',
          code: 'E_INTERNAL_ERROR',
        },
      })
    }
  }

  /**
   * Affiche un template spécifique avec toutes ses conditions.
   *
   * GET /api/templates/:id
   */
  async show({ params, response, auth }: HttpContext) {
    try {
      const template = await TemplateService.getTemplateById(
        Number.parseInt(params.id),
        auth.user!.id
      )

      if (!template) {
        return response.notFound({
          success: false,
          error: {
            message: 'Template not found',
            code: 'E_NOT_FOUND',
          },
        })
      }

      return response.ok({
        success: true,
        data: { template },
      })
    } catch (error) {
      console.error('[TemplatesController] Error showing template:', error)
      return response.internalServerError({
        success: false,
        error: {
          message: 'Failed to retrieve template',
          code: 'E_INTERNAL_ERROR',
        },
      })
    }
  }
}
