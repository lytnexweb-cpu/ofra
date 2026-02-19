import vine from '@vinejs/vine'

export const subscribeValidator = vine.compile(
  vine.object({
    planSlug: vine.string().trim(),
    billingCycle: vine.enum(['monthly', 'annual']).optional(),
  })
)

export const changePlanStripeValidator = vine.compile(
  vine.object({
    planSlug: vine.string().trim(),
    billingCycle: vine.enum(['monthly', 'annual']).optional(),
  })
)

export const updatePaymentMethodValidator = vine.compile(
  vine.object({
    paymentMethodId: vine.string().trim(),
  })
)
