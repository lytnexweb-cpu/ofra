import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'offer_revisions'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.date('deposit_deadline').nullable()
      table.date('closing_date').nullable()
      table.boolean('inspection_required').defaultTo(false)
      table.string('inspection_delay', 50).nullable()
      table.text('inclusions').nullable()
      table.text('message').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('deposit_deadline')
      table.dropColumn('closing_date')
      table.dropColumn('inspection_required')
      table.dropColumn('inspection_delay')
      table.dropColumn('inclusions')
      table.dropColumn('message')
    })
  }
}
