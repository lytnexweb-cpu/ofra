import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'fintrac_records'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table
        .integer('transaction_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('transactions')
        .onDelete('CASCADE')

      table
        .integer('party_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('transaction_parties')
        .onDelete('CASCADE')

      table.date('date_of_birth').nullable()

      table
        .enum('id_type', [
          'drivers_license',
          'canadian_passport',
          'foreign_passport',
          'citizenship_card',
          'other_government_id',
        ])
        .nullable()

      table.string('id_number', 100).nullable()
      table.string('occupation', 255).nullable()
      table.text('source_of_funds').nullable()

      table.timestamp('verified_at').nullable()

      table
        .integer('verified_by_user_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')

      table.text('notes').nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()

      table.unique(['transaction_id', 'party_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
