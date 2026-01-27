import { BaseSeeder } from '@adonisjs/lucid/seeders'
import WorkflowTemplate from '#models/workflow_template'
import WorkflowStep from '#models/workflow_step'
import WorkflowStepCondition from '#models/workflow_step_condition'
import WorkflowStepAutomation from '#models/workflow_step_automation'

const NB_STEPS = [
  { order: 1, name: 'Buyer/Seller Consultation', slug: 'consultation', duration: null },
  { order: 2, name: 'Offer Submitted', slug: 'offer-submitted', duration: 3 },
  { order: 3, name: 'Offer Accepted', slug: 'offer-accepted', duration: 1 },
  { order: 4, name: 'Conditional Period', slug: 'conditional-period', duration: 14 },
  { order: 5, name: 'Firm Pending', slug: 'firm-pending', duration: 7 },
  { order: 6, name: 'Pre-Closing Tasks', slug: 'pre-closing', duration: 14 },
  { order: 7, name: 'Closing Day / Key Delivery', slug: 'closing-day', duration: 1 },
  { order: 8, name: 'Post-Closing Follow-Up', slug: 'post-closing', duration: 30 },
]

const CONDITIONAL_CONDITIONS = [
  { title: 'Financing', type: 'financing', offsetDays: 14, priority: 'high' as const, sort: 1 },
  { title: 'Deposit', type: 'deposit', offsetDays: 3, priority: 'high' as const, sort: 2 },
  { title: 'Inspection', type: 'inspection', offsetDays: 10, priority: 'high' as const, sort: 3 },
  { title: 'Water Test', type: 'water_test', offsetDays: 10, priority: 'high' as const, sort: 4 },
  {
    title: 'RPDS Review',
    type: 'rpds_review',
    offsetDays: 7,
    priority: 'high' as const,
    sort: 5,
  },
]

export default class NbWorkflowTemplateSeeder extends BaseSeeder {
  async run() {
    for (const txType of ['purchase', 'sale'] as const) {
      const label = txType === 'purchase' ? 'NB Purchase' : 'NB Sale'
      const slug = txType === 'purchase' ? 'nb-purchase' : 'nb-sale'

      const template = await WorkflowTemplate.firstOrCreate(
        { provinceCode: 'NB', slug },
        {
          provinceCode: 'NB',
          name: label,
          slug,
          description: `Standard New Brunswick ${txType} workflow`,
          transactionType: txType,
          isDefault: true,
          isActive: true,
          createdByUserId: null,
          organizationId: null,
        }
      )

      for (const stepDef of NB_STEPS) {
        const step = await WorkflowStep.firstOrCreate(
          { templateId: template.id, stepOrder: stepDef.order },
          {
            templateId: template.id,
            stepOrder: stepDef.order,
            name: stepDef.name,
            slug: stepDef.slug,
            description: null,
            typicalDurationDays: stepDef.duration,
          }
        )

        // Step 4 (Conditional Period) — default conditions
        if (stepDef.order === 4) {
          for (const cond of CONDITIONAL_CONDITIONS) {
            await WorkflowStepCondition.firstOrCreate(
              { stepId: step.id, title: cond.title },
              {
                stepId: step.id,
                title: cond.title,
                description: null,
                conditionType: cond.type,
                priority: cond.priority,
                isBlockingDefault: true,
                isRequired: true,
                dependsOnStepId: null,
                dueDateOffsetDays: cond.offsetDays,
                sortOrder: cond.sort,
              }
            )
          }
        }

        // Automations
        if (stepDef.slug === 'offer-accepted') {
          await WorkflowStepAutomation.firstOrCreate(
            { stepId: step.id, trigger: 'on_enter', actionType: 'send_email' },
            {
              stepId: step.id,
              trigger: 'on_enter',
              actionType: 'send_email',
              delayDays: 0,
              templateRef: 'offer_accepted',
              config: { subject: 'Offer Accepted — Congratulations!' },
            }
          )
        }

        if (stepDef.slug === 'firm-pending') {
          await WorkflowStepAutomation.firstOrCreate(
            { stepId: step.id, trigger: 'on_enter', actionType: 'send_email' },
            {
              stepId: step.id,
              trigger: 'on_enter',
              actionType: 'send_email',
              delayDays: 0,
              templateRef: 'firm_confirmed',
              config: { subject: 'Transaction is now Firm' },
            }
          )
          await WorkflowStepAutomation.firstOrCreate(
            { stepId: step.id, trigger: 'on_enter', actionType: 'create_task' },
            {
              stepId: step.id,
              trigger: 'on_enter',
              actionType: 'create_task',
              delayDays: 0,
              templateRef: 'fintrac_reminder',
              config: { title: 'Complete FINTRAC compliance' },
            }
          )
        }

        if (stepDef.slug === 'closing-day') {
          await WorkflowStepAutomation.firstOrCreate(
            { stepId: step.id, trigger: 'on_enter', actionType: 'create_task' },
            {
              stepId: step.id,
              trigger: 'on_enter',
              actionType: 'create_task',
              delayDays: 0,
              templateRef: 'celebration',
              config: { title: 'Celebration — keys delivered!' },
            }
          )
        }

        if (stepDef.slug === 'post-closing') {
          await WorkflowStepAutomation.firstOrCreate(
            { stepId: step.id, trigger: 'on_enter', actionType: 'create_task' },
            {
              stepId: step.id,
              trigger: 'on_enter',
              actionType: 'create_task',
              delayDays: 7,
              templateRef: 'google_review_reminder',
              config: { title: 'Ask client for Google review' },
            }
          )
        }
      }
    }
  }
}
