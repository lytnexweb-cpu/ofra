/**
 * PlanService — centralized plan hierarchy checks for feature gating
 *
 * Trial users (no planId) get full Pro access per D53.
 */
export class PlanService {
  private static readonly HIERARCHY = ['starter', 'solo', 'pro', 'agence']

  static meetsMinimum(
    userPlanSlug: string | undefined | null,
    required: 'solo' | 'pro' | 'agence'
  ): boolean {
    // Trial users (no plan) get Pro-level access per D53
    if (!userPlanSlug) {
      return this.HIERARCHY.indexOf('pro') >= this.HIERARCHY.indexOf(required)
    }
    return this.HIERARCHY.indexOf(userPlanSlug) >= this.HIERARCHY.indexOf(required)
  }

  static formatUpgradeError(feature: string, currentPlan: string, requiredPlan: string) {
    return {
      success: false,
      error: {
        message: `This feature requires ${requiredPlan} plan or higher`,
        code: 'E_PLAN_UPGRADE_REQUIRED' as const,
        meta: { feature, currentPlan, requiredPlan },
      },
    }
  }
}
