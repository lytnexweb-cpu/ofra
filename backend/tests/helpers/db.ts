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
import Notification from '#models/notification'
import TransactionShareLink from '#models/transaction_share_link'
import TransactionParty from '#models/transaction_party'
import OfferRevision from '#models/offer_revision'
import Offer from '#models/offer'
import Property from '#models/property'
import FintracRecord from '#models/fintrac_record'
import ConditionEvent from '#models/condition_event'
import AdminNote from '#models/admin_note'
import AdminTask from '#models/admin_task'
import TransactionDocument from '#models/transaction_document'
import TransactionMember from '#models/transaction_member'

/**
 * Truncate all tables in correct order (respecting FK constraints)
 */
export async function truncateAll() {
  await AdminNote.query().delete()
  await AdminTask.query().delete()
  await Notification.query().delete()
  await ActivityFeed.query().delete()
  await Note.query().delete()
  await TransactionDocument.query().delete()
  await TransactionMember.query().delete()
  await TransactionShareLink.query().delete()
  await OfferRevision.query().delete()
  await Offer.query().delete()
  await FintracRecord.query().delete()
  await ConditionEvent.query().delete()
  await TransactionParty.query().delete()
  // condition_evidence cascades from conditions (ON DELETE CASCADE)
  await Condition.query().delete()
  // Remove FK reference before deleting transaction steps
  await Transaction.query().update({ currentStepId: null })
  await TransactionStep.query().delete()
  await Property.query().delete()
  await Transaction.query().delete()
  await Client.query().delete()
  await WorkflowStepCondition.query().delete()
  await WorkflowStepAutomation.query().delete()
  await WorkflowStep.query().delete()
  await WorkflowTemplate.query().delete()
  await User.query().delete()
  await Organization.query().delete()
}
