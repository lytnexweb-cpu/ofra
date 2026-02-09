import vine from '@vinejs/vine'

export const updatePlanValidator = vine.compile(
  vine.object({
    name: vine.string().trim().maxLength(100).optional(),
    monthlyPrice: vine.number().min(0).optional(),
    annualPrice: vine.number().min(0).optional(),
    maxTransactions: vine.number().positive().optional().nullable(),
    maxStorageGb: vine.number().min(0).optional(),
    historyMonths: vine.number().positive().optional().nullable(),
    isActive: vine.boolean().optional(),
    displayOrder: vine.number().min(0).optional(),
    reason: vine.string().trim().minLength(3).maxLength(500),
  })
)
