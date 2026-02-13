import vine from '@vinejs/vine'

export const completeFintracValidator = vine.compile(
  vine.object({
    dateOfBirth: vine.date({ formats: ['YYYY-MM-DD'] }),
    idType: vine.enum([
      'drivers_license',
      'canadian_passport',
      'foreign_passport',
      'citizenship_card',
      'other_government_id',
    ]),
    idNumber: vine.string().trim().minLength(1).maxLength(100),
    occupation: vine.string().trim().minLength(1).maxLength(255).optional(),
    sourceOfFunds: vine.string().trim().maxLength(1000).optional(),
    notes: vine.string().trim().maxLength(2000).optional(),
  })
)
