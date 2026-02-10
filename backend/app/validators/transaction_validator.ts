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
    address: vine.string().trim().maxLength(500).optional(),
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
    closingDate: vine.string().trim().optional(),
    offerExpiryDate: vine.string().trim().optional(),
    inspectionDeadline: vine.string().trim().optional(),
    financingDeadline: vine.string().trim().optional(),
    tags: vine.array(vine.string().trim()).optional(),
    language: vine.string().trim().maxLength(5).optional(),
    cancellationCategory: vine.enum([
      'financing_refused', 'inspection_failed', 'buyer_withdrawal',
      'seller_withdrawal', 'deadline_expired', 'mutual_agreement', 'other',
    ]).optional(),
  })
)
