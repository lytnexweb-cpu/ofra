import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'admin_tasks'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE')
      table.integer('author_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE')
      table.string('title', 255).notNullable()
      table.date('due_date').nullable()
      table.boolean('completed').defaultTo(false).notNullable()
      table.timestamp('completed_at').nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['user_id', 'completed', 'due_date'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
