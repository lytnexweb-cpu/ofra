import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Profile information
      table.string('phone').nullable()
      table.string('agency').nullable()
      table.string('license_number').nullable()
      table.text('profile_photo').nullable() // Base64 or URL

      // Email signature customization
      table.text('email_signature').nullable()

      // Display preferences
      table.string('language').defaultTo('fr') // 'fr' or 'en'
      table.string('date_format').defaultTo('DD/MM/YYYY') // 'DD/MM/YYYY' or 'MM/DD/YYYY'
      table.string('timezone').defaultTo('America/Toronto')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('phone')
      table.dropColumn('agency')
      table.dropColumn('license_number')
      table.dropColumn('profile_photo')
      table.dropColumn('email_signature')
      table.dropColumn('language')
      table.dropColumn('date_format')
      table.dropColumn('timezone')
    })
  }
}
