import { BaseCommand, args } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import db from '@adonisjs/lucid/services/db'
import hash from '@adonisjs/core/services/hash'
import { DateTime } from 'luxon'

export default class CreateSuperadmin extends BaseCommand {
  static commandName = 'create:superadmin'
  static description = 'Create or update a superadmin user'

  static options: CommandOptions = {
    startApp: true,
  }

  @args.string({ description: 'Email address' })
  declare email: string

  @args.string({ description: 'Password' })
  declare password: string

  @args.string({ description: 'Full name', required: false })
  declare fullName: string

  async run() {
    const now = DateTime.now().toSQL()
    const hashedPassword = await hash.make(this.password)
    const name = this.fullName || this.email.split('@')[0]

    // Upsert: delete existing then insert
    await db.from('users').where('email', this.email).delete()

    await db.table('users').insert({
      email: this.email,
      full_name: name,
      password: hashedPassword,
      role: 'superadmin',
      email_verified: true,
      onboarding_completed: true,
      created_at: now,
      updated_at: now,
    })

    this.logger.success(`Superadmin created: ${this.email}`)
  }
}
