import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import Transaction from '#models/transaction'
import { TenantScopeService } from '#services/tenant_scope_service'
import { PdfExportService } from '#services/pdf_export_service'
import { ActivityFeedService } from '#services/activity_feed_service'
import logger from '@adonisjs/core/services/logger'

const exportPdfValidator = vine.compile(
  vine.object({
    includeOffers: vine.boolean().optional(),
    includeConditions: vine.boolean().optional(),
    includeDocuments: vine.boolean().optional(),
    includeActivity: vine.boolean().optional(),
    watermark: vine.boolean().optional(),
    language: vine.enum(['fr', 'en']).optional(),
  })
)

export default class ExportController {
  /**
   * Generate PDF export for a transaction
   * POST /api/transactions/:id/export/pdf
   */
  async pdf({ params, request, response, auth }: HttpContext) {
    try {
      const query = Transaction.query().where('id', params.id)
      TenantScopeService.apply(query, auth.user!)
      const transaction = await query
        .preload('client')
        .preload('property')
        .preload('offers', (q) => q.preload('revisions').orderBy('created_at', 'desc'))
        .preload('conditions', (q) => q.where('archived', false).orderBy('created_at', 'asc'))
        .preload('documents', (q) => q.orderBy('created_at', 'desc'))
        .preload('activities', (q) => q.orderBy('created_at', 'desc').limit(50))
        .preload('parties')
        .firstOrFail()

      const payload = await request.validateUsing(exportPdfValidator)

      const options = {
        includeOffers: payload.includeOffers ?? true,
        includeConditions: payload.includeConditions ?? true,
        includeDocuments: payload.includeDocuments ?? false,
        includeActivity: payload.includeActivity ?? false,
        watermark: payload.watermark ?? true,
        language: (payload.language ?? 'fr') as 'fr' | 'en',
      }

      const pdfBuffer = await PdfExportService.generate({ transaction }, options)

      // Log activity
      await ActivityFeedService.log({
        transactionId: transaction.id,
        userId: auth.user!.id,
        activityType: 'pdf_exported',
        metadata: { language: options.language, watermark: options.watermark },
      })

      // Build filename: Transaction_ClientName_YYYY-MM.pdf
      const clientName = transaction.client
        ? `${transaction.client.firstName}_${transaction.client.lastName}`.replace(/\s+/g, '_')
        : 'Transaction'
      const dateStr = transaction.createdAt.toFormat('yyyy-MM')
      const filename = `Transaction_${clientName}_${dateStr}.pdf`

      response.header('Content-Type', 'application/pdf')
      response.header('Content-Disposition', `attachment; filename="${filename}"`)
      response.header('Content-Length', String(pdfBuffer.length))
      return response.send(pdfBuffer)
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
      logger.error({ error, transactionId: params.id }, 'Failed to generate PDF')
      return response.internalServerError({
        success: false,
        error: { message: 'Failed to generate PDF', code: 'E_INTERNAL_ERROR' },
      })
    }
  }
}
