import WorkflowStepAutomation from '#models/workflow_step_automation'

let automationCounter = 0

export async function createWorkflowStepAutomation(
  stepId: number,
  overrides: Partial<{
    trigger: 'on_enter' | 'on_exit' | 'on_condition_complete'
    actionType: string
    delayDays: number
    templateRef: string | null
    config: Record<string, any>
  }> = {}
): Promise<WorkflowStepAutomation> {
  automationCounter++
  return WorkflowStepAutomation.create({
    stepId,
    trigger: overrides.trigger ?? 'on_enter',
    actionType: overrides.actionType ?? 'send_email',
    delayDays: overrides.delayDays ?? 0,
    templateRef: overrides.templateRef ?? `template_${automationCounter}`,
    config: overrides.config ?? {},
  })
}
