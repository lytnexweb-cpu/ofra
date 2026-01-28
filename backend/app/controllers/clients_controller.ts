import type { HttpContext } from '@adonisjs/core/http'
import Client from '#models/client'
import Transaction from '#models/transaction'
import { createClientValidator, updateClientValidator } from '#validators/client_validator'
import { TenantScopeService } from '#services/tenant_scope_service'

export default class ClientsController {
  async index({ response, auth }: HttpContext) {
    try {
      const query = Client.query()
      TenantScopeService.apply(query, auth.user!)
      const clients = await query.orderBy('created_at', 'desc')

      return response.ok({
        success: true,
        data: { clients },
      })
    } catch (error) {
      return response.internalServerError({
        success: false,
        error: {
          message: 'Failed to retrieve clients',
          code: 'E_INTERNAL_ERROR',
        },
      })
    }
  }

  async store({ request, response, auth }: HttpContext) {
    try {
      const payload = await request.validateUsing(createClientValidator)
      const client = await Client.create({
        ...payload,
        ownerUserId: auth.user!.id,
        organizationId: TenantScopeService.getOrganizationId(auth.user!),
      })

      return response.created({
        success: true,
        data: { client },
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
          message: 'Failed to create client',
          code: 'E_INTERNAL_ERROR',
        },
      })
    }
  }

  async show({ params, response, auth }: HttpContext) {
    try {
      const query = Client.query().where('id', params.id)
      TenantScopeService.apply(query, auth.user!)
      const client = await query.firstOrFail()

      return response.ok({
        success: true,
        data: { client },
      })
    } catch (error) {
      return response.notFound({
        success: false,
        error: {
          message: 'Client not found',
          code: 'E_NOT_FOUND',
        },
      })
    }
  }

  async update({ params, request, response, auth }: HttpContext) {
    try {
      const query = Client.query().where('id', params.id)
      TenantScopeService.apply(query, auth.user!)
      const client = await query.firstOrFail()

      const payload = await request.validateUsing(updateClientValidator)
      client.merge(payload)
      await client.save()

      return response.ok({
        success: true,
        data: { client },
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
            message: 'Client not found',
            code: 'E_NOT_FOUND',
          },
        })
      }
      return response.internalServerError({
        success: false,
        error: {
          message: 'Failed to update client',
          code: 'E_INTERNAL_ERROR',
        },
      })
    }
  }

  async destroy({ params, response, auth }: HttpContext) {
    try {
      const query = Client.query().where('id', params.id)
      TenantScopeService.apply(query, auth.user!)
      const client = await query.firstOrFail()

      // Check if client has any transactions
      const transactionCount = await Transaction.query()
        .where('client_id', client.id)
        .count('* as total')

      if (Number(transactionCount[0].$extras.total) > 0) {
        return response.badRequest({
          success: false,
          error: {
            message: 'Cannot delete client with existing transactions',
            code: 'E_CLIENT_HAS_TRANSACTIONS',
          },
        })
      }

      await client.delete()

      return response.ok({
        success: true,
        data: { message: 'Client deleted successfully' },
      })
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.notFound({
          success: false,
          error: {
            message: 'Client not found',
            code: 'E_NOT_FOUND',
          },
        })
      }
      return response.internalServerError({
        success: false,
        error: {
          message: 'Failed to delete client',
          code: 'E_INTERNAL_ERROR',
        },
      })
    }
  }

  async transactions({ params, response, auth }: HttpContext) {
    try {
      // Verify client access
      const clientQuery = Client.query().where('id', params.id)
      TenantScopeService.apply(clientQuery, auth.user!)
      const client = await clientQuery.firstOrFail()

      // Get all transactions for this client (scoped by tenant)
      const txQuery = Transaction.query().where('client_id', client.id)
      TenantScopeService.apply(txQuery, auth.user!)
      const transactions = await txQuery
        .preload('transactionSteps', (query) => {
          query.preload('workflowStep').orderBy('step_order', 'asc')
        })
        .preload('conditions', (query) => {
          query.orderBy('due_date', 'asc')
        })
        .orderBy('created_at', 'desc')

      return response.ok({
        success: true,
        data: { transactions },
      })
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.notFound({
          success: false,
          error: {
            message: 'Client not found',
            code: 'E_NOT_FOUND',
          },
        })
      }
      return response.internalServerError({
        success: false,
        error: {
          message: 'Failed to retrieve client transactions',
          code: 'E_INTERNAL_ERROR',
        },
      })
    }
  }
}
