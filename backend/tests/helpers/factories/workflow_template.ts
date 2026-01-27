import WorkflowTemplate from '#models/workflow_template'

let templateCounter = 0

export async function createWorkflowTemplate(
  overrides: Partial<{
    provinceCode: string
    name: string
    slug: string
    description: string
    transactionType: 'purchase' | 'sale'
    isDefault: boolean
    isActive: boolean
    createdByUserId: number
    organizationId: number
  }> = {}
): Promise<WorkflowTemplate> {
  templateCounter++
  return WorkflowTemplate.create({
    provinceCode: overrides.provinceCode ?? 'NB',
    name: overrides.name ?? `Test Template ${templateCounter}`,
    slug: overrides.slug ?? `test-template-${templateCounter}`,
    description: overrides.description ?? null,
    transactionType: overrides.transactionType ?? 'purchase',
    isDefault: overrides.isDefault ?? false,
    isActive: overrides.isActive ?? true,
    createdByUserId: overrides.createdByUserId ?? null,
    organizationId: overrides.organizationId ?? null,
  })
}
