import vine from '@vinejs/vine'

export const createClientValidator = vine.compile(
  vine.object({
    firstName: vine.string().trim().minLength(1),
    lastName: vine.string().trim().minLength(1),
    email: vine.string().email().trim().optional(),
    phone: vine.string().trim().optional(),
    notes: vine.string().trim().optional(),
    addressLine1: vine.string().trim().optional(),
    addressLine2: vine.string().trim().optional(),
    city: vine.string().trim().optional(),
    provinceState: vine.string().trim().optional(),
    postalCode: vine.string().trim().optional(),
    homePhone: vine.string().trim().optional(),
    workPhone: vine.string().trim().optional(),
    cellPhone: vine.string().trim().optional(),
    clientType: vine.enum(['buyer', 'seller', 'both']).optional(),
    // Buyer profile
    isPreApproved: vine.boolean().optional(),
    preApprovalAmount: vine.number().positive().optional(),
    preApprovalLender: vine.string().trim().optional(),
    financingBudget: vine.number().positive().optional(),
    // Seller profile
    motivationLevel: vine.enum(['low', 'medium', 'high', 'urgent']).optional(),
    floorPrice: vine.number().positive().optional(),
    targetCloseDate: vine.string().trim().optional(),
  })
)

export const updateClientValidator = vine.compile(
  vine.object({
    firstName: vine.string().trim().minLength(1).optional(),
    lastName: vine.string().trim().minLength(1).optional(),
    email: vine.string().email().trim().optional(),
    phone: vine.string().trim().optional(),
    notes: vine.string().trim().optional(),
    addressLine1: vine.string().trim().optional(),
    addressLine2: vine.string().trim().optional(),
    city: vine.string().trim().optional(),
    provinceState: vine.string().trim().optional(),
    postalCode: vine.string().trim().optional(),
    homePhone: vine.string().trim().optional(),
    workPhone: vine.string().trim().optional(),
    cellPhone: vine.string().trim().optional(),
    clientType: vine.enum(['buyer', 'seller', 'both']).optional(),
    // Buyer profile
    isPreApproved: vine.boolean().optional(),
    preApprovalAmount: vine.number().positive().optional(),
    preApprovalLender: vine.string().trim().optional(),
    financingBudget: vine.number().positive().optional(),
    // Seller profile
    motivationLevel: vine.enum(['low', 'medium', 'high', 'urgent']).optional(),
    floorPrice: vine.number().positive().optional(),
    targetCloseDate: vine.string().trim().optional(),
  })
)
