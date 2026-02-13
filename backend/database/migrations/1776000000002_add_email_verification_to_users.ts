import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.boolean('email_verified').notNullable().defaultTo(false)
      table.string('email_verification_token', 255).nullable()
      table.timestamp('email_verification_expires').nullable()
    })

    // Mark all existing users as verified
    this.defer(async (db) => {
      await db.from('users').update({ email_verified: true })
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('email_verified')
      table.dropColumn('email_verification_token')
      table.dropColumn('email_verification_expires')
    })
  }
}
