import vine from '@vinejs/vine'

const transactionStatuses = [
  'consultation',
  'offer',
  'accepted',
  'conditions',
  'notary',
  'closing',
  'completed',
  'canceled',
] as const

export const createTransactionValidator = vine.compile(
  vine.object({
    clientId: vine.number().positive(),
    propertyId: vine.number().positive().optional(),
    type: vine.enum(['purchase', 'sale']),
    status: vine.enum(transactionStatuses).optional(),
    salePrice: vine.number().positive().optional(),
    notesText: vine.string().trim().optional(),
  })
)

export const updateTransactionValidator = vine.compile(
  vine.object({
    clientId: vine.number().positive().optional(),
    propertyId: vine.number().positive().optional(),
    type: vine.enum(['purchase', 'sale']).optional(),
    status: vine.enum(transactionStatuses).optional(),
    salePrice: vine.number().positive().optional(),
    notesText: vine.string().trim().optional(),
  })
)

export const updateStatusValidator = vine.compile(
  vine.object({
    status: vine.enum(transactionStatuses),
    note: vine.string().trim().optional(),
  })
)
