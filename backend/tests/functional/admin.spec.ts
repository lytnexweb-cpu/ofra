import { test } from '@japa/runner'
import { cuid } from '@adonisjs/core/helpers'
import { truncateAll, createUser } from '#tests/helpers/index'
import AdminNote from '#models/admin_note'
import AdminTask from '#models/admin_task'

function withAuth(request: any, userId: number) {
  const sessionId = cuid()
  return request
    .withCookie('adonis-session', sessionId)
    .withEncryptedCookie(sessionId, { auth_web: userId })
}

test.group('Admin Controller', (group) => {
  group.each.setup(async () => {
    await truncateAll()
  })

  // --- Access control ---

  test('GET /api/admin/overview returns 401 for unauthenticated', async ({ client }) => {
    const response = await client.get('/api/admin/overview')
    response.assertStatus(401)
  })

  test('GET /api/admin/overview returns 403 for non-admin user', async ({ client }) => {
    const user = await createUser({ role: 'user' })
    const response = await withAuth(client.get('/api/admin/overview'), user.id)
    response.assertStatus(403)
  })

  test('GET /api/admin/overview returns 200 for admin', async ({ client }) => {
    const admin = await createUser({ role: 'admin' })
    const response = await withAuth(client.get('/api/admin/overview'), admin.id)
    response.assertStatus(200)
    response.assertBodyContains({ success: true })
  })

  // --- System ---

  test('GET /api/admin/system returns system health', async ({ client }) => {
    const admin = await createUser({ role: 'admin' })
    const response = await withAuth(client.get('/api/admin/system'), admin.id)
    response.assertStatus(200)
    response.assertBodyContains({
      success: true,
      data: {
        status: 'operational',
        checks: { database: 'healthy' },
      },
    })
  })

  // --- Subscribers ---

  test('GET /api/admin/subscribers returns paginated users', async ({ client, assert }) => {
    const admin = await createUser({ role: 'admin' })
    await createUser({ email: 'agent1@test.com' })
    await createUser({ email: 'agent2@test.com' })

    const response = await withAuth(client.get('/api/admin/subscribers'), admin.id)
    response.assertStatus(200)
    response.assertBodyContains({ success: true })
    const body = response.body()
    assert.isAtLeast(body.data.users.length, 3)
    assert.isDefined(body.data.meta)
  })

  test('GET /api/admin/subscribers?search filters by email', async ({ client, assert }) => {
    const admin = await createUser({ role: 'admin' })
    await createUser({ email: 'findme@example.com', fullName: 'Find Me' })
    await createUser({ email: 'other@test.com', fullName: 'Other' })

    const response = await withAuth(
      client.get('/api/admin/subscribers?search=findme'),
      admin.id
    )
    response.assertStatus(200)
    const body = response.body()
    assert.equal(body.data.users.length, 1)
    assert.equal(body.data.users[0].email, 'findme@example.com')
  })

  // --- Notes CRUD ---

  test('POST /api/admin/subscribers/:id/notes creates a note', async ({ client }) => {
    const admin = await createUser({ role: 'admin' })
    const target = await createUser({ email: 'target@test.com' })

    const response = await withAuth(
      client.post(`/api/admin/subscribers/${target.id}/notes`),
      admin.id
    ).json({ content: 'Important note about this user' })

    response.assertStatus(201)
    response.assertBodyContains({
      success: true,
      data: { note: { content: 'Important note about this user' } },
    })
  })

  test('POST /api/admin/subscribers/:id/notes returns 400 for empty content', async ({ client }) => {
    const admin = await createUser({ role: 'admin' })
    const target = await createUser({ email: 'target2@test.com' })

    const response = await withAuth(
      client.post(`/api/admin/subscribers/${target.id}/notes`),
      admin.id
    ).json({ content: '' })

    response.assertStatus(400)
  })

  test('GET /api/admin/subscribers/:id/notes returns notes', async ({ client }) => {
    const admin = await createUser({ role: 'admin' })
    const target = await createUser({ email: 'noted@test.com' })

    await AdminNote.create({
      userId: target.id,
      authorId: admin.id,
      content: 'Test note',
    })

    const response = await withAuth(
      client.get(`/api/admin/subscribers/${target.id}/notes`),
      admin.id
    )

    response.assertStatus(200)
    response.assertBodyContains({
      success: true,
      data: { notes: [{ content: 'Test note' }] },
    })
  })

  test('DELETE /api/admin/notes/:id deletes own note', async ({ client }) => {
    const admin = await createUser({ role: 'admin' })
    const target = await createUser({ email: 'delnote@test.com' })

    const note = await AdminNote.create({
      userId: target.id,
      authorId: admin.id,
      content: 'To delete',
    })

    const response = await withAuth(
      client.delete(`/api/admin/notes/${note.id}`),
      admin.id
    )
    response.assertStatus(200)
    response.assertBodyContains({ success: true })
  })

  test('DELETE /api/admin/notes/:id returns 403 for other author', async ({ client }) => {
    const admin1 = await createUser({ role: 'admin', email: 'admin1@test.com' })
    const admin2 = await createUser({ role: 'admin', email: 'admin2@test.com' })
    const target = await createUser({ email: 'notedel@test.com' })

    const note = await AdminNote.create({
      userId: target.id,
      authorId: admin1.id,
      content: 'Protected note',
    })

    const response = await withAuth(
      client.delete(`/api/admin/notes/${note.id}`),
      admin2.id
    )
    response.assertStatus(403)
  })

  // --- Tasks CRUD ---

  test('POST /api/admin/subscribers/:id/tasks creates a task', async ({ client }) => {
    const admin = await createUser({ role: 'admin' })
    const target = await createUser({ email: 'task-target@test.com' })

    const response = await withAuth(
      client.post(`/api/admin/subscribers/${target.id}/tasks`),
      admin.id
    ).json({ title: 'Follow up with client' })

    response.assertStatus(201)
    response.assertBodyContains({
      success: true,
      data: { task: { title: 'Follow up with client' } },
    })
  })

  test('PATCH /api/admin/tasks/:id marks task as completed', async ({ client }) => {
    const admin = await createUser({ role: 'admin' })
    const target = await createUser({ email: 'task-complete@test.com' })

    const task = await AdminTask.create({
      userId: target.id,
      authorId: admin.id,
      title: 'Complete me',
      completed: false,
    })

    const response = await withAuth(
      client.patch(`/api/admin/tasks/${task.id}`),
      admin.id
    ).json({ completed: true })

    response.assertStatus(200)
    response.assertBodyContains({
      success: true,
      data: { task: { completed: true } },
    })
  })

  test('DELETE /api/admin/tasks/:id deletes a task', async ({ client }) => {
    const admin = await createUser({ role: 'admin' })
    const target = await createUser({ email: 'task-del@test.com' })

    const task = await AdminTask.create({
      userId: target.id,
      authorId: admin.id,
      title: 'Delete me',
      completed: false,
    })

    const response = await withAuth(
      client.delete(`/api/admin/tasks/${task.id}`),
      admin.id
    )
    response.assertStatus(200)
    response.assertBodyContains({ success: true })
  })

  // --- Superadmin routes ---

  test('PATCH /api/admin/subscribers/:id/role always returns 403 (disabled)', async ({ client }) => {
    const superadmin = await createUser({ role: 'superadmin' })
    const target = await createUser({ email: 'role-target@test.com' })

    const response = await withAuth(
      client.patch(`/api/admin/subscribers/${target.id}/role`),
      superadmin.id
    ).json({ role: 'admin' })

    response.assertStatus(403)
  })

  test('PATCH /api/admin/subscribers/:id/subscription updates status (superadmin)', async ({ client }) => {
    const superadmin = await createUser({ role: 'superadmin' })
    const target = await createUser({ email: 'sub-target@test.com' })

    const response = await withAuth(
      client.patch(`/api/admin/subscribers/${target.id}/subscription`),
      superadmin.id
    ).json({ subscriptionStatus: 'active' })

    response.assertStatus(200)
    response.assertBodyContains({
      success: true,
      data: { user: { subscriptionStatus: 'active' } },
    })
  })

  test('PATCH /api/admin/subscribers/:id/subscription rejects non-superadmin', async ({ client }) => {
    const admin = await createUser({ role: 'admin' })
    const target = await createUser({ email: 'sub-target2@test.com' })

    const response = await withAuth(
      client.patch(`/api/admin/subscribers/${target.id}/subscription`),
      admin.id
    ).json({ subscriptionStatus: 'active' })

    response.assertStatus(403)
  })
})
