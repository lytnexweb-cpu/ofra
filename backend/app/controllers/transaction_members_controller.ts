import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import Transaction from '#models/transaction'
import TransactionMember from '#models/transaction_member'
import User from '#models/user'
import { inviteMemberValidator, updateMemberRoleValidator } from '#validators/transaction_member_validator'
import { TenantScopeService } from '#services/tenant_scope_service'
import { ActivityFeedService } from '#services/activity_feed_service'
import logger from '@adonisjs/core/services/logger'

export default class TransactionMembersController {
  /**
   * List all members + invitations for a transaction
   */
  async index({ params, response, auth }: HttpContext) {
    try {
      const query = Transaction.query().where('id', params.transactionId)
      TenantScopeService.apply(query, auth.user!)
      const transaction = await query.firstOrFail()

      const members = await TransactionMember.query()
        .where('transaction_id', transaction.id)
        .whereNot('status', 'revoked')
        .preload('user')
        .preload('inviter')
        .orderBy('created_at', 'asc')

      // Include owner as virtual first entry
      await transaction.load('owner')
      const ownerEntry = {
        id: null,
        role: 'owner' as const,
        status: 'active' as const,
        userId: transaction.ownerUserId,
        email: transaction.owner.email,
        fullName: transaction.owner.fullName,
        isOwner: true,
      }

      return response.ok({
        success: true,
        data: { owner: ownerEntry, members },
      })
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.notFound({
          success: false,
          error: { message: 'Transaction not found', code: 'E_NOT_FOUND' },
        })
      }
      logger.error({ error, transactionId: params.transactionId }, 'Failed to retrieve members')
      return response.internalServerError({
        success: false,
        error: { message: 'Failed to retrieve members', code: 'E_INTERNAL_ERROR' },
      })
    }
  }

  /**
   * Invite a member by email
   */
  async store({ params, request, response, auth }: HttpContext) {
    try {
      const query = Transaction.query().where('id', params.transactionId)
      TenantScopeService.apply(query, auth.user!)
      const transaction = await query.firstOrFail()

      const payload = await request.validateUsing(inviteMemberValidator)

      // Check not inviting the owner
      await transaction.load('owner')
      if (transaction.owner.email === payload.email) {
        return response.unprocessableEntity({
          success: false,
          error: { message: 'Cannot invite the transaction owner', code: 'E_INVITE_OWNER' },
        })
      }

      // Check for existing active/pending member with this email
      const existing = await TransactionMember.query()
        .where('transaction_id', transaction.id)
        .where('email', payload.email)
        .whereIn('status', ['active', 'pending'])
        .first()

      if (existing) {
        return response.conflict({
          success: false,
          error: { message: 'Member already invited', code: 'E_ALREADY_INVITED' },
        })
      }

      // Check if a user exists with this email
      const existingUser = await User.findBy('email', payload.email)

      const member = await TransactionMember.create({
        transactionId: transaction.id,
        email: payload.email,
        role: payload.role,
        userId: existingUser?.id ?? null,
        status: existingUser ? 'active' : 'pending',
        invitedBy: auth.user!.id,
        invitedAt: DateTime.now(),
        acceptedAt: existingUser ? DateTime.now() : null,
      })

      await ActivityFeedService.log({
        transactionId: transaction.id,
        userId: auth.user!.id,
        activityType: 'member_invited',
        metadata: { memberId: member.id, email: payload.email, role: payload.role },
      })

      await member.load('user')
      await member.load('inviter')

      return response.created({
        success: true,
        data: { member },
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
      logger.error({ error, transactionId: params.transactionId }, 'Failed to invite member')
      return response.internalServerError({
        success: false,
        error: { message: 'Failed to invite member', code: 'E_INTERNAL_ERROR' },
      })
    }
  }

  /**
   * Change a member's role
   */
  async update({ params, request, response, auth }: HttpContext) {
    try {
      const member = await TransactionMember.findOrFail(params.id)

      const txQuery = Transaction.query().where('id', member.transactionId)
      TenantScopeService.apply(txQuery, auth.user!)
      const transaction = await txQuery.firstOrFail()

      // Only owner or admin can change roles
      const isOwner = transaction.ownerUserId === auth.user!.id
      const callerMember = await TransactionMember.query()
        .where('transaction_id', transaction.id)
        .where('user_id', auth.user!.id)
        .where('status', 'active')
        .first()
      const callerRole = isOwner ? 'owner' : callerMember?.role

      if (!callerRole || (callerRole !== 'owner' && callerRole !== 'admin')) {
        return response.forbidden({
          success: false,
          error: {
            message: 'Permission denied',
            code: 'E_PERMISSION_DENIED',
            requiredRole: 'admin',
            currentRole: callerRole || 'none',
          },
        })
      }

      // Non-owner cannot promote to admin
      const payload = await request.validateUsing(updateMemberRoleValidator)
      if (!isOwner && payload.role === 'admin') {
        return response.forbidden({
          success: false,
          error: {
            message: 'Only the owner can assign admin role',
            code: 'E_OWNER_ONLY',
          },
        })
      }

      member.role = payload.role
      await member.save()

      await ActivityFeedService.log({
        transactionId: transaction.id,
        userId: auth.user!.id,
        activityType: 'member_role_changed',
        metadata: { memberId: member.id, newRole: payload.role },
      })

      await member.load('user')

      return response.ok({
        success: true,
        data: { member },
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
          error: { message: 'Member not found', code: 'E_NOT_FOUND' },
        })
      }
      logger.error({ error, memberId: params.id }, 'Failed to update member role')
      return response.internalServerError({
        success: false,
        error: { message: 'Failed to update member role', code: 'E_INTERNAL_ERROR' },
      })
    }
  }

  /**
   * Revoke a member's access (soft delete)
   */
  async destroy({ params, response, auth }: HttpContext) {
    try {
      const member = await TransactionMember.findOrFail(params.id)

      const txQuery = Transaction.query().where('id', member.transactionId)
      TenantScopeService.apply(txQuery, auth.user!)
      const transaction = await txQuery.firstOrFail()

      // Only owner or admin can revoke
      const isOwner = transaction.ownerUserId === auth.user!.id
      const callerMember = await TransactionMember.query()
        .where('transaction_id', transaction.id)
        .where('user_id', auth.user!.id)
        .where('status', 'active')
        .first()
      const callerRole = isOwner ? 'owner' : callerMember?.role

      if (!callerRole || (callerRole !== 'owner' && callerRole !== 'admin')) {
        return response.forbidden({
          success: false,
          error: {
            message: 'Permission denied',
            code: 'E_PERMISSION_DENIED',
            requiredRole: 'admin',
            currentRole: callerRole || 'none',
          },
        })
      }

      // Admin cannot revoke another admin (only owner can)
      if (!isOwner && member.role === 'admin') {
        return response.forbidden({
          success: false,
          error: {
            message: 'Only the owner can revoke admin access',
            code: 'E_OWNER_ONLY',
          },
        })
      }

      member.status = 'revoked'
      member.revokedAt = DateTime.now()
      await member.save()

      await ActivityFeedService.log({
        transactionId: transaction.id,
        userId: auth.user!.id,
        activityType: 'member_removed',
        metadata: { memberId: member.id, email: member.email },
      })

      return response.ok({
        success: true,
        data: { message: 'Access revoked' },
      })
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.notFound({
          success: false,
          error: { message: 'Member not found', code: 'E_NOT_FOUND' },
        })
      }
      logger.error({ error, memberId: params.id }, 'Failed to revoke member')
      return response.internalServerError({
        success: false,
        error: { message: 'Failed to revoke member', code: 'E_INTERNAL_ERROR' },
      })
    }
  }
}
