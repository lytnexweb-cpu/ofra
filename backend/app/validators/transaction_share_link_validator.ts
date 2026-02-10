import vine from '@vinejs/vine'

export const createShareLinkValidator = vine.compile(
  vine.object({
    role: vine.enum(['viewer', 'editor']).optional(),
    expiresAt: vine.string().trim().optional(),
    password: vine.string().trim().minLength(4).maxLength(100).optional(),
  })
)

export const updateShareLinkValidator = vine.compile(
  vine.object({
    role: vine.enum(['viewer', 'editor']).optional(),
    expiresAt: vine.string().trim().optional().nullable(),
    password: vine.string().trim().minLength(4).maxLength(100).optional().nullable(),
    isActive: vine.boolean().optional(),
  })
)
