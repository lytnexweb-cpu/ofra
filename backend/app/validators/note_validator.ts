import vine from '@vinejs/vine'

export const createNoteValidator = vine.compile(
  vine.object({
    content: vine.string().trim().minLength(1),
  })
)
