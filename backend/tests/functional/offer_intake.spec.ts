import { test } from '@japa/runner'
import { cuid } from '@adonisjs/core/helpers'
import { DateTime } from 'luxon'
import mail from '@adonisjs/mail/services/main'
import {
  truncateAll,
  createUser,
  createClient,
  createWorkflowTemplate,
  createWorkflowStep,
  createProperty,
} from '#tests/helpers/index'
import { WorkflowEngineService } from '#services/workflow_engine_service'
import TransactionShareLink from '#models/transaction_share_link'
import TransactionParty from '#models/transaction_party'
import Offer from '#models/offer'
import Transaction from '#models/transaction'

function withAuth(request: any, userId: number) {
  const sessionId = cuid()
  return request
    .withCookie('adonis-session', sessionId)
    .withEncryptedCookie(sessionId, { auth_web: userId })
}

async function setupTransaction() {
  const user = await createUser({ email: `intake-${Date.now()}@test.com` })
  const client = await createClient(user.id)
  const template = await createWorkflowTemplate({
    slug: `tpl-intake-${Date.now()}`,
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

async function createOfferIntakeLink(
  transactionId: number,
  createdBy: number,
  overrides: Partial<{ expiresAt: DateTime | null; isActive: boolean }> = {}
) {
  return TransactionShareLink.create({
    transactionId,
    token: cuid(),
    linkType: 'offer_intake',
    role: 'viewer',
    isActive: overrides.isActive ?? true,
    expiresAt: overrides.expiresAt ?? null,
    passwordHash: null,
    createdBy,
    accessCount: 0,
  })
}

// =============================================
// D35 — Offer Intake: GET /api/offer-intake/:token
// =============================================

test.group('Offer Intake - GET info', (group) => {
  group.each.setup(async () => {
    mail.fake()
    await truncateAll()
  })

  group.each.teardown(async () => {
    mail.restore()
  })

  test('returns property info for valid active link', async ({ client, assert }) => {
    const { user, transaction } = await setupTransaction()
    const property = await createProperty(user.id, {
      address: '42 Rue des Tests',
      city: 'Moncton',
      postalCode: 'E1C 9Z9',
    })

    // Attach property to transaction
    const tx = await Transaction.findOrFail(transaction.id)
    tx.propertyId = property.id
    tx.listPrice = 450000
    await tx.save()

    const link = await createOfferIntakeLink(transaction.id, user.id)

    const response = await client.get(`/api/offer-intake/${link.token}`)
    response.assertStatus(200)

    const body = response.body()
    assert.isTrue(body.success)
    assert.equal(body.data.property.address, '42 Rue des Tests')
    assert.equal(body.data.property.city, 'Moncton')
    assert.equal(body.data.listPrice, 450000)
  })

  test('returns 404 for non-existent token', async ({ client }) => {
    await setupTransaction()

    const response = await client.get('/api/offer-intake/nonexistent-token-xyz')
    response.assertStatus(404)
    response.assertBodyContains({
      success: false,
      error: { code: 'E_LINK_NOT_FOUND' },
    })
  })

  test('returns 404 for viewer-type share link token', async ({ client }) => {
    const { user, transaction } = await setupTransaction()

    // Create a viewer share link (NOT offer_intake)
    const viewerLink = await TransactionShareLink.create({
      transactionId: transaction.id,
      token: cuid(),
      linkType: 'viewer',
      role: 'viewer',
      isActive: true,
      expiresAt: null,
      passwordHash: null,
      createdBy: user.id,
      accessCount: 0,
    })

    const response = await client.get(`/api/offer-intake/${viewerLink.token}`)
    response.assertStatus(404)
  })

  test('returns 403 for disabled link', async ({ client }) => {
    const { user, transaction } = await setupTransaction()
    const link = await createOfferIntakeLink(transaction.id, user.id, { isActive: false })

    const response = await client.get(`/api/offer-intake/${link.token}`)
    response.assertStatus(403)
    response.assertBodyContains({
      success: false,
      error: { code: 'E_LINK_DISABLED' },
    })
  })

  test('returns 410 for expired link', async ({ client }) => {
    const { user, transaction } = await setupTransaction()
    const link = await createOfferIntakeLink(transaction.id, user.id, {
      expiresAt: DateTime.now().minus({ days: 1 }),
    })

    const response = await client.get(`/api/offer-intake/${link.token}`)
    response.assertStatus(410)
    response.assertBodyContains({
      success: false,
      error: { code: 'E_LINK_EXPIRED' },
    })
  })

  test('returns null property when transaction has no property', async ({ client, assert }) => {
    const { user, transaction } = await setupTransaction()
    const link = await createOfferIntakeLink(transaction.id, user.id)

    const response = await client.get(`/api/offer-intake/${link.token}`)
    response.assertStatus(200)

    const body = response.body()
    assert.isNull(body.data.property)
  })

  test('does not expose internal IDs in response', async ({ client, assert }) => {
    const { user, transaction } = await setupTransaction()
    const link = await createOfferIntakeLink(transaction.id, user.id)

    const response = await client.get(`/api/offer-intake/${link.token}`)
    response.assertStatus(200)

    const body = response.body()
    // Should NOT contain transactionId, userId, linkId
    assert.notProperty(body.data, 'id')
    assert.notProperty(body.data, 'transactionId')
    assert.notProperty(body.data, 'userId')
  })
})

// =============================================
// D35 — Offer Intake: POST /api/offer-intake/:token
// =============================================

test.group('Offer Intake - POST submit', (group) => {
  group.each.setup(async () => {
    mail.fake()
    await truncateAll()
  })

  group.each.teardown(async () => {
    mail.restore()
  })

  test('creates party + offer from valid submission', async ({ client, assert }) => {
    const { user, transaction } = await setupTransaction()
    const link = await createOfferIntakeLink(transaction.id, user.id)

    const response = await client.post(`/api/offer-intake/${link.token}`).json({
      fullName: 'Jean Acheteur',
      email: 'jean@example.com',
      phone: '506-555-1234',
      price: 425000,
      message: 'Très intéressé par la propriété',
    })

    response.assertStatus(201)
    response.assertBodyContains({ success: true })

    // Verify party created
    const parties = await TransactionParty.query().where('transaction_id', transaction.id)
    const buyerParty = parties.find((p) => p.role === 'buyer' && p.fullName === 'Jean Acheteur')
    assert.isDefined(buyerParty)
    assert.equal(buyerParty!.email, 'jean@example.com')
    assert.equal(buyerParty!.phone, '506-555-1234')

    // Verify offer created
    const offers = await Offer.query()
      .where('transaction_id', transaction.id)
      .preload('revisions')
    assert.lengthOf(offers, 1)
    assert.equal(offers[0].status, 'received')
    assert.lengthOf(offers[0].revisions, 1)
    assert.equal(offers[0].revisions[0].price, 425000)
    assert.equal(offers[0].revisions[0].direction, 'buyer_to_seller')
    assert.equal(offers[0].revisions[0].fromPartyId, buyerParty!.id)
  })

  test('creates offer without optional fields', async ({ client, assert }) => {
    const { user, transaction } = await setupTransaction()
    const link = await createOfferIntakeLink(transaction.id, user.id)

    const response = await client.post(`/api/offer-intake/${link.token}`).json({
      fullName: 'Alice Smith',
      email: 'alice@example.com',
      price: 300000,
    })

    response.assertStatus(201)

    const parties = await TransactionParty.query().where('transaction_id', transaction.id)
    const buyer = parties.find((p) => p.fullName === 'Alice Smith')
    assert.isDefined(buyer)
    assert.isNull(buyer!.phone)
  })

  test('links offer to existing seller party', async ({ client, assert }) => {
    const { user, transaction } = await setupTransaction()

    // Create a seller party first
    const seller = await TransactionParty.create({
      transactionId: transaction.id,
      role: 'seller',
      fullName: 'Vendeur Primaire',
      email: 'vendeur@example.com',
      isPrimary: true,
    })

    const link = await createOfferIntakeLink(transaction.id, user.id)

    await client.post(`/api/offer-intake/${link.token}`).json({
      fullName: 'Buyer McBuyer',
      email: 'buyer@example.com',
      price: 500000,
    })

    // Verify toPartyId is the seller
    const offers = await Offer.query()
      .where('transaction_id', transaction.id)
      .preload('revisions')
    assert.equal(offers[0].revisions[0].toPartyId, seller.id)
  })

  test('increments link access count after submission', async ({ client, assert }) => {
    const { user, transaction } = await setupTransaction()
    const link = await createOfferIntakeLink(transaction.id, user.id)
    assert.equal(link.accessCount, 0)

    await client.post(`/api/offer-intake/${link.token}`).json({
      fullName: 'Test User',
      email: 'test@example.com',
      price: 200000,
    })

    await link.refresh()
    assert.equal(link.accessCount, 1)
    assert.isNotNull(link.lastAccessedAt)
  })

  test('returns 404 for non-existent token', async ({ client }) => {
    await setupTransaction()

    const response = await client.post('/api/offer-intake/fake-token').json({
      fullName: 'Test',
      email: 'test@example.com',
      price: 100000,
    })

    response.assertStatus(404)
    response.assertBodyContains({
      success: false,
      error: { code: 'E_LINK_NOT_FOUND' },
    })
  })

  test('returns 403 for disabled link', async ({ client }) => {
    const { user, transaction } = await setupTransaction()
    const link = await createOfferIntakeLink(transaction.id, user.id, { isActive: false })

    const response = await client.post(`/api/offer-intake/${link.token}`).json({
      fullName: 'Test',
      email: 'test@example.com',
      price: 100000,
    })

    response.assertStatus(403)
  })

  test('returns 410 for expired link', async ({ client }) => {
    const { user, transaction } = await setupTransaction()
    const link = await createOfferIntakeLink(transaction.id, user.id, {
      expiresAt: DateTime.now().minus({ hours: 1 }),
    })

    const response = await client.post(`/api/offer-intake/${link.token}`).json({
      fullName: 'Test',
      email: 'test@example.com',
      price: 100000,
    })

    response.assertStatus(410)
  })

  test('returns 422 for missing required fields', async ({ client }) => {
    const { user, transaction } = await setupTransaction()
    const link = await createOfferIntakeLink(transaction.id, user.id)

    // Missing fullName
    const r1 = await client.post(`/api/offer-intake/${link.token}`).json({
      email: 'test@example.com',
      price: 100000,
    })
    r1.assertStatus(422)

    // Missing email
    const r2 = await client.post(`/api/offer-intake/${link.token}`).json({
      fullName: 'Test',
      price: 100000,
    })
    r2.assertStatus(422)

    // Missing price
    const r3 = await client.post(`/api/offer-intake/${link.token}`).json({
      fullName: 'Test',
      email: 'test@example.com',
    })
    r3.assertStatus(422)
  })

  test('returns 422 for invalid email', async ({ client }) => {
    const { user, transaction } = await setupTransaction()
    const link = await createOfferIntakeLink(transaction.id, user.id)

    const response = await client.post(`/api/offer-intake/${link.token}`).json({
      fullName: 'Test',
      email: 'not-an-email',
      price: 100000,
    })

    response.assertStatus(422)
  })

  test('returns 422 for negative price', async ({ client }) => {
    const { user, transaction } = await setupTransaction()
    const link = await createOfferIntakeLink(transaction.id, user.id)

    const response = await client.post(`/api/offer-intake/${link.token}`).json({
      fullName: 'Test',
      email: 'test@example.com',
      price: -500,
    })

    response.assertStatus(422)
  })

  test('returns 422 for zero price', async ({ client }) => {
    const { user, transaction } = await setupTransaction()
    const link = await createOfferIntakeLink(transaction.id, user.id)

    const response = await client.post(`/api/offer-intake/${link.token}`).json({
      fullName: 'Test',
      email: 'test@example.com',
      price: 0,
    })

    response.assertStatus(422)
  })

  test('does not expose internal IDs in success response', async ({ client, assert }) => {
    const { user, transaction } = await setupTransaction()
    const link = await createOfferIntakeLink(transaction.id, user.id)

    const response = await client.post(`/api/offer-intake/${link.token}`).json({
      fullName: 'Secure User',
      email: 'secure@example.com',
      price: 350000,
    })

    response.assertStatus(201)
    const body = response.body()
    // Should not leak offerId, partyId, transactionId
    assert.notProperty(body.data, 'offerId')
    assert.notProperty(body.data, 'partyId')
    assert.notProperty(body.data, 'transactionId')
  })

  test('multiple submissions create separate parties and offers', async ({ client, assert }) => {
    const { user, transaction } = await setupTransaction()
    const link = await createOfferIntakeLink(transaction.id, user.id)

    await client.post(`/api/offer-intake/${link.token}`).json({
      fullName: 'Buyer One',
      email: 'one@example.com',
      price: 400000,
    })

    await client.post(`/api/offer-intake/${link.token}`).json({
      fullName: 'Buyer Two',
      email: 'two@example.com',
      price: 420000,
    })

    const parties = await TransactionParty.query()
      .where('transaction_id', transaction.id)
      .where('role', 'buyer')
    assert.lengthOf(parties, 2)

    const offers = await Offer.query().where('transaction_id', transaction.id)
    assert.lengthOf(offers, 2)
  })
})

// =============================================
// D35 — Share Link linkType filter
// =============================================

test.group('Share Links - linkType filter', (group) => {
  group.each.setup(async () => {
    mail.fake()
    await truncateAll()
  })

  group.each.teardown(async () => {
    mail.restore()
  })

  test('GET share-link with linkType filter returns correct type', async ({ client, assert }) => {
    const { user, transaction } = await setupTransaction()

    // Create both types
    await createOfferIntakeLink(transaction.id, user.id)
    await TransactionShareLink.create({
      transactionId: transaction.id,
      token: cuid(),
      linkType: 'viewer',
      role: 'viewer',
      isActive: true,
      expiresAt: null,
      passwordHash: null,
      createdBy: user.id,
      accessCount: 0,
    })

    // Query for offer_intake
    const r1 = await withAuth(
      client.get(`/api/transactions/${transaction.id}/share-link?linkType=offer_intake`),
      user.id
    )
    r1.assertStatus(200)
    const body1 = r1.body()
    assert.equal(body1.data.shareLink.linkType, 'offer_intake')

    // Query for viewer
    const r2 = await withAuth(
      client.get(`/api/transactions/${transaction.id}/share-link?linkType=viewer`),
      user.id
    )
    r2.assertStatus(200)
    const body2 = r2.body()
    assert.equal(body2.data.shareLink.linkType, 'viewer')
  })

  test('GET share-link without filter returns most recent link', async ({ client, assert }) => {
    const { user, transaction } = await setupTransaction()

    await TransactionShareLink.create({
      transactionId: transaction.id,
      token: cuid(),
      linkType: 'viewer',
      role: 'viewer',
      isActive: true,
      expiresAt: null,
      passwordHash: null,
      createdBy: user.id,
      accessCount: 0,
    })

    const response = await withAuth(
      client.get(`/api/transactions/${transaction.id}/share-link`),
      user.id
    )
    response.assertStatus(200)
    const body = response.body()
    assert.isNotNull(body.data.shareLink)
  })

  test('POST share-link with linkType=offer_intake creates correct type', async ({
    client,
    assert,
  }) => {
    const { user, transaction } = await setupTransaction()

    const response = await withAuth(
      client.post(`/api/transactions/${transaction.id}/share-link`),
      user.id
    ).json({
      linkType: 'offer_intake',
    })

    response.assertStatus(201)
    const body = response.body()
    assert.equal(body.data.shareLink.linkType, 'offer_intake')
  })

  test('creating offer_intake link does not deactivate viewer link', async ({
    client,
    assert,
  }) => {
    const { user, transaction } = await setupTransaction()

    // Create a viewer link first
    const viewerLink = await TransactionShareLink.create({
      transactionId: transaction.id,
      token: cuid(),
      linkType: 'viewer',
      role: 'viewer',
      isActive: true,
      expiresAt: null,
      passwordHash: null,
      createdBy: user.id,
      accessCount: 0,
    })

    // Now create offer_intake link
    await withAuth(
      client.post(`/api/transactions/${transaction.id}/share-link`),
      user.id
    ).json({
      linkType: 'offer_intake',
    })

    // Verify viewer link is still active
    await viewerLink.refresh()
    assert.isTrue(viewerLink.isActive)
  })

  test('creating offer_intake link deactivates previous offer_intake link', async ({
    client,
    assert,
  }) => {
    const { user, transaction } = await setupTransaction()

    // Create first offer_intake link
    const firstLink = await createOfferIntakeLink(transaction.id, user.id)
    assert.isTrue(firstLink.isActive)

    // Create second offer_intake link via API
    await withAuth(
      client.post(`/api/transactions/${transaction.id}/share-link`),
      user.id
    ).json({
      linkType: 'offer_intake',
    })

    // Verify first link is now deactivated
    await firstLink.refresh()
    assert.isFalse(firstLink.isActive)
  })
})

// =============================================
// Bug fix P4: Party coherence returns 400 not 500
// =============================================

test.group('Offers - Party Coherence Error (P4 fix)', (group) => {
  group.each.setup(async () => {
    mail.fake()
    await truncateAll()
  })

  group.each.teardown(async () => {
    mail.restore()
  })

  test('store with invalid fromPartyId returns 400 E_PARTY_COHERENCE', async ({
    client,
  }) => {
    const { user, transaction } = await setupTransaction()

    const response = await withAuth(
      client.post(`/api/transactions/${transaction.id}/offers`),
      user.id
    ).json({
      price: 300000,
      direction: 'buyer_to_seller',
      fromPartyId: 99999, // Non-existent party
    })

    // Should be 400, not 500
    response.assertStatus(400)
    response.assertBodyContains({
      success: false,
      error: { code: 'E_PARTY_COHERENCE' },
    })
  })

  test('addRevision with invalid toPartyId returns 400 E_PARTY_COHERENCE', async ({
    client,
  }) => {
    const { user, transaction } = await setupTransaction()

    // Create a valid offer first
    const { OfferService } = await import('#services/offer_service')
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
      toPartyId: 99999, // Non-existent party
    })

    response.assertStatus(400)
    response.assertBodyContains({
      success: false,
      error: { code: 'E_PARTY_COHERENCE' },
    })
  })
})
