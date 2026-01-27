import Transaction from '#models/transaction'

export async function createTransaction(
  ownerUserId: number,
  clientId: number,
  overrides: Partial<{
    type: 'purchase' | 'sale'
    workflowTemplateId: number
    currentStepId: number
    organizationId: number
    salePrice: number
  }> = {}
): Promise<Transaction> {
  return Transaction.create({
    ownerUserId,
    clientId,
    type: overrides.type ?? 'purchase',
    workflowTemplateId: overrides.workflowTemplateId ?? null,
    currentStepId: overrides.currentStepId ?? null,
    organizationId: overrides.organizationId ?? null,
    salePrice: overrides.salePrice ?? 500000,
  })
}
