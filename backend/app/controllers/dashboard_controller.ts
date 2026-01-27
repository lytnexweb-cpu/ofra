import type { HttpContext } from '@adonisjs/core/http'
import Transaction from '#models/transaction'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'

export default class DashboardController {
  async summary({ response, auth }: HttpContext) {
    try {
      const userId = auth.user!.id
      const today = DateTime.now()
      const todaySQL = today.toSQLDate()!
      const sevenDaysLater = today.plus({ days: 7 }).toSQLDate()!

      // Basic counts
      const [
        totalTransactions,
        activeTransactions,
        overdueConditions,
        dueSoonConditions,
      ] = await Promise.all([
        Transaction.query().where('owner_user_id', userId).count('* as total'),
        Transaction.query()
          .where('owner_user_id', userId)
          .whereNotNull('current_step_id')
          .count('* as total'),
        db
          .from('conditions')
          .join('transactions', 'conditions.transaction_id', 'transactions.id')
          .where('transactions.owner_user_id', userId)
          .where('conditions.status', 'pending')
          .where('conditions.due_date', '<=', todaySQL)
          .count('* as total'),
        db
          .from('conditions')
          .join('transactions', 'conditions.transaction_id', 'transactions.id')
          .where('transactions.owner_user_id', userId)
          .where('conditions.status', 'pending')
          .where('conditions.due_date', '>', todaySQL)
          .where('conditions.due_date', '<=', sevenDaysLater)
          .count('* as total'),
      ])

      // Pipeline: count by current workflow step slug
      const pipelineData = await db
        .from('transactions as t')
        .join('transaction_steps as ts', 't.current_step_id', 'ts.id')
        .join('workflow_steps as ws', 'ts.workflow_step_id', 'ws.id')
        .where('t.owner_user_id', userId)
        .whereNotNull('t.current_step_id')
        .select('ws.slug', 'ws.name')
        .count('* as count')
        .groupBy('ws.slug', 'ws.name')
        .orderBy('ws.slug')

      const pipeline = pipelineData.map((row) => ({
        slug: row.slug,
        name: row.name,
        count: Number(row.count),
      }))

      // Completed transactions (no current step)
      const completedTransactions = await Transaction.query()
        .where('owner_user_id', userId)
        .whereNull('current_step_id')
        .whereNotNull('workflow_template_id')
        .count('* as total')
      const completedCount = Number(completedTransactions[0].$extras.total) || 0

      // Revenue: commissions by month (last 6 months)
      const sixMonthsAgo = today.minus({ months: 6 }).startOf('month').toSQLDate()!
      const revenueData = await db
        .from('transactions')
        .where('owner_user_id', userId)
        .whereNull('current_step_id')
        .whereNotNull('commission')
        .where('updated_at', '>=', sixMonthsAgo)
        .select(db.raw("to_char(updated_at, 'YYYY-MM') as month"))
        .sum('commission as total')
        .groupByRaw("to_char(updated_at, 'YYYY-MM')")
        .orderBy('month', 'asc')

      const revenue: { month: string; total: number }[] = []
      for (let i = 5; i >= 0; i--) {
        const monthDate = today.minus({ months: i })
        const monthKey = monthDate.toFormat('yyyy-MM')
        const monthLabel = monthDate.toFormat('MMM yyyy')
        const found = revenueData.find((r) => r.month === monthKey)
        revenue.push({
          month: monthLabel,
          total: found ? Number(found.total) : 0,
        })
      }

      // Total revenue
      const totalRevenueResult = await Transaction.query()
        .where('owner_user_id', userId)
        .whereNull('current_step_id')
        .whereNotNull('commission')
        .sum('commission as total')

      const totalRevenue = Number(totalRevenueResult[0].$extras.total) || 0

      // Revenue this month
      const startOfMonth = today.startOf('month').toSQLDate()!
      const monthRevenueResult = await Transaction.query()
        .where('owner_user_id', userId)
        .whereNull('current_step_id')
        .whereNotNull('commission')
        .where('updated_at', '>=', startOfMonth)
        .sum('commission as total')

      const monthRevenue = Number(monthRevenueResult[0].$extras.total) || 0

      // Conversion rate
      const totalAll = Number(totalTransactions[0].$extras.total) || 0
      const conversionRate =
        totalAll > 0 ? Math.round((completedCount / totalAll) * 100) : 0

      // Recent activity from activity_feed
      const recentActivity = await db
        .from('activity_feed as af')
        .join('transactions as t', 'af.transaction_id', 't.id')
        .join('clients as c', 't.client_id', 'c.id')
        .leftJoin('users as u', 'af.user_id', 'u.id')
        .where('t.owner_user_id', userId)
        .select(
          'af.id',
          'af.transaction_id as transactionId',
          'af.activity_type as activityType',
          'af.metadata',
          'af.created_at as createdAt',
          'c.first_name as clientFirstName',
          'c.last_name as clientLastName',
          'u.full_name as userName'
        )
        .orderBy('af.created_at', 'desc')
        .limit(10)

      const activities = recentActivity.map((a) => ({
        id: a.id,
        transactionId: a.transactionId,
        activityType: a.activityType,
        metadata: a.metadata,
        clientName: `${a.clientFirstName} ${a.clientLastName}`,
        userName: a.userName,
        createdAt: a.createdAt,
      }))

      // Upcoming deadlines
      const upcomingDeadlinesRaw = await db
        .from('conditions as cond')
        .join('transactions as t', 'cond.transaction_id', 't.id')
        .join('clients as c', 't.client_id', 'c.id')
        .where('t.owner_user_id', userId)
        .where('cond.status', 'pending')
        .whereNotNull('cond.due_date')
        .where('cond.due_date', '>=', todaySQL)
        .where('cond.due_date', '<=', today.plus({ days: 14 }).toSQLDate()!)
        .select(
          'cond.id',
          'cond.title',
          'cond.due_date as dueDate',
          'cond.transaction_id as transactionId',
          'cond.priority',
          'cond.is_blocking as isBlocking',
          'c.first_name as clientFirstName',
          'c.last_name as clientLastName'
        )
        .orderBy('cond.due_date', 'asc')
        .limit(5)

      const deadlines = upcomingDeadlinesRaw.map((c) => ({
        id: c.id,
        title: c.title,
        dueDate: c.dueDate,
        transactionId: c.transactionId,
        clientName: `${c.clientFirstName} ${c.clientLastName}`,
        priority: c.priority,
        isBlocking: Boolean(c.isBlocking),
      }))

      return response.ok({
        success: true,
        data: {
          totalTransactions: totalAll,
          activeTransactions: Number(activeTransactions[0].$extras.total),
          completedTransactions: completedCount,
          overdueConditions: Number(overdueConditions[0].total),
          dueSoonConditions: Number(dueSoonConditions[0].total),
          pipeline,
          revenue,
          totalRevenue,
          monthRevenue,
          conversionRate,
          recentActivity: activities,
          upcomingDeadlines: deadlines,
        },
      })
    } catch (error) {
      console.error('[Dashboard] Error:', error)
      return response.internalServerError({
        success: false,
        error: {
          message: 'Failed to retrieve dashboard summary',
          code: 'E_INTERNAL_ERROR',
        },
      })
    }
  }
}
