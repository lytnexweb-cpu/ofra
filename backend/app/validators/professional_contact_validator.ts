import vine from '@vinejs/vine'

export const createProfessionalContactValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(1),
    role: vine.enum(['inspector', 'notary', 'lawyer', 'mortgage_broker', 'appraiser', 'other']),
    phone: vine.string().trim().optional(),
    email: vine.string().email().trim().optional(),
    company: vine.string().trim().optional(),
    notes: vine.string().trim().optional(),
  })
)

export const updateProfessionalContactValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(1).optional(),
    role: vine.enum(['inspector', 'notary', 'lawyer', 'mortgage_broker', 'appraiser', 'other']).optional(),
    phone: vine.string().trim().optional(),
    email: vine.string().email().trim().optional(),
    company: vine.string().trim().optional(),
    notes: vine.string().trim().optional(),
  })
)
