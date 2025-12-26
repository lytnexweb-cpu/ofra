import vine from '@vinejs/vine'

/**
 * Validator for changing password
 */
export const changePasswordValidator = vine.compile(
  vine.object({
    currentPassword: vine.string().minLength(6),
    newPassword: vine
      .string()
      .minLength(8)
      .confirmed({ confirmationField: 'newPasswordConfirmation' }),
  })
)

/**
 * Validator for updating profile (email + password confirmation)
 */
export const updateProfileValidator = vine.compile(
  vine.object({
    email: vine.string().email().normalizeEmail(),
    currentPassword: vine.string().minLength(6), // Required to confirm identity
  })
)

/**
 * Validator for updating profile information (no password required for less sensitive fields)
 */
export const updateProfileInfoValidator = vine.compile(
  vine.object({
    fullName: vine.string().trim().optional(),
    phone: vine.string().trim().optional(),
    agency: vine.string().trim().optional(),
    licenseNumber: vine.string().trim().optional(),
    profilePhoto: vine.string().optional(), // Base64 or URL
    emailSignature: vine.string().optional(),
    language: vine.enum(['fr', 'en']).optional(),
    dateFormat: vine.enum(['DD/MM/YYYY', 'MM/DD/YYYY']).optional(),
    timezone: vine.string().optional(),
  })
)
