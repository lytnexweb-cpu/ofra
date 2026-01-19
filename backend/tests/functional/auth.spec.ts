import { test } from '@japa/runner'
import { cuid } from '@adonisjs/core/helpers'
import { truncateAll, createUser } from '#tests/helpers/index'

test.group('Auth - Login', (group) => {
  group.each.setup(async () => {
    await truncateAll()
  })

  test('login succeeds with valid credentials', async ({ client }) => {
    await createUser({ email: 'auth@test.com' })

    const response = await client.post('/api/login').json({
      email: 'auth@test.com',
      password: 'password123',
    })

    response.assertStatus(200)
    response.assertBodyContains({ success: true })
  })

  test('login fails with wrong password', async ({ client }) => {
    await createUser({ email: 'auth@test.com' })

    const response = await client.post('/api/login').json({
      email: 'auth@test.com',
      password: 'wrongpassword',
    })

    response.assertStatus(401)
  })

  test('GET /api/me returns 401 when not authenticated', async ({ client }) => {
    const response = await client.get('/api/me')
    response.assertStatus(401)
  })

  test('GET /api/me returns user when authenticated', async ({ client }) => {
    const user = await createUser({ email: 'me@test.com' })

    // Authenticate by injecting session cookies directly
    const sessionId = cuid()
    const response = await client
      .get('/api/me')
      .withCookie('adonis-session', sessionId)
      .withEncryptedCookie(sessionId, { auth_web: user.id })

    response.assertStatus(200)
    response.assertBodyContains({
      success: true,
      data: {
        user: {
          email: 'me@test.com',
        },
      },
    })
  })
})
