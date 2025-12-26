import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'transaction_status_histories'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('transaction_id').unsigned().references('id').inTable('transactions').onDelete('CASCADE')
      table.integer('changed_by_user_id').unsigned().references('id').inTable('users').onDelete('CASCADE')
      table.enum('from_status', [
        'consultation',
        'offer',
        'accepted',
        'conditions',
        'notary',
        'closing',
        'completed',
        'canceled',
      ]).nullable()
      table.enum('to_status', [
        'consultation',
        'offer',
        'accepted',
        'conditions',
        'notary',
        'closing',
        'completed',
        'canceled',
      ]).notNullable()
      table.text('note').nullable()
      table.timestamp('created_at')

      table.index('transaction_id')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
