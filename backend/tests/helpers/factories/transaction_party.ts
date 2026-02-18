import TransactionParty from '#models/transaction_party'
import type { PartyRole } from '#models/transaction_party'

let partyCounter = 0

export async function createTransactionParty(
  transactionId: number,
  overrides: Partial<{
    role: PartyRole
    fullName: string
    email: string | null
    phone: string | null
    isPrimary: boolean
  }> = {}
): Promise<TransactionParty> {
  partyCounter++
  return TransactionParty.create({
    transactionId,
    role: overrides.role ?? 'buyer',
    fullName: overrides.fullName ?? `Party ${partyCounter}`,
    email: overrides.email ?? `party${partyCounter}@test.com`,
    phone: overrides.phone ?? null,
    isPrimary: overrides.isPrimary ?? true,
  })
}
