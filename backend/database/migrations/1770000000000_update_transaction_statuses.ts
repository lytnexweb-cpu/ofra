import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Migration: Update transaction statuses to new pipeline
 *
 * Old: consultation → offer → accepted → conditions → notary → closing → completed → canceled
 * New: active → offer → conditional → firm → closing → completed → cancelled
 *
 * Mapping:
 *   consultation → active
 *   offer → offer (unchanged)
 *   accepted → offer (merged: accepted offer still in offer stage, offer entity tracks acceptance)
 *   conditions → conditional
 *   notary → firm
 *   closing → closing (unchanged)
 *   completed → completed (unchanged)
 *   canceled → cancelled (spelling fix)
 */
export default class extends BaseSchema {
  async up() {
    // 1. Drop CHECK constraints on transactions.status
    await this.db.rawQuery(`
      ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_status_check;
    `)

    // 2. Update transaction status values
    await this.db.rawQuery(`UPDATE transactions SET status = 'active' WHERE status = 'consultation'`)
    await this.db.rawQuery(`UPDATE transactions SET status = 'offer' WHERE status = 'accepted'`)
    await this.db.rawQuery(
      `UPDATE transactions SET status = 'conditional' WHERE status = 'conditions'`
    )
    await this.db.rawQuery(`UPDATE transactions SET status = 'firm' WHERE status = 'notary'`)
    await this.db.rawQuery(`UPDATE transactions SET status = 'cancelled' WHERE status = 'canceled'`)

    // 3. Add new CHECK constraint for transactions.status
    await this.db.rawQuery(`
      ALTER TABLE transactions ADD CONSTRAINT transactions_status_check
      CHECK (status IN ('active', 'offer', 'conditional', 'firm', 'closing', 'completed', 'cancelled'))
    `)

    // 4. Update condition stages
    await this.db.rawQuery(`
      ALTER TABLE conditions DROP CONSTRAINT IF EXISTS conditions_stage_check;
    `)

    await this.db.rawQuery(`UPDATE conditions SET stage = 'active' WHERE stage = 'consultation'`)
    await this.db.rawQuery(`UPDATE conditions SET stage = 'offer' WHERE stage = 'accepted'`)
    await this.db.rawQuery(
      `UPDATE conditions SET stage = 'conditional' WHERE stage = 'conditions'`
    )
    await this.db.rawQuery(`UPDATE conditions SET stage = 'firm' WHERE stage = 'notary'`)
    await this.db.rawQuery(`UPDATE conditions SET stage = 'cancelled' WHERE stage = 'canceled'`)

    await this.db.rawQuery(`
      ALTER TABLE conditions ADD CONSTRAINT conditions_stage_check
      CHECK (stage IN ('active', 'offer', 'conditional', 'firm', 'closing', 'completed', 'cancelled'))
    `)

    // 5. Update transaction_status_histories
    // from_status
    await this.db.rawQuery(
      `UPDATE transaction_status_histories SET from_status = 'active' WHERE from_status = 'consultation'`
    )
    await this.db.rawQuery(
      `UPDATE transaction_status_histories SET from_status = 'offer' WHERE from_status = 'accepted'`
    )
    await this.db.rawQuery(
      `UPDATE transaction_status_histories SET from_status = 'conditional' WHERE from_status = 'conditions'`
    )
    await this.db.rawQuery(
      `UPDATE transaction_status_histories SET from_status = 'firm' WHERE from_status = 'notary'`
    )
    await this.db.rawQuery(
      `UPDATE transaction_status_histories SET from_status = 'cancelled' WHERE from_status = 'canceled'`
    )
    // to_status
    await this.db.rawQuery(
      `UPDATE transaction_status_histories SET to_status = 'active' WHERE to_status = 'consultation'`
    )
    await this.db.rawQuery(
      `UPDATE transaction_status_histories SET to_status = 'offer' WHERE to_status = 'accepted'`
    )
    await this.db.rawQuery(
      `UPDATE transaction_status_histories SET to_status = 'conditional' WHERE to_status = 'conditions'`
    )
    await this.db.rawQuery(
      `UPDATE transaction_status_histories SET to_status = 'firm' WHERE to_status = 'notary'`
    )
    await this.db.rawQuery(
      `UPDATE transaction_status_histories SET to_status = 'cancelled' WHERE to_status = 'canceled'`
    )

    // 6. Update template_conditions stages
    await this.db.rawQuery(`
      ALTER TABLE template_conditions DROP CONSTRAINT IF EXISTS template_conditions_stage_check;
    `)

    await this.db.rawQuery(
      `UPDATE template_conditions SET stage = 'active' WHERE stage = 'consultation'`
    )
    await this.db.rawQuery(
      `UPDATE template_conditions SET stage = 'offer' WHERE stage = 'accepted'`
    )
    await this.db.rawQuery(
      `UPDATE template_conditions SET stage = 'conditional' WHERE stage = 'conditions'`
    )
    await this.db.rawQuery(`UPDATE template_conditions SET stage = 'firm' WHERE stage = 'notary'`)
    await this.db.rawQuery(
      `UPDATE template_conditions SET stage = 'cancelled' WHERE stage = 'canceled'`
    )

    await this.db.rawQuery(`
      ALTER TABLE template_conditions ADD CONSTRAINT template_conditions_stage_check
      CHECK (stage IN ('active', 'offer', 'conditional', 'firm', 'closing', 'completed', 'cancelled'))
    `)
  }

  async down() {
    // Reverse: new → old status mapping
    // Drop new constraints
    await this.db.rawQuery(
      `ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_status_check;`
    )
    await this.db.rawQuery(
      `ALTER TABLE conditions DROP CONSTRAINT IF EXISTS conditions_stage_check;`
    )
    await this.db.rawQuery(
      `ALTER TABLE template_conditions DROP CONSTRAINT IF EXISTS template_conditions_stage_check;`
    )

    // Reverse transactions
    await this.db.rawQuery(`UPDATE transactions SET status = 'consultation' WHERE status = 'active'`)
    await this.db.rawQuery(
      `UPDATE transactions SET status = 'conditions' WHERE status = 'conditional'`
    )
    await this.db.rawQuery(`UPDATE transactions SET status = 'notary' WHERE status = 'firm'`)
    await this.db.rawQuery(`UPDATE transactions SET status = 'canceled' WHERE status = 'cancelled'`)

    // Reverse conditions
    await this.db.rawQuery(`UPDATE conditions SET stage = 'consultation' WHERE stage = 'active'`)
    await this.db.rawQuery(`UPDATE conditions SET stage = 'conditions' WHERE stage = 'conditional'`)
    await this.db.rawQuery(`UPDATE conditions SET stage = 'notary' WHERE stage = 'firm'`)
    await this.db.rawQuery(`UPDATE conditions SET stage = 'canceled' WHERE stage = 'cancelled'`)

    // Reverse transaction_status_histories
    await this.db.rawQuery(
      `UPDATE transaction_status_histories SET from_status = 'consultation' WHERE from_status = 'active'`
    )
    await this.db.rawQuery(
      `UPDATE transaction_status_histories SET from_status = 'conditions' WHERE from_status = 'conditional'`
    )
    await this.db.rawQuery(
      `UPDATE transaction_status_histories SET from_status = 'notary' WHERE from_status = 'firm'`
    )
    await this.db.rawQuery(
      `UPDATE transaction_status_histories SET from_status = 'canceled' WHERE from_status = 'cancelled'`
    )
    await this.db.rawQuery(
      `UPDATE transaction_status_histories SET to_status = 'consultation' WHERE to_status = 'active'`
    )
    await this.db.rawQuery(
      `UPDATE transaction_status_histories SET to_status = 'conditions' WHERE to_status = 'conditional'`
    )
    await this.db.rawQuery(
      `UPDATE transaction_status_histories SET to_status = 'notary' WHERE to_status = 'firm'`
    )
    await this.db.rawQuery(
      `UPDATE transaction_status_histories SET to_status = 'canceled' WHERE to_status = 'cancelled'`
    )

    // Reverse template_conditions
    await this.db.rawQuery(
      `UPDATE template_conditions SET stage = 'consultation' WHERE stage = 'active'`
    )
    await this.db.rawQuery(
      `UPDATE template_conditions SET stage = 'conditions' WHERE stage = 'conditional'`
    )
    await this.db.rawQuery(`UPDATE template_conditions SET stage = 'notary' WHERE stage = 'firm'`)
    await this.db.rawQuery(
      `UPDATE template_conditions SET stage = 'canceled' WHERE stage = 'cancelled'`
    )

    // Restore old constraints
    await this.db.rawQuery(`
      ALTER TABLE transactions ADD CONSTRAINT transactions_status_check
      CHECK (status IN ('consultation', 'offer', 'accepted', 'conditions', 'notary', 'closing', 'completed', 'canceled'))
    `)
    await this.db.rawQuery(`
      ALTER TABLE conditions ADD CONSTRAINT conditions_stage_check
      CHECK (stage IN ('consultation', 'offer', 'accepted', 'conditions', 'notary', 'closing', 'completed', 'canceled'))
    `)
    await this.db.rawQuery(`
      ALTER TABLE template_conditions ADD CONSTRAINT template_conditions_stage_check
      CHECK (stage IN ('consultation', 'offer', 'accepted', 'conditions', 'notary', 'closing', 'completed', 'canceled'))
    `)
  }
}
