import User from '#models/user'
import type { ModelQueryBuilderContract } from '@adonisjs/lucid/types/model'

/**
 * TenantScopeService provides multi-tenant query scoping.
 *
 * Scoping rules:
 * - Solo agent (organizationId = null): sees only their own data (ownerUserId)
 * - Organization member (organizationId set): sees all organization data
 *
 * Usage:
 *   TenantScopeService.apply(Transaction.query(), user)
 *   TenantScopeService.apply(Client.query(), user)
 */
export class TenantScopeService {
  /**
   * Apply tenant scope to a query.
   * The model must have both `ownerUserId` and `organizationId` columns.
   */
  static apply<T extends { ownerUserId: number; organizationId: number | null }>(
    query: ModelQueryBuilderContract<any, T>,
    user: User
  ): ModelQueryBuilderContract<any, T> {
    if (user.organizationId) {
      // Organization member: see all org data
      return query.where('organization_id', user.organizationId)
    } else {
      // Solo agent: see only own data
      return query.where('owner_user_id', user.id)
    }
  }

  /**
   * Check if a user can access a specific resource.
   * Returns true if access is allowed, false otherwise.
   */
  static canAccess(
    resource: { ownerUserId: number; organizationId: number | null },
    user: User
  ): boolean {
    if (user.organizationId) {
      // Organization member: can access if same organization
      return resource.organizationId === user.organizationId
    } else {
      // Solo agent: can access only own resources
      return resource.ownerUserId === user.id
    }
  }

  /**
   * Get the organization ID to use when creating a new resource.
   * Inherits from the user's organization.
   */
  static getOrganizationId(user: User): number | null {
    return user.organizationId
  }
}
