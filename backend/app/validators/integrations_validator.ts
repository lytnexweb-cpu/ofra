import vine from '@vinejs/vine'

export const fubConnectValidator = vine.compile(
  vine.object({
    apiKey: vine.string().trim().minLength(10),
  })
)

export const fubImportValidator = vine.compile(
  vine.object({
    apiKey: vine.string().trim().minLength(10),
    selectedContactIds: vine.array(vine.number()).optional(),
  })
)
