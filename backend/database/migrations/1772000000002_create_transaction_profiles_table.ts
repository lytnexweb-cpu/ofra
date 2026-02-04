import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Migration: Create transaction_profiles table
 * Part of Conditions Engine Premium (D27)
 *
 * Profil de transaction (8 champs v1) - 1 row par transaction
 * Voir D1-transaction-profile-v1.md
 */
export default class extends BaseSchema {
  protected tableName = 'transaction_profiles'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      // PK = FK vers transactions
      table.integer('transaction_id').unsigned().primary()
        .references('id').inTable('transactions').onDelete('CASCADE')

      // Champs obligatoires (création)
      table.enum('property_type', ['house', 'condo', 'land']).notNullable()
      table.enum('property_context', ['urban', 'suburban', 'rural']).notNullable()
      table.boolean('is_financed').notNullable()

      // Champs conditionnels (rural)
      table.boolean('has_well').nullable()
      table.boolean('has_septic').nullable()
      table.enum('access_type', ['public', 'private', 'right_of_way']).nullable()

      // Champs conditionnels (condo)
      table.boolean('condo_docs_required').defaultTo(true)

      // Champs conditionnels (financé)
      table.boolean('appraisal_required').nullable() // NULL = "je ne sais pas encore"

      // Audit
      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').notNullable().defaultTo(this.now())
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
