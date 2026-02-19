import User from '#models/user'
import Transaction from '#models/transaction'
import ActivityFeed from '#models/activity_feed'
import Condition from '#models/condition'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'

export class AdminPulseService {
  /**
   * KPIs: total users (+30d delta), active TX (+30d delta), founders X/25, MRR placeholder
   */
  static async getKpis() {
    const now = DateTime.now()
    const thirtyDaysAgo = now.minus({ days: 30 })

    const [totalUsers, newUsers30d, activeTx, newTx30d, founderCount] = await Promise.all([
      User.query().count('* as count').first(),
      User.query().where('createdAt', '>=', thirtyDaysAgo.toSQL()).count('* as count').first(),
      Transaction.query()
        .whereNotIn('status', ['cancelled', 'archived'])
        .count('* as count')
        .first(),
      Transaction.query()
        .where('createdAt', '>=', thirtyDaysAgo.toSQL())
        .count('* as count')
        .first(),
      User.query().where('isFounder', true).count('* as count').first(),
    ])

    return {
      totalUsers: Number(totalUsers?.$extras.count || 0),
      newUsers30d: Number(newUsers30d?.$extras.count || 0),
      activeTx: Number(activeTx?.$extras.count || 0),
      newTx30d: Number(newTx30d?.$extras.count || 0),
      founders: Number(founderCount?.$extras.count || 0),
      foundersMax: 25,
      mrr: 0, // Placeholder until Stripe is integrated
    }
  }

  /**
   * Alerts: trials expiring soon (J25+), past_due users, overdue conditions
   */
  static async getAlerts() {
    const now = DateTime.now()
    const fiveDaysFromNow = now.plus({ days: 5 })

    // Trials expiring in next 5 days (J25+)
    const expiringTrials = await User.query()
      .where('subscriptionStatus', 'trial')
      .whereNotNull('subscriptionEndsAt')
      .where('subscriptionEndsAt', '<=', fiveDaysFromNow.toSQL())
      .where('subscriptionEndsAt', '>', now.toSQL())
      .select(['id', 'email', 'fullName', 'subscriptionEndsAt'])
      .orderBy('subscriptionEndsAt', 'asc')

    // Past due users
    const pastDueUsers = await User.query()
      .where('subscriptionStatus', 'past_due')
      .select(['id', 'email', 'fullName', 'subscriptionEndsAt'])

    // Overdue conditions
    const overdueConditions = await Condition.query()
      .whereNotNull('dueDate')
      .where('dueDate', '<', now.toSQL())
      .whereIn('status', ['pending', 'in_progress'])
      .count('* as count')
      .first()

    return {
      expiringTrials: expiringTrials.map((u) => ({
        id: u.id,
        email: u.email,
        fullName: u.fullName,
        subscriptionEndsAt: u.subscriptionEndsAt,
      })),
      pastDueUsers: pastDueUsers.map((u) => ({
        id: u.id,
        email: u.email,
        fullName: u.fullName,
      })),
      overdueConditionsCount: Number(overdueConditions?.$extras.count || 0),
    }
  }

  /**
   * Activity feed: last N actions
   */
  static async getActivityFeed(limit = 20) {
    const activities = await ActivityFeed.query()
      .preload('user', (q: any) => q.select(['id', 'email', 'fullName']))
      .preload('transaction' as any, (q: any) => q.select(['id', 'clientId']).preload('client', (cq: any) => cq.select(['id', 'firstName', 'lastName'])))
      .orderBy('createdAt', 'desc')
      .limit(limit)

    return activities.map((a: any) => ({
      id: a.id,
      type: a.activityType,
      userId: a.userId,
      userName: a.user?.fullName || a.user?.email || null,
      transactionId: a.transactionId,
      clientName: a.transaction?.client
        ? `${a.transaction.client.firstName} ${a.transaction.client.lastName}`
        : null,
      metadata: a.metadata,
      createdAt: a.createdAt,
    }))
  }

  /**
   * Conversion stats: trial → active ratio
   */
  static async getConversionStats() {
    const [trialCount, activeCount, cancelledCount, totalEver] = await Promise.all([
      User.query().where('subscriptionStatus', 'trial').count('* as count').first(),
      User.query().where('subscriptionStatus', 'active').count('* as count').first(),
      User.query().where('subscriptionStatus', 'cancelled').count('* as count').first(),
      User.query().count('* as count').first(),
    ])

    const trial = Number(trialCount?.$extras.count || 0)
    const active = Number(activeCount?.$extras.count || 0)
    const cancelled = Number(cancelledCount?.$extras.count || 0)
    const total = Number(totalEver?.$extras.count || 0)

    // Signups by week (last 8 weeks) for chart
    const eightWeeksAgo = DateTime.now().minus({ weeks: 8 })
    const signupsByWeek = await User.query()
      .select(db.raw("TO_CHAR(DATE_TRUNC('week', created_at), 'YYYY-MM-DD') as week"))
      .count('* as count')
      .where('createdAt', '>=', eightWeeksAgo.toSQL())
      .groupByRaw("DATE_TRUNC('week', created_at)")
      .orderByRaw("DATE_TRUNC('week', created_at) asc")

    return {
      trial,
      active,
      cancelled,
      total,
      conversionRate: total > 0 ? Math.round((active / total) * 100) : 0,
      signupsByWeek: signupsByWeek.map((r) => ({
        week: r.$extras.week,
        count: Number(r.$extras.count),
      })),
    }
  }
}
