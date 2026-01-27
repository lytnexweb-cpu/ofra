import { test } from '@japa/runner'
import { cuid } from '@adonisjs/core/helpers'
import {
  truncateAll,
  createUser,
  createWorkflowTemplate,
  createWorkflowStep,
} from '#tests/helpers/index'
import WorkflowStepCondition from '#models/workflow_step_condition'

function withAuth(request: any, userId: number) {
  const sessionId = cuid()
  return request
    .withCookie('adonis-session', sessionId)
    .withEncryptedCookie(sessionId, { auth_web: userId })
}

test.group('Workflow Templates', (group) => {
  group.each.setup(async () => {
    await truncateAll()
  })

  test('GET /api/workflow-templates lists templates', async ({ client }) => {
    const user = await createUser({ email: 'tpl@test.com' })
    await createWorkflowTemplate({ slug: 'list-tpl-1', name: 'Template 1' })
    await createWorkflowTemplate({ slug: 'list-tpl-2', name: 'Template 2', transactionType: 'sale' })

    const response = await withAuth(client.get('/api/workflow-templates'), user.id)

    response.assertStatus(200)
    response.assertBodyContains({ success: true })
  })

  test('GET /api/workflow-templates filters by province and type', async ({ client }) => {
    const user = await createUser({ email: 'tpl2@test.com' })
    await createWorkflowTemplate({ slug: 'filter-nb', provinceCode: 'NB', transactionType: 'purchase' })
    await createWorkflowTemplate({ slug: 'filter-on', provinceCode: 'ON', transactionType: 'sale' })

    const response = await withAuth(
      client.get('/api/workflow-templates?province=NB&type=purchase'),
      user.id
    )

    response.assertStatus(200)
    response.assertBodyContains({ success: true })
  })

  test('GET /api/workflow-templates/:id shows template with nested data', async ({ client }) => {
    const user = await createUser({ email: 'tpl3@test.com' })
    const template = await createWorkflowTemplate({ slug: 'show-tpl' })
    const step = await createWorkflowStep(template.id, {
      stepOrder: 1,
      name: 'Step 1',
      slug: 'show-step-1',
    })
    await WorkflowStepCondition.create({
      stepId: step.id,
      title: 'Financing',
      conditionType: 'financing',
      priority: 'high',
      isBlockingDefault: true,
      isRequired: true,
      sortOrder: 1,
    })

    const response = await withAuth(
      client.get(`/api/workflow-templates/${template.id}`),
      user.id
    )

    response.assertStatus(200)
    response.assertBodyContains({
      success: true,
      data: {
        template: {
          id: template.id,
        },
      },
    })
  })

  test('POST /api/workflow-templates creates a template', async ({ client }) => {
    const user = await createUser({ email: 'tpl4@test.com' })

    const response = await withAuth(client.post('/api/workflow-templates'), user.id).json({
      provinceCode: 'QC',
      name: 'Quebec Standard',
      slug: 'qc-standard',
      transactionType: 'purchase',
      steps: [
        {
          stepOrder: 1,
          name: 'Consultation',
          slug: 'consultation',
        },
      ],
    })

    response.assertStatus(201)
    response.assertBodyContains({
      success: true,
      data: {
        template: {
          name: 'Quebec Standard',
        },
      },
    })
  })

  test('DELETE /api/workflow-templates/:id deletes a template', async ({ client }) => {
    const user = await createUser({ email: 'tpl5@test.com' })
    const template = await createWorkflowTemplate({ slug: 'del-tpl' })

    const response = await withAuth(
      client.delete(`/api/workflow-templates/${template.id}`),
      user.id
    )

    response.assertStatus(204)
  })
})
