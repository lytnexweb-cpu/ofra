import vine from '@vinejs/vine'

export const inviteMemberValidator = vine.compile(
  vine.object({
    email: vine.string().trim().email().maxLength(255),
    role: vine.enum(['viewer', 'editor', 'admin']),
    message: vine.string().trim().maxLength(1000).optional(),
  })
)

export const updateMemberRoleValidator = vine.compile(
  vine.object({
    role: vine.enum(['viewer', 'editor', 'admin']),
  })
)
