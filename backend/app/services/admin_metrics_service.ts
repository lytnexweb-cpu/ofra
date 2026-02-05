import User from '#models/user'
import Transaction from '#models/transaction'
import Client from '#models/client'
import Condition from '#models/condition'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'

export type EngagementLevel = 'active' | 'warm' | 'inactive'

export interface UserEngagement {
  userId: number
  transactionCount: number
  completedConditions: number
  daysSinceLastLogin: number | null
  level: EngagementLevel
}

export interface AtRiskUser {
  id: number
  email: string
  fullName: string | null
  createdAt: DateTime
  daysSinceCreation: number
  daysSinceLastLogin: number | null
  transactionCount: number
  reason: 'no_login_7d' | 'no_activity_7d'
}

export interface OverdueCondition {
  id: number
  title: string
  deadline: DateTime
  daysOverdue: number
  transactionId: number
  clientName: string | null
  ownerEmail: string
}

export interface WeeklyStats {
  week: string
  count: number
}

export class AdminMetricsService {
  /**
   * Calculate engagement level for a user
   */
  static calculateEngagementLevel(
    transactionCount: number,
    completedConditions: number,
    daysSinceLastLogin: number | null
  ): EngagementLevel {
    // Inactive: no login in 14+ days OR 0 transactions and 0 conditions
    if (daysSinceLastLogin !== null && daysSinceLastLogin >= 14) {
      return 'inactive'
    }
    if (transactionCount === 0 && completedConditions === 0) {
      return 'inactive'
    }

    // Active: logged in last 3 days AND has activity
    if (daysSinceLastLogin !== null && daysSinceLastLogin <= 3 && (transactionCount > 0 || completedConditions > 0)) {
      return 'active'
    }

    // Warm: everything else
    return 'warm'
  }

  /**
   * Get engagement scores for a list of user IDs
   */
  static async getEngagementScores(userIds: number[]): Promise<Map<number, UserEngagement>> {
    if (userIds.length === 0) return new Map()

    const now = DateTime.now()

    // Get transaction counts
    const txCounts = await Transaction.query()
      .select('ownerUserId')
      .count('* as count')
      .whereIn('ownerUserId', userIds)
      .groupBy('ownerUserId')

    // Get completed conditions count per user (via their transactions)
    const conditionCounts = await db
      .from('conditions')
      .join('transactions', 'transactions.id', 'conditions.transaction_id')
      .select('transactions.owner_user_id')
      .count('* as count')
      .where('conditions.status', 'completed')
      .whereIn('transactions.owner_user_id', userIds)
      .groupBy('transactions.owner_user_id')

    // Get last login (using updatedAt as proxy)
    const users = await User.query()
      .select(['id', 'updatedAt'])
      .whereIn('id', userIds)

    const txCountMap = new Map(txCounts.map((t) => [t.ownerUserId, Number(t.$extras.count)]))
    const conditionCountMap = new Map(conditionCounts.map((c: any) => [c.owner_user_id, Number(c.count)]))

    const result = new Map<number, UserEngagement>()

    for (const user of users) {
      const transactionCount = txCountMap.get(user.id) || 0
      const completedConditions = conditionCountMap.get(user.id) || 0
      const daysSinceLastLogin = user.updatedAt ? Math.floor(now.diff(user.updatedAt, 'days').days) : null

      result.set(user.id, {
        userId: user.id,
        transactionCount,
        completedConditions,
        daysSinceLastLogin,
        level: this.calculateEngagementLevel(transactionCount, completedConditions, daysSinceLastLogin),
      })
    }

    return result
  }

  /**
   * Get at-risk users
   */
  static async getAtRiskUsers(): Promise<AtRiskUser[]> {
    const now = DateTime.now()
    const sevenDaysAgo = now.minus({ days: 7 })

    // Users with no login in 7+ days AND 0 transactions
    // OR registered 7+ days ago with 0 activity
    const users = await User.query()
      .select(['id', 'email', 'fullName', 'createdAt', 'updatedAt'])
      .where((query) => {
        query
          .where('updatedAt', '<', sevenDaysAgo.toSQL())
          .orWhere('createdAt', '<', sevenDaysAgo.toSQL())
      })

    const userIds = users.map((u) => u.id)
    if (userIds.length === 0) return []

    // Get transaction counts
    const txCounts = await Transaction.query()
      .select('ownerUserId')
      .count('* as count')
      .whereIn('ownerUserId', userIds)
      .groupBy('ownerUserId')

    const txCountMap = new Map(txCounts.map((t) => [t.ownerUserId, Number(t.$extras.count)]))

    const atRisk: AtRiskUser[] = []

    for (const user of users) {
      const txCount = txCountMap.get(user.id) || 0
      const daysSinceCreation = Math.floor(now.diff(user.createdAt, 'days').days)
      const daysSinceLastLogin = user.updatedAt ? Math.floor(now.diff(user.updatedAt, 'days').days) : null

      // No login in 7+ days AND 0 transactions
      if (daysSinceLastLogin !== null && daysSinceLastLogin >= 7 && txCount === 0) {
        atRisk.push({
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          createdAt: user.createdAt,
          daysSinceCreation,
          daysSinceLastLogin,
          transactionCount: txCount,
          reason: 'no_login_7d',
        })
      }
      // Registered 7+ days ago with 0 activity
      else if (daysSinceCreation >= 7 && txCount === 0) {
        atRisk.push({
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          createdAt: user.createdAt,
          daysSinceCreation,
          daysSinceLastLogin,
          transactionCount: txCount,
          reason: 'no_activity_7d',
        })
      }
    }

    return atRisk.sort((a, b) => (b.daysSinceLastLogin || 0) - (a.daysSinceLastLogin || 0))
  }

  /**
   * Get overdue conditions
   */
  static async getOverdueConditions(): Promise<OverdueCondition[]> {
    const now = DateTime.now()

    const conditions = await Condition.query()
      .whereNotNull('deadline')
      .where('deadline', '<', now.toSQL())
      .whereIn('status', ['pending', 'in_progress'])
      .preload('transaction', (q) => {
        q.preload('client', (cq) => cq.select(['id', 'firstName', 'lastName']))
        q.preload('owner', (oq) => oq.select(['id', 'email']))
      })
      .orderBy('deadline', 'asc')
      .limit(50)

    return conditions.map((c) => ({
      id: c.id,
      title: c.title,
      deadline: c.deadline!,
      daysOverdue: Math.floor(now.diff(c.deadline!, 'days').days),
      transactionId: c.transactionId,
      clientName: c.transaction?.client
        ? `${c.transaction.client.firstName} ${c.transaction.client.lastName}`
        : null,
      ownerEmail: c.transaction?.owner?.email || 'Unknown',
    }))
  }

  /**
   * Get signups by week (last 12 weeks)
   */
  static async getSignupsByWeek(): Promise<WeeklyStats[]> {
    const twelveWeeksAgo = DateTime.now().minus({ weeks: 12 })

    const result = await User.query()
      .select(db.raw("TO_CHAR(DATE_TRUNC('week', created_at), 'YYYY-MM-DD') as week"))
      .count('* as count')
      .where('createdAt', '>=', twelveWeeksAgo.toSQL())
      .groupBy(db.raw("DATE_TRUNC('week', created_at)"))
      .orderBy(db.raw("DATE_TRUNC('week', created_at)"), 'asc')

    return result.map((r) => ({
      week: r.$extras.week,
      count: Number(r.$extras.count),
    }))
  }

  /**
   * Get transactions by week (last 12 weeks)
   */
  static async getTransactionsByWeek(): Promise<WeeklyStats[]> {
    const twelveWeeksAgo = DateTime.now().minus({ weeks: 12 })

    const result = await Transaction.query()
      .select(db.raw("TO_CHAR(DATE_TRUNC('week', created_at), 'YYYY-MM-DD') as week"))
      .count('* as count')
      .where('createdAt', '>=', twelveWeeksAgo.toSQL())
      .groupBy(db.raw("DATE_TRUNC('week', created_at)"))
      .orderBy(db.raw("DATE_TRUNC('week', created_at)"), 'asc')

    return result.map((r) => ({
      week: r.$extras.week,
      count: Number(r.$extras.count),
    }))
  }

  /**
   * Get KPI summary
   */
  static async getKpiSummary() {
    const now = DateTime.now()
    const thirtyDaysAgo = now.minus({ days: 30 })
    const sevenDaysAgo = now.minus({ days: 7 })

    const [
      totalUsers,
      totalTransactions,
      totalClients,
      newUsersThisMonth,
      activeUsers,
      usersByRole,
      transactionsByStatus,
    ] = await Promise.all([
      User.query().count('* as count').first(),
      Transaction.query().count('* as count').first(),
      Client.query().count('* as count').first(),
      User.query().where('createdAt', '>=', thirtyDaysAgo.toSQL()).count('* as count').first(),
      User.query().where('updatedAt', '>=', sevenDaysAgo.toSQL()).count('* as count').first(),
      User.query().select('role').count('* as count').groupBy('role'),
      Transaction.query()
        .select(db.raw("CASE WHEN sale_price IS NOT NULL THEN 'completed' ELSE 'active' END as status"))
        .count('* as count')
        .groupBy(db.raw("CASE WHEN sale_price IS NOT NULL THEN 'completed' ELSE 'active' END")),
    ])

    return {
      kpis: {
        totalUsers: Number(totalUsers?.$extras.count || 0),
        totalTransactions: Number(totalTransactions?.$extras.count || 0),
        totalClients: Number(totalClients?.$extras.count || 0),
        newUsersThisMonth: Number(newUsersThisMonth?.$extras.count || 0),
        activeUsersThisWeek: Number(activeUsers?.$extras.count || 0),
      },
      usersByRole: usersByRole.map((r) => ({
        role: r.role,
        count: Number(r.$extras.count),
      })),
      transactionsByStatus: transactionsByStatus.map((t) => ({
        status: t.$extras.status,
        count: Number(t.$extras.count),
      })),
    }
  }
}
