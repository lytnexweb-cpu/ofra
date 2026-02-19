import vine from '@vinejs/vine'

export const createPromoCodeValidator = vine.compile(
  vine.object({
    code: vine.string().trim().minLength(3).maxLength(50),
    type: vine.enum(['percent', 'fixed', 'free_months']),
    value: vine.number().min(0),
    maxUses: vine.number().positive().optional().nullable(),
    validFrom: vine.string().trim().optional().nullable(),
    validUntil: vine.string().trim().optional().nullable(),
    eligiblePlans: vine.string().trim().optional().nullable(), // JSON string of plan IDs
    stripeCouponId: vine.string().trim().maxLength(255).optional().nullable(),
  })
)

export const updatePromoCodeValidator = vine.compile(
  vine.object({
    code: vine.string().trim().minLength(3).maxLength(50).optional(),
    type: vine.enum(['percent', 'fixed', 'free_months']).optional(),
    value: vine.number().min(0).optional(),
    maxUses: vine.number().positive().optional().nullable(),
    validFrom: vine.string().trim().optional().nullable(),
    validUntil: vine.string().trim().optional().nullable(),
    eligiblePlans: vine.string().trim().optional().nullable(),
    active: vine.boolean().optional(),
    stripeCouponId: vine.string().trim().maxLength(255).optional().nullable(),
  })
)

export const validatePromoCodeValidator = vine.compile(
  vine.object({
    code: vine.string().trim().minLength(1).maxLength(50),
  })
)
