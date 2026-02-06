import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Subscription status: trial, active, past_due, cancelled, expired
      // Default: trial (Programme Fondateur = 3 mois)
      table.string('subscription_status', 20).defaultTo('trial').notNullable()
      table.timestamp('subscription_started_at').nullable()
      table.timestamp('subscription_ends_at').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('subscription_status')
      table.dropColumn('subscription_started_at')
      table.dropColumn('subscription_ends_at')
    })
  }
}
