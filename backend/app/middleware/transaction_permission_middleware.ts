import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import Transaction from '#models/transaction'
import TransactionMember from '#models/transaction_member'

/**
 * Transaction role hierarchy (higher index = more privileges)
 */
export type TransactionRole = 'viewer' | 'editor' | 'admin' | 'owner'

const ROLE_HIERARCHY: Record<TransactionRole, number> = {
  viewer: 1,
  editor: 2,
  admin: 3,
  owner: 4,
}

/**
 * Resolve the effective transaction role for a user.
 * 1. Owner (from transaction.ownerUserId) => 'owner'
 * 2. Active TransactionMember => member.role
 * 3. Same organization => 'editor' (backward compat)
 * 4. Otherwise => null (no access)
 */
async function resolveRole(
  transaction: Transaction,
  userId: number,
  userOrgId: number | null
): Promise<TransactionRole | null> {
  // 1. Owner
  if (transaction.ownerUserId === userId) {
    return 'owner'
  }

  // 2. Active member
  const member = await TransactionMember.query()
    .where('transaction_id', transaction.id)
    .where('user_id', userId)
    .where('status', 'active')
    .first()

  if (member) {
    return member.role
  }

  // 3. Same organization (backward compat for org members)
  if (userOrgId && transaction.organizationId && userOrgId === transaction.organizationId) {
    return 'editor'
  }

  return null
}

/**
 * Transaction Permission Middleware
 *
 * Resolves the user's role on a transaction and enforces minimum role requirements.
 * Exposes `ctx.transactionRole` and `ctx.transaction` for downstream handlers.
 *
 * Usage in routes:
 *   .use(middleware.txPermission({ minRole: 'viewer' }))
 *   .use(middleware.txPermission({ minRole: 'editor' }))
 *   .use(middleware.txPermission({ minRole: 'admin' }))
 *   .use(middleware.txPermission({ minRole: 'owner' }))
 */
export default class TransactionPermissionMiddleware {
  async handle(
    ctx: HttpContext,
    next: NextFn,
    options?: { minRole?: TransactionRole }
  ) {
    const user = ctx.auth.user
    if (!user) {
      return ctx.response.unauthorized({
        success: false,
        error: { message: 'Authentication required', code: 'E_UNAUTHORIZED' },
      })
    }

    // Find transaction ID from route params (supports :id, :transactionId)
    const transactionId = ctx.params.transactionId || ctx.params.id
    if (!transactionId) {
      return ctx.response.badRequest({
        success: false,
        error: { message: 'Transaction ID required', code: 'E_BAD_REQUEST' },
      })
    }

    // Load transaction
    const transaction = await Transaction.find(transactionId)
    if (!transaction) {
      return ctx.response.notFound({
        success: false,
        error: { message: 'Transaction not found', code: 'E_NOT_FOUND' },
      })
    }

    // Resolve role
    const role = await resolveRole(transaction, user.id, user.organizationId)
    if (!role) {
      // Load owner name for error payload (aligned with maquette "Permission insuffisante")
      await transaction.load('owner')
      return ctx.response.forbidden({
        success: false,
        error: {
          message: 'You do not have access to this transaction',
          code: 'E_PERMISSION_DENIED',
          requiredRole: options?.minRole || 'viewer',
          currentRole: 'none',
          ownerName: transaction.owner?.fullName || null,
        },
      })
    }

    // Check minimum role
    const minRole = options?.minRole || 'viewer'
    if (ROLE_HIERARCHY[role] < ROLE_HIERARCHY[minRole]) {
      await transaction.load('owner')
      return ctx.response.forbidden({
        success: false,
        error: {
          message: 'Insufficient permissions',
          code: 'E_PERMISSION_DENIED',
          requiredRole: minRole,
          currentRole: role,
          ownerName: transaction.owner?.fullName || null,
        },
      })
    }

    // Expose on context for downstream controllers
    ;(ctx as any).transactionRole = role
    ;(ctx as any).transaction = transaction

    return next()
  }
}
