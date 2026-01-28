import vine from '@vinejs/vine'

export const loginValidator = vine.compile(
  vine.object({
    email: vine.string().email().trim(),
    password: vine.string().minLength(8).maxLength(128),
  })
)

export const registerValidator = vine.compile(
  vine.object({
    email: vine.string().email().trim(),
    password: vine.string().minLength(8).maxLength(128),
    fullName: vine.string().trim().minLength(2).maxLength(255),
    phone: vine.string().trim().maxLength(50).optional(),
    agency: vine.string().trim().maxLength(255).optional(),
    licenseNumber: vine.string().trim().maxLength(100).optional(),
    preferredLanguage: vine.enum(['en', 'fr']).optional(),
  })
)

export const forgotPasswordValidator = vine.compile(
  vine.object({
    email: vine.string().email().trim(),
  })
)

export const resetPasswordValidator = vine.compile(
  vine.object({
    token: vine.string().trim(),
    password: vine.string().minLength(8).maxLength(128),
  })
)
