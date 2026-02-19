import vine from '@vinejs/vine'

export const updateSiteSettingsValidator = vine.compile(
  vine.object({
    site_mode: vine.enum(['live', 'coming_soon', 'maintenance']).optional(),
    access_code: vine.string().trim().maxLength(100).optional(),
    custom_message: vine.string().trim().maxLength(1000).optional(),
    launch_date: vine.string().trim().optional().nullable(),
    pitch_points: vine.string().trim().optional(),
    show_founder_count: vine.enum(['true', 'false']).optional(),
  })
)
