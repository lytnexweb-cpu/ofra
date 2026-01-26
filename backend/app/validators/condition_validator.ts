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
    stage: vine
      .enum([
        'active',
        'offer',
        'conditional',
        'firm',
        'closing',
        'completed',
        'cancelled',
      ])
      .optional(),
    isBlocking: vine.boolean().optional(),
    offerId: vine.number().positive().optional(),
    documentUrl: vine.string().trim().maxLength(2048).optional(),
    documentLabel: vine.string().trim().maxLength(255).optional(),
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
    stage: vine
      .enum([
        'active',
        'offer',
        'conditional',
        'firm',
        'closing',
        'completed',
        'cancelled',
      ])
      .optional(),
    isBlocking: vine.boolean().optional(),
    offerId: vine.number().positive().optional(),
    documentUrl: vine.string().trim().maxLength(2048).optional(),
    documentLabel: vine.string().trim().maxLength(255).optional(),
  })
)
