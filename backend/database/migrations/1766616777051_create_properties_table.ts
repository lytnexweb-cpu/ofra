import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'properties'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('owner_user_id').unsigned().references('id').inTable('users').onDelete('CASCADE')
      table.string('address').notNullable()
      table.string('city').notNullable()
      table.string('postal_code').notNullable()
      table.string('property_type').nullable()
      table.text('notes').nullable()
      table.timestamp('created_at')
      table.timestamp('updated_at')

      table.index('owner_user_id')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
