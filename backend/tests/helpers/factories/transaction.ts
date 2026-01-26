import Transaction from '#models/transaction'

export type TransactionStatus =
  | 'active'
  | 'offer'
  | 'conditional'
  | 'firm'
  | 'closing'
  | 'completed'
  | 'cancelled'

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
    status: overrides.status ?? 'active',
    salePrice: overrides.salePrice ?? 500000,
  })
}
