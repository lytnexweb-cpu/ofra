import vine from '@vinejs/vine'

export const createPartyValidator = vine.compile(
  vine.object({
    role: vine.enum(['buyer', 'seller', 'lawyer', 'notary', 'agent', 'broker', 'other']),
    fullName: vine.string().trim().minLength(1).maxLength(255),
    email: vine.string().trim().maxLength(255).optional(),
    phone: vine.string().trim().maxLength(50).optional(),
    address: vine.string().trim().maxLength(500).optional(),
    company: vine.string().trim().maxLength(255).optional(),
    isPrimary: vine.boolean().optional(),
  })
)

export const updatePartyValidator = vine.compile(
  vine.object({
    role: vine.enum(['buyer', 'seller', 'lawyer', 'notary', 'agent', 'broker', 'other']).optional(),
    fullName: vine.string().trim().minLength(1).maxLength(255).optional(),
    email: vine.string().trim().maxLength(255).optional(),
    phone: vine.string().trim().maxLength(50).optional(),
    address: vine.string().trim().maxLength(500).optional(),
    company: vine.string().trim().maxLength(255).optional(),
    isPrimary: vine.boolean().optional(),
  })
)
