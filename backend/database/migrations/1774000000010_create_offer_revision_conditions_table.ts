import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'offer_revision_conditions'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('revision_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('offer_revisions')
        .onDelete('CASCADE')
      table
        .integer('condition_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('conditions')
        .onDelete('CASCADE')
      table.timestamp('created_at', { useTz: true }).defaultTo(this.now())

      table.unique(['revision_id', 'condition_id'])
      table.index(['revision_id'])
      table.index(['condition_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
