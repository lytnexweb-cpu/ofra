import type { HttpContext } from '@adonisjs/core/http'
import ProfessionalContact from '#models/professional_contact'
import {
  createProfessionalContactValidator,
  updateProfessionalContactValidator,
} from '#validators/professional_contact_validator'

export default class ProfessionalContactsController {
  async index({ response, auth }: HttpContext) {
    try {
      const pros = await ProfessionalContact.query()
        .where('agentId', auth.user!.id)
        .orderBy('name', 'asc')

      return response.ok({
        success: true,
        data: { pros },
      })
    } catch (error) {
      return response.internalServerError({
        success: false,
        error: {
          message: 'Failed to retrieve professional contacts',
          code: 'E_INTERNAL_ERROR',
        },
      })
    }
  }

  async store({ request, response, auth }: HttpContext) {
    try {
      const payload = await request.validateUsing(createProfessionalContactValidator)
      const pro = await ProfessionalContact.create({
        ...payload,
        agentId: auth.user!.id,
      })

      return response.created({
        success: true,
        data: { pro },
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
          message: 'Failed to create professional contact',
          code: 'E_INTERNAL_ERROR',
        },
      })
    }
  }

  async show({ params, response, auth }: HttpContext) {
    try {
      const pro = await ProfessionalContact.query()
        .where('id', params.id)
        .where('agentId', auth.user!.id)
        .firstOrFail()

      return response.ok({
        success: true,
        data: { pro },
      })
    } catch (error) {
      return response.notFound({
        success: false,
        error: {
          message: 'Professional contact not found',
          code: 'E_NOT_FOUND',
        },
      })
    }
  }

  async update({ params, request, response, auth }: HttpContext) {
    try {
      const pro = await ProfessionalContact.query()
        .where('id', params.id)
        .where('agentId', auth.user!.id)
        .firstOrFail()

      const payload = await request.validateUsing(updateProfessionalContactValidator)
      pro.merge(payload)
      await pro.save()

      return response.ok({
        success: true,
        data: { pro },
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
            message: 'Professional contact not found',
            code: 'E_NOT_FOUND',
          },
        })
      }
      return response.internalServerError({
        success: false,
        error: {
          message: 'Failed to update professional contact',
          code: 'E_INTERNAL_ERROR',
        },
      })
    }
  }

  async destroy({ params, response, auth }: HttpContext) {
    try {
      const pro = await ProfessionalContact.query()
        .where('id', params.id)
        .where('agentId', auth.user!.id)
        .firstOrFail()

      await pro.delete()

      return response.ok({
        success: true,
        data: { message: 'Professional contact deleted' },
      })
    } catch (error) {
      return response.notFound({
        success: false,
        error: {
          message: 'Professional contact not found',
          code: 'E_NOT_FOUND',
        },
      })
    }
  }
}
