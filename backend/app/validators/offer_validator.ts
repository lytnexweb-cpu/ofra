import vine from '@vinejs/vine'

export const createOfferValidator = vine.compile(
  vine.object({
    price: vine.number().positive(),
    deposit: vine.number().min(0).optional(),
    depositDeadline: vine.string().trim().optional(),
    financingAmount: vine.number().min(0).optional(),
    expiryAt: vine.string().optional(),
    closingDate: vine.string().trim().optional(),
    inspectionRequired: vine.boolean().optional(),
    inspectionDelay: vine.string().trim().maxLength(50).optional(),
    inclusions: vine.string().trim().optional(),
    message: vine.string().trim().optional(),
    notes: vine.string().trim().optional(),
    direction: vine.enum(['buyer_to_seller', 'seller_to_buyer']).optional(),
    conditionIds: vine.array(vine.number()).optional(),
    fromPartyId: vine.number().positive().optional(),
    toPartyId: vine.number().positive().optional(),
    buyerPartyId: vine.number().positive().optional(),
    sellerPartyId: vine.number().positive().optional(),
  })
)

export const addRevisionValidator = vine.compile(
  vine.object({
    price: vine.number().positive(),
    deposit: vine.number().min(0).optional(),
    depositDeadline: vine.string().trim().optional(),
    financingAmount: vine.number().min(0).optional(),
    expiryAt: vine.string().optional(),
    closingDate: vine.string().trim().optional(),
    inspectionRequired: vine.boolean().optional(),
    inspectionDelay: vine.string().trim().maxLength(50).optional(),
    inclusions: vine.string().trim().optional(),
    message: vine.string().trim().optional(),
    notes: vine.string().trim().optional(),
    direction: vine.enum(['buyer_to_seller', 'seller_to_buyer']),
    conditionIds: vine.array(vine.number()).optional(),
    fromPartyId: vine.number().positive().optional(),
    toPartyId: vine.number().positive().optional(),
  })
)
