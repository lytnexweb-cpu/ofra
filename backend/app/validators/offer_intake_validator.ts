import vine from '@vinejs/vine'

export const offerIntakeValidator = vine.compile(
  vine.object({
    fullName: vine.string().trim().minLength(2).maxLength(200),
    email: vine.string().trim().email(),
    phone: vine.string().trim().maxLength(30).optional(),
    price: vine.number().min(1),
    message: vine.string().trim().maxLength(2000).optional(),
  })
)
