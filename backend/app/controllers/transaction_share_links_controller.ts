import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import { randomBytes } from 'node:crypto'
import hash from '@adonisjs/core/services/hash'
import mail from '@adonisjs/mail/services/main'
import Transaction from '#models/transaction'
import TransactionShareLink from '#models/transaction_share_link'
import {
  createShareLinkValidator,
  updateShareLinkValidator,
} from '#validators/transaction_share_link_validator'
import { TenantScopeService } from '#services/tenant_scope_service'
import { ActivityFeedService } from '#services/activity_feed_service'
import { NotificationService } from '#services/notification_service'
import ShareLinkMail from '#mails/share_link_mail'
import logger from '@adonisjs/core/services/logger'

/**
 * Generate a unique share token
 */
function generateToken(): string {
  return randomBytes(24).toString('base64url')
}

export default class TransactionShareLinksController {
  /**
   * Get the active share link for a transaction (or null)
   */
  async show({ params, request, response, auth }: HttpContext) {
    try {
      const query = Transaction.query().where('id', params.transactionId)
      TenantScopeService.apply(query, auth.user!)
      const transaction = await query.firstOrFail()

      const linkQuery = TransactionShareLink.query()
        .where('transaction_id', transaction.id)
        .orderBy('created_at', 'desc')

      // Optional filter by link_type (e.g. ?linkType=offer_intake)
      const linkType = request.input('linkType')
      if (linkType) {
        linkQuery.where('link_type', linkType)
      }

      const link = await linkQuery.first()

      return response.ok({
        success: true,
        data: {
          shareLink: link
            ? {
                id: link.id,
                token: link.token,
                linkType: link.linkType,
                role: link.role,
                isActive: link.isActive,
                expiresAt: link.expiresAt,
                hasPassword: !!link.passwordHash,
                accessCount: link.accessCount,
                lastAccessedAt: link.lastAccessedAt,
                createdAt: link.createdAt,
              }
            : null,
        },
      })
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.notFound({
          success: false,
          error: { message: 'Transaction not found', code: 'E_NOT_FOUND' },
        })
      }
      logger.error({ error, transactionId: params.transactionId }, 'Failed to get share link')
      return response.internalServerError({
        success: false,
        error: { message: 'Failed to get share link', code: 'E_INTERNAL_ERROR' },
      })
    }
  }

  /**
   * Create / regenerate a share link
   */
  async store({ params, request, response, auth }: HttpContext) {
    try {
      const query = Transaction.query().where('id', params.transactionId)
      TenantScopeService.apply(query, auth.user!)
      const transaction = await query.firstOrFail()

      const payload = await request.validateUsing(createShareLinkValidator)

      // Gate: Starter plan limited to 1 share link per transaction (total, not just active)
      await auth.user!.load('plan')
      if (auth.user!.plan?.slug === 'starter') {
        const existingCount = await TransactionShareLink.query()
          .where('transactionId', transaction.id)
          .count('* as total')
          .first()
        if (Number(existingCount?.$extras?.total ?? 0) >= 1) {
          return response.forbidden({
            success: false,
            error: {
              message: 'Share link limit reached',
              code: 'E_PLAN_LIMIT_SHARE_LINKS',
              meta: { limit: 1, currentPlan: 'starter', requiredPlan: 'solo' },
            },
          })
        }
      }

      // Deactivate existing active links of the same type
      const newLinkType = payload.linkType || 'viewer'
      await TransactionShareLink.query()
        .where('transaction_id', transaction.id)
        .where('link_type', newLinkType)
        .where('is_active', true)
        .update({ is_active: false })

      // Hash password if provided
      let passwordHash: string | null = null
      if (payload.password) {
        passwordHash = await hash.make(payload.password)
      }

      const token = generateToken()
      const link = await TransactionShareLink.create({
        transactionId: transaction.id,
        token,
        linkType: payload.linkType || 'viewer',
        role: payload.role || 'viewer',
        isActive: true,
        expiresAt: payload.expiresAt ? DateTime.fromISO(payload.expiresAt) : null,
        passwordHash,
        createdBy: auth.user!.id,
        accessCount: 0,
      })

      await ActivityFeedService.log({
        transactionId: transaction.id,
        userId: auth.user!.id,
        activityType: 'share_link_created',
        metadata: { linkId: link.id, role: link.role },
      })

      // Send confirmation email to broker
      try {
        await mail.send(new ShareLinkMail({
          to: auth.user!.email,
          role: link.role,
          hasPassword: !!link.passwordHash,
          expiresAt: link.expiresAt?.toISO() ?? null,
          transactionId: transaction.id,
          language: auth.user!.language,
        }))
      } catch (mailError) {
        logger.error({ mailError }, 'Failed to send share link email — non-blocking')
      }

      // Notification twin for the broker
      const lang = auth.user!.language?.substring(0, 2) || 'fr'
      try {
        await NotificationService.notify({
          userId: auth.user!.id,
          transactionId: transaction.id,
          type: 'share_link_created',
          icon: '🔗',
          severity: 'info',
          title: lang === 'fr'
            ? 'Lien de partage créé'
            : 'Share link created',
          body: lang === 'fr'
            ? `Accès: ${link.role}${link.passwordHash ? ' (protégé)' : ''}`
            : `Access: ${link.role}${link.passwordHash ? ' (protected)' : ''}`,
          link: `/transactions/${transaction.id}`,
          emailRecipients: [auth.user!.email],
        })
      } catch (notifError) {
        logger.error({ notifError }, 'Failed to create share link notification — non-blocking')
      }

      return response.created({
        success: true,
        data: {
          shareLink: {
            id: link.id,
            token: link.token,
            linkType: link.linkType,
            role: link.role,
            isActive: link.isActive,
            expiresAt: link.expiresAt,
            hasPassword: !!link.passwordHash,
            accessCount: link.accessCount,
            createdAt: link.createdAt,
          },
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
      logger.error({ error, transactionId: params.transactionId }, 'Failed to create share link')
      return response.internalServerError({
        success: false,
        error: { message: 'Failed to create share link', code: 'E_INTERNAL_ERROR' },
      })
    }
  }

  /**
   * Update share link settings
   */
  async update({ params, request, response, auth }: HttpContext) {
    try {
      const link = await TransactionShareLink.findOrFail(params.id)

      const txQuery = Transaction.query().where('id', link.transactionId)
      TenantScopeService.apply(txQuery, auth.user!)
      await txQuery.firstOrFail()

      const payload = await request.validateUsing(updateShareLinkValidator)

      if (payload.role !== undefined) link.role = payload.role
      if (payload.isActive !== undefined) link.isActive = payload.isActive
      if (payload.expiresAt !== undefined) {
        link.expiresAt = payload.expiresAt ? DateTime.fromISO(payload.expiresAt) : null
      }
      if (payload.password !== undefined) {
        link.passwordHash = payload.password ? await hash.make(payload.password) : null
      }

      await link.save()

      return response.ok({
        success: true,
        data: {
          shareLink: {
            id: link.id,
            token: link.token,
            linkType: link.linkType,
            role: link.role,
            isActive: link.isActive,
            expiresAt: link.expiresAt,
            hasPassword: !!link.passwordHash,
            accessCount: link.accessCount,
            lastAccessedAt: link.lastAccessedAt,
            createdAt: link.createdAt,
          },
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
          error: { message: 'Share link not found', code: 'E_NOT_FOUND' },
        })
      }
      logger.error({ error, linkId: params.id }, 'Failed to update share link')
      return response.internalServerError({
        success: false,
        error: { message: 'Failed to update share link', code: 'E_INTERNAL_ERROR' },
      })
    }
  }

  /**
   * Disable a share link
   */
  async destroy({ params, response, auth }: HttpContext) {
    try {
      const link = await TransactionShareLink.findOrFail(params.id)

      const txQuery = Transaction.query().where('id', link.transactionId)
      TenantScopeService.apply(txQuery, auth.user!)
      const transaction = await txQuery.firstOrFail()

      link.isActive = false
      await link.save()

      await ActivityFeedService.log({
        transactionId: transaction.id,
        userId: auth.user!.id,
        activityType: 'share_link_revoked',
        metadata: { linkId: link.id },
      })

      return response.ok({
        success: true,
        data: { message: 'Share link disabled' },
      })
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.notFound({
          success: false,
          error: { message: 'Share link not found', code: 'E_NOT_FOUND' },
        })
      }
      logger.error({ error, linkId: params.id }, 'Failed to disable share link')
      return response.internalServerError({
        success: false,
        error: { message: 'Failed to disable share link', code: 'E_INTERNAL_ERROR' },
      })
    }
  }

  /**
   * Public access via share token (no auth required)
   */
  async publicAccess({ params, request, response }: HttpContext) {
    try {
      const link = await TransactionShareLink.query()
        .where('token', params.token)
        .first()

      if (!link) {
        return response.notFound({
          success: false,
          error: { message: 'Share link not found', code: 'E_NOT_FOUND' },
        })
      }

      if (!link.isActive) {
        return response.forbidden({
          success: false,
          error: { message: 'This share link has been disabled', code: 'E_LINK_DISABLED' },
        })
      }

      if (link.expiresAt && link.expiresAt < DateTime.now()) {
        return response.gone({
          success: false,
          error: { message: 'This share link has expired', code: 'E_LINK_EXPIRED' },
        })
      }

      // Password check
      if (link.passwordHash) {
        const password = request.header('x-share-password') || request.input('password')
        if (!password) {
          return response.unauthorized({
            success: false,
            error: { message: 'Password required', code: 'E_PASSWORD_REQUIRED', needsPassword: true },
          })
        }
        const valid = await hash.verify(link.passwordHash, password)
        if (!valid) {
          return response.unauthorized({
            success: false,
            error: { message: 'Invalid password', code: 'E_INVALID_PASSWORD' },
          })
        }
      }

      // Update access stats
      link.accessCount += 1
      link.lastAccessedAt = DateTime.now()
      await link.save()

      // Load transaction with safe viewer scope
      const transaction = await Transaction.query()
        .where('id', link.transactionId)
        .preload('client', (q) => q.select('id', 'firstName', 'lastName', 'email'))
        .preload('property')
        .preload('conditions', (q) => q.orderBy('created_at', 'asc'))
        .preload('offers', (q) => q.preload('revisions').orderBy('created_at', 'desc'))
        .preload('transactionSteps', (q) => q.orderBy('step_order', 'asc'))
        .preload('parties')
        .firstOrFail()

      return response.ok({
        success: true,
        data: {
          role: link.role,
          transaction: {
            id: transaction.id,
            type: transaction.type,
            status: transaction.status,
            closingDate: transaction.closingDate,
            offerExpiryDate: transaction.offerExpiryDate,
            inspectionDeadline: transaction.inspectionDeadline,
            financingDeadline: transaction.financingDeadline,
            salePrice: transaction.salePrice,
            listPrice: transaction.listPrice,
            createdAt: transaction.createdAt,
          },
          client: transaction.client
            ? { fullName: `${transaction.client.firstName} ${transaction.client.lastName}` }
            : null,
          property: transaction.property,
          steps: transaction.transactionSteps,
          conditions: transaction.conditions.map((c) => ({
            id: c.id,
            title: c.title,
            level: c.level,
            status: c.status,
            dueDate: c.dueDate,
          })),
          offers: transaction.offers.map((o) => ({
            id: o.id,
            status: o.status,
            latestAmount: o.revisions?.[0]?.price ?? null,
            createdAt: o.createdAt,
          })),
          parties: transaction.parties,
        },
      })
    } catch (error) {
      logger.error({ error, token: params.token }, 'Failed to access share link')
      return response.internalServerError({
        success: false,
        error: { message: 'Failed to access shared transaction', code: 'E_INTERNAL_ERROR' },
      })
    }
  }
}
