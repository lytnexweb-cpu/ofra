import type { HttpContext } from '@adonisjs/core/http'
import mail from '@adonisjs/mail/services/main'
import Transaction from '#models/transaction'
import TransactionParty from '#models/transaction_party'
import { createPartyValidator, updatePartyValidator } from '#validators/transaction_party_validator'
import { TenantScopeService } from '#services/tenant_scope_service'
import { FintracService } from '#services/fintrac_service'
import { NotificationService } from '#services/notification_service'
import PartyAddedMail from '#mails/party_added_mail'
import logger from '@adonisjs/core/services/logger'

export default class TransactionPartiesController {
  async index({ params, response, auth }: HttpContext) {
    try {
      const query = Transaction.query().where('id', params.id)
      TenantScopeService.apply(query, auth.user!)
      const transaction = await query.firstOrFail()

      const parties = await TransactionParty.query()
        .where('transaction_id', transaction.id)
        .orderBy('is_primary', 'desc')
        .orderBy('created_at', 'asc')

      return response.ok({
        success: true,
        data: { parties },
      })
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.notFound({
          success: false,
          error: { message: 'Transaction not found', code: 'E_NOT_FOUND' },
        })
      }
      logger.error({ error, transactionId: params.id }, 'Failed to retrieve parties')
      return response.internalServerError({
        success: false,
        error: { message: 'Failed to retrieve parties', code: 'E_INTERNAL_ERROR' },
      })
    }
  }

  async store({ params, request, response, auth }: HttpContext) {
    try {
      const query = Transaction.query().where('id', params.id)
      TenantScopeService.apply(query, auth.user!)
      const transaction = await query.firstOrFail()

      const payload = await request.validateUsing(createPartyValidator)
      const party = await TransactionParty.create({
        ...payload,
        transactionId: transaction.id,
      })

      // FINTRAC: Auto-create condition if transaction is at/past firm-pending
      try {
        await FintracService.onPartyAdded(transaction, party, auth.user!.id)
      } catch (fintracError) {
        logger.error({ fintracError, partyId: party.id }, 'FINTRAC onPartyAdded failed — non-blocking')
      }

      // Send email to party if they have an email
      const emailRecipients: string[] = []
      if (party.email) {
        try {
          await transaction.load('property')
          const propertyAddress = transaction.property?.address ?? null
          await mail.send(new PartyAddedMail({
            to: party.email,
            partyName: party.fullName,
            partyRole: party.role,
            brokerName: auth.user!.fullName ?? auth.user!.email,
            propertyAddress,
            language: auth.user!.language,
          }))
          emailRecipients.push(`${party.fullName} (${party.role})`)
        } catch (mailError) {
          logger.error({ mailError, partyId: party.id }, 'Failed to send party added email — non-blocking')
        }
      }

      // Notification twin for the broker
      const lang = auth.user!.language?.substring(0, 2) || 'fr'
      try {
        await NotificationService.notify({
          userId: auth.user!.id,
          transactionId: transaction.id,
          type: 'party_added',
          icon: '👤',
          severity: 'info',
          title: lang === 'fr'
            ? `Partie ajoutée: ${party.fullName}`
            : `Party added: ${party.fullName}`,
          body: lang === 'fr'
            ? `Rôle: ${party.role}${party.email ? '' : ' — aucun courriel'}`
            : `Role: ${party.role}${party.email ? '' : ' — no email'}`,
          link: `/transactions/${transaction.id}`,
          emailRecipients: emailRecipients.length > 0 ? emailRecipients : undefined,
        })
      } catch (notifError) {
        logger.error({ notifError }, 'Failed to create party added notification — non-blocking')
      }

      return response.created({
        success: true,
        data: { party },
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
      logger.error({ error, transactionId: params.id }, 'Failed to create party')
      return response.internalServerError({
        success: false,
        error: { message: 'Failed to create party', code: 'E_INTERNAL_ERROR' },
      })
    }
  }

  async update({ params, request, response, auth }: HttpContext) {
    try {
      const party = await TransactionParty.findOrFail(params.id)

      const txQuery = Transaction.query().where('id', party.transactionId)
      TenantScopeService.apply(txQuery, auth.user!)
      await txQuery.firstOrFail()

      const payload = await request.validateUsing(updatePartyValidator)
      party.merge(payload)
      await party.save()

      return response.ok({
        success: true,
        data: { party },
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
          error: { message: 'Party not found', code: 'E_NOT_FOUND' },
        })
      }
      logger.error({ error, partyId: params.id }, 'Failed to update party')
      return response.internalServerError({
        success: false,
        error: { message: 'Failed to update party', code: 'E_INTERNAL_ERROR' },
      })
    }
  }

  async destroy({ params, response, auth }: HttpContext) {
    try {
      const party = await TransactionParty.findOrFail(params.id)

      const txQuery = Transaction.query().where('id', party.transactionId)
      TenantScopeService.apply(txQuery, auth.user!)
      await txQuery.firstOrFail()

      // FINTRAC: Archive condition if party is removed
      const transaction = await Transaction.findOrFail(party.transactionId)
      try {
        await FintracService.onPartyRemoved(transaction, party, auth.user!.id)
      } catch (fintracError) {
        logger.error({ fintracError, partyId: party.id }, 'FINTRAC onPartyRemoved failed — non-blocking')
      }

      await party.delete()
      return response.noContent()
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.notFound({
          success: false,
          error: { message: 'Party not found', code: 'E_NOT_FOUND' },
        })
      }
      logger.error({ error, partyId: params.id }, 'Failed to delete party')
      return response.internalServerError({
        success: false,
        error: { message: 'Failed to delete party', code: 'E_INTERNAL_ERROR' },
      })
    }
  }
}
