import WorkflowStep from '#models/workflow_step'

let stepCounter = 0

export async function createWorkflowStep(
  templateId: number,
  overrides: Partial<{
    stepOrder: number
    name: string
    slug: string
    description: string
    typicalDurationDays: number
  }> = {}
): Promise<WorkflowStep> {
  stepCounter++
  return WorkflowStep.create({
    templateId,
    stepOrder: overrides.stepOrder ?? stepCounter,
    name: overrides.name ?? `Test Step ${stepCounter}`,
    slug: overrides.slug ?? `test-step-${stepCounter}`,
    description: overrides.description ?? null,
    typicalDurationDays: overrides.typicalDurationDays ?? null,
  })
}
