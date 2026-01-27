import User from '#models/user'
import Client from '#models/client'
import Transaction from '#models/transaction'
import Condition from '#models/condition'
import Note from '#models/note'
import ActivityFeed from '#models/activity_feed'
import TransactionStep from '#models/transaction_step'
import WorkflowStepCondition from '#models/workflow_step_condition'
import WorkflowStepAutomation from '#models/workflow_step_automation'
import WorkflowStep from '#models/workflow_step'
import WorkflowTemplate from '#models/workflow_template'
import Organization from '#models/organization'

/**
 * Truncate all tables in correct order (respecting FK constraints)
 */
export async function truncateAll() {
  await ActivityFeed.query().delete()
  await Note.query().delete()
  await Condition.query().delete()
  // Remove FK reference before deleting transaction steps
  await Transaction.query().update({ currentStepId: null })
  await TransactionStep.query().delete()
  await Transaction.query().delete()
  await Client.query().delete()
  await WorkflowStepCondition.query().delete()
  await WorkflowStepAutomation.query().delete()
  await WorkflowStep.query().delete()
  await WorkflowTemplate.query().delete()
  await User.query().delete()
  await Organization.query().delete()
}
