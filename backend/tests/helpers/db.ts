import User from '#models/user'
import Client from '#models/client'
import Transaction from '#models/transaction'
import Condition from '#models/condition'
import Note from '#models/note'
import TransactionStatusHistory from '#models/transaction_status_history'
import ReminderLog from '#models/reminder_log'

/**
 * Truncate all tables in correct order (respecting FK constraints)
 */
export async function truncateAll() {
  await ReminderLog.query().delete()
  await Note.query().delete()
  await Condition.query().delete()
  await TransactionStatusHistory.query().delete()
  await Transaction.query().delete()
  await Client.query().delete()
  await User.query().delete()
}
