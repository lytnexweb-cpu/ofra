import type { HttpContext } from '@adonisjs/core/http'
import Transaction from '#models/transaction'
import Condition from '#models/condition'
import { DateTime } from 'luxon'

export default class DashboardController {
  async summary({ response, auth }: HttpContext) {
    try {
      const userId = auth.user!.id
      const today = DateTime.now().toSQLDate()!
      const sevenDaysLater = DateTime.now().plus({ days: 7 }).toSQLDate()!

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
          .whereNotIn('status', ['completed', 'canceled'])
          .count('* as total'),
        Transaction.query()
          .where('owner_user_id', userId)
          .where('status', 'completed')
          .count('* as total'),
        Condition.query()
          .join('transactions', 'conditions.transaction_id', 'transactions.id')
          .where('transactions.owner_user_id', userId)
          .where('conditions.status', 'pending')
          .where('conditions.due_date', '<=', today) // Include today as overdue
          .count('* as total'),
        Condition.query()
          .join('transactions', 'conditions.transaction_id', 'transactions.id')
          .where('transactions.owner_user_id', userId)
          .where('conditions.status', 'pending')
          .where('conditions.due_date', '>', today) // Start from tomorrow
          .where('conditions.due_date', '<=', sevenDaysLater)
          .count('* as total'),
      ])

      return response.ok({
        success: true,
        data: {
          totalTransactions: Number(totalTransactions[0].$extras.total),
          activeTransactions: Number(activeTransactions[0].$extras.total),
          completedTransactions: Number(completedTransactions[0].$extras.total),
          overdueConditions: Number(overdueConditions[0].$extras.total),
          dueSoonConditions: Number(dueSoonConditions[0].$extras.total),
        },
      })
    } catch (error) {
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
