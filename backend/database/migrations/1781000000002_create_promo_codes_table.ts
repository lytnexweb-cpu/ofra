import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'promo_codes'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('code', 50).notNullable().unique()
      table.enum('type', ['percent', 'fixed', 'free_months']).notNullable()
      table.decimal('value', 10, 2).notNullable()
      table.integer('max_uses').nullable()
      table.integer('current_uses').notNullable().defaultTo(0)
      table.date('valid_from').nullable()
      table.date('valid_until').nullable()
      table.jsonb('eligible_plans').nullable()
      table.boolean('active').notNullable().defaultTo(true)
      table.string('stripe_coupon_id', 255).nullable()
      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').notNullable().defaultTo(this.now())

      table.index(['active', 'code'], 'idx_promo_codes_active_code')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
