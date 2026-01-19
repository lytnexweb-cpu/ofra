import { BaseSeeder } from '@adonisjs/lucid/seeders'
import db from '@adonisjs/lucid/services/db'
import hash from '@adonisjs/core/services/hash'
import { DateTime } from 'luxon'

export default class extends BaseSeeder {
  async run() {
    // Delete existing user first
    await db.from('users').where('email', 'demo@ofra.local').delete()

    // Hash password manually
    const hashedPassword = await hash.make('password123')

    // Insert directly with query builder to bypass model hooks
    await db.table('users').insert({
      email: 'demo@ofra.local',
      full_name: 'Demo User',
      password: hashedPassword,
      created_at: DateTime.now().toSQL(),
      updated_at: DateTime.now().toSQL(),
    })

    console.log('User created with manually hashed password (bypassing hooks)')
  }
}
