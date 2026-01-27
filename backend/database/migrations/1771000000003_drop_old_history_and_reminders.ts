import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.dropTableIfExists('reminder_logs')
    this.schema.dropTableIfExists('transaction_status_histories')
  }

  async down() {
    // Old tables are not recreated — this is a one-way cleanup migration
  }
}
