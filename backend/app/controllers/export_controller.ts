import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import { DateTime } from 'luxon'
import mail from '@adonisjs/mail/services/main'
import Transaction from '#models/transaction'
import ActivityFeed from '#models/activity_feed'
import { TenantScopeService } from '#services/tenant_scope_service'
import { PdfExportService } from '#services/pdf_export_service'
import { ActivityFeedService } from '#services/activity_feed_service'
import { NotificationService } from '#services/notification_service'
import TransactionRecapMail from '#mails/transaction_recap_mail'
import logger from '@adonisjs/core/services/logger'

const exportEmailValidator = vine.compile(
  vine.object({
    recipients: vine.array(vine.string().trim().email()).minLength(1).maxLength(10),
    subject: vine.string().trim().maxLength(500).optional(),
    message: vine.string().trim().maxLength(2000).optional(),
  })
)

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
      // Gate: Starter plan limited to 3 PDF exports per month
      const user = auth.user!
      await user.load('plan')
      if (user.plan?.slug === 'starter') {
        const startOfMonth = DateTime.now().startOf('month')
        const exportCount = await ActivityFeed.query()
          .where('userId', user.id)
          .where('activityType', 'pdf_exported')
          .where('createdAt', '>=', startOfMonth.toSQL()!)
          .count('* as total')
          .first()
        const used = Number(exportCount?.$extras?.total ?? 0)
        if (used >= 3) {
          return response.forbidden({
            success: false,
            error: {
              message: 'Monthly PDF export limit reached',
              code: 'E_PLAN_LIMIT_PDF_EXPORTS',
              meta: { used, limit: 3, currentPlan: 'starter', requiredPlan: 'solo' },
            },
          })
        }
      }

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

  /**
   * Send email recap for a transaction
   * POST /api/transactions/:id/export/email
   */
  async email({ params, request, response, auth }: HttpContext) {
    try {
      const query = Transaction.query().where('id', params.id)
      TenantScopeService.apply(query, auth.user!)
      const transaction = await query.preload('client').preload('property').firstOrFail()

      const payload = await request.validateUsing(exportEmailValidator)

      // Build transaction data for the recap
      const clientName = transaction.client
        ? `${transaction.client.firstName} ${transaction.client.lastName}`
        : null
      const propertyAddress = transaction.property?.address ?? null

      // Send recap email to each recipient (fire-and-forget per recipient)
      const emailRecipients: string[] = []
      for (const recipient of payload.recipients) {
        mail.send(new TransactionRecapMail({
          to: recipient,
          clientName,
          propertyAddress,
          status: transaction.status,
          closingDate: transaction.closingDate?.toISODate() ?? null,
          salePrice: transaction.salePrice ?? null,
          customSubject: payload.subject ?? null,
          customMessage: payload.message ?? null,
          transactionId: transaction.id,
          language: auth.user!.language,
        })).catch((mailError) => {
          logger.error({ mailError, recipient, transactionId: transaction.id }, 'Failed to send recap email — non-blocking')
        })
        emailRecipients.push(recipient)
      }

      await ActivityFeedService.log({
        transactionId: transaction.id,
        userId: auth.user!.id,
        activityType: 'email_recap_sent' as any,
        metadata: {
          recipients: payload.recipients,
          subject: payload.subject || null,
        },
      })

      // Notification twin for the broker
      const recapLang = auth.user!.language?.substring(0, 2) || 'fr'
      try {
        await NotificationService.notify({
          userId: auth.user!.id,
          transactionId: transaction.id,
          type: 'email_recap_sent',
          icon: '📄',
          severity: 'info',
          title: recapLang === 'fr'
            ? `Récapitulatif envoyé`
            : `Summary sent`,
          body: recapLang === 'fr'
            ? `Destinataires: ${payload.recipients.join(', ')}`
            : `Recipients: ${payload.recipients.join(', ')}`,
          link: `/transactions/${transaction.id}`,
          emailRecipients,
        })
      } catch (notifError) {
        logger.error({ notifError }, 'Failed to create recap sent notification — non-blocking')
      }

      return response.ok({
        success: true,
        data: {
          sent: true,
          recipients: payload.recipients,
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
          error: { message: 'Transaction not found', code: 'E_NOT_FOUND' },
        })
      }
      logger.error({ error, transactionId: params.id }, 'Failed to send email recap')
      return response.internalServerError({
        success: false,
        error: { message: 'Failed to send email', code: 'E_INTERNAL_ERROR' },
      })
    }
  }
}
