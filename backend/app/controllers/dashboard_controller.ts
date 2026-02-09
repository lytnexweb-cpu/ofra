import type { HttpContext } from '@adonisjs/core/http'
import Transaction from '#models/transaction'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'

export default class DashboardController {
  /**
   * GET /api/dashboard/urgencies
   * D42: Dashboard urgences — conditions pending triées par criticité
   */
  async urgencies({ response, auth }: HttpContext) {
    try {
      const userId = auth.user!.id
      const today = DateTime.now()

      // Count active transactions for this user
      const activeCountResult = await Transaction.query()
        .where('owner_user_id', userId)
        .where('status', 'active')
        .whereNotNull('current_step_id')
        .count('* as total')
      const totalActiveTransactions = Number(activeCountResult[0].$extras.total) || 0

      // Count total transactions (including completed)
      const totalCountResult = await Transaction.query()
        .where('owner_user_id', userId)
        .count('* as total')
      const totalTransactions = Number(totalCountResult[0].$extras.total) || 0

      // If no transactions at all, return empty state (A3)
      if (totalTransactions === 0) {
        return response.ok({
          success: true,
          data: {
            state: 'empty',
            urgencies: [],
            totalActiveTransactions: 0,
            totalTransactions: 0,
            urgencyCount: 0,
            greenCount: 0,
            nextDeadlineDays: null,
          },
        })
      }

      // Fetch all pending conditions with due_date for user's active transactions
      const conditionsRaw = await db
        .from('conditions as c')
        .join('transactions as t', 'c.transaction_id', 't.id')
        .join('clients as cl', 't.client_id', 'cl.id')
        .leftJoin('properties as p', 't.property_id', 'p.id')
        .leftJoin('transaction_steps as ts', 't.current_step_id', 'ts.id')
        .leftJoin('workflow_steps as ws', 'ts.workflow_step_id', 'ws.id')
        .where('t.owner_user_id', userId)
        .where('t.status', 'active')
        .whereNotNull('t.current_step_id')
        .where('c.status', 'pending')
        .where('c.archived', false)
        .whereNotNull('c.due_date')
        .select(
          'c.id as conditionId',
          'c.title as conditionTitle',
          'c.label_fr as labelFr',
          'c.label_en as labelEn',
          'c.level',
          'c.due_date as dueDate',
          'c.type as conditionType',
          't.id as transactionId',
          't.type as transactionType',
          't.sale_price as salePrice',
          'cl.first_name as clientFirstName',
          'cl.last_name as clientLastName',
          'p.address as propertyAddress',
          'p.city as propertyCity',
          'ts.step_order as stepOrder',
          'ws.name as stepName'
        )
        .orderBy('c.due_date', 'asc')

      // Classify and build urgency items
      const urgencies: Array<{
        conditionId: number
        conditionTitle: string
        labelFr: string | null
        labelEn: string | null
        level: string
        dueDate: string
        daysRemaining: number
        criticality: 'overdue' | 'urgent' | 'this_week' | 'ok'
        transactionId: number
        transactionType: string
        clientName: string
        address: string | null
        stepOrder: number | null
        stepName: string | null
      }> = []

      for (const row of conditionsRaw) {
        const dueDate = DateTime.fromJSDate(new Date(row.dueDate))
        const daysRemaining = Math.ceil(dueDate.diff(today, 'days').days)

        let criticality: 'overdue' | 'urgent' | 'this_week' | 'ok'
        if (daysRemaining < 0) {
          criticality = 'overdue'
        } else if (daysRemaining <= 2) {
          criticality = 'urgent'
        } else if (daysRemaining <= 7) {
          criticality = 'this_week'
        } else {
          criticality = 'ok'
        }

        const address = row.propertyAddress
          ? `${row.propertyAddress}${row.propertyCity ? ', ' + row.propertyCity : ''}`
          : null

        urgencies.push({
          conditionId: row.conditionId,
          conditionTitle: row.conditionTitle,
          labelFr: row.labelFr,
          labelEn: row.labelEn,
          level: row.level,
          dueDate: row.dueDate,
          daysRemaining,
          criticality,
          transactionId: row.transactionId,
          transactionType: row.transactionType,
          clientName: `${row.clientFirstName} ${row.clientLastName}`,
          address,
          stepOrder: row.stepOrder,
          stepName: row.stepName,
        })
      }

      // Sort: overdue first (most overdue), then urgent, then this_week, then ok
      const criticalityOrder = { overdue: 0, urgent: 1, this_week: 2, ok: 3 }
      urgencies.sort((a, b) => {
        const critDiff = criticalityOrder[a.criticality] - criticalityOrder[b.criticality]
        if (critDiff !== 0) return critDiff
        return a.daysRemaining - b.daysRemaining
      })

      // Split into burning (red + yellow) and ok (green)
      const burning = urgencies.filter((u) => u.criticality !== 'ok')
      const green = urgencies.filter((u) => u.criticality === 'ok')

      // Determine state
      const state = burning.length > 0 ? 'urgencies' : 'all_clear'

      // Next deadline for green transactions (for "tout roule" message)
      const nextDeadlineDays = green.length > 0 ? green[0].daysRemaining : null

      // Active transactions with no pending conditions at all = part of green count
      const txWithPendingConditions = new Set(urgencies.map((u) => u.transactionId))
      const txWithoutUrgencies = totalActiveTransactions - txWithPendingConditions.size
      const greenTxCount = new Set(green.map((u) => u.transactionId)).size + txWithoutUrgencies

      return response.ok({
        success: true,
        data: {
          state,
          urgencies: burning.slice(0, 10),
          hasMore: burning.length > 10,
          moreCount: burning.length > 10 ? burning.length - 10 : 0,
          totalActiveTransactions,
          totalTransactions,
          urgencyCount: burning.length,
          greenCount: greenTxCount,
          nextDeadlineDays,
        },
      })
    } catch (error) {
      console.error('[Dashboard] Urgencies error:', error)
      return response.internalServerError({
        success: false,
        error: {
          message: 'Failed to retrieve urgencies',
          code: 'E_INTERNAL_ERROR',
        },
      })
    }
  }

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
