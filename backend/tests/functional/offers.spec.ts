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
import { OfferService } from '#services/offer_service'
import Offer from '#models/offer'

function withAuth(request: any, userId: number) {
  const sessionId = cuid()
  return request
    .withCookie('adonis-session', sessionId)
    .withEncryptedCookie(sessionId, { auth_web: userId })
}

async function setupTransaction() {
  const user = await createUser({ email: `offers-${Date.now()}@test.com` })
  const client = await createClient(user.id)
  const template = await createWorkflowTemplate({
    slug: `tpl-offers-${Date.now()}`,
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

test.group('Offers Controller - CRUD', (group) => {
  group.each.setup(async () => {
    mail.fake()
    await truncateAll()
  })

  group.each.teardown(async () => {
    mail.restore()
  })

  // ==================== INDEX ====================

  test('GET /api/transactions/:id/offers returns empty array initially', async ({ client }) => {
    const { user, transaction } = await setupTransaction()

    const response = await withAuth(
      client.get(`/api/transactions/${transaction.id}/offers`),
      user.id
    )

    response.assertStatus(200)
    response.assertBodyContains({
      success: true,
      data: { offers: [] },
    })
  })

  test('GET /api/transactions/:id/offers returns 404 for non-existent transaction', async ({
    client,
  }) => {
    const { user } = await setupTransaction()

    const response = await withAuth(client.get('/api/transactions/99999/offers'), user.id)

    response.assertStatus(404)
  })

  // ==================== STORE ====================

  test('POST /api/transactions/:id/offers creates an offer', async ({ client, assert }) => {
    const { user, transaction } = await setupTransaction()

    const response = await withAuth(
      client.post(`/api/transactions/${transaction.id}/offers`),
      user.id
    ).json({
      price: 350000,
      deposit: 10000,
      direction: 'buyer_to_seller',
    })

    response.assertStatus(201)
    response.assertBodyContains({
      success: true,
      data: {
        offer: {
          transactionId: transaction.id,
          status: 'received',
        },
      },
    })

    // Verify revision was created
    const body = response.body()
    assert.isDefined(body.data.offer.revisions)
  })

  test('POST /api/transactions/:id/offers validates required price', async ({ client }) => {
    const { user, transaction } = await setupTransaction()

    const response = await withAuth(
      client.post(`/api/transactions/${transaction.id}/offers`),
      user.id
    ).json({
      deposit: 10000,
    })

    response.assertStatus(422)
    response.assertBodyContains({
      success: false,
      error: { code: 'E_VALIDATION_FAILED' },
    })
  })

  test('POST /api/transactions/:id/offers validates price is positive', async ({ client }) => {
    const { user, transaction } = await setupTransaction()

    const response = await withAuth(
      client.post(`/api/transactions/${transaction.id}/offers`),
      user.id
    ).json({
      price: -100,
    })

    response.assertStatus(422)
  })

  test('POST /api/transactions/:id/offers with optional fields', async ({ client, assert }) => {
    const { user, transaction } = await setupTransaction()
    const expiryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

    const response = await withAuth(
      client.post(`/api/transactions/${transaction.id}/offers`),
      user.id
    ).json({
      price: 400000,
      deposit: 15000,
      financingAmount: 320000,
      expiryAt: expiryDate,
      notes: 'Offer with conditions',
      direction: 'seller_to_buyer',
    })

    response.assertStatus(201)
    const body = response.body()
    assert.equal(body.data.offer.revisions[0].price, 400000)
    assert.equal(body.data.offer.revisions[0].deposit, 15000)
    assert.equal(body.data.offer.revisions[0].financingAmount, 320000)
  })

  // ==================== SHOW ====================

  test('GET /api/transactions/:id/offers/:offerId returns offer with revisions', async ({
    client,
  }) => {
    const { user, transaction } = await setupTransaction()

    const offer = await OfferService.createOffer({
      transactionId: transaction.id,
      price: 300000,
      createdByUserId: user.id,
    })

    const response = await withAuth(
      client.get(`/api/offers/${offer.id}`),
      user.id
    )

    response.assertStatus(200)
    response.assertBodyContains({
      success: true,
      data: {
        offer: {
          id: offer.id,
          status: 'received',
        },
      },
    })
  })

  test('GET /api/transactions/:id/offers/:offerId returns 404 for non-existent offer', async ({
    client,
  }) => {
    const { user, transaction } = await setupTransaction()

    const response = await withAuth(
      client.get(`/api/transactions/${transaction.id}/offers/99999`),
      user.id
    )

    response.assertStatus(404)
  })

  // ==================== ADD REVISION (Counter Offer) ====================

  test('POST /api/transactions/:id/offers/:offerId/revisions adds counter offer', async ({
    client,
    assert,
  }) => {
    const { user, transaction } = await setupTransaction()

    const offer = await OfferService.createOffer({
      transactionId: transaction.id,
      price: 300000,
      createdByUserId: user.id,
      direction: 'buyer_to_seller',
    })

    const response = await withAuth(
      client.post(`/api/offers/${offer.id}/revisions`),
      user.id
    ).json({
      price: 325000,
      direction: 'seller_to_buyer',
    })

    response.assertStatus(201)
    const body = response.body()
    assert.equal(body.data.offer.status, 'countered')
    assert.equal(body.data.revision.price, 325000)
    assert.equal(body.data.revision.revisionNumber, 2)
  })

  // ==================== ACCEPT ====================

  test('PATCH /api/transactions/:id/offers/:offerId/accept accepts offer', async ({ client }) => {
    const { user, transaction } = await setupTransaction()

    const offer = await OfferService.createOffer({
      transactionId: transaction.id,
      price: 350000,
      createdByUserId: user.id,
    })

    const response = await withAuth(
      client.patch(`/api/offers/${offer.id}/accept`),
      user.id
    )

    response.assertStatus(200)
    response.assertBodyContains({
      success: true,
      data: {
        offer: {
          id: offer.id,
          status: 'accepted',
        },
      },
    })
  })

  test('Cannot accept already accepted offer', async ({ client }) => {
    const { user, transaction } = await setupTransaction()

    const offer = await OfferService.createOffer({
      transactionId: transaction.id,
      price: 350000,
      createdByUserId: user.id,
    })
    await OfferService.acceptOffer(offer.id, user.id)

    const response = await withAuth(
      client.patch(`/api/offers/${offer.id}/accept`),
      user.id
    )

    response.assertStatus(400)
    response.assertBodyContains({
      success: false,
      error: { code: 'E_INVALID_OFFER_STATUS' },
    })
  })

  // ==================== REJECT ====================

  test('PATCH /api/transactions/:id/offers/:offerId/reject rejects offer', async ({ client }) => {
    const { user, transaction } = await setupTransaction()

    const offer = await OfferService.createOffer({
      transactionId: transaction.id,
      price: 350000,
      createdByUserId: user.id,
    })

    const response = await withAuth(
      client.patch(`/api/offers/${offer.id}/reject`),
      user.id
    )

    response.assertStatus(200)
    response.assertBodyContains({
      success: true,
      data: {
        offer: {
          id: offer.id,
          status: 'rejected',
        },
      },
    })
  })

  test('Cannot reject accepted offer', async ({ client }) => {
    const { user, transaction } = await setupTransaction()

    const offer = await OfferService.createOffer({
      transactionId: transaction.id,
      price: 350000,
      createdByUserId: user.id,
    })
    await OfferService.acceptOffer(offer.id, user.id)

    const response = await withAuth(
      client.patch(`/api/offers/${offer.id}/reject`),
      user.id
    )

    response.assertStatus(400)
  })

  // ==================== WITHDRAW ====================

  test('PATCH /api/transactions/:id/offers/:offerId/withdraw withdraws offer', async ({
    client,
  }) => {
    const { user, transaction } = await setupTransaction()

    const offer = await OfferService.createOffer({
      transactionId: transaction.id,
      price: 350000,
      createdByUserId: user.id,
    })

    const response = await withAuth(
      client.patch(`/api/offers/${offer.id}/withdraw`),
      user.id
    )

    response.assertStatus(200)
    response.assertBodyContains({
      success: true,
      data: {
        offer: {
          id: offer.id,
          status: 'withdrawn',
        },
      },
    })
  })

  // ==================== DESTROY ====================

  test('DELETE /api/transactions/:id/offers/:offerId deletes pending offer', async ({
    client,
    assert,
  }) => {
    const { user, transaction } = await setupTransaction()

    const offer = await OfferService.createOffer({
      transactionId: transaction.id,
      price: 350000,
      createdByUserId: user.id,
    })

    const response = await withAuth(
      client.delete(`/api/offers/${offer.id}`),
      user.id
    )

    response.assertStatus(204)

    // Verify deleted
    const deletedOffer = await Offer.find(offer.id)
    assert.isNull(deletedOffer)
  })

  test('Cannot delete accepted offer', async ({ client }) => {
    const { user, transaction } = await setupTransaction()

    const offer = await OfferService.createOffer({
      transactionId: transaction.id,
      price: 350000,
      createdByUserId: user.id,
    })
    await OfferService.acceptOffer(offer.id, user.id)

    const response = await withAuth(
      client.delete(`/api/offers/${offer.id}`),
      user.id
    )

    response.assertStatus(400)
    response.assertBodyContains({
      success: false,
      error: { code: 'E_CANNOT_DELETE_ACCEPTED' },
    })
  })
})

test.group('Offers Controller - Multi-tenancy', (group) => {
  group.each.setup(async () => {
    mail.fake()
    await truncateAll()
  })

  group.each.teardown(async () => {
    mail.restore()
  })

  test('User cannot see offers from other users transactions', async ({ client }) => {
    const { user: user1, transaction: tx1 } = await setupTransaction()
    const { user: user2 } = await setupTransaction()

    await OfferService.createOffer({
      transactionId: tx1.id,
      price: 300000,
      createdByUserId: user1.id,
    })

    const response = await withAuth(client.get(`/api/transactions/${tx1.id}/offers`), user2.id)

    response.assertStatus(403)
  })

  test('User cannot create offers on other users transactions', async ({ client }) => {
    const { transaction: tx1 } = await setupTransaction()
    const { user: user2 } = await setupTransaction()

    const response = await withAuth(
      client.post(`/api/transactions/${tx1.id}/offers`),
      user2.id
    ).json({
      price: 300000,
    })

    response.assertStatus(403)
  })

  test('User cannot accept offers on other users transactions', async ({ client }) => {
    const { user: user1, transaction: tx1 } = await setupTransaction()
    const { user: user2 } = await setupTransaction()

    const offer = await OfferService.createOffer({
      transactionId: tx1.id,
      price: 300000,
      createdByUserId: user1.id,
    })

    const response = await withAuth(
      client.patch(`/api/offers/${offer.id}/accept`),
      user2.id
    )

    response.assertStatus(404)
  })

  test('User cannot delete offers on other users transactions', async ({ client, assert }) => {
    const { user: user1, transaction: tx1 } = await setupTransaction()
    const { user: user2 } = await setupTransaction()

    const offer = await OfferService.createOffer({
      transactionId: tx1.id,
      price: 300000,
      createdByUserId: user1.id,
    })

    const response = await withAuth(
      client.delete(`/api/offers/${offer.id}`),
      user2.id
    )

    response.assertStatus(404)

    // Verify offer still exists
    const existingOffer = await Offer.find(offer.id)
    assert.isNotNull(existingOffer)
  })
})

test.group('Offers Controller - Edge Cases', (group) => {
  group.each.setup(async () => {
    mail.fake()
    await truncateAll()
  })

  group.each.teardown(async () => {
    mail.restore()
  })

  test('Multiple offers on same transaction', async ({ client, assert }) => {
    const { user, transaction } = await setupTransaction()

    // Create first offer
    await withAuth(client.post(`/api/transactions/${transaction.id}/offers`), user.id).json({
      price: 300000,
    })

    // Create second offer
    await withAuth(client.post(`/api/transactions/${transaction.id}/offers`), user.id).json({
      price: 310000,
    })

    // List all offers
    const response = await withAuth(
      client.get(`/api/transactions/${transaction.id}/offers`),
      user.id
    )

    response.assertStatus(200)
    const body = response.body()
    assert.lengthOf(body.data.offers, 2)
  })

  test('Offer workflow: create -> counter -> accept', async ({ client, assert }) => {
    const { user, transaction } = await setupTransaction()

    // Create initial offer
    const createResponse = await withAuth(
      client.post(`/api/transactions/${transaction.id}/offers`),
      user.id
    ).json({
      price: 300000,
      direction: 'buyer_to_seller',
    })
    const offerId = createResponse.body().data.offer.id

    // Counter offer
    await withAuth(
      client.post(`/api/offers/${offerId}/revisions`),
      user.id
    ).json({
      price: 325000,
      direction: 'seller_to_buyer',
    })

    // Accept
    const acceptResponse = await withAuth(
      client.patch(`/api/offers/${offerId}/accept`),
      user.id
    )

    acceptResponse.assertStatus(200)
    assert.equal(acceptResponse.body().data.offer.status, 'accepted')
  })
})
