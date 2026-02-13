import vine from '@vinejs/vine'

export const changePlanValidator = vine.compile(
  vine.object({
    planSlug: vine.string().trim(),
    billingCycle: vine.enum(['monthly', 'annual']).optional(),
  })
)
