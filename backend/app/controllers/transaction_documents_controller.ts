import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import Transaction from '#models/transaction'
import TransactionDocument from '#models/transaction_document'
import {
  createDocumentValidator,
  updateDocumentValidator,
  rejectDocumentValidator,
} from '#validators/transaction_document_validator'
import { TenantScopeService } from '#services/tenant_scope_service'
import { ActivityFeedService } from '#services/activity_feed_service'
import logger from '@adonisjs/core/services/logger'

export default class TransactionDocumentsController {
  async index({ params, response, auth }: HttpContext) {
    try {
      const query = Transaction.query().where('id', params.id)
      TenantScopeService.apply(query, auth.user!)
      const transaction = await query.firstOrFail()

      const documents = await TransactionDocument.query()
        .where('transaction_id', transaction.id)
        .preload('uploader')
        .preload('condition')
        .orderBy('created_at', 'desc')

      return response.ok({
        success: true,
        data: { documents },
      })
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.notFound({
          success: false,
          error: { message: 'Transaction not found', code: 'E_NOT_FOUND' },
        })
      }
      logger.error({ error, transactionId: params.id }, 'Failed to retrieve documents')
      return response.internalServerError({
        success: false,
        error: { message: 'Failed to retrieve documents', code: 'E_INTERNAL_ERROR' },
      })
    }
  }

  async store({ params, request, response, auth }: HttpContext) {
    try {
      const query = Transaction.query().where('id', params.id)
      TenantScopeService.apply(query, auth.user!)
      const transaction = await query.firstOrFail()

      const payload = await request.validateUsing(createDocumentValidator)
      const document = await TransactionDocument.create({
        ...payload,
        transactionId: transaction.id,
        uploadedBy: auth.user!.id,
        status: payload.status || (payload.fileUrl ? 'uploaded' : 'missing'),
      })

      await ActivityFeedService.log({
        transactionId: transaction.id,
        userId: auth.user!.id,
        activityType: 'document_uploaded',
        metadata: { documentId: document.id, name: document.name, category: document.category },
      })

      await document.load('uploader')

      return response.created({
        success: true,
        data: { document },
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
          error: { message: 'Transaction not found', code: 'E_NOT_FOUND' },
        })
      }
      logger.error({ error, transactionId: params.id }, 'Failed to create document')
      return response.internalServerError({
        success: false,
        error: { message: 'Failed to create document', code: 'E_INTERNAL_ERROR' },
      })
    }
  }

  async show({ params, response, auth }: HttpContext) {
    try {
      const document = await TransactionDocument.findOrFail(params.id)

      const txQuery = Transaction.query().where('id', document.transactionId)
      TenantScopeService.apply(txQuery, auth.user!)
      await txQuery.firstOrFail()

      await document.load('uploader')
      await document.load('condition')

      return response.ok({
        success: true,
        data: { document },
      })
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.notFound({
          success: false,
          error: { message: 'Document not found', code: 'E_NOT_FOUND' },
        })
      }
      logger.error({ error, documentId: params.id }, 'Failed to retrieve document')
      return response.internalServerError({
        success: false,
        error: { message: 'Failed to retrieve document', code: 'E_INTERNAL_ERROR' },
      })
    }
  }

  async update({ params, request, response, auth }: HttpContext) {
    try {
      const document = await TransactionDocument.findOrFail(params.id)

      const txQuery = Transaction.query().where('id', document.transactionId)
      TenantScopeService.apply(txQuery, auth.user!)
      await txQuery.firstOrFail()

      const payload = await request.validateUsing(updateDocumentValidator)
      document.merge(payload)
      await document.save()

      await document.load('uploader')

      return response.ok({
        success: true,
        data: { document },
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
          error: { message: 'Document not found', code: 'E_NOT_FOUND' },
        })
      }
      logger.error({ error, documentId: params.id }, 'Failed to update document')
      return response.internalServerError({
        success: false,
        error: { message: 'Failed to update document', code: 'E_INTERNAL_ERROR' },
      })
    }
  }

  async validate({ params, response, auth }: HttpContext) {
    try {
      const document = await TransactionDocument.findOrFail(params.id)

      const txQuery = Transaction.query().where('id', document.transactionId)
      TenantScopeService.apply(txQuery, auth.user!)
      await txQuery.firstOrFail()

      document.status = 'validated'
      document.validatedBy = auth.user!.id
      document.validatedAt = DateTime.now()
      document.rejectionReason = null
      await document.save()

      await ActivityFeedService.log({
        transactionId: document.transactionId,
        userId: auth.user!.id,
        activityType: 'document_validated',
        metadata: { documentId: document.id, name: document.name },
      })

      await document.load('uploader')

      return response.ok({
        success: true,
        data: { document },
      })
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.notFound({
          success: false,
          error: { message: 'Document not found', code: 'E_NOT_FOUND' },
        })
      }
      logger.error({ error, documentId: params.id }, 'Failed to validate document')
      return response.internalServerError({
        success: false,
        error: { message: 'Failed to validate document', code: 'E_INTERNAL_ERROR' },
      })
    }
  }

  async reject({ params, request, response, auth }: HttpContext) {
    try {
      const document = await TransactionDocument.findOrFail(params.id)

      const txQuery = Transaction.query().where('id', document.transactionId)
      TenantScopeService.apply(txQuery, auth.user!)
      await txQuery.firstOrFail()

      const { reason } = await request.validateUsing(rejectDocumentValidator)

      document.status = 'rejected'
      document.rejectionReason = reason
      document.validatedBy = null
      document.validatedAt = null
      await document.save()

      await ActivityFeedService.log({
        transactionId: document.transactionId,
        userId: auth.user!.id,
        activityType: 'document_rejected',
        metadata: { documentId: document.id, name: document.name, reason },
      })

      await document.load('uploader')

      return response.ok({
        success: true,
        data: { document },
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
          error: { message: 'Document not found', code: 'E_NOT_FOUND' },
        })
      }
      logger.error({ error, documentId: params.id }, 'Failed to reject document')
      return response.internalServerError({
        success: false,
        error: { message: 'Failed to reject document', code: 'E_INTERNAL_ERROR' },
      })
    }
  }

  async destroy({ params, response, auth }: HttpContext) {
    try {
      const document = await TransactionDocument.findOrFail(params.id)

      const txQuery = Transaction.query().where('id', document.transactionId)
      TenantScopeService.apply(txQuery, auth.user!)
      await txQuery.firstOrFail()

      await document.delete()
      return response.noContent()
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.notFound({
          success: false,
          error: { message: 'Document not found', code: 'E_NOT_FOUND' },
        })
      }
      logger.error({ error, documentId: params.id }, 'Failed to delete document')
      return response.internalServerError({
        success: false,
        error: { message: 'Failed to delete document', code: 'E_INTERNAL_ERROR' },
      })
    }
  }
}
