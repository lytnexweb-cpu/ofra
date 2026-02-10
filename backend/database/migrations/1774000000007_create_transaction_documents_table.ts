import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'transaction_documents'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('transaction_id').unsigned().notNullable().references('id').inTable('transactions').onDelete('CASCADE')
      table.integer('condition_id').unsigned().nullable().references('id').inTable('conditions').onDelete('SET NULL')
      table.string('category', 30).notNullable().defaultTo('other')
      table.string('name', 255).notNullable()
      table.string('file_url', 2048).nullable()
      table.integer('file_size').unsigned().nullable()
      table.string('mime_type', 100).nullable()
      table.string('status', 20).notNullable().defaultTo('missing')
      table.integer('version').unsigned().defaultTo(1)
      table.integer('parent_document_id').unsigned().nullable().references('id').inTable('transaction_documents').onDelete('SET NULL')
      table.jsonb('tags').nullable()
      table.text('rejection_reason').nullable()
      table.integer('validated_by').unsigned().nullable().references('id').inTable('users').onDelete('SET NULL')
      table.timestamp('validated_at').nullable()
      table.integer('uploaded_by').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE')
      table.timestamp('created_at')
      table.timestamp('updated_at')

      table.index(['transaction_id'])
      table.index(['condition_id'])
      table.index(['status'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
