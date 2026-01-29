import { test } from '@japa/runner'
import { cuid } from '@adonisjs/core/helpers'
import { truncateAll, createUser, createClient } from '#tests/helpers/index'
import Client from '#models/client'

/**
 * Helper to create authenticated request
 */
function withAuth(request: any, userId: number) {
  const sessionId = cuid()
  return request
    .withCookie('adonis-session', sessionId)
    .withEncryptedCookie(sessionId, { auth_web: userId })
}

test.group('Clients - CSV Import', (group) => {
  group.each.setup(async () => {
    await truncateAll()
  })

  test('GET /api/clients/import/template returns CSV template', async ({ client }) => {
    const user = await createUser({ email: 'import@test.com' })

    const response = await withAuth(client.get('/api/clients/import/template'), user.id)

    response.assertStatus(200)
    response.assertHeader('content-type', 'text/csv')

    const body = response.text()
    response.assert?.isTrue(body.includes('firstName'))
    response.assert?.isTrue(body.includes('lastName'))
    response.assert?.isTrue(body.includes('email'))
  })

  test('POST /api/clients/import creates clients from valid CSV', async ({ client }) => {
    const user = await createUser({ email: 'import@test.com' })

    const csvContent = `firstName,lastName,email,phone
Jean,Dupont,jean@example.com,506-555-1234
Marie,Tremblay,marie@example.com,506-555-5678`

    const response = await withAuth(client.post('/api/clients/import'), user.id).file(
      'file',
      Buffer.from(csvContent),
      { filename: 'clients.csv', contentType: 'text/csv' }
    )

    response.assertStatus(200)
    response.assertBodyContains({
      success: true,
      data: {
        imported: 2,
        skipped: 0,
      },
    })

    // Verify clients were created
    const clients = await Client.query().where('owner_user_id', user.id)
    response.assert?.equal(clients.length, 2)
  })

  test('POST /api/clients/import handles French column names', async ({ client }) => {
    const user = await createUser({ email: 'import@test.com' })

    const csvContent = `prénom,nom,courriel,téléphone
Pierre,Bouchard,pierre@example.com,506-555-9999`

    const response = await withAuth(client.post('/api/clients/import'), user.id).file(
      'file',
      Buffer.from(csvContent),
      { filename: 'clients.csv', contentType: 'text/csv' }
    )

    response.assertStatus(200)
    response.assertBodyContains({
      success: true,
      data: {
        imported: 1,
      },
    })

    const dbClient = await Client.query()
      .where('owner_user_id', user.id)
      .where('first_name', 'Pierre')
      .first()

    response.assert?.isNotNull(dbClient)
    response.assert?.equal(dbClient?.email, 'pierre@example.com')
  })

  test('POST /api/clients/import skips rows with missing required fields', async ({ client }) => {
    const user = await createUser({ email: 'import@test.com' })

    const csvContent = `firstName,lastName,email
Valid,User,valid@example.com
,MissingFirst,missing1@example.com
MissingLast,,missing2@example.com`

    const response = await withAuth(client.post('/api/clients/import'), user.id).file(
      'file',
      Buffer.from(csvContent),
      { filename: 'clients.csv', contentType: 'text/csv' }
    )

    response.assertStatus(200)
    response.assertBodyContains({
      success: true,
      data: {
        imported: 1,
        skipped: 2,
      },
    })
  })

  test('POST /api/clients/import skips duplicate clients', async ({ client }) => {
    const user = await createUser({ email: 'import@test.com' })

    // Create existing client
    await createClient(user.id, {
      firstName: 'Jean',
      lastName: 'Dupont',
      email: 'jean@example.com',
    })

    const csvContent = `firstName,lastName,email
Jean,Dupont,jean@example.com
Marie,Tremblay,marie@example.com`

    const response = await withAuth(client.post('/api/clients/import'), user.id).file(
      'file',
      Buffer.from(csvContent),
      { filename: 'clients.csv', contentType: 'text/csv' }
    )

    response.assertStatus(200)
    response.assertBodyContains({
      success: true,
      data: {
        imported: 1,
        skipped: 1,
      },
    })
  })

  test('POST /api/clients/import fails without file', async ({ client }) => {
    const user = await createUser({ email: 'import@test.com' })

    const response = await withAuth(client.post('/api/clients/import'), user.id)

    response.assertStatus(400)
    response.assertBodyContains({
      success: false,
      error: {
        code: 'E_NO_FILE',
      },
    })
  })

  test('POST /api/clients/import fails with empty CSV', async ({ client }) => {
    const user = await createUser({ email: 'import@test.com' })

    const csvContent = `firstName,lastName,email`

    const response = await withAuth(client.post('/api/clients/import'), user.id).file(
      'file',
      Buffer.from(csvContent),
      { filename: 'clients.csv', contentType: 'text/csv' }
    )

    response.assertStatus(422)
    response.assertBodyContains({
      success: false,
      error: {
        code: 'E_IMPORT_FAILED',
      },
    })
  })
})
