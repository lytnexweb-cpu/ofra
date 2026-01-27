import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.dropTableIfExists('template_conditions')
    this.schema.dropTableIfExists('transaction_templates')
  }

  async down() {
    // Old tables are not recreated — this is a one-way cleanup migration
  }
}
