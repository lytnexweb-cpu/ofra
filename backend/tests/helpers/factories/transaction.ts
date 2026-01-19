import Transaction from '#models/transaction'

export type TransactionStatus =
  | 'consultation'
  | 'offer'
  | 'accepted'
  | 'conditions'
  | 'notary'
  | 'closing'
  | 'completed'
  | 'canceled'

export async function createTransaction(
  ownerUserId: number,
  clientId: number,
  overrides: Partial<{
    type: 'purchase' | 'sale'
    status: TransactionStatus
    salePrice: number
  }> = {}
): Promise<Transaction> {
  return Transaction.create({
    ownerUserId,
    clientId,
    type: overrides.type ?? 'purchase',
    status: overrides.status ?? 'consultation',
    salePrice: overrides.salePrice ?? 500000,
  })
}
