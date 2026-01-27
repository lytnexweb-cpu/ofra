import vine from '@vinejs/vine'

export const createWorkflowTemplateValidator = vine.compile(
  vine.object({
    provinceCode: vine.string().trim().maxLength(2),
    name: vine.string().trim().minLength(1),
    slug: vine.string().trim().minLength(1),
    description: vine.string().trim().optional(),
    transactionType: vine.enum(['purchase', 'sale']),
    isDefault: vine.boolean().optional(),
    isActive: vine.boolean().optional(),
    steps: vine
      .array(
        vine.object({
          stepOrder: vine.number().positive(),
          name: vine.string().trim().minLength(1),
          slug: vine.string().trim().minLength(1),
          description: vine.string().trim().optional(),
          typicalDurationDays: vine.number().min(0).optional(),
          conditions: vine
            .array(
              vine.object({
                title: vine.string().trim().minLength(1),
                description: vine.string().trim().optional(),
                conditionType: vine.string().trim(),
                priority: vine.enum(['low', 'medium', 'high']).optional(),
                isBlockingDefault: vine.boolean().optional(),
                isRequired: vine.boolean().optional(),
                dueDateOffsetDays: vine.number().min(0).optional(),
                sortOrder: vine.number().min(0).optional(),
              })
            )
            .optional(),
          automations: vine
            .array(
              vine.object({
                trigger: vine.enum(['on_enter', 'on_exit', 'on_condition_complete']),
                actionType: vine.string().trim(),
                delayDays: vine.number().min(0).optional(),
                templateRef: vine.string().trim().optional(),
                config: vine.any().optional(),
              })
            )
            .optional(),
        })
      )
      .optional(),
  })
)

export const updateWorkflowTemplateValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(1).optional(),
    description: vine.string().trim().optional(),
    isDefault: vine.boolean().optional(),
    isActive: vine.boolean().optional(),
  })
)
