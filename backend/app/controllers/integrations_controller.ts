import type { HttpContext } from '@adonisjs/core/http'
import { fubConnectValidator, fubImportValidator } from '#validators/integrations_validator'
import { FollowUpBossService } from '#services/followupboss_service'

export default class IntegrationsController {
  /**
   * Connect to FollowUpBoss and return preview of contacts
   * POST /api/integrations/followupboss/connect
   */
  async connectFollowUpBoss({ request, response }: HttpContext) {
    try {
      const payload = await request.validateUsing(fubConnectValidator)
      const contacts = await FollowUpBossService.validateAndFetchContacts(payload.apiKey)

      return response.ok({
        success: true,
        data: {
          contacts: contacts.map((c) => ({
            id: c.id,
            firstName: c.firstName,
            lastName: c.lastName,
            email: c.emails?.[0]?.value || null,
            phone: c.phones?.[0]?.value || null,
          })),
          total: contacts.length,
        },
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

      const message = error instanceof Error ? error.message : String(error)

      if (message.includes('Invalid API key')) {
        return response.unauthorized({
          success: false,
          error: { message: 'Invalid FollowUpBoss API key', code: 'E_FUB_INVALID_KEY' },
        })
      }

      return response.badRequest({
        success: false,
        error: { message: `FollowUpBoss connection failed: ${message}`, code: 'E_FUB_ERROR' },
      })
    }
  }

  /**
   * Import contacts from FollowUpBoss
   * POST /api/integrations/followupboss/import
   */
  async importFollowUpBoss({ request, response, auth }: HttpContext) {
    try {
      const user = auth.user!
      const payload = await request.validateUsing(fubImportValidator)

      // Fetch contacts again (stateless — no server-side session cache)
      const contacts = await FollowUpBossService.validateAndFetchContacts(payload.apiKey)

      const result = await FollowUpBossService.importContacts(
        contacts,
        user.id,
        user.organizationId ?? null,
        payload.selectedContactIds
      )

      return response.ok({
        success: true,
        data: {
          imported: result.imported,
          skipped: result.skipped,
          errors: result.errors,
        },
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

      const message = error instanceof Error ? error.message : String(error)
      return response.badRequest({
        success: false,
        error: { message: `Import failed: ${message}`, code: 'E_FUB_IMPORT_ERROR' },
      })
    }
  }
}
