import vine from '@vinejs/vine'

export const createTransactionValidator = vine.compile(
  vine.object({
    clientId: vine.number().positive(),
    propertyId: vine.number().positive().optional(),
    type: vine.enum(['purchase', 'sale']),
    workflowTemplateId: vine.number().positive(),
    salePrice: vine.number().positive().optional(),
    notesText: vine.string().trim().optional(),
    listPrice: vine.number().min(0).optional(),
    commission: vine.number().min(0).optional(),
    folderUrl: vine.string().trim().maxLength(2048).optional(),
  })
)

export const updateTransactionValidator = vine.compile(
  vine.object({
    clientId: vine.number().positive().optional(),
    propertyId: vine.number().positive().optional(),
    type: vine.enum(['purchase', 'sale']).optional(),
    salePrice: vine.number().positive().optional(),
    notesText: vine.string().trim().optional(),
    listPrice: vine.number().min(0).optional(),
    commission: vine.number().min(0).optional(),
    folderUrl: vine.string().trim().maxLength(2048).optional(),
  })
)
