import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'professional_contacts'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('agent_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE')
      table.string('name', 255).notNullable()
      table.string('role', 50).notNullable() // inspector, notary, lawyer, mortgage_broker, appraiser, other
      table.string('phone', 50).nullable()
      table.string('email', 255).nullable()
      table.string('company', 255).nullable()
      table.text('notes').nullable()
      table.timestamp('created_at')
      table.timestamp('updated_at')

      table.index(['agent_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
