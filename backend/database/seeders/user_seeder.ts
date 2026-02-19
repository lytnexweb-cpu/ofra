import { BaseSeeder } from '@adonisjs/lucid/seeders'
import db from '@adonisjs/lucid/services/db'
import hash from '@adonisjs/core/services/hash'
import { DateTime } from 'luxon'

export default class extends BaseSeeder {
  async run() {
    const now = DateTime.now().toSQL()

    // --- Superadmin ---
    await db.from('users').where('email', 'admin@ofra.ca').delete()
    const adminPassword = await hash.make('Admin2026!')

    await db.table('users').insert({
      email: 'admin@ofra.ca',
      full_name: 'Sam Admin',
      password: adminPassword,
      role: 'superadmin',
      email_verified: true,
      created_at: now,
      updated_at: now,
    })

    console.log('Superadmin created: admin@ofra.ca / Admin2026!')

    // --- Demo user ---
    await db.from('users').where('email', 'demo@ofra.local').delete()
    const demoPassword = await hash.make('password123')

    await db.table('users').insert({
      email: 'demo@ofra.local',
      full_name: 'Demo User',
      password: demoPassword,
      created_at: now,
      updated_at: now,
    })

    console.log('Demo user created: demo@ofra.local / password123')
  }
}
