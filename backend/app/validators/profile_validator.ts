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

/**
 * D40: Validator for onboarding profile
 */
export const onboardingValidator = vine.compile(
  vine.object({
    // Language preference (persists to account)
    language: vine.enum(['fr', 'en']),

    // Q1: Practice type
    practiceType: vine.enum(['solo', 'small_team', 'agency']),

    // Q2: Property contexts (multi-select)
    propertyContexts: vine
      .array(vine.enum(['urban_suburban', 'rural', 'condo', 'land']))
      .minLength(1),

    // Q3: Annual volume
    annualVolume: vine.enum(['beginner', 'established', 'high']),

    // Q4: Preference for auto conditions (D39)
    preferAutoConditions: vine.boolean(),

    // Optional: track if user skipped (partial completion)
    skipped: vine.boolean().optional(),
  })
)
