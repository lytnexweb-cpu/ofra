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
      const thirtyDaysAgo = today.minus({ days: 30 }).toSQLDate()!

      // Basic counts
      const [
        totalTransactions,
        activeTransactions,
        completedTransactions,
        overdueConditions,
        dueSoonConditions,
      ] = await Promise.all([
        Transaction.query().where('owner_user_id', userId).count('* as total'),
        Transaction.query()
          .where('owner_user_id', userId)
          .whereNotIn('status', ['completed', 'cancelled'])
          .count('* as total'),
        Transaction.query()
          .where('owner_user_id', userId)
          .where('status', 'completed')
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

      // Pipeline: count by status
      const pipelineData = await Transaction.query()
        .where('owner_user_id', userId)
        .whereNotIn('status', ['completed', 'cancelled'])
        .select('status')
        .count('* as count')
        .groupBy('status')

      const pipeline = {
        active: 0,
        offer: 0,
        conditional: 0,
        firm: 0,
        closing: 0,
      }
      pipelineData.forEach((row) => {
        const status = row.status as keyof typeof pipeline
        if (status in pipeline) {
          pipeline[status] = Number(row.$extras.count)
        }
      })

      // Revenue: commissions by month (last 6 months)
      const sixMonthsAgo = today.minus({ months: 6 }).startOf('month').toSQLDate()!
      const revenueData = await db
        .from('transactions')
        .where('owner_user_id', userId)
        .where('status', 'completed')
        .whereNotNull('commission')
        .where('updated_at', '>=', sixMonthsAgo)
        .select(db.raw("to_char(updated_at, 'YYYY-MM') as month"))
        .sum('commission as total')
        .groupByRaw("to_char(updated_at, 'YYYY-MM')")
        .orderBy('month', 'asc')

      // Build revenue array for last 6 months
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

      // Total revenue (completed transactions)
      const totalRevenueResult = await Transaction.query()
        .where('owner_user_id', userId)
        .where('status', 'completed')
        .whereNotNull('commission')
        .sum('commission as total')

      const totalRevenue = Number(totalRevenueResult[0].$extras.total) || 0

      // Revenue this month
      const startOfMonth = today.startOf('month').toSQLDate()!
      const monthRevenueResult = await Transaction.query()
        .where('owner_user_id', userId)
        .where('status', 'completed')
        .whereNotNull('commission')
        .where('updated_at', '>=', startOfMonth)
        .sum('commission as total')

      const monthRevenue = Number(monthRevenueResult[0].$extras.total) || 0

      // Conversion rate (completed / total non-canceled)
      const totalNonCanceled = await Transaction.query()
        .where('owner_user_id', userId)
        .whereNot('status', 'cancelled')
        .count('* as total')

      const totalNonCanceledCount = Number(totalNonCanceled[0].$extras.total) || 0
      const completedCount = Number(completedTransactions[0].$extras.total) || 0
      const conversionRate =
        totalNonCanceledCount > 0 ? Math.round((completedCount / totalNonCanceledCount) * 100) : 0

      // Recent activity using raw queries for better performance
      const recentStatusChangesRaw = await db
        .from('transaction_status_histories as h')
        .join('transactions as t', 'h.transaction_id', 't.id')
        .join('clients as c', 't.client_id', 'c.id')
        .where('t.owner_user_id', userId)
        .where('h.created_at', '>=', thirtyDaysAgo)
        .select(
          'h.id',
          'h.transaction_id as transactionId',
          'h.from_status as fromStatus',
          'h.to_status as toStatus',
          'h.created_at as createdAt',
          'c.first_name as clientFirstName',
          'c.last_name as clientLastName'
        )
        .orderBy('h.created_at', 'desc')
        .limit(5)

      const recentNotesRaw = await db
        .from('notes as n')
        .join('transactions as t', 'n.transaction_id', 't.id')
        .join('clients as c', 't.client_id', 'c.id')
        .leftJoin('users as u', 'n.author_user_id', 'u.id')
        .where('t.owner_user_id', userId)
        .where('n.created_at', '>=', thirtyDaysAgo)
        .select(
          'n.id',
          'n.transaction_id as transactionId',
          'n.content',
          'n.created_at as createdAt',
          'c.first_name as clientFirstName',
          'c.last_name as clientLastName',
          'u.full_name as authorName',
          'u.email as authorEmail'
        )
        .orderBy('n.created_at', 'desc')
        .limit(5)

      const recentConditionsRaw = await db
        .from('conditions as cond')
        .join('transactions as t', 'cond.transaction_id', 't.id')
        .join('clients as c', 't.client_id', 'c.id')
        .where('t.owner_user_id', userId)
        .where('cond.status', 'completed')
        .where('cond.updated_at', '>=', thirtyDaysAgo)
        .select(
          'cond.id',
          'cond.transaction_id as transactionId',
          'cond.title',
          'cond.updated_at as createdAt',
          'c.first_name as clientFirstName',
          'c.last_name as clientLastName'
        )
        .orderBy('cond.updated_at', 'desc')
        .limit(5)

      // Merge and sort recent activity
      const recentActivity = [
        ...recentStatusChangesRaw.map((h) => ({
          type: 'status_change' as const,
          id: h.id,
          transactionId: h.transactionId,
          clientName: `${h.clientFirstName} ${h.clientLastName}`,
          description: `Status: ${h.fromStatus || 'new'} → ${h.toStatus}`,
          fromStatus: h.fromStatus || undefined,
          toStatus: h.toStatus,
          createdAt: h.createdAt,
        })),
        ...recentNotesRaw.map((n) => ({
          type: 'note' as const,
          id: n.id,
          transactionId: n.transactionId,
          clientName: `${n.clientFirstName} ${n.clientLastName}`,
          description: `Note: ${n.content.substring(0, 50)}${n.content.length > 50 ? '...' : ''}`,
          author: n.authorName || n.authorEmail || 'Unknown',
          createdAt: n.createdAt,
        })),
        ...recentConditionsRaw.map((c) => ({
          type: 'condition_completed' as const,
          id: c.id,
          transactionId: c.transactionId,
          clientName: `${c.clientFirstName} ${c.clientLastName}`,
          description: `Condition completed: ${c.title}`,
          createdAt: c.createdAt,
        })),
      ]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10)

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
          // Basic stats
          totalTransactions: Number(totalTransactions[0].$extras.total),
          activeTransactions: Number(activeTransactions[0].$extras.total),
          completedTransactions: completedCount,
          overdueConditions: Number(overdueConditions[0].total),
          dueSoonConditions: Number(dueSoonConditions[0].total),
          // Pipeline
          pipeline,
          // Revenue
          revenue,
          totalRevenue,
          monthRevenue,
          // Metrics
          conversionRate,
          // Activity
          recentActivity,
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
