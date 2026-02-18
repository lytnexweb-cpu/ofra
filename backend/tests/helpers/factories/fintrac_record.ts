import FintracRecord from '#models/fintrac_record'
import type { FintracIdType } from '#models/fintrac_record'
import { DateTime } from 'luxon'

export async function createFintracRecord(
  transactionId: number,
  partyId: number,
  overrides: Partial<{
    dateOfBirth: DateTime
    idType: FintracIdType
    idNumber: string
    occupation: string
    sourceOfFunds: string
    verifiedAt: DateTime
    verifiedByUserId: number
    notes: string
  }> = {}
): Promise<FintracRecord> {
  return FintracRecord.create({
    transactionId,
    partyId,
    dateOfBirth: overrides.dateOfBirth ?? null,
    idType: overrides.idType ?? null,
    idNumber: overrides.idNumber ?? null,
    occupation: overrides.occupation ?? null,
    sourceOfFunds: overrides.sourceOfFunds ?? null,
    verifiedAt: overrides.verifiedAt ?? null,
    verifiedByUserId: overrides.verifiedByUserId ?? null,
    notes: overrides.notes ?? null,
  })
}
