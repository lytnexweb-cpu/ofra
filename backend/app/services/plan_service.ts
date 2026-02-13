/**
 * PlanService — centralized plan hierarchy checks for feature gating
 */
export class PlanService {
  private static readonly HIERARCHY = ['starter', 'solo', 'pro', 'agence']

  static meetsMinimum(
    userPlanSlug: string | undefined | null,
    required: 'solo' | 'pro' | 'agence'
  ): boolean {
    if (!userPlanSlug) return false
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
