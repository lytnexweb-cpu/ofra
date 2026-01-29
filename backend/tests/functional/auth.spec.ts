import { test } from '@japa/runner'
import { cuid } from '@adonisjs/core/helpers'
import { createHash } from 'node:crypto'
import mail from '@adonisjs/mail/services/main'
import { truncateAll, createUser } from '#tests/helpers/index'
import User from '#models/user'
import WelcomeMail from '#mails/welcome_mail'
import PasswordResetMail from '#mails/password_reset_mail'

test.group('Auth - Register', (group) => {
  let fakeMailer: ReturnType<typeof mail.fake>

  group.each.setup(async () => {
    await truncateAll()
    fakeMailer = mail.fake()
  })

  group.each.teardown(() => {
    mail.restore()
  })

  test('register creates a new user and sends welcome email', async ({ client, assert }) => {
    const response = await client.post('/api/register').json({
      email: 'newuser@test.com',
      password: 'securepassword123',
      fullName: 'New User',
    })

    response.assertStatus(201)
    // Response no longer includes user details to prevent enumeration
    response.assertBodyContains({
      success: true,
      data: {
        message: 'If this email is available, your account has been created. Please check your email.',
      },
    })

    // Verify user was created
    const user = await User.findBy('email', 'newuser@test.com')
    assert.isNotNull(user)

    // Verify welcome email was queued
    fakeMailer.mails.assertSent(WelcomeMail)
  })

  test('register returns same success response for existing email (prevents enumeration)', async ({ client, assert }) => {
    await createUser({ email: 'existing@test.com' })

    const response = await client.post('/api/register').json({
      email: 'existing@test.com',
      password: 'securepassword123',
      fullName: 'Duplicate User',
    })

    // Returns 201 with same message to prevent email enumeration
    response.assertStatus(201)
    response.assertBodyContains({
      success: true,
      data: {
        message: 'If this email is available, your account has been created. Please check your email.',
      },
    })

    // Verify no duplicate user was created
    const users = await User.query().where('email', 'existing@test.com')
    assert.equal(users.length, 1)
  })

  test('register fails with invalid email', async ({ client }) => {
    const response = await client.post('/api/register').json({
      email: 'not-an-email',
      password: 'securepassword123',
      fullName: 'Invalid Email',
    })

    response.assertStatus(422)
  })

  test('register fails with short password', async ({ client }) => {
    const response = await client.post('/api/register').json({
      email: 'short@test.com',
      password: 'short',
      fullName: 'Short Password',
    })

    response.assertStatus(422)
  })
})

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

test.group('Auth - Forgot Password', (group) => {
  let fakeMailer: ReturnType<typeof mail.fake>

  group.each.setup(async () => {
    await truncateAll()
    fakeMailer = mail.fake()
  })

  group.each.teardown(() => {
    mail.restore()
  })

  test('forgot-password sends reset email for existing user', async ({ client, assert }) => {
    await createUser({ email: 'forgot@test.com' })

    const response = await client.post('/api/forgot-password').json({
      email: 'forgot@test.com',
    })

    response.assertStatus(200)
    response.assertBodyContains({ success: true })

    // Verify reset token was set
    const user = await User.findBy('email', 'forgot@test.com')
    assert.isNotNull(user?.passwordResetToken)
    assert.isNotNull(user?.passwordResetExpires)

    // Verify email was sent
    fakeMailer.mails.assertSent(PasswordResetMail)
  })

  test('forgot-password returns success even for non-existent email (prevents enumeration)', async ({
    client,
  }) => {
    const response = await client.post('/api/forgot-password').json({
      email: 'nonexistent@test.com',
    })

    response.assertStatus(200)
    response.assertBodyContains({ success: true })
  })
})

test.group('Auth - Reset Password', (group) => {
  group.each.setup(async () => {
    await truncateAll()
  })

  test('reset-password succeeds with valid token', async ({ client, assert }) => {
    const user = await createUser({ email: 'reset@test.com' })

    // Set a reset token (store HASHED token, send plain token)
    const { DateTime } = await import('luxon')
    const plainToken = 'valid-reset-token-123'
    const tokenHash = createHash('sha256').update(plainToken).digest('hex')
    user.passwordResetToken = tokenHash
    user.passwordResetExpires = DateTime.now().plus({ hours: 1 })
    await user.save()

    // Send plain token (as user would receive via email)
    const response = await client.post('/api/reset-password').json({
      token: plainToken,
      password: 'newpassword123',
    })

    response.assertStatus(200)
    response.assertBodyContains({ success: true })

    // Verify token was cleared
    await user.refresh()
    assert.isNull(user.passwordResetToken)
    assert.isNull(user.passwordResetExpires)

    // Verify new password works
    const loginResponse = await client.post('/api/login').json({
      email: 'reset@test.com',
      password: 'newpassword123',
    })
    loginResponse.assertStatus(200)
  })

  test('reset-password fails with invalid token', async ({ client }) => {
    const response = await client.post('/api/reset-password').json({
      token: 'invalid-token',
      password: 'newpassword123',
    })

    response.assertStatus(400)
    response.assertBodyContains({
      success: false,
      error: { code: 'E_INVALID_TOKEN' },
    })
  })

  test('reset-password fails with expired token', async ({ client }) => {
    const user = await createUser({ email: 'expired@test.com' })

    // Set an expired reset token (store HASHED token)
    const { DateTime } = await import('luxon')
    const plainToken = 'expired-token-123'
    const tokenHash = createHash('sha256').update(plainToken).digest('hex')
    user.passwordResetToken = tokenHash
    user.passwordResetExpires = DateTime.now().minus({ hours: 1 })
    await user.save()

    const response = await client.post('/api/reset-password').json({
      token: plainToken,
      password: 'newpassword123',
    })

    response.assertStatus(400)
    response.assertBodyContains({
      success: false,
      error: { code: 'E_INVALID_TOKEN' },
    })
  })
})
