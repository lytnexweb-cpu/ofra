import { test } from '@japa/runner'
import { cuid } from '@adonisjs/core/helpers'
import {
  truncateAll,
  createUser,
  createClient,
} from '#tests/helpers/index'

/**
 * Helper to create authenticated request
 */
function withAuth(request: any, userId: number) {
  const sessionId = cuid()
  return request
    .withCookie('adonis-session', sessionId)
    .withEncryptedCookie(sessionId, { auth_web: userId })
}

test.group('Clients - CRUD', (group) => {
  group.each.setup(async () => {
    await truncateAll()
  })

  test('GET /api/clients returns empty array for new user', async ({ client }) => {
    const user = await createUser({ email: 'clients@test.com' })

    const response = await withAuth(client.get('/api/clients'), user.id)

    response.assertStatus(200)
    response.assertBodyContains({
      success: true,
      data: {
        clients: [],
      },
    })
  })

  test('POST /api/clients creates a client', async ({ client }) => {
    const user = await createUser({ email: 'clients@test.com' })

    const response = await withAuth(client.post('/api/clients'), user.id).json({
      firstName: 'John',
      lastName: 'Doe',
      email: 'johndoe@example.com',
    })

    response.assertStatus(201)
    response.assertBodyContains({
      success: true,
      data: {
        client: {
          firstName: 'John',
          lastName: 'Doe',
        },
      },
    })
  })

  test('POST /api/clients fails without firstName (validation)', async ({ client }) => {
    const user = await createUser({ email: 'clients@test.com' })

    const response = await withAuth(client.post('/api/clients'), user.id).json({
      lastName: 'Doe',
    })

    response.assertStatus(422)
  })
})

test.group('Clients - Multi-tenancy', (group) => {
  group.each.setup(async () => {
    await truncateAll()
  })

  test('User A cannot list User B clients', async ({ client }) => {
    // Create User A with a client
    const userA = await createUser({ email: 'usera@test.com' })
    await createClient(userA.id, { firstName: 'ClientOfA' })

    // Create User B
    const userB = await createUser({ email: 'userb@test.com' })

    // User B should see empty list
    const response = await withAuth(client.get('/api/clients'), userB.id)

    response.assertStatus(200)
    response.assertBodyContains({
      data: {
        clients: [],
      },
    })
  })

  test('User A cannot GET User B client by ID', async ({ client }) => {
    // Create User A with a client
    const userA = await createUser({ email: 'usera@test.com' })
    const clientOfA = await createClient(userA.id, { firstName: 'ClientOfA' })

    // Create User B
    const userB = await createUser({ email: 'userb@test.com' })

    // User B should get 404 trying to access User A's client
    const response = await withAuth(client.get(`/api/clients/${clientOfA.id}`), userB.id)

    response.assertStatus(404)
  })
})
