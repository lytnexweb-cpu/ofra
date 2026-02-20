import vine from '@vinejs/vine'
import { DateTime } from 'luxon'

export const createConditionValidator = vine.compile(
  vine.object({
    title: vine.string().trim().minLength(1),
    description: vine.string().trim().optional(),
    dueDate: vine
      .string()
      .trim()
      .transform((value) => DateTime.fromISO(value)),
    type: vine
      .enum([
        'financing',
        'deposit',
        'inspection',
        'water_test',
        'rpds_review',
        'appraisal',
        'legal',
        'documents',
        'repairs',
        'other',
      ])
      .optional(),
    priority: vine.enum(['low', 'medium', 'high']).optional(),
    transactionStepId: vine.number().positive().optional(),
    isBlocking: vine.boolean().optional(),
    level: vine.enum(['blocking', 'required', 'recommended']).optional(),
    offerId: vine.number().positive().optional(),
    documentUrl: vine.string().trim().maxLength(2048).optional(),
    documentLabel: vine.string().trim().maxLength(255).optional(),
    templateId: vine.number().positive().optional(), // Link to condition template
  })
)

export const updateConditionValidator = vine.compile(
  vine.object({
    title: vine.string().trim().minLength(1).optional(),
    description: vine.string().trim().optional(),
    dueDate: vine
      .string()
      .trim()
      .optional()
      .transform((value) => (value ? DateTime.fromISO(value) : undefined)),
    status: vine.enum(['pending', 'completed']).optional(),
    type: vine
      .enum([
        'financing',
        'deposit',
        'inspection',
        'water_test',
        'rpds_review',
        'appraisal',
        'legal',
        'documents',
        'repairs',
        'other',
      ])
      .optional(),
    priority: vine.enum(['low', 'medium', 'high']).optional(),
    transactionStepId: vine.number().positive().optional(),
    isBlocking: vine.boolean().optional(),
    level: vine.enum(['blocking', 'required', 'recommended']).optional(),
    offerId: vine.number().positive().optional(),
    documentUrl: vine.string().trim().maxLength(2048).optional(),
    documentLabel: vine.string().trim().maxLength(255).optional(),
    assignedProId: vine.number().positive().nullable().optional(),
  })
)
