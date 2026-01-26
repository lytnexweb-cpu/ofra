import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Data migration: Extract existing offer fields from transactions into offers/offer_revisions.
 * Then drop the old offer columns from transactions.
 *
 * For each transaction with offer_price:
 * - Create an offer record
 * - Create a revision for the initial offer (buyer_to_seller)
 * - If counter_offer_enabled + counter_offer_price, create a second revision (seller_to_buyer)
 * - Offer status based on transaction progress:
 *   - conditional/firm/closing/completed → accepted
 *   - offer → received
 *   - cancelled → rejected
 */
export default class extends BaseSchema {
  async up() {
    // 1. Migrate existing offer data
    const transactions = await this.db.rawQuery(`
      SELECT id, offer_price, counter_offer_enabled, counter_offer_price,
             offer_expiry_at, status, owner_user_id
      FROM transactions
      WHERE offer_price IS NOT NULL
    `)

    for (const txn of transactions.rows) {
      // Determine offer status based on transaction progress
      let offerStatus = 'received'
      let acceptedAt = null
      if (['conditional', 'firm', 'closing', 'completed'].includes(txn.status)) {
        offerStatus = 'accepted'
        acceptedAt = txn.offer_expiry_at || new Date().toISOString()
      } else if (txn.status === 'cancelled') {
        offerStatus = 'rejected'
      }

      // Create offer
      const offerResult = await this.db.rawQuery(
        `INSERT INTO offers (transaction_id, status, accepted_at, created_at, updated_at)
         VALUES ($1, $2, $3, NOW(), NOW())
         RETURNING id`,
        [txn.id, offerStatus, acceptedAt]
      )
      const offerId = offerResult.rows[0].id

      // Create initial revision (buyer's offer)
      await this.db.rawQuery(
        `INSERT INTO offer_revisions (offer_id, revision_number, price, expiry_at, direction, created_by_user_id, created_at)
         VALUES ($1, 1, $2, $3, 'buyer_to_seller', $4, NOW())`,
        [offerId, txn.offer_price, txn.offer_expiry_at, txn.owner_user_id]
      )

      // If counter offer exists, create second revision
      if (txn.counter_offer_enabled && txn.counter_offer_price) {
        await this.db.rawQuery(
          `INSERT INTO offer_revisions (offer_id, revision_number, price, direction, created_by_user_id, created_at)
           VALUES ($1, 2, $2, 'seller_to_buyer', $3, NOW())`,
          [offerId, txn.counter_offer_price, txn.owner_user_id]
        )
      }
    }

    // 2. Drop old offer columns from transactions
    this.schema.alterTable('transactions', (table) => {
      table.dropColumn('offer_price')
      table.dropColumn('counter_offer_enabled')
      table.dropColumn('counter_offer_price')
      table.dropColumn('offer_expiry_at')
    })
  }

  async down() {
    // Re-add old columns
    this.schema.alterTable('transactions', (table) => {
      table.decimal('offer_price', 12, 2).nullable()
      table.boolean('counter_offer_enabled').defaultTo(false)
      table.decimal('counter_offer_price', 12, 2).nullable()
      table.timestamp('offer_expiry_at', { useTz: true }).nullable()
    })

    // Attempt to restore data from offers/offer_revisions back to transactions
    // Get the first revision price for each transaction's first offer
    const offers = await this.db.rawQuery(`
      SELECT o.transaction_id, o.status,
             r1.price as offer_price, r1.expiry_at as offer_expiry_at,
             r2.price as counter_offer_price
      FROM offers o
      LEFT JOIN offer_revisions r1 ON r1.offer_id = o.id AND r1.revision_number = 1
      LEFT JOIN offer_revisions r2 ON r2.offer_id = o.id AND r2.revision_number = 2 AND r2.direction = 'seller_to_buyer'
    `)

    for (const offer of offers.rows) {
      await this.db.rawQuery(
        `UPDATE transactions
         SET offer_price = $1,
             counter_offer_enabled = $2,
             counter_offer_price = $3,
             offer_expiry_at = $4
         WHERE id = $5`,
        [
          offer.offer_price,
          offer.counter_offer_price ? true : false,
          offer.counter_offer_price,
          offer.offer_expiry_at,
          offer.transaction_id,
        ]
      )
    }
  }
}
