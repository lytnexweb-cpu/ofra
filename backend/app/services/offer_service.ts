import { DateTime } from 'luxon'
import Offer, { type OfferStatus } from '#models/offer'
import OfferRevision from '#models/offer_revision'
import Transaction from '#models/transaction'
import TransactionParty from '#models/transaction_party'
import { WorkflowEngineService } from '#services/workflow_engine_service'

/**
 * OfferService
 *
 * Business logic for managing offers and negotiation rounds.
 *
 * Business rules:
 * - A transaction can have multiple offers
 * - Only one offer can be in 'accepted' status per transaction
 * - When an offer is accepted, all other pending offers are automatically rejected
 * - Transaction must have an accepted offer before moving to 'conditional' or 'firm'
 * - Each offer can have multiple revisions (negotiation rounds)
 */
export class OfferService {
  /**
   * Create a new offer for a transaction with an initial revision.
   */
  /**
   * Validate that fromPartyId/toPartyId are coherent with the direction and transaction.
   */
  private static async validatePartyCoherence(
    transactionId: number,
    direction: 'buyer_to_seller' | 'seller_to_buyer',
    fromPartyId?: number | null,
    toPartyId?: number | null
  ): Promise<{ fromPartyId: number | null; toPartyId: number | null }> {
    if (!fromPartyId && !toPartyId) {
      return { fromPartyId: null, toPartyId: null }
    }

    if (fromPartyId) {
      const fromParty = await TransactionParty.find(fromPartyId)
      if (!fromParty) {
        throw new Error(`Party not found: fromPartyId=${fromPartyId}`)
      }
      if (fromParty.transactionId !== transactionId) {
        throw new Error('fromParty must belong to the same transaction')
      }
      const expectedRole = direction === 'buyer_to_seller' ? 'buyer' : 'seller'
      if (fromParty.role !== expectedRole) {
        throw new Error(`Direction ${direction} requires fromParty role=${expectedRole}, got ${fromParty.role}`)
      }
    }

    if (toPartyId) {
      const toParty = await TransactionParty.find(toPartyId)
      if (!toParty) {
        throw new Error(`Party not found: toPartyId=${toPartyId}`)
      }
      if (toParty.transactionId !== transactionId) {
        throw new Error('toParty must belong to the same transaction')
      }
      const expectedRole = direction === 'buyer_to_seller' ? 'seller' : 'buyer'
      if (toParty.role !== expectedRole) {
        throw new Error(`Direction ${direction} requires toParty role=${expectedRole}, got ${toParty.role}`)
      }
    }

    return { fromPartyId: fromPartyId ?? null, toPartyId: toPartyId ?? null }
  }

  public static async createOffer(params: {
    transactionId: number
    price: number
    deposit?: number
    financingAmount?: number
    expiryAt?: DateTime
    notes?: string
    direction?: 'buyer_to_seller' | 'seller_to_buyer'
    createdByUserId: number
    conditionIds?: number[]
    fromPartyId?: number
    toPartyId?: number
    buyerPartyId?: number
    sellerPartyId?: number
  }): Promise<Offer> {
    const direction = params.direction || 'buyer_to_seller'

    const { fromPartyId, toPartyId } = await this.validatePartyCoherence(
      params.transactionId,
      direction,
      params.fromPartyId,
      params.toPartyId
    )

    // Validate buyer/seller party coherence if provided
    if (params.buyerPartyId) {
      const buyerParty = await TransactionParty.find(params.buyerPartyId)
      if (!buyerParty) throw new Error(`Party not found: buyerPartyId=${params.buyerPartyId}`)
      if (buyerParty.transactionId !== params.transactionId) throw new Error('buyerParty must belong to the same transaction')
      if (buyerParty.role !== 'buyer') throw new Error(`buyerPartyId requires role=buyer, got ${buyerParty.role}`)
    }
    if (params.sellerPartyId) {
      const sellerParty = await TransactionParty.find(params.sellerPartyId)
      if (!sellerParty) throw new Error(`Party not found: sellerPartyId=${params.sellerPartyId}`)
      if (sellerParty.transactionId !== params.transactionId) throw new Error('sellerParty must belong to the same transaction')
      if (sellerParty.role !== 'seller') throw new Error(`sellerPartyId requires role=seller, got ${sellerParty.role}`)
    }

    const offer = await Offer.create({
      transactionId: params.transactionId,
      status: 'received',
      buyerPartyId: params.buyerPartyId ?? null,
      sellerPartyId: params.sellerPartyId ?? null,
      initialDirection: direction,
    })

    const revision = await OfferRevision.create({
      offerId: offer.id,
      revisionNumber: 1,
      price: params.price,
      deposit: params.deposit ?? null,
      financingAmount: params.financingAmount ?? null,
      expiryAt: params.expiryAt ?? null,
      notes: params.notes ?? null,
      direction,
      createdByUserId: params.createdByUserId,
      fromPartyId,
      toPartyId,
    })

    if (params.conditionIds && params.conditionIds.length > 0) {
      await revision.related('conditions').attach(params.conditionIds)
    }

    await offer.load('buyerParty')
    await offer.load('sellerParty')
    await offer.load('revisions', (query) =>
      query.preload('conditions').preload('fromParty').preload('toParty')
    )
    return offer
  }

  /**
   * Add a counter/negotiation revision to an existing offer.
   * Changes offer status to 'countered'.
   */
  public static async addRevision(params: {
    offerId: number
    price: number
    deposit?: number
    financingAmount?: number
    expiryAt?: DateTime
    notes?: string
    direction: 'buyer_to_seller' | 'seller_to_buyer'
    createdByUserId: number
    conditionIds?: number[]
    fromPartyId?: number
    toPartyId?: number
  }): Promise<OfferRevision> {
    const offer = await Offer.findOrFail(params.offerId)

    // Can only counter if offer is received or already countered
    if (!['received', 'countered'].includes(offer.status)) {
      throw new Error(`Cannot add revision to offer with status '${offer.status}'`)
    }

    // Get the next revision number
    const lastRevision = await OfferRevision.query()
      .where('offer_id', offer.id)
      .orderBy('revision_number', 'desc')
      .first()

    const nextRevisionNumber = (lastRevision?.revisionNumber ?? 0) + 1

    // Auto-invert party IDs from last revision if not explicitly provided
    let fromPartyId = params.fromPartyId ?? null
    let toPartyId = params.toPartyId ?? null
    if (!params.fromPartyId && !params.toPartyId && lastRevision) {
      fromPartyId = lastRevision.toPartyId
      toPartyId = lastRevision.fromPartyId
    }

    // Validate coherence if we have party IDs
    const validated = await this.validatePartyCoherence(
      offer.transactionId,
      params.direction,
      fromPartyId,
      toPartyId
    )

    const revision = await OfferRevision.create({
      offerId: offer.id,
      revisionNumber: nextRevisionNumber,
      price: params.price,
      deposit: params.deposit ?? null,
      financingAmount: params.financingAmount ?? null,
      expiryAt: params.expiryAt ?? null,
      notes: params.notes ?? null,
      direction: params.direction,
      createdByUserId: params.createdByUserId,
      fromPartyId: validated.fromPartyId,
      toPartyId: validated.toPartyId,
    })

    if (params.conditionIds && params.conditionIds.length > 0) {
      await revision.related('conditions').attach(params.conditionIds)
    }

    // Update offer status to countered
    offer.status = 'countered'
    await offer.save()

    return revision
  }

  /**
   * Accept an offer. Rejects all other pending offers, updates sale price,
   * and auto-advances the workflow step.
   */
  public static async acceptOffer(
    offerId: number,
    userId: number
  ): Promise<{
    offer: Offer
    advanceResult: { newStep: any } | null
  }> {
    const offer = await Offer.findOrFail(offerId)

    if (!['received', 'countered'].includes(offer.status)) {
      throw new Error(`Cannot accept offer with status '${offer.status}'`)
    }

    // Check for expiry on the latest revision
    const latestRevision = await OfferRevision.query()
      .where('offer_id', offer.id)
      .orderBy('revision_number', 'desc')
      .first()

    if (latestRevision?.expiryAt && latestRevision.expiryAt < DateTime.now()) {
      throw new Error('Cannot accept offer: the latest revision has expired')
    }

    // Auto-populate buyerPartyId/sellerPartyId from the latest revision if absent
    if (latestRevision && (!offer.buyerPartyId || !offer.sellerPartyId)) {
      if (!offer.buyerPartyId) {
        const buyerId = latestRevision.direction === 'buyer_to_seller'
          ? latestRevision.fromPartyId
          : latestRevision.toPartyId
        if (buyerId) offer.buyerPartyId = buyerId
      }
      if (!offer.sellerPartyId) {
        const sellerId = latestRevision.direction === 'buyer_to_seller'
          ? latestRevision.toPartyId
          : latestRevision.fromPartyId
        if (sellerId) offer.sellerPartyId = sellerId
      }
    }

    // Accept this offer
    offer.status = 'accepted'
    offer.acceptedAt = DateTime.now()
    await offer.save()

    // Reject all other pending offers for the same transaction
    await Offer.query()
      .where('transaction_id', offer.transactionId)
      .whereNot('id', offer.id)
      .whereIn('status', ['received', 'countered'])
      .update({ status: 'rejected' })

    // Update transaction sale price with the accepted offer price
    if (latestRevision) {
      const transaction = await Transaction.findOrFail(offer.transactionId)
      transaction.salePrice = latestRevision.price
      await transaction.save()
    }

    // Auto-advance workflow step (best-effort: don't fail accept if advance fails)
    let advanceResult: { newStep: any } | null = null
    try {
      const result = await WorkflowEngineService.advanceStep(
        offer.transactionId,
        userId,
        { skipBlockingCheck: true }
      )
      advanceResult = { newStep: result.newStep }
    } catch (error) {
      console.warn('[OfferService] Auto-advance failed after offer accept:', (error as Error).message)
    }

    await offer.load('buyerParty')
    await offer.load('sellerParty')
    await offer.load('revisions', (query) =>
      query.preload('fromParty').preload('toParty')
    )
    return { offer, advanceResult }
  }

  /**
   * Reject an offer.
   */
  public static async rejectOffer(offerId: number): Promise<Offer> {
    const offer = await Offer.findOrFail(offerId)

    if (!['received', 'countered'].includes(offer.status)) {
      throw new Error(`Cannot reject offer with status '${offer.status}'`)
    }

    offer.status = 'rejected'
    await offer.save()

    return offer
  }

  /**
   * Withdraw an offer.
   */
  public static async withdrawOffer(offerId: number): Promise<Offer> {
    const offer = await Offer.findOrFail(offerId)

    if (!['received', 'countered'].includes(offer.status)) {
      throw new Error(`Cannot withdraw offer with status '${offer.status}'`)
    }

    offer.status = 'withdrawn'
    await offer.save()

    return offer
  }

  /**
   * Check if a transaction has an accepted offer.
   * Required before transitioning to 'conditional' or 'firm'.
   */
  public static async hasAcceptedOffer(transactionId: number): Promise<boolean> {
    const acceptedOffer = await Offer.query()
      .where('transaction_id', transactionId)
      .where('status', 'accepted')
      .first()

    return acceptedOffer !== null
  }

  /**
   * Get the accepted offer for a transaction.
   */
  public static async getAcceptedOffer(transactionId: number): Promise<Offer | null> {
    return Offer.query()
      .where('transaction_id', transactionId)
      .where('status', 'accepted')
      .preload('buyerParty')
      .preload('sellerParty')
      .preload('revisions', (query) =>
        query.preload('fromParty').preload('toParty').orderBy('revision_number', 'asc')
      )
      .first()
  }

  /**
   * Get all offers for a transaction.
   */
  public static async getOffers(transactionId: number): Promise<Offer[]> {
    return Offer.query()
      .where('transaction_id', transactionId)
      .preload('buyerParty')
      .preload('sellerParty')
      .preload('revisions', (query) =>
        query
          .preload('conditions')
          .preload('fromParty')
          .preload('toParty')
          .orderBy('revision_number', 'asc')
      )
      .orderBy('created_at', 'desc')
  }

  /**
   * Check and expire offers that have passed their expiry date.
   * Checks the latest revision's expiry_at for each pending offer.
   */
  public static async expireOffers(transactionId: number): Promise<number> {
    const pendingOffers = await Offer.query()
      .where('transaction_id', transactionId)
      .whereIn('status', ['received', 'countered'])
      .preload('revisions', (query) => query.orderBy('revision_number', 'desc').limit(1))

    let expiredCount = 0
    for (const offer of pendingOffers) {
      const latestRevision = offer.revisions[0]
      if (latestRevision?.expiryAt && latestRevision.expiryAt < DateTime.now()) {
        offer.status = 'expired' as OfferStatus
        await offer.save()
        expiredCount++
      }
    }

    return expiredCount
  }
}
