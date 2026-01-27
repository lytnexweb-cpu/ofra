import type { HttpContext } from '@adonisjs/core/http'
import WorkflowTemplate from '#models/workflow_template'
import WorkflowStep from '#models/workflow_step'
import WorkflowStepCondition from '#models/workflow_step_condition'
import WorkflowStepAutomation from '#models/workflow_step_automation'
import {
  createWorkflowTemplateValidator,
  updateWorkflowTemplateValidator,
} from '#validators/workflow_template_validator'

export default class WorkflowTemplatesController {
  async index({ request, response }: HttpContext) {
    try {
      const { province, type, active } = request.qs()
      const query = WorkflowTemplate.query().preload('steps', (q) =>
        q.orderBy('step_order', 'asc')
      )

      if (province) query.where('provinceCode', province)
      if (type) query.where('transactionType', type)
      if (active !== undefined) query.where('isActive', active === 'true')

      const templates = await query.orderBy('name', 'asc')

      return response.ok({
        success: true,
        data: { templates },
      })
    } catch (error) {
      return response.internalServerError({
        success: false,
        error: { message: 'Failed to retrieve templates', code: 'E_INTERNAL_ERROR' },
      })
    }
  }

  async show({ params, response }: HttpContext) {
    try {
      const template = await WorkflowTemplate.query()
        .where('id', params.id)
        .preload('steps', (q) => {
          q.orderBy('step_order', 'asc')
            .preload('conditions', (cq) => cq.orderBy('sort_order', 'asc'))
            .preload('automations')
        })
        .firstOrFail()

      return response.ok({
        success: true,
        data: { template },
      })
    } catch (error) {
      return response.notFound({
        success: false,
        error: { message: 'Template not found', code: 'E_NOT_FOUND' },
      })
    }
  }

  async store({ request, response, auth }: HttpContext) {
    try {
      const payload = await request.validateUsing(createWorkflowTemplateValidator)

      const template = await WorkflowTemplate.create({
        provinceCode: payload.provinceCode,
        name: payload.name,
        slug: payload.slug,
        description: payload.description ?? null,
        transactionType: payload.transactionType,
        isDefault: payload.isDefault ?? false,
        isActive: payload.isActive ?? true,
        createdByUserId: auth.user!.id,
      })

      // Create steps with nested conditions and automations
      if (payload.steps) {
        for (const stepData of payload.steps) {
          const step = await WorkflowStep.create({
            templateId: template.id,
            stepOrder: stepData.stepOrder,
            name: stepData.name,
            slug: stepData.slug,
            description: stepData.description ?? null,
            typicalDurationDays: stepData.typicalDurationDays ?? null,
          })

          if (stepData.conditions) {
            for (const condData of stepData.conditions) {
              await WorkflowStepCondition.create({
                stepId: step.id,
                title: condData.title,
                description: condData.description ?? null,
                conditionType: condData.conditionType,
                priority: condData.priority ?? 'medium',
                isBlockingDefault: condData.isBlockingDefault ?? true,
                isRequired: condData.isRequired ?? true,
                dueDateOffsetDays: condData.dueDateOffsetDays ?? null,
                sortOrder: condData.sortOrder ?? 0,
              })
            }
          }

          if (stepData.automations) {
            for (const autoData of stepData.automations) {
              await WorkflowStepAutomation.create({
                stepId: step.id,
                trigger: autoData.trigger,
                actionType: autoData.actionType,
                delayDays: autoData.delayDays ?? 0,
                templateRef: autoData.templateRef ?? null,
                config: (autoData.config as Record<string, any>) ?? {},
              })
            }
          }
        }
      }

      // Reload with nested data
      await template.load('steps', (q) => {
        q.orderBy('step_order', 'asc')
          .preload('conditions', (cq) => cq.orderBy('sort_order', 'asc'))
          .preload('automations')
      })

      return response.created({
        success: true,
        data: { template },
      })
    } catch (error) {
      if (error.messages) {
        return response.unprocessableEntity({
          success: false,
          error: {
            message: 'Validation failed',
            code: 'E_VALIDATION_FAILED',
            details: error.messages,
          },
        })
      }
      return response.internalServerError({
        success: false,
        error: { message: 'Failed to create template', code: 'E_INTERNAL_ERROR' },
      })
    }
  }

  async update({ params, request, response }: HttpContext) {
    try {
      const template = await WorkflowTemplate.findOrFail(params.id)
      const payload = await request.validateUsing(updateWorkflowTemplateValidator)

      template.merge(payload)
      await template.save()

      await template.load('steps', (q) => q.orderBy('step_order', 'asc'))

      return response.ok({
        success: true,
        data: { template },
      })
    } catch (error) {
      if (error.messages) {
        return response.unprocessableEntity({
          success: false,
          error: {
            message: 'Validation failed',
            code: 'E_VALIDATION_FAILED',
            details: error.messages,
          },
        })
      }
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.notFound({
          success: false,
          error: { message: 'Template not found', code: 'E_NOT_FOUND' },
        })
      }
      return response.internalServerError({
        success: false,
        error: { message: 'Failed to update template', code: 'E_INTERNAL_ERROR' },
      })
    }
  }

  async destroy({ params, response }: HttpContext) {
    try {
      const template = await WorkflowTemplate.findOrFail(params.id)
      await template.delete()
      return response.noContent()
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.notFound({
          success: false,
          error: { message: 'Template not found', code: 'E_NOT_FOUND' },
        })
      }
      return response.internalServerError({
        success: false,
        error: { message: 'Failed to delete template', code: 'E_INTERNAL_ERROR' },
      })
    }
  }
}
