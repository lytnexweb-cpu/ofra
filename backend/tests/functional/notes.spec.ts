import { test } from '@japa/runner'
import { cuid } from '@adonisjs/core/helpers'
import mail from '@adonisjs/mail/services/main'
import {
  truncateAll,
  createUser,
  createClient,
  createWorkflowTemplate,
  createWorkflowStep,
} from '#tests/helpers/index'
import { WorkflowEngineService } from '#services/workflow_engine_service'
import Note from '#models/note'

function withAuth(request: any, userId: number) {
  const sessionId = cuid()
  return request
    .withCookie('adonis-session', sessionId)
    .withEncryptedCookie(sessionId, { auth_web: userId })
}

async function setupTransaction() {
  const user = await createUser({ email: `notes-${Date.now()}@test.com` })
  const client = await createClient(user.id)
  const template = await createWorkflowTemplate({
    slug: `tpl-notes-${Date.now()}`,
    transactionType: 'purchase',
  })
  await createWorkflowStep(template.id, { stepOrder: 1, name: 'Step 1', slug: `s1-${Date.now()}` })

  const transaction = await WorkflowEngineService.createTransactionFromTemplate({
    templateId: template.id,
    ownerUserId: user.id,
    clientId: client.id,
    type: 'purchase',
  })

  return { user, client, template, transaction }
}

test.group('Notes Controller - CRUD', (group) => {
  group.each.setup(async () => {
    mail.fake()
    await truncateAll()
  })

  group.each.teardown(async () => {
    mail.restore()
  })

  // ==================== INDEX ====================

  test('GET /api/transactions/:id/notes returns empty array initially', async ({ client }) => {
    const { user, transaction } = await setupTransaction()

    const response = await withAuth(
      client.get(`/api/transactions/${transaction.id}/notes`),
      user.id
    )

    response.assertStatus(200)
    response.assertBodyContains({
      success: true,
      data: { notes: [] },
    })
  })

  test('GET /api/transactions/:id/notes returns notes ordered by created_at desc', async ({
    client,
    assert,
  }) => {
    const { user, transaction } = await setupTransaction()

    // Create notes
    await Note.create({
      transactionId: transaction.id,
      authorUserId: user.id,
      content: 'First note',
    })
    await Note.create({
      transactionId: transaction.id,
      authorUserId: user.id,
      content: 'Second note',
    })

    const response = await withAuth(
      client.get(`/api/transactions/${transaction.id}/notes`),
      user.id
    )

    response.assertStatus(200)
    const body = response.body()
    assert.lengthOf(body.data.notes, 2)
    assert.equal(body.data.notes[0].content, 'Second note') // Most recent first
    assert.equal(body.data.notes[1].content, 'First note')
  })

  test('GET /api/transactions/:id/notes returns 404 for non-existent transaction', async ({
    client,
  }) => {
    const { user } = await setupTransaction()

    const response = await withAuth(client.get('/api/transactions/99999/notes'), user.id)

    response.assertStatus(404)
    response.assertBodyContains({
      success: false,
      error: { code: 'E_NOT_FOUND' },
    })
  })

  test('GET /api/transactions/:id/notes returns 404 for other user transaction', async ({
    client,
  }) => {
    const { transaction } = await setupTransaction()
    const otherUser = await createUser({ email: `other-${Date.now()}@test.com` })

    const response = await withAuth(
      client.get(`/api/transactions/${transaction.id}/notes`),
      otherUser.id
    )

    response.assertStatus(404)
  })

  // ==================== STORE ====================

  test('POST /api/transactions/:id/notes creates a note', async ({ client }) => {
    const { user, transaction } = await setupTransaction()

    const response = await withAuth(
      client.post(`/api/transactions/${transaction.id}/notes`),
      user.id
    ).json({
      content: 'This is a test note',
    })

    response.assertStatus(201)
    response.assertBodyContains({
      success: true,
      data: {
        note: {
          content: 'This is a test note',
          transactionId: transaction.id,
          authorUserId: user.id,
        },
      },
    })
  })

  test('POST /api/transactions/:id/notes validates required content', async ({ client }) => {
    const { user, transaction } = await setupTransaction()

    const response = await withAuth(
      client.post(`/api/transactions/${transaction.id}/notes`),
      user.id
    ).json({})

    response.assertStatus(422)
    response.assertBodyContains({
      success: false,
      error: { code: 'E_VALIDATION_FAILED' },
    })
  })

  test('POST /api/transactions/:id/notes validates content min length', async ({ client }) => {
    const { user, transaction } = await setupTransaction()

    const response = await withAuth(
      client.post(`/api/transactions/${transaction.id}/notes`),
      user.id
    ).json({
      content: '', // Empty content
    })

    response.assertStatus(422)
  })

  test('POST /api/transactions/:id/notes returns 404 for non-existent transaction', async ({
    client,
  }) => {
    const { user } = await setupTransaction()

    const response = await withAuth(client.post('/api/transactions/99999/notes'), user.id).json({
      content: 'Test note',
    })

    response.assertStatus(404)
  })

  test('POST /api/transactions/:id/notes returns 404 for other user transaction', async ({
    client,
  }) => {
    const { transaction } = await setupTransaction()
    const otherUser = await createUser({ email: `other-create-${Date.now()}@test.com` })

    const response = await withAuth(
      client.post(`/api/transactions/${transaction.id}/notes`),
      otherUser.id
    ).json({
      content: 'Test note',
    })

    response.assertStatus(404)
  })

  // ==================== DESTROY ====================

  test('DELETE /api/transactions/:id/notes/:noteId deletes a note', async ({ client, assert }) => {
    const { user, transaction } = await setupTransaction()

    const note = await Note.create({
      transactionId: transaction.id,
      authorUserId: user.id,
      content: 'Note to delete',
    })

    const response = await withAuth(
      client.delete(`/api/transactions/${transaction.id}/notes/${note.id}`),
      user.id
    )

    response.assertStatus(204)

    // Verify note is deleted
    const deletedNote = await Note.find(note.id)
    assert.isNull(deletedNote)
  })

  test('DELETE /api/transactions/:id/notes/:noteId returns 404 for non-existent note', async ({
    client,
  }) => {
    const { user, transaction } = await setupTransaction()

    const response = await withAuth(
      client.delete(`/api/transactions/${transaction.id}/notes/99999`),
      user.id
    )

    response.assertStatus(404)
  })

  test('DELETE /api/transactions/:id/notes/:noteId returns 404 for other user note', async ({
    client,
    assert,
  }) => {
    const { user, transaction } = await setupTransaction()
    const otherUser = await createUser({ email: `other-delete-${Date.now()}@test.com` })

    const note = await Note.create({
      transactionId: transaction.id,
      authorUserId: user.id,
      content: 'Note by original user',
    })

    const response = await withAuth(
      client.delete(`/api/transactions/${transaction.id}/notes/${note.id}`),
      otherUser.id
    )

    response.assertStatus(404)

    // Verify note still exists
    const existingNote = await Note.find(note.id)
    assert.isNotNull(existingNote)
  })
})

test.group('Notes Controller - Multi-tenancy', (group) => {
  group.each.setup(async () => {
    mail.fake()
    await truncateAll()
  })

  group.each.teardown(async () => {
    mail.restore()
  })

  test('User cannot see notes from other users transactions', async ({ client }) => {
    const { user: user1, transaction: tx1 } = await setupTransaction()
    const { user: user2 } = await setupTransaction()

    // User1 creates a note on their transaction
    await Note.create({
      transactionId: tx1.id,
      authorUserId: user1.id,
      content: 'Private note',
    })

    // User2 tries to access User1's transaction notes
    const response = await withAuth(client.get(`/api/transactions/${tx1.id}/notes`), user2.id)

    response.assertStatus(404)
  })

  test('User cannot create notes on other users transactions', async ({ client }) => {
    const { transaction: tx1 } = await setupTransaction()
    const { user: user2 } = await setupTransaction()

    const response = await withAuth(
      client.post(`/api/transactions/${tx1.id}/notes`),
      user2.id
    ).json({
      content: 'Attempted unauthorized note',
    })

    response.assertStatus(404)
  })

  test('User cannot delete notes on other users transactions', async ({ client }) => {
    const { user: user1, transaction: tx1 } = await setupTransaction()
    const { user: user2 } = await setupTransaction()

    const note = await Note.create({
      transactionId: tx1.id,
      authorUserId: user1.id,
      content: 'Note to protect',
    })

    const response = await withAuth(
      client.delete(`/api/transactions/${tx1.id}/notes/${note.id}`),
      user2.id
    )

    response.assertStatus(404)
  })
})
