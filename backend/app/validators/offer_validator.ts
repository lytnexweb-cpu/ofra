import vine from '@vinejs/vine'

export const createOfferValidator = vine.compile(
  vine.object({
    price: vine.number().positive(),
    deposit: vine.number().min(0).optional(),
    financingAmount: vine.number().min(0).optional(),
    expiryAt: vine.string().optional(),
    notes: vine.string().trim().optional(),
    direction: vine.enum(['buyer_to_seller', 'seller_to_buyer']).optional(),
  })
)

export const addRevisionValidator = vine.compile(
  vine.object({
    price: vine.number().positive(),
    deposit: vine.number().min(0).optional(),
    financingAmount: vine.number().min(0).optional(),
    expiryAt: vine.string().optional(),
    notes: vine.string().trim().optional(),
    direction: vine.enum(['buyer_to_seller', 'seller_to_buyer']),
  })
)
