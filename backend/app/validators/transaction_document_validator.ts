import vine from '@vinejs/vine'

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/msword', // .doc
  'text/plain',
] as const

export const createDocumentValidator = vine.compile(
  vine.object({
    conditionId: vine.number().positive().optional(),
    category: vine.enum(['offer', 'inspection', 'financing', 'identity', 'legal', 'other']),
    name: vine.string().trim().minLength(1).maxLength(255),
    fileUrl: vine.string().trim().maxLength(2048).optional(),
    fileSize: vine.number().min(0).max(100 * 1024 * 1024).optional(), // 100MB max
    mimeType: vine.enum(ALLOWED_MIME_TYPES).optional(),
    status: vine.enum(['missing', 'uploaded', 'validated', 'rejected']).optional(),
    tags: vine.array(vine.string().trim()).optional(),
  })
)

export const updateDocumentValidator = vine.compile(
  vine.object({
    conditionId: vine.number().positive().optional(),
    category: vine.enum(['offer', 'inspection', 'financing', 'identity', 'legal', 'other']).optional(),
    name: vine.string().trim().minLength(1).maxLength(255).optional(),
    fileUrl: vine.string().trim().maxLength(2048).optional(),
    fileSize: vine.number().min(0).optional(),
    mimeType: vine.enum(ALLOWED_MIME_TYPES).optional(),
    tags: vine.array(vine.string().trim()).optional(),
  })
)

export const rejectDocumentValidator = vine.compile(
  vine.object({
    reason: vine.string().trim().minLength(1),
  })
)
