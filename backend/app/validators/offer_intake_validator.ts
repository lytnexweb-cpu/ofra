import vine from '@vinejs/vine'

export const offerIntakeValidator = vine.compile(
  vine.object({
    fullName: vine.string().trim().minLength(2).maxLength(200),
    email: vine.string().trim().email(),
    phone: vine.string().trim().maxLength(30).optional(),
    price: vine.number().min(1),
    message: vine.string().trim().maxLength(2000).optional(),
    // Phase B — enriched fields
    deposit: vine.number().min(0).optional(),
    depositDeadline: vine.string().trim().optional(),
    closingDate: vine.string().trim().optional(),
    financingAmount: vine.number().min(0).optional(),
    inspectionRequired: vine.boolean().optional(),
    inspectionDelay: vine.string().trim().optional(),
    inclusions: vine.string().trim().maxLength(5000).optional(),
  })
)

// Phase C — respond to a counter-offer
export const offerIntakeRespondValidator = vine.compile(
  vine.object({
    price: vine.number().min(1),
    message: vine.string().trim().maxLength(2000).optional(),
    deposit: vine.number().min(0).optional(),
    depositDeadline: vine.string().trim().optional(),
    closingDate: vine.string().trim().optional(),
    financingAmount: vine.number().min(0).optional(),
    inspectionRequired: vine.boolean().optional(),
    inspectionDelay: vine.string().trim().optional(),
    inclusions: vine.string().trim().maxLength(5000).optional(),
  })
)
